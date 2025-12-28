"""
Expected Impact (A Score) Prompts

Project의 Impact 필드를 제안하는 LLM 프롬프트.
기존: .claude/skills/auto-fill-project-impact/prompts/suggest_impact.md
"""

from typing import Dict, Any, Optional, List

EXPECTED_IMPACT_SYSTEM_PROMPT = """당신은 프로젝트의 전략적 가치를 분석하여 Impact 필드를 제안하는 전문가입니다.

## 역할
- 프로젝트 문서와 전략 컨텍스트를 분석합니다
- tier, impact_magnitude, confidence, contributes를 제안합니다
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
    similar_projects: Optional[List[Dict[str, Any]]] = None
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

    # 출력 형식 가이드
    output_format = """
## 요청

위 프로젝트를 분석하여 Impact 필드를 제안해주세요.

### 출력 형식 (JSON)

{
  "tier": {
    "value": "strategic|enabling|operational",
    "reasoning": "판단 근거"
  },
  "impact_magnitude": {
    "value": "high|mid|low",
    "reasoning": "판단 근거"
  },
  "confidence": {
    "value": 0.0-1.0,
    "reasoning": "판단 근거",
    "adjustments": [
      {"factor": "요인", "adjustment": -0.1}
    ]
  },
  "contributes": [
    {
      "condition_id": "cond-X",
      "weight": 0.0-1.0,
      "description": "기여 설명"
    }
  ],
  "summary": "1-2문장 핵심 요약"
}

### 판단 기준

**tier 판단:**
- strategic: 비전/전략에 직접 기여, 3년 Condition 달성에 필수
- enabling: 전략 실행을 가속, 다른 프로젝트 성공에 기여
- operational: 일상 운영 유지, 없으면 운영이 멈춤

**impact_magnitude 판단:**
- high: 핵심 지표에 직접적 큰 영향, 목표 달성의 30% 이상 기여
- mid: 중간 수준 영향, 목표 달성의 10-30% 기여
- low: 간접적/작은 영향, 목표 달성의 10% 미만 기여

**confidence 조정:**
- 감점: 첫 시도(-0.2), 외부 의존성(-0.1~-0.2), 일정 촉박(-0.1), 기술적 불확실성(-0.2)
- 가점: 유사 성공 경험(+0.1), 명확한 마일스톤(+0.1), 충분한 리소스(+0.1)
- 기본값: 0.7 (보통)
"""

    return f"""{project_info}

---

## 전략 컨텍스트

{track_info}
{condition_info}
{ns_info}
---

{similar_info}
---

{output_format}"""


# 간단한 프롬프트 (컨텍스트 없이)
def build_simple_expected_impact_prompt(
    project_name: str,
    project_description: str,
    conditions_3y: Optional[List[str]] = None
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

    return f"""## 프로젝트 정보

- 이름: {project_name}
- 설명: {project_description}
- 연결된 3년 조건: {conditions_text}

---

## 요청

위 프로젝트의 Impact 필드를 제안해주세요.

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
    "reasoning": "판단 근거"
  }},
  "summary": "1-2문장 핵심 요약"
}}

JSON만 반환하세요. Markdown 코드블록을 사용하지 마세요."""
