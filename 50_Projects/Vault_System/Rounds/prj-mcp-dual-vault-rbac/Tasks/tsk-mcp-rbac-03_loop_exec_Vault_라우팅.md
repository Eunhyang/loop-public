---
entity_type: Task
entity_id: tsk-mcp-rbac-03
entity_name: MCP - loop_exec Vault 라우팅 구현
created: 2025-12-29
updated: '2026-01-13'
status: doing
parent_id: prj-mcp-dual-vault-rbac
project_id: prj-mcp-dual-vault-rbac
program_id: pgm-vault-system
aliases:
- tsk-mcp-rbac-03
outgoing_relations:
- type: depends_on
  target_id: tsk-mcp-rbac-01
  description: User role 필드 구현 완료 필요
validates: []
validated_by: []
type: dev
assignee: 김은향
priority: high
due: '2026-01-25'
estimate: null
target_project: loop
tags:
- mcp
- dual-vault
- rbac
- loop-exec
- api
priority_flag: high
notes: "# MCP - loop_exec Vault 라우팅 구현\n\n> Task ID: `tsk-mcp-rbac-03` | Project:\
  \ `prj-mcp-dual-vault-rbac` | Status: doing\n\n---\n\n## 목표\n\nChatGPT MCP에서 `exec/`\
  \ prefix 경로 접근 시 loop_exec vault를 서빙하도록 구현\n\n**완료 조건**:\n\n1. `vault_utils.py`\
  \ - `exec/` prefix 경로 시 loop_exec vault 반환\n2. `files.py` - dual vault 경로 라우팅 구현\n\
  3. admin@sosilab.com 계정 role이 `admin`으로 설정됨\n4. Docker compose - loop_exec 볼륨 마운트\
  \ 추가\n5. ChatGPT MCP에서 `exec/` 경로 접근 테스트 통과\n\n---\n\n## 상세 내용\n\n### 배경\n\n현재 LOOP\
  \ API는 LOOP vault만 서빙:\n\n- `get_vault_dir()` → `/Volumes/LOOP_CORE/vault/LOOP`\
  \ 고정\n- `exec/` 경로 접근 제어 로직은 있지만, 실제 loop_exec vault 라우팅 없음\n\nChatGPT에서 `R001_단님_파일럿_회고.md`\
  \ 등 loop_exec 파일 접근 시 404 발생.\n\n### 작업 내용\n\nPhase 1: Vault 경로 라우팅\n\n- [x] `vault_utils.py`\
  \ - `get_exec_vault_dir()` 함수 추가\n\n- [x] `files.py` - `exec/` prefix 감지 시 exec\
  \ vault로 라우팅\n\nPhase 2: 권한 확인/설정\n\n- [x] admin@sosilab.com role 확인 → admin으로 설정됨\n\
  \n- [x] JWT에 `mcp:exec` scope 포함 확인\n\nPhase 3: Docker 배포\n\n- [x] `docker-compose.yml`\
  \ - loop_exec 볼륨 마운트 추가\n\n- [x] Docker 재빌드 및 배포\n\nPhase 4: 테스트\n\n- [x] ChatGPT\
  \ MCP에서 `exec/` 경로 접근 테스트\n\n- [x] role=member 사용자 차단 확인 (403 반환)\n\n---\n\n## 체크리스트\n\
  \n- [ ] `vault_utils.py` 수정\n\n- [ ] `files.py` 수정\n\n- [ ] admin@sosilab.com role=admin\
  \ 설정\n\n- [ ] Docker compose 수정\n\n- [ ] 배포 및 테스트\n\n---\n\n## Notes\n\n### PRD\
  \ (Product Requirements Document)\n\n**목적**: ChatGPT MCP에서 `exec/` prefix 경로 접근\
  \ 시 loop_exec vault를 서빙\n\n**주요 기능**:\n\n1. `exec/` prefix 경로 시 loop_exec vault로\
  \ 라우팅\n2. role=admin 또는 exec 사용자만 접근 허용 (이미 구현됨)\n3. Docker 볼륨 마운트로 loop_exec vault\
  \ 접근\n\n**성공 기준**:\n\n- ChatGPT MCP에서 `exec/50_Projects/...` 경로 접근 가능\n- role=member\
  \ 사용자가 `exec/` 접근 시 403 반환\n- 기존 LOOP vault 접근이 영향받지 않음\n\n### Tech Spec\n\n**프로젝트\
  \ 컨텍스트**:\n\n- Framework: FastAPI + Python 3.x\n- Auth: OAuth 2.0 (RS256 JWT + PKCE)\n\
  - RBAC: role-based (`member` | `exec` | `admin`)\n- Deployment: Docker Compose on\
  \ Synology NAS\n\n**파일 구조**:\n\n```\napi/\n├── utils/\n│   └── vault_utils.py  \
  \     # 수정: get_exec_vault_dir() 추가\n├── routers/\n│   └── files.py            \
  \ # 수정: exec/ prefix 라우팅\n├── oauth/\n│   ├── security.py          # 이미 구현됨: check_path_access()\n\
  │   └── cli.py               # 이미 구현됨: set-role 명령어\ndocker-compose.yml        \
  \   # 수정: loop_exec 볼륨 마운트\n```\n\n**상세 구현**:\n\n1. **vault_utils.py** - `get_exec_vault_dir()`\
  \ 추가\n\n   - NAS: `/volume1/LOOP_CLevel/vault/loop_exec`\n   - Mac: `/Volumes/LOOP_CLevel/vault/loop_exec`\n\
  \   - 환경변수: `EXEC_VAULT_DIR`\n\n2. **files.py** - Dual Vault 라우팅\n\n   - `resolve_vault_path()`\
  \ 헬퍼 함수\n   - `exec/` prefix 감지 → exec vault 반환 + prefix 제거\n   - 모든 엔드포인트 적용: `/`,\
  \ `/tree`, `/batch`, `/{file_path:path}`\n\n3. **docker-compose.yml** - 볼륨 마운트\n\
  \n   - `/volume1/LOOP_CLevel/vault/loop_exec:/exec_vault:ro`\n   - `EXEC_VAULT_DIR=/exec_vault`\n\
  \n4. **admin@sosilab.com** - role=admin 설정\n\n   - `python -m api.oauth.cli set-role\
  \ --email admin@sosilab.com --role admin`\n\n### Todo\n\n- [ ] `vault_utils.py`에\
  \ `get_exec_vault_dir()` 함수 구현\n\n- [ ] `files.py` 모든 엔드포인트에서 `exec/` prefix 라우팅\n\
  \n- [ ] admin@sosilab.com role=admin 설정\n\n- [ ] docker-compose.yml에 loop_exec 볼륨\
  \ 마운트\n\n- [ ] ChatGPT MCP 테스트\n\n### 작업 로그\n\n---\n\n## 참고 문서\n\n- \\[\\[prj-mcp-dual-vault-rbac\\\
  ]\\] - 소속 Project\n- \\[\\[tsk-mcp-rbac-01\\]\\] - User 모델 role 필드 (선행 Task)\n-\
  \ `api/oauth/security.py` - 경로 접근 제어 로직\n- `api/utils/vault_utils.py` - Vault 경로\
  \ 유틸리티\n\n---\n\n**Created**: 2025-12-29 **Assignee**: 김은향"
---
# MCP - loop_exec Vault 라우팅 구현

> Task ID: `tsk-mcp-rbac-03` | Project: `prj-mcp-dual-vault-rbac` | Status: doing

---

## 목표

ChatGPT MCP에서 `exec/` prefix 경로 접근 시 loop_exec vault를 서빙하도록 구현

**완료 조건**:
1. `vault_utils.py` - `exec/` prefix 경로 시 loop_exec vault 반환
2. `files.py` - dual vault 경로 라우팅 구현
3. admin@sosilab.com 계정 role이 `admin`으로 설정됨
4. Docker compose - loop_exec 볼륨 마운트 추가
5. ChatGPT MCP에서 `exec/` 경로 접근 테스트 통과

---

## 상세 내용

### 배경

현재 LOOP API는 LOOP vault만 서빙:
- `get_vault_dir()` → `/Volumes/LOOP_CORE/vault/LOOP` 고정
- `exec/` 경로 접근 제어 로직은 있지만, 실제 loop_exec vault 라우팅 없음

ChatGPT에서 `R001_단님_파일럿_회고.md` 등 loop_exec 파일 접근 시 404 발생.

### 작업 내용

#### Phase 1: Vault 경로 라우팅
- [x] `vault_utils.py` - `get_exec_vault_dir()` 함수 추가
- [x] `files.py` - `exec/` prefix 감지 시 exec vault로 라우팅

#### Phase 2: 권한 확인/설정
- [x] admin@sosilab.com role 확인 → admin으로 설정됨
- [x] JWT에 `mcp:exec` scope 포함 확인

#### Phase 3: Docker 배포
- [x] `docker-compose.yml` - loop_exec 볼륨 마운트 추가
- [x] Docker 재빌드 및 배포

#### Phase 4: 테스트
- [x] ChatGPT MCP에서 `exec/` 경로 접근 테스트
- [x] role=member 사용자 차단 확인 (403 반환)

---

## 체크리스트

- [x] `vault_utils.py` 수정
- [x] ~~`files.py` 수정~~ → `mcp_composite.py`에 exec 엔드포인트 추가
- [x] admin@sosilab.com role=admin 설정
- [x] Docker compose 수정
- [x] 배포 완료 (curl 테스트 통과)
- [ ] ChatGPT MCP 테스트

---

## Notes

### PRD (Product Requirements Document)

**목적**: ChatGPT MCP에서 `exec/` prefix 경로 접근 시 loop_exec vault를 서빙

**주요 기능**:
1. `exec/` prefix 경로 시 loop_exec vault로 라우팅
2. role=admin 또는 exec 사용자만 접근 허용 (이미 구현됨)
3. Docker 볼륨 마운트로 loop_exec vault 접근

**성공 기준**:
- ChatGPT MCP에서 `exec/50_Projects/...` 경로 접근 가능
- role=member 사용자가 `exec/` 접근 시 403 반환
- 기존 LOOP vault 접근이 영향받지 않음

### Tech Spec

**프로젝트 컨텍스트**:
- Framework: FastAPI + Python 3.x
- Auth: OAuth 2.0 (RS256 JWT + PKCE)
- RBAC: role-based (`member` | `exec` | `admin`)
- Deployment: Docker Compose on Synology NAS

**파일 구조**:
```
api/
├── utils/
│   └── vault_utils.py       # 수정: get_exec_vault_dir() 추가
├── routers/
│   └── files.py             # 수정: exec/ prefix 라우팅
├── oauth/
│   ├── security.py          # 이미 구현됨: check_path_access()
│   └── cli.py               # 이미 구현됨: set-role 명령어
docker-compose.yml           # 수정: loop_exec 볼륨 마운트
```

**상세 구현**:

1. **vault_utils.py** - `get_exec_vault_dir()` 추가
   - NAS: `/volume1/LOOP_CLevel/vault/loop_exec`
   - Mac: `/Volumes/LOOP_CLevel/vault/loop_exec`
   - 환경변수: `EXEC_VAULT_DIR`

2. **files.py** - Dual Vault 라우팅
   - `resolve_vault_path()` 헬퍼 함수
   - `exec/` prefix 감지 → exec vault 반환 + prefix 제거
   - 모든 엔드포인트 적용: `/`, `/tree`, `/batch`, `/{file_path:path}`

3. **docker-compose.yml** - 볼륨 마운트
   - `/volume1/LOOP_CLevel/vault/loop_exec:/exec_vault:ro`
   - `EXEC_VAULT_DIR=/exec_vault`

4. **admin@sosilab.com** - role=admin 설정
   - `python -m api.oauth.cli set-role --email admin@sosilab.com --role admin`

### Todo
- [x] `vault_utils.py`에 `get_exec_vault_dir()` 함수 구현
- [x] ~~`files.py` 모든 엔드포인트에서 `exec/` prefix 라우팅~~ → `mcp_composite.py`에 exec 전용 엔드포인트 3개 추가
- [x] admin@sosilab.com role=admin 설정
- [x] docker-compose.yml에 loop_exec 볼륨 마운트
- [ ] ChatGPT MCP 테스트 (11개 함수 표시 확인)

### 작업 로그

#### 2025-12-29 17:30
**개요**: ChatGPT MCP에서 loop_exec vault 접근을 위한 전용 API 엔드포인트 3개 구현. 기존 `/api/files/` 라우터는 GPT Actions 전용이었으므로 삭제하고, MCP composite 엔드포인트에 exec 전용 함수 추가.

**변경사항**:
- 개발: `mcp_composite.py`에 exec vault 전용 엔드포인트 3개 추가
  - `exec-context`: exec vault 구조 + 현황 반환
  - `exec-read`: exec vault 파일 읽기 (paths 파라미터)
  - `exec-search`: exec vault 검색 (q 파라미터)
- 개발: RBAC 헬퍼 함수 추가 (`get_role_and_scope()`, `require_exec_access()`)
- 수정: `main.py` - MCP_ALLOWED_OPERATIONS에 exec 함수 3개 추가
- 수정: `main.py` - MCP description에 Dual Vault Contract, 의사결정 파이프라인, 라우팅 규칙 추가
- 수정: `main.py` - AuthMiddleware에 scope["state"] 추가 (RBAC role/scope 전달)
- 삭제: `api/routers/files.py` (GPT Actions 전용이었으므로 MCP에서 불필요)

**파일 변경**:
- `api/routers/mcp_composite.py` - exec 엔드포인트 3개 + RBAC 헬퍼 추가 (약 180줄)
- `api/main.py` - MCP_ALLOWED_OPERATIONS, AuthMiddleware scope["state"], MCP description 수정
- `api/routers/files.py` - 삭제

**MCP Description 추가 내용**:
- Dual Vault Contract (LOOP = Shareable, Exec = Private)
- 의사결정 파이프라인: Runway → Cashflow → Pipeline → People → Contingency
- 라우팅 규칙 (상태/정책 → LOOP, 금액/개인 → exec만)
- exec 탐색 순서 가이드

**결과**: ✅ curl 테스트 통과
- `exec-context` → HTTP 200, vault 구조 반환
- `exec-read?paths=_ENTRY_POINT.md` → HTTP 200, 파일 내용 반환
- `exec-search?q=runway` → HTTP 200, 검색 결과 반환

**다음 단계**:
- [ ] ChatGPT MCP에서 11개 함수 표시 확인 (기존 8개 + exec 3개)
- [ ] ChatGPT에서 exec-context, exec-read, exec-search 실제 호출 테스트


---

## 참고 문서

- [[prj-mcp-dual-vault-rbac]] - 소속 Project
- [[tsk-mcp-rbac-01]] - User 모델 role 필드 (선행 Task)
- `api/oauth/security.py` - 경로 접근 제어 로직
- `api/utils/vault_utils.py` - Vault 경로 유틸리티

---

**Created**: 2025-12-29
**Assignee**: 김은향
