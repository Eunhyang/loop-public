---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-19"
entity_name: "Dashboard - Task 첨부파일 UI"
created: 2026-01-02
updated: 2026-01-02
status: todo

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-19"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-02
due: 2026-01-02
priority: medium
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 분류 ===
tags: [dashboard, attachment, ui, upload]
priority_flag: medium
---

# Dashboard - Task 첨부파일 UI

> Task ID: `tsk-dashboard-ux-v1-19` | Project: `prj-dashboard-ux-v1` | Status: todo

## 목표

Task Panel에서 첨부파일을 업로드/조회/삭제할 수 있는 UI 구현

**완료 조건**:
1. Task Panel에 "Attachments" 섹션 추가
2. 파일 업로드 버튼 (드래그앤드롭 또는 클릭)
3. 첨부파일 목록 표시 (파일명, 크기, 타입)
4. 파일별 다운로드/삭제 버튼
5. PDF 파일은 뷰어 아이콘 표시 (tsk-20에서 구현)

---

## 상세 내용

### 배경

- Task Panel(`task-panel.js`)에서 첨부파일 관리 UI 필요
- 기존 Links 섹션과 유사한 UX
- API는 tsk-18에서 구현

### 작업 내용

1. `task-panel.js`에 Attachments 섹션 추가
2. 파일 업로드 UI (input type=file + 드래그앤드롭)
3. 첨부파일 목록 렌더링
4. 파일별 액션 버튼 (다운로드, 삭제, PDF 뷰어)
5. 업로드 진행 상태 표시
6. CSS 스타일링

---

## 체크리스트

- [ ] task-panel.js에 Attachments 섹션 HTML 추가
- [ ] 파일 업로드 UI 구현 (input + 드래그앤드롭)
- [ ] API 연동 (upload, list, delete)
- [ ] 첨부파일 목록 렌더링
- [ ] 다운로드 링크 동작
- [ ] 삭제 버튼 동작
- [ ] 업로드 진행 상태 UI
- [ ] CSS 스타일 추가

---

## Notes

### Todo
- [ ] task-panel.js 수정
- [ ] API 연동 함수 추가
- [ ] 스타일 작업

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)
-->


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[tsk-dashboard-ux-v1-18]] - 첨부파일 API (의존)

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**: 2026-01-02
