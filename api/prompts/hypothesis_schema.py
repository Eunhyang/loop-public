"""
Hypothesis Schema Validation Prompts

Hypothesis 엔티티의 품질과 A/B 모델 운영 가능성을 검증하는 LLM 프롬프트.

검증 체크리스트:
A. 구조 검증 (스키마/온톨로지 정합성)
   - ID 패턴: hyp-{track}-{seq} 유일성
   - parent_id = trk-N (Track 소속)
   - 파일 경로: 60_Hypotheses/{horizon}/

B. 품질 검증 (A/B 모델 운영 가능성)
   - hypothesis_question: 질문 형태 ('?'로 끝나는지)
   - success_criteria: 성공 판정 기준 존재
   - failure_criteria: 실패 판정 기준 존재
   - measurement: 측정 가능한 metric 명시

C. 관계 검증 (Project 연결)
   - Project.validates에 hyp-ID 포함 여부
   - primary_hypothesis_id ∈ validates[] 정합성
   - validated_by 저장 금지 (Derived)

D. Evidence 운영 가능성 검증
   - normalized_delta 계산 방법
   - source_refs 출처
   - sample_size 정의
   - counterfactual 설정
   - confounders 식별
"""

from typing import Dict, Any, Optional, List

HYPOTHESIS_SCHEMA_SYSTEM_PROMPT = """당신은 LOOP Vault Hypothesis 스키마 전문가입니다.

## 역할
- Hypothesis 엔티티의 품질과 A/B 모델 운영 가능성을 검증합니다
- 누락되거나 부족한 필드를 제안합니다
- 모든 제안에 근거를 함께 제시합니다

## LOOP A/B Score 모델 이해

### A Score (Expected Impact)
- Project가 Hypothesis를 검증할 때 기대하는 영향
- tier × magnitude × confidence로 계산
- Hypothesis가 명확할수록 confidence가 높아짐

### B Score (Realized Impact)
- 실제 Evidence 기반으로 계산
- normalized_delta × evidence_strength × attribution_share
- Hypothesis의 measurement가 명확해야 B Score 계산 가능

## 검증 체크리스트

### A. 구조 검증
1. parent_id가 Track ID (trk-N) 형식인가?
2. horizon이 4자리 연도인가?
3. ID 패턴이 hyp-{track}-{seq} 형식인가?

### B. 품질 검증 (CRITICAL)
1. hypothesis_question이 질문 형태('?'로 끝남)인가?
2. success_criteria가 구체적이고 측정 가능한가?
3. failure_criteria가 구체적이고 측정 가능한가?
4. measurement가 어디서/무엇을/어떻게를 포함하는가?

### C. Evidence 운영 가능성
1. normalized_delta 계산 방법이 정의 가능한가?
2. sample_size가 명시되어 있는가?
3. counterfactual(대조군) 설정이 가능한가?
4. confounders(교란 변수)가 식별되었는가?

## 제약 (CRITICAL)
1. **validated_by 필드 제안 금지** - Derived 필드 (빌드 타임에 계산)
2. **enum 값은 정해진 목록에서만 선택**
   - evidence_status: assumed, supported, rejected, inconclusive
   - confidence: 0.0 ~ 1.0 (소수)

## 출력 형식
반드시 JSON 형식으로 출력하세요. Markdown 코드블록 없이 순수 JSON만 반환합니다."""


def build_hypothesis_schema_prompt(
    hypothesis: Dict[str, Any],
    issues: List[str],
    related_projects: Optional[List[Dict[str, Any]]] = None
) -> str:
    """
    Hypothesis 스키마 검증 프롬프트 생성

    Args:
        hypothesis: Hypothesis 엔티티 정보
        issues: 감지된 이슈 목록
        related_projects: 관련 Project 목록 (validates 연결 확인용)

    Returns:
        완성된 프롬프트 문자열
    """
    import json

    # Hypothesis 정보 포맷팅
    hyp_json = json.dumps(hypothesis, ensure_ascii=False, indent=2)

    # 이슈 목록
    issues_text = "\n".join([f"- {issue}" for issue in issues]) if issues else "- 감지된 이슈 없음"

    # 관련 Project 정보
    projects_text = ""
    if related_projects:
        projects_text = "### 관련 Projects\n"
        for p in related_projects:
            validates = p.get("validates", [])
            projects_text += f"- {p.get('entity_id')}: {p.get('entity_name')}\n"
            projects_text += f"  validates: {validates}\n"
    else:
        projects_text = "관련 Project 정보 없음\n"

    return f"""## Hypothesis 정보

```json
{hyp_json}
```

## 감지된 이슈

{issues_text}

---

## 관련 엔티티

{projects_text}

---

## 요청

위 Hypothesis의 품질과 A/B 모델 운영 가능성을 검증해주세요.

### 출력 형식 (JSON)

{{
  "validation": {{
    "structure": {{
      "is_valid": true,
      "issues": ["이슈 목록"]
    }},
    "quality": {{
      "is_valid": true,
      "issues": ["이슈 목록"],
      "score": 0.8
    }},
    "evidence_readiness": {{
      "is_valid": true,
      "issues": ["이슈 목록"],
      "normalized_delta_method": "계산 방법 설명",
      "suggested_sample_size": 50,
      "counterfactual_type": "none | before_after | controlled",
      "confounders": ["교란 변수 목록"]
    }}
  }},
  "suggested_fields": {{
    "success_criteria": "개선된 성공 기준 (필요시)",
    "failure_criteria": "개선된 실패 기준 (필요시)",
    "measurement": "개선된 측정 방법 (필요시)",
    "confidence": 0.7
  }},
  "project_link_suggestion": {{
    "should_link": true,
    "suggested_project_ids": ["prj-XXX"],
    "reasoning": "연결 제안 근거"
  }},
  "reasoning": {{
    "quality_assessment": "품질 평가 근거",
    "evidence_assessment": "Evidence 운영 가능성 평가 근거"
  }}
}}

### 평가 기준

**품질 점수 (quality.score):**
- 1.0: 모든 기준 충족, 즉시 검증 가능
- 0.8: 대부분 충족, 약간의 개선 필요
- 0.6: 기본 충족, 상당한 개선 필요
- 0.4: 부분 충족, 재작성 권장
- 0.2 이하: 미충족, 재작성 필수

**Evidence 운영 가능성:**
- normalized_delta 계산: (목표 대비 달성률) 또는 (before-after 차이)
- counterfactual 유형:
  - none: 대조군 없음
  - before_after: 적용 전/후 비교
  - controlled: 대조군과 실험군 비교

**⚠️ 금지 사항:**
- validated_by 필드는 절대 제안하지 마세요 (Derived 필드)
- 정해진 enum 값 외의 값을 사용하지 마세요

JSON만 반환하세요. Markdown 코드블록을 사용하지 마세요."""


def build_simple_hypothesis_schema_prompt(
    hypothesis_name: str,
    hypothesis_question: str,
    success_criteria: str,
    failure_criteria: str,
    measurement: str,
    issues: List[str]
) -> str:
    """
    간단한 Hypothesis 스키마 프롬프트 (최소 정보로)

    Args:
        hypothesis_name: 가설 이름
        hypothesis_question: 가설 질문
        success_criteria: 성공 기준
        failure_criteria: 실패 기준
        measurement: 측정 방법
        issues: 감지된 이슈 목록

    Returns:
        프롬프트 문자열
    """
    issues_text = ", ".join(issues) if issues else "없음"

    return f"""## Hypothesis 정보

- 이름: {hypothesis_name}
- 질문: {hypothesis_question}
- 성공 기준: {success_criteria}
- 실패 기준: {failure_criteria}
- 측정 방법: {measurement}
- 감지된 이슈: {issues_text}

---

## 요청

위 Hypothesis의 품질과 A/B 모델 운영 가능성을 검증해주세요.

### 출력 형식 (JSON)

{{
  "validation": {{
    "quality": {{
      "is_valid": true,
      "issues": ["이슈 목록"],
      "score": 0.8
    }},
    "evidence_readiness": {{
      "normalized_delta_method": "계산 방법",
      "suggested_sample_size": 50,
      "counterfactual_type": "before_after",
      "confounders": ["교란 변수"]
    }}
  }},
  "suggested_fields": {{
    "success_criteria": "개선안 (필요시)",
    "failure_criteria": "개선안 (필요시)",
    "measurement": "개선안 (필요시)",
    "confidence": 0.7
  }},
  "reasoning": {{
    "quality_assessment": "품질 평가",
    "evidence_assessment": "Evidence 가능성"
  }}
}}

### 평가 포인트

1. **질문 형태**: hypothesis_question이 '?'로 끝나는 명확한 질문인가?
2. **성공/실패 기준**: 구체적이고 측정 가능한가?
3. **측정 방법**: 어디서/무엇을/어떻게가 명확한가?
4. **Evidence 계산**: normalized_delta를 어떻게 계산할 수 있는가?

JSON만 반환하세요."""
