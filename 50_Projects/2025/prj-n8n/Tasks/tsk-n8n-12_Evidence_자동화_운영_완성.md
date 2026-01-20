---
entity_type: Task
entity_id: tsk-n8n-12
entity_name: Evidence 자동화 - 운영 완성 (Workflow C + Server Skip)
created: 2026-01-01
updated: '2026-01-19'
status: done
parent_id: prj-n8n
project_id: prj-n8n
aliases:
- tsk-n8n-12
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
start_date: 2026-01-01
due: 2026-01-01
priority: high
estimated_hours: null
actual_hours: null
type: dev
target_project: loop-api
tags:
- evidence
- automation
- n8n
- workflow
priority_flag: high
notes: "# Evidence 자동화 - 운영 완성 (Workflow C + Server Skip)\n\n> Task ID: `tsk-n8n-12`\
  \ | Project: `prj-n8n` | Status: doing\n\n## 목표\n\nEvidence 자동화의 \"운영 완성\"을 위한 마지막\
  \ 10\\~20% 작업 수행.\n\n**완료 조건**:\n\n1. Workflow C 추가: 승인 감지 → build_impact 트리거\n\
  2. Evidence 중복 생성 방지: Server skip 로직 구현\n3. n8n 워크플로우 Import 및 테스트\n\n---\n\n##\
  \ 상세 내용\n\n### 배경\n\nEvidence 자동화의 핵심 뼈대(80\\~90%)는 이미 구현됨:\n\n- Evidence 생성 추론\
  \ 호출 (`POST /api/ai/infer/evidence`)\n- run_id n8n 생성 및 전달\n- pending 생성은 서버 책임\n\
  - Evidence 품질 메타(v5.3) 서버 채움\n\n**남은 작업 (운영 완성 10\\~20%)**:\n\n1. **Workflow C**:\
  \ 승인 감지 → build_impact 트리거 워크플로우\n2. **Server Skip**: `/api/ai/infer/evidence` 내부에서\
  \ 이미 Evidence 존재 시 skip 처리\n\n### 작업 내용\n\n1\\. POST /api/build/impact 엔드포인트 추가\n\
  \n- FastAPI에 build 트리거 엔드포인트 구현\n- 락 파일 또는 단일 실행 guard 적용 (중복 실행 방지)\n- 응답: `{ok,\
  \ build_id, started_at, ended_at, impact_path}`\n\n2\\. Workflow C (n8n 워크플로우)\n\
  \n- 15분마다 `/api/audit/decisions` 폴링\n- pending_approved 이벤트 감지\n- build_impact 1회만\
  \ 트리거\n- cursor를 staticData에 저장 (중복 실행 방지)\n\n3\\. Server Skip 로직\n\n- `/api/ai/infer/evidence`\
  \ 내부에서 Evidence 존재 여부 체크\n- 있으면: `{ok: true, skipped: true, skip_reason: \"evidence_exists\"\
  }`\n- 없으면: 기존 로직대로 진행\n\n---\n\n## 체크리스트\n\n- [x] POST /api/build/impact 엔드포인트 구현\n\
  \n- [x] Server skip 로직 구현 (\\_build/evidence_index.json 또는 캐시 활용)\n\n- [x] n8n Workflow\
  \ C JSON Import\n\n- [x] E2E 테스트: 승인 → build_impact 트리거 확인\n\n---\n\n## Notes\n\n\
  ### PRD (Product Requirements Document)\n\n1\\. 개요\n\n**Problem**현재 LOOP 시스템에서 Evidence\
  \ pending이 승인되어도 `build_impact` 스크립트가 자동으로 실행되지 않아, Impact 점수가 수동으로 갱신되어야 한다. 또한\
  \ 동일 프로젝트/윈도우에 대해 Evidence 추론이 중복 호출되면 불필요한 LLM 비용이 발생하고 pending review가 중복 생성된다.\n\
  \n**Solution**\n\n1. **Workflow C**: n8n 워크플로우가 승인 이벤트를 감지하면 `POST /api/build/impact`를\
  \ 호출하여 자동으로 Impact 점수를 재계산\n2. **Server Skip**: `/api/ai/infer/evidence` 엔드포인트 내부에서\
  \ Evidence 존재 여부를 체크하여, 이미 존재하면 LLM 호출 없이 skip 응답 반환\n\n**Success Metrics**\n\n\
  - 승인 후 15분 이내 Impact 점수 자동 반영\n- Evidence 중복 생성 0건 (기존 Evidence가 있으면 LLM 호출 0회)\n\
  - n8n 워크플로우 안정성 100% (cursor 기반 중복 실행 방지)\n\n2\\. User Stories\n\n**US-1: 자동 Impact\
  \ 갱신**\n\n- As a LOOP Vault 운영자\n- I want Evidence pending 승인 후 Impact 점수가 자동으로\
  \ 재계산되기를\n- So that 수동으로 build_impact 스크립트를 실행하지 않아도 된다\n\n**Acceptance Criteria:**\n\
  \n- [ ] `POST /api/build/impact` 엔드포인트가 존재하고 스크립트 실행\n\n- [ ] n8n이 15분마다 `/api/audit/decisions`를\
  \ 폴링\n\n- [ ] `pending_approved` 또는 `approve` 이벤트 감지 시 build_impact 1회 실행\n\n- [\
  \ ] cursor를 staticData에 저장하여 중복 실행 방지\n\n**US-2: Evidence 중복 방지**\n\n- As a n8n\
  \ 워크플로우 관리자\n- I want 이미 Evidence가 존재하는 프로젝트/윈도우에 대해 LLM 호출이 skip되기를\n- So that\
  \ 불필요한 LLM 비용과 중복 pending review 생성을 방지할 수 있다\n\n**Acceptance Criteria:**\n\n- [\
  \ ] `/api/ai/infer/evidence` 호출 시 서버가 먼저 Evidence 존재 여부 체크\n\n- [ ] Evidence 존재\
  \ 시 `{ok: true, skipped: true, skip_reason: \"evidence_exists\"}` 반환\n\n- [ ] `existing_evidence_refs`\
  \ 필드에 기존 Evidence ID 목록 포함\n\n- [ ] LLM 호출 없이 즉시 응답 (비용 0원)\n\n---\n\n### Tech Spec\n\
  \n1\\. 아키텍처 도식\n\n```\n┌─────────────────────────────────────────────────────────────────────────────────┐\n\
  │                     Evidence 자동화 - 운영 완성 Architecture                     │\n\
  ├─────────────────────────────────────────────────────────────────────────────────┤\n\
  │  n8n Layer:                                                                  \
  \    │\n│  [Schedule Trigger 15분] → [GET /api/audit/decisions] → [Filter Code (cursor)]\
  \  │\n│                                    ↓                          ↓        \
  \         │\n│                          {decisions: [...]}      cursor 관리 (staticData)\
  \        │\n│                                                           ↓      \
  \               │\n│                                                  [IF: has_approvals?]\
  \            │\n│                                                        │    │\
  \                   │\n│                                                   Yes \
  \ ↓    ↓ No (skip)         │\n│                                        [POST /api/build/impact]\
  \                  │\n├─────────────────────────────────────────────────────────────────────────────────┤\n\
  │  API Layer (FastAPI):                                                        \
  \    │\n│  ┌─────────────────────────────────────────────────────────────────┐ \
  \           │\n│  │ /api/build/impact (NEW)                                    \
  \      │            │\n│  │  → subprocess.run([\"python3\", \"scripts/build_impact.py\"\
  , \".\"])   │            │\n│  │  → {ok, build_id, started_at, ended_at, impact_path,\
  \ summary}    │            │\n│  └─────────────────────────────────────────────────────────────────┘\
  \            │\n│  ┌─────────────────────────────────────────────────────────────────┐\
  \            │\n│  │ /api/ai/infer/evidence (MODIFIED)                         \
  \       │            │\n│  │  → check_evidence_exists(project_id, window_id)   \
  \               │            │\n│  │  → 존재? {ok:true, skipped:true, ...}       \
  \                     │            │\n│  │  → 없음? 기존 LLM 호출 로직 진행              \
  \                    │            │\n│  └─────────────────────────────────────────────────────────────────┘\
  \            │\n├─────────────────────────────────────────────────────────────────────────────────┤\n\
  │  Data Layer:                                                                 \
  \    │\n│  _build/impact.json, _build/decision_log.jsonl, _build/pending_reviews.json\
  \     │\n│  50_Projects/**/Evidence/*.md (존재 체크 대상)                            \
  \       │\n└─────────────────────────────────────────────────────────────────────────────────┘\n\
  ```\n\n2\\. API Design\n\n**POST /api/build/impact (NEW)**\n\n- Location: `api/routers/build.py`\n\
  - Response:\n\n```json\n{\n  \"ok\": true,\n  \"build_id\": \"build-20260101-090000-xxxx\"\
  ,\n  \"started_at\": \"2026-01-01T09:00:00.000Z\",\n  \"ended_at\": \"2026-01-01T09:00:15.000Z\"\
  ,\n  \"impact_path\": \"_build/impact.json\",\n  \"summary\": {\"total_projects\"\
  : 25, \"total_expected\": 45.5}\n}\n```\n\n**POST /api/ai/infer/evidence (MODIFIED\
  \ - Skip Response)**\n\n```json\n{\n  \"ok\": true,\n  \"skipped\": true,\n  \"\
  skip_reason\": \"evidence_exists\",\n  \"existing_evidence_refs\": [\"ev:2025-0001\"\
  ],\n  \"project_id\": \"prj-001\",\n  \"window_id\": \"2025-12\",\n  \"run_id\"\
  : null,\n  \"pending\": null\n}\n```\n\n3\\. VaultCache 확장\n\n```python\nclass VaultCache:\n\
  \    def _load_evidence(self):\n        \"\"\"Evidence 엔티티 로드\"\"\"\n        for\
  \ path in self.vault_dir.rglob(\"*.md\"):\n            if fm.get(\"entity_type\"\
  ) == \"Evidence\":\n                self._evidence[fm.get(\"entity_id\")] = fm\n\
  \                self._evidence_by_project.setdefault(fm.get(\"project\"), []).append(eid)\n\
  \n    def get_evidence_by_project(self, project_id: str) -> List[Dict]:\n      \
  \  \"\"\"특정 Project의 Evidence 목록 반환\"\"\"\n        return [self._evidence[eid] for\
  \ eid in self._evidence_by_project.get(project_id, [])]\n```\n\n---\n\n### Todo\n\
  \n**Phase 1: Server Skip 구현**\n\n- [ ] `api/cache/vault_cache.py` - Evidence 캐시\
  \ 로드 로직 추가\n\n- [ ] `api/routers/ai.py` - `check_evidence_exists()` 함수 구현\n\n- [\
  \ ] `api/routers/ai.py` - infer_evidence 엔드포인트에 skip 로직 추가\n\n- [ ] `InferEvidenceResponse`\
  \ 모델에 skip 관련 필드 추가\n\n**Phase 2: build_impact 엔드포인트 구현**\n\n- [ ] `api/routers/build.py`\
  \ - 새 라우터 파일 생성\n\n- [ ] `api/main.py` - build 라우터 등록\n\n- [ ] 테스트: `curl -X POST\
  \ /api/build/impact` 동작 확인\n\n**Phase 3: /api/audit/decisions cursor 지원**\n\n- [\
  \ ] `api/routers/audit.py` - `after` Query 파라미터 추가\n\n- [ ] `latest_timestamp` 필드\
  \ 응답에 추가\n\n**Phase 4: n8n 워크플로우 생성**\n\n- [ ] n8n 워크플로우 JSON 생성 및 Import\n\n- [\
  \ ] 환경변수 설정: `LOOP_API_URL`, `LOOP_API_TOKEN`\n\n- [ ] 통합 테스트: 승인 → build_impact\
  \ 자동 실행 확인\n\n**Phase 5: 문서화**\n\n- [ ] CLAUDE.md 업데이트\n\n- [ ] n8n 워크플로우 문서화\n\n\
  ---\n\n### 작업 로그\n\n2026-01-01 18:01\n\n**개요**: LOOP API에 Evidence 자동화 운영 완성을 위한\
  \ 4가지 핵심 컴포넌트 구현. POST /api/build/impact 엔드포인트 신규 생성, /api/ai/infer/evidence에 Server\
  \ Skip 로직 추가, VaultCache에 Evidence 캐시 메서드 추가, /api/audit/decisions에 cursor 기반 polling\
  \ 지원(after, entity_type 파라미터), n8n Workflow C JSON 생성.\n\n**변경사항**:\n\n- 개발: `api/routers/build.py`\
  \ - POST /api/build/impact 엔드포인트 신규 생성 (BackgroundTasks 비동기 실행, Single-flight lock\
  \ 동시 빌드 방지)\n- 개발: `_build/n8n_workflows/workflow_c_impact_rebuild.json` - n8n Workflow\
  \ C JSON (15분 폴링, staticData cursor 영속화)\n- 수정: `api/routers/ai.py` - skipped, skip_reason,\
  \ existing_evidence_refs 필드 추가, Evidence 존재 시 LLM 호출 skip 로직\n- 수정: `api/routers/audit.py`\
  \ - after, entity_type Query 파라미터, latest_timestamp/latest_decision_id 응답 필드 추가\n\
  - 수정: `api/cache/vault_cache.py` - \\_load_evidence(), get_evidence_by_project(),\
  \ check_evidence_exists() 메서드 추가\n- 수정: `api/main.py` - build 라우터 등록\n\n**파일 변경**:\n\
  \n- `api/routers/build.py` - 신규 생성, POST /api/build/impact 엔드포인트 (288줄)\n- `api/routers/ai.py`\
  \ - Server Skip 로직 추가 (\\~20줄)\n- `api/routers/audit.py` - cursor 지원 추가 (\\~30줄)\n\
  - `api/cache/vault_cache.py` - Evidence 캐시 메서드 추가 (\\~150줄)\n- `_build/n8n_workflows/workflow_c_impact_rebuild.json`\
  \ - Workflow C JSON (230줄)\n\n## 다만 “운영에서 깨질 수 있는” 포인트 4개\n\n### 1) Evidence 존재\
  \ 체크의 키가 너무 약하면 중복/오탐 가능\n\n문서에는 “프로젝트/윈도우 기반”으로 존재 체크를 하려는 흐름이 있어 보여.\n\n- **권장\
  \ 유일키**: `(project_id, window_id, hypothesis_id?, evidence_type?)` 중 최소 2\\~3개\n\
  \n- 지금처럼 **project_id만**으로 체크하면, 다른 윈도우/다른 실험인데도 “exists”로 스킵될 수 있음.\n\n✅ 권장: response에\
  \ 이미 넣으려는 `existing_evidence_refs` 좋고, 체크 함수도 **window_id까지 포함**하는 걸 기본으로.\n\n---\n\
  \n### 2) `/api/build/impact` 단일 실행 guard는 “전역 1개”면 병목 될 수 있음\n\n문서에 lock/단일 실행 guard가\
  \ 있는데,\n\n- 전역 single-flight이면 **다른 작업 승인도 같이 지연**될 수 있어.\n\n✅ 권장: 락은 `program_id`\
  \ 또는 `build_scope`(예: project group) 단위로.\n\n---\n\n### 3) `cursor(staticData)`가\
  \ “latest_timestamp” 기반이면, 동일 timestamp에서 누락 가능\n\n`/api/audit/decisions`가 `latest_timestamp/latest_decision_id`를\
  \ 주는 구조인데,\n\n- timestamp만 cursor로 쓰면 **동일 timestamp에 여러 decision**이 있을 때 누락 위험.\n\
  \n✅ 권장: cursor는 **(timestamp, decision_id) 튜플**로 하거나, **decision_id 단독**으로.\n\n\
  ---\n\n### 4) Evidence 메타(v5.3)와 Ontology validates.evidence 연결 규칙만 한 줄로 박아두면 완벽\n\
  \n지금 작업은 사실상 Ontology Lite v1에서 말한\n\n- `validates.evidence`를 운영에서 자동 생성/갱신하는 기반이야.\n\
  \n✅ 권장: Evidence 엔티티에 `linked_edges` **또는** `validates_targets` **같은 최소 연결 키**를\
  \ 넣거나,\\\n최소한 Evidence가 어떤 `project/track/hypothesis/condition`을 겨냥했는지 **명시 필드**를\
  \ 고정해두면 “추론 금지”가 완벽해져.\n\n**결과**: ✅ NAS Docker 재빌드 완료, POST /api/build/impact 엔드포인트\
  \ 테스트 성공\n\n**다음 단계**:\n\n- n8n에 Workflow C Import 및 활성화\n- E2E 테스트: Evidence approve\
  \ → build_impact 자동 트리거 확인\n\n---\n\n## 참고 문서\n\n- \\[\\[prj-n8n\\]\\] - 소속 Project\n\
  - \\[\\[tsk-n8n-07\\]\\] - AI Router Evidence 추론 엔드포인트 구현\n- \\[\\[tsk-n8n-08\\\
  ]\\] - Workflow v4 구현 및 E2E 테스트\n\n---\n\n**Created**: 2026-01-01 **Assignee**:\
  \ 김은향 **Due**: 2026-01-01"
---
# Evidence 자동화 - 운영 완성 (Workflow C + Server Skip)

> Task ID: `tsk-n8n-12` | Project: `prj-n8n` | Status: doing

## 목표

Evidence 자동화의 "운영 완성"을 위한 마지막 10~20% 작업 수행.

**완료 조건**:
1. Workflow C 추가: 승인 감지 → build_impact 트리거
2. Evidence 중복 생성 방지: Server skip 로직 구현
3. n8n 워크플로우 Import 및 테스트

---

## 상세 내용

### 배경

Evidence 자동화의 핵심 뼈대(80~90%)는 이미 구현됨:
- Evidence 생성 추론 호출 (`POST /api/ai/infer/evidence`)
- run_id n8n 생성 및 전달
- pending 생성은 서버 책임
- Evidence 품질 메타(v5.3) 서버 채움

**남은 작업 (운영 완성 10~20%)**:
1. **Workflow C**: 승인 감지 → build_impact 트리거 워크플로우
2. **Server Skip**: `/api/ai/infer/evidence` 내부에서 이미 Evidence 존재 시 skip 처리

### 작업 내용

#### 1. POST /api/build/impact 엔드포인트 추가
- FastAPI에 build 트리거 엔드포인트 구현
- 락 파일 또는 단일 실행 guard 적용 (중복 실행 방지)
- 응답: `{ok, build_id, started_at, ended_at, impact_path}`

#### 2. Workflow C (n8n 워크플로우)
- 15분마다 `/api/audit/decisions` 폴링
- pending_approved 이벤트 감지
- build_impact 1회만 트리거
- cursor를 staticData에 저장 (중복 실행 방지)

#### 3. Server Skip 로직
- `/api/ai/infer/evidence` 내부에서 Evidence 존재 여부 체크
- 있으면: `{ok: true, skipped: true, skip_reason: "evidence_exists"}`
- 없으면: 기존 로직대로 진행

---

## 체크리스트

- [x] POST /api/build/impact 엔드포인트 구현
- [x] Server skip 로직 구현 (_build/evidence_index.json 또는 캐시 활용)
- [x] n8n Workflow C JSON Import
- [x] E2E 테스트: 승인 → build_impact 트리거 확인

---

## Notes

### PRD (Product Requirements Document)

#### 1. 개요

**Problem**
현재 LOOP 시스템에서 Evidence pending이 승인되어도 `build_impact` 스크립트가 자동으로 실행되지 않아, Impact 점수가 수동으로 갱신되어야 한다. 또한 동일 프로젝트/윈도우에 대해 Evidence 추론이 중복 호출되면 불필요한 LLM 비용이 발생하고 pending review가 중복 생성된다.

**Solution**
1. **Workflow C**: n8n 워크플로우가 승인 이벤트를 감지하면 `POST /api/build/impact`를 호출하여 자동으로 Impact 점수를 재계산
2. **Server Skip**: `/api/ai/infer/evidence` 엔드포인트 내부에서 Evidence 존재 여부를 체크하여, 이미 존재하면 LLM 호출 없이 skip 응답 반환

**Success Metrics**
- 승인 후 15분 이내 Impact 점수 자동 반영
- Evidence 중복 생성 0건 (기존 Evidence가 있으면 LLM 호출 0회)
- n8n 워크플로우 안정성 100% (cursor 기반 중복 실행 방지)

#### 2. User Stories

**US-1: 자동 Impact 갱신**
- As a LOOP Vault 운영자
- I want Evidence pending 승인 후 Impact 점수가 자동으로 재계산되기를
- So that 수동으로 build_impact 스크립트를 실행하지 않아도 된다

**Acceptance Criteria:**
- [ ] `POST /api/build/impact` 엔드포인트가 존재하고 스크립트 실행
- [ ] n8n이 15분마다 `/api/audit/decisions`를 폴링
- [ ] `pending_approved` 또는 `approve` 이벤트 감지 시 build_impact 1회 실행
- [ ] cursor를 staticData에 저장하여 중복 실행 방지

**US-2: Evidence 중복 방지**
- As a n8n 워크플로우 관리자
- I want 이미 Evidence가 존재하는 프로젝트/윈도우에 대해 LLM 호출이 skip되기를
- So that 불필요한 LLM 비용과 중복 pending review 생성을 방지할 수 있다

**Acceptance Criteria:**
- [ ] `/api/ai/infer/evidence` 호출 시 서버가 먼저 Evidence 존재 여부 체크
- [ ] Evidence 존재 시 `{ok: true, skipped: true, skip_reason: "evidence_exists"}` 반환
- [ ] `existing_evidence_refs` 필드에 기존 Evidence ID 목록 포함
- [ ] LLM 호출 없이 즉시 응답 (비용 0원)

---

### Tech Spec

#### 1. 아키텍처 도식

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     Evidence 자동화 - 운영 완성 Architecture                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  n8n Layer:                                                                      │
│  [Schedule Trigger 15분] → [GET /api/audit/decisions] → [Filter Code (cursor)]  │
│                                    ↓                          ↓                 │
│                          {decisions: [...]}      cursor 관리 (staticData)        │
│                                                           ↓                     │
│                                                  [IF: has_approvals?]            │
│                                                        │    │                   │
│                                                   Yes  ↓    ↓ No (skip)         │
│                                        [POST /api/build/impact]                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  API Layer (FastAPI):                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐            │
│  │ /api/build/impact (NEW)                                          │            │
│  │  → subprocess.run(["python3", "scripts/build_impact.py", "."])   │            │
│  │  → {ok, build_id, started_at, ended_at, impact_path, summary}    │            │
│  └─────────────────────────────────────────────────────────────────┘            │
│  ┌─────────────────────────────────────────────────────────────────┐            │
│  │ /api/ai/infer/evidence (MODIFIED)                                │            │
│  │  → check_evidence_exists(project_id, window_id)                  │            │
│  │  → 존재? {ok:true, skipped:true, ...}                            │            │
│  │  → 없음? 기존 LLM 호출 로직 진행                                  │            │
│  └─────────────────────────────────────────────────────────────────┘            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Data Layer:                                                                     │
│  _build/impact.json, _build/decision_log.jsonl, _build/pending_reviews.json     │
│  50_Projects/**/Evidence/*.md (존재 체크 대상)                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 2. API Design

**POST /api/build/impact (NEW)**
- Location: `api/routers/build.py`
- Response:
```json
{
  "ok": true,
  "build_id": "build-20260101-090000-xxxx",
  "started_at": "2026-01-01T09:00:00.000Z",
  "ended_at": "2026-01-01T09:00:15.000Z",
  "impact_path": "_build/impact.json",
  "summary": {"total_projects": 25, "total_expected": 45.5}
}
```

**POST /api/ai/infer/evidence (MODIFIED - Skip Response)**
```json
{
  "ok": true,
  "skipped": true,
  "skip_reason": "evidence_exists",
  "existing_evidence_refs": ["ev:2025-0001"],
  "project_id": "prj-001",
  "window_id": "2025-12",
  "run_id": null,
  "pending": null
}
```

#### 3. VaultCache 확장

```python
class VaultCache:
    def _load_evidence(self):
        """Evidence 엔티티 로드"""
        for path in self.vault_dir.rglob("*.md"):
            if fm.get("entity_type") == "Evidence":
                self._evidence[fm.get("entity_id")] = fm
                self._evidence_by_project.setdefault(fm.get("project"), []).append(eid)

    def get_evidence_by_project(self, project_id: str) -> List[Dict]:
        """특정 Project의 Evidence 목록 반환"""
        return [self._evidence[eid] for eid in self._evidence_by_project.get(project_id, [])]
```

---

### Todo

**Phase 1: Server Skip 구현**
- [ ] `api/cache/vault_cache.py` - Evidence 캐시 로드 로직 추가
- [ ] `api/routers/ai.py` - `check_evidence_exists()` 함수 구현
- [ ] `api/routers/ai.py` - infer_evidence 엔드포인트에 skip 로직 추가
- [ ] `InferEvidenceResponse` 모델에 skip 관련 필드 추가

**Phase 2: build_impact 엔드포인트 구현**
- [ ] `api/routers/build.py` - 새 라우터 파일 생성
- [ ] `api/main.py` - build 라우터 등록
- [ ] 테스트: `curl -X POST /api/build/impact` 동작 확인

**Phase 3: /api/audit/decisions cursor 지원**
- [ ] `api/routers/audit.py` - `after` Query 파라미터 추가
- [ ] `latest_timestamp` 필드 응답에 추가

**Phase 4: n8n 워크플로우 생성**
- [ ] n8n 워크플로우 JSON 생성 및 Import
- [ ] 환경변수 설정: `LOOP_API_URL`, `LOOP_API_TOKEN`
- [ ] 통합 테스트: 승인 → build_impact 자동 실행 확인

**Phase 5: 문서화**
- [ ] CLAUDE.md 업데이트
- [ ] n8n 워크플로우 문서화

---

### 작업 로그

#### 2026-01-01 18:01
**개요**: LOOP API에 Evidence 자동화 운영 완성을 위한 4가지 핵심 컴포넌트 구현. POST /api/build/impact 엔드포인트 신규 생성, /api/ai/infer/evidence에 Server Skip 로직 추가, VaultCache에 Evidence 캐시 메서드 추가, /api/audit/decisions에 cursor 기반 polling 지원(after, entity_type 파라미터), n8n Workflow C JSON 생성.

**변경사항**:
- 개발: `api/routers/build.py` - POST /api/build/impact 엔드포인트 신규 생성 (BackgroundTasks 비동기 실행, Single-flight lock 동시 빌드 방지)
- 개발: `_build/n8n_workflows/workflow_c_impact_rebuild.json` - n8n Workflow C JSON (15분 폴링, staticData cursor 영속화)
- 수정: `api/routers/ai.py` - skipped, skip_reason, existing_evidence_refs 필드 추가, Evidence 존재 시 LLM 호출 skip 로직
- 수정: `api/routers/audit.py` - after, entity_type Query 파라미터, latest_timestamp/latest_decision_id 응답 필드 추가
- 수정: `api/cache/vault_cache.py` - _load_evidence(), get_evidence_by_project(), check_evidence_exists() 메서드 추가
- 수정: `api/main.py` - build 라우터 등록

**파일 변경**:
- `api/routers/build.py` - 신규 생성, POST /api/build/impact 엔드포인트 (288줄)
- `api/routers/ai.py` - Server Skip 로직 추가 (~20줄)
- `api/routers/audit.py` - cursor 지원 추가 (~30줄)
- `api/cache/vault_cache.py` - Evidence 캐시 메서드 추가 (~150줄)
- `_build/n8n_workflows/workflow_c_impact_rebuild.json` - Workflow C JSON (230줄)

**결과**: ✅ NAS Docker 재빌드 완료, POST /api/build/impact 엔드포인트 테스트 성공

**다음 단계**:
- n8n에 Workflow C Import 및 활성화
- E2E 테스트: Evidence approve → build_impact 자동 트리거 확인


---

## 참고 문서

- [[prj-n8n]] - 소속 Project
- [[tsk-n8n-07]] - AI Router Evidence 추론 엔드포인트 구현
- [[tsk-n8n-08]] - Workflow v4 구현 및 E2E 테스트

---

**Created**: 2026-01-01
**Assignee**: 김은향
**Due**: 2026-01-01
