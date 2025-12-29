"""
Evidence Inference Prompts (B Score - Realized Impact)

회고 문서에서 Evidence 필드를 추출하는 LLM 프롬프트.
v5.3 품질 메타 필드 7개 포함:
- provenance, source_refs, sample_size, measurement_quality,
- counterfactual, confounders, query_version

기존 realized_impact.py와 통합 가능하나, Evidence 전용 필드를 위해 분리.
"""

from typing import Dict, Any, Optional, List

EVIDENCE_SYSTEM_PROMPT = """당신은 프로젝트 회고 문서를 분석하여 Evidence 객체로 변환하는 전문가입니다.

## 역할
- 회고 문서에서 정량/정성 데이터를 추출합니다
- Evidence 필드 값을 제안합니다
- 품질 메타 필드를 판단하여 데이터 신뢰도를 평가합니다
- 모든 판단에는 근거를 명확히 제시합니다

## 제약
- 점수를 직접 계산하지 마세요. 필드 값만 제안합니다.
- 추측하지 마세요. 문서에 없는 정보는 null로 표시합니다.
- 낙관적 편향을 피하세요. 증거가 불충분하면 evidence_strength를 낮게 설정합니다.
- 품질 메타 필드는 데이터 신뢰도 평가의 핵심입니다. 신중하게 판단하세요.

## 출력 형식
반드시 JSON 형식으로 출력하세요. Markdown 코드블록 없이 순수 JSON만 반환합니다."""


def build_evidence_prompt(
    project: Dict[str, Any],
    retrospective_content: Optional[str] = None,
    actual_result: Optional[str] = None,
    hypotheses: Optional[List[Dict[str, Any]]] = None
) -> str:
    """
    Evidence 추론 프롬프트 생성

    Args:
        project: 프로젝트 정보
        retrospective_content: 회고 문서 내용
        actual_result: 실제 결과 요약
        hypotheses: 연결된 가설 목록

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

    # Expected Impact (있으면)
    expected = project.get('expected_impact', {})
    if expected and expected.get('tier'):
        project_info += f"""
### 계획 시 Expected Impact
- tier: {expected.get('tier', 'N/A')}
- magnitude: {expected.get('impact_magnitude', 'N/A')}
- confidence: {expected.get('confidence', 'N/A')}
"""

    # validates (연결된 가설)
    validates = project.get('validates', [])
    if validates:
        project_info += f"""
### 연결된 가설
- validates: {', '.join(validates)}
"""

    # 가설 정보
    hyp_section = ""
    if hypotheses:
        hyp_section = """
### 검증 대상 가설 상세
"""
        for hyp in hypotheses[:3]:  # 최대 3개
            hyp_section += f"""- {hyp.get('entity_id', 'N/A')}: {hyp.get('entity_name', 'N/A')}
  - statement: {hyp.get('statement', hyp.get('description', 'N/A'))}
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

    # 실제 결과
    result_section = ""
    if actual_result:
        result_section = f"""## 실제 결과

{actual_result}
"""

    # 출력 형식 가이드 (v5.3 품질 메타 포함)
    output_format = """
---

## 요청

위 정보를 분석하여 Evidence 필드를 추출해주세요.

### 출력 형식 (JSON)

{
  "normalized_delta": {
    "value": 0.0-1.0,
    "reasoning": "계산 근거 (실제값/목표값)"
  },
  "evidence_strength": {
    "value": "strong|medium|weak",
    "reasoning": "판단 근거"
  },
  "attribution_share": {
    "value": 0.0-1.0,
    "reasoning": "기여도 판단 근거 (default 1.0)"
  },
  "impact_metric": "측정 지표명 (예: revenue, retention_d7, nps)",
  "learning_value": {
    "value": "high|medium|low",
    "reasoning": "학습 가치 판단 근거"
  },
  "validated_hypotheses": [
    {
      "hypothesis_id": "hyp-X-XX",
      "evidence": "확증 근거"
    }
  ],
  "falsified_hypotheses": [
    {
      "hypothesis_id": "hyp-X-XX",
      "evidence": "반증 근거"
    }
  ],
  "confirmed_insights": [
    {
      "insight": "확인된 인사이트",
      "evidence": "확인 근거"
    }
  ],
  "quality_meta": {
    "provenance": {
      "value": "auto|human|mixed",
      "reasoning": "데이터 출처 판단 근거"
    },
    "source_refs": ["쿼리 URL", "샘플 ID", "데이터 링크"],
    "sample_size": null,
    "measurement_quality": {
      "value": "low|medium|high",
      "reasoning": "측정 품질 판단 근거"
    },
    "counterfactual": {
      "value": "none|before_after|controlled",
      "reasoning": "대조군/비교 유형 판단"
    },
    "confounders": ["외부 변수 1", "외부 변수 2"],
    "query_version": "build_impact_v1.3.0"
  },
  "realized_status": {
    "value": "succeeded|failed_but_high_signal|failed_low_signal|inconclusive",
    "reasoning": "판정 근거"
  },
  "summary": "1-2문장 핵심 요약"
}

### 판단 기준

**normalized_delta 계산:**
- normalized_delta = 실제값 / 목표값
- 목표 없으면 → 합리적 기대치 기준
- 1.0 초과 → 1.0으로 cap
- 정보 없으면 → null

**evidence_strength 판단:**
- strong (×1.0): 정량 데이터 명확, 인과관계 분명, A/B 테스트 등 통제된 실험
- medium (×0.7): 정성적 증거, 합리적 추론 가능, 통계적 유의성 부족
- weak (×0.4): 간접 증거만, 외부 변수 영향 큼, 데이터 품질 문제

**learning_value 판단:**
- high: 가설이 명확히 검증/반증됨, 전략 옵션 줄어듦, 다음 의사결정이 쉬워짐
- medium: 일부 가설만 검증됨, 추가 실험 필요
- low: 외부 변수 영향 큼, 데이터 품질 낮음, 실험 설계 오류

**품질 메타 필드 (v5.3):**
- provenance: 데이터가 자동 수집(auto), 사람이 입력(human), 혼합(mixed)인지
- source_refs: 원본 데이터 출처 (쿼리 URL, 샘플 ID 등)
- sample_size: 표본 크기 (모르면 null)
- measurement_quality: 측정 방법의 신뢰도
- counterfactual: 대조군 비교 유형 (none=비교 없음, before_after=전후 비교, controlled=통제 실험)
- confounders: 결과에 영향을 줄 수 있는 외부 변수들
- query_version: 데이터 추출/계산에 사용된 쿼리나 스크립트 버전

**realized_status 판정:**
- succeeded: normalized_delta >= 0.8
- failed_but_high_signal: normalized_delta < 0.5 AND learning_value = high
- failed_low_signal: normalized_delta < 0.5 AND learning_value = low
- inconclusive: attribution_share < 0.3 OR 데이터 불충분

JSON만 반환하세요. Markdown 코드블록을 사용하지 마세요."""

    return f"""{project_info}
{hyp_section}
{retro_section}
{result_section}
{output_format}"""


def build_simple_evidence_prompt(
    project_name: str,
    goal: str,
    actual_result: str,
    brief_retro: Optional[str] = None
) -> str:
    """
    간단한 Evidence 프롬프트 (최소 정보로)

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

위 정보를 기반으로 Evidence 필드를 추출해주세요.

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
  "attribution_share": {{
    "value": 0.0-1.0,
    "reasoning": "기여도 판단"
  }},
  "quality_meta": {{
    "provenance": {{
      "value": "auto|human|mixed",
      "reasoning": "데이터 출처"
    }},
    "measurement_quality": {{
      "value": "low|medium|high",
      "reasoning": "측정 품질"
    }},
    "counterfactual": {{
      "value": "none|before_after|controlled",
      "reasoning": "대조군 유형"
    }}
  }},
  "realized_status": {{
    "value": "succeeded|failed_but_high_signal|failed_low_signal|inconclusive",
    "reasoning": "판정 근거"
  }},
  "summary": "1-2문장 핵심 요약"
}}

JSON만 반환하세요. Markdown 코드블록을 사용하지 마세요."""
