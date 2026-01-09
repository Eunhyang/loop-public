---
entity_type: Project
entity_id: prj-023
entity_name: Dashboard - React+TS 마이그레이션
created: 2026-01-07
updated: '2026-01-09'
status: doing
parent_id: trk-2
program_id: pgm-vault-system
aliases:
- prj-023
- Dashboard - React+TS 마이그레이션
outgoing_relations: []
validates: []
validated_by: []
primary_hypothesis_id: null
owner: 김은향
budget: null
deadline: null
hypothesis_text: 바닐라 JS 대시보드를 React+TS로 마이그레이션하면 페이지 경계 분리로 운영 복잡도가 감소하고, state.js
  급팽창 없이 기능 추가 속도가 향상될 것이다
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
- tsk-023-10
- tsk-023-11
- tsk-023-12
- tsk-023-13
- tsk-023-14
- tsk-023-15
- tsk-023-16
- tsk-023-17
- tsk-023-18
- tsk-023-19
- tsk-023-20
- tsk-023-21
- tsk-023-22
- tsk-023-23
- tsk-023-24
- tsk-023-25
- tsk-023-26
- tsk-023-27
- tsk-023-28
- tsk-023-29
- tsk-023-30
- tsk-023-31
- tsk-023-32
- tsk-023-33
- tsk-023-34
- tsk-023-35
- tsk-023-36
- tsk-023-38
- tsk-023-39
- tsk-023-40
- tsk-023-41
- tsk-uegvfe-1767941662809
- tsk-023-42
- tsk-023-43
tier: null
impact_magnitude: null
confidence: null
condition_contributes:
- to: cond-e
  weight: 0.8
  description: 운영 효율화 - 대시보드 초기 로딩 2초 이내, SSOT 드리프트 제로, 기능 추가 속도 향상
track_contributes: []
expected_impact:
  statement: React+TS 마이그레이션으로 대시보드가 결정-증거-승인-학습 루프를 실제로 굴리는 OS가 된다
  metric: 초기 로딩 시간, SSOT 드리프트 수, Pending review 처리 시간, 기능 추가 소요 시간
  target: 로딩 <2초, 드리프트 0건, 리뷰 <1분, 기능 추가 시 state.js 급팽창 없음
realized_impact:
  verdict: null
  outcome: null
  evidence_links: []
  decided: null
  window_id: null
  time_range: null
  metrics_snapshot: {}
conditions_3y:
- cond-e
tags:
- project
- vault-system
- dashboard
- react
- typescript
- migration
priority_flag: high
---
# Dashboard - React+TS 마이그레이션

> Project ID: `prj-023` | Program: \[\[pgm-vault-system\]\] | Track: \[\[trk-2\]\] | Status: doing

---

## 🎯 North Star

**"내부 운영 대시보드가 '결정–증거–승인–학습' 루프를 실제로 굴리는 OS"**

### 90일 성공 기준 (측정 가능)

- ✅ 대시보드 초기 로드: &lt; 2초 (캐시 warm 기준)
- ✅ SSOT 드리프트 제로: 같은 엔티티가 다른 규칙/파일명 가정으로 깨지는 케이스 0
- ✅ 승인 워크플로 정착: Pending review 처리 시간 1분 내 (리뷰어 관점)
- ✅ 기능 추가 속도: 새 기능 1개 추가 시 "state.js 급팽창" 없이 진행

---

## Dashboard V2 Architecture & LLM Work Rules (SSOT + Clean Architecture)

> **적용 범위:** `loop/public/_dashboard/dashboard-v2/` 하위 코드만\
> \*\***목표:** 기능이 커져도(수백 프로젝트/수천 태스크) 구조가 무너지지 않는 **클린 아키텍처 + SSOT + Feature 기반 모듈화**\
> \*\***강제:** 이 문서는 dashboard-v2의 “법”이며, **LLM/Claude Code 포함 모든 기여자는 작업 전 반드시 읽고 준수**해야 합니다.

---

## 0) 절대 규칙 (Hard Rules)

### 0.1 레거시 수정 금지

- `loop/public/_dashboard/`의 레거시(v1) 파일은 **읽기 전용**입니다.
- 기능 추가/수정은 반드시 `dashboard-v2`에서만 합니다.
- 레거시에서 기능이 필요하면 **v2로 포팅 후** v2 규칙에 맞춰 구현합니다.

### 0.2 의존성 방향 고정 (Dependency Rule)

- `src/features/*` → `src/components/common/*` import ✅
- `src/components/common/*` → `src/features/*` import ❌ (**절대 금지**)
- `src/pages/*`는 **조합(오케스트레이션**)만 담당.
  - 페이지 컴포넌트 안에 비즈니스 로직/axios 호출/복잡한 계산 금지

### 0.3 SSOT(단일 진실의 원천) 고정

- **HTTP Client SSOT:** `src/services/http.ts`
- **DTO 타입 SSOT:** `src/types/*` (feature에서 DTO 재정의 금지)
- **React Query Key SSOT:** `src/queries/keys.ts`
- **대시보드 init SSOT Hook:** `src/queries/useDashboardInit.ts`
- **Feature API SSOT:** `src/features/<feature>/api.ts`
- **Feature Query Hooks SSOT:** `src/features/<feature>/queries.ts` 또는 `src/features/<feature>/queries/*`

### 0.4 빌드 게이트(필수)

- 작업 후 최소 1회: `npm run build` 통과가 필수입니다.
- TypeScript 에러/빌드 실패 상태로 작업을 끝내면 안 됩니다.

### 0.5 dist/node_modules 관리

- `dashboard-v2/dist` 및 `dashboard-v2/node_modules`는 **커밋/리뷰 대상이 아닙니다**.
- 코드 변경은 `src/` 중심으로만.

---

## 1) 현재(기준) 폴더 구조와 책임

> dashboard-v2는 **기술 기준(components/hooks/api**)가 아니라 **도메인/기능 기준(feature**)으로 구조화합니다.\
> “만능 파일”, “만능 폴더”를 만들지 않습니다.

### 1.1 `src/services/http.ts` (HTTP 레이어 SSOT)

**담당 ✅**

- Axios 인스턴스 생성
- Auth 헤더/토큰 주입
- 공통 에러 처리(401/403/5xx 등)

**담당 ❌**

- 도메인 엔드포인트 함수 정의 금지(예: createProject, getTasks 등)

---

### 1.2 `src/types/*` (서버 DTO SSOT)

**담당 ✅**

- 서버에서 오는 데이터 구조(예: Task, Project, PendingReview 등)
- DTO 인터페이스/타입은 여기서만 “권위 있게” 정의합니다.

**담당 ❌**

- feature 내부에서 DTO를 복제하거나 “다른 버전”을 만들지 않습니다.
- 파생 타입이 필요하면 feature 내부에서 “UI 전용 derived 타입”만 허용합니다.

---

### 1.3 `src/queries/keys.ts` (Query Key SSOT)

**담당 ✅**

- queryKey는 여기서만 정의합니다.
- invalidate/refetch/patch는 반드시 여기서 import한 key만 사용합니다.

**담당 ❌**

- 임의 문자열로 `invalidateQueries(['dashboard'])` 같은 호출 금지\
  (키가 달라지면 invalidate가 무효가 되어 버그가 생깁니다)

---

### 1.4 `src/queries/useDashboardInit.ts` (Dashboard Init SSOT)

**담당 ✅**

- `/api/dashboard-init`을 통한 초기 데이터 로드
- dashboardInit 데이터는 대시보드 전역에 쓰이는 SSOT 데이터로 취급합니다.

---

### 1.5 `src/features/<feature>/` (Feature 모듈: 로컬 완결성)

각 feature는 “기능 단위로 로컬 완결성”을 가져야 합니다.

**권장 구성**

- `api.ts` : 해당 feature의 endpoint wrapper
- `queries.ts` 또는 `queries/*` : react-query hooks / optimistic patch / invalidate 규칙
- `selectors.ts` : 순수 함수(필터링/정규화/그룹핑). React/Query import 금지
- `components/*` : 도메인 UI(패널/리스트/카드 등)
- `utils/*` : 도메인 유틸(순수 함수)

---

### 1.6 `src/components/common/*` (진짜 공용 UI만)

**담당 ✅**

- 진짜 범용 UI(예: DrawerShell)
- “특정 도메인 규칙이 없는” 순수 UI

**담당 ❌**

- 비즈니스 로직/도메인 규칙/쿼리 훅/axios 호출
- feature 내부 파일 import 금지

---

### 1.7 `src/pages/*` (라우트 조합 레이어)

**담당 ✅**

- 라우트 단위 레이아웃/조합
- feature component를 배치하고 props를 전달

**담당 ❌**

- 비즈니스 로직
- axios 호출
- 복잡한 계산(그룹핑/필터링/정규화)
- “만능 state.js” 같은 전역 상태 파일 생성 금지

---

## 2) Drawer 표준 (최종 합의 아키텍처)

### 2.1 원칙

- **원칙 A: DrawerShell = 레이아웃만**
  - overlay/backdrop/slide-in/close/slots만 제공
  - Save 로직/validation/API 호출/폼 상태 관리 ❌
- **원칙 B: Form = features 소유**
  - 폼은 각 도메인(feature)에 존재
  - common에 forms를 몰아넣지 않음(공용 폴더 괴물 방지)
- **원칙 C: EntityDrawer = 1개**
  - AppLayout에서 단일 진입점으로 렌더
  - “드로어 2개” 구조(겹침/충돌) 금지

---

### 2.2 파일 구조(최종)

- 공통 Shell:

  - `src/components/common/DrawerShell.tsx`

- 단일 진입 EntityDrawer:

  - `src/components/layout/EntityDrawer.tsx`\
    (기존 `CreationDrawer.tsx`를 대체/흡수)

- UI 상태:

  - `src/contexts/UiContext.tsx`\
    (activeEntityDrawer 상태 + open/close 액션)

- 폼(feature 소유):

  - `src/features/tasks/components/TaskForm.tsx`
  - `src/features/projects/components/ProjectForm.tsx`
  - `src/features/programs/components/ProgramForm.tsx`
  - `src/features/strategy/components/TrackForm.tsx`
  - `src/features/strategy/components/ConditionForm.tsx`
  - `src/features/strategy/components/HypothesisForm.tsx`

> 참고: `TaskDrawer`는 유지할 수 있습니다.\
> 다만 EntityDrawer에서 task 타입일 때 TaskDrawer를 렌더(조합)하거나, TaskForm을 직접 렌더하는 방식 중 하나로 단일화해야 합니다.

---

### 2.3 UiContext 타입(최종 권장)

> **중요:** edit 모드에서 payload 전체를 저장하지 않습니다(낡은 데이터 문제).\
> edit은 **id만 저장**하고, 실제 데이터는 각 폼 내부 query hook으로 fetch 합니다.

```ts
type EntityType = 'task' | 'project' | 'program' | 'track' | 'hypothesis' | 'condition';

type PrefillMap = {
  task: Partial<any>;
  project: Partial<any>;
  program: Partial<any>;
  track: Partial<any>;
  hypothesis: Partial<any>;
  condition: Partial<any>;
};

type ActiveEntityDrawer =
  | null
  | { type: EntityType; mode: 'create'; prefill?: PrefillMap[EntityType] }
  | { type: EntityType; mode: 'edit'; id: string };
```

---

### **2.4 DrawerShell 책임 (명확히)**

**담당 ✅**

- backdrop + 클릭 시 닫기

- slide-in 애니메이션

- close 버튼

- header slot(title)

- body slot(children)

- footer slot(optional)

**담당 ❌**

- Save 버튼 로직

- validation

- API 호출

- form state 관리

---

## **3) 필터 SSOT 규칙 (Kanban 기준, 확장 가능)**

### **3.1 필터 상태 저장 위치**

**URL = 공유 가능한 Navigation 상태(SSOT)**

- assignees\[\]

- projectId (단일)

- programId (단일, 필요 시)

- trackId / conditionId / hypothesisId

- dateMode(W/M), selectedWeeks\[\], selectedMonths\[\]

**localStorage = 개인 View Preference**

- showInactiveMembers, showNonCoreMembers

- showInactiveProjects, showInactiveTasks

- taskStatus\[\], taskPriority\[\], taskTypes\[\]

- projectStatus\[\], projectPriority\[\]

- React Context는 가능하면 최소화하며, 필요 시에도 “localStorage SSOT를 UI에서 편하게 쓰기 위한 캐시”로만 사용합니다.

---

### **3.2 필터 파이프라인(강제)**

selectors는 반드시 다음 pipeline 형태를 따릅니다.

1. **Project-level filtering** → allowedProjectIds(Set)

2. **Task-level filtering**

3. **Member visibility filtering**

> Track/Condition/Hypothesis는 Project 레벨의 속성(parent_id, conditions_3y, validates 등)으로 연결되므로

> Task-level에서 직접 처리하지 말고 Project-level에서 allowedProjects를 만든 뒤 Task를 필터링합니다.

---

### **3.3 상위 엔티티 조합 필터(AND) 규칙**

- Track + Condition + Hypothesis 조합은 **AND 누적**으로 동작해야 합니다.

- 프로젝트 조회는 Map(projectId → project)로 O(1) 접근해야 합니다.

- 옵션 필드는 ?. + ?? false로 안전 처리합니다.

- project가 없는 task(불일치)는 상위 필터 활성화 시 제외(false) 처리합니다.

---

## **4) Feature 구현 규칙 (Pending / Calendar 등)**

### **4.1 Feature 추가 패턴(강제)**

새 기능은 반드시 src/features/&lt;feature&gt;/ 아래에 추가합니다.

src/features/pending/

- api.ts / types.ts / queries/\* / components/\*

- src/pages/Pending/index.tsx는 3-pane 레이아웃 조합만

src/features/calendar/

- google plugin 사용 금지

- /api/google/\* 기반 custom event source 사용

- range는 YYYY-MM-DD normalize 필수

- legacy parity: eventOrder, view별 dayMaxEvents 정책 준수

---

### **4.2 Pending Review MVP 권장 규칙(요약)**

- 3-pane layout: list / detail / entity preview

- reject는 reason 필수(모달/다이얼로그 컴포넌트 포함)

- entity preview 5종: Condition/Track/Hypothesis는 init 데이터 lookup, Project/Task는 API fetch 권장

- 3-pane 스크롤은 min-h-0 + overflow-y-auto 체인을 명확히 적용

---

## **5) RBAC(권한) 원칙**

- “Program이 admin-only” 같은 UI 단위 규칙은 고정하지 않습니다.

- 실제로 보호해야 하는 것은 **exec 출처 데이터(exec API/vault)** 입니다.

- 프론트는 버튼/메뉴를 role/scope로 제어할 수 있으나, **보안은 서버(403)에서 최종 강제**되어야 합니다.

---

## **6) LLM/Claude Code 작업 전/후 체크리스트 (복붙용)**

### **✅ Pre-flight (작업 전 필수)**

- 변경 대상이 dashboard-v2 내부인가? (레거시 수정 금지)

- 파일 배치가 올바른 폴더 책임에 맞나?

- axios/fetch는 feature api.ts 또는 services/http.ts만 사용하는가?

- DTO 타입은 src/types에서 import 했는가?

- queryKey는 src/queries/keys.ts에서 import 했는가?

- common이 feature를 import하지 않는가?

- selectors는 pure function 유지(React/Query import 금지)인가?

### **✅ Post-flight (작업 후 필수)**

- npm run build 통과

- dist/node_modules 변경 없음

- optimistic update가 필요한 곳은 queryKeys 기반 patch/invalidate를 사용했는가?

- UI/필터/드로어 동작을 최소 1회 수동 검증했는가?

---

## **7) 운영 원칙 (LLM 협업 품질)**

- 제안은 1회, 불필요한 “승인 요청 반복” 금지

  (선택지를 제시하고 진행 가능한 형태로 정리)

- 구조 변경(새 폴더/새 SSOT 도입)은 짧게라도 “이유”를 남긴다.

- 큰 변경은 작은 커밋/작은 PR 단위로 쪼갠다.

---

## **8) 결론**

dashboard-v2는 **클린 아키텍처 + SSOT + feature 기반 모듈화**를 핵심 원칙으로 합니다.

모든 변경은 이 경계 안에서만 이루어져야 하며:

- UI는 얇게

- 비즈니스 로직은 selectors/service/query hooks로

- 상태는 단일 진실 원천으로

- 공통(common)은 진짜 공용 UI만

이 규칙을 지키면 규모가 커져도 구조가 무너지지 않고, LLM이 작업해도 스파게티가 생기지 않습니다.

## 🏁 Project Rollup

> ⚠️ **프로젝트 종료 시 필수 작성** (진행 중에는 비워둠)

### Conclusion

1. 
2. 
3. 

### Evidence

| \# | Type | 근거 요약 | 링크 |
| --- | --- | --- | --- |
| 1 |  |  | \[\[\]\] |

### Metric Delta

| Metric | Before | After | Δ | 판정 |
| --- | --- | --- | --- | --- |
| 초기 로딩 시간 | 62s (cold) | &lt;2s | \-97% | ✅ |
| SSOT 드리프트 | ? | 0 | \- | ✅ |
| Pending 처리 시간 | ? | &lt;1min | \- | ✅ |

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
| --- | --- | --- |
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
| --- | --- | --- |
| 5-컬럼 렌더링 | ✅ | `todo/doing/hold/done/blocked` |
| Drag & Drop | ✅ | `@hello-pangea/dnd` 사용 |
| 담당자 필터 (multi-select) | ✅ | URL params + `useKanbanFilters` |
| Project 필터 | ✅ | URL params |
| Week/Month 퀵 필터 | ✅ | \`dateFilter: 'W' |
| URL 상태 유지 | ✅ | `useKanbanFilters` hook |
| 카드 클릭 → Drawer | ✅ | `UiContext.openEditTask()` |
| Track/Condition/Hypothesis 필터 | ✅ | `applyUrlFilters()` |

**핵심 코드**:

- `selectors.ts:163` - `buildKanbanColumns()` 메인 오케스트레이터
- `KanbanBoard.tsx:28` - D&D `onDragEnd` → status 업데이트

### Calendar 뷰 (FR-5) - ✅ 완료

| 기능 | 상태 | 구현 |
| --- | --- | --- |
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

- \[\[pgm-vault-system\]\] - 소속 Program
- \[\[trk-2\]\] - 소속 Track
- \[\[prj-dashboard-ux-v1\]\] - 선행 프로젝트 (Dashboard UX v1)
- \[\[00_Meta/schema_constants.yaml\]\] - SSOT

---

**Created**: 2026-01-07 **Owner**: 김은향