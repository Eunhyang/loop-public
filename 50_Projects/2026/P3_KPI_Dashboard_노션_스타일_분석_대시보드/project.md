---
entity_type: Project
entity_id: prj-3pnv6w
entity_name: KPI Dashboard - 노션 스타일 분석 대시보드
created: '2026-01-22'
updated: '2026-01-22'
status: planning
owner: 김은향
parent_id: trk-2
program_id: pgm-vault-system
conditions_3y: []
validates:
- hyp-2-07
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
  rationale: null
---

# KPI Dashboard - 노션 스타일 분석 대시보드

> Project ID: `prj-3pnv6w` | Track: `trk-2` | Status: planning

---

## 목표

KPI API (`/api/kpi/*`)를 활용한 노션 스타일 대시보드 Feature를 dashboard-v2 아키텍처에 맞춰 구현.

### 성공 기준
1. MAU, Revenue, Conversion 핵심 지표를 카드 형태로 한눈에 파악
2. 노션 스타일 깔끔한 UI (미니멀 디자인, 카드 레이아웃)
3. 기존 dashboard-v2 클린 아키텍처 준수 (feature 기반 모듈화)
4. `npm run build` 통과

### 실패 신호
1. 빌드 실패 또는 TypeScript 에러
2. 기존 아키텍처 규칙 위반 (common→feature import 등)

---

## 범위

### In Scope
- KPI Overview 페이지 (`/kpi` 라우트)
- MAU/Revenue/Conversion 메트릭 카드
- 날짜 필터 (선택사항)

### Out of Scope
- KPI 트렌드 차트 (차트 라이브러리 선택 필요, 추후 작업)
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
│   └── components/
│       ├── KPIPage.tsx           # 페이지 컴포넌트
│       ├── KPIOverviewCard.tsx   # 개요 카드
│       ├── KPIMetricCard.tsx     # 개별 메트릭 카드
│       └── KPIDateFilter.tsx     # 날짜 필터
│
├── types/kpi.ts                  # DTO 타입 정의 (SSOT)
├── queries/keys.ts               # kpiKeys 추가 (기존 파일)
└── App.tsx                       # /kpi 라우트 추가
```

### API 엔드포인트

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/kpi/overview` | GET | MAU, Revenue 개요 |
| `/api/kpi/mau` | GET | MAU 상세 (params: start_date, end_date) |
| `/api/kpi/conversion` | GET | Conversion 상세 |

### 의존성
- 기존 dashboard-v2 아키텍처 (React Query, Tailwind CSS)
- KPI API 정상 동작 확인됨
- Bearer token 인증 (admin role 또는 kpi:read scope)

---

## 수정 대상 파일

| 파일 | 작업 | 설명 |
|------|------|------|
| `src/types/kpi.ts` | **신규** | KPI DTO 타입 정의 |
| `src/types/index.ts` | 수정 | kpi.ts export 추가 |
| `src/queries/keys.ts` | 수정 | kpi 관련 queryKeys 추가 |
| `src/features/kpi/api.ts` | **신규** | API 엔드포인트 래퍼 |
| `src/features/kpi/queries.ts` | **신규** | React Query hooks |
| `src/features/kpi/components/*.tsx` | **신규** | UI 컴포넌트들 |
| `src/App.tsx` | 수정 | /kpi 라우트 추가 |

---

## Todo

- [ ] Types 정의 (`src/types/kpi.ts`)
- [ ] Query Keys 추가 (`src/queries/keys.ts`)
- [ ] API 래퍼 (`src/features/kpi/api.ts`)
- [ ] React Query Hooks (`src/features/kpi/queries.ts`)
- [ ] KPIMetricCard 컴포넌트
- [ ] KPIPage 컴포넌트
- [ ] 라우트 등록 (`src/App.tsx`)
- [ ] `npm run build` 통과 확인

---

## 참고

- [[prj-023]] - Dashboard v2 마이그레이션 (부모 프로젝트)
- [[trk-2]] - Vault System Track
- [[hyp-2-07]] - 효과지표 자동화 가설

---

**Created**: 2026-01-22
**Owner**: 김은향
