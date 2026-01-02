---
entity_type: Task
entity_id: tsk-dashboard-ux-v1-16
entity_name: 캘린더뷰 Task Type 필터링 UI 구현
created: 2025-12-27
updated: '2025-12-27'
status: done
parent_id: prj-dashboard-ux-v1
project_id: prj-dashboard-ux-v1
aliases:
- tsk-dashboard-ux-v1-16
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
start_date: '2025-12-27'
due: '2025-12-27'
priority: medium
estimated_hours: null
actual_hours: null
type: dev
target_project: loop
tags:
- dashboard
- calendar
- filter
- ux
priority_flag: medium
notes: "# 캘린더뷰 Task Type 필터링 UI 구현\n\n> Task ID: `tsk-dashboard-ux-v1-16` | Project:\
  \ `prj-dashboard-ux-v1` | Status: doing\n\n## 목표\n\n**완료 조건**:\n1. Filter Panel에\
  \ Task Type 필터 체크박스 추가 (dev, strategy, research, ops)\n2. 캘린더뷰에서 선택된 type의 Task만\
  \ 표시\n3. 캘린더 탭 활성화 시 담당자 탭의 W/M 필터 버튼 숨김\n\n---\n\n## 상세 내용\n\n### 배경\n- 캘린더뷰에서\
  \ task type별 필터링 필요\n- 캘린더는 자체 월/주 탐색 기능이 있어 Quick Date Filter(W/M) 불필요\n\n### 작업\
  \ 내용\n1. **State 수정** (`state.js`)\n   - `filters.task.types` 배열 추가\n   - `getTaskTypes()`,\
  \ `getTaskTypeLabels()` 헬퍼 추가\n   - `getFilteredTasks()`에 type 필터 적용\n   - `resetFilters()`에\
  \ types 초기화 추가\n\n2. **FilterPanel 수정** (`filter-panel.js`)\n   - `renderTaskTypeFilters()`\
  \ 함수 추가\n   - `render()`에서 호출\n   - `updateFilterIndicator()`에 type 필터 카운트 추가\n\n\
  3. **index.html 수정**\n   - Task Filters 섹션에 Type 필터 그룹 추가\n\n4. **캘린더 뷰 W/M 필터 숨김**\n\
  \   - 캘린더 탭 활성화 시 Quick Date Filter 영역 숨김 처리\n\n---\n\n## 체크리스트\n\n- [x] State에\
  \ task type 필터 추가\n- [x] FilterPanel에 type 필터 렌더링 추가\n- [x] index.html에 Type 필터\
  \ UI 요소 추가\n- [x] 캘린더뷰에서 W/M 필터 숨김\n- [x] 필터 적용 테스트\n\n---\n\n## Notes\n\n### Todo\n\
  - [x] schema_constants.yaml에서 task.types 참조\n- [x] API constants 엔드포인트 확인\n\n###\
  \ 작업 로그\n\n#### 2025-12-27 10:32\n**개요**: Filter Panel에 Task Type 필터 UI를 추가하고, 캘린더뷰에서\
  \ Quick Date Toggle(W/M)을 숨기도록 구현했습니다. Codex-Claude loop을 통해 계획 검증 및 코드 리뷰를 완료했습니다.\n\
  \n**변경사항**:\n- 개발: Task Type 필터 UI (dev, strategy, research, ops) - Filter Panel에\
  \ 추가\n- 개발: 캘린더뷰 활성화 시 Quick Date Toggle 숨김 기능\n- 수정: `state.js` - FALLBACK_CONSTANTS에\
  \ types/type_labels 추가, 헬퍼 함수 추가\n- 수정: `filter-panel.js` - `renderTaskTypeFilters()`\
  \ 함수 추가\n- 수정: `app.js` - `switchView()`에 Quick Date Toggle 가시성 토글 추가\n- 수정: `filter-panel.css`\
  \ - `.type-dot` 스타일 추가\n- 수정: `kanban.css` - `.quick-date-toggle.hidden` 클래스 추가\n\
  - 수정: `index.html` - Task Filters 섹션에 Type 필터 그룹 추가\n\n**파일 변경**:\n- `_dashboard/js/state.js`\
  \ - types 필터 상태 및 헬퍼 함수 추가\n- `_dashboard/js/components/filter-panel.js` - renderTaskTypeFilters()\
  \ 추가\n- `_dashboard/js/app.js` - 캘린더뷰 Quick Date Toggle 숨김\n- `_dashboard/css/filter-panel.css`\
  \ - type-dot 색상 스타일 추가\n- `_dashboard/css/kanban.css` - .hidden 클래스 추가\n- `_dashboard/index.html`\
  \ - Type 필터 UI 요소 추가\n\n**Codex 검증**:\n- Phase 2 (계획 검증): 6개 이슈 발견 → 모두 반영\n- Phase\
  \ 5 (코드 리뷰): 3개 이슈 발견 → CSS 스타일 누락 수정\n\n**결과**: ✅ 구현 완료\n\n**다음 단계**:\n- 대시보드에서\
  \ Filter Panel (⚙️ 버튼) → TASK FILTERS → Type에서 필터 사용 가능\n- 캘린더뷰 전환 시 W/M 버튼 자동 숨김\
  \ 확인\n\n---\n\n## 참고 문서\n\n- [[prj-dashboard-ux-v1]] - 소속 Project\n- `_dashboard/js/components/calendar.js`\
  \ - 캘린더 컴포넌트\n- `_dashboard/js/components/filter-panel.js` - 필터 패널\n- `00_Meta/schema_constants.yaml`\
  \ - task.types 상수\n\n---\n\n**Created**: 2025-12-27\n**Assignee**: 김은향\n**Due**:\
  \ 2025-12-27\n"
---
# 캘린더뷰 Task Type 필터링 UI 구현

> Task ID: `tsk-dashboard-ux-v1-16` | Project: `prj-dashboard-ux-v1` | Status: doing

## 목표

**완료 조건**:
1. Filter Panel에 Task Type 필터 체크박스 추가 (dev, strategy, research, ops)
2. 캘린더뷰에서 선택된 type의 Task만 표시
3. 캘린더 탭 활성화 시 담당자 탭의 W/M 필터 버튼 숨김

---

## 상세 내용

### 배경
- 캘린더뷰에서 task type별 필터링 필요
- 캘린더는 자체 월/주 탐색 기능이 있어 Quick Date Filter(W/M) 불필요

### 작업 내용
1. **State 수정** (`state.js`)
   - `filters.task.types` 배열 추가
   - `getTaskTypes()`, `getTaskTypeLabels()` 헬퍼 추가
   - `getFilteredTasks()`에 type 필터 적용
   - `resetFilters()`에 types 초기화 추가

2. **FilterPanel 수정** (`filter-panel.js`)
   - `renderTaskTypeFilters()` 함수 추가
   - `render()`에서 호출
   - `updateFilterIndicator()`에 type 필터 카운트 추가

3. **index.html 수정**
   - Task Filters 섹션에 Type 필터 그룹 추가

4. **캘린더 뷰 W/M 필터 숨김**
   - 캘린더 탭 활성화 시 Quick Date Filter 영역 숨김 처리

---

## 체크리스트

- [x] State에 task type 필터 추가
- [x] FilterPanel에 type 필터 렌더링 추가
- [x] index.html에 Type 필터 UI 요소 추가
- [x] 캘린더뷰에서 W/M 필터 숨김
- [x] 필터 적용 테스트

---

## Notes

### Todo
- [x] schema_constants.yaml에서 task.types 참조
- [x] API constants 엔드포인트 확인

### 작업 로그

#### 2025-12-27 10:32
**개요**: Filter Panel에 Task Type 필터 UI를 추가하고, 캘린더뷰에서 Quick Date Toggle(W/M)을 숨기도록 구현했습니다. Codex-Claude loop을 통해 계획 검증 및 코드 리뷰를 완료했습니다.

**변경사항**:
- 개발: Task Type 필터 UI (dev, strategy, research, ops) - Filter Panel에 추가
- 개발: 캘린더뷰 활성화 시 Quick Date Toggle 숨김 기능
- 수정: `state.js` - FALLBACK_CONSTANTS에 types/type_labels 추가, 헬퍼 함수 추가
- 수정: `filter-panel.js` - `renderTaskTypeFilters()` 함수 추가
- 수정: `app.js` - `switchView()`에 Quick Date Toggle 가시성 토글 추가
- 수정: `filter-panel.css` - `.type-dot` 스타일 추가
- 수정: `kanban.css` - `.quick-date-toggle.hidden` 클래스 추가
- 수정: `index.html` - Task Filters 섹션에 Type 필터 그룹 추가

**파일 변경**:
- `_dashboard/js/state.js` - types 필터 상태 및 헬퍼 함수 추가
- `_dashboard/js/components/filter-panel.js` - renderTaskTypeFilters() 추가
- `_dashboard/js/app.js` - 캘린더뷰 Quick Date Toggle 숨김
- `_dashboard/css/filter-panel.css` - type-dot 색상 스타일 추가
- `_dashboard/css/kanban.css` - .hidden 클래스 추가
- `_dashboard/index.html` - Type 필터 UI 요소 추가

**Codex 검증**:
- Phase 2 (계획 검증): 6개 이슈 발견 → 모두 반영
- Phase 5 (코드 리뷰): 3개 이슈 발견 → CSS 스타일 누락 수정

**결과**: ✅ 구현 완료

**다음 단계**:
- 대시보드에서 Filter Panel (⚙️ 버튼) → TASK FILTERS → Type에서 필터 사용 가능
- 캘린더뷰 전환 시 W/M 버튼 자동 숨김 확인

---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- `_dashboard/js/components/calendar.js` - 캘린더 컴포넌트
- `_dashboard/js/components/filter-panel.js` - 필터 패널
- `00_Meta/schema_constants.yaml` - task.types 상수

---

**Created**: 2025-12-27
**Assignee**: 김은향
**Due**: 2025-12-27
