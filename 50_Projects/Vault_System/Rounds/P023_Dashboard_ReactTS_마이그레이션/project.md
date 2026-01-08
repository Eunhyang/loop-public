---
entity_type: Project
entity_id: "prj-023"
entity_name: "Dashboard - React+TS 마이그레이션"
created: 2026-01-07
updated: 2026-01-08
status: doing

# === 계층 ===
parent_id: "trk-2"
program_id: "pgm-vault-system"
aliases: ["prj-023", "Dashboard - React+TS 마이그레이션"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []
primary_hypothesis_id: null

# === Project 전용 ===
owner: "김은향"
budget: null
deadline: null
hypothesis_text: "바닐라 JS 대시보드를 React+TS로 마이그레이션하면 페이지 경계 분리로 운영 복잡도가 감소하고, state.js 급팽창 없이 기능 추가 속도가 향상될 것이다"
experiments: []
tasks:
  - tsk-022-20
  - tsk-022-23
  - tsk-022-25
  - tsk-022-26
  - tsk-023-01
  - tsk-023-02
  - tsk-023-03
  - tsk-023-04
  - tsk-023-05
  - tsk-023-06
  - tsk-023-07
  - tsk-023-08
  - tsk-023-09

# === Expected Impact (A) ===
tier: null
impact_magnitude: null
confidence: null

# === Condition 기여 ===
condition_contributes:
  - to: "cond-e"
    weight: 0.8
    description: "운영 효율화 - 대시보드 초기 로딩 2초 이내, SSOT 드리프트 제로, 기능 추가 속도 향상"

# === Secondary Track 기여 ===
track_contributes: []

# === Expected Impact Statement ===
expected_impact:
  statement: "React+TS 마이그레이션으로 대시보드가 결정-증거-승인-학습 루프를 실제로 굴리는 OS가 된다"
  metric: "초기 로딩 시간, SSOT 드리프트 수, Pending review 처리 시간, 기능 추가 소요 시간"
  target: "로딩 <2초, 드리프트 0건, 리뷰 <1분, 기능 추가 시 state.js 급팽창 없음"

# === Realized Impact (B) ===
realized_impact:
  verdict: null
  outcome: null
  evidence_links: []
  decided: null
  window_id: null
  time_range: null
  metrics_snapshot: {}

# === 3Y 전략 연결 ===
conditions_3y: ["cond-e"]

# === 분류 ===
tags: ["project", "vault-system", "dashboard", "react", "typescript", "migration"]
priority_flag: high
---

# Dashboard - React+TS 마이그레이션

> Project ID: `prj-023` | Program: [[pgm-vault-system]] | Track: [[trk-2]] | Status: doing

---

## 🎯 North Star

**"내부 운영 대시보드가 '결정–증거–승인–학습' 루프를 실제로 굴리는 OS"**

### 90일 성공 기준 (측정 가능)

- ✅ 대시보드 초기 로드: < 2초 (캐시 warm 기준)
- ✅ SSOT 드리프트 제로: 같은 엔티티가 다른 규칙/파일명 가정으로 깨지는 케이스 0
- ✅ 승인 워크플로 정착: Pending review 처리 시간 1분 내 (리뷰어 관점)
- ✅ 기능 추가 속도: 새 기능 1개 추가 시 "state.js 급팽창" 없이 진행

---

## 🏁 Project Rollup

> ⚠️ **프로젝트 종료 시 필수 작성** (진행 중에는 비워둠)

### Conclusion
1.
2.
3.

### Evidence
| # | Type | 근거 요약 | 링크 |
|---|------|----------|------|
| 1 | | | [[]] |

### Metric Delta
| Metric | Before | After | Δ | 판정 |
|--------|--------|-------|---|------|
| 초기 로딩 시간 | 62s (cold) | <2s | -97% | ✅ |
| SSOT 드리프트 | ? | 0 | - | ✅ |
| Pending 처리 시간 | ? | <1min | - | ✅ |

### Decision
- **Verdict**: `pending`
- **Next Action**:
- **Decided**:

---

## 프로젝트 가설

**"바닐라 JS 대시보드를 React+TS로 마이그레이션하면 페이지 경계 분리로 운영 복잡도가 감소하고, state.js 급팽창 없이 기능 추가 속도가 향상될 것이다"**

---

## 현재 문제점

### 핵심 문제
한 페이지에 Kanban+Calendar+Graph+Pending+Admin이 모두 섞여서 **state.js가 폭발**하고 있음.

### 현재 구조
```
_dashboard/
├── index.html (47KB)
├── css/ (13개)
└── js/
    ├── state.js (35KB) ← 폭발
    ├── api.js, app.js, auth.js
    └── components/ (21개)
        ├── pending-panel.js (82KB) ← 비대화
        ├── task-panel.js (59KB)
        ├── project-panel.js (47KB)
        └── calendar.js (40KB)
```

---

## IA (Information Architecture)

### 페이지 경계로 복잡도 분리

```
/kanban           → 운영 메인 (태스크 중심)
/projects/:id     → 프로젝트 중심 (태스크/임팩트/증거)
/pending          → Pending Review 전용 (3-pane)
/graph            → 관계 탐색 (D3)
/calendar         → 일정 (FullCalendar)
/program          → Program-Round (관리자 전용)
/login            → 인증
```

각 화면은 **자기 목적만 책임**, 공통은 Layout로 분리.

---

## 기술 설계

### Frontend
- **React + TypeScript**
- **React Router** (페이지 경계)
- **state.js 제거**:
  - 서버 상태 → **React Query** 캐시
  - UI 상태 → **URL query params + local state**
- **Code Splitting**: Calendar/Graph는 라우트 진입 시에만 로드

### Backend
- **FastAPI 유지** (Django 전환 불필요)
- 이유: UI가 앱급이고, 데이터가 파일/캐시 기반

### Data/SSOT
- SSOT는 **문서 frontmatter** (철학 유지)
- **Read Model(캐시) 분리**:
  - 단기: 서버 메모리 캐시 + 증분 갱신
  - 중기: SQLite/Firestore 영속 스냅샷

---

## API 설계 (필수)

### 초기 로딩 통합: `/api/dashboard-init`

**문제**: 현재 `State.loadAll()`이 12개 API + pending 추가 호출 → 느림

**해결**: 단일 엔드포인트
```json
GET /api/dashboard-init
{
  "constants": {...},
  "members": [...],
  "tracks": [...],
  "conditions": [...],
  "projects": [...],
  "tasks": [...],
  "pending_badge_count": 5,
  "user": {...}
}
```

### 상세는 on-demand
- `/api/projects/{id}` - 프로젝트 상세
- `/api/tasks/{id}` - 태스크 상세
- `/api/pending/{id}` - Pending 상세/approve/reject
- `/api/graph` - 그래프 데이터
- `/api/calendar` - 캘린더 집계

---

## 기능 요구사항 (FR)

### FR-1. Kanban
- 담당자 탭 (다중 선택)
- 프로젝트 필터, Quick Date (W/M) 토글 (현재 UX 유지)
- 태스크 컬럼 (todo/doing/hold/done/blocked) 렌더
- 카드 클릭 → Task Drawer 오픈
- (선택) Drag & drop으로 상태 변경

### FR-2. Task Drawer (패널)
- 필드 편집: project/assignee/status/priority/type/due/notes/links
- 첨부파일 업로드/목록/텍스트 추출 뷰 (기존 API 활용)
- 변경 즉시 반영 (optimistic update), 실패 시 롤백

### FR-3. Project Detail
- 프로젝트 메타 편집 (autosave 유지 가능)
- 관련 태스크 리스트/미니 칸반
- expected/realized impact 보기 및 Pending 제안 연결
- 관련 엔티티 링크 (Track/Condition/Hypothesis)로 이동

### FR-4. Pending Review
- list/detail/entity-preview 3-pane 유지
- workflow/run_id/status 필터
- 승인/거절/수정 후 즉시 반영 + audit trace 접근 ("왜 이 변경?")

### FR-5. Calendar
- due 기반 task 표시 (주/월)
- Google Calendar 연동 (이미 OAuth 기반 작업 존재)
- 월뷰 overflow/+more 등 UX 개선 (기존 v1 backlog 반영)

### FR-6. Graph
- 엔티티 그래프 탐색
- 노드 선택 시 상세 drawer 또는 프로젝트/태스크로 이동

### FR-7. Program (Admin)
- Program 생성/관리
- Program-Round 조인 데이터 조회 (기존 programRoundsData 흐름 유지)

### FR-8. 공통
- 로그인/JWT 관리 (현재 localStorage 기반 유지 가능)
- 단축키 (뷰 전환/필터/검색 등)는 v2에서도 유지·확장

---

## 비기능 요구사항 (NFR)

### 관측성
- API 실패/권한 오류/성능 (초기 로딩, 라우트 전환) 로그 수집

### 안전성
- autosave 시 race condition 방지 (동시 저장/낡은 응답 덮어쓰기 방지)

### 확장성
- tasks/projects 증가에 대비한 페이지네이션/가상 스크롤

---

## 마이그레이션 계획

### Phase 1: Frontend 아키텍처 전환 (1-2주)
1. React/TS 프로젝트 스캐폴드 + React Router 설정
2. React Query 및 API 클라이언트 설정
3. Layout 및 공통 컴포넌트 구현
4. `/kanban` 라우트 구현 (FR-1 Kanban)
5. Task Drawer 구현 (FR-2 Task Drawer)
6. 기존 v1과 병행 배포 설정

### Phase 2: Pending 분리 (2-4주)
7. `/pending` 라우트 구현 (FR-4 Pending Review)
8. Pending 승인/거부 플로우
9. Pending 상태 관리 최적화 (pending-panel.js 비대화 해소)

### Phase 3: Calendar/Graph 분리 + 성능 (4-8주)
10. `/calendar` 라우트 구현 (FR-5 Calendar, lazy load)
11. `/graph` 라우트 구현 (FR-6 Graph, lazy load)
12. `/projects/:id` 상세 페이지 (FR-3 Project Detail)
13. API - `/api/dashboard-init` 엔드포인트 추가
14. 성능 최적화 (캐시 cold start 제거)

### Phase 4: 운영 품질 (8-12주)
15. `/program` 관리자 페이지 (FR-7 Program)
16. 가상 스크롤 및 페이지네이션
17. 권한 분리 및 보안 강화 (exec C-level)
18. 관측성 및 에러 모니터링 (NFR)

---

## Tasks

태스크는 별도로 생성 예정.

---

## 운영 원칙 (SSOT 깨짐 방지)

### 수정 허용
✅ frontmatter (SSOT)

### 수정 금지
❌ `_build/*`, `_Graph_Index.md` (derived)

→ 대시보드는 **절대 derived를 직접 수정하지 않음**

---

## 구현 진행 상황 (2026-01-08 기준)

### Task 현황

| Task ID | 이름 | 상태 |
|---------|------|------|
| `tsk-022-20` | 프로젝트 초기화 | ✅ done |
| `tsk-022-23` | Kanban 보드 구현 | ✅ done |
| `tsk-022-25` | Pending Review 페이지 | ⏳ todo |

### 프로젝트 구조

```
dashboard-v2/src/
├── pages/
│   └── Kanban/              # 칸반 페이지
├── features/
│   ├── tasks/               # Task 관련
│   │   ├── components/Kanban/
│   │   │   ├── KanbanBoard.tsx    # DnD 보드
│   │   │   ├── KanbanColumn.tsx   # 컬럼 (Droppable)
│   │   │   └── TaskCard.tsx       # 카드 (Draggable)
│   │   └── selectors.ts           # 필터링 로직
│   ├── calendar/            # 캘린더 관련
│   │   ├── CalendarPage.tsx       # 메인 페이지
│   │   ├── components/
│   │   │   ├── CalendarView.tsx   # FullCalendar 래퍼
│   │   │   ├── CalendarSidebar.tsx # Google 계정 관리
│   │   │   ├── CustomToolbar.tsx  # 툴바
│   │   │   ├── ContextMenu.tsx    # 우클릭 메뉴
│   │   │   └── EventPopover.tsx   # 이벤트 팝오버
│   │   ├── queries/
│   │   │   ├── useCalendarEvents.ts  # 병합 (Task + Google)
│   │   │   ├── useGoogleCalendars.ts # 계정 목록
│   │   │   ├── useGoogleEvents.ts    # Google 이벤트
│   │   │   └── useUpdateTaskDates.ts # D&D 날짜 업데이트
│   │   ├── hooks/useCalendarUi.ts    # localStorage 설정
│   │   ├── utils/eventTransformers.ts # Task → Event 변환
│   │   └── types/
│   └── filters/             # 공통 필터 패널
└── queries/                 # React Query hooks
```

### Kanban 보드 (FR-1) - ✅ 완료

| 기능 | 상태 | 구현 |
|------|------|------|
| 5-컬럼 렌더링 | ✅ | `todo/doing/hold/done/blocked` |
| Drag & Drop | ✅ | `@hello-pangea/dnd` 사용 |
| 담당자 필터 (multi-select) | ✅ | URL params + `useKanbanFilters` |
| Project 필터 | ✅ | URL params |
| Week/Month 퀵 필터 | ✅ | `dateFilter: 'W' | 'M'` |
| URL 상태 유지 | ✅ | `useKanbanFilters` hook |
| 카드 클릭 → Drawer | ✅ | `UiContext.openEditTask()` |
| Track/Condition/Hypothesis 필터 | ✅ | `applyUrlFilters()` |

**핵심 코드**:
- `selectors.ts:163` - `buildKanbanColumns()` 메인 오케스트레이터
- `KanbanBoard.tsx:28` - D&D `onDragEnd` → status 업데이트

### Calendar 뷰 (FR-5) - ✅ 완료

| 기능 | 상태 | 구현 |
|------|------|------|
| FullCalendar 통합 | ✅ | `@fullcalendar/react` |
| Month/Week/Day 뷰 | ✅ | `dayGridPlugin`, `timeGridPlugin` |
| Task 표시 | ✅ | `transformTaskToEvent()` |
| Google Calendar 연동 | ✅ | `useGoogleEvents()` |
| Google 계정 관리 사이드바 | ✅ | `CalendarSidebar.tsx` |
| 캘린더 토글 (on/off) | ✅ | `useCalendarUi()` + localStorage |
| D&D 날짜 변경 | ✅ | `eventDrop`, `eventResize` → API |
| 날짜 클릭 → Context Menu | ✅ | `ContextMenu.tsx` |
| Google 이벤트 팝오버 | ✅ | `EventPopover.tsx` |
| Expand/+more 토글 | ✅ | `expandMode` (월뷰) |

**핵심 코드**:
- `useCalendarEvents.ts` - Task + Google 이벤트 병합 (order: Google=0, Task=1)
- `CalendarView.tsx:77` - `eventDrop` → `useUpdateTaskDates` mutation
- `eventTransformers.ts:26` - `transformTaskToEvent()` 날짜 검증 + 변환

### 기술 스택

- **React 19** + TypeScript
- **React Query** (서버 상태)
- **@hello-pangea/dnd** (Kanban D&D)
- **@fullcalendar/react** (Calendar)
- **localStorage** (UI 설정 persist)
- **Tailwind CSS** (스타일링)

### 개선 필요 사항

1. `CalendarPage.tsx:36` - `any` 타입 사용 (FullCalendar ref)
2. `eventTransformers.ts:15` - `getProjectColor()` TODO 미구현
3. Task 클릭 시 Drawer 연결 (`CalendarPage.tsx:94`) - console.log만 있음

### 다음 단계

1. **Pending Review 페이지** (`tsk-022-25`) - 3-pane 레이아웃
2. Task Drawer 완성 (Calendar에서 Task 클릭 시 연결)
3. `getProjectColor()` 실제 구현 (Track 색상 반영)

---

## Notes

### 산출물
다음 3개 문서로 확장 가능:
1. Dashboard v2 PRD (IA/권한/페이지/플로우/성공지표)
2. API Spec (`/api/dashboard-init` 포함, payload schema)
3. Frontend Architecture (폴더 구조, query key, routing, 상태 규칙)

---

## 참고 문서

- [[pgm-vault-system]] - 소속 Program
- [[trk-2]] - 소속 Track
- [[prj-dashboard-ux-v1]] - 선행 프로젝트 (Dashboard UX v1)
- [[00_Meta/schema_constants.yaml]] - SSOT

---

**Created**: 2026-01-07
**Owner**: 김은향
