"""
Task Schema Auto-fill Prompts

Task의 누락된 필드를 채우는 LLM 프롬프트.
n8n 워크플로우 Phase 1 통합용.

핵심 원칙:
- derived 필드는 제안하지 않음 (validates 금지)
- enum 값은 schema_constants.yaml 기준 강제
- 필드 누락 → LLM 제안 → pending → human approve
"""

from typing import Dict, Any, Optional, List

TASK_SCHEMA_SYSTEM_PROMPT = """당신은 LOOP Vault Task 스키마 전문가입니다.

## 역할
- Task 엔티티의 누락된 필드를 제안합니다
- 전략 컨텍스트(Track, Condition)를 참조하여 적절한 값을 추론합니다
- 모든 제안에 근거를 함께 제시합니다

## 제약 (CRITICAL)
1. **validates 필드 제안 금지** - Task는 전략 판단에 개입하지 않음
2. **enum 값은 정해진 목록에서만 선택**
   - status: todo, doing, hold, done, blocked
   - priority: critical, high, medium, low
   - type: dev, bug, strategy, research, ops
   - target_project: sosi, kkokkkok, loop-api, loop (type이 dev/bug일 때만)
3. **assignee는 정해진 목록에서만 선택**: 김은향, 한명학
4. **conditions_3y는 1개 이상 필수**: cond-a, cond-b, cond-c, cond-d, cond-e

## 출력 형식
반드시 JSON 형식으로 출력하세요. Markdown 코드블록 없이 순수 JSON만 반환합니다."""


def build_task_schema_prompt(
    task: Dict[str, Any],
    issues: List[str],
    strategy_context: Optional[Dict[str, Any]] = None
) -> str:
    """
    Task 스키마 채움 프롬프트 생성

    Args:
        task: Task 엔티티 정보
        issues: 감지된 이슈 목록 (missing_assignee, missing_conditions_3y 등)
        strategy_context: 전략 계층 컨텍스트 (tracks, conditions 등)

    Returns:
        완성된 프롬프트 문자열
    """
    import json

    # Task 정보 포맷팅
    task_json = json.dumps(task, ensure_ascii=False, indent=2)

    # 이슈 목록
    issues_text = ", ".join(issues) if issues else "없음"

    # 전략 컨텍스트
    strategy_text = ""
    if strategy_context:
        conditions = strategy_context.get("conditions", [])
        tracks = strategy_context.get("tracks", [])

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
    else:
        strategy_text = "전략 컨텍스트 정보 없음\n"

    # 오늘 날짜
    from datetime import date
    today = date.today().isoformat()

    return f"""## Task 정보

```json
{task_json}
```

## 감지된 이슈
{issues_text}

---

## 전략 컨텍스트

{strategy_text}

---

## 요청

위 Task의 누락된 필드를 제안해주세요.

### 출력 형식 (JSON)

{{
  "suggested_fields": {{
    "conditions_3y": ["cond-X"],
    "assignee": "김은향 또는 한명학",
    "due": "YYYY-MM-DD",
    "priority": "critical|high|medium|low",
    "type": "dev|bug|strategy|research|ops",
    "target_project": "sosi|kkokkkok|loop-api|loop"
  }},
  "reasoning": {{
    "conditions_3y": "판단 근거",
    "assignee": "판단 근거",
    "due": "판단 근거"
  }}
}}

### 판단 기준

**conditions_3y 선택:**
- cond-a: Product-Market Fit (제품-시장 적합성)
- cond-b: Revenue Model (수익 모델)
- cond-c: Scalability (확장성)
- cond-d: Team (팀)
- cond-e: Tech/Infrastructure (기술/인프라)

Task 이름, notes, project_id, tags를 분석하여 가장 관련 있는 Condition을 선택하세요.

**assignee 선택:**
- 김은향: 전략, 시스템 설계, 데이터, 개발, 기술 인프라 작업
- 한명학: 팀 운영, 외부 영업/파트너십, 서류/행정, 코치 관리 작업

**due 선택:**
- 오늘 날짜: {today}
- Task 복잡도에 따라 합리적인 마감일 제안
- 간단한 작업: 1-3일
- 중간 작업: 1-2주
- 복잡한 작업: 2-4주

**⚠️ 금지 사항:**
- validates 필드는 절대 제안하지 마세요 (Task는 전략 판단 금지)
- 정해진 enum 값 외의 값을 사용하지 마세요

JSON만 반환하세요. Markdown 코드블록을 사용하지 마세요."""


def build_simple_task_schema_prompt(
    task_name: str,
    project_id: str,
    issues: List[str]
) -> str:
    """
    간단한 Task 스키마 프롬프트 (최소 정보로)

    Args:
        task_name: Task 이름
        project_id: 소속 Project ID
        issues: 감지된 이슈 목록

    Returns:
        프롬프트 문자열
    """
    from datetime import date
    today = date.today().isoformat()
    issues_text = ", ".join(issues) if issues else "없음"

    return f"""## Task 정보

- 이름: {task_name}
- Project: {project_id}
- 감지된 이슈: {issues_text}

---

## 요청

위 Task의 누락된 필드를 제안해주세요.

### 출력 형식 (JSON)

{{
  "suggested_fields": {{
    "conditions_3y": ["cond-X"],
    "assignee": "김은향 또는 한명학",
    "due": "YYYY-MM-DD"
  }},
  "reasoning": {{
    "conditions_3y": "판단 근거",
    "assignee": "판단 근거",
    "due": "판단 근거"
  }}
}}

### 선택지

**conditions_3y**: cond-a (PMF), cond-b (수익), cond-c (확장), cond-d (팀), cond-e (기술)
**assignee**: 김은향 (전략/개발/기술), 한명학 (팀운영/영업/행정)
**오늘 날짜**: {today}

JSON만 반환하세요."""
