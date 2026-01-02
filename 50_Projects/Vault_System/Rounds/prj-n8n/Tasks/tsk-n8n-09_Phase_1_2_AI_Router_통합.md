---
entity_type: Task
entity_id: tsk-n8n-09
entity_name: "n8n - Phase 1/2 AI Router 통합"
created: 2025-12-29
updated: 2026-01-01
closed: 2026-01-01
status: done

# === 계층 ===
parent_id: prj-n8n
project_id: prj-n8n
aliases:
- tsk-n8n-09

# === 관계 ===
outgoing_relations:
- tsk-n8n-08
validates: []

# === Task 전용 ===
assignee: 김은향
start_date: 2025-12-29
due: 2025-12-30
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===

# === 분류 ===
tags:
- n8n
- automation
- ai-router
- phase-1-2
priority_flag: high
---

# n8n - Phase 1/2 AI Router 통합

> Task ID: `tsk-n8n-09` | Project: `prj-n8n` | Status: doing

## 목표

**완료 조건**:
1. Phase 1/2 OpenAI 직접 호출 → AI Router API로 교체
2. 새 엔드포인트 2개 구현: `/api/ai/infer/task_schema`, `/api/ai/infer/project_schema`
3. n8n 워크플로우 v5 업그레이드 (OpenAI 노드 제거)
4. E2E 테스트 통과 (v4.1 + v5 전체)

---

## 상세 내용

### 배경

Phase 3 (Impact Autofill)은 tsk-n8n-08에서 AI Router로 통합 완료.
Phase 1/2 (Task/Project Schema Validation)는 아직 OpenAI 직접 호출 사용 중.

**문제점**:
- 로그가 분열됨 (n8n OpenAI 호출은 server run_log에 남지 않음)
- schema guard/derived 금지/repair 정책이 n8n 코드에 퍼지면 유지보수 지옥
- n8n은 오케스트레이션만, 추론/검증/리페어/감사는 서버가 담당해야 함

### 작업 내용

**1단계: 새 API 엔드포인트 구현**

| 엔드포인트 | 목적 | 핵심 로직 |
|-----------|------|----------|
| `/api/ai/infer/task_schema` | Task 필드 채움 | missing 감지, derived 금지, enum 강제, repair |
| `/api/ai/infer/project_schema` | Project 필드 채움 | validates, condition_contributes 등 |

**2단계: n8n 워크플로우 v5 업그레이드**

- Call OpenAI (Tasks) → Call AI Router (Task Schema)
- Call OpenAI (Projects) → Call AI Router (Project Schema)
- Parse Tasks/Projects Response → meta_* 기반 파싱으로 변경
- Create Pending 노드 제거 (AI Router가 pending 자동 생성)

**3단계: E2E 테스트**

- v4.1 (Phase 3) 테스트: pending 생성, run_id 포맷, audit_ref
- v5 (Phase 1/2) 테스트: task_schema, project_schema pending 생성

---

## 체크리스트

### API 엔드포인트
- [x] `/api/ai/infer/task_schema` 엔드포인트 구현
- [x] `/api/ai/infer/project_schema` 엔드포인트 구현
- [x] 프롬프트 템플릿 생성 (`api/prompts/task_schema.py`, `project_schema.py`)
- [x] run_log/decision_log 통합
- [x] pending 자동 생성 로직

### n8n 워크플로우 v5
- [x] Call OpenAI (Tasks) → Call AI Router (Task Schema)
- [x] Call OpenAI (Projects) → Call AI Router (Project Schema)
- [x] Parse Tasks Response 수정 (AI Router 응답 형식)
- [x] Parse Projects Response 수정 (AI Router 응답 형식)
- [x] Create Pending (Tasks) 노드 제거
- [x] Create Pending (Projects) 노드 제거
- [x] HTTP Request "Include Input Data" 설정
- [x] meta.templateId → v5 업데이트

### E2E 테스트
- [x] n8n GUI import
- [x] Manual 실행
- [x] Phase 3 테스트: pending 생성, run_id 포맷
- [x] Phase 1/2 테스트: task_schema, project_schema pending 생성
- [x] audit/runs API에서 run_id 조회
- [x] decision_log 확인

---

## Notes

### n8n 엔티티 Validate 흐름

```
┌─────────────────────────────────────────────────────────────────────┐
│                     n8n Workflow (v5)                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Schedule Trigger (매 X분)                                          │
│       ↓                                                             │
│  Get Strategy Context → Build Strategy Context                      │
│       ↓                                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Phase 1: Task Validation                                     │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ Get Tasks → Validate Tasks → Tasks Need LLM?                 │   │
│  │                  │                    │                      │   │
│  │      (JS Code)   │              yes   │  no → 스킵           │   │
│  │  - missing_due   │                    ↓                      │   │
│  │  - missing_assignee                                          │   │
│  │  - missing_conditions_3y       Call AI Router (Task Schema)  │   │
│  │  - invalid_status              POST /api/ai/infer/task_schema│   │
│  │  - invalid_priority                   ↓                      │   │
│  │                                Parse Tasks Response          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│       ↓                                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Phase 2: Project Validation                                  │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ Get Projects → Validate Projects → Projects Need LLM?        │   │
│  │                     │                    │                   │   │
│  │      (JS Code)      │              yes   │  no → 스킵        │   │
│  │  - missing_owner    │                    ↓                   │   │
│  │  - missing_parent_id          Call AI Router (Project Schema)│   │
│  │  - missing_conditions_3y      POST /api/ai/infer/project_schema│ │
│  │  - invalid_condition_contributes           ↓                 │   │
│  │  - missing_validates          Parse Projects Response        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│       ↓                                                             │
│  Phase 3: Impact Autofill (별도 흐름)                               │
└─────────────────────────────────────────────────────────────────────┘
```

### Todo
- [x] API 엔드포인트 구현
- [x] 워크플로우 v5 업그레이드
- [x] E2E 테스트
- [x] 결과 문서화

### 작업 로그

#### 2026-01-01 (Session 3 - 완료)

**개요**: E2E 테스트 완료 및 Pending Reviews 대시보드 UX 개선. n8n 워크플로우 실행 → API 연동 → 대시보드 Approve 흐름 전체 검증.

**변경사항**:
- 수정: `api/routers/pending.py` - `find_entity_file()` 함수 개선 (파일명에 entity_id 없는 경우 처리)
- 수정: `_dashboard/js/components/pending-panel.js` - AI 판단 근거 기본 펼침 상태로 변경
- 수정: `Dockerfile` - openai, anthropic 패키지 및 impact_model_config.yml 추가
- 수정: `_build/n8n_workflows/entity_validator_autofiller.json` - JSON 중복 parameters 필드 수정

**파일 변경**:
- `api/routers/pending.py` - `find_entity_file()`: glob 패턴 `*{entity_id}*.md` → `*.md`로 변경, 파일 내용에서 entity_id 검색
- `_dashboard/js/components/pending-panel.js` - `renderReasoning()`: collapsed 클래스 제거, 아이콘 ▶→▼
- `Dockerfile` - pip install에 `openai`, `anthropic` 추가, `COPY impact_model_config.yml ./` 추가

**테스트 결과**:
- ✅ n8n 워크플로우 실행 성공
- ✅ API `/api/ai/infer/task_schema`, `/api/ai/infer/project_schema` 정상 동작 (200 OK)
- ✅ Pending Reviews 37개 생성 확인
- ✅ 대시보드 Approve 성공 (`tsk-011-01` 테스트)
- ✅ decision_log 기록 확인

**다음 단계**:
- 대시보드 Pending Reviews 3단 레이아웃 UX 개선 (다음 Task로 진행 예정)

---

#### 2025-12-29 (Session 2)

**n8n 워크플로우 v5 업그레이드 완료**

1. **API 엔드포인트 구현** (이전 세션에서 완료)
   - `/api/ai/infer/task_schema` - Task 스키마 자동 채움
   - `/api/ai/infer/project_schema` - Project 스키마 자동 채움
   - 프롬프트 템플릿: `api/prompts/task_schema.py`, `project_schema.py`
   - derived 필드 보호: validates(Task), validated_by/realized_sum(Project)

2. **워크플로우 v5 변경사항**
   - `Call OpenAI (Tasks)` → `Call AI Router (Task Schema)` (id: call-ai-router-tasks)
   - `Call OpenAI (Projects)` → `Call AI Router (Project Schema)` (id: call-ai-router-projects)
   - Parse Tasks/Projects Response: AI Router 응답 형식으로 수정
   - Create Pending (Tasks/Projects) 노드 제거 (AI Router가 pending 자동 생성)
   - 노드 수: 21개 → 19개
   - meta.templateId: v4.1 → v5

3. **전체 AI Router 엔드포인트 (Phase 1/2/3 통합)**
   - Phase 1: `/api/ai/infer/task_schema`
   - Phase 2: `/api/ai/infer/project_schema`
   - Phase 3: `/api/ai/infer/project_impact`, `/api/ai/infer/evidence`

**다음 단계**: E2E 테스트 (n8n GUI에서 import 후 실행)


---

## 참고 문서

- [[prj-n8n]] - 소속 Project
- [[tsk-n8n-08]] - 선행 Task (v4.1 구현)
- [[tsk-n8n-03]] - 설계 문서

---

**Created**: 2025-12-29
**Assignee**: 김은향
**Due**: 2025-12-30
