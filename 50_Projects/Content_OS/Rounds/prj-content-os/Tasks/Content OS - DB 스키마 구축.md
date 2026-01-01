---
entity_type: Task
entity_id: "tsk-content-os-08"
entity_name: "Content OS - DB 스키마 구축"
created: 2026-01-02
updated: 2026-01-02
status: doing

# === 계층 ===
parent_id: "prj-content-os"
project_id: "prj-content-os"
aliases: ["tsk-content-os-08"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-02
due: 2026-01-02
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: content-os
repo_path: apps/content-os

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-a"]

# === 분류 ===
tags: ["content-os", "database", "infrastructure"]
priority_flag: high
---

# Content OS - DB 스키마 구축

> Task ID: `tsk-content-os-08` | Project: `prj-content-os` | Status: doing

## 목표

**완료 조건**:
1. 2-DB 구조 설계 및 스키마 정의
2. SQLite DB 파일 생성 및 테이블 구조 구현
3. FastAPI 연동 준비

---

## 상세 내용

### 배경

Content OS MVP의 UI가 완성되었으며, 실제 데이터를 저장하고 조회하기 위한 DB 구축이 필요합니다.
권한 경계를 반영하여 2개의 독립된 DB로 분리합니다.

### 작업 내용

1. **Vault DB 구축** (content-os.db)
2. **Exec KPI DB 구축** (kpi-exec.db)
3. **FastAPI 연동 코드**

---

## 체크리스트

- [ ] Vault DB 스키마 설계
- [ ] Exec KPI DB 스키마 설계
- [ ] SQLite 파일 생성
- [ ] FastAPI 모델 정의
- [ ] API 엔드포인트 연동

---

## Notes

### PRD (Product Requirements Document)

> **Task ID**: `tsk-content-os-08` | **Project**: `prj-content-os` | **Type**: dev

#### 1. 개요

**문제 정의**: Content OS MVP의 4개 대시보드 UI가 완성되었으며, 현재는 더미 데이터로 동작 중. 실제 데이터를 저장/조회하기 위한 영속성 계층(Persistence Layer) 필요.

**핵심 과제**:
- **권한 경계**: 민감 데이터(매출/결제/user_id)는 C-Level 전용 경로에만 저장
- **데이터 분리**: Vault(공유 가능) vs Exec(비공개) 경계 명확화
- **Rollup 원칙**: Vault DB에는 원천 데이터 없이 집계된 요약치만 저장

#### 2. 아키텍처 도식

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Content OS Architecture                             │
├─────────────────────────────────────────────────────────────────────────┤
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                  Next.js Frontend                               │   │
│   │   Opportunity | Video Explorer | Task Pipeline | Retro         │   │
│   └─────────────────────────────┬──────────────────────────────────┘   │
│                                 ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                    FastAPI Backend                               │  │
│   │   ┌─────────────────────┐   ┌─────────────────────┐             │  │
│   │   │  Vault API Layer    │   │  Exec API Layer     │             │  │
│   │   │  (Public)           │   │  (C-Level Only)     │             │  │
│   │   └──────────┬──────────┘   └──────────┬──────────┘             │  │
│   └──────────────┼──────────────────────────┼───────────────────────┘  │
│                  ▼                          ▼                           │
│   ┌─────────────────────────┐  ┌─────────────────────────┐             │
│   │     Vault DB            │  │     Exec KPI DB         │             │
│   │   (content-os.db)       │  │    (kpi-exec.db)        │             │
│   │                         │  │                         │             │
│   │   LOOP_VAULT/.../apps/  │  │   LOOP_EXEC/_data/kpi/  │             │
│   │   content-os/var/sqlite │  │                         │             │
│   │                         │  │   C-Level Only          │             │
│   │   Shared OK             │  │                         │             │
│   └─────────────────────────┘  └─────────────────────────┘             │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 3. Vault DB 스키마 (content-os.db)

**위치**: `LOOP_VAULT/.../apps/content-os/var/sqlite/content-os.db`
(로컬 개발: `apps/content-os/var/sqlite/content-os.db`)

| 테이블 | 목적 | 참조 TypeScript |
|--------|------|-----------------|
| `search_sessions` | 검색 세션 기록 | `types/search.ts` |
| `channels` | 채널 정보 (정규화) | `types/video.ts` |
| `collected` | 수집한 영상 | `types/collection.ts` |
| `collected_tags` | 수집 영상 태그 (M:N) | - |
| `blocked_videos` | 차단된 영상 | `types/collection.ts` |
| `tags` | 콘텐츠 태그 | `lib/types/opportunity.ts` |
| `youtube_metrics` | YouTube 성과 지표 | `types/performance.ts` |
| `opportunities` | 기회 스코어링 결과 | `lib/types/opportunity.ts` |
| `pipeline_tasks` | 콘텐츠 파이프라인 태스크 | `lib/types/task.ts` |
| `kpi_rollup` | KPI 요약치만 (원천X) | - |
| `weekly_summaries` | 주간 요약 | `types/performance.ts` |

#### 4. Exec KPI DB 스키마 (kpi-exec.db)

**위치**: `/Volumes/LOOP_CLevel/vault/loop_exec/_data/kpi/kpi-exec.db`
⚠️ C-Level만 접근 가능 (NAS 권한 분리)

| 테이블 | 목적 | 민감 데이터 |
|--------|------|------------|
| `revenuecat_events` | RevenueCat 이벤트 RAW | subscriber_id, user_id, 정확 금액 |
| `toss_payments` | Toss Payments 결제 RAW | order_id, customer_*, 정확 금액 |
| `bitly_clicks` | Bitly 클릭 RAW | 상세 클릭 로그 |
| `daily_revenue` | 일별 매출 집계 | - |
| `conversion_funnel` | 전환 퍼널 | user-level 데이터 |

#### 5. FastAPI 연동 구조

```
apps/content-os/
├── api/
│   ├── main.py                  # FastAPI app entry
│   ├── config.py                # DB paths, settings
│   ├── database.py              # SQLite connection manager
│   ├── models/                  # Pydantic 모델
│   │   ├── search.py, collection.py, tags.py
│   │   ├── metrics.py, opportunity.py, pipeline.py
│   │   └── summary.py
│   ├── routers/                 # API 라우터
│   │   ├── search.py, collection.py, tags.py
│   │   ├── metrics.py, opportunities.py, pipeline.py
│   │   ├── summary.py
│   │   └── kpi.py              # C-level gated
│   └── services/
│       └── rollup.py           # KPI rollup job
├── var/sqlite/                  # DB 파일 위치
└── scripts/
    └── migrate.py              # 마이그레이션 스크립트
```

#### 6. 마이그레이션 전략

1. **DDL 파일 생성**: `scripts/ddl/vault_schema.sql`, `scripts/ddl/exec_schema.sql`
2. **로컬 개발**: `python scripts/migrate.py --vault-only`
3. **NAS 배포**: `python scripts/migrate.py` (C-level 권한 필요)

#### 7. 체크리스트

**Phase 1: 스키마 구현**
- [ ] `scripts/ddl/vault_schema.sql` 생성
- [ ] `scripts/ddl/exec_schema.sql` 생성
- [ ] `scripts/migrate.py` 구현

**Phase 2: FastAPI 모델**
- [ ] `api/models/*.py` Pydantic 모델 정의
- [ ] `api/database.py` SQLite 연결 매니저

**Phase 3: CRUD 라우터**
- [ ] `api/routers/*.py` 엔드포인트 구현

**Phase 4: 테스트**
- [ ] 로컬 마이그레이션 테스트
- [ ] TypeScript 타입 일관성 검증

---

### Todo
- [ ] DDL 파일 작성
- [ ] 마이그레이션 스크립트 작성
- [ ] FastAPI 모델 정의

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)
-->

---

## 참고 문서

- [[prj-content-os]] - 소속 Project
- [[pgm-content-os]] - 소속 Program

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**:
