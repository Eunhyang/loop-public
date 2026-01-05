---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-23"
entity_name: "Dashboard - 캘린더 우클릭 미팅 추가"
created: 2026-01-06
updated: 2026-01-06
status: doing

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

- [ ] calendar.js에 dateClick 또는 contextmenu 이벤트 추가
- [ ] 컨텍스트 메뉴 UI (미팅 추가 버튼만)
- [ ] TaskModal.open()에 날짜 전달
- [ ] 테스트

---

## Notes

### PRD
- 캘린더 날짜 우클릭 → "미팅 추가" 메뉴 표시
- 클릭 시 기존 TaskModal 그대로 열림 (start_date만 자동 설정)
- 새 코드/컴포넌트 만들지 않음, 기존 calendar.js + TaskModal 활용

### Todo
- [ ] calendar.js 수정
- [ ] 컨텍스트 메뉴 스타일 추가
- [ ] 테스트

### 작업 로그


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- `public/_dashboard/js/components/calendar.js`
- `public/_dashboard/js/components/task-modal.js`

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
