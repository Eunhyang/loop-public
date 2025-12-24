# Dashboard Project Colors - TODO

**Project**: dashboard-project-colors
**Last Updated**: 2025-12-23

---

## 완료된 작업

- [x] **TASK-001** 프로젝트 ID → 색상 매핑 함수 구현
  - 수정 파일: `_dashboard/js/components/calendar.js`
  - 작업 내용: hashString() + getColorByProject() 메서드 추가
  - 변경 사항:
    - djb2 해시 알고리즘으로 프로젝트 ID를 해시
    - null/undefined 체크 (Codex 피드백 반영)
  - 완료일: 2025-12-23

- [x] **TASK-002** 색상 팔레트 정의
  - 수정 파일: `_dashboard/js/components/calendar.js`
  - 작업 내용: PASTEL_COLORS 배열 추가 (20개)
  - 변경 사항:
    - 12개 → 20개로 확장 (Codex 피드백 반영)
  - 완료일: 2025-12-23

- [x] **TASK-003** Calendar 뷰에 프로젝트 색상 적용
  - 수정 파일: `_dashboard/js/components/calendar.js`
  - 작업 내용: getEvents()에서 project_id 기반 색상 사용
  - 변경 사항:
    - backgroundColor/borderColor: priority → project_id 기반
    - textColor: '#fff' → '#333' (pastel 배경 대비)
    - projectColor 변수로 중복 호출 제거 (Codex 피드백 반영)
  - 완료일: 2025-12-23

- [x] **TASK-004** Priority 레전드 삭제
  - 수정 파일: `_dashboard/index.html`, `_dashboard/css/calendar.css`
  - 작업 내용: Calendar 뷰의 Priority 색상 안내 UI 삭제
  - 변경 사항:
    - index.html: .calendar-legend 요소 삭제
    - calendar.css: .calendar-legend, .legend-* 스타일 삭제
  - 완료일: 2025-12-23

- [x] **TASK-005** 프로젝트 필터 버튼에 색상 적용
  - 수정 파일: `_dashboard/js/components/kanban.js`
  - 작업 내용: 프로젝트 버튼에 Calendar.getColorByProject() 색상 적용
  - 변경 사항:
    - border-left: 4px solid 방식 사용 (Codex 피드백 반영)
    - 독립 프로젝트 버튼, child 프로젝트 버튼에 적용
    - Program 버튼은 색상 미적용 (프로젝트가 아님)
  - 완료일: 2025-12-23

---

## 진행 중

(없음)

---

## 예정된 작업

### Phase 3: 확장 (선택)

- [ ] **TASK-006** Kanban 태스크 카드에 프로젝트 색상 적용
  - 예상 파일: `_dashboard/js/components/task-card.js`
  - 작업 내용: 태스크 카드에 프로젝트 색상 표시
  - 우선순위: Low

---

## 알려진 이슈

(없음)

---

**Last Updated**: 2025-12-23
