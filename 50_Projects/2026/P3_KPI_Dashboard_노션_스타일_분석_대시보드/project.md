---
entity_type: Project
entity_id: prj-3pnv6w
entity_name: KPI Dashboard - 분석 대시보드
created: '2026-01-22'
updated: '2026-01-27'
status: doing
owner: 김은향
parent_id: trk-2
program_id: pgm-vault-system
conditions_3y:
- cond-b
- cond-d
validates: []
primary_hypothesis_id: hyp-2-07
project_kind: signal
aliases:
- prj-3pnv6w
tags: []
priority_flag: medium
expected_impact:
  tier: operational
  impact_magnitude: mid
  confidence: 0.7
  contributes: []
  rationale: KPI Dashboard 프로젝트는 데이터 기반 의사결정을 지원하며, KPI 분석을 통해 중간 수준의 영향을 미칠 것으로 예상됩니다.
condition_contributes:
- to: cond-b
  weight: 0.7
  description: KPI Dashboard의 성공은 데이터 기반 패턴의 재현 가능성을 높이는 데 기여할 것으로 예상된다.
- to: cond-d
  weight: 0.3
  description: 프로젝트가 성공적으로 실행되면 월 매출이 증가하여 전략 지속 가능성을 높일 것이다.
start_date: '2026-01-26'
deadline: '2026-02-07'
---
# KPI Dashboard - 노션 스타일 분석 대시보드

> Project ID: `prj-3pnv6w` | Track: `trk-2` | Status: doing

---

## 목표

KPI API (`/api/kpi/*`)를 활용한 **시계열 그래프 기반** 대시보드 Feature를 dashboard-v2 아키텍처에 맞춰 구현.

### 성공 기준

1. DAU/MAU/Stickiness 시계열 라인 차트로 트렌드 파악
2. 날짜 범위 선택기 (7d/30d/90d)로 기간별 분석
3. 컴팩트 요약 카드로 핵심 지표 한눈에 확인
4. 기존 dashboard-v2 클린 아키텍처 준수 (feature 기반 모듈화)
5. `npm run build` 통과

### 실패 신호

1. 빌드 실패 또는 TypeScript 에러
2. 기존 아키텍처 규칙 위반 (common→feature import 등)

---

## 범위

### In Scope

- KPI Analytics 페이지 (`/kpi` 라우트)
- DAU/MAU/Stickiness 시계열 라인 차트 (recharts)
- 날짜 범위 선택기 (7d/30d/90d)
- KPI 전용 헤더 디자인
- 요약 카드 (컴팩트, 그래프 상단)
- Clean Architecture 구조 적용

### Out of Scope

- Conversion funnel 시각화 (별도 프로젝트)
- User cohort 분석
- Revenue KPI (exec 전용)
- 사용자 여정 상세 페이지
- 환불 분석 대시보드

---

## 기술 설계

### 파일 구조

```
dashboard-v2/src/
├── features/kpi/
│   ├── api.ts                    # KPI API 엔드포인트 래퍼
│   ├── queries.ts                # React Query hooks
│   ├── utils.ts                  # 데이터 변환 함수 (NEW)
│   └── components/
│       ├── KPIPage.tsx           # 페이지 컴포넌트 (REFACTORED)
│       ├── KPIHeader.tsx         # KPI 전용 헤더 + 날짜 선택기 (NEW)
│       ├── KPISummaryCards.tsx   # 컴팩트 요약 카드 (NEW)
│       ├── KPILineChart.tsx      # 시계열 라인 차트 (NEW)
│       └── KPIMetricCard.tsx     # 개별 메트릭 카드
│
├── types/kpi.ts                  # DTO + Chart 타입 정의 (SSOT)
├── queries/keys.ts               # kpiKeys (기존 파일)
└── App.tsx                       # /kpi 라우트
```

### 컴포넌트 구조

| 컴포넌트 | 역할 | 상태 |
| --- | --- | --- |
| `KPIPage` | 메인 페이지, 상태 관리 | DONE |
| `KPIHeader` | 제목, 날짜 선택기 | DONE |
| `KPISummaryCards` | Avg DAU/MAU/Stickiness/Engagement | DONE |
| `KPILineChart` | recharts LineChart 래퍼 | DONE |

### API 엔드포인트

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/kpi/overview` | GET | MAU, Revenue 개요 |
| `/api/kpi/dau` | GET | DAU 시계열 (params: start_date, end_date) |
| `/api/kpi/mau` | GET | MAU 시계열 (params: start_date, end_date) |
| `/api/kpi/stickiness` | GET | Stickiness 계산 |

### 의존성

- 기존 dashboard-v2 아키텍처 (React Query, Tailwind CSS)
- recharts (시계열 차트)
- KPI API 정상 동작 확인됨
- Bearer token 인증 (admin role 또는 kpi:read scope)

---

## 변경 이력

| 날짜 | 변경 | 설명 |
| --- | --- | --- |
| 2026-01-22 | 초기 생성 | 카드 기반 대시보드 계획 |
| 2026-01-26 | 리팩토링 | 시계열 그래프 기반으로 전환 |

---

## Todo

- [x] Types 정의 (`src/types/kpi.ts`)

- [x] Query Keys 추가 (`src/queries/keys.ts`)

- [x] API 래퍼 (`src/features/kpi/api.ts`)

- [x] React Query Hooks (`src/features/kpi/queries.ts`)

- [x] Utils 함수 (`src/features/kpi/utils.ts`)

- [x] KPILineChart 컴포넌트

- [x] KPIHeader 컴포넌트

- [x] KPISummaryCards 컴포넌트

- [x] KPIPage 리팩토링

- [x] 라우트 등록 (`src/App.tsx`)

- [x] `npm run build` 통과 확인

- [ ] 배포 및 실제 데이터 확인

---

## 참고

- [[prj-023]] - Dashboard v2 마이그레이션 (부모 프로젝트)
- [[trk-2]] - Vault System Track
- [[hyp-2-07]] - 효과지표 자동화 가설

---

**Created**: 2026-01-22 **Updated**: 2026-01-26 **Owner**: 김은향