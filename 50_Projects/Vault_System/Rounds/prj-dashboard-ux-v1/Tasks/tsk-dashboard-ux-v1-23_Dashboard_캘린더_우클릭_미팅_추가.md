---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-23"
entity_name: "Dashboard - 캘린더 우클릭 미팅 추가"
created: 2026-01-06
updated: 2026-01-06
status: done
closed: 2026-01-06

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-23"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-06
due: 2026-01-06
priority: medium
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: null

# === 분류 ===
tags: [dashboard, calendar, meeting, ux]
priority_flag: medium
---

# Dashboard - 캘린더 우클릭 미팅 추가

> Task ID: `tsk-dashboard-ux-v1-23` | Project: `prj-dashboard-ux-v1` | Status: doing

## 목표

**완료 조건**:
1. 캘린더뷰에서 날짜 우클릭 시 "미팅 추가" 컨텍스트 메뉴 표시
2. 클릭 시 기존 TaskModal 열림 (해당 날짜 자동 설정)

---

## 상세 내용

### 배경

캘린더뷰에서 meeting 타입 태스크를 빠르게 추가할 수 있는 UX 개선 필요

### 작업 내용

1. `calendar.js`에 우클릭 이벤트 핸들러 추가
2. 간단한 컨텍스트 메뉴 HTML/CSS 추가
3. 클릭 시 `TaskModal.open()` 호출 (날짜 전달)

---

## 체크리스트

- [x] calendar.js에 dateClick 또는 contextmenu 이벤트 추가
- [x] 컨텍스트 메뉴 UI (미팅 추가 버튼만)
- [x] TaskModal.open()에 날짜 전달
- [x] 테스트

---

## Notes

### PRD
- 캘린더 날짜 우클릭 → "미팅 추가" 메뉴 표시
- 클릭 시 기존 TaskModal 그대로 열림 (start_date만 자동 설정)
- 새 코드/컴포넌트 만들지 않음, 기존 calendar.js + TaskModal 활용

### Todo
- [x] calendar.js 수정
- [x] 컨텍스트 메뉴 스타일 추가
- [x] 테스트

### 작업 로그

#### 2026-01-06 00:34
**개요**: 캘린더뷰에서 날짜 우클릭 시 "미팅 추가" 컨텍스트 메뉴 기능 구현

**변경사항**:
- 개발: `calendar.js`에 우클릭 컨텍스트 메뉴 기능 추가 (+96줄)
  - `createContextMenu()`: 컨텍스트 메뉴 DOM 생성
  - `onContextMenu()`: 우클릭 이벤트 핸들러 (날짜 셀 감지)
  - `showContextMenu()` / `hideContextMenu()`: 메뉴 표시/숨김
  - `onAddMeeting()`: 미팅 추가 핸들러 → TaskModal.open() 호출
- 수정: `task-modal.js`의 `open()` 메서드에 `options.date` 파라미터 지원 추가
- 개선: `calendar.css`에 컨텍스트 메뉴 스타일 추가 (+54줄, 다크모드 지원)

**핵심 코드**:
```javascript
// calendar.js - 우클릭 핸들러
onContextMenu(e) {
    const dayCell = e.target.closest('.fc-daygrid-day');
    if (!dayCell) return;
    e.preventDefault();
    const dateStr = dayCell.getAttribute('data-date');
    this.contextMenuDate = dateStr;
    this.showContextMenu(e.pageX, e.pageY);
}
```

**결과**: API rebuild 완료, Dashboard에서 테스트 가능


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- `public/_dashboard/js/components/calendar.js`
- `public/_dashboard/js/components/task-modal.js`

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
