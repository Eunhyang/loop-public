# Kanban By Assignee - Technical Specification

**Project**: Kanban By Assignee
**Version**: 0.1.0
**Last Updated**: 2025-12-21
**Status**: Planning

---

## 1. 개요

### 목적

칸반 보드의 네비게이션 구조를 변경하여 **담당자(Assignee) 중심**으로 Task를 관리할 수 있도록 한다.

### 현재 구조

```
[프로젝트 탭] ← 상위 (먼저 선택)
    └── Assignee 필터 (All, 김은향, 한명학, 임단, 미정) ← 하위
        └── 칸반 보드 (Todo | Doing | Done)
```

### 목표 구조

```
[Assignee 탭] ← 상위 (김은향, 한명학, 임단, 미정)
    └── 프로젝트별 그룹 ← 하위
        └── 칸반 보드 (Todo | Doing | Done)
```

### 핵심 기능

- Assignee 탭을 최상위 네비게이션으로 배치
- 담당자 선택 시 해당 담당자의 Task를 프로젝트별로 그룹핑
- 각 프로젝트 그룹 내에서 칸반 컬럼 (Todo, Doing, Done) 표시

---

## 2. 아키텍처

### 기술 스택

- **Language**: JavaScript (ES6+)
- **Framework**: Vanilla JS (기존 SPA 구조 유지)
- **API**: FastAPI (기존 API 사용)

### 관련 파일

```
_dashboard/
├── index.html              # Assignee 탭 HTML 구조 변경
├── css/
│   ├── main.css            # 탭 스타일 수정
│   └── kanban.css          # 프로젝트 그룹 스타일 추가
└── js/
    ├── state.js            # currentAssignee 상태 추가
    ├── app.js              # 초기화 로직 수정
    └── components/
        ├── tabs.js         # Assignee 탭으로 변경
        └── kanban.js       # 프로젝트별 그룹핑 로직
```

### 데이터 흐름

```
1. Assignee 탭 클릭
   ↓
2. state.currentAssignee = 선택된 담당자
   ↓
3. API 호출: GET /api/tasks?assignee={assignee}
   ↓
4. Task를 project_id로 그룹핑
   ↓
5. 각 프로젝트별로 칸반 컬럼 렌더링
```

---

## 3. UI 설계

### Assignee 탭 바

```
┌─────────────────────────────────────────────────────┐
│  [All (48)]  [김은향 (30)]  [한명학 (7)]  [임단 (2)]  [미정 (9)]  │
└─────────────────────────────────────────────────────┘
```

### 프로젝트별 그룹 레이아웃

```
담당자: 김은향 (30)

┌─ P001_Ontology ──────────────────────────────────────┐
│  Todo (3)      │  Doing (2)     │  Done (5)          │
│  ┌────────┐    │  ┌────────┐    │  ┌────────┐        │
│  │ Task 1 │    │  │ Task 4 │    │  │ Task 6 │        │
│  └────────┘    │  └────────┘    │  └────────┘        │
│  ┌────────┐    │  ┌────────┐    │  ...               │
│  │ Task 2 │    │  │ Task 5 │    │                    │
│  └────────┘    │  └────────┘    │                    │
└──────────────────────────────────────────────────────┘

┌─ P002_와디즈 런칭 ───────────────────────────────────┐
│  Todo (1)      │  Doing (0)     │  Done (2)          │
│  ...           │                │  ...               │
└──────────────────────────────────────────────────────┘
```

---

## 4. API 엔드포인트

기존 API 사용 (변경 없음):

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Task 목록 조회 |
| GET | `/api/tasks?assignee={name}` | 담당자별 Task 필터링 |
| GET | `/api/projects` | Project 목록 조회 |
| GET | `/api/members` | 멤버 목록 조회 |

---

## 5. 상태 관리

### state.js 변경

```javascript
// 기존
const state = {
  projects: [],
  tasks: [],
  currentProject: null,
  currentAssignee: 'all'
};

// 변경 후
const state = {
  projects: [],
  tasks: [],
  members: [],
  currentAssignee: 'all',  // 최상위 필터
  // currentProject 제거 또는 하위 필터로 변경
};
```

---

## 6. 구현 단계

### Step 1: HTML 구조 변경
- Assignee 탭 바 추가
- 프로젝트 그룹 컨테이너 추가

### Step 2: tabs.js 수정
- Assignee 탭 렌더링
- 탭 클릭 이벤트 처리

### Step 3: kanban.js 수정
- Task를 project_id로 그룹핑하는 로직
- 프로젝트별 칸반 보드 렌더링

### Step 4: CSS 스타일링
- 프로젝트 그룹 카드 스타일
- 접기/펼치기 UI (선택)

---

## 7. 아키텍처 결정 기록 (ADR)

### ADR-001: Assignee 탭을 최상위로 배치

- **날짜**: 2025-12-21
- **결정**: 프로젝트 탭 대신 Assignee 탭을 최상위 네비게이션으로 사용
- **이유**: 사용자가 "내 할 일"을 먼저 보고, 그 안에서 프로젝트별로 정리된 뷰를 원함
- **영향**: tabs.js, kanban.js, state.js 수정 필요

---

**Version**: 0.1.0
**Status**: Living Document
