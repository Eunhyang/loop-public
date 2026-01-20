---
entity_type: Task
entity_id: tsk-018-03
entity_name: API - SSOT 아키텍처 통합
created: 2026-01-06
updated: '2026-01-10'
status: done
closed: 2026-01-06
parent_id: prj-api-exec-vault
project_id: prj-api-exec-vault
aliases:
- tsk-018-03
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
start_date: 2026-01-06
due: 2026-01-06
priority: high
estimated_hours: null
actual_hours: null
type: dev
target_project: loop-api
tags:
- api
- ssot
- architecture
- exec-vault
priority_flag: high
notes: "# API - SSOT 아키텍처 통합\n\n> Task ID: `tsk-018-03` | Project: `prj-api-exec-vault`\
  \ | Status: done\n\n## 목표\n\n**완료 조건**:\n\n1. 공통 코드를 `shared/`로 분리 (OAuth, 미들웨어,\
  \ 유틸리티)\n2. exec/api를 public/api와 동일한 SSOT 구조로 재구성\n3. KPI Analytics를 exec/api/routers/에\
  \ 통합\n4. OAuth scope 기반 접근 제어 구현\n\n---\n\n## 상세 내용\n\n### 배경\n\n현재 public/api와\
  \ exec/api가 별도로 존재하며:\n\n- public/api: LOOP Vault API (팀 공개)\n- exec/api: KPI Analytics\
  \ (Amplitude, RevenueCat)\n\n보안 요구사항:\n\n- exec vault 관련 코드는 exec/에만 있어야 함 (코어팀에게\
  \ 소스코드 비공개)\n- OAuth로 API 응답 차단 가능하지만, 소스코드 자체가 노출되면 안 됨\n\n### 작업 내용\n\n**1. shared/\
  \ 공통 코드 분리**\n\n- `shared/auth/` - OAuth, 미들웨어, JWT 검증\n- `shared/utils/` - vault_utils,\
  \ yaml_utils, cache\n- `shared/models/` - 공통 Pydantic 모델\n\n**2. exec/api SSOT 구조화**\n\
  \n- constants.py - exec vault 스키마 상수\n- routers/ - runway, cashflow, people, kpi\n\
  - MCP mount (/mcp)\n\n**3. OAuth scope 기반 접근 제어**\n\n- `mcp:read` - LOOP Vault (public)\n\
  - `mcp:exec` - Exec Vault\n- `kpi:read` - KPI Analytics\n\n---\n\n## 체크리스트\n\n-\
  \ [x] shared/ 폴더 생성 및 공통 코드 이동\n\n- [x] exec/api 구조 재설계\n\n- [x] KPI Analytics 통합\n\
  \n- [x] OAuth scope 검증 로직 추가\n\n- [x] 테스트 (import 테스트 완료)\n\n---\n\n## Notes\n\n\
  ### PRD (Product Requirements Document)\n\n\U0001F4CA 아키텍처 도식\n\n```\n~/dev/loop/\n\
  ├── public/                    # git repo (팀 공개)\n│   ├── shared/              \
  \ # ✅ 공통 코드 (여기!)\n│   │   ├── auth/\n│   │   │   ├── middleware.py      # AuthMiddleware\
  \ (ASGI)\n│   │   │   ├── oauth_verify.py    # verify_jwt, log_oauth_access\n│ \
  \  │   │   └── scope_checker.py   # scope 기반 접근 제어\n│   │   ├── utils/\n│   │  \
  \ │   └── vault_utils.py     # get_vault_dir, extract_frontmatter\n│   │   └── models/\n\
  │   │       └── common.py          # HealthResponse 등\n│   └── api/            \
  \      # LOOP Vault API\n│       └── ...\n│\n└── exec/                      # git\
  \ repo (C-Level 전용)\n    └── api/                  # Exec Vault API (코드 비공개)\n \
  \       ├── main.py           # FastAPI + MCP mount\n        ├── routers/\n    \
  \    │   ├── runway.py\n        │   ├── cashflow.py\n        │   ├── people.py\n\
  \        │   └── kpi.py        # KPI Analytics 통합\n        ├── services/\n     \
  \   │   ├── kpi_service.py\n        │   ├── amplitude_client.py\n        │   └──\
  \ revenuecat_client.py\n        └── (public/shared import)\n```\n\n\U0001F4CB 구현\
  \ 범위\n\n1. **public/shared/ 생성** - 보안 무관 공통 코드\n2. **exec/api 재구성** - public/api와\
  \ 동일한 SSOT 구조\n3. **KPI Analytics 통합** - exec/api/routers/kpi.py\n4. **OAuth scope\
  \ 추가** - mcp:exec, kpi:read\n\n\U0001F510 OAuth Scope 정의\n\n| Scope | 접근 영역 | 대상\
  \ |\n| --- | --- | --- |\n| mcp:read | LOOP Vault (public) | 팀원, 외부 |\n| mcp:exec\
  \ | Exec Vault | C-Level |\n| kpi:read | KPI Analytics | C-Level, 분석가 |\n\n\U0001F4DD\
  \ Import 방식\n\nexec/api에서 public/shared 참조:\n\n```python\nimport sys\nfrom pathlib\
  \ import Path\nPUBLIC_PATH = Path(__file__).parent.parent.parent / \"public\"\n\
  sys.path.insert(0, str(PUBLIC_PATH))\n\nfrom shared.auth.middleware import AuthMiddleware\n\
  ```\n\n성공 기준\n\n- [x] public/shared/ 폴더 생성\n\n- [x] exec/api 구조 재설계\n\n- [ ] exec/api\
  \ MCP mount 동작 (향후 과제)\n\n- [x] KPI routers 통합 (기존 routers 유지, AuthMiddleware 추가)\n\
  \n- [x] OAuth scope 검증 (kpi:read scope, 403 반환)\n\n- [ ] public/api import 경로 수정\
  \ (기존 코드 호환성 유지)\n\n### 작업 로그\n\n2026-01-06 14:30\n\n**개요**: public/shared/ 모듈을\
  \ 생성하여 public/api와 exec/api에서 공통으로 사용할 수 있는 인증, 유틸리티, 모델 코드를 분리했습니다. OAuth scope\
  \ 기반 접근 제어를 구현하여 mcp:exec, kpi:read scope로 권한을 관리합니다.\n\n**변경사항**:\n\n- 개발: public/shared/\
  \ 모듈 (9개 파일, 791줄)\n- 개발: OAuth scope 정의 (mcp:read, mcp:exec, kpi:read)\n- 수정: exec/api/main.py에\
  \ shared 모듈 import 연동\n\n**파일 변경**:\n\n- `public/shared/__init__.py` - 모듈 초기화\n\
  - `public/shared/auth/middleware.py` - AuthMiddleware (ASGI, SSE 호환)\n- `public/shared/auth/oauth_verify.py`\
  \ - JWT 검증, 접근 로깅\n- `public/shared/auth/scope_checker.py` - OAuth scope 기반 접근 제어\n\
  - `public/shared/utils/vault_utils.py` - vault 경로, frontmatter 파싱\n- `public/shared/models/common.py`\
  \ - HealthResponse, ErrorResponse\n\n**결과**: ✅ Import 테스트 통과 (shared.auth, shared.utils,\
  \ shared.models 모두 정상)\n\n**다음 단계**:\n\n- [x] exec/api MCP mount 구현 (tsk-018-04)\n\
  \n- [x] public/api import 경로 수정 (tsk-018-05)\n\n---\n\n**2026-01-06 (상세)**:\n\n\
  - `public/shared/` 폴더 구조 생성:\n\n  - `shared/__init__.py` - 모듈 초기화\n  - `shared/auth/__init__.py`\
  \ - 인증 모듈 초기화\n  - `shared/auth/middleware.py` - AuthMiddleware (ASGI, SSE 호환)\n\
  \  - `shared/auth/oauth_verify.py` - JWT 검증, 접근 로깅\n  - `shared/auth/scope_checker.py`\
  \ - OAuth scope 기반 접근 제어\n  - `shared/utils/__init__.py` - 유틸리티 모듈 초기화\n  - `shared/utils/vault_utils.py`\
  \ - vault 경로, frontmatter 파싱\n  - `shared/models/__init__.py` - 모델 초기화\n  - `shared/models/common.py`\
  \ - HealthResponse, ErrorResponse 등\n\n- `exec/api/main.py` 재구성:\n\n  - public/shared\
  \ 모듈 import 추가\n  - AuthMiddleware 통합 (from shared.auth)\n  - KPIScopeMiddleware\
  \ 추가 (kpi:read scope 검증)\n  - HealthResponse 모델 공유\n  - OAuth JWT 검증 연동 (lazy loading)\n\
  \n- OAuth Scope 정의:\n\n  - `kpi:read` - KPI Analytics 접근\n  - `mcp:exec` - Exec\
  \ Vault 접근 (기존)\n  - admin/exec role bypass 지원\n\n- Import 테스트 완료:\n\n  - `shared.auth`\
  \ 모듈 정상 import\n  - `shared.utils` 모듈 정상 import\n  - `shared.models` 모듈 정상 import\n\
  \  - exec/api에서 shared 모듈 정상 import\n\n---\n\n## 참고 문서\n\n- \\[\\[prj-api-exec-vault\\\
  ]\\] - 소속 Project\n- 논의 내용: shared/ 공통 코드 분리 구조\n\n---\n\n**Created**: 2026-01-06\
  \ **Assignee**: 김은향 **Due**: 2026-01-06"
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

#### 2026-01-06 14:30
**개요**: public/shared/ 모듈을 생성하여 public/api와 exec/api에서 공통으로 사용할 수 있는 인증, 유틸리티, 모델 코드를 분리했습니다. OAuth scope 기반 접근 제어를 구현하여 mcp:exec, kpi:read scope로 권한을 관리합니다.

**변경사항**:
- 개발: public/shared/ 모듈 (9개 파일, 791줄)
- 개발: OAuth scope 정의 (mcp:read, mcp:exec, kpi:read)
- 수정: exec/api/main.py에 shared 모듈 import 연동

**파일 변경**:
- `public/shared/__init__.py` - 모듈 초기화
- `public/shared/auth/middleware.py` - AuthMiddleware (ASGI, SSE 호환)
- `public/shared/auth/oauth_verify.py` - JWT 검증, 접근 로깅
- `public/shared/auth/scope_checker.py` - OAuth scope 기반 접근 제어
- `public/shared/utils/vault_utils.py` - vault 경로, frontmatter 파싱
- `public/shared/models/common.py` - HealthResponse, ErrorResponse

**결과**: ✅ Import 테스트 통과 (shared.auth, shared.utils, shared.models 모두 정상)

**다음 단계**:
- [x] exec/api MCP mount 구현 (tsk-018-04)
- [x] public/api import 경로 수정 (tsk-018-05)

---

**2026-01-06 (상세)**:
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
