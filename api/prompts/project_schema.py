"""
Project Schema Auto-fill Prompts

Project의 누락된 필드를 채우는 LLM 프롬프트.
n8n 워크플로우 Phase 2 통합용.

핵심 원칙:
- derived 필드는 제안하지 않음 (validated_by, realized_sum 금지)
- enum 값은 schema_constants.yaml 기준 강제
- Impact 필드는 별도 엔드포인트 (project_impact) 사용
"""

from typing import Dict, Any, Optional, List

PROJECT_SCHEMA_SYSTEM_PROMPT = """당신은 LOOP Vault Project 스키마 전문가입니다.

## 역할
- Project 엔티티의 누락된 필드를 제안합니다
- 전략 컨텍스트(Track, Condition, Hypothesis)를 참조하여 적절한 값을 추론합니다
- 모든 제안에 근거를 함께 제시합니다

## 제약 (CRITICAL)
1. **derived 필드 제안 금지**
   - validated_by: Evidence에서 역인덱스 계산
   - realized_sum: 하위 Project B 집계로 계산
2. **enum 값은 정해진 목록에서만 선택**
   - status: planning, active, paused, done, cancelled
   - priority_flag: critical, high, medium, low
3. **owner는 정해진 목록에서만 선택**: 김은향, 한명학
4. **parent_id는 Track ID만 가능**: trk-1 ~ trk-6
5. **conditions_3y는 1개 이상 필수**: cond-a ~ cond-e

## Impact 관련 필드
- expected_impact, realized_impact는 이 엔드포인트에서 다루지 않음
- /api/ai/infer/project_impact, /api/ai/infer/evidence 사용

## 출력 형식
반드시 JSON 형식으로 출력하세요. Markdown 코드블록 없이 순수 JSON만 반환합니다."""


def build_project_schema_prompt(
    project: Dict[str, Any],
    issues: List[str],
    strategy_context: Optional[Dict[str, Any]] = None
) -> str:
    """
    Project 스키마 채움 프롬프트 생성

    Args:
        project: Project 엔티티 정보
        issues: 감지된 이슈 목록 (missing_owner, missing_parent_id 등)
        strategy_context: 전략 계층 컨텍스트

    Returns:
        완성된 프롬프트 문자열
    """
    import json

    # Project 정보 포맷팅
    project_json = json.dumps(project, ensure_ascii=False, indent=2)

    # 이슈 목록
    issues_text = ", ".join(issues) if issues else "없음"

    # 전략 컨텍스트
    strategy_text = ""
    if strategy_context:
        conditions = strategy_context.get("conditions", [])
        tracks = strategy_context.get("tracks", [])
        hypotheses = strategy_context.get("hypotheses", [])

        if conditions:
            strategy_text += "### 3Y Conditions\n"
            for c in conditions:
                strategy_text += f"- {c.get('entity_id')}: {c.get('entity_name')}\n"
            strategy_text += "\n"

        if tracks:
            strategy_text += "### 12M Tracks\n"
            for t in tracks:
                strategy_text += f"- {t.get('entity_id')}: {t.get('entity_name')}\n"
            strategy_text += "\n"

        if hypotheses:
            strategy_text += "### Hypotheses (최대 15개)\n"
            for h in hypotheses[:15]:
                strategy_text += f"- {h.get('entity_id')}: {h.get('entity_name')}\n"
            if len(hypotheses) > 15:
                strategy_text += f"... ({len(hypotheses) - 15} more)\n"
            strategy_text += "\n"
    else:
        strategy_text = "전략 컨텍스트 정보 없음\n"

    return f"""## Project 정보

```json
{project_json}
```

## 감지된 이슈
{issues_text}

---

## 전략 컨텍스트

{strategy_text}

---

## 요청

위 Project의 누락된 필드를 제안해주세요.

### 출력 형식 (JSON)

{{
  "suggested_fields": {{
    "owner": "김은향 또는 한명학",
    "parent_id": "trk-N",
    "conditions_3y": ["cond-X"],
    "validates": ["hyp-X-XX"],
    "primary_hypothesis_id": "hyp-X-XX",
    "condition_contributes": [
      {{
        "to": "cond-X",
        "weight": 0.0-1.0,
        "description": "기여 설명"
      }}
    ],
    "track_contributes": [
      {{
        "to": "trk-N",
        "weight": 0.0-1.0,
        "description": "Secondary Track 기여 (선택사항)"
      }}
    ]
  }},
  "reasoning": {{
    "owner": "판단 근거",
    "parent_id": "판단 근거",
    "conditions_3y": "판단 근거",
    "validates": "판단 근거",
    "condition_contributes": "판단 근거"
  }}
}}

### 판단 기준

**owner 선택:**
- 김은향: 전략, 시스템 설계, 데이터, 개발, 기술 인프라 프로젝트
- 한명학: 팀 운영, 외부 영업/파트너십, 코치 관리, 행정 프로젝트

**parent_id (Track) 선택:**
- trk-1 ~ trk-6 중 프로젝트가 속하는 Track

**conditions_3y 선택:**
- cond-a: Product-Market Fit (제품-시장 적합성)
- cond-b: Revenue Model (수익 모델)
- cond-c: Scalability (확장성)
- cond-d: Team (팀)
- cond-e: Tech/Infrastructure (기술/인프라)

**validates 선택 (선택사항):**
- 이 프로젝트가 검증하려는 가설 ID 목록
- 60_Hypotheses에서 관련 가설 선택
- 가설이 없으면 빈 배열 []

**primary_hypothesis_id 선택 (선택사항):**
- validates 중 핵심 가설 1개
- validates가 비어있으면 null

**condition_contributes (필수):**
- 각 Condition에 대한 기여도 (weight 합계 ≤ 1.0)
- 최소 1개 이상의 Condition에 기여

**track_contributes (선택):**
- parent_id 외 추가 Track에 대한 기여
- 없으면 빈 배열 []

**⚠️ 금지 사항:**
- validated_by 필드는 제안하지 마세요 (derived 필드)
- realized_sum 필드는 제안하지 마세요 (derived 필드)
- expected_impact, realized_impact는 이 엔드포인트에서 다루지 않음

JSON만 반환하세요. Markdown 코드블록을 사용하지 마세요."""


def build_simple_project_schema_prompt(
    project_name: str,
    issues: List[str]
) -> str:
    """
    간단한 Project 스키마 프롬프트 (최소 정보로)

    Args:
        project_name: Project 이름
        issues: 감지된 이슈 목록

    Returns:
        프롬프트 문자열
    """
    issues_text = ", ".join(issues) if issues else "없음"

    return f"""## Project 정보

- 이름: {project_name}
- 감지된 이슈: {issues_text}

---

## 요청

위 Project의 누락된 필드를 제안해주세요.

### 출력 형식 (JSON)

{{
  "suggested_fields": {{
    "owner": "김은향 또는 한명학",
    "parent_id": "trk-N",
    "conditions_3y": ["cond-X"],
    "condition_contributes": [
      {{"to": "cond-X", "weight": 0.6, "description": "기여 설명"}}
    ]
  }},
  "reasoning": {{
    "owner": "판단 근거",
    "parent_id": "판단 근거",
    "conditions_3y": "판단 근거"
  }}
}}

### 선택지

**owner**: 김은향 (전략/개발/기술), 한명학 (팀운영/영업/행정)
**parent_id**: trk-1 ~ trk-6
**conditions_3y**: cond-a (PMF), cond-b (수익), cond-c (확장), cond-d (팀), cond-e (기술)

JSON만 반환하세요."""
