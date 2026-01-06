---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-31"
entity_name: "Dashboard - Task Type Chip 즉시 저장 버그 수정"
created: 2026-01-06
updated: 2026-01-06
status: doing

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-31"]

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
type: bug
target_project: loop

# === 분류 ===
tags: [dashboard, bug, api, type-field]
priority_flag: high
---

# Dashboard - Task Type Chip 즉시 저장 버그 수정

> Task ID: `tsk-dashboard-ux-v1-31` | Project: `prj-dashboard-ux-v1` | Status: doing

## 목표

**완료 조건**:
1. Task Detail에서 타입 칩 클릭 시 즉시 서버에 저장
2. 새로고침 후에도 선택한 타입 유지
3. API 응답에 type 필드 포함

---

## 상세 내용

### 배경

Task Detail에서 타입 칩(dev, bug, strategy 등)을 클릭하면:
- Save 버튼 없이 즉시 서버에 저장되어야 함
- 새로고침 후에도 선택한 타입이 유지되어야 함

### 현재 문제

1. API 저장은 성공하지만 (`{"success":true}`)
2. NAS 파일에 type 필드가 저장되지 않음
3. API 응답에도 type 필드가 누락됨

### 이미 수정된 파일

- `api/models/entities.py` - TaskCreate/TaskUpdate에 type 필드 추가됨
- `api/routers/tasks.py` - frontmatter에 type 저장 로직 추가됨

### 추가 확인/수정 필요

- NAS 서버에서 파일 저장 시 type 필드가 실제로 저장되는지
- vault_cache에서 type 필드를 제대로 반환하는지
- Dashboard에서 type 필드를 읽어서 표시하는지

---

## 체크리스트

- [ ] api/routers/tasks.py - update_task에서 type 필드 저장 확인
- [ ] api/cache/vault_cache.py - type 필드 파싱/반환 확인
- [ ] _dashboard/js/components/task-detail.js - type 저장 로직 확인
- [ ] 테스트: 타입 변경 후 새로고침하여 유지 확인

---

## Notes

### Todo
- [ ] API 엔드포인트 분석
- [ ] 파일 저장 로직 디버깅
- [ ] Cache 로직 확인
- [ ] Dashboard JS 확인

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)
-->


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- `api/routers/tasks.py` - Task CRUD API
- `api/cache/vault_cache.py` - Vault 캐시 시스템
- `_dashboard/js/components/task-detail.js` - Task 상세 UI

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
