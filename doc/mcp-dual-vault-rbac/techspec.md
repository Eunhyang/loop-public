# MCP Dual-Vault RBAC - Technical Specification

> loop_exec Vault 추가 및 역할 기반 접근 제어 구현

## 1. 개요

### 1.1 목표
- 기존 LOOP vault와 함께 loop_exec vault를 동일 MCP 서버에서 제공
- 사용자 역할(role)에 따라 loop_exec 접근 제한
- C-Level 민감 데이터(runway, cashflow, salary)를 코어팀 멤버로부터 보호

### 1.2 범위
- User 모델에 role 필드 추가
- JWT 토큰에 role/scope 포함
- 경로별 접근 제어 로직 강화
- Docker 볼륨 마운트 추가

## 2. 아키텍처

### 2.1 현재 구조
```
User → JWT (scope: mcp:read) → 모든 허용 경로 접근
```

### 2.2 목표 구조
```
User (role: member) → JWT (scope: mcp:read)      → LOOP만 접근
User (role: exec)   → JWT (scope: mcp:read,exec) → LOOP + loop_exec 접근
User (role: admin)  → JWT (scope: mcp:read,exec) → LOOP + loop_exec 접근
```

### 2.3 Vault 마운트 구조
```
Docker Container
├── /vault          ← LOOP (기존)
│   └── /volume1/LOOP_CORE/vault/LOOP
└── /vault/exec     ← loop_exec (추가)
    └── /volume1/LOOP_CLevel/vault/loop_exec
```

### 2.4 경로 매핑
| 요청 경로 | 실제 경로 | 접근 권한 |
|-----------|-----------|-----------|
| `/api/files/50_Projects/...` | `/vault/50_Projects/...` | member, exec, admin |
| `/api/files/exec/...` | `/vault/exec/...` | exec, admin only |

## 3. 데이터 모델

### 3.1 User 모델 (수정)
```python
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="member")  # 추가: "member" | "exec" | "admin"
    created_at = Column(DateTime, default=datetime.utcnow)
```

### 3.2 Role 정의
| Role | 설명 | LOOP 접근 | loop_exec 접근 |
|------|------|-----------|----------------|
| `member` | 코어팀 멤버 | ✅ | ❌ |
| `exec` | C-Level | ✅ | ✅ |
| `admin` | 시스템 관리자 | ✅ | ✅ |

### 3.3 JWT Claims (수정)
```python
{
    "sub": "user@example.com",
    "role": "member",           # 추가
    "scope": "mcp:read",        # member: "mcp:read", exec/admin: "mcp:read mcp:exec"
    "iat": 1735100000,
    "exp": 1735186400
}
```

## 4. API 변경사항

### 4.1 접근 제어 로직
```python
# security.py
EXEC_PATH_PREFIX = "exec/"

def check_path_access(path: str, user_role: str, scope: str) -> bool:
    """Check if user can access the requested path"""
    path = path.lstrip("/")

    # exec/ 경로 접근 시 role 체크
    if path.startswith(EXEC_PATH_PREFIX):
        if user_role not in ("exec", "admin"):
            logger.warning(f"Blocked exec access: role={user_role}, path={path}")
            return False
        if "mcp:exec" not in scope:
            logger.warning(f"Blocked exec access: scope missing mcp:exec")
            return False

    # 기존 BLOCKED_PATHS 체크
    for blocked in BLOCKED_PATHS:
        if blocked in path:
            return False

    return True
```

### 4.2 JWT 발급 로직 (수정)
```python
def create_access_token(user: User) -> str:
    """Create JWT with role-based scope"""
    scope = "mcp:read mcp:exec" if user.role in ("exec", "admin") else "mcp:read"

    claims = {
        "sub": user.email,
        "role": user.role,
        "scope": scope,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(claims, private_key, algorithm="RS256")
```

### 4.3 CLI 변경
```bash
# 사용자 생성 시 role 지정
python -m api.oauth.cli create-user --email user@example.com --role exec

# 사용자 role 변경
python -m api.oauth.cli set-role --email user@example.com --role member
```

## 5. Docker 변경사항

### 5.1 볼륨 마운트 추가
```bash
docker run -d --name loop-api \
  -p 8082:8081 \
  -v /volume1/LOOP_CORE/vault/LOOP:/vault:rw \
  -v /volume1/LOOP_CLevel/vault/loop_exec:/vault/exec:ro \  # 추가 (read-only)
  -e VAULT_DIR=/vault \
  -e EXEC_VAULT_DIR=/vault/exec \
  -e OAUTH_DB_PATH=/vault/api/oauth/oauth.db \
  loop-api:latest
```

### 5.2 환경변수
| 변수 | 값 | 설명 |
|------|-----|------|
| `VAULT_DIR` | `/vault` | LOOP vault 경로 |
| `EXEC_VAULT_DIR` | `/vault/exec` | loop_exec vault 경로 |
| `OAUTH_DB_PATH` | `/vault/api/oauth/oauth.db` | OAuth DB 경로 |

## 6. 보안 고려사항

### 6.1 exec vault는 read-only 마운트
- loop_exec는 읽기 전용으로 마운트
- MCP를 통한 수정 불가

### 6.2 로깅 강화
- exec 경로 접근 시도는 모두 로깅
- 차단된 접근 시도도 로깅

### 6.3 Role 변경 감사
- role 변경 시 로그 기록
- admin만 role 변경 가능 (향후)

## 7. 테스트 계획

### 7.1 단위 테스트
- [ ] `check_path_access()` with different roles
- [ ] JWT 생성 시 role/scope 포함 확인
- [ ] Role별 경로 접근 테스트

### 7.2 통합 테스트
- [ ] member 사용자로 exec/ 접근 → 403
- [ ] exec 사용자로 exec/ 접근 → 200
- [ ] ChatGPT에서 role별 데이터 조회 테스트

## 8. 마이그레이션

### 8.1 기존 사용자 처리
- 기존 사용자는 `role=member`로 설정 (기본값)
- admin 사용자만 수동으로 role 변경

### 8.2 DB 마이그레이션
```sql
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'member';
```

---

**Created**: 2025-12-25
**Status**: Planning
