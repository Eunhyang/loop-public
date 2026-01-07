---
entity_type: Task
entity_id: tsk-022-25
entity_name: Dashboard v2 - Task Drawer 구현
created: '2026-01-07'
updated: '2026-01-07'
status: todo
project_id: prj-023
parent_id: prj-023
assignee: 김은향
priority: high
start_date: '2026-01-07'
due: '2026-01-07'
aliases:
- tsk-022-25
tags: []
type: dev
---

# Dashboard v2 - Task Drawer 구현

## 설명

## 체크리스트

### 1. 환경 설정 (Tailwind CSS)
- [x] 패키지 설치 (`npm install -D tailwindcss postcss autoprefixer`)
- [x] 초기화 (`npx tailwindcss init -p`)
- [x] Config 파일 설정 (`content` 경로 추가)
- [x] `globals.css`에 Tailwind 지시어 추가

### 2. API & Hooks
- [x] `TaskUpdatePayload` 타입 정의
- [x] `api.ts`: `getTask`, `updateTask` 추가
- [x] `useTask.ts`: 조회 Hook 구현
- [x] `useTask.ts`: 수정 Hook (Optimistic Update) 구현

### 3. UI 구현 (TaskDrawer)
- [x] Shell 컴포넌트 (Overlay/Panel)
- [x] Header (Title, Status, Close)
- [x] Body - Properties (Grid Layout)
- [x] Body - Description (Textarea)
- [x] Footer (Actions)

### 4. 통합 및 검증
- [x] KanbanBoard 상태 연동 (`selectedTaskId`)
- [x] 카드 클릭 이벤트 연결
- [x] 스타일 및 기능(수정/반영) 검증

## 참고
