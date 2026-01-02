"""
Realized Impact (B Score) Prompts

회고 문서에서 Evidence 필드를 추출하는 LLM 프롬프트.
SSOT: impact_model_config.yml에서 판단 기준을 동적 로드
"""

from typing import Dict, Any, Optional
from ..utils.impact_calculator import load_impact_config


def _build_realized_criteria_from_config() -> str:
    """
    impact_model_config.yml에서 Realized Impact 판단 기준을 동적으로 로드

    Returns:
        프롬프트에 삽입할 판단 기준 텍스트
    """
    try:
        config = load_impact_config()
    except FileNotFoundError:
        return "(판단 기준 로드 실패 - impact_model_config.yml 확인 필요)"

    # Normalized Delta
    normalized_delta = config.get("normalized_delta", {})
    delta_text = "**normalized_delta 계산:**\n"
    delta_text += f"- 범위: {normalized_delta.get('min', 0.0)} ~ {normalized_delta.get('max', 1.0)}\n"
    delta_text += f"- 설명: {normalized_delta.get('description', 'N/A')}\n"
    delta_text += "- 1.0 초과 → 1.0으로 cap\n"
    delta_text += "- 정보 없으면 → null\n"

    # Strength Multipliers
    strength_mult = config.get("strength_multipliers", {})
    strength_text = "\n**evidence_strength 판단:**\n"
    for strength in ["strong", "medium", "weak"]:
        mult = strength_mult.get(strength, "N/A")
        strength_text += f"- {strength} (×{mult})\n"

    # Learning Value
    learning_value = config.get("learning_value", {})
    learning_text = "\n**learning_value 판단:**\n"
    for level in ["high", "medium", "low"]:
        level_def = learning_value.get(level, {})
        learning_text += f"- {level}: {level_def.get('description', 'N/A')}\n"

    # Realized Status
    realized_status = config.get("realized_status", {})
    status_text = "\n**realized_status 판정:**\n"
    for status in ["succeeded", "failed_but_high_signal", "failed_low_signal", "inconclusive"]:
        status_def = realized_status.get(status, {})
        if status_def.get("can_have_evidence"):
            status_text += f"- {status}: {status_def.get('description', 'N/A')}\n"

    return delta_text + strength_text + learning_text + status_text

REALIZED_IMPACT_SYSTEM_PROMPT = """당신은 프로젝트 회고 문서를 분석하여 구조화된 Evidence 객체로 변환하는 전문가입니다.

## 역할
- 회고 문서에서 정량/정성 데이터를 추출합니다
- Evidence 필드 값을 제안합니다
- 판단 근거를 명확히 설명합니다

## 제약
- 점수를 직접 계산하지 마세요. 필드 값만 제안합니다.
- 추측하지 마세요. 문서에 없는 정보는 null로 표시합니다.
- 모든 제안에는 근거를 함께 제시합니다.

## 출력 형식
반드시 JSON 형식으로 출력하세요. Markdown 코드블록 없이 순수 JSON만 반환합니다."""


def build_realized_impact_prompt(
    project: Dict[str, Any],
    retrospective_content: Optional[str] = None,
    goal_description: Optional[str] = None,
    actual_result: Optional[str] = None
) -> str:
    """
    Realized Impact 프롬프트 생성

    Args:
        project: 프로젝트 정보
        retrospective_content: 회고 문서 내용
        goal_description: 목표 설명
        actual_result: 실제 결과

    Returns:
        완성된 프롬프트 문자열
    """
    # 프로젝트 정보
    project_info = f"""## 프로젝트 정보

- Project ID: {project.get('entity_id', 'N/A')}
- 이름: {project.get('entity_name', 'N/A')}
- 목표: {goal_description or project.get('goal', 'N/A')}
- 실제 결과: {actual_result or 'N/A'}
- Status: {project.get('status', 'N/A')}
"""

    # Expected Impact (있으면)
    expected = project.get('expected_impact', {})
    if expected and expected.get('tier'):
        project_info += f"""
### 계획 시 Expected Impact
- tier: {expected.get('tier', 'N/A')}
- magnitude: {expected.get('impact_magnitude', 'N/A')}
- confidence: {expected.get('confidence', 'N/A')}
"""

    # 회고 문서
    retro_section = ""
    if retrospective_content:
        retro_section = f"""## 회고 문서

{retrospective_content}
"""
    else:
        retro_section = """## 회고 문서

(회고 문서 없음 - 프로젝트 정보만으로 판단)
"""

    # 판단 기준을 yml에서 동적 로드
    criteria_text = _build_realized_criteria_from_config()

    # 출력 형식 가이드
    output_format = f"""
---

## 요청

위 정보를 분석하여 Realized Impact (Evidence) 필드를 추출해주세요.

### 출력 형식 (JSON)

{{
  "normalized_delta": {{
    "value": 0.0-1.0,
    "reasoning": "계산 근거 (실제값/목표값)"
  }},
  "evidence_strength": {{
    "value": "strong|medium|weak",
    "reasoning": "판단 근거"
  }},
  "attribution_share": {{
    "value": 0.0-1.0,
    "reasoning": "기여도 판단 근거"
  }},
  "impact_metric": "측정 지표명 (예: revenue, retention_d7, nps)",
  "learning_value": {{
    "value": "high|medium|low",
    "reasoning": "학습 가치 판단 근거"
  }},
  "falsified_hypotheses": [
    {{
      "hypothesis": "반증된 가설",
      "evidence": "반증 근거"
    }}
  ],
  "confirmed_insights": [
    {{
      "insight": "확인된 인사이트",
      "evidence": "확인 근거"
    }}
  ],
  "realized_status": {{
    "value": "succeeded|failed_but_high_signal|failed_low_signal|inconclusive",
    "reasoning": "판정 근거"
  }},
  "summary": "1-2문장 핵심 요약"
}}

### 판단 기준 (SSOT: impact_model_config.yml)

{criteria_text}

JSON만 반환하세요. Markdown 코드블록을 사용하지 마세요."""

    return f"""{project_info}

{retro_section}

{output_format}"""


def build_simple_realized_impact_prompt(
    project_name: str,
    goal: str,
    actual_result: str,
    brief_retro: Optional[str] = None
) -> str:
    """
    간단한 Realized Impact 프롬프트 (최소 정보로)

    Args:
        project_name: 프로젝트 이름
        goal: 목표
        actual_result: 실제 결과
        brief_retro: 간단한 회고 내용

    Returns:
        프롬프트 문자열
    """
    retro_text = brief_retro or "별도 회고 내용 없음"

    return f"""## 프로젝트 정보

- 이름: {project_name}
- 목표: {goal}
- 실제 결과: {actual_result}

## 간단 회고
{retro_text}

---

## 요청

위 정보를 기반으로 Realized Impact 필드를 추출해주세요.

### 출력 형식 (JSON)

{{
  "normalized_delta": {{
    "value": 0.0-1.0,
    "reasoning": "계산 근거"
  }},
  "evidence_strength": {{
    "value": "strong|medium|weak",
    "reasoning": "판단 근거"
  }},
  "realized_status": {{
    "value": "succeeded|failed_but_high_signal|failed_low_signal|inconclusive",
    "reasoning": "판정 근거"
  }},
  "summary": "1-2문장 핵심 요약"
}}

JSON만 반환하세요. Markdown 코드블록을 사용하지 마세요."""
