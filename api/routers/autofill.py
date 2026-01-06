"""
Autofill API Router

LLM 기반 필드 자동 채움 API
- Expected Impact (A Score)
- Realized Impact (B Score)
- Entity Fields (conditions_3y, validates 등)

mode 파라미터:
- preview: LLM 제안값만 반환 (저장 안 함)
- pending: pending_reviews.json에 저장 (Dashboard 승인 대기)
- execute: 엔티티에 바로 적용
"""

from datetime import datetime
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from ..cache import get_cache
from ..services.llm_service import get_llm_service
from ..utils.vault_utils import get_vault_dir
from ..utils.impact_calculator import (
    calculate_expected_score,
    calculate_realized_score,
    calculate_window_fields,
    validate_contributes_weights,
    map_realized_status_to_verdict
)
from ..prompts.expected_impact import (
    EXPECTED_IMPACT_SYSTEM_PROMPT,
    build_expected_impact_prompt,
    build_simple_expected_impact_prompt
)
from ..prompts.realized_impact import (
    REALIZED_IMPACT_SYSTEM_PROMPT,
    build_realized_impact_prompt,
    build_simple_realized_impact_prompt
)
from .pending import (
    load_pending,
    save_pending,
    generate_review_id,
    find_entity_file,
    update_entity_frontmatter
)

router = APIRouter(prefix="/api/autofill", tags=["autofill"])


# ============================================
# Pydantic Models
# ============================================

class AutofillResponse(BaseModel):
    """Autofill API 응답 모델"""
    success: bool
    entity_id: str
    mode: str  # preview | pending | execute
    suggested_fields: Dict[str, Any]  # LLM 제안값
    calculated_fields: Dict[str, Any]  # 서버 계산값 (score, window_id 등)
    reasoning: Dict[str, str]  # 필드별 판단 근거
    validation_warnings: List[str]  # 자동 수정/경고 항목
    pending_id: Optional[str] = None  # mode=pending일 때
    error: Optional[str] = None


class ExpectedImpactRequest(BaseModel):
    """Expected Impact 요청"""
    project_id: str
    mode: str = Field(default="preview", description="preview | pending | execute")
    provider: str = Field(default="openai", description="openai | anthropic")


class RealizedImpactRequest(BaseModel):
    """Realized Impact 요청"""
    project_id: str
    retrospective_content: Optional[str] = None
    goal_description: Optional[str] = None
    actual_result: Optional[str] = None
    mode: str = Field(default="preview", description="preview | pending | execute")
    provider: str = Field(default="openai", description="openai | anthropic")


class EntityFieldsRequest(BaseModel):
    """일반 필드 자동 채움 요청"""
    entity_id: str
    entity_type: str = Field(description="Task | Project")
    fields: List[str] = Field(description="채울 필드 목록 (conditions_3y, validates, parent_id 등)")
    mode: str = Field(default="preview")
    provider: str = Field(default="openai")


# ============================================
# Helper Functions
# ============================================

def get_project_by_id(project_id: str) -> Optional[Dict[str, Any]]:
    """프로젝트 조회 (캐시 또는 파일)"""
    cache = get_cache()
    projects = cache.get_projects()

    for p in projects:
        if p.get("entity_id") == project_id:
            return p

    return None


def get_track_by_id(track_id: str) -> Optional[Dict[str, Any]]:
    """Track 조회"""
    cache = get_cache()
    tracks = cache.get_tracks() if hasattr(cache, 'get_tracks') else []

    for t in tracks:
        if t.get("entity_id") == track_id:
            return t

    return None


def save_to_pending(
    entity_id: str,
    entity_type: str,
    entity_name: str,
    suggested_fields: Dict[str, Any],
    reasoning: Dict[str, str]
) -> str:
    """pending_reviews.json에 저장하고 review_id 반환"""
    data = load_pending()
    reviews = data.get("reviews", [])

    # 중복 체크
    for idx, r in enumerate(reviews):
        if r.get("entity_id") == entity_id and r.get("status") == "pending":
            # 기존 항목 업데이트
            reviews[idx]["suggested_fields"] = suggested_fields
            reviews[idx]["reasoning"] = reasoning
            reviews[idx]["updated_at"] = datetime.now().isoformat()
            data["reviews"] = reviews
            save_pending(data)
            return reviews[idx]["id"]

    # 새로 추가
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
        "source": "autofill_api"
    }
    reviews.append(new_review)
    data["reviews"] = reviews
    save_pending(data)

    return review_id


def apply_to_entity(
    entity_id: str,
    entity_type: str,
    fields: Dict[str, Any]
) -> bool:
    """엔티티 파일에 필드 적용"""
    entity_file = find_entity_file(entity_id, entity_type)
    if not entity_file:
        return False

    return update_entity_frontmatter(entity_file, fields)


# ============================================
# API Endpoints
# ============================================

@router.post("/expected-impact", response_model=AutofillResponse)
async def autofill_expected_impact(request: ExpectedImpactRequest):
    """
    Expected Impact (A Score) 자동 채움

    LLM이 프로젝트 컨텍스트를 분석하여 tier, impact_magnitude, confidence, contributes 제안
    """
    project = get_project_by_id(request.project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project not found: {request.project_id}")

    # 프롬프트 생성
    prompt = build_simple_expected_impact_prompt(
        project_name=project.get("entity_name", ""),
        project_description=project.get("description", project.get("goal", "")),
        conditions_3y=project.get("conditions_3y", [])
    )

    # LLM 호출
    llm = get_llm_service()
    result = await llm.call_llm(
        prompt=prompt,
        system_prompt=EXPECTED_IMPACT_SYSTEM_PROMPT,
        provider=request.provider,
        response_format="json"
    )

    if not result["success"]:
        return AutofillResponse(
            success=False,
            entity_id=request.project_id,
            mode=request.mode,
            suggested_fields={},
            calculated_fields={},
            reasoning={},
            validation_warnings=[],
            error=result.get("error", "LLM call failed")
        )

    content = result["content"]

    # LLM 응답 파싱
    suggested_fields = {}
    reasoning = {}
    warnings = []

    # tier
    if "tier" in content:
        tier_data = content["tier"]
        if isinstance(tier_data, dict):
            suggested_fields["tier"] = tier_data.get("value", "operational")
            reasoning["tier"] = tier_data.get("reasoning", "")
        else:
            suggested_fields["tier"] = tier_data

    # impact_magnitude
    if "impact_magnitude" in content:
        mag_data = content["impact_magnitude"]
        if isinstance(mag_data, dict):
            suggested_fields["impact_magnitude"] = mag_data.get("value", "mid")
            reasoning["impact_magnitude"] = mag_data.get("reasoning", "")
        else:
            suggested_fields["impact_magnitude"] = mag_data

    # confidence
    if "confidence" in content:
        conf_data = content["confidence"]
        if isinstance(conf_data, dict):
            suggested_fields["confidence"] = conf_data.get("value", 0.7)
            reasoning["confidence"] = conf_data.get("reasoning", "")
        else:
            suggested_fields["confidence"] = conf_data

    # contributes
    if "contributes" in content:
        contributes = content["contributes"]
        if isinstance(contributes, list):
            is_valid, normalized, contrib_warnings = validate_contributes_weights(contributes)
            suggested_fields["contributes"] = normalized
            warnings.extend(contrib_warnings)

    # summary
    if "summary" in content:
        reasoning["summary"] = content["summary"]

    # 서버 계산값
    calculated_fields = {}
    tier = suggested_fields.get("tier", "operational")
    magnitude = suggested_fields.get("impact_magnitude", "mid")
    confidence = suggested_fields.get("confidence", 0.7)

    try:
        expected_score = calculate_expected_score(tier, magnitude, confidence)
        calculated_fields["expected_score"] = round(expected_score, 2)
    except ValueError as e:
        warnings.append(str(e))

    # mode별 처리
    pending_id = None

    if request.mode == "pending":
        pending_id = save_to_pending(
            entity_id=request.project_id,
            entity_type="Project",
            entity_name=project.get("entity_name", ""),
            suggested_fields={
                "expected_impact": {
                    "tier": suggested_fields.get("tier"),
                    "impact_magnitude": suggested_fields.get("impact_magnitude"),
                    "confidence": suggested_fields.get("confidence"),
                    "contributes": suggested_fields.get("contributes", [])
                }
            },
            reasoning=reasoning
        )

    elif request.mode == "execute":
        success = apply_to_entity(
            entity_id=request.project_id,
            entity_type="Project",
            fields={
                "expected_impact": {
                    "tier": suggested_fields.get("tier"),
                    "impact_magnitude": suggested_fields.get("impact_magnitude"),
                    "confidence": suggested_fields.get("confidence"),
                    "contributes": suggested_fields.get("contributes", [])
                }
            }
        )
        if not success:
            warnings.append("Failed to apply fields to entity file")

    return AutofillResponse(
        success=True,
        entity_id=request.project_id,
        mode=request.mode,
        suggested_fields=suggested_fields,
        calculated_fields=calculated_fields,
        reasoning=reasoning,
        validation_warnings=warnings,
        pending_id=pending_id
    )


@router.post("/realized-impact", response_model=AutofillResponse)
async def autofill_realized_impact(request: RealizedImpactRequest):
    """
    Realized Impact (B Score) 자동 채움

    회고 문서를 분석하여 normalized_delta, evidence_strength, realized_status 등 제안
    """
    project = get_project_by_id(request.project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project not found: {request.project_id}")

    # 프롬프트 생성
    prompt = build_realized_impact_prompt(
        project=project,
        retrospective_content=request.retrospective_content,
        goal_description=request.goal_description,
        actual_result=request.actual_result
    )

    # LLM 호출
    llm = get_llm_service()
    result = await llm.call_llm(
        prompt=prompt,
        system_prompt=REALIZED_IMPACT_SYSTEM_PROMPT,
        provider=request.provider,
        response_format="json"
    )

    if not result["success"]:
        return AutofillResponse(
            success=False,
            entity_id=request.project_id,
            mode=request.mode,
            suggested_fields={},
            calculated_fields={},
            reasoning={},
            validation_warnings=[],
            error=result.get("error", "LLM call failed")
        )

    content = result["content"]

    # LLM 응답 파싱
    suggested_fields = {}
    reasoning = {}
    warnings = []

    # 필드 추출
    field_mappings = [
        ("normalized_delta", "normalized_delta"),
        ("evidence_strength", "evidence_strength"),
        ("attribution_share", "attribution_share"),
        ("impact_metric", "impact_metric"),
        ("learning_value", "learning_value"),
        ("realized_status", "realized_status"),
    ]

    for key, field_name in field_mappings:
        if key in content:
            data = content[key]
            if isinstance(data, dict):
                suggested_fields[field_name] = data.get("value")
                if "reasoning" in data:
                    reasoning[field_name] = data["reasoning"]
            else:
                suggested_fields[field_name] = data

    # 리스트 필드
    if "falsified_hypotheses" in content:
        suggested_fields["falsified_hypotheses"] = content["falsified_hypotheses"]
    if "confirmed_insights" in content:
        suggested_fields["confirmed_insights"] = content["confirmed_insights"]

    # summary
    if "summary" in content:
        reasoning["summary"] = content["summary"]

    # 서버 계산값
    calculated_fields = {}

    # window_id, time_range 자동 계산
    window_fields = calculate_window_fields(entity_type="project")
    calculated_fields["window_id"] = window_fields["window_id"]
    calculated_fields["time_range"] = window_fields["time_range"]

    # realized_score 계산
    normalized_delta = suggested_fields.get("normalized_delta", 0.0)
    evidence_strength = suggested_fields.get("evidence_strength", "medium")
    attribution_share = suggested_fields.get("attribution_share", 1.0)

    if normalized_delta is not None:
        try:
            realized_score = calculate_realized_score(
                normalized_delta, evidence_strength, attribution_share
            )
            calculated_fields["realized_score"] = round(realized_score, 2)
        except ValueError as e:
            warnings.append(str(e))

    # verdict/outcome 매핑
    realized_status = suggested_fields.get("realized_status")
    if realized_status:
        verdict_outcome = map_realized_status_to_verdict(realized_status)
        calculated_fields["verdict"] = verdict_outcome.get("verdict")
        calculated_fields["outcome"] = verdict_outcome.get("outcome")

    # mode별 처리
    pending_id = None

    realized_impact_obj = {
        "normalized_delta": suggested_fields.get("normalized_delta"),
        "evidence_strength": suggested_fields.get("evidence_strength"),
        "attribution_share": suggested_fields.get("attribution_share"),
        "impact_metric": suggested_fields.get("impact_metric"),
        "learning_value": suggested_fields.get("learning_value"),
        "verdict": calculated_fields.get("verdict"),
        "outcome": calculated_fields.get("outcome"),
        "window_id": calculated_fields.get("window_id"),
        "time_range": calculated_fields.get("time_range"),
        "decided": datetime.now().strftime("%Y-%m-%d"),
        "evidence_links": []
    }

    if request.mode == "pending":
        pending_id = save_to_pending(
            entity_id=request.project_id,
            entity_type="Project",
            entity_name=project.get("entity_name", ""),
            suggested_fields={"realized_impact": realized_impact_obj},
            reasoning=reasoning
        )

    elif request.mode == "execute":
        success = apply_to_entity(
            entity_id=request.project_id,
            entity_type="Project",
            fields={"realized_impact": realized_impact_obj}
        )
        if not success:
            warnings.append("Failed to apply fields to entity file")

    return AutofillResponse(
        success=True,
        entity_id=request.project_id,
        mode=request.mode,
        suggested_fields=suggested_fields,
        calculated_fields=calculated_fields,
        reasoning=reasoning,
        validation_warnings=warnings,
        pending_id=pending_id
    )


@router.get("/providers")
def get_available_providers():
    """사용 가능한 LLM provider 목록"""
    llm = get_llm_service()
    return {
        "providers": llm.get_available_providers(),
        "default": "openai"
    }


@router.get("/pattern-defaults")
async def get_pattern_defaults(
    parent_type: str = Query(..., regex="^(project|program|track)$"),
    parent_id: str = Query(...),
    child_type: str = Query(..., regex="^(task|project)$")
):
    """
    패턴 기반 폼 기본값 자동 채움

    부모 엔티티의 하위 엔티티들을 분석하여 가장 빈번한 필드 값을 반환

    Args:
        parent_type: project | program | track
        parent_id: 부모 엔티티 ID
        child_type: task | project

    Returns:
        {
            "success": true,
            "defaults": {
                "assignee": "김은향",
                "status": "doing",
                "priority": "high",
                "type": "dev"
            },
            "sample_size": 15
        }

    Supports:
        - project → task
        - program → task
        - program → project
        - track → project
    """
    from collections import Counter

    cache = get_cache()

    # 1. Validate parent exists
    parent_exists = False

    if parent_type == "project":
        parent_exists = cache.get_project(parent_id) is not None
    elif parent_type == "program":
        parent_exists = cache.get_program(parent_id) is not None
    elif parent_type == "track":
        parent_exists = cache.get_track(parent_id) is not None

    if not parent_exists:
        raise HTTPException(status_code=404, detail=f"Parent {parent_type} not found: {parent_id}")

    # 2. Get child entities (exclude archived)
    all_children = []

    if child_type == "task":
        if parent_type == "project":
            all_children = [t for t in cache.get_all_tasks()
                           if t.get("project_id") == parent_id
                           and t.get("status") != "archived"]
        elif parent_type == "program":
            all_children = [t for t in cache.get_all_tasks()
                           if t.get("program_id") == parent_id
                           and t.get("status") != "archived"]
    elif child_type == "project":
        if parent_type == "track":
            # Handle both parent_id and track_id (some projects use track_id)
            all_children = [p for p in cache.get_all_projects()
                           if (p.get("parent_id") == parent_id or p.get("track_id") == parent_id)
                           and p.get("status") != "archived"]
        elif parent_type == "program":
            all_children = [p for p in cache.get_all_projects()
                           if p.get("program_id") == parent_id
                           and p.get("status") != "archived"]

    sample_size = len(all_children)

    # If no children, return empty defaults
    if not all_children:
        return {
            "success": True,
            "defaults": {},
            "sample_size": 0
        }

    # 3. Analyze patterns
    defaults = {}

    # Define fields to analyze based on child type
    fields_to_analyze = {
        "task": ["assignee", "status", "priority", "type"],
        "project": ["owner", "status", "priority_flag"]
    }

    for field in fields_to_analyze.get(child_type, []):
        values = []
        for child in all_children:
            val = child.get(field)
            # Filter out null, empty, placeholder values
            if val and val not in ["", "미정", "null", None]:
                values.append(val)

        if values:
            counter = Counter(values)
            most_common = counter.most_common()

            # Handle ties: if multiple values have same count, sort alphabetically
            if len(most_common) > 1 and most_common[0][1] == most_common[1][1]:
                # Get all values with max count
                max_count = most_common[0][1]
                tied_values = [val for val, count in most_common if count == max_count]
                defaults[field] = sorted(tied_values)[0]  # Pick first alphabetically
            else:
                defaults[field] = most_common[0][0]

    # Special handling for tags: flatten and count individual tags
    if child_type == "task":
        all_tags = []
        for child in all_children:
            tags = child.get("tags", [])
            if isinstance(tags, list):
                all_tags.extend([t for t in tags if t and t != ""])

        if all_tags:
            tag_counter = Counter(all_tags)
            # Get top 3 most common tags
            top_tags = [tag for tag, count in tag_counter.most_common(3)]
            defaults["tags"] = top_tags

    return {
        "success": True,
        "defaults": defaults,
        "sample_size": sample_size
    }


@router.get("/health")
def autofill_health():
    """Autofill API 상태 체크"""
    llm = get_llm_service()
    providers = llm.get_available_providers()

    return {
        "status": "healthy" if providers else "degraded",
        "available_providers": providers,
        "endpoints": [
            "/api/autofill/expected-impact",
            "/api/autofill/realized-impact",
            "/api/autofill/pattern-defaults",
            "/api/autofill/providers"
        ]
    }
