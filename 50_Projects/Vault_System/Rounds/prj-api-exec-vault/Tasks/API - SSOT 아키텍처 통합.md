---
entity_type: Task
entity_id: "tsk-018-03"
entity_name: "API - SSOT 아키텍처 통합"
created: 2026-01-06
updated: 2026-01-06
status: done
closed: 2026-01-06

# === 계층 ===
parent_id: "prj-api-exec-vault"
project_id: "prj-api-exec-vault"
aliases: ["tsk-018-03"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-06
due: 2026-01-06
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop-api

# === 분류 ===
tags: ["api", "ssot", "architecture", "exec-vault"]
priority_flag: high
---

# API - SSOT 아키텍처 통합

> Task ID: `tsk-018-03` | Project: `prj-api-exec-vault` | Status: done

## 목표

**완료 조건**:
1. 공통 코드를 `shared/`로 분리 (OAuth, 미들웨어, 유틸리티)
2. exec/api를 public/api와 동일한 SSOT 구조로 재구성
3. KPI Analytics를 exec/api/routers/에 통합
4. OAuth scope 기반 접근 제어 구현

---

## 상세 내용

### 배경

현재 public/api와 exec/api가 별도로 존재하며:
- public/api: LOOP Vault API (팀 공개)
- exec/api: KPI Analytics (Amplitude, RevenueCat)

보안 요구사항:
- exec vault 관련 코드는 exec/에만 있어야 함 (코어팀에게 소스코드 비공개)
- OAuth로 API 응답 차단 가능하지만, 소스코드 자체가 노출되면 안 됨

### 작업 내용

**1. shared/ 공통 코드 분리**
- `shared/auth/` - OAuth, 미들웨어, JWT 검증
- `shared/utils/` - vault_utils, yaml_utils, cache
- `shared/models/` - 공통 Pydantic 모델

**2. exec/api SSOT 구조화**
- constants.py - exec vault 스키마 상수
- routers/ - runway, cashflow, people, kpi
- MCP mount (/mcp)

**3. OAuth scope 기반 접근 제어**
- `mcp:read` - LOOP Vault (public)
- `mcp:exec` - Exec Vault
- `kpi:read` - KPI Analytics

---

## 체크리스트

- [x] shared/ 폴더 생성 및 공통 코드 이동
- [x] exec/api 구조 재설계
- [x] KPI Analytics 통합
- [x] OAuth scope 검증 로직 추가
- [x] 테스트 (import 테스트 완료)

---

## Notes

### PRD (Product Requirements Document)

#### 📊 아키텍처 도식

```
~/dev/loop/
├── public/                    # git repo (팀 공개)
│   ├── shared/               # ✅ 공통 코드 (여기!)
│   │   ├── auth/
│   │   │   ├── middleware.py      # AuthMiddleware (ASGI)
│   │   │   ├── oauth_verify.py    # verify_jwt, log_oauth_access
│   │   │   └── scope_checker.py   # scope 기반 접근 제어
│   │   ├── utils/
│   │   │   └── vault_utils.py     # get_vault_dir, extract_frontmatter
│   │   └── models/
│   │       └── common.py          # HealthResponse 등
│   └── api/                  # LOOP Vault API
│       └── ...
│
└── exec/                      # git repo (C-Level 전용)
    └── api/                  # Exec Vault API (코드 비공개)
        ├── main.py           # FastAPI + MCP mount
        ├── routers/
        │   ├── runway.py
        │   ├── cashflow.py
        │   ├── people.py
        │   └── kpi.py        # KPI Analytics 통합
        ├── services/
        │   ├── kpi_service.py
        │   ├── amplitude_client.py
        │   └── revenuecat_client.py
        └── (public/shared import)
```

#### 📋 구현 범위

1. **public/shared/ 생성** - 보안 무관 공통 코드
2. **exec/api 재구성** - public/api와 동일한 SSOT 구조
3. **KPI Analytics 통합** - exec/api/routers/kpi.py
4. **OAuth scope 추가** - mcp:exec, kpi:read

#### 🔐 OAuth Scope 정의

| Scope | 접근 영역 | 대상 |
|-------|----------|------|
| mcp:read | LOOP Vault (public) | 팀원, 외부 |
| mcp:exec | Exec Vault | C-Level |
| kpi:read | KPI Analytics | C-Level, 분석가 |

#### 📝 Import 방식

exec/api에서 public/shared 참조:
```python
import sys
from pathlib import Path
PUBLIC_PATH = Path(__file__).parent.parent.parent / "public"
sys.path.insert(0, str(PUBLIC_PATH))

from shared.auth.middleware import AuthMiddleware
```

#### 성공 기준

- [x] public/shared/ 폴더 생성
- [x] exec/api 구조 재설계
- [ ] exec/api MCP mount 동작 (향후 과제)
- [x] KPI routers 통합 (기존 routers 유지, AuthMiddleware 추가)
- [x] OAuth scope 검증 (kpi:read scope, 403 반환)
- [ ] public/api import 경로 수정 (기존 코드 호환성 유지)

### 작업 로그

**2026-01-06**:
- `public/shared/` 폴더 구조 생성:
  - `shared/__init__.py` - 모듈 초기화
  - `shared/auth/__init__.py` - 인증 모듈 초기화
  - `shared/auth/middleware.py` - AuthMiddleware (ASGI, SSE 호환)
  - `shared/auth/oauth_verify.py` - JWT 검증, 접근 로깅
  - `shared/auth/scope_checker.py` - OAuth scope 기반 접근 제어
  - `shared/utils/__init__.py` - 유틸리티 모듈 초기화
  - `shared/utils/vault_utils.py` - vault 경로, frontmatter 파싱
  - `shared/models/__init__.py` - 모델 초기화
  - `shared/models/common.py` - HealthResponse, ErrorResponse 등

- `exec/api/main.py` 재구성:
  - public/shared 모듈 import 추가
  - AuthMiddleware 통합 (from shared.auth)
  - KPIScopeMiddleware 추가 (kpi:read scope 검증)
  - HealthResponse 모델 공유
  - OAuth JWT 검증 연동 (lazy loading)

- OAuth Scope 정의:
  - `kpi:read` - KPI Analytics 접근
  - `mcp:exec` - Exec Vault 접근 (기존)
  - admin/exec role bypass 지원

- Import 테스트 완료:
  - `shared.auth` 모듈 정상 import
  - `shared.utils` 모듈 정상 import
  - `shared.models` 모듈 정상 import
  - exec/api에서 shared 모듈 정상 import

---

## 참고 문서

- [[prj-api-exec-vault]] - 소속 Project
- 논의 내용: shared/ 공통 코드 분리 구조

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
