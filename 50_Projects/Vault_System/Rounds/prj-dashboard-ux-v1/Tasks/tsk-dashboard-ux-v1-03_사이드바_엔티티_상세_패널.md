---
entity_type: Task
entity_id: tsk-dashboard-ux-v1-03
entity_name: 사이드바 엔티티 상세 패널 구현
created: 2025-12-26
updated: '2025-12-26'
status: done
parent_id: prj-dashboard-ux-v1
project_id: prj-dashboard-ux-v1
aliases:
- tsk-dashboard-ux-v1-03
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
due: '2025-12-26'
priority: high
estimated_hours: null
actual_hours: null
type: dev
target_project: loop
conditions_3y:
- cond-e
tags:
- dashboard
- ux
- side-panel
- entity-detail
priority_flag: high
---
# 사이드바 엔티티 상세 패널 구현

> Task ID: `tsk-dashboard-ux-v1-03` | Project: `prj-dashboard-ux-v1` | Status: done

## 목표

**완료 조건**:
1. 사이드바에서 Track 클릭 시 사이드 패널에 상세 정보 표시
2. 사이드바에서 Condition 클릭 시 사이드 패널에 상세 정보 표시
3. 사이드바에서 Hypothesis 클릭 시 사이드 패널에 상세 정보 표시
4. 기존 필터링 기능 유지

---

## 상세 내용

### 배경

현재 사이드바에서 Track/Condition/Hypothesis 클릭 시 필터링만 수행됨.
Graph View의 GraphDetailPanel에는 이미 각 엔티티 타입별 렌더링 로직이 존재.
사용자가 엔티티 상세 정보를 칸반보드 뷰에서도 확인하고 싶어함.

### 작업 내용

1. GraphDetailPanel 렌더링 로직을 재사용하거나 별도 패널 구현
2. sidebar.js의 selectTrack/selectCondition/selectHypothesis에 패널 열기 로직 추가
3. 필터링과 상세 표시가 동시에 동작하도록 구현

---

## 체크리스트

- [x] 기존 사이드바 클릭 동작 분석
- [x] GraphDetailPanel 재사용 가능 여부 검토
- [x] 엔티티 상세 패널 HTML/CSS 구현
- [x] sidebar.js에 패널 열기 로직 추가
- [x] Task 카드 내 클릭 가능한 링크 구현 (Project, Track, Condition, Hypothesis)
- [x] 테스트

---

## 메모


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- `_dashboard/js/components/sidebar.js` - 사이드바 컴포넌트
- `_dashboard/js/components/graphDetailPanel.js` - 그래프 상세 패널 (재사용 후보)

---

**Created**: 2025-12-26
**Assignee**: 김은향
**Due**: