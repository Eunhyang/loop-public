---
entity_type: Task
entity_id: tsk-mcp-rbac-03
entity_name: MCP - loop_exec Vault 라우팅 구현
created: 2025-12-29
updated: '2025-12-29'
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
due: null
estimate: null
target_project: loop
conditions_3y:
- cond-b
tags:
- mcp
- dual-vault
- rbac
- loop-exec
- api
priority_flag: high
notes: "# MCP - loop_exec Vault 라우팅 구현\n\n> Task ID: `tsk-mcp-rbac-03` | Project:\
  \ `prj-mcp-dual-vault-rbac` | Status: doing\n\n---\n\n## 목표\n\nChatGPT MCP에서 `exec/`\
  \ prefix 경로 접근 시 loop_exec vault를 서빙하도록 구현\n\n**완료 조건**:\n1. `vault_utils.py` -\
  \ `exec/` prefix 경로 시 loop_exec vault 반환\n2. `files.py` - dual vault 경로 라우팅 구현\n\
  3. admin@sosilab.com 계정 role이 `admin`으로 설정됨\n4. Docker compose - loop_exec 볼륨 마운트\
  \ 추가\n5. ChatGPT MCP에서 `exec/` 경로 접근 테스트 통과\n\n---\n\n## 상세 내용\n\n### 배경\n\n현재 LOOP\
  \ API는 LOOP vault만 서빙:\n- `get_vault_dir()` → `/Volumes/LOOP_CORE/vault/LOOP` 고정\n\
  - `exec/` 경로 접근 제어 로직은 있지만, 실제 loop_exec vault 라우팅 없음\n\nChatGPT에서 `R001_단님_파일럿_회고.md`\
  \ 등 loop_exec 파일 접근 시 404 발생.\n\n### 작업 내용\n\n#### Phase 1: Vault 경로 라우팅\n- [x]\
  \ `vault_utils.py` - `get_exec_vault_dir()` 함수 추가\n- [x] `files.py` - `exec/` prefix\
  \ 감지 시 exec vault로 라우팅\n\n#### Phase 2: 권한 확인/설정\n- [x] admin@sosilab.com role 확인\
  \ → admin으로 설정됨\n- [x] JWT에 `mcp:exec` scope 포함 확인\n\n#### Phase 3: Docker 배포\n\
  - [x] `docker-compose.yml` - loop_exec 볼륨 마운트 추가\n- [x] Docker 재빌드 및 배포\n\n####\
  \ Phase 4: 테스트\n- [x] ChatGPT MCP에서 `exec/` 경로 접근 테스트\n- [x] role=member 사용자 차단\
  \ 확인 (403 반환)\n\n---\n\n## 체크리스트\n\n- [ ] `vault_utils.py` 수정\n- [ ] `files.py`\
  \ 수정\n- [ ] admin@sosilab.com role=admin 설정\n- [ ] Docker compose 수정\n- [ ] 배포 및\
  \ 테스트\n\n---\n\n## Notes\n\n### PRD (Product Requirements Document)\n\n**목적**: ChatGPT\
  \ MCP에서 `exec/` prefix 경로 접근 시 loop_exec vault를 서빙\n\n**주요 기능**:\n1. `exec/` prefix\
  \ 경로 시 loop_exec vault로 라우팅\n2. role=admin 또는 exec 사용자만 접근 허용 (이미 구현됨)\n3. Docker\
  \ 볼륨 마운트로 loop_exec vault 접근\n\n**성공 기준**:\n- ChatGPT MCP에서 `exec/50_Projects_Exec/...`\
  \ 경로 접근 가능\n- role=member 사용자가 `exec/` 접근 시 403 반환\n- 기존 LOOP vault 접근이 영향받지 않음\n\
  \n### Tech Spec\n\n**프로젝트 컨텍스트**:\n- Framework: FastAPI + Python 3.x\n- Auth: OAuth\
  \ 2.0 (RS256 JWT + PKCE)\n- RBAC: role-based (`member` | `exec` | `admin`)\n- Deployment:\
  \ Docker Compose on Synology NAS\n\n**파일 구조**:\n```\napi/\n├── utils/\n│   └── vault_utils.py\
  \       # 수정: get_exec_vault_dir() 추가\n├── routers/\n│   └── files.py          \
  \   # 수정: exec/ prefix 라우팅\n├── oauth/\n│   ├── security.py          # 이미 구현됨: check_path_access()\n\
  │   └── cli.py               # 이미 구현됨: set-role 명령어\ndocker-compose.yml        \
  \   # 수정: loop_exec 볼륨 마운트\n```\n\n**상세 구현**:\n\n1. **vault_utils.py** - `get_exec_vault_dir()`\
  \ 추가\n   - NAS: `/volume1/LOOP_CLevel/vault/loop_exec`\n   - Mac: `/Volumes/LOOP_CLevel/vault/loop_exec`\n\
  \   - 환경변수: `EXEC_VAULT_DIR`\n\n2. **files.py** - Dual Vault 라우팅\n   - `resolve_vault_path()`\
  \ 헬퍼 함수\n   - `exec/` prefix 감지 → exec vault 반환 + prefix 제거\n   - 모든 엔드포인트 적용: `/`,\
  \ `/tree`, `/batch`, `/{file_path:path}`\n\n3. **docker-compose.yml** - 볼륨 마운트\n\
  \   - `/volume1/LOOP_CLevel/vault/loop_exec:/exec_vault:ro`\n   - `EXEC_VAULT_DIR=/exec_vault`\n\
  \n4. **admin@sosilab.com** - role=admin 설정\n   - `python -m api.oauth.cli set-role\
  \ --email admin@sosilab.com --role admin`\n\n### Todo\n- [ ] `vault_utils.py`에 `get_exec_vault_dir()`\
  \ 함수 구현\n- [ ] `files.py` 모든 엔드포인트에서 `exec/` prefix 라우팅\n- [ ] admin@sosilab.com\
  \ role=admin 설정\n- [ ] docker-compose.yml에 loop_exec 볼륨 마운트\n- [ ] ChatGPT MCP 테스트\n\
  \n### 작업 로그\n<!--\n작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)\n-->\n\n\n---\n\n##\
  \ 참고 문서\n\n- [[prj-mcp-dual-vault-rbac]] - 소속 Project\n- [[tsk-mcp-rbac-01]] - User\
  \ 모델 role 필드 (선행 Task)\n- `api/oauth/security.py` - 경로 접근 제어 로직\n- `api/utils/vault_utils.py`\
  \ - Vault 경로 유틸리티\n\n---\n\n**Created**: 2025-12-29\n**Assignee**: 김은향\n"
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

- [ ] `vault_utils.py` 수정
- [ ] `files.py` 수정
- [ ] admin@sosilab.com role=admin 설정
- [ ] Docker compose 수정
- [ ] 배포 및 테스트

---

## Notes

### PRD (Product Requirements Document)

**목적**: ChatGPT MCP에서 `exec/` prefix 경로 접근 시 loop_exec vault를 서빙

**주요 기능**:
1. `exec/` prefix 경로 시 loop_exec vault로 라우팅
2. role=admin 또는 exec 사용자만 접근 허용 (이미 구현됨)
3. Docker 볼륨 마운트로 loop_exec vault 접근

**성공 기준**:
- ChatGPT MCP에서 `exec/50_Projects_Exec/...` 경로 접근 가능
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
- [ ] `vault_utils.py`에 `get_exec_vault_dir()` 함수 구현
- [ ] `files.py` 모든 엔드포인트에서 `exec/` prefix 라우팅
- [ ] admin@sosilab.com role=admin 설정
- [ ] docker-compose.yml에 loop_exec 볼륨 마운트
- [ ] ChatGPT MCP 테스트

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)
-->


---

## 참고 문서

- [[prj-mcp-dual-vault-rbac]] - 소속 Project
- [[tsk-mcp-rbac-01]] - User 모델 role 필드 (선행 Task)
- `api/oauth/security.py` - 경로 접근 제어 로직
- `api/utils/vault_utils.py` - Vault 경로 유틸리티

---

**Created**: 2025-12-29
**Assignee**: 김은향
