---
entity_type: Task
entity_id: "tsk-content-os-12"
entity_name: "Content OS - Performance Delta 툴팁 UX"
created: 2026-01-02
updated: 2026-01-02
status: doing

# === 계층 ===
parent_id: "prj-content-os"
project_id: "prj-content-os"
aliases: ["tsk-content-os-12"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-02
due: null
priority: medium
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 분류 ===
tags: ["content-os", "performance-dashboard", "ux", "tooltip"]
priority_flag: medium
---

# Content OS - Performance Delta 툴팁 UX

> Task ID: `tsk-content-os-12` | Project: `prj-content-os` | Status: doing

## 목표

**완료 조건**:
1. Delta 지표에 마우스 호버 시 툴팁으로 상세 정보 표시
2. 툴팁 내용: 24h 값, 7d 값, 변화율 계산 방식 설명
3. 사용자가 Delta 값의 의미를 직관적으로 이해할 수 있음

---

## 상세 내용

### 배경

Performance Dashboard에서 Delta 값(+15%, -8% 등)이 표시되지만, 이 값이 무엇을 의미하는지 사용자가 알 수 없다. 툴팁으로 상세 정보를 제공하여 UX를 개선한다.

### 현재 상태

**Delta 계산 로직** (`dummy-performance.ts:111-129`):
```typescript
percentage = ((value7d - value24h) / value24h) * 100
```
- 24시간 값을 기준으로 7일 값과의 변화율 계산
- ±5% 이상이면 up/down, 그 사이면 stable

**현재 UI** (`performance-table.tsx:191-195`):
- `DeltaIndicatorCompact` 컴포넌트로 `+12%` 형태만 표시
- 툴팁 없음

### 작업 내용

1. **DeltaIndicatorCompact에 Tooltip 추가**
   - ShadCN Tooltip 컴포넌트 래핑
   - 24h/7d 원본 값 표시
   - 계산 방식 설명

2. **툴팁 내용 구성**
   ```
   ┌─────────────────────────────────────┐
   │  Delta: +15%                        │
   │  ──────────────────────             │
   │  CTR 24h: 8.5%                      │
   │  CTR 7d:  7.4%                      │
   │  ──────────────────────             │
   │  24시간 성과가 7일 평균 대비 15% 높음   │
   └─────────────────────────────────────┘
   ```

---

## 체크리스트

- [ ] DeltaIndicatorCompact에 Tooltip 래핑
- [ ] Props에 원본 값 (24h, 7d) 추가 또는 계산 결과 활용
- [ ] 툴팁 내용 (24h 값, 7d 값, 설명) 구성
- [ ] performance-table.tsx에서 Props 전달 확인
- [ ] 빌드 및 UI 테스트

---

## Notes

### Todo
- [ ] PRD 생성 (prompt-enhancer)
- [ ] 구현

### 작업 로그


---

## 참고 문서

- [[prj-content-os]] - 소속 Project
- [[tsk-content-os-06]] - Performance Dashboard Phase 1
- [[tsk-content-os-10]] - YouTube Analytics API 연동

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**:
