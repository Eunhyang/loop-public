---
entity_type: Task
entity_id: tsk-dashboard-ux-v1-02
entity_name: 대시보드 키보드 단축키
created: 2025-12-26
updated: '2025-12-26'
status: done
closed: 2025-12-26
parent_id: prj-dashboard-ux-v1
project_id: prj-dashboard-ux-v1
aliases:
- tsk-dashboard-ux-v1-02
- 대시보드 키보드 단축키
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
due: '2025-12-25'
priority: medium
estimated_hours: 2
actual_hours: null
type: dev
target_project: loop
tags:
- dashboard
- keyboard
- ux
priority_flag: medium
start_date: '2025-12-25'
---
# 대시보드 키보드 단축키

> Task ID: `tsk-dashboard-ux-v1-02` | Project: `prj-dashboard-ux-v1` | Status: in_progress

## 목표

**완료 조건**:
1. 뷰 전환 단축키 (1/2/3) 구현
2. 필터 단축키 (F=토글, R=리셋) 구현
3. 도움말 단축키 (?) 구현

---

## 상세 내용

### 배경

Dashboard 사용성 개선을 위해 마우스 없이 키보드만으로 빠른 조작이 가능해야 함.

### 작업 내용

| 단축키 | 기능 | 설명 |
|--------|------|------|
| `1` | Kanban 뷰 | 뷰 전환 |
| `2` | Calendar 뷰 | 뷰 전환 |
| `3` | Strategy 뷰 | 뷰 전환 |
| `F` | 필터 토글 | 필터 패널 열기/닫기 |
| `R` | 필터 리셋 | 모든 필터 초기화 |
| `?` | 도움말 | 단축키 목록 표시 |

---

## 체크리스트

- [ ] 뷰 전환 단축키 (1/2/3)
- [ ] 필터 토글 단축키 (F)
- [ ] 필터 리셋 단축키 (R)
- [ ] 도움말 모달 (?)
- [ ] 키보드 이벤트 중복 방지 (input 입력 시 무시)

---

## 메모

- `tsk-dashboard-ux-v1-01`에서 뷰 전환 단축키는 이미 구현됨
- 나머지 단축키 구현 필요

---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[tsk-dashboard-ux-v1-01]] - 뷰 전환 단축키 (완료)

---

**Created**: 2025-12-26
**Assignee**: 김은향
**Due**:
