# Kanban By Assignee - TODO

**Project**: Kanban By Assignee
**Last Updated**: 2025-12-21

---

## 완료된 작업

### Phase 1: UI 구조 변경 (2025-12-21)

- [x] **KBA-001** Assignee 탭을 최상위로 변경
  - 수정 파일: `_dashboard/js/components/tabs.js`
  - 작업 내용: 프로젝트 탭 → Assignee 탭으로 최상위 네비게이션 변경
  - 변경 사항:
    - Tabs.render()를 Assignee 탭 렌더링으로 변경
    - State.members 기반 동적 탭 생성
    - Task 개수 표시 (.tab-count)
    - ARIA 속성 추가 (role="tab", aria-selected)
  - 완료일: 2025-12-21

- [x] **KBA-002** 프로젝트별 그룹핑 UI 구현
  - 수정 파일: `_dashboard/js/components/kanban.js`, `_dashboard/css/kanban.css`
  - 작업 내용: 담당자 선택 시 해당 담당자의 Task를 프로젝트별로 그룹핑하여 표시
  - 변경 사항:
    - Kanban.collapsedProjects Set 추가 (접기/펼치기 상태)
    - Kanban.render() 프로젝트별 그룹 렌더링
    - .project-group, .project-group-header, .project-kanban CSS
    - 빈 상태 UI (.empty-board)
    - attachProjectGroupListeners() 추가
  - 완료일: 2025-12-21

- [x] **KBA-003** 상태 관리 업데이트
  - 수정 파일: `_dashboard/js/state.js`, `_dashboard/js/app.js`
  - 작업 내용: Assignee 중심 필터링 헬퍼 함수 추가
  - 변경 사항:
    - State.getTaskCountByAssignee() 추가
    - State.getTasksGroupedByProject() 추가
    - State.getProjectDisplayName() 추가
    - unassigned 필터링 버그 수정
    - app.js에서 renderAssigneeFilter() 호출 제거
  - 완료일: 2025-12-21

---

## 진행 중

(없음)

---

## 예정된 작업

---

## 알려진 이슈

(없음)

---

## 작업 기록 가이드

**작업 시작 시**:
```
- [ ] **KBA-XXX** 태스크 제목
  - 예상 파일: `파일경로1`, `파일경로2`
  - 작업 내용: 무엇을 할 것인지
  - 우선순위: High/Medium/Low
```

**작업 완료 시**:
```
- [x] **KBA-XXX** 태스크 제목
  - 수정 파일: `파일경로1`, `파일경로2`
  - 작업 내용: 실제 수행한 작업 설명
  - 변경 사항: 구체적인 변경 내용
  - 완료일: YYYY-MM-DD
```

---

**Last Updated**: 2025-12-21
