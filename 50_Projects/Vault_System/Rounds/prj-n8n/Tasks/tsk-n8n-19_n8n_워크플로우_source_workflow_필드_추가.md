---
entity_type: Task
entity_id: tsk-n8n-19
entity_name: n8n - 워크플로우 source_workflow 필드 추가
created: 2026-01-06
updated: 2026-01-06
status: done
closed: 2026-01-06
project_id: prj-n8n
assignee: 김은향
due: 2026-01-06
priority: high
type: dev
conditions_3y:
- cond-e
tags:
- n8n
- workflow
- pending-reviews
- dashboard
---

# n8n - 워크플로우 source_workflow 필드 추가

> Task ID: `tsk-n8n-19` | Project: `prj-n8n` | Status: done

---

## 목표

n8n 워크플로우의 Task Schema, Project Schema 경로에서 `source_workflow` 필드를 API 요청에 추가하여, Dashboard의 Pending Reviews 워크플로우 필터가 정상 작동하도록 함.

---

## 배경

- Dashboard Pending Reviews 패널에 "All Workflows" 드롭다운이 있으나 옵션이 표시되지 않음
- API 분석 결과:
  - `ai.py`의 모든 Request 모델에 `source_workflow` 필드 정의됨 ✅
  - `create_pending_review()` 함수에서 `source_workflow` 저장됨 ✅
  - **n8n 워크플로우에서 Task/Project Schema 경로가 `source_workflow`를 전달하지 않음** ❌
- Expected Impact, Evidence 경로는 정상 전달됨 ✅

---

## 체크리스트

- [x] entity_validator_autofiller.json의 Task Schema 경로에 source_workflow 추가
- [x] entity_validator_autofiller.json의 Project Schema 경로에 source_workflow 추가
- [x] n8n에서 워크플로우 import 후 테스트
- [x] pending reviews에 source_workflow 포함 확인

---

## 대상 파일

- `_build/n8n_workflows/entity_validator_autofiller.json`

---

## Notes

### 현재 문제

**Task Schema 노드 (Call AI Router (Task Schema))**:
```javascript
"jsonBody": "={{ { \"task_id\": $json.entity_id, \"issues\": $json.issues, \"mode\": \"pending\", \"provider\": \"openai\", \"actor\": \"n8n\", \"original_entity\": $json.original_entity, \"strategy_context\": $('Build Strategy Context').first().json.strategyContext, \"create_pending\": true, \"schema_version\": \"5.3\" } }}"
// source_workflow 없음!
```

**Project Schema 노드 (Call AI Router (Project Schema))**:
```javascript
"jsonBody": "={{ { \"project_id\": $json.entity_id, ... } }}"
// source_workflow 없음!
```

### 해결 방안

각 노드의 jsonBody에 `"source_workflow": "entity-validator"` 추가

---

## 작업 로그

### 2026-01-06 구현 완료

**개요**: n8n 워크플로우의 Task Schema, Project Schema 경로에 `source_workflow` 필드 추가

**변경사항**:

1. **entity_validator_autofiller.json**
   - **Call AI Router (Task Schema)** 노드 (line 223):
     - jsonBody에 `"source_workflow": "entity-validator"` 추가
   - **Call AI Router (Project Schema)** 노드 (line 335):
     - jsonBody에 `"source_workflow": "entity-validator"` 추가
   - 메타데이터 updated: 2026-01-03 → 2026-01-06

**변경 전**:
```javascript
"jsonBody": "={{ { \"task_id\": ..., \"schema_version\": \"5.3\" } }}"
```

**변경 후**:
```javascript
"jsonBody": "={{ { \"task_id\": ..., \"schema_version\": \"5.3\", \"source_workflow\": \"entity-validator\" } }}"
```

**결과**:
- 이제 모든 4개 경로에서 `source_workflow` 전달됨:
  - Task Schema ✅ (신규)
  - Project Schema ✅ (신규)
  - Expected Impact ✅ (기존)
  - Evidence ✅ (기존)
- Dashboard "All Workflows" 드롭다운에 `entity-validator` 옵션이 표시될 예정

### 2026-01-06 테스트 완료

**테스트 결과**:
```
Total pending reviews: 252

Latest 10:
prj-008                   | 2026-01-06T13:24:56 | source_workflow: entity-validator ✅
prj-021                   | 2026-01-06T13:24:55 | source_workflow: entity-validator ✅
prj-impact-schema-v2      | 2026-01-06T13:24:55 | source_workflow: entity-validator ✅
...
```

**추가 작업**:
- `/n8n` 스킬에 로그 확인 기능 추가 (`/n8n pending`, `/n8n audit`)
- `CLAUDE.md`, `prj-n8n/Project_정의.md`에 CLI 명령어 문서화

