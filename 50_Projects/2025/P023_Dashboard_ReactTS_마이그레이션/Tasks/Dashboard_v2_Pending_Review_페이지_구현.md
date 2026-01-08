---
entity_type: Task
entity_id: tsk-022-26
entity_name: Dashboard v2 - Pending Review 페이지 구현
created: '2026-01-07'
updated: '2026-01-07'
status: doing
project_id: prj-023
parent_id: prj-023
assignee: 김은향
priority: high
start_date: '2026-01-07'
due: '2026-01-07'
aliases:
- tsk-022-26
tags: []
type: dev
---

# Dashboard v2 - Pending Review 페이지 구현

## 설명

레거시 대시보드의 Pending Review 기능을 dashboard-v2 (React + TypeScript)로 마이그레이션.
3-Pane 레이아웃으로 List / Detail / Entity Preview 구현.

## PRD (Product Requirements Document)

### 구현 범위 (MVP)

| 기능 | 포함 여부 | 설명 |
|------|----------|------|
| 3-Pane Layout | ✅ | List / Detail / Entity Preview (min-h-0 적용) |
| Tab Filtering | ✅ | Pending / Approved / Rejected (프론트 필터링) |
| Review Card | ✅ | Entity 타입, 이름, 필드 뱃지 |
| Suggested Fields | ✅ | 필드별 값 표시 (타입별 UI 분기) |
| Approve/Reject | ✅ | 승인/거부 액션 (prompt() 사용) |
| Delete | ✅ | 개별 삭제 (confirm() 사용) |
| Entity Preview | ✅ | 5종류 (로컬 lookup + API fetch) |
| Workflow Filter | ❌ | Phase 2 |
| Batch Delete | ❌ | Phase 2 |

### 아키텍처

```
┌──────────────────────────────────────────────────────────────────┐
│ PendingPage (3-Pane Layout)                                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐   ┌─────────────────┐   ┌─────────────────┐       │
│  │ReviewList│   │  ReviewDetail   │   │ EntityPreview   │       │
│  │(Left)    │──→│  (Center)       │──→│ (Right)         │       │
│  │- Tabs    │   │- Entity Info    │   │- 5 Entity Types │       │
│  │- Cards   │   │- Suggested Fields│   │- Local/API fetch│       │
│  └──────────┘   │- Actions        │   └─────────────────┘       │
│                 └─────────────────┘                              │
└──────────────────────────────────────────────────────────────────┘
```

### 데이터 전략

- **단일 쿼리**: `GET /api/pending` 전체 fetch
- **프론트 필터링**: 탭 전환 시 새 요청 없이 필터만 변경
- **Mutation 후**: `invalidateQueries(['pending'])` 한 번으로 충분

### Entity Preview 데이터 소스

| Entity Type | 데이터 소스 |
|-------------|------------|
| Track (trk-*) | dashboardInit 로컬 lookup |
| Condition (cond-*) | dashboardInit 로컬 lookup |
| Hypothesis (hyp-*) | dashboardInit 로컬 lookup |
| Project (prj-*) | `/api/projects/{id}` fetch |
| Task (tsk-*) | `/api/tasks/{id}` fetch |

### Field 타입별 UI 처리

| 타입 | UI |
|------|-----|
| string | `<input type="text">` |
| number | `<input type="number">` |
| boolean | `<input type="checkbox">` |
| array | read-only 뱃지 |
| object | JSON read-only |

## Tech Spec

### 생성할 파일 (9개)

1. `src/features/pending/types.ts` - 타입 정의
2. `src/features/pending/queries/usePendingReviews.ts` - React Query hooks
3. `src/features/pending/queries/index.ts` - barrel export
4. `src/features/pending/components/ReviewList.tsx` - 좌측 패널
5. `src/features/pending/components/ReviewCard.tsx` - 카드 컴포넌트
6. `src/features/pending/components/ReviewDetail.tsx` - 중앙 패널
7. `src/features/pending/components/EntityPreview.tsx` - 우측 패널
8. `src/features/pending/components/FieldValue.tsx` - 필드값 렌더링
9. `src/features/pending/components/index.ts` - barrel export

### 수정할 파일 (2개)

1. `src/features/pending/api.ts` - approve, reject, delete 추가
2. `src/pages/Pending/index.tsx` - 3-Pane 레이아웃

### 핵심 구현 포인트

1. **3-Pane Layout**: `h-full min-h-0 overflow-hidden` 필수
2. **ReviewDetail Props**: `review: PendingReview` 객체 직접 전달 (ID 아님)
3. **Reject 사유**: MVP는 `prompt()` 사용, Phase 2에서 모달로 교체
4. **Query Key**: `['pending']` 단일 구조

## 체크리스트

- [ ] types.ts 생성
- [ ] api.ts 확장 (approve, reject, delete)
- [ ] usePendingReviews.ts hooks
- [ ] FieldValue 컴포넌트
- [ ] ReviewCard 컴포넌트
- [ ] ReviewList 컴포넌트 (탭 + 목록)
- [ ] ReviewDetail 컴포넌트 (상세 + 액션)
- [ ] EntityPreview 컴포넌트 (5종류)
- [ ] PendingPage 3-Pane 레이아웃
- [ ] 빌드 테스트

## 참고

- 기획 문서: `/Users/gim-eunhyang/.claude/plans/majestic-growing-kahan.md`
- 레거시 구현: `/Users/gim-eunhyang/dev/loop/public/_dashboard/js/components/pending-panel.js`
