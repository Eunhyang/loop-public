---
entity_type: Task
entity_id: tsk-dashboard-ux-v1-06
entity_name: Dashboard Reset Filter 전체 초기화
created: 2025-12-27
updated: '2025-12-27'
status: done
closed: '2025-12-27'
parent_id: prj-dashboard-ux-v1
project_id: prj-dashboard-ux-v1
aliases:
- tsk-dashboard-ux-v1-06
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
due: '2025-12-27'
priority: medium
estimated_hours: null
actual_hours: null
type: dev
target_project: loop
conditions_3y:
- cond-e
tags:
- dashboard
- filter
- ux
priority_flag: medium
start_date: '2025-12-27'
notes: "# Dashboard Reset Filter 전체 초기화\n\n> Task ID: `tsk-dashboard-ux-v1-06` | Project:\
  \ `prj-dashboard-ux-v1` | Status: doing\n\n## 목표\n\n**완료 조건**:\n1. Filter Panel의\
  \ \"Reset All\" 버튼 클릭 시 모든 필터가 초기화됨\n2. 담당자/프로젝트 탭 필터도 'all'로 초기화됨\n3. Sidebar의\
  \ Track/Hypothesis/Condition 필터도 해제됨\n4. Quick date 필터 해제되어 모든 기간 + due_date 없는\
  \ 태스크도 표시됨\n\n---\n\n## 상세 내용\n\n### 배경\n\n현재 \"Reset All\" 버튼은 Filter Panel 내부\
  \ 필터만 초기화하고, 상단 탭(담당자/프로젝트)과 Sidebar(Track/Hypothesis/Condition) 필터는 그대로 유지됨. 사용자가\
  \ 모든 필터를 한 번에 초기화하고 전체 태스크를 보고 싶을 때 불편함.\n\n### 작업 내용\n\n1. `State.resetAllFilters()`\
  \ 메서드 추가 (state.js) - 이미 추가됨\n2. `FilterPanel.reset()` 수정하여 `State.resetAllFilters()`\
  \ 호출 - 이미 수정됨\n3. Tabs, Sidebar 다시 렌더링하여 UI 반영\n\n---\n\n## 체크리스트\n\n- [x] State.resetAllFilters()\
  \ 메서드 추가\n- [x] FilterPanel.reset()에서 resetAllFilters() 호출\n- [x] Sidebar UI 상태\
  \ 리셋 추가 (currentTrack, currentHypothesis, currentCondition)\n- [x] Sidebar.updateHeaderMeta()\
  \ 호출 추가\n- [ ] 전체 동작 테스트\n\n---\n\n## Notes\n\n### Tech Spec\n- **대상 파일**:\n  -\
  \ `_dashboard/js/state.js` - resetAllFilters() 메서드 추가\n  - `_dashboard/js/components/filter-panel.js`\
  \ - reset() 수정\n  - `_dashboard/js/components/sidebar.js` - render() 호출 확인 필요\n\n\
  - **구현 상세**:\n  1. `State.resetAllFilters()` 메서드:\n     - `resetFilters()` 호출 (기존\
  \ filter panel 필터)\n     - `selectedWeeks/selectedMonths` 빈 배열로 (Quick date 완전 해제)\n\
  \     - `currentAssignee = 'all'`\n     - `currentProject = 'all'`\n     - `filterTrack\
  \ = null`\n     - `filterProgram = null`\n     - `filterHypothesis = null`\n   \
  \  - `filterCondition = null`\n\n  2. `FilterPanel.reset()` 수정:\n     - `State.resetAllFilters()`\
  \ 호출\n     - `Tabs.render()` 호출\n     - `Sidebar.render()` 호출\n\n- **핵심 로직**:\n\
  \  - `passesQuickDateFilter()`: selectedWeeks/Months 비어있으면 모든 태스크 통과 (due_date 없어도\
  \ OK)\n\n### Todo\n- [x] State.resetAllFilters() 메서드 추가 (state.js:786-808)\n- [x]\
  \ FilterPanel.reset()에서 resetAllFilters() 호출 (filter-panel.js:69-79)\n- [x] Sidebar\
  \ UI 상태 리셋 추가 (currentTrack/Hypothesis/Condition)\n- [x] Sidebar.updateHeaderMeta()\
  \ 호출 추가\n- [ ] 전체 필터 초기화 테스트\n- [ ] Quick date 필터 해제 후 due_date 없는 태스크 표시 확인\n\n\
  ### 작업 로그\n\n#### 2025-12-27 (codex-claude-loop)\n**개요**: Reset Filter 버튼 클릭 시 모든\
  \ 필터가 초기화되도록 구현 완료\n\n**변경사항**:\n- `state.js`: `resetAllFilters()` 메서드에 Sidebar\
  \ UI 상태 리셋 추가 (currentTrack, currentHypothesis, currentCondition)\n- `filter-panel.js`:\
  \ `reset()` 메서드에 `Sidebar.updateHeaderMeta()` 호출 추가\n\n**핵심 코드**:\n```javascript\n\
  // state.js:804-807\n// 5. Reset sidebar UI state (for active highlighting)\nthis.currentTrack\
  \ = 'all';\nthis.currentHypothesis = null;\nthis.currentCondition = null;\n\n//\
  \ filter-panel.js:78\nSidebar.updateHeaderMeta();  // Reset header meta text\n```\n\
  \n**결과**: ✅ 구현 완료\n\n**다음 단계**: 대시보드에서 테스트 필요\n\n\n---\n\n## 참고 문서\n\n- [[prj-dashboard-ux-v1]]\
  \ - 소속 Project\n\n---\n\n**Created**: 2025-12-27\n**Assignee**: 김은향\n**Due**:\n"
---
# Dashboard Reset Filter 전체 초기화

> Task ID: `tsk-dashboard-ux-v1-06` | Project: `prj-dashboard-ux-v1` | Status: doing

## 목표

**완료 조건**:
1. Filter Panel의 "Reset All" 버튼 클릭 시 모든 필터가 초기화됨
2. 담당자/프로젝트 탭 필터도 'all'로 초기화됨
3. Sidebar의 Track/Hypothesis/Condition 필터도 해제됨
4. Quick date 필터 해제되어 모든 기간 + due_date 없는 태스크도 표시됨

---

## 상세 내용

### 배경

현재 "Reset All" 버튼은 Filter Panel 내부 필터만 초기화하고, 상단 탭(담당자/프로젝트)과 Sidebar(Track/Hypothesis/Condition) 필터는 그대로 유지됨. 사용자가 모든 필터를 한 번에 초기화하고 전체 태스크를 보고 싶을 때 불편함.

### 작업 내용

1. `State.resetAllFilters()` 메서드 추가 (state.js) - 이미 추가됨
2. `FilterPanel.reset()` 수정하여 `State.resetAllFilters()` 호출 - 이미 수정됨
3. Tabs, Sidebar 다시 렌더링하여 UI 반영

---

## 체크리스트

- [x] State.resetAllFilters() 메서드 추가
- [x] FilterPanel.reset()에서 resetAllFilters() 호출
- [x] Sidebar UI 상태 리셋 추가 (currentTrack, currentHypothesis, currentCondition)
- [x] Sidebar.updateHeaderMeta() 호출 추가
- [ ] 전체 동작 테스트

---

## Notes

### Tech Spec
- **대상 파일**:
  - `_dashboard/js/state.js` - resetAllFilters() 메서드 추가
  - `_dashboard/js/components/filter-panel.js` - reset() 수정
  - `_dashboard/js/components/sidebar.js` - render() 호출 확인 필요

- **구현 상세**:
  1. `State.resetAllFilters()` 메서드:
     - `resetFilters()` 호출 (기존 filter panel 필터)
     - `selectedWeeks/selectedMonths` 빈 배열로 (Quick date 완전 해제)
     - `currentAssignee = 'all'`
     - `currentProject = 'all'`
     - `filterTrack = null`
     - `filterProgram = null`
     - `filterHypothesis = null`
     - `filterCondition = null`

  2. `FilterPanel.reset()` 수정:
     - `State.resetAllFilters()` 호출
     - `Tabs.render()` 호출
     - `Sidebar.render()` 호출

- **핵심 로직**:
  - `passesQuickDateFilter()`: selectedWeeks/Months 비어있으면 모든 태스크 통과 (due_date 없어도 OK)

### Todo
- [x] State.resetAllFilters() 메서드 추가 (state.js:786-808)
- [x] FilterPanel.reset()에서 resetAllFilters() 호출 (filter-panel.js:69-79)
- [x] Sidebar UI 상태 리셋 추가 (currentTrack/Hypothesis/Condition)
- [x] Sidebar.updateHeaderMeta() 호출 추가
- [ ] 전체 필터 초기화 테스트
- [ ] Quick date 필터 해제 후 due_date 없는 태스크 표시 확인

### 작업 로그

#### 2025-12-27 12:50 (버그 수정 진행 중)
**개요**: Project status 필터 불일치 문제 발견 및 수정. 구 상태값(todo/doing)과 새 상태값(planning/active) 간 매핑 문제로 필터가 정상 동작하지 않음.

**변경사항**:
- 개발: `normalizeProjectStatus()` 메서드 추가 (state.js:322-345) - 구 상태값을 새 상태값으로 변환
- 수정: `getFilteredTasks()` 내 프로젝트 상태 필터에서 정규화 적용 (state.js:277)
- 수정: `getAllDoneTasks()` 내 프로젝트 상태 필터에서 정규화 적용 (state.js:451)
- 수정: 초기 필터 상태를 새 프로젝트 상태값으로 변경 (state.js:37)

**파일 변경**:
- `_dashboard/js/state.js` - normalizeProjectStatus() 추가, 필터 정규화 적용

**문제 원인**:
- 실제 Project 파일: `status: doing`, `status: todo` 사용
- Dashboard 필터: `['planning', 'active', 'paused', 'done', 'cancelled']` 기대
- Reset 후 매칭 안됨 → 모든 태스크 필터링됨

**상태 매핑**:
- `doing` → `active`
- `todo` → `planning`
- `hold` → `paused`
- `blocked` → `cancelled`

**결과**: ⚠️ 구현 완료했으나 테스트 미완료 (0개 태스크 표시 이슈 디버깅 필요)

**다음 단계**:
- 브라우저 콘솔에서 State.filters, State.projects 디버깅
- 초기 필터 상태와 프로젝트 상태 매칭 확인

---

#### 2025-12-27 (codex-claude-loop)
**개요**: Reset Filter 버튼 클릭 시 모든 필터가 초기화되도록 구현 완료

**변경사항**:
- `state.js`: `resetAllFilters()` 메서드에 Sidebar UI 상태 리셋 추가 (currentTrack, currentHypothesis, currentCondition)
- `filter-panel.js`: `reset()` 메서드에 `Sidebar.updateHeaderMeta()` 호출 추가

**핵심 코드**:
```javascript
// state.js:804-807
// 5. Reset sidebar UI state (for active highlighting)
this.currentTrack = 'all';
this.currentHypothesis = null;
this.currentCondition = null;

// filter-panel.js:78
Sidebar.updateHeaderMeta();  // Reset header meta text
```

**결과**: ✅ 구현 완료

**다음 단계**: 대시보드에서 테스트 필요


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project

---

**Created**: 2025-12-27
**Assignee**: 김은향
**Due**:
