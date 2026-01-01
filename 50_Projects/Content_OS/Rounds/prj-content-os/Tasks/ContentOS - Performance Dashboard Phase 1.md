---
entity_type: Task
entity_id: "tsk-content-os-06"
entity_name: "ContentOS - Performance Dashboard Phase 1"
created: 2026-01-02
updated: 2026-01-02
status: doing

# === 계층 ===
parent_id: "prj-content-os"
project_id: "prj-content-os"
aliases: ["tsk-content-os-06"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-02
due: 2026-01-02
priority: medium
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-a"]

# === 분류 ===
tags: ["content-os", "dashboard", "youtube-analytics", "phase-1"]
priority_flag: high
---

# ContentOS - Performance Dashboard Phase 1

> Task ID: `tsk-content-os-06` | Project: `prj-content-os` | Status: doing

## 목표

**완료 조건**:
1. 내 채널 영상 성과 대시보드 UI 구현 (영상 단위 중심)
2. 3가지 뷰 완성: 리스트 뷰, 상세 뷰, 주간 요약 뷰
3. 24h/7d 지표 비교 UI 표시

---

## 상세 내용

### 배경

PRD Phase 1: "My Channel Performance Dashboard"
- 목적: 각 콘텐츠가 업로드 후 1일/7일 동안 노출-클릭-시청이 어떻게 변했는지 한눈에 보고, 회고와 다음 태스크의 근거를 만드는 대시보드
- 점수 판단 도구가 아닌 측정/비교/변화 관찰 도구

### 작업 내용

**핵심 지표 (YouTube Analytics API 기반)**:
- 노출: impressions_24h, impressions_7d
- 클릭: ctr_24h, ctr_7d
- 시청: views_24h, views_7d, avg_view_duration_24h, avg_view_duration_7d

**3가지 화면**:
1. 콘텐츠 성과 리스트 뷰 (운영자 핵심 화면)
2. 콘텐츠 상세 뷰 (회고용)
3. 주간 요약 뷰 (Retro 전용)

---

## 체크리스트

- [x] types/performance.ts 타입 정의
- [x] /performance 페이지 라우트 생성
- [x] 더미 데이터 생성
- [x] 성과 리스트 테이블 컴포넌트
- [x] 상세 뷰 (별도 페이지로 구현)
- [x] 주간 요약 카드
- [x] 사이드바 네비게이션 추가

---

## Notes

### PRD (Product Requirements Document)

#### 아키텍처 도식

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     Performance Dashboard Architecture                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Route Layer (app/performance/)                                                  │
│  ├── page.tsx (리스트 뷰) → PerformanceTable, PerformanceFilters, StatusBadge   │
│  ├── [videoId]/page.tsx (상세 뷰) → MetricCompareCard, MetricChart, DiagnosisLabel│
│  └── weekly/page.tsx (주간 요약) → SummaryStatCard, ProblemTypeChart            │
│                                                                                  │
│  Types & Data Layer                                                              │
│  ├── types/performance.ts → ContentPerformance, WeeklySummary, DiagnosisStatus  │
│  └── data/dummy-performance.ts → dummyPerformanceData[], getWeeklySummary()     │
│                                                                                  │
│  UI Components (기존 재사용)                                                      │
│  └── components/ui/ → Card, Table, Badge + Recharts                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 프로젝트 컨텍스트

| 항목 | 값 |
|------|-----|
| Framework | Next.js 16.1.1 (App Router) |
| UI Library | ShadCN (Radix UI) |
| Charts | Recharts 3.6.0 |
| Theme | next-themes (다크모드) |

#### 파일 구조

```
apps/content-os/
├── app/performance/
│   ├── page.tsx                      # 리스트 뷰 (메인)
│   ├── components/
│   │   ├── performance-table.tsx     # 성과 테이블
│   │   ├── performance-filters.tsx   # 필터 UI
│   │   ├── status-badge.tsx          # 상태 배지
│   │   └── delta-indicator.tsx       # 변화량 표시
│   ├── [videoId]/
│   │   ├── page.tsx                  # 상세 뷰
│   │   └── components/
│   │       ├── metric-compare-card.tsx
│   │       ├── metric-chart.tsx
│   │       └── diagnosis-label.tsx
│   └── weekly/
│       ├── page.tsx                  # 주간 요약
│       └── components/
│           ├── summary-stat-card.tsx
│           └── problem-type-chart.tsx
├── types/performance.ts              # 타입 정의
└── data/dummy-performance.ts         # 더미 데이터
```

#### 핵심 타입

```typescript
export type DiagnosisStatus =
  | "exposure_ok_click_weak"     // 노출 OK / 클릭 약함
  | "click_ok_watch_weak"        // 클릭 OK / 시청 약함
  | "early_success"              // 초기 반응 우수
  | "expansion_failed"           // 확장 실패
  | "stable";                    // 안정적

export type ProblemType =
  | "thumbnail_title"    // 썸네일/제목 이슈
  | "early_hook"         // 초반 훅 이슈
  | "topic_timing"       // 주제/타이밍 이슈
  | "none";
```

#### 진단 룰 (Phase 1)

| 문제 유형 | 조건 | 설명 |
|-----------|------|------|
| thumbnail_title | CTR_24h < 5% | 썸네일/제목이 클릭을 유도하지 못함 |
| early_hook | avg_duration < 30% of video length | 초반 이탈률 높음 |
| topic_timing | impressions_7d < impressions_24h * 3 | 알고리즘 확장 미달 |
| none | 위 조건 모두 해당 없음 | 현재 성과 양호 |

#### 상태 배지 디자인

| 상태 | 텍스트 | 색상 |
|------|--------|------|
| early_success | 초기 반응 우수 | green |
| stable | 안정적 | blue |
| exposure_ok_click_weak | 노출 OK / 클릭 약함 | yellow |
| click_ok_watch_weak | 클릭 OK / 시청 약함 | orange |
| expansion_failed | 확장 실패 | red |

#### 성공 기준

- [x] `/performance` 라우트에서 콘텐츠 성과 리스트 확인 가능
- [x] 상태 배지로 한눈에 콘텐츠 상태 파악 가능
- [x] 24h→7d Delta 값으로 변화 추이 확인 가능
- [x] `/performance/[videoId]`에서 상세 지표 및 그래프 확인 가능
- [x] `/performance/weekly`에서 주간 요약 통계 확인 가능
- [x] 기존 코드 스타일 및 아키텍처 일관성 유지

#### Phase 1 제외 범위

- 점수(Score) 계산 로직
- Vault Task 자동 평가 연동
- 실제 YouTube Analytics API 연동
- 데이터 저장/수정 기능

---

### 작업 로그

#### 2026-01-02 03:30
**개요**: Performance Dashboard Phase 1 UI 구현 완료. 3가지 뷰(리스트/상세/주간요약)와 진단 로직, 더미 데이터 포함. 빌드 성공.

**변경사항**:
- 개발:
  - `types/performance.ts` - ContentPerformance, DiagnosisStatus, WeeklySummary 등 타입 정의
  - `/performance` 리스트 뷰 - PerformanceTable, StatusBadge, DeltaIndicator, Filters
  - `/performance/[videoId]` 상세 뷰 - MetricCompareCard, MetricChart (Recharts), DiagnosisLabel
  - `/performance/weekly` 주간 요약 - SummaryStatCard, ProblemTypeChart, 4주 비교 테이블
  - `data/dummy-performance.ts` - 10개 더미 영상 데이터 + 진단 로직
- 수정:
  - `components/layout/sidebar.tsx` - Performance 메뉴 추가 (BarChart3 아이콘)

**파일 변경** (16개):
- `types/performance.ts` - 타입 정의
- `app/performance/page.tsx` - 리스트 뷰 메인
- `app/performance/components/*` - 테이블, 필터, 배지, 델타 (5개)
- `app/performance/[videoId]/page.tsx` - 상세 뷰
- `app/performance/[videoId]/components/*` - 비교카드, 차트, 진단 (4개)
- `app/performance/weekly/page.tsx` - 주간 요약
- `app/performance/weekly/components/*` - 통계카드, 차트 (3개)
- `app/performance/data/dummy-performance.ts` - 더미 데이터

**결과**: ✅ 빌드 성공 (`pnpm build`)

**다음 단계**:
- Phase 2: YouTube Analytics API 연동 (OAuth 2.0 인증)
- 실제 채널 데이터로 대시보드 동기화


---

## 참고 문서

- [[prj-content-os]] - 소속 Project
- [[hyp-3-01]] - Content OS 기획시간 50% 감소 가설

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**:
