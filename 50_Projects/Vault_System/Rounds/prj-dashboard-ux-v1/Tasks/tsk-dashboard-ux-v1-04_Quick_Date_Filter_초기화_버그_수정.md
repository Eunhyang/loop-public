---
entity_type: Task
entity_id: tsk-dashboard-ux-v1-04
entity_name: Quick Date Filter 초기화 버그 수정
created: 2025-12-26
updated: '2025-12-26'
status: done
closed: 2025-12-26
parent_id: prj-dashboard-ux-v1
project_id: prj-dashboard-ux-v1
aliases:
- tsk-dashboard-ux-v1-04
outgoing_relations: []
validates: []
validated_by: []
assignee: 은향
due: 2025-12-26
priority: high
estimated_hours: 1
actual_hours: null
type: dev
target_project: loop
conditions_3y:
- cond-e
tags:
- dev
- bug-fix
- dashboard
- filter
priority_flag: high
---
# Quick Date Filter 초기화 버그 수정

> Task ID: `tsk-dashboard-ux-v1-04` | Project: `prj-dashboard-ux-v1` | Status: doing

## 목표

**완료 조건**:
1. 앱 시작 시 Quick Date Filter가 현재 주로 초기화됨
2. 2025-11월 등 오래된 태스크가 기본 필터에서 제외됨

---

## 상세 내용

### 배경

대시보드의 기본 필터가 "현재 주"만 보여주도록 설정되어 있으나, 2025-11월의 태스크도 모두 보이는 버그가 있음.

### 원인 분석

`state.js`의 필터 기본값:
```javascript
quickDateMode: 'week',
selectedWeeks: [],      // 빈 배열!
selectedMonths: []
```

`passesQuickDateFilter()` 로직:
```javascript
if (mode === 'week' && selectedWeeks.length === 0) return true;  // 모든 태스크 통과!
```

`initQuickDateFilter()` 함수가 정의되어 있지만 `app.js`에서 호출되지 않음.

### 해결 방법

`app.js`의 `init()` 함수에서 `State.initQuickDateFilter()` 호출 추가.

---

## 체크리스트

- [x] 원인 분석 완료
- [ ] app.js 수정
- [ ] 테스트 확인

---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- `_dashboard/js/state.js` - 상태 관리
- `_dashboard/js/app.js` - 앱 초기화

---

**Created**: 2025-12-26
**Assignee**: 은향
**Due**: 2025-12-26