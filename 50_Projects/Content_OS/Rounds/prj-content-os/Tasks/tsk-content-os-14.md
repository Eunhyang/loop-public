---
entity_type: Task
entity_id: tsk-content-os-14
entity_name: ContentOS - YouTube Analytics 전체 메트릭 수집
created: 2026-01-10
updated: '2026-01-10'
status: doing
parent_id: prj-content-os
type: dev
aliases:
  - tsk-content-os-14
assignee: 김은향
due: null
priority_flag: high
tags:
  - content-os
  - youtube-analytics
  - api
  - metrics
outgoing_relations: []
---

# ContentOS - YouTube Analytics 전체 메트릭 수집

> Task ID: `tsk-content-os-14` | Project: `prj-content-os` | Status: doing

---

## 목표

YouTube Analytics API에서 실제 메트릭 데이터를 정확하게 수집하도록 수정:
1. 24h 데이터가 0인 문제 해결 (API 지연 대응)
2. impressions, CTR 등 시뮬레이션 제거 → 실제 API 값 사용
3. 전체 가용 메트릭 수집 (likes, comments, shares 등)

---

## 현재 문제

| 문제 | 원인 | 해결 |
|------|------|------|
| 24h 데이터 전부 0 | API가 당일/전날 데이터 미제공 (2-3일 지연) | 날짜 범위를 3일전~2일전으로 변경 |
| CTR이 항상 5% | 조회수 기반 시뮬레이션 공식 사용 | 실제 `impressionsClickThroughRate` API 메트릭 사용 |
| impressions 부정확 | CTR 역산으로 계산 | 실제 `impressions` API 메트릭 사용 |

---

## 수정 대상 파일

| 파일 | 변경 내용 | 우선순위 |
|------|----------|:--------:|
| `types/youtube-analytics.ts` | VideoMetrics 타입에 impressions, CTR 필드 추가 | P0 |
| `lib/youtube/youtube-analytics-service.ts` | 날짜 범위 + 메트릭 요청 + 시뮬레이션 제거 | P0 |
| `types/performance.ts` | ContentMetrics 확장 (optional) | P1 |

---

## Notes

### Tech Spec

#### Phase 1: 타입 확장 (`types/youtube-analytics.ts`)

```typescript
export interface VideoMetrics {
  views: number;
  estimatedMinutesWatched: number;
  averageViewDuration: number;
  // 신규 필수 필드
  impressions: number;
  impressionsClickThroughRate: number;  // 0-1 범위
  // 기존 optional
  averageViewPercentage?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  subscribersGained?: number;
}
```

#### Phase 2: API 호출 수정 (`lib/youtube/youtube-analytics-service.ts`)

**날짜 범위 수정:**
```typescript
// 현재: yesterday ~ today (데이터 없음)
// 변경: 3일전 ~ 2일전 (API 지연 대응)
const twoDaysAgo = formatDate(getDaysAgo(2));
const threeDaysAgo = formatDate(getDaysAgo(3));
const nineDaysAgo = formatDate(getDaysAgo(9));
```

**메트릭 요청 확장:**
```typescript
const metrics = [
  "views",
  "estimatedMinutesWatched",
  "averageViewDuration",
  "averageViewPercentage",
  "impressions",                    // 추가
  "impressionsClickThroughRate",    // 추가
  "likes",
  "comments",
  "shares",
  "subscribersGained",
];
```

**시뮬레이션 제거:**
```typescript
// 현재 (시뮬레이션)
const simulatedCtr24h = Math.min(10, (m24h.views / 1000) * 2 + 5);

// 변경 (실제 API 값)
const ctr24h = (m24h.impressionsClickThroughRate || 0) * 100;
```

---

### Todo

- [ ] Phase 1: types/youtube-analytics.ts - VideoMetrics 타입 확장
- [ ] Phase 2-1: youtube-analytics-service.ts - 날짜 범위 수정
- [ ] Phase 2-2: youtube-analytics-service.ts - 메트릭 요청 확장
- [ ] Phase 2-3: youtube-analytics-service.ts - buildMetricsMap 수정
- [ ] Phase 2-4: youtube-analytics-service.ts - 시뮬레이션 로직 제거
- [ ] Phase 2-5: youtube-analytics-service.ts - getDiagnosis 수정
- [ ] Phase 3: getVideoAnalytics 함수 수정
- [ ] 테스트: API 응답 확인 (impressions, CTR 값 검증)
- [ ] 테스트: 24h 데이터가 0이 아닌지 확인

---

## 예상 결과

| 필드 | 현재 | 변경 후 |
|------|------|---------|
| impressions_24h | 0 | 실제 노출수 |
| ctr_24h | 5% (기본값) | 실제 CTR |
| views_24h | 0 | 2-3일 전 조회수 |

---

**Created**: 2026-01-10 | **Assignee**: 김은향
