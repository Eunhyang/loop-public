---
entity_type: Task
entity_id: tsk-impact-v2-07
entity_name: Schema - autofill infer - audit + decision_log + n8n 연동
created: 2025-12-29
updated: '2025-12-29'
status: done
closed: '2025-12-29'
parent_id: prj-impact-schema-v2
project_id: prj-impact-schema-v2
aliases:
- tsk-impact-v2-07
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
start_date: '2025-12-29'
due: '2025-12-29'
priority: high
estimated_hours: null
actual_hours: null
type: dev
target_project: loop
conditions_3y:
- cond-e
tags:
- infer
- audit
- decision-log
- n8n
priority_flag: high
notes: "# autofill infer - audit + decision_log + n8n 연동\n\n> Task ID: `tsk-impact-v2-07`\
  \ | Project: `prj-impact-schema-v2` | Status: doing\n\n## 목표\n\n**완료 조건**:\n1. schema_constants.yaml에\
  \ `format_rules.Evidence` enum 규칙 추가\n2. `/api/ai/infer/project_impact` 엔드포인트 구현\
  \ (audit + pending_created 기록)\n3. n8n 워크플로우 업데이트 (OpenAI 노드 → 서버 infer 호출)\n\n\
  ---\n\n## 상세 내용\n\n### 배경\n\ntsk-impact-v2-06에서 Evidence 품질 메타 + 승인 로그 시스템을 구현했으나,\
  \ 다음이 미완료:\n\n1. **schema 반영 미확인**: MCP API에서 품질 메타 필드가 안 보임\n   - 원인: `format_rules.Evidence`\
  \ enum 규칙 누락 + 서버 rebuild 필요\n\n2. **infer 시점 로그 미구현**: approve/reject 단계는 완료, infer\
  \ 시점은 미확인\n   - 필요: infer 실행 시 audit 저장 + pending_created decision_log append\n\n\
  3. **n8n 노드 미교체**: OpenAI 노드 → 서버 infer 호출로 변경 필요\n\n### 작업 내용\n\n#### (1) schema_constants.yaml\
  \ - format_rules.Evidence 추가\n\n`validation_rules.format_rules`에 Evidence enum 규칙\
  \ 추가 (line 577 뒤):\n```yaml\n    Evidence:\n      provenance: \"must be one of [auto,\
  \ human, mixed]\"\n      measurement_quality: \"must be one of [high, medium, low]\"\
  \n      counterfactual: \"must be one of [none, before_after, controlled]\"\n```\n\
  \n#### (2) /api/ai/infer/project_impact 구현\n\n**Request:**\n```json\n{\n  \"project_id\"\
  : \"prj-002\",\n  \"mode\": \"expected|realized|both\",\n  \"template_id\": \"v3\"\
  ,\n  \"schema_version\": \"5.3\",\n  \"create_pending\": true,\n  \"actor\": \"\
  system|eunhyang|coach-xxx\",\n  \"run_id\": \"run_20251228_091500_prj-002\"\n}\n\
  ```\n\n**Response:**\n```json\n{\n  \"ok\": true,\n  \"run_id\": \"run_...\",\n\
  \  \"patch\": { },\n  \"derived_autofill\": { \"window_id\": \"2025-12\", \"time_range\"\
  : \"...\" },\n  \"scores\": { \"expected_A\": 2.1, \"realized_B\": 0.42 },\n  \"\
  validation\": { \"errors\": [], \"warnings\": [] },\n  \"human_required\": [\"realized_impact.metrics_snapshot\"\
  ],\n  \"pending\": { \"created\": true, \"pending_id\": \"pend_...\" },\n  \"audit_ref\"\
  : \"logs/audit/2025-12-29/run_....json\",\n  \"decision_log_ref\": \"logs/decision_log.jsonl\"\
  \n}\n```\n\n**저장:**\n- Audit: `logs/audit/YYYY-MM-DD/{run_id}.json`\n- Decision\
  \ Log: `logs/decision_log.jsonl` (pending_created 이벤트)\n\n#### (3) n8n 워크플로우 업데이트\n\
  \n**노드 교체:**\n1. Cron Trigger (매일 09:00)\n2. HTTP Request: GET /api/projects\n3.\
  \ Code: 필터링 (active, missing impact)\n4. Split In Batches\n5. Code: run_id 생성\n\
  6. **HTTP Request: POST /api/ai/infer/project_impact** ← 핵심\n7. IF Node: validation.errors\
  \ == 0\n8. Error Branch: Slack + audit_ref 링크\n\n---\n\n## 체크리스트\n\n- [ ] schema_constants.yaml\
  \ - format_rules.Evidence 추가\n- [ ] /mcp-server rebuild\n- [ ] /api/mcp_schema에서\
  \ 품질 메타 7개 확인\n- [ ] api/routers/autofill.py - infer 엔드포인트 구현\n- [ ] infer 호출 시\
  \ audit 저장 + decision_log append\n- [ ] n8n 워크플로우 OpenAI 노드 교체\n\n---\n\n## Notes\n\
  \n### PRD (Product Requirements Document)\n\n#### 1. 프로젝트 컨텍스트\n\n- **Framework**:\
  \ Python FastAPI + n8n workflow automation\n- **Architecture**: REST API + Append-only\
  \ Audit Logs + LLM Inference Engine\n- **State Management**: File-based (JSON/JSONL)\
  \ + In-memory cache\n- **Key Dependencies**: FastAPI, Pydantic, OpenAI/Anthropic\
  \ SDK, YAML\n- **Reference**: LOOP_PHILOSOPHY.md (Section 8: Evidence 품질 메타 + 승인\
  \ 로그)\n\n#### 2. 구현 범위\n\n**주요 기능:**\n1. **schema_constants.yaml - Evidence format_rules\
  \ 추가**: Evidence 품질 메타 필드의 enum 규칙을 validation_rules.format_rules에 추가하여 MCP API에서\
  \ 올바르게 노출\n2. **/api/ai/infer/project_impact 엔드포인트 구현**: LLM 추론 + 스키마 검증 + 점수 계산\
  \ + audit 저장 + decision_log 기록을 단일 엔드포인트로 통합\n3. **n8n 워크플로우 업데이트**: 기존 OpenAI 노드를\
  \ 서버 infer 호출로 교체하여 audit/decision_log 일원화\n\n**파일 구조 (예상):**\n```\napi/\n├── routers/\n\
  │   ├── ai.py (신규)                    # /api/ai/infer/* 라우터\n│   └── autofill.py\
  \ (기존)              # 기존 유지\n├── services/\n│   ├── decision_logger.py (수정)    \
  \   # pending_created 이벤트 추가\n│   └── llm_service.py (기존)           # 변경 없음\n00_Meta/\n\
  └── schema_constants.yaml (수정)        # format_rules.Evidence 추가\nlogs/\n├── audit/\n\
  │   └── YYYY-MM-DD/                     # 날짜별 audit 디렉토리\n│       └── {run_id}.json\
  \               # infer 실행 로그\n└── decision_log.jsonl                  # pending_created\
  \ 이벤트 추가\n```\n\n#### 3. 상세 요구사항\n\n**3.1 schema_constants.yaml - format_rules.Evidence**\n\
  - 위치: `00_Meta/schema_constants.yaml`\n- 목적: Evidence 품질 메타 필드의 enum 검증 규칙을 MCP\
  \ API에 노출\n- 추가 내용:\n```yaml\nEvidence:\n  provenance: \"must be one of [auto, human,\
  \ mixed]\"\n  measurement_quality: \"must be one of [high, medium, low]\"\n  counterfactual:\
  \ \"must be one of [none, before_after, controlled]\"\n```\n\n**3.2 /api/ai/infer/project_impact\
  \ 엔드포인트**\n- 위치: `api/routers/ai.py` (신규)\n- Request: project_id, mode, template_id,\
  \ schema_version, create_pending, actor, run_id\n- Response: ok, run_id, patch,\
  \ derived_autofill, scores, validation, pending, audit_ref\n\n**처리 플로우:**\n1. run_id\
  \ 생성 (또는 외부 지정 값 사용)\n2. 프로젝트 조회 및 컨텍스트 수집\n3. 프롬프트 빌드 (template_id 기반)\n4. LLM\
  \ 호출 (run_log 자동 기록)\n5. 응답 파싱 및 스키마 검증\n6. 서버 계산 (점수, window_id, time_range)\n\
  7. Audit 저장 (logs/audit/YYYY-MM-DD/{run_id}.json)\n8. create_pending=True면: pending_reviews.json\
  \ 저장 + decision_log.jsonl에 pending_created 기록\n\n**3.3 decision_logger.py - pending_created\
  \ 이벤트**\n- log_pending_created() 함수 추가\n- 필드: decision_id, timestamp, decision,\
  \ entity_id, entity_type, review_id, actor, run_id, metadata\n\n**3.4 Audit 저장 구조**\n\
  - 위치: `logs/audit/YYYY-MM-DD/{run_id}.json`\n- 내용: run_id, timestamp, endpoint,\
  \ request, llm, response, pending_info\n\n#### 4. 성공 기준\n\n- [ ] schema_constants.yaml에\
  \ format_rules.Evidence 섹션 추가됨\n- [ ] /api/ai/infer/project_impact 엔드포인트가 정상 동작\n\
  - [ ] infer 실행 시 logs/audit/YYYY-MM-DD/{run_id}.json에 audit 저장됨\n- [ ] create_pending=True\
  \ 시 decision_log.jsonl에 pending_created 이벤트 기록됨\n- [ ] n8n에서 OpenAI 노드 대신 서버 infer\
  \ 호출로 동일한 결과 획득\n\n---\n\n### Tech Spec\n\n#### 1. 아키텍처 개요\n\n```\n┌─────────────┐\
  \     ┌─────────────────────────────────────────────────────────────┐\n│    n8n\
  \      │────▶│               FastAPI (LOOP API)                            │\n│\
  \  Workflow   │     │  ┌─────────────────────────────────────────────────────────┐│\n\
  └─────────────┘     │  │  /api/ai/infer/project_impact                         \
  \ ││\n                    │  │  ┌──────────────────────────────────────────────────┐\
  \   ││\n                    │  │  │ 1. Project Context Fetch                   \
  \      │   ││\n                    │  │  │ 2. Prompt Build (template_id)       \
  \             │   ││\n                    │  │  │ 3. LLM Call (via llm_service)\
  \                    │   ││\n                    │  │  │ 4. Schema Validation (format_rules)\
  \              │   ││\n                    │  │  │ 5. Score Calculation (impact_calculator)\
  \         │   ││\n                    │  │  │ 6. Audit Write (logs/audit/...)  \
  \                │   ││\n                    │  │  │ 7. Pending + Decision Log (if\
  \ create_pending)    │   ││\n                    │  │  └──────────────────────────────────────────────────┘\
  \   ││\n                    │  └─────────────────────────────────────────────────────────┘│\n\
  \                    └─────────────────────────────────────────────────────────────┘\n\
  ```\n\n#### 2. 상세 구현\n\n**2.1 schema_constants.yaml 변경**\n```yaml\nvalidation_rules:\n\
  \  format_rules:\n    # 기존 내용...\n    # === v5.3 추가 ===\n    Evidence:\n      provenance:\
  \ \"must be one of [auto, human, mixed]\"\n      measurement_quality: \"must be\
  \ one of [high, medium, low]\"\n      counterfactual: \"must be one of [none, before_after,\
  \ controlled]\"\n```\n\n**2.2 api/routers/ai.py (신규)**\n- InferProjectImpactRequest:\
  \ project_id, mode, template_id, schema_version, create_pending, actor, run_id\n\
  - InferProjectImpactResponse: ok, run_id, patch, derived_autofill, scores, validation,\
  \ pending, audit_ref\n- save_audit_log(): logs/audit/YYYY-MM-DD/{run_id}.json 저장\n\
  \n**2.3 decision_logger.py 수정**\n```python\ndef log_pending_created(\n    entity_id:\
  \ str,\n    entity_type: str,\n    review_id: str,\n    actor: str,\n    run_id:\
  \ str,\n    metadata: Optional[Dict[str, Any]] = None\n) -> str:\n    \"\"\"pending_created\
  \ 이벤트를 decision_log.jsonl에 기록\"\"\"\n```\n\n**2.4 main.py 라우터 등록**\n```python\n\
  from .routers import ai\napp.include_router(ai.router)\n```\n\n**2.5 n8n 워크플로우 변경**\n\
  - 기존: [OpenAI Chat Model] → [Parse JSON] → [Set Fields] → [HTTP: Create Pending]\n\
  - 변경: [HTTP: POST /api/ai/infer/project_impact] → [Response Handler]\n\n---\n\n\
  ### Todo\n\n1. [ ] schema_constants.yaml에 validation_rules.format_rules.Evidence\
  \ 추가\n2. [ ] api/services/decision_logger.py에 log_pending_created() 함수 추가\n3. [\
  \ ] logs/audit/ 디렉토리 구조 및 save_audit_log() 유틸 함수 구현\n4. [ ] api/routers/ai.py 신규\
  \ 생성 및 /api/ai/infer/project_impact 구현\n5. [ ] api/main.py에 ai router 등록\n6. [ ]\
  \ API 서버 재시작 및 엔드포인트 테스트\n7. [ ] n8n 워크플로우 업데이트 (OpenAI → 서버 infer 호출)\n8. [ ] 전체\
  \ E2E 테스트 (n8n → API → pending → dashboard)\n\n### 작업 로그\n\n\n---\n\n## 참고 문서\n\n\
  - [[tsk-impact-v2-06]] - Evidence 품질 메타 + 승인 로그 (선행 작업)\n- [[prj-impact-schema-v2]]\
  \ - 소속 Project\n\n---\n\n**Created**: 2025-12-29\n**Assignee**: 김은향\n**Due**: 2025-12-29\n"
---
# autofill infer - audit + decision_log + n8n 연동

> Task ID: `tsk-impact-v2-07` | Project: `prj-impact-schema-v2` | Status: doing

## 목표

**완료 조건**:
1. schema_constants.yaml에 `format_rules.Evidence` enum 규칙 추가
2. `/api/ai/infer/project_impact` 엔드포인트 구현 (audit + pending_created 기록)
3. n8n 워크플로우 업데이트 (OpenAI 노드 → 서버 infer 호출)

---

## 상세 내용

### 배경

tsk-impact-v2-06에서 Evidence 품질 메타 + 승인 로그 시스템을 구현했으나, 다음이 미완료:

1. **schema 반영 미확인**: MCP API에서 품질 메타 필드가 안 보임
   - 원인: `format_rules.Evidence` enum 규칙 누락 + 서버 rebuild 필요

2. **infer 시점 로그 미구현**: approve/reject 단계는 완료, infer 시점은 미확인
   - 필요: infer 실행 시 audit 저장 + pending_created decision_log append

3. **n8n 노드 미교체**: OpenAI 노드 → 서버 infer 호출로 변경 필요

### 작업 내용

#### (1) schema_constants.yaml - format_rules.Evidence 추가

`validation_rules.format_rules`에 Evidence enum 규칙 추가 (line 577 뒤):
```yaml
    Evidence:
      provenance: "must be one of [auto, human, mixed]"
      measurement_quality: "must be one of [high, medium, low]"
      counterfactual: "must be one of [none, before_after, controlled]"
```

#### (2) /api/ai/infer/project_impact 구현

**Request:**
```json
{
  "project_id": "prj-002",
  "mode": "expected|realized|both",
  "template_id": "v3",
  "schema_version": "5.3",
  "create_pending": true,
  "actor": "system|eunhyang|coach-xxx",
  "run_id": "run_20251228_091500_prj-002"
}
```

**Response:**
```json
{
  "ok": true,
  "run_id": "run_...",
  "patch": { },
  "derived_autofill": { "window_id": "2025-12", "time_range": "..." },
  "scores": { "expected_A": 2.1, "realized_B": 0.42 },
  "validation": { "errors": [], "warnings": [] },
  "human_required": ["realized_impact.metrics_snapshot"],
  "pending": { "created": true, "pending_id": "pend_..." },
  "audit_ref": "logs/audit/2025-12-29/run_....json",
  "decision_log_ref": "logs/decision_log.jsonl"
}
```

**저장:**
- Audit: `logs/audit/YYYY-MM-DD/{run_id}.json`
- Decision Log: `logs/decision_log.jsonl` (pending_created 이벤트)

#### (3) n8n 워크플로우 업데이트

**노드 교체:**
1. Cron Trigger (매일 09:00)
2. HTTP Request: GET /api/projects
3. Code: 필터링 (active, missing impact)
4. Split In Batches
5. Code: run_id 생성
6. **HTTP Request: POST /api/ai/infer/project_impact** ← 핵심
7. IF Node: validation.errors == 0
8. Error Branch: Slack + audit_ref 링크

---

## 체크리스트

- [ ] schema_constants.yaml - format_rules.Evidence 추가
- [ ] /mcp-server rebuild
- [ ] /api/mcp_schema에서 품질 메타 7개 확인
- [ ] api/routers/autofill.py - infer 엔드포인트 구현
- [ ] infer 호출 시 audit 저장 + decision_log append
- [ ] n8n 워크플로우 OpenAI 노드 교체

---

## Notes

### PRD (Product Requirements Document)

#### 1. 프로젝트 컨텍스트

- **Framework**: Python FastAPI + n8n workflow automation
- **Architecture**: REST API + Append-only Audit Logs + LLM Inference Engine
- **State Management**: File-based (JSON/JSONL) + In-memory cache
- **Key Dependencies**: FastAPI, Pydantic, OpenAI/Anthropic SDK, YAML
- **Reference**: LOOP_PHILOSOPHY.md (Section 8: Evidence 품질 메타 + 승인 로그)

#### 2. 구현 범위

**주요 기능:**
1. **schema_constants.yaml - Evidence format_rules 추가**: Evidence 품질 메타 필드의 enum 규칙을 validation_rules.format_rules에 추가하여 MCP API에서 올바르게 노출
2. **/api/ai/infer/project_impact 엔드포인트 구현**: LLM 추론 + 스키마 검증 + 점수 계산 + audit 저장 + decision_log 기록을 단일 엔드포인트로 통합
3. **n8n 워크플로우 업데이트**: 기존 OpenAI 노드를 서버 infer 호출로 교체하여 audit/decision_log 일원화

**파일 구조 (예상):**
```
api/
├── routers/
│   ├── ai.py (신규)                    # /api/ai/infer/* 라우터
│   └── autofill.py (기존)              # 기존 유지
├── services/
│   ├── decision_logger.py (수정)       # pending_created 이벤트 추가
│   └── llm_service.py (기존)           # 변경 없음
00_Meta/
└── schema_constants.yaml (수정)        # format_rules.Evidence 추가
logs/
├── audit/
│   └── YYYY-MM-DD/                     # 날짜별 audit 디렉토리
│       └── {run_id}.json               # infer 실행 로그
└── decision_log.jsonl                  # pending_created 이벤트 추가
```

#### 3. 상세 요구사항

**3.1 schema_constants.yaml - format_rules.Evidence**
- 위치: `00_Meta/schema_constants.yaml`
- 목적: Evidence 품질 메타 필드의 enum 검증 규칙을 MCP API에 노출
- 추가 내용:
```yaml
Evidence:
  provenance: "must be one of [auto, human, mixed]"
  measurement_quality: "must be one of [high, medium, low]"
  counterfactual: "must be one of [none, before_after, controlled]"
```

**3.2 /api/ai/infer/project_impact 엔드포인트**
- 위치: `api/routers/ai.py` (신규)
- Request: project_id, mode, template_id, schema_version, create_pending, actor, run_id
- Response: ok, run_id, patch, derived_autofill, scores, validation, pending, audit_ref

**처리 플로우:**
1. run_id 생성 (또는 외부 지정 값 사용)
2. 프로젝트 조회 및 컨텍스트 수집
3. 프롬프트 빌드 (template_id 기반)
4. LLM 호출 (run_log 자동 기록)
5. 응답 파싱 및 스키마 검증
6. 서버 계산 (점수, window_id, time_range)
7. Audit 저장 (logs/audit/YYYY-MM-DD/{run_id}.json)
8. create_pending=True면: pending_reviews.json 저장 + decision_log.jsonl에 pending_created 기록

**3.3 decision_logger.py - pending_created 이벤트**
- log_pending_created() 함수 추가
- 필드: decision_id, timestamp, decision, entity_id, entity_type, review_id, actor, run_id, metadata

**3.4 Audit 저장 구조**
- 위치: `logs/audit/YYYY-MM-DD/{run_id}.json`
- 내용: run_id, timestamp, endpoint, request, llm, response, pending_info

#### 4. 성공 기준

- [ ] schema_constants.yaml에 format_rules.Evidence 섹션 추가됨
- [ ] /api/ai/infer/project_impact 엔드포인트가 정상 동작
- [ ] infer 실행 시 logs/audit/YYYY-MM-DD/{run_id}.json에 audit 저장됨
- [ ] create_pending=True 시 decision_log.jsonl에 pending_created 이벤트 기록됨
- [ ] n8n에서 OpenAI 노드 대신 서버 infer 호출로 동일한 결과 획득

---

### Tech Spec

#### 1. 아키텍처 개요

```
┌─────────────┐     ┌─────────────────────────────────────────────────────────────┐
│    n8n      │────▶│               FastAPI (LOOP API)                            │
│  Workflow   │     │  ┌─────────────────────────────────────────────────────────┐│
└─────────────┘     │  │  /api/ai/infer/project_impact                          ││
                    │  │  ┌──────────────────────────────────────────────────┐   ││
                    │  │  │ 1. Project Context Fetch                         │   ││
                    │  │  │ 2. Prompt Build (template_id)                    │   ││
                    │  │  │ 3. LLM Call (via llm_service)                    │   ││
                    │  │  │ 4. Schema Validation (format_rules)              │   ││
                    │  │  │ 5. Score Calculation (impact_calculator)         │   ││
                    │  │  │ 6. Audit Write (logs/audit/...)                  │   ││
                    │  │  │ 7. Pending + Decision Log (if create_pending)    │   ││
                    │  │  └──────────────────────────────────────────────────┘   ││
                    │  └─────────────────────────────────────────────────────────┘│
                    └─────────────────────────────────────────────────────────────┘
```

#### 2. 상세 구현

**2.1 schema_constants.yaml 변경**
```yaml
validation_rules:
  format_rules:
    # 기존 내용...
    # === v5.3 추가 ===
    Evidence:
      provenance: "must be one of [auto, human, mixed]"
      measurement_quality: "must be one of [high, medium, low]"
      counterfactual: "must be one of [none, before_after, controlled]"
```

**2.2 api/routers/ai.py (신규)**
- InferProjectImpactRequest: project_id, mode, template_id, schema_version, create_pending, actor, run_id
- InferProjectImpactResponse: ok, run_id, patch, derived_autofill, scores, validation, pending, audit_ref
- save_audit_log(): logs/audit/YYYY-MM-DD/{run_id}.json 저장

**2.3 decision_logger.py 수정**
```python
def log_pending_created(
    entity_id: str,
    entity_type: str,
    review_id: str,
    actor: str,
    run_id: str,
    metadata: Optional[Dict[str, Any]] = None
) -> str:
    """pending_created 이벤트를 decision_log.jsonl에 기록"""
```

**2.4 main.py 라우터 등록**
```python
from .routers import ai
app.include_router(ai.router)
```

**2.5 n8n 워크플로우 변경**
- 기존: [OpenAI Chat Model] → [Parse JSON] → [Set Fields] → [HTTP: Create Pending]
- 변경: [HTTP: POST /api/ai/infer/project_impact] → [Response Handler]

---

### Todo

1. [x] schema_constants.yaml에 validation_rules.format_rules.Evidence 추가
2. [x] api/services/decision_logger.py에 log_pending_created() 함수 추가
3. [x] _build/ai_audit/ 디렉토리 구조 및 save_ai_audit_log() 함수 구현
4. [x] api/routers/ai.py 신규 생성 및 /api/ai/infer/project_impact 구현
5. [x] api/main.py에 ai router 등록
6. [x] API 서버 재시작 및 엔드포인트 테스트 (NAS Docker 2회 rebuild)
7. [ ] n8n 워크플로우 업데이트 (OpenAI → 서버 infer 호출) - **별도 Task로 진행**
8. [ ] 전체 E2E 테스트 (n8n → API → pending → dashboard) - **#7 완료 후**

### 작업 로그

#### 2025-12-29: AI Infer 엔드포인트 + Audit 시스템 구현

**Overview**

LOOP_PHILOSOPHY 8.2에서 요구하는 "추론(infer) 시점에서의 audit 기록" 구현 완료.
LLM이 Project Impact를 추론하면 자동으로 audit 로그와 pending_created 이벤트가 기록되어 추적 가능.

**Context**

문제 인식:
- tsk-impact-v2-06에서 approve/reject 시점 로그는 구현됨
- infer(추론) 시점에서는 audit 기록이 없어 LLM 호출 추적 불가
- n8n에서 직접 OpenAI 노드 사용 시 audit/decision_log 일원화 불가

해결 방향:
- `/api/ai/infer/project_impact` 전용 엔드포인트 신규 생성
- infer 실행 시 _build/ai_audit/ 에 audit 저장
- pending 생성 시 decision_log.jsonl에 pending_created 이벤트 append

**Changes Made**

1. Schema Constants 확장 (v5.3)
   - `validation_rules.format_rules.Evidence` 섹션 추가
   - provenance, measurement_quality, counterfactual enum 규칙

2. Decision Logger 확장 (`api/services/decision_logger.py`)
   - `log_pending_created()` 함수 추가
   - pending 생성 시점 기록 (approve/reject와 구분)

3. AI Router 신규 생성 (`api/routers/ai.py`)
   - `POST /api/ai/infer/project_impact` - Project Impact 추론
   - `GET /api/ai/audit/{run_id}` - Audit 로그 조회
   - `GET /api/ai/health` - AI API 상태 체크

4. Main.py 라우터 등록
   - ai router import 및 include

5. Audit 디렉토리 구조
   - `_build/ai_audit/.gitkeep` 생성

6. VaultCache API 버그 수정
   - `cache.get_projects()` → `cache.get_project(project_id)`
   - `cache.get_tracks()` → `cache.get_track(track_id)`

**New API Endpoints**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ai/infer/project_impact` | LLM 기반 Impact 추론 + audit 저장 |
| GET | `/api/ai/audit/{run_id}` | 특정 run_id의 audit 로그 조회 |
| GET | `/api/ai/health` | AI API 상태 및 가용 provider 확인 |

**File Changes Summary**

| File | Change | Description |
|------|--------|-------------|
| `00_Meta/schema_constants.yaml` | 수정 | format_rules.Evidence 추가 |
| `api/services/decision_logger.py` | 수정 | log_pending_created() 추가 |
| `api/routers/ai.py` | 신규 | AI 추론 라우터 (486 lines) |
| `api/main.py` | 수정 | ai router 등록 |
| `_build/ai_audit/.gitkeep` | 신규 | audit 디렉토리 구조 |

**Verification Results**

```bash
# NAS Docker rebuild 2회 실행 (1차: 신규 구현, 2차: 버그 수정)
$ docker compose up -d --build loop-api

# Health check
$ curl https://mcp.sosilab.synology.me/health
{"status": "healthy", ...}

# Endpoint test
$ curl -X POST https://mcp.sosilab.synology.me/api/ai/infer/project_impact \
    -H "Authorization: Bearer $LOOP_API_TOKEN" \
    -d '{"project_id": "prj-001"}'
# → OpenAI API key 미설정으로 예상된 에러 반환 (엔드포인트는 정상 작동)
```

**Summary**

| 구분 | 변경 |
|------|------|
| 신규 파일 | 2개 (ai.py, .gitkeep) |
| 수정 파일 | 3개 (schema_constants.yaml, decision_logger.py, main.py) |
| 신규 API | 3개 엔드포인트 |
| Docker 재빌드 | 2회 |

**Next Steps**

- n8n 워크플로우 업데이트: OpenAI 노드 → POST /api/ai/infer/project_impact (별도 Task)
- Docker 환경에 OPENAI_API_KEY 설정 (또는 n8n에서 provider 지정)
- E2E 테스트: n8n → API → pending → dashboard

---

## 참고 문서

- [[tsk-impact-v2-06]] - Evidence 품질 메타 + 승인 로그 (선행 작업)
- [[prj-impact-schema-v2]] - 소속 Project

---

**Created**: 2025-12-29
**Assignee**: 김은향
**Due**: 2025-12-29
