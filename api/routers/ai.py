"""
AI Inference API Router

LLM 기반 추론 엔드포인트
- /api/ai/infer/project_impact: Project Impact autofill

LOOP_PHILOSOPHY 8.2:
- 모든 추론은 audit 로그에 기록
- pending → approve/reject 흐름 유지
- run_id로 디버깅/재현 가능

n8n 워크플로우와 통합:
- n8n에서 OpenAI 노드 대신 이 엔드포인트 호출
- 일관된 프롬프트/응답 형식 보장
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


class InferProjectImpactResponse(BaseModel):
    """Project Impact 추론 응답"""
    ok: bool
    run_id: str
    patch: Dict[str, Any] = Field(default_factory=dict, description="LLM 제안 필드")
    derived_autofill: Dict[str, Any] = Field(default_factory=dict, description="서버 계산 필드")
    scores: Dict[str, float] = Field(default_factory=dict, description="계산된 점수")
    validation: Dict[str, Any] = Field(default_factory=dict, description="검증 결과")
    pending: Optional[Dict[str, Any]] = Field(default=None, description="생성된 pending review")
    audit_ref: str = Field(default="", description="audit 참조 ID")
    error: Optional[str] = Field(default=None, description="에러 메시지")


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
    actor: str
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
        "actor": actor
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

    # contributes
    if "contributes" in content:
        contributes = content["contributes"]
        if isinstance(contributes, list):
            is_valid, normalized, contrib_warnings = validate_contributes_weights(contributes)
            patch["contributes"] = normalized
            warnings.extend(contrib_warnings)

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
        # pending review 생성
        expected_impact_obj = {
            "tier": patch.get("tier"),
            "impact_magnitude": patch.get("impact_magnitude"),
            "confidence": patch.get("confidence"),
            "contributes": patch.get("contributes", [])
        }

        pending_review = create_pending_review(
            entity_id=request.project_id,
            entity_type="Project",
            entity_name=project.get("entity_name", ""),
            suggested_fields={"expected_impact": expected_impact_obj},
            reasoning=reasoning,
            run_id=run_id,
            actor=request.actor
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
        patch=patch,
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
            "/api/ai/audit/{run_id}",
            "/api/ai/health"
        ]
    }
