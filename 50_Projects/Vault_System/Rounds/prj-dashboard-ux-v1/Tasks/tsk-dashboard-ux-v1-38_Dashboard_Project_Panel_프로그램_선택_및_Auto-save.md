---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-38"
entity_name: "Dashboard - Project Panel 프로그램 선택 및 Auto-save"
created: 2026-01-07
updated: 2026-01-07
status: doing

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-38"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-07
due: 2026-01-07
priority: medium
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: null

# === 분류 ===
tags: [dashboard, project-panel, auto-save, ux]
priority_flag: medium
---

# Dashboard - Project Panel 프로그램 선택 및 Auto-save

> Task ID: `tsk-dashboard-ux-v1-38` | Project: `prj-dashboard-ux-v1` | Status: doing

## 목표

**완료 조건**:
1. Project Detail Panel에서 Program 선택 가능
2. Priority가 하단에 chip 형태로 표시
3. 모든 필드 변경 시 Auto-save (Save 버튼 제거)

---

## 상세 내용

### 배경

현재 Project Detail Panel에서 Program을 선택할 수 없고, 변경사항 저장을 위해 Save 버튼을 클릭해야 함.
UX 개선을 위해 Program 선택 기능 추가 및 Auto-save 구현 필요.

### 요구사항

#### 1. 레이아웃 변경

**현재:**
```
Project Name *
Owner        | Parent Track
Status       | Priority (dropdown)
```

**변경 후:**
```
Project Name *
Program      | Parent Track    ← 1행
Status       | Owner *         ← 2행
[CRITICAL] [HIGH] [MEDIUM] [LOW]  ← Priority chip 형태
```

#### 2. Priority Chip
- Task Type Chip과 동일한 스타일 (둥근 버튼)
- 클릭 시 하나만 선택됨 (single select)
- 선택된 것만 색상 활성화

#### 3. Auto-save
- 필드 변경 시 즉시 API 호출하여 저장
- Save/Cancel 버튼 제거
- 트리거 시점:
  - `select` 변경: `onChange` 즉시
  - `input/textarea`: `onBlur` 또는 debounce (~500ms)
  - Priority chip 클릭: 즉시
- 저장 성공/실패 시 토스트 알림

---

## 체크리스트

- [ ] HTML: Program select 추가 (index.html)
- [ ] HTML: 레이아웃 변경 (Program|Track, Status|Owner)
- [ ] HTML: Priority dropdown → chip 변환
- [ ] CSS: Priority chip 스타일 추가
- [ ] JS: populateSelects()에 Program 옵션 추가
- [ ] JS: Auto-save 로직 구현 (onChange, onBlur)
- [ ] JS: Save/Cancel 버튼 제거 또는 숨김
- [ ] JS: Priority chip 클릭 핸들러
- [ ] API: updateProject에 program_id 필드 추가 확인

---

## Notes

### Todo
- [ ] 구현
- [ ] 테스트
- [ ] 코드 리뷰

### 작업 로그


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- `_dashboard/js/components/project-panel.js` - Project Panel 컴포넌트
- `_dashboard/js/components/task-panel.js` - Task Type Chip 참고
- `_dashboard/css/panel.css` - Chip 스타일 참고

---

**Created**: 2026-01-07
**Assignee**: 김은향
**Due**: 2026-01-07
