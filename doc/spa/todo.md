# SPA Dashboard - TODO

**Project**: SPA Dashboard
**Last Updated**: 2025-12-19

---

## 완료된 작업

### Phase 1: API 확장

- [x] **SPA-001** Project PUT 엔드포인트 추가
  - 수정 파일: `api/models/entities.py`, `api/routers/projects.py`
  - 작업 내용: Project 수정 API 구현
  - 완료일: 2025-12-19

- [x] **SPA-002** Project DELETE 엔드포인트 추가
  - 수정 파일: `api/routers/projects.py`
  - 작업 내용: Project 삭제 API 구현 (force 옵션 포함)
  - 완료일: 2025-12-19

- [x] **SPA-003** Track GET 엔드포인트 추가
  - 수정 파일: `api/routers/tracks.py` (신규), `api/main.py`
  - 작업 내용: Track 목록 조회 API 구현
  - 완료일: 2025-12-19

- [x] **SPA-025** Constants API 추가
  - 수정 파일: `api/constants.py` (신규), `api/main.py`
  - 작업 내용: Task 상태, Priority 등 상수를 API로 제공
  - 변경 사항:
    - `api/constants.py` 신규 생성
    - `GET /api/constants` 엔드포인트 추가
    - Task status, priority, project status, entity types 등 포함
  - 완료일: 2025-12-19

### Phase 2: SPA 재구축 (모듈화)

- [x] **SPA-028** Task Side Panel 구현
  - 수정 파일: `_dashboard/css/panel.css` (신규), `_dashboard/index.html`, `_dashboard/js/components/task-panel.js` (신규), `_dashboard/js/app.js`, `_dashboard/js/components/kanban.js`, `_dashboard/js/components/task-card.js`, `_dashboard/css/kanban.css`
  - 작업 내용: 카드 클릭 시 사이드 패널 오픈, Task 상세 보기/수정 가능
  - 변경 사항:
    - `panel.css` 신규 생성 (슬라이드 인 애니메이션)
    - `task-panel.js` 신규 생성 (패널 컴포넌트)
    - `kanban.js`에 카드 클릭 → TaskPanel.open() 연결
    - `task-card.js`에서 Edit 버튼 제거 (패널로 대체)
    - `kanban.css`에 cursor: pointer 추가
  - 완료일: 2025-12-19

- [x] **SPA-026** SPA 폴더 구조 재설계
  - 수정 파일: `_dashboard/` 전체
  - 작업 내용: 단일 HTML 대신 모듈화된 파일 구조로 변경
  - 변경 사항:
    ```
    _dashboard/
    ├── index.html
    ├── css/
    │   ├── main.css
    │   ├── kanban.css
    │   └── modal.css
    └── js/
        ├── api.js
        ├── state.js
        ├── app.js
        └── components/
            ├── tabs.js
            ├── kanban.js
            ├── task-card.js
            ├── task-modal.js
            ├── project-modal.js
            └── relations.js
    ```
  - 완료일: 2025-12-19

- [x] **SPA-027** FastAPI 정적 파일 서빙 설정
  - 수정 파일: `api/main.py`
  - 작업 내용: CSS, JS 정적 파일 서빙 설정
  - 변경 사항:
    - `StaticFiles` import 추가
    - `/css`, `/js` 경로 마운트
  - 완료일: 2025-12-19

- [x] **SPA-029** Task 드래그 앤 드롭
  - 수정 파일: `_dashboard/js/components/task-card.js`, `_dashboard/js/components/kanban.js`, `_dashboard/css/kanban.css`
  - 작업 내용: Task 카드를 드래그하여 다른 상태 컬럼으로 이동
  - 변경 사항:
    - `task-card.js`: `draggable="true"` 속성 추가
    - `kanban.js`: `attachDragListeners()` 메서드 추가, dragstart/dragend/dragover/dragleave/drop 이벤트 처리
    - `kanban.css`: `.dragging`, `.drag-over` 클래스 스타일 추가 (opacity, 파란색 테두리)
  - 완료일: 2025-12-19

- [x] **SPA-030** Task Panel 전체화면 확장
  - 수정 파일: `_dashboard/index.html`, `_dashboard/css/panel.css`, `_dashboard/js/components/task-panel.js`
  - 작업 내용: 패널 헤더에 확장 버튼 추가, 전체화면 토글
  - 변경 사항:
    - `index.html`: 패널 헤더에 `panel-expand` 버튼 추가
    - `panel.css`: `.expanded` 클래스 스타일 (width: 100%, 중앙 정렬)
    - `task-panel.js`: `toggleExpand()` 메서드, `isExpanded` 상태 관리
  - 완료일: 2025-12-19

- [x] **SPA-031** Notes 마크다운 렌더링
  - 수정 파일: `_dashboard/index.html`, `_dashboard/css/panel.css`, `_dashboard/js/components/task-panel.js`, `api/models/entities.py`, `api/routers/tasks.py`
  - 작업 내용: Notes 필드에 마크다운 지원 (## 제목, **볼드**, *이탤릭*, 리스트 등)
  - 변경 사항:
    - `index.html`: Notes 섹션에 프리뷰/편집 토글 구조
    - `panel.css`: 마크다운 렌더링 스타일 (h1-h3, code, blockquote, list 등)
    - `task-panel.js`: `renderMarkdown()`, `toggleNotesEdit()`, `updateNotesPreview()` 메서드
    - `api/models/entities.py`: TaskCreate/TaskUpdate에 `notes` 필드 추가
    - `api/routers/tasks.py`: create/update에 notes 저장 로직 추가
  - 완료일: 2025-12-19

---

## 진행 중

(없음)

---

## 예정된 작업

### 기능 완성

- [ ] **SPA-014** Task 상태 변경 (Quick Action)
  - 파일: `_dashboard/js/components/task-card.js`, `kanban.js`
  - 작업 내용: 카드에서 바로 상태 변경 드롭다운 (이미 구현됨, 테스트 필요)
  - 우선순위: Medium

- [ ] **SPA-016** Project 수정 Modal
  - 파일: `_dashboard/js/components/project-modal.js`
  - 작업 내용: Project 수정 폼 (이미 구현됨, 테스트 필요)
  - 우선순위: Medium

- [ ] **SPA-017** Project 삭제 확인
  - 파일: `_dashboard/js/app.js`
  - 작업 내용: 삭제 확인 (하위 Task 경고 포함)
  - 우선순위: Medium

- [ ] **SPA-018** Track → Project 연결 표시
  - 파일: `_dashboard/js/components/relations.js`
  - 작업 내용: Task 카드에 상위 Track 이름 표시 (이미 구현됨)
  - 우선순위: Medium

- [ ] **SPA-019** validates 가설 표시
  - 파일: `_dashboard/js/components/relations.js`
  - 작업 내용: Task/Project가 검증하는 가설 ID 표시 (이미 구현됨)
  - 우선순위: Low

- [ ] **SPA-020** conditions_3y 표시
  - 파일: `_dashboard/js/components/relations.js`
  - 작업 내용: Project가 연결된 3년 조건 표시 (이미 구현됨)
  - 우선순위: Low

---

## 알려진 이슈

(없음)

---

## 진행 현황

### 완료
- API: Project PUT/DELETE, Track GET, Constants GET, Task notes 필드
- SPA 구조: 모듈화된 파일 구조, 정적 파일 서빙
- Task Side Panel (카드 클릭 → 상세 보기/수정)
- Task 드래그 앤 드롭 (컬럼 간 이동으로 상태 변경)
- Task Panel 전체화면 확장 (⛶ 버튼)
- Notes 마크다운 렌더링 (## 제목, **볼드**, 리스트 등)

### 구현됨 (테스트 필요)
- Task CRUD (생성, 수정, 삭제)
- Project CRUD (생성, 수정, 삭제)
- Task 상태 Quick Action (드롭다운)
- 관계 표시 (Track, validates, conditions_3y)

### 남은 작업
- 브라우저에서 실제 테스트
- 버그 수정

---

## 파일 구조

```
_dashboard/
├── index.html              # 메인 HTML (모달, 패널, 컨테이너)
├── css/
│   ├── main.css            # 기본 레이아웃, 버튼, 토스트
│   ├── kanban.css          # 칸반 보드, 카드, 드래그앤드롭 스타일
│   ├── modal.css           # 모달 스타일
│   └── panel.css           # 사이드 패널 스타일
└── js/
    ├── api.js              # API 호출 모듈
    ├── state.js            # 전역 상태 관리
    ├── app.js              # 메인 엔트리, 초기화
    └── components/
        ├── tabs.js         # 프로젝트 탭
        ├── kanban.js       # 칸반 보드, 드래그앤드롭
        ├── task-card.js    # Task 카드 (관계 표시, draggable)
        ├── task-panel.js   # Task 상세 사이드 패널
        ├── task-modal.js   # Task CRUD 모달
        ├── project-modal.js # Project CRUD 모달
        └── relations.js    # 상위 연결 정보 (Track, validates, conditions)
```

---

**Last Updated**: 2025-12-19
