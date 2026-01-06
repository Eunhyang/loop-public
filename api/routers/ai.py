"""
AI Inference API Router

LLM 기반 추론 엔드포인트
- /api/ai/infer/project_impact: Project Impact autofill (A Score)
- /api/ai/infer/evidence: Evidence 추론 (B Score - Realized Impact)
- /api/ai/infer/task_schema: Task 스키마 필드 채움 (n8n Phase 1)
- /api/ai/infer/project_schema: Project 스키마 필드 채움 (n8n Phase 2)

LOOP_PHILOSOPHY 8.2:
- 모든 추론은 audit 로그에 기록
- pending → approve/reject 흐름 유지
- run_id로 디버깅/재현 가능

n8n 워크플로우와 통합:
- n8n에서 OpenAI 노드 대신 이 엔드포인트 호출
- 일관된 프롬프트/응답 형식 보장
- v5: Phase 1/2도 AI Router로 통합

v5.3 Schema:
- contributes → condition_contributes (Project)
- Evidence 품질 메타 7개 필드 지원
"""

import json
import re
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..cache import get_cache
from ..utils.vault_utils import get_vault_dir
from ..utils.run_logger import generate_run_id
from ..utils.impact_calculator import (
    calculate_expected_score,
    calculate_realized_score,
    calculate_window_fields,
    validate_contributes_weights
)
from ..services.llm_service import get_llm_service
from ..services.decision_logger import log_pending_created
from ..prompts.expected_impact import (
    EXPECTED_IMPACT_SYSTEM_PROMPT,
    build_expected_impact_prompt,
    build_simple_expected_impact_prompt
)
from ..prompts.evidence import (
    EVIDENCE_SYSTEM_PROMPT,
    build_evidence_prompt,
    build_simple_evidence_prompt
)
from ..prompts.task_schema import (
    TASK_SCHEMA_SYSTEM_PROMPT,
    build_task_schema_prompt,
    build_simple_task_schema_prompt
)
from ..prompts.project_schema import (
    PROJECT_SCHEMA_SYSTEM_PROMPT,
    build_project_schema_prompt,
    build_simple_project_schema_prompt
)
from ..prompts.hypothesis_schema import (
    HYPOTHESIS_SCHEMA_SYSTEM_PROMPT,
    build_hypothesis_schema_prompt,
    build_simple_hypothesis_schema_prompt
)
from ..prompts.hypothesis_seeder import (
    HYPOTHESIS_SEEDER_SYSTEM_PROMPT,
    build_hypothesis_seeder_prompt,
    build_simple_hypothesis_seeder_prompt
)
from ..utils.hypothesis_generator import (
    generate_hypothesis_id,
    validate_hypothesis_quality,
    assess_evidence_readiness,
    build_hypothesis_draft
)
from .pending import (
    load_pending,
    save_pending,
    generate_review_id
)

router = APIRouter(prefix="/api/ai", tags=["ai"])

# Vault 및 Audit 경로
VAULT_DIR = get_vault_dir()
AI_AUDIT_DIR = VAULT_DIR / "_build" / "ai_audit"


# ============================================
# Pydantic Models
# ============================================

class InferProjectImpactRequest(BaseModel):
    """Project Impact 추론 요청"""
    project_id: str = Field(..., description="Project ID (예: prj-001)")
    mode: str = Field(default="preview", description="preview | pending | execute")
    template_id: Optional[str] = Field(default=None, description="프롬프트 템플릿 ID")
    schema_version: str = Field(default="5.3", description="스키마 버전")
    create_pending: bool = Field(default=True, description="mode=pending 시 pending 생성 여부")
    actor: str = Field(default="n8n", description="요청자 (n8n, api, claude)")
    run_id: Optional[str] = Field(default=None, description="외부에서 제공하는 run_id")
    provider: str = Field(default="openai", description="LLM provider (openai, anthropic)")
    source_workflow: Optional[str] = Field(default=None, description="tsk-n8n-18: n8n 워크플로우 이름")


class InferProjectImpactResponse(BaseModel):
    """Project Impact 추론 응답"""
    ok: bool
    run_id: str
    entity_id: Optional[str] = Field(default=None, description="프로젝트 ID")
    entity_name: Optional[str] = Field(default=None, description="프로젝트 이름")
    patch: Dict[str, Any] = Field(default_factory=dict, description="LLM 제안 필드")
    derived_autofill: Dict[str, Any] = Field(default_factory=dict, description="서버 계산 필드")
    scores: Dict[str, float] = Field(default_factory=dict, description="계산된 점수")
    validation: Dict[str, Any] = Field(default_factory=dict, description="검증 결과")
    pending: Optional[Dict[str, Any]] = Field(default=None, description="생성된 pending review")
    audit_ref: str = Field(default="", description="audit 참조 ID")
    error: Optional[str] = Field(default=None, description="에러 메시지")


class InferEvidenceRequest(BaseModel):
    """Evidence 추론 요청 (B Score - Realized Impact)"""
    project_id: str = Field(..., description="Project ID (예: prj-001)")
    mode: str = Field(default="preview", description="preview | pending | execute")
    provider: str = Field(default="openai", description="LLM provider (openai, anthropic)")
    retrospective_content: Optional[str] = Field(default=None, description="회고 문서 내용")
    actual_result: Optional[str] = Field(default=None, description="실제 결과 요약")
    actor: str = Field(default="n8n", description="요청자 (n8n, api, claude)")
    run_id: Optional[str] = Field(default=None, description="외부에서 제공하는 run_id")
    schema_version: str = Field(default="5.3", description="스키마 버전")
    create_pending: bool = Field(default=True, description="mode=pending 시 pending 생성 여부")
    source_workflow: Optional[str] = Field(default=None, description="tsk-n8n-18: n8n 워크플로우 이름")


class InferEvidenceResponse(BaseModel):
    """Evidence 추론 응답"""
    ok: bool
    run_id: str
    entity_id: Optional[str] = Field(default=None, description="프로젝트 ID")
    entity_name: Optional[str] = Field(default=None, description="프로젝트 이름")
    patch: Dict[str, Any] = Field(default_factory=dict, description="LLM 제안 필드 (normalized_delta, evidence_strength 등)")
    quality_meta: Dict[str, Any] = Field(default_factory=dict, description="v5.3 품질 메타 필드")
    derived_autofill: Dict[str, Any] = Field(default_factory=dict, description="서버 계산 필드 (window_id, time_range)")
    scores: Dict[str, float] = Field(default_factory=dict, description="계산된 점수 (realized_score)")
    validation: Dict[str, Any] = Field(default_factory=dict, description="검증 결과")
    pending: Optional[Dict[str, Any]] = Field(default=None, description="생성된 pending review")
    audit_ref: str = Field(default="", description="audit 참조 ID")
    error: Optional[str] = Field(default=None, description="에러 메시지")
    # tsk-n8n-12: Server Skip 지원
    skipped: bool = Field(default=False, description="Evidence 존재로 인해 skip됨")
    skip_reason: Optional[str] = Field(default=None, description="skip 사유")
    existing_evidence_refs: List[str] = Field(default_factory=list, description="기존 Evidence ID 목록")


# ============================================
# Task/Project Schema Models (n8n Phase 1/2)
# ============================================

class InferTaskSchemaRequest(BaseModel):
    """Task 스키마 추론 요청 (n8n Phase 1)"""
    task_id: str = Field(..., description="Task ID (예: tsk-001-01)")
    issues: List[str] = Field(default_factory=list, description="감지된 이슈 목록")
    mode: str = Field(default="pending", description="preview | pending")
    provider: str = Field(default="openai", description="LLM provider")
    actor: str = Field(default="n8n", description="요청자")
    run_id: Optional[str] = Field(default=None, description="외부 제공 run_id")
    schema_version: str = Field(default="5.3", description="스키마 버전")
    create_pending: bool = Field(default=True, description="pending 생성 여부")
    source_workflow: Optional[str] = Field(default=None, description="tsk-n8n-18: n8n 워크플로우 이름")
    # n8n에서 전달하는 원본 데이터
    original_entity: Optional[Dict[str, Any]] = Field(default=None, description="n8n에서 전달한 원본 Task")
    strategy_context: Optional[Dict[str, Any]] = Field(default=None, description="전략 컨텍스트")


class InferTaskSchemaResponse(BaseModel):
    """Task 스키마 추론 응답"""
    ok: bool
    run_id: str
    suggested_fields: Dict[str, Any] = Field(default_factory=dict, description="LLM 제안 필드")
    reasoning: Dict[str, str] = Field(default_factory=dict, description="제안 근거")
    validation: Dict[str, Any] = Field(default_factory=dict, description="검증 결과")
    pending: Optional[Dict[str, Any]] = Field(default=None, description="생성된 pending review")
    audit_ref: str = Field(default="", description="audit 참조 ID")
    error: Optional[str] = Field(default=None, description="에러 메시지")


class InferProjectSchemaRequest(BaseModel):
    """Project 스키마 추론 요청 (n8n Phase 2)"""
    project_id: str = Field(..., description="Project ID (예: prj-001)")
    issues: List[str] = Field(default_factory=list, description="감지된 이슈 목록")
    mode: str = Field(default="pending", description="preview | pending")
    provider: str = Field(default="openai", description="LLM provider")
    actor: str = Field(default="n8n", description="요청자")
    run_id: Optional[str] = Field(default=None, description="외부 제공 run_id")
    schema_version: str = Field(default="5.3", description="스키마 버전")
    create_pending: bool = Field(default=True, description="pending 생성 여부")
    source_workflow: Optional[str] = Field(default=None, description="tsk-n8n-18: n8n 워크플로우 이름")
    # n8n에서 전달하는 원본 데이터
    original_entity: Optional[Dict[str, Any]] = Field(default=None, description="n8n에서 전달한 원본 Project")
    strategy_context: Optional[Dict[str, Any]] = Field(default=None, description="전략 컨텍스트")


class InferProjectSchemaResponse(BaseModel):
    """Project 스키마 추론 응답"""
    ok: bool
    run_id: str
    suggested_fields: Dict[str, Any] = Field(default_factory=dict, description="LLM 제안 필드")
    reasoning: Dict[str, str] = Field(default_factory=dict, description="제안 근거")
    validation: Dict[str, Any] = Field(default_factory=dict, description="검증 결과")
    pending: Optional[Dict[str, Any]] = Field(default=None, description="생성된 pending review")
    audit_ref: str = Field(default="", description="audit 참조 ID")
    error: Optional[str] = Field(default=None, description="에러 메시지")


# ============================================
# Hypothesis Seeder Models (tsk-n8n-11)
# ============================================

class InferHypothesisDraftRequest(BaseModel):
    """Hypothesis Draft 생성 요청 (n8n Workflow D)"""
    project_id: str = Field(..., description="Project ID (예: prj-001)")
    mode: str = Field(default="pending", description="preview | pending")
    provider: str = Field(default="openai", description="LLM provider (openai, anthropic)")
    actor: str = Field(default="n8n", description="요청자 (n8n, api, claude)")
    run_id: Optional[str] = Field(default=None, description="외부 제공 run_id")
    schema_version: str = Field(default="5.3", description="스키마 버전")
    create_pending: bool = Field(default=True, description="pending 생성 여부")
    source_workflow: Optional[str] = Field(default=None, description="tsk-n8n-18: n8n 워크플로우 이름")


class InferHypothesisDraftResponse(BaseModel):
    """Hypothesis Draft 생성 응답"""
    ok: bool
    run_id: str
    project_id: Optional[str] = Field(default=None, description="Project ID")
    project_name: Optional[str] = Field(default=None, description="Project 이름")
    hypothesis_draft: Dict[str, Any] = Field(default_factory=dict, description="Hypothesis draft (frontmatter + body 초안)")
    quality_score: float = Field(default=0.0, description="품질 점수 (0.0 ~ 1.0)")
    quality_issues: List[str] = Field(default_factory=list, description="품질 이슈 목록")
    evidence_readiness: Dict[str, Any] = Field(default_factory=dict, description="Evidence 운영 가능성")
    project_link: Dict[str, Any] = Field(default_factory=dict, description="validates 업데이트 제안")
    pending: Optional[Dict[str, Any]] = Field(default=None, description="생성된 pending review")
    audit_ref: str = Field(default="", description="audit 참조 ID")
    error: Optional[str] = Field(default=None, description="에러 메시지")
    # 추가 정보
    skipped: bool = Field(default=False, description="처리가 스킵됨")
    skip_reason: Optional[str] = Field(default=None, description="스킵 사유")


# ============================================
# Helper Functions
# ============================================

def get_project_by_id(project_id: str) -> Optional[Dict[str, Any]]:
    """프로젝트 조회 (캐시 우선)"""
    cache = get_cache()
    # VaultCache는 get_all_projects() 사용
    return cache.get_project(project_id)


def get_track_by_id(track_id: str) -> Optional[Dict[str, Any]]:
    """Track 조회"""
    cache = get_cache()
    # VaultCache는 get_track() 사용
    return cache.get_track(track_id)


def get_task_by_id(task_id: str) -> Optional[Dict[str, Any]]:
    """Task 조회 (캐시 우선)"""
    cache = get_cache()
    return cache.get_task(task_id)


def validate_run_id(run_id: str) -> bool:
    """
    run_id 유효성 검증 (path traversal 방지)

    Valid format: run-YYYYMMDD-HHMMSS-xxxxxx
    """
    pattern = r'^run-\d{8}-\d{6}-[a-z0-9]{6}$'
    return bool(re.match(pattern, run_id))


def save_ai_audit_log(run_id: str, data: Dict[str, Any]) -> str:
    """
    AI 추론 audit 로그 저장

    경로: _build/ai_audit/YYYY-MM-DD/{run_id}.json
    Codex 피드백 반영: vault 추상화 사용, 절대 경로 대신 ID 반환

    Returns:
        audit_ref: run_id (HTTP로 조회 가능한 ID)

    Raises:
        ValueError: 유효하지 않은 run_id (path traversal 방지)
    """
    # Path traversal 방지 (Codex 보안 피드백)
    if not validate_run_id(run_id):
        raise ValueError(f"Invalid run_id format: {run_id}")

    date_str = datetime.now().strftime("%Y-%m-%d")
    audit_dir = AI_AUDIT_DIR / date_str
    audit_dir.mkdir(parents=True, exist_ok=True)

    audit_file = audit_dir / f"{run_id}.json"

    audit_data = {
        "run_id": run_id,
        "timestamp": datetime.now().isoformat(),
        **data
    }

    with open(audit_file, "w", encoding="utf-8") as f:
        json.dump(audit_data, f, ensure_ascii=False, indent=2)

    # 절대 경로 대신 run_id 반환 (Codex 피드백)
    return run_id


def create_pending_review(
    entity_id: str,
    entity_type: str,
    entity_name: str,
    suggested_fields: Dict[str, Any],
    reasoning: Dict[str, str],
    run_id: str,
    actor: str,
    source_workflow: Optional[str] = None  # tsk-n8n-18: n8n 워크플로우 이름
) -> Dict[str, Any]:
    """
    pending_reviews.json에 저장 (기존 pending.py 헬퍼 재사용)
    + decision_log에 pending_created 기록

    Returns:
        생성된 review 정보
    """
    data = load_pending()
    reviews = data.get("reviews", [])

    # 중복 체크 (같은 entity_id + pending 상태)
    existing_idx = None
    for idx, r in enumerate(reviews):
        if r.get("entity_id") == entity_id and r.get("status") == "pending":
            existing_idx = idx
            break

    review_id = generate_review_id()
    new_review = {
        "id": review_id,
        "entity_id": entity_id,
        "entity_type": entity_type,
        "entity_name": entity_name,
        "suggested_fields": suggested_fields,
        "reasoning": reasoning,
        "created_at": datetime.now().isoformat(),
        "status": "pending",
        "source": "ai_infer",
        "run_id": run_id,
        "actor": actor,
        "source_workflow": source_workflow  # tsk-n8n-18
    }

    if existing_idx is not None:
        # 기존 항목 업데이트 (ID 유지)
        new_review["id"] = reviews[existing_idx]["id"]
        new_review["updated_at"] = datetime.now().isoformat()
        reviews[existing_idx] = new_review
    else:
        reviews.append(new_review)

    data["reviews"] = reviews
    save_pending(data)

    # decision_log에 pending_created 기록
    log_pending_created(
        entity_id=entity_id,
        entity_type=entity_type,
        review_id=new_review["id"],
        actor=actor,
        run_id=run_id,
        metadata={"source": "ai_infer", "schema_version": "5.3"}
    )

    return new_review


# ============================================
# Internal Validation Functions (for auto_validate)
# ============================================

async def _validate_task_schema_internal(
    task_id: str,
    frontmatter: Dict[str, Any],
    provider: str = "openai"
) -> Dict[str, Any]:
    """
    Task 스키마 내부 검증 (HTTP 오버헤드 없음)

    생성된 Task의 필드를 검사하고 누락된 경우 LLM으로 채움.
    create_task()에서 auto_validate=True일 때 호출됨.

    Returns:
        {
            "validated": True,
            "issues_found": 2,
            "pending_created": True,
            "pending_id": "rev-xxx",
            "run_id": "run-xxx"
        }
    """
    run_id = generate_run_id()

    # 1. 필수 필드 누락 검사
    issues = []
    if not frontmatter.get("conditions_3y"):
        issues.append("missing_conditions_3y")
    if not frontmatter.get("due"):
        issues.append("missing_due")
    if not frontmatter.get("assignee"):
        issues.append("missing_assignee")

    # 누락된 필드 없으면 검증 완료
    if not issues:
        return {
            "validated": True,
            "issues_found": 0,
            "pending_created": False,
            "pending_id": None,
            "run_id": run_id
        }

    # 2. LLM 호출
    prompt = build_simple_task_schema_prompt(
        task_name=frontmatter.get("entity_name", ""),
        project_id=frontmatter.get("project_id", ""),
        issues=issues
    )

    llm = get_llm_service()
    result = await llm.call_llm(
        prompt=prompt,
        system_prompt=TASK_SCHEMA_SYSTEM_PROMPT,
        provider=provider,
        response_format="json",
        entity_context={
            "entity_id": task_id,
            "entity_type": "Task",
            "action": "auto_validate_task"
        }
    )

    if not result["success"]:
        save_ai_audit_log(run_id, {
            "task_id": task_id,
            "mode": "auto_validate",
            "actor": "api",
            "endpoint": "_validate_task_schema_internal",
            "success": False,
            "error": result.get("error"),
            "provider": result.get("provider"),
            "model": result.get("model")
        })
        return {
            "validated": True,
            "issues_found": len(issues),
            "pending_created": False,
            "pending_id": None,
            "run_id": run_id,
            "error": result.get("error")
        }

    content = result["content"]
    suggested_fields = content.get("suggested_fields", {})
    reasoning = content.get("reasoning", {})

    # validates 필드 제거 (금지 규칙)
    if "validates" in suggested_fields:
        del suggested_fields["validates"]

    # 3. Pending review 생성
    if suggested_fields:
        pending_review = create_pending_review(
            entity_id=task_id,
            entity_type="Task",
            entity_name=frontmatter.get("entity_name", ""),
            suggested_fields=suggested_fields,
            reasoning=reasoning,
            run_id=run_id,
            actor="api"
        )
        pending_id = pending_review["id"]
        pending_created = True
    else:
        pending_id = None
        pending_created = False

    # 4. Audit 로그
    save_ai_audit_log(run_id, {
        "task_id": task_id,
        "task_name": frontmatter.get("entity_name"),
        "mode": "auto_validate",
        "actor": "api",
        "endpoint": "_validate_task_schema_internal",
        "success": True,
        "provider": result.get("provider"),
        "model": result.get("model"),
        "issues": issues,
        "suggested_fields": suggested_fields,
        "pending": {"review_id": pending_id} if pending_id else None
    })

    return {
        "validated": True,
        "issues_found": len(issues),
        "pending_created": pending_created,
        "pending_id": pending_id,
        "run_id": run_id
    }


async def _validate_project_schema_internal(
    project_id: str,
    frontmatter: Dict[str, Any],
    provider: str = "openai"
) -> Dict[str, Any]:
    """
    Project 스키마 내부 검증 (HTTP 오버헤드 없음)

    생성된 Project의 필드를 검사하고 누락된 경우 LLM으로 채움.
    create_project()에서 auto_validate=True일 때 호출됨.

    Returns:
        {
            "validated": True,
            "issues_found": 2,
            "pending_created": True,
            "pending_id": "rev-xxx",
            "run_id": "run-xxx"
        }
    """
    run_id = generate_run_id()

    # 1. 필수 필드 누락 검사
    issues = []
    if not frontmatter.get("conditions_3y"):
        issues.append("missing_conditions_3y")
    if not frontmatter.get("owner"):
        issues.append("missing_owner")
    if not frontmatter.get("parent_id"):
        issues.append("missing_parent_id")
    if not frontmatter.get("validates"):
        issues.append("missing_validates")

    # 누락된 필드 없으면 검증 완료
    if not issues:
        return {
            "validated": True,
            "issues_found": 0,
            "pending_created": False,
            "pending_id": None,
            "run_id": run_id
        }

    # 2. LLM 호출
    prompt = build_simple_project_schema_prompt(
        project_name=frontmatter.get("entity_name", ""),
        issues=issues
    )

    llm = get_llm_service()
    result = await llm.call_llm(
        prompt=prompt,
        system_prompt=PROJECT_SCHEMA_SYSTEM_PROMPT,
        provider=provider,
        response_format="json",
        entity_context={
            "entity_id": project_id,
            "entity_type": "Project",
            "action": "auto_validate_project"
        }
    )

    if not result["success"]:
        save_ai_audit_log(run_id, {
            "project_id": project_id,
            "mode": "auto_validate",
            "actor": "api",
            "endpoint": "_validate_project_schema_internal",
            "success": False,
            "error": result.get("error"),
            "provider": result.get("provider"),
            "model": result.get("model")
        })
        return {
            "validated": True,
            "issues_found": len(issues),
            "pending_created": False,
            "pending_id": None,
            "run_id": run_id,
            "error": result.get("error")
        }

    content = result["content"]
    suggested_fields = content.get("suggested_fields", {})
    reasoning = content.get("reasoning", {})

    # derived 필드 제거 (금지 규칙)
    derived_forbidden = ["validated_by", "realized_sum"]
    for field in derived_forbidden:
        if field in suggested_fields:
            del suggested_fields[field]

    # Impact 필드 제거 (별도 엔드포인트 사용)
    impact_fields = ["expected_impact", "realized_impact"]
    for field in impact_fields:
        if field in suggested_fields:
            del suggested_fields[field]

    # 3. Pending review 생성
    if suggested_fields:
        pending_review = create_pending_review(
            entity_id=project_id,
            entity_type="Project",
            entity_name=frontmatter.get("entity_name", ""),
            suggested_fields=suggested_fields,
            reasoning=reasoning,
            run_id=run_id,
            actor="api"
        )
        pending_id = pending_review["id"]
        pending_created = True
    else:
        pending_id = None
        pending_created = False

    # 4. Audit 로그
    save_ai_audit_log(run_id, {
        "project_id": project_id,
        "project_name": frontmatter.get("entity_name"),
        "mode": "auto_validate",
        "actor": "api",
        "endpoint": "_validate_project_schema_internal",
        "success": True,
        "provider": result.get("provider"),
        "model": result.get("model"),
        "issues": issues,
        "suggested_fields": suggested_fields,
        "pending": {"review_id": pending_id} if pending_id else None
    })

    return {
        "validated": True,
        "issues_found": len(issues),
        "pending_created": pending_created,
        "pending_id": pending_id,
        "run_id": run_id
    }


# ============================================
# API Endpoints
# ============================================

@router.post("/infer/project_impact", response_model=InferProjectImpactResponse)
async def infer_project_impact(request: InferProjectImpactRequest):
    """
    Project Impact 추론 (LLM 기반)

    n8n 워크플로우 통합용 엔드포인트.
    OpenAI/Anthropic 노드를 직접 호출하는 대신 이 API를 사용하면:
    - 일관된 프롬프트 템플릿
    - 자동 pending review 생성
    - audit 로그 기록
    - 점수 자동 계산

    Modes:
    - preview: LLM 제안만 반환 (저장 안 함)
    - pending: pending_reviews.json에 저장 (Dashboard 승인 대기)
    - execute: 엔티티에 바로 적용 (TODO: 구현 예정)
    """
    # 1. run_id 생성 또는 검증 (외부 제공 시 path traversal 방지)
    if request.run_id:
        if not validate_run_id(request.run_id):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid run_id format: {request.run_id}. Expected: run-YYYYMMDD-HHMMSS-xxxxxx"
            )
        run_id = request.run_id
    else:
        run_id = generate_run_id()

    # 2. 프로젝트 조회
    project = get_project_by_id(request.project_id)
    if not project:
        return InferProjectImpactResponse(
            ok=False,
            run_id=run_id,
            entity_id=request.project_id,
            error=f"Project not found: {request.project_id}",
            audit_ref=run_id
        )

    # 3. 상위 Track 조회 (컨텍스트용)
    parent_id = project.get("parent_id")
    track = get_track_by_id(parent_id) if parent_id else None

    # 4. 프롬프트 생성
    if track:
        prompt = build_expected_impact_prompt(
            project=project,
            track=track
        )
    else:
        prompt = build_simple_expected_impact_prompt(
            project_name=project.get("entity_name", ""),
            project_description=project.get("description", project.get("goal", "")),
            conditions_3y=project.get("conditions_3y", [])
        )

    # 5. LLM 호출
    llm = get_llm_service()
    result = await llm.call_llm(
        prompt=prompt,
        system_prompt=EXPECTED_IMPACT_SYSTEM_PROMPT,
        provider=request.provider,
        response_format="json",
        entity_context={
            "entity_id": request.project_id,
            "entity_type": "Project",
            "action": "infer_impact"
        }
    )

    if not result["success"]:
        # 실패해도 audit 로그 저장
        save_ai_audit_log(run_id, {
            "project_id": request.project_id,
            "mode": request.mode,
            "actor": request.actor,
            "success": False,
            "error": result.get("error"),
            "provider": result.get("provider"),
            "model": result.get("model")
        })

        return InferProjectImpactResponse(
            ok=False,
            run_id=run_id,
            entity_id=request.project_id,
            entity_name=project.get("entity_name"),
            error=result.get("error", "LLM call failed"),
            audit_ref=run_id
        )

    content = result["content"]

    # 6. LLM 응답 파싱 (patch 필드)
    patch = {}
    reasoning = {}
    warnings = []

    # tier
    if "tier" in content:
        tier_data = content["tier"]
        if isinstance(tier_data, dict):
            patch["tier"] = tier_data.get("value", "operational")
            reasoning["tier"] = tier_data.get("reasoning", "")
        else:
            patch["tier"] = tier_data

    # impact_magnitude
    if "impact_magnitude" in content:
        mag_data = content["impact_magnitude"]
        if isinstance(mag_data, dict):
            patch["impact_magnitude"] = mag_data.get("value", "mid")
            reasoning["impact_magnitude"] = mag_data.get("reasoning", "")
        else:
            patch["impact_magnitude"] = mag_data

    # confidence
    if "confidence" in content:
        conf_data = content["confidence"]
        if isinstance(conf_data, dict):
            patch["confidence"] = conf_data.get("value", 0.7)
            reasoning["confidence"] = conf_data.get("reasoning", "")
        else:
            patch["confidence"] = conf_data

    # condition_contributes (v5.3: contributes -> condition_contributes)
    # LLM 응답에서 contributes 또는 condition_contributes 모두 허용
    contributes_key = "condition_contributes" if "condition_contributes" in content else "contributes"
    if contributes_key in content:
        contributes = content[contributes_key]
        if isinstance(contributes, list):
            is_valid, normalized, contrib_warnings = validate_contributes_weights(contributes)
            patch["condition_contributes"] = normalized  # v5.3: condition_contributes로 저장
            warnings.extend(contrib_warnings)

    # track_contributes (v5.3 신규)
    if "track_contributes" in content:
        track_contrib = content["track_contributes"]
        if isinstance(track_contrib, list):
            patch["track_contributes"] = track_contrib

    # validates (v5.3 신규)
    if "validates" in content:
        validates = content["validates"]
        if isinstance(validates, list):
            patch["validates"] = validates

    # primary_hypothesis_id (v5.3 신규)
    if "primary_hypothesis_id" in content:
        patch["primary_hypothesis_id"] = content["primary_hypothesis_id"]

    # summary
    if "summary" in content:
        reasoning["summary"] = content["summary"]

    # 7. 서버 계산값 (derived_autofill)
    derived_autofill = {}
    scores = {}

    tier = patch.get("tier", "operational")
    magnitude = patch.get("impact_magnitude", "mid")
    confidence = patch.get("confidence", 0.7)

    # window_id, time_range 자동 계산
    window_fields = calculate_window_fields(entity_type="project")
    derived_autofill["window_id"] = window_fields["window_id"]
    derived_autofill["time_range"] = window_fields["time_range"]

    # expected_score 계산
    try:
        expected_score = calculate_expected_score(tier, magnitude, confidence)
        scores["expected_score"] = round(expected_score, 2)
    except ValueError as e:
        warnings.append(str(e))

    # 8. Validation 결과
    validation = {
        "is_valid": len(warnings) == 0,
        "warnings": warnings,
        "schema_version": request.schema_version
    }

    # 9. Mode별 처리
    pending_info = None

    if request.mode == "pending" and request.create_pending:
        # pending review 생성 (v5.3 정합: condition_contributes)
        expected_impact_obj = {
            "tier": patch.get("tier"),
            "impact_magnitude": patch.get("impact_magnitude"),
            "confidence": patch.get("confidence"),
            "condition_contributes": patch.get("condition_contributes", [])
        }

        # v5.3 신규 필드 추가
        suggested_fields = {"expected_impact": expected_impact_obj}
        if "track_contributes" in patch:
            suggested_fields["track_contributes"] = patch["track_contributes"]
        if "validates" in patch:
            suggested_fields["validates"] = patch["validates"]
        if "primary_hypothesis_id" in patch:
            suggested_fields["primary_hypothesis_id"] = patch["primary_hypothesis_id"]

        pending_review = create_pending_review(
            entity_id=request.project_id,
            entity_type="Project",
            entity_name=project.get("entity_name", ""),
            suggested_fields=suggested_fields,
            reasoning=reasoning,
            run_id=run_id,
            actor=request.actor,
            source_workflow=request.source_workflow  # tsk-n8n-18
        )

        pending_info = {
            "review_id": pending_review["id"],
            "status": pending_review["status"],
            "created_at": pending_review["created_at"]
        }

    elif request.mode == "execute":
        # execute 모드는 아직 구현되지 않음 - 에러 반환 (Codex 피드백)
        return InferProjectImpactResponse(
            ok=False,
            run_id=run_id,
            entity_id=request.project_id,
            entity_name=project.get("entity_name"),
            patch=patch,
            derived_autofill=derived_autofill,
            scores=scores,
            validation=validation,
            error="execute mode is not yet implemented. Use mode=pending instead.",
            audit_ref=run_id
        )

    # 10. Audit 로그 저장
    audit_ref = save_ai_audit_log(run_id, {
        "project_id": request.project_id,
        "project_name": project.get("entity_name"),
        "mode": request.mode,
        "actor": request.actor,
        "success": True,
        "provider": result.get("provider"),
        "model": result.get("model"),
        "patch": patch,
        "derived_autofill": derived_autofill,
        "scores": scores,
        "validation": validation,
        "pending": pending_info,
        "llm_run_id": result.get("run_id")
    })

    return InferProjectImpactResponse(
        ok=True,
        run_id=run_id,
        entity_id=request.project_id,
        entity_name=project.get("entity_name"),
        patch=patch,
        derived_autofill=derived_autofill,
        scores=scores,
        validation=validation,
        pending=pending_info,
        audit_ref=audit_ref
    )


@router.post("/infer/evidence", response_model=InferEvidenceResponse)
async def infer_evidence(request: InferEvidenceRequest):
    """
    Evidence 추론 (LLM 기반) - B Score / Realized Impact

    회고 문서에서 Evidence 필드를 추출하고 B Score를 계산합니다.
    v5.3 품질 메타 7개 필드를 자동 채움합니다.

    n8n 워크플로우 통합용 엔드포인트:
    - 일관된 프롬프트 템플릿
    - 자동 pending review 생성
    - audit 로그 + decision_log 기록
    - B Score 자동 계산

    Modes:
    - preview: LLM 제안만 반환 (저장 안 함)
    - pending: pending_reviews.json에 저장 (Dashboard 승인 대기)
    - execute: 엔티티에 바로 적용 (TODO: 구현 예정)

    v5.3 품질 메타 필드:
    - provenance: auto | human | mixed
    - source_refs: [string]
    - sample_size: number | null
    - measurement_quality: low | medium | high
    - counterfactual: none | before_after | controlled
    - confounders: [string]
    - query_version: string
    """
    # 1. run_id 생성 또는 검증
    if request.run_id:
        if not validate_run_id(request.run_id):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid run_id format: {request.run_id}. Expected: run-YYYYMMDD-HHMMSS-xxxxxx"
            )
        run_id = request.run_id
    else:
        run_id = generate_run_id()

    # 2. 프로젝트 조회
    project = get_project_by_id(request.project_id)
    if not project:
        return InferEvidenceResponse(
            ok=False,
            run_id=run_id,
            entity_id=request.project_id,
            error=f"Project not found: {request.project_id}",
            audit_ref=run_id
        )

    # 2.5 tsk-n8n-12: Server Skip - Evidence 존재 체크
    # Codex 피드백: fail-open 패턴 적용 (캐시 오류 시 LLM 호출 진행)
    cache = get_cache()

    # window_id 계산 (현재 월 기준)
    window_fields = calculate_window_fields(entity_type="project")
    current_window_id = window_fields.get("window_id")

    # Evidence 존재 여부 체크
    evidence_exists, existing_refs = cache.check_evidence_exists(
        project_id=request.project_id,
        window_id=current_window_id
    )

    if evidence_exists:
        # 동일 프로젝트/윈도우에 Evidence 이미 존재 → skip
        skip_reason = f"Evidence already exists for project={request.project_id}, window={current_window_id}"

        # Audit 로그 저장 (skip 기록)
        save_ai_audit_log(run_id, {
            "project_id": request.project_id,
            "mode": request.mode,
            "actor": request.actor,
            "endpoint": "infer_evidence",
            "success": True,
            "skipped": True,
            "skip_reason": skip_reason,
            "existing_evidence_refs": existing_refs,
            "window_id": current_window_id
        })

        return InferEvidenceResponse(
            ok=True,
            run_id=run_id,
            entity_id=request.project_id,
            entity_name=project.get("entity_name"),
            skipped=True,
            skip_reason=skip_reason,
            existing_evidence_refs=existing_refs,
            derived_autofill={"window_id": current_window_id},
            audit_ref=run_id
        )

    # 3. 프롬프트 생성
    if request.retrospective_content or request.actual_result:
        prompt = build_evidence_prompt(
            project=project,
            retrospective_content=request.retrospective_content,
            actual_result=request.actual_result
        )
    else:
        # 최소 정보로 간단 프롬프트
        prompt = build_simple_evidence_prompt(
            project_name=project.get("entity_name", ""),
            goal=project.get("goal", project.get("description", "")),
            actual_result=request.actual_result or "실제 결과 정보 없음"
        )

    # 4. LLM 호출
    llm = get_llm_service()
    result = await llm.call_llm(
        prompt=prompt,
        system_prompt=EVIDENCE_SYSTEM_PROMPT,
        provider=request.provider,
        response_format="json",
        entity_context={
            "entity_id": request.project_id,
            "entity_type": "Evidence",
            "action": "infer_evidence"
        }
    )

    if not result["success"]:
        # 실패해도 audit 로그 저장
        save_ai_audit_log(run_id, {
            "project_id": request.project_id,
            "mode": request.mode,
            "actor": request.actor,
            "endpoint": "infer_evidence",
            "success": False,
            "error": result.get("error"),
            "provider": result.get("provider"),
            "model": result.get("model")
        })

        return InferEvidenceResponse(
            ok=False,
            run_id=run_id,
            entity_id=request.project_id,
            entity_name=project.get("entity_name"),
            error=result.get("error", "LLM call failed"),
            audit_ref=run_id
        )

    content = result["content"]

    # 5. LLM 응답 파싱 (patch 필드)
    patch = {}
    quality_meta = {}
    reasoning = {}
    warnings = []

    # normalized_delta
    if "normalized_delta" in content:
        nd_data = content["normalized_delta"]
        if isinstance(nd_data, dict):
            patch["normalized_delta"] = nd_data.get("value")
            reasoning["normalized_delta"] = nd_data.get("reasoning", "")
        else:
            patch["normalized_delta"] = nd_data

    # evidence_strength
    if "evidence_strength" in content:
        es_data = content["evidence_strength"]
        if isinstance(es_data, dict):
            patch["evidence_strength"] = es_data.get("value", "medium")
            reasoning["evidence_strength"] = es_data.get("reasoning", "")
        else:
            patch["evidence_strength"] = es_data

    # attribution_share
    if "attribution_share" in content:
        as_data = content["attribution_share"]
        if isinstance(as_data, dict):
            patch["attribution_share"] = as_data.get("value", 1.0)
            reasoning["attribution_share"] = as_data.get("reasoning", "")
        else:
            patch["attribution_share"] = as_data

    # impact_metric
    if "impact_metric" in content:
        patch["impact_metric"] = content["impact_metric"]

    # learning_value
    if "learning_value" in content:
        lv_data = content["learning_value"]
        if isinstance(lv_data, dict):
            patch["learning_value"] = lv_data.get("value", "medium")
            reasoning["learning_value"] = lv_data.get("reasoning", "")
        else:
            patch["learning_value"] = lv_data

    # validated_hypotheses
    if "validated_hypotheses" in content:
        patch["validated_hypotheses"] = content["validated_hypotheses"]

    # falsified_hypotheses
    if "falsified_hypotheses" in content:
        patch["falsified_hypotheses"] = content["falsified_hypotheses"]

    # confirmed_insights
    if "confirmed_insights" in content:
        patch["confirmed_insights"] = content["confirmed_insights"]

    # realized_status
    if "realized_status" in content:
        rs_data = content["realized_status"]
        if isinstance(rs_data, dict):
            patch["realized_status"] = rs_data.get("value")
            reasoning["realized_status"] = rs_data.get("reasoning", "")
        else:
            patch["realized_status"] = rs_data

    # summary (Codex 피드백: patch에도 포함하여 응답에 반환)
    if "summary" in content:
        patch["summary"] = content["summary"]
        reasoning["summary"] = content["summary"]

    # 6. 품질 메타 필드 파싱 (v5.3)
    if "quality_meta" in content:
        qm = content["quality_meta"]

        # provenance
        if "provenance" in qm:
            prov_data = qm["provenance"]
            if isinstance(prov_data, dict):
                quality_meta["provenance"] = prov_data.get("value", "mixed")
                reasoning["provenance"] = prov_data.get("reasoning", "")
            else:
                quality_meta["provenance"] = prov_data

        # source_refs
        if "source_refs" in qm:
            quality_meta["source_refs"] = qm["source_refs"]

        # sample_size
        if "sample_size" in qm:
            quality_meta["sample_size"] = qm["sample_size"]

        # measurement_quality
        if "measurement_quality" in qm:
            mq_data = qm["measurement_quality"]
            if isinstance(mq_data, dict):
                quality_meta["measurement_quality"] = mq_data.get("value", "medium")
                reasoning["measurement_quality"] = mq_data.get("reasoning", "")
            else:
                quality_meta["measurement_quality"] = mq_data

        # counterfactual
        if "counterfactual" in qm:
            cf_data = qm["counterfactual"]
            if isinstance(cf_data, dict):
                quality_meta["counterfactual"] = cf_data.get("value", "none")
                reasoning["counterfactual"] = cf_data.get("reasoning", "")
            else:
                quality_meta["counterfactual"] = cf_data

        # confounders
        if "confounders" in qm:
            quality_meta["confounders"] = qm["confounders"]

        # query_version
        if "query_version" in qm:
            quality_meta["query_version"] = qm["query_version"]

    # 7. 서버 계산값 (derived_autofill)
    derived_autofill = {}
    scores = {}

    # window_id, time_range 자동 계산
    window_fields = calculate_window_fields(entity_type="project")
    derived_autofill["window_id"] = window_fields["window_id"]
    derived_autofill["time_range"] = window_fields["time_range"]

    # B Score (realized_score) 계산
    normalized_delta = patch.get("normalized_delta")
    evidence_strength = patch.get("evidence_strength", "medium")
    attribution_share = patch.get("attribution_share", 1.0)

    if normalized_delta is not None:
        try:
            realized_score = calculate_realized_score(
                normalized_delta=float(normalized_delta),
                evidence_strength=evidence_strength,
                attribution_share=float(attribution_share)
            )
            scores["realized_score"] = round(realized_score, 4)
        except (ValueError, TypeError) as e:
            warnings.append(f"B Score 계산 실패: {str(e)}")
    else:
        warnings.append("normalized_delta가 없어 B Score를 계산할 수 없습니다.")

    # 8. Validation 결과
    validation = {
        "is_valid": len(warnings) == 0,
        "warnings": warnings,
        "schema_version": request.schema_version
    }

    # 9. Mode별 처리 (Codex 피드백 반영)
    pending_info = None

    # mode 유효성 검증 (Codex: 잘못된 mode 무시 방지)
    valid_modes = ["preview", "pending", "execute"]
    if request.mode not in valid_modes:
        warnings.append(f"Unknown mode '{request.mode}', treated as 'preview'")

    if request.mode == "pending" and request.create_pending:
        # Evidence pending review 생성
        # Codex 피드백: quality_meta 구조 유지, derived_autofill 포함
        evidence_fields = {
            **patch,
            "quality_meta": quality_meta,  # 중첩 구조 유지
            **derived_autofill  # window_id, time_range 포함
        }

        # Codex 피드백: entity_id에 project_id 사용은 의도적
        # Evidence 엔티티는 approve 시 생성되며, pending review는 project를 참조
        pending_review = create_pending_review(
            entity_id=request.project_id,
            entity_type="Evidence",
            entity_name=f"Evidence for {project.get('entity_name', '')}",
            suggested_fields={"evidence": evidence_fields},
            reasoning=reasoning,
            run_id=run_id,
            actor=request.actor,
            source_workflow=request.source_workflow  # tsk-n8n-18
        )

        pending_info = {
            "review_id": pending_review["id"],
            "status": pending_review["status"],
            "created_at": pending_review["created_at"]
        }

    elif request.mode == "execute":
        # execute 모드는 아직 구현되지 않음
        return InferEvidenceResponse(
            ok=False,
            run_id=run_id,
            entity_id=request.project_id,
            entity_name=project.get("entity_name"),
            patch=patch,
            quality_meta=quality_meta,
            derived_autofill=derived_autofill,
            scores=scores,
            validation=validation,
            error="execute mode is not yet implemented. Use mode=pending instead.",
            audit_ref=run_id
        )

    # 10. Audit 로그 저장
    audit_ref = save_ai_audit_log(run_id, {
        "project_id": request.project_id,
        "project_name": project.get("entity_name"),
        "mode": request.mode,
        "actor": request.actor,
        "endpoint": "infer_evidence",
        "success": True,
        "provider": result.get("provider"),
        "model": result.get("model"),
        "patch": patch,
        "quality_meta": quality_meta,
        "derived_autofill": derived_autofill,
        "scores": scores,
        "validation": validation,
        "pending": pending_info,
        "llm_run_id": result.get("run_id")
    })

    return InferEvidenceResponse(
        ok=True,
        run_id=run_id,
        entity_id=request.project_id,
        entity_name=project.get("entity_name"),
        patch=patch,
        quality_meta=quality_meta,
        derived_autofill=derived_autofill,
        scores=scores,
        validation=validation,
        pending=pending_info,
        audit_ref=audit_ref
    )


@router.get("/audit/{run_id}")
def get_ai_audit_log(run_id: str):
    """
    AI 추론 audit 로그 조회

    run_id로 특정 추론 결과 조회
    """
    # Path traversal 방지 (Codex 보안 피드백)
    if not validate_run_id(run_id):
        raise HTTPException(status_code=400, detail=f"Invalid run_id format: {run_id}")

    # 모든 날짜 폴더 검색
    if not AI_AUDIT_DIR.exists():
        raise HTTPException(status_code=404, detail=f"Audit log not found: {run_id}")

    for date_dir in AI_AUDIT_DIR.iterdir():
        if date_dir.is_dir():
            audit_file = date_dir / f"{run_id}.json"
            if audit_file.exists():
                with open(audit_file, "r", encoding="utf-8") as f:
                    return json.load(f)

    raise HTTPException(status_code=404, detail=f"Audit log not found: {run_id}")


@router.get("/health")
def ai_health():
    """AI API 상태 체크"""
    llm = get_llm_service()
    providers = llm.get_available_providers()

    return {
        "status": "healthy" if providers else "degraded",
        "available_providers": providers,
        "endpoints": [
            "/api/ai/infer/project_impact",
            "/api/ai/infer/evidence",
            "/api/ai/infer/task_schema",
            "/api/ai/infer/project_schema",
            "/api/ai/audit/{run_id}",
            "/api/ai/health"
        ]
    }


# ============================================
# Task/Project Schema Endpoints (n8n Phase 1/2)
# ============================================

@router.post("/infer/task_schema", response_model=InferTaskSchemaResponse)
async def infer_task_schema(request: InferTaskSchemaRequest):
    """
    Task 스키마 필드 추론 (LLM 기반) - n8n Phase 1

    n8n 워크플로우에서 Call OpenAI (Tasks) 대신 이 API를 호출합니다.

    장점:
    - 일관된 프롬프트 템플릿
    - derived 필드 제안 금지 (validates 금지)
    - enum 값 강제 (schema_constants.yaml 기준)
    - 자동 pending review 생성
    - audit 로그 + decision_log 기록

    Modes:
    - preview: LLM 제안만 반환 (저장 안 함)
    - pending: pending_reviews.json에 저장 (Dashboard 승인 대기)
    """
    # 1. run_id 생성 또는 검증
    if request.run_id:
        if not validate_run_id(request.run_id):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid run_id format: {request.run_id}"
            )
        run_id = request.run_id
    else:
        run_id = generate_run_id()

    # 2. Task 조회 (n8n에서 전달한 원본 우선, 없으면 캐시에서)
    task = request.original_entity
    if not task:
        task = get_task_by_id(request.task_id)
        if not task:
            return InferTaskSchemaResponse(
                ok=False,
                run_id=run_id,
                error=f"Task not found: {request.task_id}",
                audit_ref=run_id
            )

    # 3. 프롬프트 생성
    if request.strategy_context:
        prompt = build_task_schema_prompt(
            task=task,
            issues=request.issues,
            strategy_context=request.strategy_context
        )
    else:
        prompt = build_simple_task_schema_prompt(
            task_name=task.get("entity_name", ""),
            project_id=task.get("project_id", ""),
            issues=request.issues
        )

    # 4. LLM 호출
    llm = get_llm_service()
    result = await llm.call_llm(
        prompt=prompt,
        system_prompt=TASK_SCHEMA_SYSTEM_PROMPT,
        provider=request.provider,
        response_format="json",
        entity_context={
            "entity_id": request.task_id,
            "entity_type": "Task",
            "action": "infer_task_schema"
        }
    )

    if not result["success"]:
        save_ai_audit_log(run_id, {
            "task_id": request.task_id,
            "mode": request.mode,
            "actor": request.actor,
            "endpoint": "infer_task_schema",
            "success": False,
            "error": result.get("error"),
            "provider": result.get("provider"),
            "model": result.get("model")
        })

        return InferTaskSchemaResponse(
            ok=False,
            run_id=run_id,
            error=result.get("error", "LLM call failed"),
            audit_ref=run_id
        )

    content = result["content"]

    # 5. LLM 응답 파싱
    suggested_fields = content.get("suggested_fields", {})
    reasoning = content.get("reasoning", {})
    warnings = []

    # validates 필드 제거 (금지 규칙)
    if "validates" in suggested_fields:
        del suggested_fields["validates"]
        warnings.append("validates 필드 제거됨 (Task는 전략 판단 금지)")

    # 6. Validation
    validation = {
        "is_valid": len(warnings) == 0,
        "warnings": warnings,
        "schema_version": request.schema_version
    }

    # 7. Mode별 처리
    pending_info = None

    if request.mode == "pending" and request.create_pending:
        pending_review = create_pending_review(
            entity_id=request.task_id,
            entity_type="Task",
            entity_name=task.get("entity_name", ""),
            suggested_fields=suggested_fields,
            reasoning=reasoning,
            run_id=run_id,
            actor=request.actor,
            source_workflow=request.source_workflow  # tsk-n8n-18
        )

        pending_info = {
            "review_id": pending_review["id"],
            "status": pending_review["status"],
            "created_at": pending_review["created_at"]
        }

    # 8. Audit 로그 저장
    audit_ref = save_ai_audit_log(run_id, {
        "task_id": request.task_id,
        "task_name": task.get("entity_name"),
        "mode": request.mode,
        "actor": request.actor,
        "endpoint": "infer_task_schema",
        "success": True,
        "provider": result.get("provider"),
        "model": result.get("model"),
        "issues": request.issues,
        "suggested_fields": suggested_fields,
        "reasoning": reasoning,
        "validation": validation,
        "pending": pending_info
    })

    return InferTaskSchemaResponse(
        ok=True,
        run_id=run_id,
        suggested_fields=suggested_fields,
        reasoning=reasoning,
        validation=validation,
        pending=pending_info,
        audit_ref=audit_ref
    )


@router.post("/infer/project_schema", response_model=InferProjectSchemaResponse)
async def infer_project_schema(request: InferProjectSchemaRequest):
    """
    Project 스키마 필드 추론 (LLM 기반) - n8n Phase 2

    n8n 워크플로우에서 Call OpenAI (Projects) 대신 이 API를 호출합니다.

    장점:
    - 일관된 프롬프트 템플릿
    - derived 필드 제안 금지 (validated_by, realized_sum)
    - enum 값 강제 (schema_constants.yaml 기준)
    - 자동 pending review 생성
    - audit 로그 + decision_log 기록

    NOTE: Impact 필드 (expected_impact, realized_impact)는 별도 엔드포인트:
    - /api/ai/infer/project_impact
    - /api/ai/infer/evidence

    Modes:
    - preview: LLM 제안만 반환 (저장 안 함)
    - pending: pending_reviews.json에 저장 (Dashboard 승인 대기)
    """
    # 1. run_id 생성 또는 검증
    if request.run_id:
        if not validate_run_id(request.run_id):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid run_id format: {request.run_id}"
            )
        run_id = request.run_id
    else:
        run_id = generate_run_id()

    # 2. Project 조회 (n8n에서 전달한 원본 우선, 없으면 캐시에서)
    project = request.original_entity
    if not project:
        project = get_project_by_id(request.project_id)
        if not project:
            return InferProjectSchemaResponse(
                ok=False,
                run_id=run_id,
                error=f"Project not found: {request.project_id}",
                audit_ref=run_id
            )

    # 3. 프롬프트 생성
    if request.strategy_context:
        prompt = build_project_schema_prompt(
            project=project,
            issues=request.issues,
            strategy_context=request.strategy_context
        )
    else:
        prompt = build_simple_project_schema_prompt(
            project_name=project.get("entity_name", ""),
            issues=request.issues
        )

    # 4. LLM 호출
    llm = get_llm_service()
    result = await llm.call_llm(
        prompt=prompt,
        system_prompt=PROJECT_SCHEMA_SYSTEM_PROMPT,
        provider=request.provider,
        response_format="json",
        entity_context={
            "entity_id": request.project_id,
            "entity_type": "Project",
            "action": "infer_project_schema"
        }
    )

    if not result["success"]:
        save_ai_audit_log(run_id, {
            "project_id": request.project_id,
            "mode": request.mode,
            "actor": request.actor,
            "endpoint": "infer_project_schema",
            "success": False,
            "error": result.get("error"),
            "provider": result.get("provider"),
            "model": result.get("model")
        })

        return InferProjectSchemaResponse(
            ok=False,
            run_id=run_id,
            error=result.get("error", "LLM call failed"),
            audit_ref=run_id
        )

    content = result["content"]

    # 5. LLM 응답 파싱
    suggested_fields = content.get("suggested_fields", {})
    reasoning = content.get("reasoning", {})
    warnings = []

    # derived 필드 제거 (금지 규칙)
    derived_forbidden = ["validated_by", "realized_sum"]
    for field in derived_forbidden:
        if field in suggested_fields:
            del suggested_fields[field]
            warnings.append(f"{field} 필드 제거됨 (derived 필드)")

    # Impact 필드 제거 (별도 엔드포인트 사용)
    impact_fields = ["expected_impact", "realized_impact"]
    for field in impact_fields:
        if field in suggested_fields:
            del suggested_fields[field]
            warnings.append(f"{field} 필드 제거됨 (별도 엔드포인트 사용)")

    # 6. Validation
    validation = {
        "is_valid": len(warnings) == 0,
        "warnings": warnings,
        "schema_version": request.schema_version
    }

    # 7. Mode별 처리
    pending_info = None

    if request.mode == "pending" and request.create_pending:
        pending_review = create_pending_review(
            entity_id=request.project_id,
            entity_type="Project",
            entity_name=project.get("entity_name", ""),
            suggested_fields=suggested_fields,
            reasoning=reasoning,
            run_id=run_id,
            actor=request.actor,
            source_workflow=request.source_workflow  # tsk-n8n-18
        )

        pending_info = {
            "review_id": pending_review["id"],
            "status": pending_review["status"],
            "created_at": pending_review["created_at"]
        }

    # 8. Audit 로그 저장
    audit_ref = save_ai_audit_log(run_id, {
        "project_id": request.project_id,
        "project_name": project.get("entity_name"),
        "mode": request.mode,
        "actor": request.actor,
        "endpoint": "infer_project_schema",
        "success": True,
        "provider": result.get("provider"),
        "model": result.get("model"),
        "issues": request.issues,
        "suggested_fields": suggested_fields,
        "reasoning": reasoning,
        "validation": validation,
        "pending": pending_info
    })

    return InferProjectSchemaResponse(
        ok=True,
        run_id=run_id,
        suggested_fields=suggested_fields,
        reasoning=reasoning,
        validation=validation,
        pending=pending_info,
        audit_ref=audit_ref
    )


# ============================================
# Hypothesis Schema Validation (Internal)
# ============================================

async def _validate_hypothesis_schema_internal(
    hypothesis_id: str,
    frontmatter: Dict[str, Any],
    provider: str = "openai"
) -> Dict[str, Any]:
    """
    Hypothesis 스키마 내부 검증 (HTTP 오버헤드 없음)

    생성된 Hypothesis의 품질과 A/B 모델 운영 가능성을 검사합니다.
    create_hypothesis()에서 auto_validate=True일 때 호출됨.

    검증 체크리스트:
    A. 구조 검증
       - ID 패턴: hyp-{track}-{seq}
       - parent_id: trk-N 형식
       - horizon: 4자리 연도

    B. 품질 검증
       - hypothesis_question: '?'로 끝나는지
       - success_criteria: 존재하고 구체적인지
       - failure_criteria: 존재하고 구체적인지
       - measurement: 어디서/무엇을/어떻게 포함

    C. Evidence 운영 가능성
       - normalized_delta 계산 방법 정의 가능
       - sample_size 명시
       - counterfactual 설정 가능
       - confounders 식별

    Returns:
        {
            "validated": True,
            "issues_found": 2,
            "pending_created": True,
            "pending_id": "rev-xxx",
            "run_id": "run-xxx",
            "quality_score": 0.8,
            "evidence_readiness": {...}
        }
    """
    run_id = generate_run_id()

    # 1. 구조 검증 (기본 필수 필드)
    issues = []

    # hypothesis_question 검증
    question = frontmatter.get("hypothesis_question", "")
    if not question:
        issues.append("missing_hypothesis_question")
    elif not question.strip().endswith("?"):
        issues.append("hypothesis_question_not_question_form")

    # success_criteria 검증
    success = frontmatter.get("success_criteria", "")
    if not success or len(success.strip()) < 10:
        issues.append("missing_or_weak_success_criteria")

    # failure_criteria 검증
    failure = frontmatter.get("failure_criteria", "")
    if not failure or len(failure.strip()) < 10:
        issues.append("missing_or_weak_failure_criteria")

    # measurement 검증
    measurement = frontmatter.get("measurement", "")
    if not measurement or len(measurement.strip()) < 10:
        issues.append("missing_or_weak_measurement")

    # parent_id (Track) 검증
    parent_id = frontmatter.get("parent_id", "")
    if not parent_id or not parent_id.startswith("trk-"):
        issues.append("invalid_parent_id_not_track")

    # confidence 검증
    confidence = frontmatter.get("confidence", 0.0)
    if confidence == 0.0:
        issues.append("confidence_not_set")

    # 누락된 필드 없으면 기본 검증 완료 (LLM 호출 스킵)
    if not issues:
        return {
            "validated": True,
            "issues_found": 0,
            "pending_created": False,
            "pending_id": None,
            "run_id": run_id,
            "quality_score": 1.0,
            "evidence_readiness": {
                "is_ready": True,
                "message": "All required fields present"
            }
        }

    # 2. LLM 호출 (품질 검증 + Evidence 운영 가능성)
    prompt = build_simple_hypothesis_schema_prompt(
        hypothesis_name=frontmatter.get("entity_name", ""),
        hypothesis_question=question,
        success_criteria=success,
        failure_criteria=failure,
        measurement=measurement,
        issues=issues
    )

    llm = get_llm_service()
    result = await llm.call_llm(
        prompt=prompt,
        system_prompt=HYPOTHESIS_SCHEMA_SYSTEM_PROMPT,
        provider=provider,
        response_format="json",
        entity_context={
            "entity_id": hypothesis_id,
            "entity_type": "Hypothesis",
            "action": "auto_validate_hypothesis"
        }
    )

    if not result["success"]:
        save_ai_audit_log(run_id, {
            "hypothesis_id": hypothesis_id,
            "mode": "auto_validate",
            "actor": "api",
            "endpoint": "_validate_hypothesis_schema_internal",
            "success": False,
            "error": result.get("error"),
            "provider": result.get("provider"),
            "model": result.get("model")
        })
        return {
            "validated": True,
            "issues_found": len(issues),
            "pending_created": False,
            "pending_id": None,
            "run_id": run_id,
            "error": result.get("error"),
            "quality_score": None
        }

    content = result["content"]

    # 3. LLM 응답 파싱
    suggested_fields = content.get("suggested_fields", {})
    reasoning = content.get("reasoning", {})
    validation_result = content.get("validation", {})

    # validated_by 필드 제거 (Derived 금지)
    if "validated_by" in suggested_fields:
        del suggested_fields["validated_by"]

    # quality score 추출
    quality_data = validation_result.get("quality", {})
    quality_score = quality_data.get("score", 0.5)

    # evidence readiness 추출
    evidence_data = validation_result.get("evidence_readiness", {})
    evidence_readiness = {
        "normalized_delta_method": evidence_data.get("normalized_delta_method"),
        "suggested_sample_size": evidence_data.get("suggested_sample_size"),
        "counterfactual_type": evidence_data.get("counterfactual_type", "none"),
        "confounders": evidence_data.get("confounders", [])
    }

    # 4. Pending review 생성
    if suggested_fields or quality_score < 0.8:
        pending_review = create_pending_review(
            entity_id=hypothesis_id,
            entity_type="Hypothesis",
            entity_name=frontmatter.get("entity_name", ""),
            suggested_fields={
                **suggested_fields,
                "_quality_score": quality_score,
                "_evidence_readiness": evidence_readiness
            },
            reasoning=reasoning,
            run_id=run_id,
            actor="api"
        )
        pending_id = pending_review["id"]
        pending_created = True
    else:
        pending_id = None
        pending_created = False

    # 5. Audit 로그
    save_ai_audit_log(run_id, {
        "hypothesis_id": hypothesis_id,
        "hypothesis_name": frontmatter.get("entity_name"),
        "mode": "auto_validate",
        "actor": "api",
        "endpoint": "_validate_hypothesis_schema_internal",
        "success": True,
        "provider": result.get("provider"),
        "model": result.get("model"),
        "issues": issues,
        "suggested_fields": suggested_fields,
        "quality_score": quality_score,
        "evidence_readiness": evidence_readiness,
        "pending": {"review_id": pending_id} if pending_id else None
    })

    return {
        "validated": True,
        "issues_found": len(issues),
        "pending_created": pending_created,
        "pending_id": pending_id,
        "run_id": run_id,
        "quality_score": quality_score,
        "evidence_readiness": evidence_readiness
    }


# ============================================
# Hypothesis Seeder Endpoint (tsk-n8n-11)
# ============================================

@router.post("/infer/hypothesis_draft", response_model=InferHypothesisDraftResponse)
async def infer_hypothesis_draft(request: InferHypothesisDraftRequest):
    """
    Hypothesis Draft 생성 (LLM 기반) - n8n Workflow D

    Project의 expected_impact.statement 또는 hypothesis_text를 기반으로
    검증 가능한 Hypothesis draft를 생성합니다.

    트리거 조건 (n8n에서 필터):
    - Project.status in [planning, active]
    - AND expected_impact.statement 또는 hypothesis_text 존재
    - AND validates = [] (가설 연결 없음)
    - AND tier in [strategic, enabling]

    동작:
    1. Project 조회 및 검증
    2. Track 정보 로드 (parent_id)
    3. LLM으로 Hypothesis draft 생성
    4. 품질 검증 및 Evidence 운영 가능성 평가
    5. pending review 생성 (mode=pending)
    6. 승인 시 파일 생성 + Project.validates 연결

    Modes:
    - preview: LLM 제안만 반환 (저장 안 함)
    - pending: pending_reviews.json에 저장 (Dashboard 승인 대기)

    핵심 원칙:
    - 자동 생성된 Hypothesis는 반드시 승인 필요
    - 지식 그래프 품질 보호
    """
    # 1. run_id 생성 또는 검증
    if request.run_id:
        if not validate_run_id(request.run_id):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid run_id format: {request.run_id}. Expected: run-YYYYMMDD-HHMMSS-xxxxxx"
            )
        run_id = request.run_id
    else:
        run_id = generate_run_id()

    # 2. Project 조회
    project = get_project_by_id(request.project_id)
    if not project:
        return InferHypothesisDraftResponse(
            ok=False,
            run_id=run_id,
            project_id=request.project_id,
            error=f"Project not found: {request.project_id}",
            audit_ref=run_id
        )

    project_name = project.get("entity_name", "")
    project_status = project.get("status", "")

    # 3. Project 상태 검증
    valid_statuses = ["planning", "active"]
    if project_status not in valid_statuses:
        return InferHypothesisDraftResponse(
            ok=False,
            run_id=run_id,
            project_id=request.project_id,
            project_name=project_name,
            error=f"Project status must be {valid_statuses}, got: {project_status}",
            skipped=True,
            skip_reason=f"invalid_status:{project_status}",
            audit_ref=run_id
        )

    # 4. 이미 validates가 있는지 확인
    validates = project.get("validates", [])
    if validates and len(validates) > 0:
        return InferHypothesisDraftResponse(
            ok=True,
            run_id=run_id,
            project_id=request.project_id,
            project_name=project_name,
            skipped=True,
            skip_reason=f"already_has_hypotheses:{','.join(validates)}",
            audit_ref=run_id
        )

    # 5. parent_id (Track ID) 확인
    parent_id = project.get("parent_id", "")
    if not parent_id or not parent_id.startswith("trk-"):
        return InferHypothesisDraftResponse(
            ok=False,
            run_id=run_id,
            project_id=request.project_id,
            project_name=project_name,
            error=f"Project has no valid parent_id (Track). Got: {parent_id}",
            audit_ref=run_id
        )

    # 6. Track 정보 로드
    track = get_track_by_id(parent_id)

    # 7. hypothesis_text 또는 expected_impact.statement 확인
    expected_impact = project.get("expected_impact", {})
    if isinstance(expected_impact, dict):
        impact_statement = expected_impact.get("statement", "")
    else:
        impact_statement = ""

    hypothesis_text = project.get("hypothesis_text", "")

    if not impact_statement and not hypothesis_text:
        return InferHypothesisDraftResponse(
            ok=False,
            run_id=run_id,
            project_id=request.project_id,
            project_name=project_name,
            error="Project has no expected_impact.statement or hypothesis_text",
            skipped=True,
            skip_reason="no_hypothesis_source",
            audit_ref=run_id
        )

    # 8. 프롬프트 생성
    if track:
        prompt = build_hypothesis_seeder_prompt(project, track)
    else:
        conditions_3y = project.get("conditions_3y", [])
        prompt = build_simple_hypothesis_seeder_prompt(
            project_name=project_name,
            expected_impact_statement=impact_statement or hypothesis_text,
            conditions_3y=conditions_3y
        )

    # 9. LLM 호출
    llm = get_llm_service()
    result = await llm.call_llm(
        prompt=prompt,
        system_prompt=HYPOTHESIS_SEEDER_SYSTEM_PROMPT,
        provider=request.provider,
        response_format="json",
        entity_context={
            "entity_id": request.project_id,
            "entity_type": "Hypothesis",
            "action": "infer_hypothesis_draft"
        }
    )

    if not result["success"]:
        # LLM 호출 실패
        save_ai_audit_log(run_id, {
            "project_id": request.project_id,
            "project_name": project_name,
            "mode": request.mode,
            "actor": request.actor,
            "endpoint": "infer_hypothesis_draft",
            "success": False,
            "error": result.get("error"),
            "provider": result.get("provider"),
            "model": result.get("model")
        })

        return InferHypothesisDraftResponse(
            ok=False,
            run_id=run_id,
            project_id=request.project_id,
            project_name=project_name,
            error=result.get("error", "LLM call failed"),
            audit_ref=run_id
        )

    content = result["content"]

    # 10. Hypothesis ID 생성
    try:
        hypothesis_id = generate_hypothesis_id(parent_id)
    except ValueError as e:
        return InferHypothesisDraftResponse(
            ok=False,
            run_id=run_id,
            project_id=request.project_id,
            project_name=project_name,
            error=f"Failed to generate hypothesis ID: {str(e)}",
            audit_ref=run_id
        )

    # 11. Hypothesis draft 구성
    hypothesis_draft = build_hypothesis_draft(content, project, hypothesis_id)

    # 12. 품질 검증
    quality_score, quality_issues = validate_hypothesis_quality(hypothesis_draft)

    # 13. Evidence 운영 가능성 평가
    evidence_readiness = assess_evidence_readiness(hypothesis_draft)

    # 14. Project 연결 제안
    project_link = {
        "project_id": request.project_id,
        "hypothesis_id": hypothesis_id,
        "action": "add_to_validates",
        "set_as_primary": len(validates) == 0
    }

    # 15. Validation 결과
    validation = {
        "quality_score": quality_score,
        "quality_issues": quality_issues,
        "is_valid": quality_score >= 0.6,
        "evidence_readiness": evidence_readiness
    }

    # 16. Mode별 처리
    pending_info = None

    # mode 유효성 검증
    valid_modes = ["preview", "pending"]
    if request.mode not in valid_modes:
        # 잘못된 mode는 preview로 처리
        request.mode = "preview"

    if request.mode == "pending" and request.create_pending:
        # pending review 생성
        pending_review = create_pending_review(
            entity_id=request.project_id,  # Project ID를 entity_id로 (Hypothesis는 approve 시 생성)
            entity_type="Hypothesis",
            entity_name=f"Hypothesis for {project_name}",
            suggested_fields={
                "hypothesis_draft": hypothesis_draft,
                "project_link": project_link,
                "_quality_score": quality_score,
                "_evidence_readiness": evidence_readiness
            },
            reasoning=content.get("reasoning", {}),
            run_id=run_id,
            actor=request.actor,
            source_workflow=request.source_workflow  # tsk-n8n-18
        )

        pending_info = {
            "review_id": pending_review["id"],
            "status": pending_review["status"],
            "created_at": pending_review["created_at"]
        }

    # 17. Audit 로그 저장
    audit_ref = save_ai_audit_log(run_id, {
        "project_id": request.project_id,
        "project_name": project_name,
        "hypothesis_id": hypothesis_id,
        "mode": request.mode,
        "actor": request.actor,
        "endpoint": "infer_hypothesis_draft",
        "success": True,
        "provider": result.get("provider"),
        "model": result.get("model"),
        "hypothesis_draft": hypothesis_draft,
        "quality_score": quality_score,
        "quality_issues": quality_issues,
        "evidence_readiness": evidence_readiness,
        "project_link": project_link,
        "pending": pending_info,
        "llm_run_id": result.get("run_id")
    })

    return InferHypothesisDraftResponse(
        ok=True,
        run_id=run_id,
        project_id=request.project_id,
        project_name=project_name,
        hypothesis_draft=hypothesis_draft,
        quality_score=quality_score,
        quality_issues=quality_issues,
        evidence_readiness=evidence_readiness,
        project_link=project_link,
        pending=pending_info,
        audit_ref=audit_ref
    )
