# SPA Dashboard - Technical Specification

**Project**: SPA Dashboard
**Version**: 0.2.0
**Last Updated**: 2025-12-19
**Status**: Planning

---

## 1. 개요

### 목적

Python 스크립트로 정적 HTML을 생성하는 현재 방식을 JavaScript SPA로 전환하여:
1. API에서 데이터를 실시간으로 가져와 렌더링
2. Task/Project CRUD 기능 제공 (생성/조회/수정/삭제)
3. 전략 계층 구조 시각화 (Track → Project → Task)
4. 관계 데이터 표시 (validates, parent_id 등)

### 핵심 기능

1. **Task/Project 전체 CRUD**: 생성, 조회, 수정, 삭제
2. **Schema 준수**: YAML frontmatter 형식 자동 생성
3. **전략 계층 표시**: Track → Project → Task 관계
4. **관계 시각화**: validates, parent_id, conditions_3y 등

### 현재 vs 목표

| 항목 | 현재 | 목표 (SPA) |
|------|------|-----------|
| 렌더링 | Python → HTML 생성 | JavaScript 동적 렌더링 |
| 데이터 | 빌드 시점 스캔 | API 실시간 fetch |
| Task CRUD | API 존재, UI 없음 | 완전한 UI 제공 |
| Project CRUD | GET/POST만 | GET/POST/PUT/DELETE |
| 전략 계층 | 표시 없음 | Track → Project 연결 표시 |
| 관계 표시 | 없음 | validates, parent_id 표시 |

---

## 2. 데이터 모델

### 엔티티 계층 구조

```
NorthStar (ns:001)
 └─ MetaHypothesis (mh:1-4)
     └─ Condition (cond:a-e)
         └─ Track (trk:1-6)
             └─ Project (prj:001-999)
                 └─ Task (tsk:XXX-YY)
```

### Task Schema

```yaml
entity_type: Task
entity_id: "tsk:001-01"
entity_name: "태스크 이름"
created: 2025-12-19
updated: 2025-12-19
status: todo | doing | done | blocked

# 계층
parent_id: "prj:001"
project_id: "prj:001"

# Task 전용
assignee: "eunhyang"
priority: low | medium | high
due: 2025-12-31 | null

# 관계
validates: ["hyp:001"]
tags: ["tag1", "tag2"]
```

### Project Schema

```yaml
entity_type: Project
entity_id: "prj:001"
entity_name: "프로젝트 이름"
created: 2025-12-19
updated: 2025-12-19
status: active | planning | completed

# 계층
parent_id: "trk:2"

# Project 전용
owner: "eunhyang"
deadline: 2025-12-31 | null
hypothesis_text: "프로젝트 가설"

# 관계
validates: ["hyp:001"]
conditions_3y: ["cond:b"]
```

### Members

```yaml
members:
  - id: "eunhyang"
    name: "은향"
    role: "Founder"
  - id: "myunghak"
    name: "명학"
    role: "Member"
  - id: "dan"
    name: "단"
    role: "Member"
```

---

## 3. API 엔드포인트

### 현재 API (기존)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /api/tasks | Task 목록 | ✅ |
| POST | /api/tasks | Task 생성 | ✅ |
| PUT | /api/tasks/{id} | Task 수정 | ✅ |
| DELETE | /api/tasks/{id} | Task 삭제 | ✅ |
| GET | /api/projects | Project 목록 | ✅ |
| POST | /api/projects | Project 생성 | ✅ |
| GET | /api/members | Member 목록 | ✅ |

### 추가 필요 API

| Method | Endpoint | Description | Priority |
|--------|----------|-------------|----------|
| PUT | /api/projects/{id} | Project 수정 | High |
| DELETE | /api/projects/{id} | Project 삭제 | High |
| GET | /api/tracks | Track 목록 | Medium |
| GET | /api/graph | 전체 관계 그래프 | Low |

---

## 4. SPA 아키텍처

### 기술 스택

- **Frontend**: Vanilla JavaScript (프레임워크 없음)
- **Styling**: 기존 CSS 유지 + 확장
- **API**: FastAPI (기존)
- **Data Format**: JSON

### 파일 구조

```
_dashboard/
└── index.html    # SPA (HTML + CSS + JavaScript 인라인)
```

### 데이터 흐름

```
Browser
    ↓ User Action (탭 클릭, CRUD 버튼)
JavaScript Event Handler
    ↓ fetch()
FastAPI (/api/*)
    ↓ Vault 파일 읽기/쓰기
Markdown Files (50_Projects/...)
    ↓ JSON Response
JavaScript State
    ↓ render()
DOM Update
```

---

## 5. UI 구조

### 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│ Header: LOOP Strategy Dashboard           [+ New Task] [+ Project] │
├─────────────────────────────────────────────────────────────┤
│ Project Tabs: [All] [P001] [P002] [P003] ...              │
├─────────────────────────────────────────────────────────────┤
│ Kanban Board                                                │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │   TODO   │ │  DOING   │ │   DONE   │ │ BLOCKED  │       │
│ │   (5)    │ │   (3)    │ │   (10)   │ │   (1)    │       │
│ ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤       │
│ │┌────────┐│ │┌────────┐│ │┌────────┐│ │┌────────┐│       │
│ ││Task    ││ ││Task    ││ ││Task    ││ ││Task    ││       │
│ ││────────││ ││────────││ ││────────││ ││────────││       │
│ ││Project ││ ││Project ││ ││Project ││ ││Project ││       │
│ ││Track   ││ ││Track   ││ ││Track   ││ ││Track   ││       │
│ ││Assignee││ ││Assignee││ ││Assignee││ ││Assignee││       │
│ │└────────┘│ │└────────┘│ │└────────┘│ │└────────┘│       │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Task 카드 상세

```
┌─────────────────────────────┐
│ [high] Task Name            │  ← 우선순위 색상 + 이름
│ tsk:001-01                  │  ← ID
├─────────────────────────────┤
│ 📁 P001: Ontology v0.1      │  ← 프로젝트 링크
│ 📊 Track 2: Data            │  ← Track 표시
│ 🎯 validates: hyp:001       │  ← 가설 연결
├─────────────────────────────┤
│ 👤 은향  📅 12/31           │  ← 담당자, 마감일
│ [Edit] [Delete]             │  ← 액션 버튼
└─────────────────────────────┘
```

### Modal: Task 생성/수정

```
┌─────────────────────────────────┐
│ Create New Task            [X] │
├─────────────────────────────────┤
│ Task Name: [________________]  │
│ Project:   [Select Project ▼]  │
│ Assignee:  [Select Member  ▼]  │
│ Priority:  ○Low ●Medium ○High  │
│ Status:    [Select Status  ▼]  │
│ Due Date:  [____-__-__]        │
│ Tags:      [________________]  │
│ Validates: [________________]  │
├─────────────────────────────────┤
│        [Cancel] [Create]       │
└─────────────────────────────────┘
```

---

## 6. JavaScript 모듈 구조

```javascript
// ============================================
// 1. State Management
// ============================================
const state = {
    projects: [],
    tasks: [],
    tracks: [],
    members: [],
    currentProject: null,  // null = All
    loading: false,
    error: null
};

// ============================================
// 2. API Functions
// ============================================
const API = {
    // Tasks
    getTasks: (projectId) => fetch(`/api/tasks${projectId ? `?project_id=${projectId}` : ''}`),
    createTask: (data) => fetch('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
    updateTask: (id, data) => fetch(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTask: (id) => fetch(`/api/tasks/${id}`, { method: 'DELETE' }),

    // Projects
    getProjects: () => fetch('/api/projects'),
    createProject: (data) => fetch('/api/projects', { method: 'POST', body: JSON.stringify(data) }),

    // Members
    getMembers: () => fetch('/api/members')
};

// ============================================
// 3. Render Functions
// ============================================
function renderHeader() { ... }
function renderTabs() { ... }
function renderBoard() { ... }
function renderColumn(status, tasks) { ... }
function renderTaskCard(task) { ... }
function renderModal(type, data) { ... }
function renderToast(message, type) { ... }

// ============================================
// 4. Event Handlers
// ============================================
function onTabClick(projectId) { ... }
function onTaskClick(taskId) { ... }
function onCreateTask() { ... }
function onEditTask(taskId) { ... }
function onDeleteTask(taskId) { ... }
function onCreateProject() { ... }
function onModalSubmit() { ... }
function onModalClose() { ... }

// ============================================
// 5. Utility Functions
// ============================================
function groupTasksByStatus(tasks) { ... }
function getProjectById(id) { ... }
function getTrackById(id) { ... }
function getMemberById(id) { ... }
function formatDate(date) { ... }

// ============================================
// 6. Init
// ============================================
async function init() {
    state.loading = true;
    renderLoading();

    await Promise.all([
        loadMembers(),
        loadProjects(),
        loadTasks()
    ]);

    state.loading = false;
    renderHeader();
    renderTabs();
    renderBoard();
}

document.addEventListener('DOMContentLoaded', init);
```

---

## 7. 마이그레이션 계획

### Phase 1: API 확장

1. Project PUT/DELETE 엔드포인트 추가
2. Track GET 엔드포인트 추가 (선택)

### Phase 2: SPA 기본 구조

1. HTML shell 작성
2. CSS 스타일 (기존 유지 + 확장)
3. JavaScript 상태 관리

### Phase 3: 데이터 로딩 & 렌더링

1. API fetch 함수 구현
2. 렌더링 함수 구현 (Header, Tabs, Board, Card)
3. 프로젝트 필터링

### Phase 4: CRUD 기능

1. Task 생성 Modal
2. Task 수정 Modal
3. Task 삭제 확인
4. Project 생성 Modal

### Phase 5: 관계 표시

1. Track → Project 연결 표시
2. validates 가설 표시
3. conditions_3y 표시

---

## 8. 테스트 전략

- [ ] API 서버 실행 상태에서 테스트
- [ ] 빈 프로젝트 상태 테스트
- [ ] Task CRUD 테스트 (생성 → 수정 → 삭제)
- [ ] Project CRUD 테스트
- [ ] 프로젝트 필터링 테스트
- [ ] 에러 상태 테스트 (API 오류)
- [ ] 브라우저 콘솔 에러 확인

---

## 9. 배포

### 개발 환경

```bash
# API 서버 실행
cd /Volumes/LOOP_CORE/vault/LOOP
poetry run uvicorn api.main:app --reload --port 8081

# 브라우저에서 확인
open http://localhost:8081
```

### 프로덕션 환경 (NAS)

- API 서버 재시작 시 자동 반영
- build_dashboard.py 실행 불필요
- 실시간 데이터 반영

---

## 10. 아키텍처 결정 기록 (ADR)

### ADR-001: Vanilla JavaScript 선택

- **날짜**: 2025-12-19
- **결정**: React/Vue 대신 Vanilla JavaScript 사용
- **이유**:
  - 빌드 도구 불필요
  - 단일 HTML 파일 유지
  - 기존 코드와 일관성
- **영향**: 복잡한 상태 관리 시 코드 증가 가능

### ADR-002: 인라인 JavaScript

- **날짜**: 2025-12-19
- **결정**: 별도 .js 파일 대신 HTML 내 인라인
- **이유**:
  - 단일 파일 배포
  - FastAPI FileResponse 단순화
- **영향**: 파일 크기 증가, 캐싱 불가

### ADR-003: 원본 MD 파일 단일 소스

- **날짜**: 2025-12-19
- **결정**: API가 직접 Vault .md 파일을 읽고 씀
- **이유**:
  - 별도 DB 불필요
  - Obsidian과 동기화 자동
  - 스키마 일관성 유지
- **영향**: 파일 I/O 성능 고려 필요

---

**Version**: 0.2.0
**Status**: Living Document