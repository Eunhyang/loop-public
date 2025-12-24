# Dashboard API - TODO

**Project**: Dashboard API
**Last Updated**: 2025-12-23

---

## 완료된 작업

### BUG-001: Project 저장 시 Kanban 필터 함수 에러 수정

- [x] **BUG-001-1** Kanban.renderAssigneeFilter is not a function 에러 수정
  - 수정 파일: `_dashboard/js/components/project-panel.js`
  - 작업 내용: 존재하지 않는 함수 호출 수정
  - 변경 사항:
    - `Kanban.renderAssigneeFilter()` → `Kanban.renderProjectFilter()` (2곳)
    - 이전 리팩토링에서 함수명 변경 후 호출부 미갱신 문제
  - 완료일: 2025-12-23

### UX-001: Done 프로젝트 기본 필터에서 제외

- [x] **UX-001-1** Project status 기본 필터에서 'done' 제외
  - 수정 파일: `_dashboard/js/state.js`
  - 작업 내용: 대시보드 로드 시 done 프로젝트 기본 숨김
  - 변경 사항:
    - `filters.project.status` 기본값에서 `'done'` 제거
    - 사용자가 필터 패널에서 Done 체크하면 표시 가능
  - 완료일: 2025-12-23

### API-001: Task 본문(body) 표시 기능

- [x] **API-001-1** API 서버에서 body 추출
  - 수정 파일: `scripts/api_server.py`
  - 작업 내용: `extract_frontmatter_and_body()` 함수 추가, `get_tasks()`에 `include_body` 파라미터 추가
  - 변경 사항:
    - `Tuple` import 추가
    - 새 함수: body를 함께 추출하여 `_body` 필드로 반환
    - 경로 검증: `is_relative_to(VAULT_DIR)` 추가
  - 완료일: 2025-12-21

- [x] **API-001-2** Dashboard에서 _body 표시
  - 수정 파일: `_dashboard/js/components/task-panel.js`
  - 작업 내용: `task.notes || task._body || ''` 폴백 로직 추가
  - 완료일: 2025-12-21

- [x] **API-001-3** Obsidian 링크 아이콘 추가
  - 수정 파일: `_dashboard/js/components/task-card.js`, `_dashboard/css/kanban.css`
  - 작업 내용:
    - `getObsidianUri()` 헬퍼 함수 추가
    - Task 카드에 📝 아이콘 버튼 추가
    - `.btn-obsidian` CSS 스타일 추가
  - 완료일: 2025-12-21

### CAL-001: Calendar 뷰 기능 추가

- [x] **CAL-001-1** Task 스키마에 start_date 추가
  - 수정 파일: `00_Meta/schema_registry.md`
  - 작업 내용: Task에 `start_date: date | null` 필드 추가
  - 완료일: 2025-12-21

- [x] **CAL-001-2** API 모델에 start_date 추가
  - 수정 파일: `api/models/entities.py`
  - 작업 내용: TaskCreate, TaskUpdate에 start_date 필드 추가
  - 완료일: 2025-12-21

- [x] **CAL-001-3** Task 생성/수정 API에 start_date 지원
  - 수정 파일: `api/routers/tasks.py`
  - 작업 내용:
    - Task 생성 시 start_date, due 기본값 = 오늘
    - Task 수정 시 start_date 필드 처리
  - 완료일: 2025-12-21

- [x] **CAL-001-4** FullCalendar CDN + Calendar 뷰 HTML 추가
  - 수정 파일: `_dashboard/index.html`
  - 작업 내용:
    - FullCalendar v6 CDN 추가
    - Calendar 뷰 전환 버튼 추가 (Kanban/Calendar/Graph)
    - Calendar 뷰 HTML 영역 추가
    - calendar.js 스크립트 로드 추가
  - 완료일: 2025-12-21

- [x] **CAL-001-5** Calendar 컴포넌트 구현
  - 생성 파일: `_dashboard/js/components/calendar.js`
  - 작업 내용:
    - FullCalendar 초기화 (월별/주별 뷰)
    - Task → Calendar 이벤트 변환
    - 이벤트 클릭 → Task 패널 열기
    - 드래그앤드롭으로 날짜 변경
    - 이벤트 리사이즈로 기간 변경
  - 완료일: 2025-12-21

- [x] **CAL-001-6** Calendar CSS 추가
  - 생성 파일: `_dashboard/css/calendar.css`
  - 작업 내용: FullCalendar 스타일 커스터마이징
  - 완료일: 2025-12-21

- [x] **CAL-001-7** 뷰 전환 로직 추가
  - 수정 파일: `_dashboard/js/app.js`
  - 작업 내용: switchView() 함수에 Calendar 케이스 추가
  - 완료일: 2025-12-21

- [x] **CAL-001-8** Task 모달/패널에 start_date 필드 추가
  - 수정 파일: `_dashboard/index.html`, `_dashboard/js/components/task-modal.js`, `_dashboard/js/components/task-panel.js`
  - 작업 내용:
    - Task 모달에 Start Date 입력 필드 추가
    - Task 패널에 Start Date 입력 필드 추가
    - 기본값: 오늘 날짜
    - 저장/수정 시 start_date 전송
  - 완료일: 2025-12-21

- [x] **CAL-001-9** Codex 코드 리뷰 피드백 반영
  - 수정 파일: `_dashboard/js/components/calendar.js`, `_dashboard/js/components/sidebar.js`, `_dashboard/js/components/filter-panel.js`, `_dashboard/js/components/tabs.js`
  - 작업 내용:
    - Calendar refresh 시 이벤트 소스 중복 방지 (removeAllEventSources)
    - 필터 변경 시 Calendar.refresh() 호출 추가
  - 완료일: 2025-12-21

---

## 진행 중

(없음)

---

## 완료된 작업 (2025-12-23)

### CACHE-002: Task 캐시 디렉토리 변경 감지 추가

- [x] **CACHE-002-1** get_all_tasks()에 디렉토리 mtime 체크 추가
  - 수정 파일: `api/cache/vault_cache.py`
  - 작업 내용: 새 Task 파일 생성 시 자동 감지되도록 캐시 리로드 로직 추가
  - 변경 사항:
    - `_load_tasks()`: rglob 완료 후 `_update_dir_mtime()` 호출 추가 (line 139)
    - `get_all_tasks()`: `_should_reload_dir()` 체크 추가하여 디렉토리 변경 시 캐시 리로드 (lines 184-188)
  - Codex 리뷰: 2회 통과 (계획 검증 + 코드 리뷰)
  - 완료일: 2025-12-23

### CACHE-003: Program Rounds Task 스캔 추가

- [x] **CACHE-003-1** _load_tasks()에 Program Rounds 경로 스캔 추가
  - 수정 파일: `api/cache/vault_cache.py`
  - 작업 내용: `50_Projects/*/Rounds/*/Tasks/*.md` 경로도 스캔하도록 추가
  - 변경 사항:
    - `_load_tasks()`: Program Rounds 경로 glob 추가 (lines 136-139)
    - `_load_tasks()`: `Task_Rounds` 키로 별도 mtime 업데이트 (line 143)
    - `get_all_tasks()`: 두 디렉토리 모두 mtime 체크 (lines 188-191)
  - Codex 리뷰: 2회 통과 (계획 검증 + 코드 리뷰)
  - 주의: mtime 감시 범위가 넓어 성능 이슈 가능성 있음 (TTL 5초로 완화)
  - 완료일: 2025-12-23

### UX-002: Sidebar 기본 상태 collapsed로 변경

- [x] **UX-002-1** Sidebar 기본 닫힘 상태 적용
  - 수정 파일: `_dashboard/js/components/sidebar.js`
  - 작업 내용: 대시보드 로드 시 사이드바가 기본적으로 닫혀있도록 변경
  - 변경 사항:
    - `collapsed: false` → `collapsed: true` (line 6)
    - `init()`: 초기 collapsed 상태를 DOM에 반영하는 로직 추가 (lines 18-22)
  - Codex 리뷰: 2회 통과 (계획 검증 + 코드 리뷰)
  - 완료일: 2025-12-23

### UX-003: Side Panel 너비 1/3로 확대

- [x] **UX-003-1** Side Panel 너비 33vw로 변경
  - 수정 파일: `_dashboard/css/panel.css`
  - 작업 내용: 디테일 사이드패널 너비를 450px(~1/5)에서 33vw(~1/3)로 확대
  - 변경 사항:
    - `.side-panel`: `right: -450px` → `right: 0` + `transform: translateX(100%)` (lines 25, 31)
    - `.side-panel`: `width: 450px` → `width: 33vw`, `min-width: 450px` 추가 (lines 26-27)
    - `.side-panel`: `transition: right` → `transition: transform` (line 32)
    - `.side-panel.active`: `right: 0` → `transform: translateX(0)` (line 39)
    - `@media (max-width: 768px)`: `right: -100%` → `transform: translateX(100%)`, `min-width: 0` 추가 (lines 832-834)
  - Codex 리뷰: 3회 통과 (계획 검증 2회 + 코드 리뷰)
  - 완료일: 2025-12-23

### UX-004: 프로젝트 필터에 상세 패널 버튼 추가

- [x] **UX-004-1** 프로젝트 필터 버튼에 ℹ️ 아이콘 추가
  - 수정 파일: `_dashboard/js/components/kanban.js`, `_dashboard/css/kanban.css`
  - 작업 내용: 프로젝트 탭에서 바로 상세 패널을 열 수 있는 버튼 추가
  - 변경 사항:
    - `kanban.js`: 프로젝트 버튼에 `.btn-project-info` span 추가 (lines 54-56)
    - `kanban.js`: click/keydown 핸들러 추가, `ProjectPanel.open()` 호출 (lines 85-101)
    - `kanban.css`: `.btn-project-info` 스타일 추가 (lines 75-103)
    - 접근성: `tabindex="0"`, `role="button"`, `aria-label`, `:focus-visible` 적용
  - Codex 리뷰: 2회 통과 (계획 검증 + 코드 리뷰)
  - 참고: button 내 interactive element 구조는 HTML 유효성 이슈 있으나 기능 동작함
  - 완료일: 2025-12-23

### UX-006: "Project:" 라벨 삭제

- [x] **UX-006-1** 프로젝트 필터 바에서 "Project:" 라벨 제거
  - 수정 파일: `_dashboard/index.html`, `_dashboard/css/kanban.css`
  - 작업 내용: 필터 바에서 "Project:" 텍스트 라벨 삭제 및 미사용 CSS 정리
  - 변경 사항:
    - `index.html`: `<span class="filter-label">Project:</span>` 삭제 (line 99)
    - `kanban.css`: `.filter-label` CSS 블록 삭제 (lines 28-32, dead code)
  - Codex 리뷰: 2회 통과 (계획 검증 + 코드 리뷰)
  - 완료일: 2025-12-23

### UX-005: Program 필터 개선 (하위 프로젝트 표시 + ℹ️ 버튼)

- [x] **UX-005-1** Program 선택 시 하위 프로젝트 버튼 표시
  - 수정 파일: `_dashboard/js/components/kanban.js`, `_dashboard/css/kanban.css`
  - 작업 내용: Program 선택 시 해당 Program의 하위 Project들을 필터 버튼으로 표시
  - 변경 사항:
    - `kanban.js`: Program 선택 시 separator(│) 후 하위 프로젝트 버튼 렌더링 (lines 47-77)
    - `kanban.js`: child-all, child-project 타입 클릭 핸들러 추가 (lines 121-126)
    - `kanban.js`: Program 토글 기능 (같은 Program 클릭 시 해제) (lines 113-120)
    - `kanban.css`: `.filter-separator`, `.filter-btn-child` 스타일 추가 (lines 155-189)
  - 완료일: 2025-12-23

- [x] **UX-005-2** Program 버튼에 ℹ️ 상세 버튼 추가
  - 수정 파일: `_dashboard/js/components/kanban.js`, `_dashboard/css/kanban.css`
  - 작업 내용: Program 버튼에 상세 정보를 볼 수 있는 ℹ️ 아이콘 추가
  - 변경 사항:
    - `kanban.js`: Program 버튼에 `.btn-program-info` span 추가 (lines 40-42)
    - `kanban.js`: Program info 클릭/키보드 핸들러 추가 (lines 157-173)
    - `kanban.js`: `openProgramDetail()` 메서드 추가 (lines 176-219)
    - `kanban.css`: `.btn-program-info` 스타일 추가 (lines 125-153)
    - 접근성: `tabindex="0"`, `role="button"`, `aria-label` 적용
    - 보안: XSS 방지용 `escapeHtml()` 헬퍼 추가
  - Codex 리뷰: 2회 통과 (계획 검증 + 코드 리뷰) + XSS 보안 수정
  - 완료일: 2025-12-23

### UX-007: Task 카드 Delete 버튼 가시성 수정

- [x] **UX-007-1** Delete 버튼을 휴지통 아이콘으로 변경
  - 수정 파일: `_dashboard/js/components/task-card.js`, `_dashboard/css/kanban.css`
  - 작업 내용: 흰 배경에 흰 글씨로 안 보이던 Delete 버튼을 🗑️ 아이콘으로 변경
  - 변경 사항:
    - `task-card.js`: `<button class="btn-small btn-delete btn-danger">Delete</button>` → `<button class="btn-delete" title="Delete task">🗑️</button>` (line 61)
    - `kanban.css`: `.btn-delete` 스타일 추가 - 투명 배경, hover 시 빨간 배경, 포커스 스타일 (lines 401-423)
  - 원인: `.btn-small`(background: white)이 `.btn-danger`(background: red) 뒤에 정의되어 CSS 우선순위로 흰 배경 적용됨
  - 완료일: 2025-12-23

### UX-008: 캘린더 주별 뷰 시간 간격 축소

- [x] **UX-008-1** 시간 슬롯 높이 축소
  - 수정 파일: `_dashboard/css/calendar.css`
  - 작업 내용: 주별 뷰에서 시간 슬롯이 너무 넓어 스크롤이 많이 필요한 문제 해결
  - 변경 사항:
    - `.fc .fc-timegrid-slot`: `height: 40px` → `height: 30px` (lines 112-114)
    - 총 높이: 960px → 720px (25% 축소)
  - Codex 리뷰: 2회 통과 (24px는 너무 작다는 피드백 → 30px로 조정)
  - 완료일: 2025-12-23

---

## 완료된 작업 (추가)

### IMP-001: Project Impact Score 표시 기능

- [x] **IMP-001-1** API 캐시에서 Project body 추출
  - 수정 파일: `api/cache/vault_cache.py`
  - 작업 내용: `_extract_frontmatter_and_body()` 함수 추가, `_load_project_file()`에서 `_body` 필드 캐싱
  - 완료일: 2025-12-21

- [x] **IMP-001-2** Project 수정 시 _body 캐시 유지
  - 수정 파일: `api/routers/projects.py`
  - 작업 내용: `update_project()`에서 `set_project` 호출 시 `_body` 포함
  - 완료일: 2025-12-21

- [x] **IMP-001-3** Dashboard에 Impact Score 섹션 추가
  - 수정 파일: `_dashboard/index.html`
  - 작업 내용:
    - Impact Score 카드 (Expected A / Realized B)
    - Project Body 섹션 추가
  - 완료일: 2025-12-21

- [x] **IMP-001-4** Impact Score 계산 및 렌더링 로직
  - 수정 파일: `_dashboard/js/components/project-panel.js`
  - 작업 내용:
    - `calculateExpectedScore()`: tier × magnitude × confidence 계산
    - `getRealizedScoreInfo()`: outcome/evidence/updated 추출
    - `renderImpactSection()`: A/B Score 및 상세 정보 렌더링
    - `renderProjectBody()`: 마크다운 본문 렌더링
    - XSS 방지: validTiers/validMagnitudes 화이트리스트 적용
  - 완료일: 2025-12-21

- [x] **IMP-001-5** Impact Score CSS 스타일링
  - 수정 파일: `_dashboard/css/panel.css`
  - 작업 내용: `.impact-scores`, `.impact-score-card`, `.impact-detail-row` 등 스타일 추가
  - 완료일: 2025-12-21

### CACHE-001: 모든 API에 인메모리 캐싱 적용

- [x] **CACHE-001-1** VaultCache 확장 - 새 엔티티 캐시 추가
  - 수정 파일: `api/cache/vault_cache.py`
  - 작업 내용:
    - 7개 새 캐시 저장소: hypotheses, tracks, conditions, northstars, metahypotheses, productlines, partnershipstages
    - threading.RLock 적용 (읽기/쓰기 모두 보호)
    - 디렉토리별 mtime 추적 (entity_type 조합 키)
    - TTL 기반 스캔 (5초 간격)으로 성능 최적화
  - 완료일: 2025-12-21

- [x] **CACHE-001-2** Hypotheses 라우터 캐시 기반 변경
  - 수정 파일: `api/routers/hypotheses.py`
  - 작업 내용:
    - cache.get_all_hypotheses() 사용
    - cache.set_hypothesis() / remove_hypothesis() CRUD 연동
    - cache.get_next_hypothesis_id() ID 생성
    - file-first 패턴 (파일 먼저 쓰고 캐시 업데이트)
  - 완료일: 2025-12-21

- [x] **CACHE-001-3** Tracks/Conditions/Strategy 라우터 캐시 기반 변경
  - 수정 파일: `api/routers/tracks.py`, `api/routers/conditions.py`, `api/routers/strategy.py`
  - 작업 내용: cache.get_all_*() 메서드 사용
  - 완료일: 2025-12-21

- [x] **CACHE-001-4** Codex 코드 리뷰 피드백 반영
  - 성능 최적화: TTL 기반 디렉토리 스캔 (5초 간격)
  - _dir_last_check 딕셔너리 추가로 매 요청 rglob 방지
  - 완료일: 2025-12-21

---

## 예정된 작업

### Phase 2: 추가 기능

- [ ] **API-003** 검색 기능
- [ ] **CAL-002** Calendar에서 Task 직접 생성 (날짜 클릭)

---

## 알려진 이슈

### ~~ISS-001: Task 본문이 대시보드에서 안 보임~~ (해결됨)
- **원인**: `extract_frontmatter()`가 YAML만 추출, body 무시
- **해결**: API-001 작업으로 해결 완료 (2025-12-21)
- **참고**: API 서버 재시작 필요

### ISS-002: include_body 기본값 성능
- **상태**: 향후 최적화 필요
- **내용**: 현재 include_body=True가 기본값이라 모든 Task 본문을 매번 로드함
- **해결안**: 성능 이슈 발생 시 기본값을 False로 변경하고 프론트엔드에서 옵트인

---

## 작업 기록 가이드

**작업 시작 시**:
```
- [ ] **TASK-XXX** 태스크 제목
  - 예상 파일: `파일경로1`, `파일경로2`
  - 작업 내용: 무엇을 할 것인지
  - 우선순위: High/Medium/Low
```

**작업 완료 시**:
```
- [x] **TASK-XXX** 태스크 제목
  - 수정 파일: `파일경로1`, `파일경로2`
  - 작업 내용: 실제 수행한 작업 설명
  - 변경 사항: 구체적인 변경 내용
  - 완료일: YYYY-MM-DD
```

---

**Last Updated**: 2025-12-21
