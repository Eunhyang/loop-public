# MCP Dual-Vault RBAC - Task List

> loop_exec Vault 추가 및 역할 기반 접근 제어 구현

## Current Status: Deployed

---

## Tasks

### Phase 1: User Model & Database

- [x] **RBAC-001** User 모델에 role 필드 추가
  - 파일: `api/oauth/models.py`
  - 작업: `role = Column(String, default="member")` 추가
  - 마이그레이션: `scripts/migrate_role.py` 실행
  - 완료일: 2025-12-26

- [x] **RBAC-002** CLI에 role 관련 명령어 추가
  - 파일: `api/oauth/cli.py`
  - 작업:
    - `create-user --role` 옵션 추가
    - `set-role` 명령어 추가
    - `list-users`에 role 표시
  - 완료일: 2025-12-26

### Phase 2: JWT & Access Control

- [x] **RBAC-003** JWT 발급 시 role/scope 포함
  - 파일: `api/oauth/routes.py`
  - 작업: `create_jwt()`에 `additional_claims={"role": user_role}` 추가
  - exec/admin은 scope에 `mcp:exec` 자동 추가
  - 완료일: 2025-12-26

- [x] **RBAC-004** 경로 접근 제어 강화
  - 파일: `api/oauth/security.py`
  - 작업:
    - `EXEC_PATH_PREFIX = "exec/"` 상수 추가
    - `check_path_access(path, scope, role)` 시그니처 변경
    - exec/ 경로는 exec, admin만 접근 가능
  - 완료일: 2025-12-26

- [x] **RBAC-005** API 미들웨어에서 role 체크
  - 파일: `api/main.py`, `api/routers/files.py`
  - 작업:
    - JWT에서 role, scope 추출하여 `request.state`에 저장
    - files 라우터에서 `check_path_access()` 호출
  - 완료일: 2025-12-26

### Phase 3: Docker & Deployment

- [x] **RBAC-006** Docker 볼륨 마운트 추가
  - 파일: `.claude/commands/mcp-server.md`
  - 작업: `-v /volume1/LOOP_CLevel/vault/loop_exec:/vault/exec:ro` 추가
  - 완료일: 2025-12-26

- [x] **RBAC-007** 환경변수 추가
  - 작업: `-e EXEC_VAULT_DIR=/vault/exec` 환경변수
  - 완료일: 2025-12-26

- [x] **RBAC-008** Docker 재빌드 및 배포
  - 작업: `/mcp-server rebuild` 실행
  - admin@sosilab.com 사용자 role='admin' 설정
  - 완료일: 2025-12-26

### Phase 4: Testing & Verification

- [ ] **RBAC-009** 테스트 사용자 생성
  - 작업:
    - member 사용자: `test-member@sosilab.com`
    - exec 사용자: `test-exec@sosilab.com`

- [ ] **RBAC-010** 접근 제어 테스트
  - 작업:
    - member로 exec/ 접근 → 403 확인
    - exec로 exec/ 접근 → 200 확인
    - 로그에 차단 기록 확인

- [ ] **RBAC-011** ChatGPT 연결 테스트
  - 작업: 실제 ChatGPT에서 role별 데이터 조회 테스트

### Phase 5: Documentation

- [ ] **RBAC-012** oauth-admin 스킬 업데이트
  - 파일: `.claude/skills/oauth-admin/SKILL.md`
  - 작업: role 관련 명령어 추가

- [ ] **RBAC-013** CLAUDE.md 업데이트
  - 작업: Dual-vault 구조 설명 추가

---

## Security Checklist

| Item | Status |
|------|--------|
| exec vault read-only mount | ✅ |
| Role-based path access | ✅ |
| JWT contains role claim | ✅ |
| Exec access logging | ✅ |
| Blocked access logging | ✅ |

---

## 변경된 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `api/oauth/models.py` | User 모델에 `role` 필드 추가 |
| `api/oauth/cli.py` | `--role` 옵션, `set-role` 명령어 추가 |
| `api/oauth/routes.py` | JWT 발급 시 role/scope 포함 |
| `api/oauth/security.py` | `check_path_access(path, scope, role)` 수정 |
| `api/main.py` | request.state에 role/scope 저장 |
| `api/routers/files.py` | RBAC 체크 추가 |
| `.claude/commands/mcp-server.md` | exec vault 볼륨 마운트 추가 |
| `scripts/migrate_role.py` | DB 마이그레이션 스크립트 |

---

**Last Updated**: 2025-12-26
