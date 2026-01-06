---
entity_type: Task
entity_id: "tsk-content-os-08"
entity_name: "Content OS - DB 스키마 구축"
created: 2026-01-02
updated: 2026-01-06
closed: 2026-01-06
status: done

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
target_project: loop
repo_path: apps/content-os

# === 3Y 전략 연결 (필수) ===
# === 분류 ===
tags: ["content-os", "database", "infrastructure"]
priority_flag: high
---

# Content OS - DB 스키마 구축

> Task ID: `tsk-content-os-08` | Project: `prj-content-os` | Status: done

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
- **서비스 분리 원칙**: Content OS는 듀얼권한을 직접 운영하지 않음 (아래 상세)

#### 2. 서비스 분리 원칙 (핵심)

> **Content OS 런타임(팀용)은 public만 들고,
> exec DB/민감 API는 별도 exec 전용 파이프라인으로 분리하여
> Content OS가 듀얼권한을 직접 운영하지 않게 한다.**

**왜 이렇게 하나?**

| 기존 구조 (복잡) | 개선 구조 (단순) |
|-----------------|-----------------|
| Content OS가 Vault + Exec 볼륨 동시 마운트 | Content OS는 Vault 볼륨만 마운트 |
| migrate.py가 --vault-only / full 모드 분기 | 배포가 1종으로 수렴 (항상 public 모드) |
| 앱 하나가 듀얼권한 책임 → 배포/운영 복잡 | exec는 별도 서비스/잡만 배포 |
| 실수로 민감 데이터 노출 가능 경로 존재 | exec 볼륨 자체가 없음 → 사고 확률 급감 |
| n8n 호출 대상이 모호 | 수집/민감=exec서비스, UI/회고=Content OS |

**실제로 쉬워지는 포인트:**
1. **배포**: Content OS는 항상 "public 모드"로만 배포
2. **권한**: 컨테이너에 exec 볼륨 없음 → 실수로도 새는 경로 없음
3. **n8n/자동화**: 토큰/스코프 분리가 명확
4. **온보딩**: 개발자가 exec 환경 재현 없이도 UI/회고 대부분 동작

#### 3. 아키텍처 도식 (분리 버전)

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          Content OS (팀용)                                 │
├───────────────────────────────────────────────────────────────────────────┤
│   ┌────────────────────────────────────────────────────────────────┐     │
│   │                  Next.js Frontend                               │     │
│   │   Opportunity | Video Explorer | Task Pipeline | Retro         │     │
│   └─────────────────────────────┬──────────────────────────────────┘     │
│                                 ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │                    FastAPI Backend                               │    │
│   │   ┌─────────────────────────────────────────────────────────┐   │    │
│   │   │  Vault API Layer (Public Only)                          │   │    │
│   │   │  - search, collection, tags, metrics, pipeline, summary │   │    │
│   │   │  - kpi_rollup 읽기 전용 (소비자)                         │   │    │
│   │   └─────────────────────────────┬───────────────────────────┘   │    │
│   └─────────────────────────────────┼───────────────────────────────┘    │
│                                     ▼                                     │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │     Vault DB (content-os.db)                                     │    │
│   │     LOOP_VAULT/.../apps/content-os/var/sqlite                    │    │
│   │     ※ kpi_rollup 테이블 = exec에서 밀어넣은 요약치만            │    │
│   └─────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│                     Exec 파이프라인 (C-Level 전용)                         │
├───────────────────────────────────────────────────────────────────────────┤
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │  Exec Data Pipeline (n8n / 별도 서비스)                         │    │
│   │  - RevenueCat, Toss, Bitly 수집                                  │    │
│   │  - daily_revenue, conversion_funnel 집계                         │    │
│   │  - kpi_rollup → Vault DB로 push                                  │    │
│   └─────────────────────────────┬───────────────────────────────────┘    │
│                                 ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │     Exec KPI DB (kpi-exec.db)                                    │    │
│   │     LOOP_EXEC/_data/kpi/                                         │    │
│   │     C-Level Only (NAS 권한 분리)                                 │    │
│   └─────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────────────┘

                              ▲
                              │ rollup push
                              │ (n8n 스케줄 or 별도 잡)
                              ▼
```

#### 4. Vault DB 스키마 (content-os.db)

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

#### 5. Exec KPI DB 스키마 (kpi-exec.db)

**위치**: `/Volumes/LOOP_CLevel/vault/loop_exec/_data/kpi/kpi-exec.db`
⚠️ C-Level만 접근 가능 (NAS 권한 분리)

| 테이블 | 목적 | 민감 데이터 |
|--------|------|------------|
| `revenuecat_events` | RevenueCat 이벤트 RAW | subscriber_id, user_id, 정확 금액 |
| `toss_payments` | Toss Payments 결제 RAW | order_id, customer_*, 정확 금액 |
| `bitly_clicks` | Bitly 클릭 RAW | 상세 클릭 로그 |
| `daily_revenue` | 일별 매출 집계 | - |
| `conversion_funnel` | 전환 퍼널 | user-level 데이터 |

#### 6. FastAPI 연동 구조 (Content OS)

> Content OS 백엔드는 Vault DB만 접근. Exec DB는 별도 파이프라인에서 처리.

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
│   │   └── kpi_rollup.py       # rollup 읽기 전용 (Exec에서 push된 데이터)
│   └── services/               # (없음 - 수집/집계는 Exec 파이프라인 담당)
├── var/sqlite/                  # DB 파일 위치 (content-os.db만)
└── scripts/
    └── migrate.py              # Vault DB 마이그레이션만
```

#### 7. Exec 파이프라인 구조 (별도 서비스)

> n8n 워크플로우 또는 별도 Python 서비스로 구현

```
exec-pipeline/                   # 또는 n8n 워크플로우
├── collectors/
│   ├── revenuecat.py           # RevenueCat API 수집
│   ├── toss.py                 # Toss Payments 수집
│   └── bitly.py                # Bitly 클릭 수집
├── aggregators/
│   ├── daily_revenue.py        # 일별 매출 집계
│   └── conversion_funnel.py    # 전환 퍼널 집계
├── sync/
│   └── rollup_pusher.py        # kpi_rollup → Vault DB push
└── scripts/
    └── migrate_exec.py         # Exec DB 마이그레이션 (C-level only)
```

**데이터 흐름:**
1. `collectors/*` → Exec DB에 원천 데이터 저장
2. `aggregators/*` → 집계하여 Exec DB 요약 테이블 저장
3. `rollup_pusher.py` → 비민감 요약치만 Vault DB `kpi_rollup` 테이블로 push

#### 8. 마이그레이션 전략

| 대상 | 명령어 | 권한 |
|-----|-------|-----|
| Vault DB | `python scripts/migrate.py` | 팀 전체 |
| Exec DB | `python exec-pipeline/scripts/migrate_exec.py` | C-Level only |

**Content OS 배포 시**: Vault 마이그레이션만 실행 (exec 환경 불필요)
**Exec 파이프라인 배포 시**: C-Level 권한으로 별도 실행

#### 9. 체크리스트

**Phase 1: Content OS (Vault DB) 스키마**
- [ ] `scripts/ddl/vault_schema.sql` 생성
- [ ] `scripts/migrate.py` 구현 (Vault only)
- [ ] 로컬 마이그레이션 테스트

**Phase 2: Content OS FastAPI**
- [ ] `api/models/*.py` Pydantic 모델 정의
- [ ] `api/database.py` SQLite 연결 매니저
- [ ] `api/routers/*.py` 엔드포인트 구현
- [ ] `api/routers/kpi_rollup.py` 읽기 전용 엔드포인트

**Phase 3: Exec 파이프라인 (별도 서비스)**
- [ ] `exec-pipeline/scripts/migrate_exec.py` 구현 (C-level)
- [ ] `exec-pipeline/collectors/*` 수집 모듈
- [ ] `exec-pipeline/sync/rollup_pusher.py` rollup push 구현

**Phase 4: 통합 테스트**
- [ ] Content OS 단독 배포 테스트 (exec 환경 없이)
- [ ] rollup push 테스트 (Exec → Vault)

---

### Todo
- [ ] DDL 파일 작성
- [ ] 마이그레이션 스크립트 작성
- [ ] FastAPI 모델 정의

### 작업 로그

#### 2026-01-06 (완료)
**개요**: Task 완료 - Firebase 전환 결정으로 SQLite 설계 문서화 완료

**결과**:
- SQLite 2-DB 구조 (Vault DB + Exec KPI DB) 설계 완료
- 서비스 분리 원칙 정립 (Content OS는 public만, exec는 별도 파이프라인)
- PRD에 상세 스키마, 마이그레이션 전략, API 연동 구조 문서화
- 실제 구현은 Firebase (Firestore)로 전환 예정

**최종 상태**: done
**다음 단계**: Firebase 스키마 구축 진행

---

## 참고 문서

- [[prj-content-os]] - 소속 Project
- [[pgm-content-os]] - 소속 Program

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**:
