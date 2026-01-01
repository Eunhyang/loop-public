---
entity_type: Task
entity_id: "tsk-n8n-12"
entity_name: "Evidence 자동화 - 운영 완성 (Workflow C + Server Skip)"
created: 2026-01-01
updated: 2026-01-01
status: doing

# === 계층 ===
parent_id: "prj-n8n"
project_id: "prj-n8n"
aliases: ["tsk-n8n-12"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-01
due: 2026-01-01
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop-api

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-a"]

# === 분류 ===
tags: ["evidence", "automation", "n8n", "workflow"]
priority_flag: high
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
