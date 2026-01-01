---
entity_type: Task
entity_id: tsk-n8n-10
entity_name: "Dashboard - Pending Reviews 3단 레이아웃 UX 개선"
created: 2026-01-01
updated: 2026-01-01
status: doing

# === 계층 ===
parent_id: prj-n8n
project_id: prj-n8n
aliases:
- tsk-n8n-10

# === 관계 ===
outgoing_relations:
- tsk-n8n-09
validates: []

# === Task 전용 ===
assignee: 김은향
start_date: 2026-01-01
due: 2026-01-02
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===
conditions_3y:
- cond-e

# === 분류 ===
tags:
- dashboard
- pending-reviews
- ux
priority_flag: high
---

# Dashboard - Pending Reviews 3단 레이아웃 UX 개선

> Task ID: `tsk-n8n-10` | Project: `prj-n8n` | Status: doing

## 목표

**완료 조건**:
1. Pending Reviews를 3단 레이아웃으로 전환 (List | Detail | Entity)
2. 엔티티 ID 클릭 시 오른쪽 패널에 상세 정보 표시
3. 기존 모달 제거, 전체화면 3단 레이아웃 적용
4. 테스트 완료 및 NAS 배포

---

## 상세 내용

### 배경

tsk-n8n-09에서 E2E 테스트 완료 후 요청된 UX 개선 사항.
현재: Side Panel + Modal 방식 → 엔티티 실제 내용 확인 불가

### 현재 상태

```
┌─────────────────────────────────────────────────────────┐
│                      Dashboard                          │
└─────────────────────────────────────────────────────────┘
                             +
┌──────────────────┐   ┌──────────────────────────┐
│  Side Panel      │   │   Modal (overlay)        │
│  (Pending List)  │   │   - suggested_fields     │
│                  │   │   - Approve/Reject       │
└──────────────────┘   └──────────────────────────┘

- 리스트 클릭 → 모달로 상세 보기
- 엔티티 실제 내용 확인 불가
```

### 목표 레이아웃 (3단 분할)

```
┌──────────────┬──────────────────────┬──────────────────────┐
│   1. 왼쪽    │      2. 가운데       │      3. 오른쪽       │
│  Pending     │   Pending Detail     │   Entity Detail      │
│  List        │                      │                      │
├──────────────┼──────────────────────┼──────────────────────┤
│              │                      │                      │
│ • Review 1   │  conditions_3y:      │  ┌─ cond-a ────────┐ │
│ • Review 2 ◀─┼─ [cond-a, cond-e] ──┼─►│ Product-Market   │ │
│ • Review 3   │                      │  │ Fit 검증...     │ │
│              │  assignee: 김은향    │  └──────────────────┘ │
│              │  due: 2026-01-01     │                      │
│              │  priority: medium    │                      │
│              │                      │                      │
│              │  ─────────────────   │                      │
│              │  AI 판단 근거        │                      │
│              │  (reasoning...)      │                      │
│              │                      │                      │
│              │  [Reject] [Approve]  │                      │
└──────────────┴──────────────────────┴──────────────────────┘
```

**동작 흐름**:
1. 왼쪽 - Pending 리스트에서 항목 클릭
2. 가운데 - 해당 Pending의 suggested_fields, reasoning, Approve/Reject 버튼
3. 오른쪽 - 가운데에서 cond-a, trk-2, hyp-001 등 클릭 시 해당 엔티티의 실제 정보 표시

### 구현 방식

| 영역   | 너비   | 내용                                           |
|--------|--------|------------------------------------------------|
| 왼쪽   | ~250px | Pending 리스트 (탭: Pending/Approved/Rejected) |
| 가운데 | flex-1 | 선택된 Pending 상세 (현재 모달 내용)           |
| 오른쪽 | ~350px | 클릭한 엔티티 상세 (API로 조회)                |

- 기존 모달 제거 → 3단 전체화면 레이아웃
- 오른쪽 패널은 엔티티 클릭 전엔 빈 상태 또는 "Select an entity to view details" 표시

---

## 체크리스트

### 레이아웃 구조
- [ ] 3단 컨테이너 HTML 구조 변경
- [ ] CSS Flexbox 레이아웃 적용
- [ ] 기존 모달 코드 제거

### 왼쪽 패널 (Pending List)
- [ ] 탭 UI 구현 (Pending/Approved/Rejected)
- [ ] 리스트 아이템 클릭 이벤트
- [ ] 선택 상태 하이라이트

### 가운데 패널 (Pending Detail)
- [ ] suggested_fields 표시
- [ ] reasoning 섹션 (기본 펼침)
- [ ] Approve/Reject 버튼
- [ ] 엔티티 ID 클릭 가능하게 변경

### 오른쪽 패널 (Entity Detail)
- [ ] API 조회 함수 구현
- [ ] 엔티티 상세 렌더링
- [ ] 빈 상태 UI

### 테스트 및 배포
- [ ] 로컬 테스트
- [ ] NAS 동기화
- [ ] Docker 재배포

---

## Notes

### Todo
- [ ] pending-panel.js 3단 레이아웃으로 리팩토링
- [ ] panel.css 스타일 추가
- [ ] Entity API 조회 함수 구현
- [ ] 모달 코드 제거

### 작업 로그


---

## 참고 문서

- [[prj-n8n]] - 소속 Project
- [[tsk-n8n-09]] - 선행 Task (Phase 1/2 AI Router 통합)

---

**Created**: 2026-01-01
**Assignee**: 김은향
**Due**: 2026-01-02
