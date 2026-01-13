---
entity_type: Project
entity_id: prj-content-os
entity_name: Content OS - MVP 개발
created: 2025-12-31
updated: '2026-01-14'
status: doing
parent_id: trk-3
aliases:
- prj-content-os
program_id: pgm-content-os
cycle: 2025-12
outgoing_relations: []
validates:
- hyp-3-01
validated_by: []
primary_hypothesis_id: hyp-3-01
owner: 김은향
budget: null
deadline: null
hypothesis_text: Content OS를 구축하면 콘텐츠 기획 시간이 50% 감소하고, Evidence 기반 학습이 축적된다
experiments: []
tier: enabling
impact_magnitude: high
confidence: 0.7
condition_contributes:
- to: cond-a
  weight: 0.8
  description: PMF 검증을 위한 콘텐츠 파이프라인 자동화
track_contributes: []
expected_impact:
  statement: Content OS MVP가 완성되면 콘텐츠 기획-회고 사이클이 자동화되어 주간 회의 준비 시간이 50% 감소한다
  metric: 기획_준비_시간
  target: -50%
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
- mvp
- infrastructure
- automation
priority_flag: high
---
# Content OS - MVP 개발

> Project ID: `prj-content-os` | Track: `trk-3` | Program: `pgm-content-os` | Status: active

---

## Project 가설

**"Content OS를 구축하면 콘텐츠 기획 시간이 50% 감소하고, Evidence 기반 학습이 축적된다"**

---

## 목표

### 성공 기준

1. 4개 대시보드 UI MVP 완성 (Opportunity, Video Explorer, Task Pipeline, Retro)
2. 사용자 승인 후 실제 기능 구현 진행
3. 주간 콘텐츠 회의에서 실제 사용

### 실패 신호

1. UI가 실제 워크플로우와 맞지 않음
2. 사용자가 기존 방식 선호

---

## 배경

### 왜 이 프로젝트인가?

- 현재 콘텐츠 기획이 수동으로 진행됨
- 시장 신호 수집 → 태스크 생성 → 회고가 분리되어 있음
- Evidence가 구조화되지 않아 학습이 축적되지 않음

### 선행 조건

- LOOP Vault 스키마 (v5.3) 확정
- Evidence 품질 메타 필드 정의 완료

---

## 실행 계획

### Phase 1: UI MVP (현재)

- [x] 프로젝트 초기 세팅

- [ ] Opportunity 대시보드 UI

- [ ] Video Explorer UI

- [ ] Task Pipeline UI

- [ ] 회고 대시보드 UI

### Phase 2: 실제 구현 (승인 후)

- [ ] Signal 수집 API

- [ ] YouTube Analytics 연동

- [ ] Vault Task 연동

- [ ] Evidence 자동화

---

## Tasks

| ID | Name | Assignee | Status | Due |
| --- | --- | --- | --- | --- |
| tsk-content-os-01 | Content OS - 프로젝트 초기 세팅 | 김은향 | doing |  |
| tsk-content-os-02 | Content OS - Opportunity 대시보드 UI | 김은향 | todo |  |
| tsk-content-os-03 | Content OS - Video Explorer UI | 김은향 | todo |  |
| tsk-content-os-04 | Content OS - Task Pipeline UI | 김은향 | todo |  |
| tsk-content-os-05 | Content OS - 회고 대시보드 UI | 김은향 | todo |  |
| tsk-content-os-13 | ContentOS - Firebase 스키마 설계 | 김은향 | done | 2026-01-06 |
| tsk-022-03 | ContentOS - Firebase 스키마 보완 패치 | 김은향 | done | 2026-01-06 |
| tsk-022-15 | ContentOS - Firebase Rules/Indexes 배포 | 김은향 | done | 2026-01-07 |
| tsk-022-16 | ContentOS - Firebase DB 통합 | 김은향 | doing | 2026-01-07 |
| tsk-0000os-1767981542605 | ContentOS - Performance 상태 표시 개선 | 김은향 | doing | 2026-01-10 |
| tsk-content-os-14 | ContentOS - YouTube Analytics 전체 메트릭 수집 | 김은향 | doing | 2026-01-10 |
| tsk-content-os-15 | Content OS - YouTube Studio 스냅샷 시스템 | 김은향 | todo |  |

---

## 관련 문서

- \[\[pgm-content-os\]\] - 소속 Program
- \[\[trk-3\]\] - 소속 Track (Content)
- \[\[cond-a\]\] - 기여 Condition (PMF)

---

## Notes

### PRD (Product Requirements Document)

**문제 정의**: 콘텐츠 기획/실행/회고가 분리되어 있어 학습이 축적되지 않음

**목표**: 시장 신호 + 우리 채널 Analytics를 결합한 콘텐츠 태스크 자동 생성 시스템

**핵심 요구사항**:

1. Opportunity 대시보드: 키워드/FinalScore/"왜 지금?" 표시
2. Video Explorer: 후보 영상 테이블 (Viewtrap 유사)
3. Task Pipeline: 칸반 보드 (Draft → Approved → Published → Reviewed)
4. 회고 대시보드: A/B 리포트 + 학습 카드

**기술 스펙**:

**프론트엔드**:

- Framework: Next.js 16.1.1 (App Router) + React 19.2.3 + TypeScript 5
- UI: ShadCN UI (Radix UI), Tailwind CSS 4, Lucide React, next-themes
- 상태관리: TanStack React Query 5
- 차트: Recharts 3
- 기타: dnd-kit (드래그앤드롭), Sonner (토스트)

**백엔드**:

- FastAPI (독립 DB)
- Integration: LOOP Vault API

**프로젝트 위치**:

- `/Users/gim-eunhyang/dev/loop/public/apps/content-os/`

**페이지 구조**:

- `/` → 홈 (리다이렉트)
- `/login` → 로그인
- `/opportunity` → 콘텐츠 기회 발견
- `/explorer` → 콘텐츠 라이브러리 탐색
- `/pipeline` → 제작 파이프라인 (칸반)
- `/retro` → 성과 분석 및 회고
- `/performance` → 퍼포먼스 대시보드
- `/api` → API 라우트

**실행 방법**:

```bash
cd /Users/gim-eunhyang/dev/loop/public/apps/content-os
pnpm dev    # 개발 서버 (포트 3000)
pnpm build  # 프로덕션 빌드
pnpm start  # 프로덕션 실행
```

**제약 조건**:

- MVP 단계: UI 목업 + 더미 데이터만
- 실제 구현은 사용자 승인 후

**성공 지표**:

- 주간 기획 준비 시간 -50%
- 태스크 초안 → 승인 전환율 &gt;60%

---

**Created**: 2025-12-31 **Owner**: 김은향