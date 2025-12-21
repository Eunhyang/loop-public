# Kanban By Assignee - TODO

**Project**: Kanban By Assignee
**Last Updated**: 2025-12-21

---

## 완료된 작업

(없음)

---

## 진행 중

(없음)

---

## 예정된 작업

### Phase 1: UI 구조 변경

- [ ] **KBA-001** Assignee 탭을 최상위로 변경
  - 예상 파일: `_dashboard/index.html`, `_dashboard/js/components/tabs.js`
  - 작업 내용: 프로젝트 탭 → Assignee 탭으로 최상위 네비게이션 변경
  - 우선순위: High

- [ ] **KBA-002** 프로젝트별 그룹핑 UI 구현
  - 예상 파일: `_dashboard/js/components/kanban.js`, `_dashboard/css/kanban.css`
  - 작업 내용: 담당자 선택 시 해당 담당자의 Task를 프로젝트별로 그룹핑하여 표시
  - 우선순위: High

- [ ] **KBA-003** 상태 관리 업데이트
  - 예상 파일: `_dashboard/js/state.js`, `_dashboard/js/app.js`
  - 작업 내용: currentAssignee, currentProject 상태 관리 로직 수정
  - 우선순위: High

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
