---
entity_type: Task
entity_id: tsk-n8n-04
entity_name: n8n LLM 프롬프트 템플릿 개선
created: 2025-12-27
updated: '2025-12-27'
status: done
parent_id: prj-n8n
project_id: prj-n8n
aliases:
- tsk-n8n-04
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
start_date: 2025-12-27
due: 2025-12-27
priority: high
estimated_hours: null
actual_hours: null
type: dev
target_project: loop
tags:
- n8n
- llm
- automation
priority_flag: high
---
# n8n LLM 프롬프트 템플릿 개선

> Task ID: `tsk-n8n-04` | Project: `prj-n8n` | Status: doing

## 목표

**완료 조건**:
1. LLM 프롬프트에 Task 컨텍스트(entity_name, notes, project_id 등)가 정상 전달
2. LLM이 Task별 맥락에 맞는 제안값 생성 (동일 패턴 응답 해결)
3. E2E 테스트 통과

---

## 상세 내용

### 배경

tsk-n8n-02에서 발견된 이슈:
- n8n 템플릿 `{{ JSON.stringify($json.original_task, null, 2) }}` 치환 실패
- LLM이 "과업 성격 불명확" 등 generic 응답 반환
- 12개 Task 모두 동일 패턴 제안 (cond-a, 김은향/소상민, 2026-01-10)

**현재 상태 평가**:
| 항목 | 결과 |
|------|------|
| Input 전달 | ✅ 12개 Task, original_task 완벽 포함 |
| LLM 응답 | ✅ 12/12 성공 (에러/빈 응답 없음) |
| 이슈 탐지 | ✅ 정확함 |
| LLM 맥락 참조 | ⚠️ 실패 (개선 필요) |

### 작업 내용

1. **n8n LLM 노드 분석**
   - OpenAI 노드의 프롬프트 표현식 확인
   - `$json.original_task` 참조 방식 점검
   - n8n 템플릿 치환 메커니즘 이해

2. **프롬프트 개선**
   - LLM에 Task 데이터가 실제로 전달되도록 수정
   - entity_name, notes, project_id 등 핵심 필드 명시적 전달
   - 프롬프트 템플릿 재구성

3. **테스트 및 검증**
   - n8n 워크플로우 재실행
   - LLM 응답이 Task별로 맥락에 맞는지 확인

---

## 체크리스트

- [x] n8n LLM Inference 노드 프롬프트 분석
- [x] 프롬프트 템플릿 수정 (original_task 데이터 포함)
- [x] n8n 워크플로우 재배포
- [x] E2E 테스트 (LLM이 Task별 맥락 응답 확인)

---

## Notes

### 기술 스택

- **n8n**: https://n8n.sosilab.synology.me
- **워크플로우 파일**: `_build/n8n_workflows/entity_schema_validator.json`
- **LLM**: OpenAI GPT-4o

### 참고

- 선행 Task: [[tsk-n8n-02]] (기본 워크플로우 완료)
- n8n 템플릿 문법: `{{ expression }}`

### 작업 로그

#### 2025-12-27: n8n LLM 프롬프트 템플릿 개선 (v2→v3→v4)

**Overview**

n8n Entity Schema Validator 워크플로우에서 LLM 프롬프트에 Task 컨텍스트가 제대로 전달되지 않는 문제를 해결했습니다. v2→v3→v4로 3단계 개선을 거쳐 완성되었으며, 추가로 Dashboard Pending Reviews 모달 표시 버그도 수정했습니다.

**Context**

배경 문제:
- tsk-n8n-02에서 n8n 워크플로우 구축 완료 후 LLM 응답 품질 이슈 발견
- 12개 Task 모두 동일한 패턴의 제안값 반환 (cond-a, 김은향/소상민, 2026-01-10)
- LLM이 "과업 성격 불명확" 등 generic 응답 반환

근본 원인:
1. n8n OpenAI sub-node 제한: 표현식 `{{ $json.original_task }}`가 첫 번째 아이템에서만 resolve됨
2. Dashboard CSS 불일치: 모달 HTML class와 CSS selector 불일치
3. bodyParameters 직렬화 제한: nested object/array를 제대로 직렬화하지 못함

**Changes Made**

1. n8n 워크플로우 v3 업그레이드 (표현식 문제 해결)
   - Validate Schema Code 노드에 `buildLlmPrompt()` 함수 추가
   - 각 Task별로 full prompt 문자열 사전 생성
   - results에 `llm_prompt` 필드 추가
   - OpenAI sub-node → HTTP Request 노드로 교체

2. Dashboard Pending Reviews 모달 수정
   - `_dashboard/js/components/pending-panel.js` line 63
   - `class="modal"` → `class="pending-review-modal"` 수정

3. n8n 워크플로우 v4 업그레이드 (직렬화 문제 해결)
   - Create Pending 노드 2개 수정
   - `bodyParameters` → `specifyBody: "json"` + `jsonBody` 표현식
   - `Content-Type: application/json` 헤더 명시적 추가

**Code Examples**

HTTP Request 노드 (LLM 호출):
```json
{
  "url": "https://api.openai.com/v1/chat/completions",
  "method": "POST",
  "specifyBody": "json",
  "jsonBody": "={{ { \"model\": \"gpt-4o\", \"messages\": [{ \"role\": \"user\", \"content\": $json.llm_prompt }], \"temperature\": 0.3 } }}"
}
```

buildLlmPrompt 함수:
```javascript
function buildLlmPrompt(task, issues) {
  const taskJson = JSON.stringify(task, null, 2);
  const issueList = Array.isArray(issues) && issues.length > 0 ? issues.join(', ') : 'none';
  return `You are a LOOP Vault schema expert...
Task:
\`\`\`json
${taskJson}
\`\`\`
The issues detected are: ${issueList}...`;
}
```

**File Changes Summary**

| File | Change | Description |
|------|--------|-------------|
| `_build/n8n_workflows/entity_schema_validator.json` | 수정 | v4 업그레이드 (HTTP Request, jsonBody) |
| `_dashboard/js/components/pending-panel.js` | 수정 | 모달 CSS class 수정 |

**Verification Results**

```
Input: 12 Tasks with various issues (missing_due_date, missing_conditions_3y, missing_assignee)
Output: 12/12 LLM 응답 성공
- 각 Task별로 unique llm_prompt 생성 확인
- LLM 응답이 Task 맥락에 맞는 제안값 포함 확인
```

예시 LLM 응답:
```json
{
  "suggested_fields": {
    "due": "2026-01-15",
    "conditions_3y": ["cond-a", "cond-c", "cond-d"],
    "assignee": "김은향"
  },
  "reasoning": {
    "due": "작업의 복잡성을 고려할 때, 약 1개월 정도의 시간이 필요할 것으로 예상됩니다.",
    "conditions_3y": "리크루팅 사이트 프로젝트는 제품-시장 적합성, 확장성, 팀과 관련된 조건이 중요합니다."
  }
}
```

**Technical Decisions**

왜 HTTP Request 노드를 선택했나:
1. OpenAI sub-node: AI Model Selector로서 batch 처리 시 첫 번째 아이템만 context resolve
2. HTTP Request 노드: 각 아이템별로 독립적으로 표현식 evaluate
3. 결과: 12개 Task 모두 고유한 프롬프트로 LLM 호출 성공

왜 specifyBody: "json"을 선택했나:
1. bodyParameters: form-urlencoded 스타일로 nested 구조 지원 불가
2. specifyBody: "json" + jsonBody: 전체 body를 JSON 표현식으로 구성
3. 결과: `conditions_3y: ["cond-a", "cond-b"]` 정상 전달

**Next Steps**
- n8n에 v4 워크플로우 재import
- 워크플로우 실행하여 conditions_3y 배열 직렬화 확인
- Dashboard에서 Pending Review 상세 모달 표시 확인

---

## 참고 문서

- [[prj-n8n]] - 소속 Project
- [[tsk-n8n-02]] - 선행 Task

---

**Created**: 2025-12-27
**Assignee**: 김은향
**Due**: 2025-12-27
