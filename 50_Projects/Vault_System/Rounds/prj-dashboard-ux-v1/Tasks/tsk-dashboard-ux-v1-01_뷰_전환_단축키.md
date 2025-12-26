---
entity_type: Task
entity_id: tsk-dashboard-ux-v1-01
entity_name: 뷰 전환 단축키 (1/2/3)
created: 2025-12-26
updated: 2025-12-26
status: todo

# === 계층 ===
parent_id: prj-dashboard-ux-v1
project_id: prj-dashboard-ux-v1
aliases:
  - tsk-dashboard-ux-v1-01
  - 뷰 전환 단축키

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: 한명학
due: null
priority: high
estimated_hours: 1
actual_hours: null

# === Task 유형 ===
type: dev
target_project: loop-api

# === 3Y 전략 연결 ===
conditions_3y: ["cond-e"]

# === 분류 ===
tags: ["dashboard", "ux", "keyboard", "shortcut"]
priority_flag: high
---

# 뷰 전환 단축키 (1/2/3)

> Task ID: `tsk-dashboard-ux-v1-01` | Project: [[prj-dashboard-ux-v1]] | Status: planning

## 목표

**완료 조건**:
1. 숫자키 1 → Kanban 뷰 전환
2. 숫자키 2 → Calendar 뷰 전환
3. 숫자키 3 → Graph 뷰 전환
4. input/textarea에서는 단축키 비활성화

---

## 상세 내용

### 배경

대시보드에서 뷰 전환 시 마우스 클릭 필요. 키보드 단축키로 빠른 전환 지원.

### 작업 내용

`_dashboard/js/app.js`에 전역 keydown 이벤트 추가:

```javascript
document.addEventListener('keydown', (e) => {
    // input/textarea에서는 무시
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    // 모달 열려있으면 무시
    if (document.querySelector('.modal.active')) return;

    if (e.key === '1') switchView('kanban');
    if (e.key === '2') switchView('calendar');
    if (e.key === '3') switchView('graph');
});
```

---

## 체크리스트

- [ ] app.js에 keydown 이벤트 리스너 추가
- [ ] input/textarea 예외 처리
- [ ] 모달 열림 상태 예외 처리
- [ ] 로컬 테스트
- [ ] NAS 배포 확인

---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- 기존 단축키 참고: `_dashboard/js/components/quick-search.js`

---

**Created**: 2025-12-26
**Assignee**: 한명학
