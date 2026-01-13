"""
Expected Impact (A Score) Prompts

Project의 Impact 필드를 제안하는 LLM 프롬프트.
SSOT: impact_model_config.yml에서 판단 기준을 동적 로드
"""

from typing import Dict, Any, Optional, List
from ..utils.impact_calculator import load_impact_config


def _build_criteria_from_config() -> str:
    """
    impact_model_config.yml에서 판단 기준을 동적으로 로드하여 프롬프트 텍스트 생성

    Returns:
        프롬프트에 삽입할 판단 기준 텍스트
    """
    try:
        config = load_impact_config()
    except FileNotFoundError:
        return "(판단 기준 로드 실패 - impact_model_config.yml 확인 필요)"

    # Tier 정의
    tiers = config.get("tiers", {})
    tier_text = "**tier 판단:**\n"
    for tier_name in ["strategic", "enabling", "operational"]:
        tier_def = tiers.get(tier_name, {})
        tier_text += f"- {tier_name}: {tier_def.get('description', 'N/A')}\n"

    # Magnitude 정의
    magnitude_levels = config.get("magnitude_levels", {})
    magnitude_text = "\n**impact_magnitude 판단:**\n"
    for mag_name in ["high", "mid", "low"]:
        mag_def = magnitude_levels.get(mag_name, {})
        threshold = mag_def.get("threshold", "")
        magnitude_text += f"- {mag_name}: {mag_def.get('description', 'N/A')} ({threshold})\n"

    # Confidence 정의
    confidence_cfg = config.get("confidence", {})
    guidelines = confidence_cfg.get("guidelines", {})
    confidence_text = "\n**confidence 조정:**\n"
    confidence_text += f"- 범위: {confidence_cfg.get('min', 0.0)} ~ {confidence_cfg.get('max', 1.0)}\n"
    confidence_text += f"- 기본값: {confidence_cfg.get('default', 0.7)}\n"
    for level, value in guidelines.items():
        confidence_text += f"- {level}: {value}\n"

    # Magnitude Points 테이블
    magnitude_points = config.get("magnitude_points", {})
    points_text = "\n**magnitude_points 테이블 (점수 계산용):**\n"
    points_text += "| tier | high | mid | low |\n|------|------|-----|-----|\n"
    for tier_name in ["strategic", "enabling", "operational"]:
        tier_points = magnitude_points.get(tier_name, {})
        points_text += f"| {tier_name} | {tier_points.get('high', '-')} | {tier_points.get('mid', '-')} | {tier_points.get('low', '-')} |\n"

    return tier_text + magnitude_text + confidence_text + points_text

EXPECTED_IMPACT_SYSTEM_PROMPT = """당신은 프로젝트의 전략적 가치를 분석하여 Impact 필드를 제안하는 전문가입니다.

## 역할
- 프로젝트 문서와 전략 컨텍스트를 분석합니다
- tier, impact_magnitude, confidence를 제안합니다
- condition_contributes (Condition 기여)와 track_contributes (Track 기여)를 제안합니다
- validates (검증 대상 가설)와 primary_hypothesis_id를 제안합니다
- 판단 근거를 명확히 설명합니다

## 제약
- 점수를 직접 계산하지 마세요. 필드 값만 제안합니다.
- 모든 제안에는 근거를 함께 제시합니다.
- 낙관적 편향을 피하세요. 첫 시도라면 confidence를 낮게 설정합니다.

## 출력 형식
반드시 JSON 형식으로 출력하세요. Markdown 코드블록 없이 순수 JSON만 반환합니다."""


def build_expected_impact_prompt(
    project: Dict[str, Any],
    track: Optional[Dict[str, Any]] = None,
    conditions: Optional[List[Dict[str, Any]]] = None,
    northstar_summary: Optional[str] = None,
    similar_projects: Optional[List[Dict[str, Any]]] = None,
    constraints: Optional[Dict[str, Any]] = None
) -> str:
    """
    Expected Impact 프롬프트 생성

    Args:
        project: 프로젝트 정보
        track: 상위 Track 정보
        conditions: 관련 Condition 목록
        northstar_summary: NorthStar/MH 요약
        similar_projects: 유사 프로젝트 목록

    Returns:
        완성된 프롬프트 문자열
    """
    # 프로젝트 정보 포맷팅
    project_info = f"""## 프로젝트 정보

- Project ID: {project.get('entity_id', 'N/A')}
- 이름: {project.get('entity_name', 'N/A')}
- 목표: {project.get('goal', project.get('description', 'N/A'))}
- Owner: {project.get('owner', 'N/A')}
- Status: {project.get('status', 'N/A')}
"""

    # Track 정보
    track_info = ""
    if track:
        track_info = f"""### 상위 Track
- Track ID: {track.get('entity_id', 'N/A')}
- 이름: {track.get('entity_name', 'N/A')}
- 설명: {track.get('description', 'N/A')}
"""
    else:
        track_info = "### 상위 Track\n정보 없음\n"

    # Condition 정보
    condition_info = ""
    if conditions:
        condition_info = "### 관련 Conditions\n"
        for cond in conditions:
            condition_info += f"- {cond.get('entity_id', 'N/A')}: {cond.get('entity_name', 'N/A')}\n"
    else:
        condition_info = "### 관련 Conditions\n정보 없음\n"

    # NorthStar 요약
    ns_info = f"""### NorthStar/MH 요약
{northstar_summary or '정보 없음'}
"""

    # 유사 프로젝트
    similar_info = ""
    if similar_projects:
        similar_info = "## 유사 프로젝트 참조\n"
        for sp in similar_projects[:3]:  # 최대 3개
            similar_info += f"""
- Project: {sp.get('entity_name', 'N/A')}
  - tier: {sp.get('expected_impact', {}).get('tier', 'N/A')}
  - magnitude: {sp.get('expected_impact', {}).get('impact_magnitude', 'N/A')}
  - confidence: {sp.get('expected_impact', {}).get('confidence', 'N/A')}
"""
    else:
        similar_info = "## 유사 프로젝트 참조\n없음\n"

    # 판단 기준을 yml에서 동적 로드
    criteria_text = _build_criteria_from_config()

    # Constraints (allowed IDs)
    constraints_text = ""
    if constraints:
        allowed_conditions = ", ".join(constraints.get("allowed_condition_ids", []))
        allowed_tracks = ", ".join(constraints.get("allowed_track_ids", []))
        allowed_hypotheses = ", ".join(constraints.get("allowed_hypothesis_ids", []))
        allowed_parent_chain = ", ".join(constraints.get("allowed_parent_chain", []))
        max_validates = constraints.get("max_validates")
        weight_sum_max = constraints.get("contributes_weight_sum_max")
        constraints_text = f"""
### 제약 (반드시 준수)
- allowed_condition_ids: [{allowed_conditions}]
- allowed_track_ids: [{allowed_tracks}]
- allowed_hypothesis_ids: [{allowed_hypotheses}]
- allowed_parent_chain: [{allowed_parent_chain}]
- max_validates: {max_validates}
- contributes_weight_sum_max: {weight_sum_max}
- 위 리스트 외 ID는 절대 생성하지 마세요.
"""

    # 출력 형식 가이드 (v5.3 정합: contributes -> condition_contributes)
    output_format = f"""
## 요청

위 프로젝트를 분석하여 Impact 필드를 제안해주세요.

### 출력 형식 (JSON)

{{
  "tier": {{
    "value": "strategic|enabling|operational",
    "reasoning": "판단 근거"
  }},
  "impact_magnitude": {{
    "value": "high|mid|low",
    "reasoning": "판단 근거"
  }},
  "confidence": {{
    "value": 0.0-1.0,
    "reasoning": "판단 근거",
    "adjustments": [
      {{"factor": "요인", "adjustment": -0.1}}
    ]
  }},
  "condition_contributes": [
    {{
      "condition_id": "cond-X",
      "weight": 0.0-1.0,
      "description": "Condition 기여 설명"
    }}
  ],
  "track_contributes": [
    {{
      "track_id": "trk-N",
      "weight": 0.0-1.0,
      "description": "Secondary Track 기여 설명 (선택사항)"
    }}
  ],
  "validates": ["hyp-X-XX"],
  "primary_hypothesis_id": "hyp-X-XX",
  "summary": "1-2문장 핵심 요약"
}}

### 판단 기준 (SSOT: impact_model_config.yml)

{criteria_text}

**v5.3 신규 필드:**
- condition_contributes: 3년 Condition (cond-a~e)에 대한 기여
- track_contributes: Secondary Track (trk-1~6)에 대한 기여 (선택사항)
- validates: 검증 대상 가설 ID 목록 (hyp-X-XX)
- primary_hypothesis_id: 프로젝트의 핵심 가설 ID

**제약:**
- allowed IDs만 사용 (constraints를 참조)
- track_contributes에는 parent_id를 넣지 마세요
- contributes weight 합계 <= 1.0
"""

    return f"""{project_info}

---

## 전략 컨텍스트

{track_info}
{condition_info}
{ns_info}
{constraints_text}
---

{similar_info}
---

{output_format}"""


# 간단한 프롬프트 (컨텍스트 없이)
def build_simple_expected_impact_prompt(
    project_name: str,
    project_description: str,
    conditions_3y: Optional[List[str]] = None,
    constraints: Optional[Dict[str, Any]] = None
) -> str:
    """
    간단한 Expected Impact 프롬프트 (최소 정보로)

    Args:
        project_name: 프로젝트 이름
        project_description: 프로젝트 설명
        conditions_3y: 연결된 3년 조건 ID 목록

    Returns:
        프롬프트 문자열
    """
    conditions_text = ", ".join(conditions_3y) if conditions_3y else "없음"

    constraints_text = ""
    if constraints:
        allowed_conditions = ", ".join(constraints.get("allowed_condition_ids", []))
        allowed_tracks = ", ".join(constraints.get("allowed_track_ids", []))
        allowed_hypotheses = ", ".join(constraints.get("allowed_hypothesis_ids", []))
        allowed_parent_chain = ", ".join(constraints.get("allowed_parent_chain", []))
        max_validates = constraints.get("max_validates")
        weight_sum_max = constraints.get("contributes_weight_sum_max")
        constraints_text = f"""
## 제약 (반드시 준수)
- allowed_condition_ids: [{allowed_conditions}]
- allowed_track_ids: [{allowed_tracks}]
- allowed_hypothesis_ids: [{allowed_hypotheses}]
- allowed_parent_chain: [{allowed_parent_chain}]
- max_validates: {max_validates}
- contributes_weight_sum_max: {weight_sum_max}
- 위 리스트 외 ID는 절대 생성하지 마세요.
"""

    return f"""## 프로젝트 정보

- 이름: {project_name}
- 설명: {project_description}
- 연결된 3년 조건: {conditions_text}

---
{constraints_text}

## 요청

위 프로젝트의 Impact 필드를 제안해주세요.

### 출력 형식 (JSON) - v5.3 Schema

{{
  "tier": {{
    "value": "strategic|enabling|operational",
    "reasoning": "판단 근거"
  }},
  "impact_magnitude": {{
    "value": "high|mid|low",
    "reasoning": "판단 근거"
  }},
  "confidence": {{
    "value": 0.0-1.0,
    "reasoning": "판단 근거"
  }},
  "summary": "1-2문장 핵심 요약",

  "validates": ["hyp-001", "hyp-002"],
  "primary_hypothesis_id": "hyp-001",

  "condition_contributes": [
    {{"condition_id": "cond-a", "weight": 0.5}},
    {{"condition_id": "cond-b", "weight": 0.3}}
  ],
  "track_contributes": [
    {{"track_id": "trk-2", "weight": 0.4}}
  ],

  "assumptions": ["Key assumption 1", "Key assumption 2"],
  "evidence_refs": ["Link to data", "Previous project results"],
  "linking_reason": "Why this links to selected hypotheses/conditions/tracks"
}}

IMPORTANT RULES (v5.3 Schema):
- `expected_impact` object only contains: statement, metric, target (NO contributes inside)
- `condition_contributes` and `track_contributes` are TOP-LEVEL fields
- Strategic tier SHOULD have at least 1 item in `validates` list
- Total weight in contributes lists should not exceed 1.0

JSON만 반환하세요. Markdown 코드블록을 사용하지 마세요."""
