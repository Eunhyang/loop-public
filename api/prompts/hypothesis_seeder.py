"""
Hypothesis Seeder Prompts

Project에서 Hypothesis draft를 생성하는 LLM 프롬프트.

Workflow D (Hypothesis Seeder):
1. Project.status in [planning, active]
2. Project.validates = [] (가설 연결 없음)
3. expected_impact.statement 또는 hypothesis_text 존재
4. → Hypothesis draft 생성 + pending review

생성되는 필드:
- entity_name: 가설 이름
- hypothesis_question: 질문 형태 (?로 끝남)
- success_criteria: 성공 판정 기준
- failure_criteria: 실패 판정 기준 (피벗/중단 트리거)
- measurement: 어디서/무엇을/어떻게 측정
- confidence: 0.0-1.0 초기 신뢰도
- horizon: 검증 목표 연도

서버 자동 생성:
- entity_id: hyp-{track}-{seq} 자동 발급
- parent_id: Project.parent_id 상속 (Track ID)

제약:
- validated_by 필드 생성 금지 (Derived)
"""

from typing import Dict, Any, Optional, List

HYPOTHESIS_SEEDER_SYSTEM_PROMPT = """당신은 LOOP Vault Hypothesis 생성 전문가입니다.

## 역할
- Project의 expected_impact.statement 또는 hypothesis_text를 기반으로
- 검증 가능한 Hypothesis를 설계합니다
- 모든 필드에 근거를 함께 제시합니다

## LOOP A/B Score 모델 이해

### A Score (Expected Impact)
- Project가 Hypothesis를 검증할 때 기대하는 영향
- tier × magnitude × confidence로 계산
- Hypothesis가 명확할수록 confidence 높아짐

### B Score (Realized Impact)
- 실제 Evidence 기반으로 계산
- normalized_delta × evidence_strength × attribution_share
- Hypothesis의 measurement가 명확해야 계산 가능

## 생성해야 하는 필드

### 필수 필드
1. **entity_name**: 가설 이름 (간결하고 명확하게)
2. **hypothesis_question**: 질문 형태 (**반드시 ?로 끝나야 함**)
   - 예: "코칭 AI가 사용자의 습관 지속률을 30% 이상 향상시킬 수 있는가?"
3. **success_criteria**: 성공 판정 기준 (숫자/기간/표본 포함 권장)
   - 예: "6개월 내 습관 지속률 30% 이상 향상, n=50 이상"
4. **failure_criteria**: 실패 판정 기준 (피벗/중단 트리거)
   - 예: "3개월 후 지속률 변화 10% 미만 시 접근법 변경"
5. **measurement**: 측정 방법 (어디서/무엇을/어떻게)
   - 예: "앱 내 습관 추적 데이터 / 주간 완료율 / 코호트 분석"
6. **confidence**: 0.0-1.0 초기 신뢰도 (기본 0.5-0.7)
7. **horizon**: 검증 목표 연도 (4자리, 예: "2026")

### 생성 금지 필드
- validated_by: Derived 필드 (빌드 타임에 계산)
- entity_id: 서버에서 자동 생성
- parent_id: Project.parent_id에서 상속

## 출력 형식
반드시 JSON 형식으로 출력하세요. Markdown 코드블록 없이 순수 JSON만 반환합니다.

### JSON 구조
{
  "entity_name": "가설 이름",
  "hypothesis_question": "질문?",
  "success_criteria": "성공 기준",
  "failure_criteria": "실패 기준",
  "measurement": "측정 방법",
  "confidence": 0.7,
  "horizon": "2026",
  "reasoning": {
    "hypothesis_derivation": "가설 도출 근거",
    "success_criteria_rationale": "성공 기준 설정 근거",
    "measurement_approach": "측정 방법 선택 근거"
  },
  "evidence_readiness": {
    "normalized_delta_method": "normalized_delta 계산 방법",
    "suggested_sample_size": 50,
    "counterfactual_type": "before_after",
    "confounders": ["교란 변수 목록"]
  }
}"""


def build_hypothesis_seeder_prompt(
    project: Dict[str, Any],
    track: Optional[Dict[str, Any]] = None
) -> str:
    """
    Hypothesis 생성 프롬프트 (전체 컨텍스트)

    Args:
        project: Project 엔티티 정보
        track: 상위 Track 정보 (선택)

    Returns:
        완성된 프롬프트 문자열
    """
    import json

    project_id = project.get("entity_id", "")
    project_name = project.get("entity_name", "")

    # expected_impact에서 statement 추출
    expected_impact = project.get("expected_impact", {})
    if isinstance(expected_impact, dict):
        impact_statement = expected_impact.get("statement", "")
        tier = expected_impact.get("tier", "")
        magnitude = expected_impact.get("impact_magnitude", "")
        confidence = expected_impact.get("confidence", 0.0)
    else:
        impact_statement = ""
        tier = ""
        magnitude = ""
        confidence = 0.0

    # hypothesis_text 확인 (fallback)
    hypothesis_text = project.get("hypothesis_text", "")

    # 사용할 가설 텍스트 결정
    hypothesis_source = impact_statement or hypothesis_text or project.get("goal", "")

    # Project 정보 포맷팅
    project_info = {
        "entity_id": project_id,
        "entity_name": project_name,
        "status": project.get("status", ""),
        "parent_id": project.get("parent_id", ""),
        "conditions_3y": project.get("conditions_3y", []),
        "expected_impact": {
            "statement": impact_statement,
            "tier": tier,
            "impact_magnitude": magnitude,
            "confidence": confidence
        },
        "hypothesis_text": hypothesis_text,
        "goal": project.get("goal", ""),
        "description": project.get("description", "")
    }

    project_json = json.dumps(project_info, ensure_ascii=False, indent=2)

    # Track 정보
    track_info = ""
    if track:
        track_info = f"""### 소속 Track
- ID: {track.get('entity_id', '')}
- 이름: {track.get('entity_name', '')}
- 핵심 질문: {track.get('core_question', '')}
"""
    else:
        track_info = "소속 Track 정보 없음\n"

    return f"""## Project 정보

```json
{project_json}
```

---

{track_info}

---

## 가설 소스

다음 정보를 기반으로 검증 가능한 Hypothesis를 설계해주세요:

**가설 텍스트/기대 효과:**
> {hypothesis_source}

---

## 요청

위 Project에 대한 Hypothesis를 생성해주세요.

### 핵심 요구사항

1. **hypothesis_question은 반드시 ?로 끝나야 합니다**
2. **success_criteria는 구체적이고 측정 가능해야 합니다**
   - 숫자, 기간, 표본 크기 포함 권장
3. **failure_criteria는 피벗/중단 결정의 트리거가 되어야 합니다**
4. **measurement는 어디서/무엇을/어떻게를 명확히 정의해야 합니다**
5. **horizon은 4자리 연도여야 합니다** (예: "2026")
6. **confidence는 0.0-1.0 범위여야 합니다** (보통 0.5-0.7)

### Evidence 운영 가능성

가설이 검증되었을 때 B Score를 계산할 수 있도록:
- normalized_delta 계산 방법을 제안해주세요
- 필요한 sample_size를 추정해주세요
- counterfactual 유형을 선택해주세요 (none / before_after / controlled)
- 가능한 confounders(교란 변수)를 식별해주세요

JSON만 반환하세요. Markdown 코드블록을 사용하지 마세요."""


def build_simple_hypothesis_seeder_prompt(
    project_name: str,
    expected_impact_statement: str,
    conditions_3y: Optional[List[str]] = None,
    horizon: str = "2026"
) -> str:
    """
    간단한 Hypothesis 생성 프롬프트 (최소 정보로)

    Args:
        project_name: 프로젝트 이름
        expected_impact_statement: 기대 효과 설명
        conditions_3y: 3년 조건 목록
        horizon: 기본 horizon 연도

    Returns:
        프롬프트 문자열
    """
    conditions_text = ", ".join(conditions_3y) if conditions_3y else "없음"

    return f"""## Project 정보

- 이름: {project_name}
- 3Y Conditions: {conditions_text}
- 기대 효과: {expected_impact_statement}
- 기본 Horizon: {horizon}

---

## 요청

위 Project에 대한 검증 가능한 Hypothesis를 생성해주세요.

### 핵심 요구사항

1. **hypothesis_question은 반드시 ?로 끝나야 합니다**
2. success_criteria는 구체적이고 측정 가능해야 합니다
3. failure_criteria는 피벗/중단 트리거가 되어야 합니다
4. measurement는 어디서/무엇을/어떻게 명확히
5. horizon은 4자리 연도 (예: "{horizon}")
6. confidence는 0.0-1.0 범위

### 출력 형식 (JSON)

{{
  "entity_name": "가설 이름",
  "hypothesis_question": "검증 질문?",
  "success_criteria": "성공 기준",
  "failure_criteria": "실패 기준",
  "measurement": "측정 방법",
  "confidence": 0.7,
  "horizon": "{horizon}",
  "reasoning": {{
    "hypothesis_derivation": "도출 근거"
  }},
  "evidence_readiness": {{
    "normalized_delta_method": "계산 방법",
    "suggested_sample_size": 50,
    "counterfactual_type": "before_after",
    "confounders": []
  }}
}}

JSON만 반환하세요."""
