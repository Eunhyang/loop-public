---
entity_type: Project
entity_id: prj-waoz74
entity_name: Content OS - Dashboard v2
created: 2026-01-14
updated: 2026-01-14
status: todo
parent_id: trk-3
aliases:
  - prj-waoz74
  - Content OS - Dashboard v2
program_id: pgm-content-os
cycle: 2026-01
outgoing_relations: []
validates:
  - hyp-3-01
validated_by: []
primary_hypothesis_id: hyp-3-01
owner: 김은향
budget: null
deadline: null
hypothesis_text: Dashboard v2를 구축하면 Content OS 기능을 Vite 기반의 경량 대시보드로 마이그레이션할 수 있다
experiments: []
tier: enabling
impact_magnitude: high
confidence: 0.6
condition_contributes:
  - to: cond-a
    weight: 0.6
    description: Content OS 플랫폼 고도화를 통한 운영 효율 증대
track_contributes: []
expected_impact:
  statement: Dashboard v2 마이그레이션이 완료되면 Content OS의 모든 기능이 Vite 기반의 경량, 빠른 인터페이스로 통합되어 사용자 경험이 개선된다
  metric: 기능_마이그레이션_완료도
  target: 15개 태스크 완료 (100%)
realized_impact:
  verdict: null
  outcome: null
  evidence_links: []
  decided: null
  window_id: null
  time_range: null
  metrics_snapshot: {}
conditions_3y:
  - cond-a
tags:
  - content-os
  - dashboard
  - vite
  - frontend
  - migration
priority_flag: high
---

# Content OS - Dashboard v2

> Project ID: `prj-waoz74` | Track: `trk-3` | Program: `pgm-content-os` | Status: todo

---

## 프로젝트 개요

Content OS의 프론트엔드를 Next.js에서 Vite 기반의 경량 대시보드(dashboard-v2)로 마이그레이션합니다.
기존 Content OS 애플리케이션의 4개 화면(Opportunity, Video Explorer, Task Pipeline, Retro)을 새로운 Vite 스택으로 재구현하고,
LOOP Vault API와의 통합을 완료합니다.

---

## 핵심 목표

### 성공 기준

1. **15개 태스크 완료**: 모든 마이그레이션 태스크 구현 및 테스트 완료
2. **API 통합**: Content OS 백엔드 API와 LOOP Vault API의 전체 통합
3. **기능 패리티**: 기존 Next.js 버전의 모든 주요 기능이 새 대시보드에서 작동
4. **성능 개선**: Vite 기반으로 빌드 시간 >80% 감소, 로딩 시간 개선

### 실패 신호

1. 15개 태스크 중 3개 이상 미완료
2. API 통합 실패로 기능 작동 불가
3. 기존 기능 손실이 발생

---

## 배경

### 왜 대시보드 v2인가?

- **기존 문제**: Next.js 기반 Content OS는 빌드 시간이 길고, 구조가 복잡함
- **새로운 접근**: Vite 기반의 경량 대시보드로 개발 경험 및 성능 개선
- **통합 전략**: LOOP Vault API의 새로운 MCP 엔드포인트와 통합

### 선행 조건

- LOOP Vault MCP API 구축 완료
- OAuth 2.0 인증 시스템 완성
- Content OS 백엔드 API 준비 완료

---

## 기술 스펙

### 프론트엔드 스택

- **Framework**: Vite 6.1.5 + React 19.2.3 + TypeScript 5
- **UI**: ShadCN UI (Radix UI), Tailwind CSS 4
- **상태관리**: TanStack React Query 5 + Zustand
- **차트**: Recharts 3
- **기타**: dnd-kit (드래그앤드롭), Sonner (토스트)

### 백엔드 통합

- **API**: LOOP Vault MCP (`/api/mcp/*`)
- **인증**: OAuth 2.0 (RS256 + PKCE)
- **데이터소스**:
  - Content OS Firebase (독립 DB)
  - LOOP Vault (Task, Project, Evidence)

### 페이지 구조

- `/` → 홈 (리다이렉트)
- `/login` → OAuth 로그인
- `/opportunity` → 콘텐츠 기회 발견 대시보드
- `/explorer` → 콘텐츠 라이브러리 탐색 및 검색
- `/pipeline` → 제작 파이프라인 (칸반보드)
- `/retro` → 성과 분석 및 회고
- `/api/proxy/*` → LOOP API 프록시

### 프로젝트 구조

```
/Users/gim-eunhyang/dev/loop/public/dashboard-v2/
├── src/
│   ├── pages/              # 페이지 컴포넌트
│   │   ├── opportunity.tsx
│   │   ├── explorer.tsx
│   │   ├── pipeline.tsx
│   │   └── retro.tsx
│   ├── components/         # 공통 컴포넌트
│   │   ├── Navbar/
│   │   ├── Sidebar/
│   │   └── Cards/
│   ├── hooks/              # 커스텀 훅
│   │   ├── useContentOS.ts
│   │   └── useVault.ts
│   ├── services/           # API 서비스
│   │   ├── contentOsApi.ts
│   │   └── vaultApi.ts
│   ├── types/              # TypeScript 타입
│   ├── App.tsx
│   └── main.tsx
├── vite.config.ts
└── package.json
```

---

## 마이그레이션 계획

### 총 15개 태스크

**Phase 1: 기초 및 API (Task 1-7)**
- [x] Task 1: Content OS 인벤토리 맵핑 + 라이브러리 분석
- [x] Task 2: 라우팅 및 네비게이션 통합
- [x] Task 3: API 마이그레이션 스펙 작성
- [x] Task 4: OAuth 인증 시스템 Vite 이전
- [x] Task 5: YouTube Analytics/Search API 마이그레이션
- [x] Task 6: Content OS 데이터 API 마이그레이션
- [x] Task 7: Dashboard v2 Scaffold 구성

**Phase 2: 프론트엔드 UI 구현 (Task 8-13)**
- [ ] Task 8: Vite에서 OAuth 인증 플로우 구현
- [ ] Task 9: Opportunity 대시보드 UI 마이그레이션
- [ ] Task 10: Video Explorer UI 마이그레이션
- [ ] Task 11: Task Pipeline 칸반 UI 마이그레이션
- [ ] Task 12: Retro (회고) 대시보드 UI 마이그레이션
- [ ] Task 13: Performance 대시보드 최적화

**Phase 3: 통합 및 배포 (Task 14-15)**
- [ ] Task 14: SSOT 빌드 안정화 및 데이터 동기화
- [ ] Task 15: Next.js 앱 레거시 처리 및 deprecation

---

## 실행 전략

### 마이그레이션 원칙

1. **SSOT**: LOOP Vault를 단일 진실 공급원으로 유지
2. **단계적 통합**: 각 기능을 독립적으로 마이그레이션 후 통합
3. **병렬 운영**: 기존 Next.js와 새 Vite 버전을 병렬로 유지하다가 전환
4. **테스트 우선**: 각 페이지/API 통합 후 자동화 테스트 작성

### 개발 환경

```bash
# 설치
cd /Users/gim-eunhyang/dev/loop/public/dashboard-v2
pnpm install

# 개발 서버 (포트 5173)
pnpm dev

# 빌드
pnpm build

# 미리보기
pnpm preview

# 타입 검사
pnpm type-check

# 린트
pnpm lint
```

---

## 주요 기능 정의

### 1. Opportunity 대시보드
- 키워드별 FinalScore 시각화
- "왜 지금?" 추천 이유 표시
- 추천 콘텐츠 번들

### 2. Video Explorer
- 검색 및 필터링
- 테이블 기반 영상 라이브러리
- 메타데이터 표시 (조회수, CTR, 평가)

### 3. Task Pipeline
- 4단계 칸반 (Draft → Approved → Published → Reviewed)
- 드래그앤드롭으로 상태 변경
- Evidence 연계

### 4. Retro (회고) 대시보드
- A/B 학습 카드
- Evidence 자동 수집 및 분류
- 가설 연결

---

## 의존성 및 블로커

| 항목 | 상태 | 설명 |
|------|------|------|
| LOOP Vault MCP API | ✅ 완성 | `/api/mcp/*` 엔드포인트 준비 완료 |
| Content OS 백엔드 API | ✅ 완성 | Firebase + REST API 준비 |
| OAuth 인증 | ✅ 완성 | loop-auth 컨테이너 운영 중 |
| Vite 스택 | ✅ 준비 | package.json 완성 |

---

## 성과 지표

### Expected Impact
- **빌드 시간**: 현재 ~40초 → 목표 ~5초 (80% 개선)
- **개발 편의성**: HMR 적용으로 개발 생산성 20% 개선
- **유지보수성**: 15개 태스크 완료로 마이그레이션 100% 완료

### Realized Impact (사후)
- 실제 사용자 만족도 (1-5점)
- 주간 운영 시간 절감 (시간)
- 기능 버그 발생률 감소 (%)

---

## 리스크 및 대응

| 리스크 | 확률 | 영향 | 대응책 |
|--------|------|------|--------|
| API 통합 지연 | 중간 | 높음 | Mock API 우선 구현 후 실제 API 통합 |
| 성능 이슈 | 낮음 | 중간 | Lighthouse 점수 >90 목표, 번들 크기 분석 |
| 사용자 경험 차이 | 중간 | 중간 | 기존 앱과 병렬 운영, 사용자 피드백 수집 |

---

## 참고 문서

- `_PROGRAM.md` - Content OS 프로그램 정의
- `prj-content-os` - MVP 프로젝트 (현재 운영 중)
- `trk-3` - Content Track
- `cond-a` - PMF 조건

**실행 계획 상세**:

Updated all 15 task specs to be implementation‑ready, with explicit source/target file lists, endpoint details, behavior notes, step‑by‑step checklists, acceptance criteria, and validation steps. Each file now starts with a VERY IMPORTANT - READ FIRST block pointing to `/Users/gim-eunhyang/dev/loop/.agent/plan/prd-techspec-merge-content-os-into-dashboard-v2.md`.

Key files:

- `/Users/gim-eunhyang/dev/loop/.agent/plan/task-01-content-os-inventory-map.md`
- `/Users/gim-eunhyang/dev/loop/.agent/plan/task-02-routing-nav-integration.md`
- `/Users/gim-eunhyang/dev/loop/.agent/plan/task-03-api-migration-spec.md`
- `/Users/gim-eunhyang/dev/loop/.agent/plan/task-04-api-auth-oauth-move.md`
- `/Users/gim-eunhyang/dev/loop/.agent/plan/task-05-api-youtube-search-analytics.md`
- `/Users/gim-eunhyang/dev/loop/.agent/plan/task-06-api-content-data.md`
- `/Users/gim-eunhyang/dev/loop/.agent/plan/task-07-dashboard-v2-scaffold.md`
- `/Users/gim-eunhyang/dev/loop/.agent/plan/task-08-auth-flow-in-vite.md`
- `/Users/gim-eunhyang/dev/loop/.agent/plan/task-09-migrate-opportunity-ui.md`
- `/Users/gim-eunhyang/dev/loop/.agent/plan/task-10-migrate-explorer-ui.md`
- `/Users/gim-eunhyang/dev/loop/.agent/plan/task-11-migrate-pipeline-ui.md`
- `/Users/gim-eunhyang/dev/loop/.agent/plan/task-12-migrate-retro-ui.md`
- `/Users/gim-eunhyang/dev/loop/.agent/plan/task-13-migrate-performance-ui.md`
- `/Users/gim-eunhyang/dev/loop/.agent/plan/task-14-stabilize-ssot-build.md`
- `/Users/gim-eunhyang/dev/loop/.agent/plan/task-15-deprecate-next-app.md`

---

**Created**: 2026-01-14
**Owner**: 김은향
