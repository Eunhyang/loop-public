# n8n LLM 프롬프트 템플릿 개선 (tsk-n8n-04)

## Overview

n8n Entity Schema Validator 워크플로우에서 LLM 프롬프트에 Task 컨텍스트가 제대로 전달되지 않는 문제를 해결했습니다. v2→v3→v4로 3단계 개선을 거쳐 완성되었으며, 추가로 Dashboard Pending Reviews 모달 표시 버그도 수정했습니다.

## Context

### 배경 문제
- tsk-n8n-02에서 n8n 워크플로우 구축 완료 후 LLM 응답 품질 이슈 발견
- 12개 Task 모두 동일한 패턴의 제안값 반환 (cond-a, 김은향/소상민, 2026-01-10)
- LLM이 "과업 성격 불명확" 등 generic 응답 반환

### 근본 원인
1. **n8n OpenAI sub-node 제한**: 표현식 `{{ $json.original_task }}`가 첫 번째 아이템에서만 resolve됨
2. **Dashboard CSS 불일치**: 모달 HTML class와 CSS selector 불일치
3. **bodyParameters 직렬화 제한**: nested object/array를 제대로 직렬화하지 못함

## Changes Made

### 1. n8n 워크플로우 v3 업그레이드 (표현식 문제 해결)

**파일**: `_build/n8n_workflows/entity_schema_validator.json`

**문제**: OpenAI sub-node는 AI 모델 선택용 sub-node로, 표현식이 batch의 첫 번째 아이템만 resolve함

**해결**:
- Validate Schema Code 노드에 `buildLlmPrompt()` 함수 추가
- 각 Task별로 full prompt 문자열 사전 생성
- results에 `llm_prompt` 필드 추가
- OpenAI sub-node → HTTP Request 노드로 교체

```javascript
// Validate Schema 노드 내 buildLlmPrompt 함수
function buildLlmPrompt(task, issues) {
  const taskJson = JSON.stringify(task, null, 2);
  const issueList = Array.isArray(issues) && issues.length > 0 ? issues.join(', ') : 'none';

  return `You are a LOOP Vault schema expert. Given the following Task entity, suggest appropriate values...

Task:
\`\`\`json
${taskJson}
\`\`\`

The issues detected are: ${issueList}
...`;
}
```

### 2. Dashboard Pending Reviews 모달 수정

**파일**: `_dashboard/js/components/pending-panel.js`

**문제**: 모달이 표시되지 않음
- HTML: `class="modal"`
- CSS: `.pending-review-modal.active` selector

**해결**: line 63 수정
```javascript
// Before
<div id="reviewDetailModal" class="modal">

// After
<div id="reviewDetailModal" class="pending-review-modal">
```

### 3. n8n 워크플로우 v4 업그레이드 (직렬화 문제 해결)

**파일**: `_build/n8n_workflows/entity_schema_validator.json`

**문제**: `conditions_3y`가 `[` 또는 `[object Object]`로 전달됨
- `bodyParameters`는 nested object/array를 제대로 직렬화하지 못함

**해결**: Create Pending 노드 2개 모두 수정
```json
// Before
"sendBody": true,
"bodyParameters": {
  "parameters": [
    { "name": "suggested_fields", "value": "={{ $json.deterministic_fixes }}" }
  ]
}

// After
"sendBody": true,
"specifyBody": "json",
"jsonBody": "={{ { \"entity_id\": $json.entity_id, \"entity_type\": $json.entity_type, \"entity_name\": $json.entity_name, \"suggested_fields\": $json.deterministic_fixes, \"reasoning\": $json.reasoning } }}"
```

추가로 `Content-Type: application/json` 헤더 명시적 추가.

## Code Examples

### HTTP Request 노드 (LLM 호출)

```json
{
  "parameters": {
    "url": "https://api.openai.com/v1/chat/completions",
    "method": "POST",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        { "name": "Authorization", "value": "Bearer {{ $env.OPENAI_API_KEY }}" },
        { "name": "Content-Type", "value": "application/json" }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ { \"model\": \"gpt-4o\", \"messages\": [{ \"role\": \"user\", \"content\": $json.llm_prompt }], \"temperature\": 0.3 } }}"
  },
  "id": "call-openai-api",
  "name": "Call OpenAI API",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2
}
```

### Parse LLM Response 노드

```javascript
// OpenAI API 응답 구조: choices[0].message.content
const llmResponse = input.choices?.[0]?.message?.content || '';

let parsed = { suggested_fields: {}, reasoning: {} };

try {
  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = llmResponse;
  const jsonMatch = llmResponse.match(/```json\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  } else {
    const objMatch = llmResponse.match(/\{[\s\S]*\}/);
    if (objMatch) jsonStr = objMatch[0];
  }
  parsed = JSON.parse(jsonStr);
} catch (e) {
  parsed = {
    suggested_fields: {},
    reasoning: { error: `Failed to parse LLM response: ${e.message}` }
  };
}
```

## Verification Results

### n8n 워크플로우 테스트 (v3)

```
Input: 12 Tasks with various issues
- missing_due_date
- missing_conditions_3y
- missing_assignee

Output: 12/12 LLM 응답 성공
- 각 Task별로 unique llm_prompt 생성 확인
- LLM 응답이 Task 맥락에 맞는 제안값 포함 확인
```

**예시 LLM 응답**:
```json
{
  "suggested_fields": {
    "due": "2026-01-15",
    "conditions_3y": ["cond-a", "cond-c", "cond-d"],
    "assignee": "김은향"
  },
  "reasoning": {
    "due": "작업의 복잡성을 고려할 때, 피드백 반영 작업은 약 1개월 정도의 시간이 필요할 것으로 예상됩니다.",
    "conditions_3y": "리크루팅 사이트 프로젝트는 제품-시장 적합성, 확장성, 팀과 관련된 조건이 중요합니다.",
    "assignee": "김은향님이 이미 할당되어 있으므로 그대로 유지합니다."
  }
}
```

### v4 배포 대기

- v4 워크플로우 JSON 수정 완료
- n8n에 재import 후 `conditions_3y` 배열 직렬화 확인 필요

## Technical Decisions

### 왜 HTTP Request 노드를 선택했나?

1. **OpenAI sub-node**: AI Model Selector로서 batch 처리 시 첫 번째 아이템만 context resolve
2. **HTTP Request 노드**: 각 아이템별로 독립적으로 표현식 evaluate
3. **결과**: 12개 Task 모두 고유한 프롬프트로 LLM 호출 성공

### 왜 specifyBody: "json"을 선택했나?

1. **bodyParameters**: form-urlencoded 스타일로 nested 구조 지원 불가
2. **specifyBody: "json" + jsonBody**: 전체 body를 JSON 표현식으로 구성
3. **결과**: `conditions_3y: ["cond-a", "cond-b"]` 정상 전달

## Next Steps

1. n8n에 v4 워크플로우 재import
2. 워크플로우 실행하여 `conditions_3y` 배열 직렬화 확인
3. Dashboard에서 Pending Review 상세 모달 표시 확인
4. tsk-n8n-04 완료 처리

## Related

- **Project**: prj-n8n-entity-autofill
- **선행 Task**: tsk-n8n-02 (n8n 자동화 워크플로우 구축)
- **워크플로우 파일**: `_build/n8n_workflows/entity_schema_validator.json`
- **Dashboard 파일**: `_dashboard/js/components/pending-panel.js`

---

**Date**: 2025-12-27
**Author**: Claude Code
**Task ID**: tsk-n8n-04
