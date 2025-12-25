# ChatGPT MCP OAuth - Technical Specification

> Production-grade OAuth 2.0 implementation for ChatGPT Developer Mode MCP integration

## 1. Project Overview

### 1.1 Goal
ChatGPT Developer Mode에서 LOOP Vault MCP에 접근할 때 **실제 로그인 기반 인증**을 요구하는 Production OAuth 구현.

### 1.2 Current State (Open OAuth)
- URL 구조만 알면 누구나 토큰 발급 가능
- 로그인 없이 자동 토큰 발급
- 보안 취약

### 1.3 Target State (Production OAuth)
- 로그인 필수 (세션 기반)
- PKCE 검증 (code_challenge/verifier)
- Authorization Code 1회용 (DB 저장/삭제)
- RS256 + JWKS 토큰 서명
- Scope 기반 권한 제어

---

## 2. Architecture

### 2.1 OAuth Flow

```
ChatGPT                    MCP Server                    User
   │                           │                           │
   ├─── GET /authorize ───────>│                           │
   │    (client_id, code_challenge, redirect_uri)          │
   │                           │                           │
   │                           ├─── 302 /login ───────────>│
   │                           │    (세션 없음)              │
   │                           │                           │
   │                           │<── POST /login ───────────┤
   │                           │    (email, password)       │
   │                           │                           │
   │                           ├─── Set-Cookie: session ──>│
   │                           │                           │
   │<── 302 redirect_uri ──────┤    (code 발급)             │
   │    ?code=xxx&state=yyy    │                           │
   │                           │                           │
   ├─── POST /token ──────────>│                           │
   │    (code, code_verifier)  │                           │
   │                           │                           │
   │<── JWT (access_token) ────┤                           │
   │                           │                           │
   ├─── GET /mcp ─────────────>│                           │
   │    Authorization: Bearer  │                           │
   │                           │                           │
```

### 2.2 File Structure

```
api/
├── main.py                    # FastAPI app + MCP mount
├── oauth/
│   ├── __init__.py
│   ├── models.py              # SQLAlchemy (AuthCode, User, Session)
│   ├── routes.py              # /authorize, /token, /login, /register
│   ├── jwks.py                # RS256 key generation + JWKS endpoint
│   └── security.py            # verify_mcp_token, password hashing
├── templates/
│   └── login.html             # Login page
└── oauth.db                   # SQLite database (gitignored)
```

---

## 3. Data Models

### 3.1 AuthCode (Authorization Code)

```python
class AuthCode(Base):
    __tablename__ = "auth_codes"
    id: int                    # Primary key
    code: str                  # 64-byte random token
    code_challenge: str        # SHA256(code_verifier)
    client_id: str             # Dynamic client ID
    redirect_uri: str          # Must match exactly
    user_id: str               # Authenticated user
    expires_at: datetime       # 10 minutes TTL
```

### 3.2 User

```python
class User(Base):
    __tablename__ = "users"
    id: int
    email: str                 # Unique
    password_hash: str         # bcrypt
    created_at: datetime
```

### 3.3 Session

```python
class Session(Base):
    __tablename__ = "sessions"
    id: int
    session_id: str            # Cookie value
    user_id: str
    expires_at: datetime       # 24 hours TTL
```

---

## 4. API Endpoints

### 4.1 OAuth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/.well-known/oauth-authorization-server` | RFC 8414 Discovery |
| GET | `/.well-known/jwks.json` | RS256 Public Key (JWKS) |
| POST | `/register` | RFC 7591 Dynamic Client Registration |
| GET | `/authorize` | Authorization endpoint (redirects to login) |
| POST | `/login` | User authentication |
| POST | `/token` | Token exchange (code → JWT) |

### 4.2 OAuth Discovery Response

```json
{
  "issuer": "https://mcp.sosilab.synology.me",
  "authorization_endpoint": "https://mcp.sosilab.synology.me/authorize",
  "token_endpoint": "https://mcp.sosilab.synology.me/token",
  "registration_endpoint": "https://mcp.sosilab.synology.me/register",
  "jwks_uri": "https://mcp.sosilab.synology.me/.well-known/jwks.json",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code"],
  "code_challenge_methods_supported": ["S256"],
  "token_endpoint_auth_methods_supported": ["none"],
  "scopes_supported": ["mcp:read", "mcp:write", "mcp:admin"]
}
```

---

## 5. Security Specifications

### 5.1 PKCE (Proof Key for Code Exchange)

```python
# Client generates:
code_verifier = random_string(64)
code_challenge = base64url(sha256(code_verifier))

# Server validates:
stored_challenge == sha256(received_verifier)
```

### 5.2 RS256 + JWKS

```python
# Key generation (once, on startup)
from cryptography.hazmat.primitives.asymmetric import rsa
private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

# JWT signing
jwt.encode(payload, private_key, algorithm="RS256")

# JWKS endpoint exposes public key
{
  "keys": [{
    "kty": "RSA",
    "use": "sig",
    "kid": "loop-mcp-key-1",
    "n": "...",
    "e": "AQAB"
  }]
}
```

### 5.3 Token Payload

```json
{
  "sub": "user@sosilab.com",
  "aud": "https://mcp.sosilab.synology.me",
  "iss": "https://mcp.sosilab.synology.me",
  "scope": "mcp:read mcp:write",
  "exp": 1735200000,
  "iat": 1735196400
}
```

### 5.4 Scope Policy

| Scope | Allowed Tools |
|-------|---------------|
| `mcp:read` | get_tasks, get_projects, search, read_file |
| `mcp:write` | create_task, update_task, create_project |
| `mcp:admin` | delete_task, delete_project |

---

## 6. Dependencies

```toml
# pyproject.toml additions
[tool.poetry.extras]
oauth = [
  "python-jose[cryptography]",
  "python-multipart",
  "passlib[bcrypt]",
  "aiofiles",
  "jinja2"
]
```

---

## 7. Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OAUTH_ISSUER` | OAuth issuer URL | `https://mcp.sosilab.synology.me` |
| `OAUTH_DB_PATH` | SQLite database path | `./oauth.db` |
| `JWT_PRIVATE_KEY_PATH` | RS256 private key file | Auto-generated |
| `SESSION_EXPIRE_HOURS` | Session TTL | `24` |
| `TOKEN_EXPIRE_HOURS` | JWT TTL | `1` |

---

## 8. Migration from Current (Open OAuth)

### 8.1 Backwards Compatibility

- Dashboard API token (`x-api-token`) still works
- MCP 127.0.0.1 bypass still works (internal calls)
- New OAuth only affects external ChatGPT connections

### 8.2 Deployment Steps

1. Deploy new code with OAuth endpoints
2. Test with new ChatGPT MCP connection
3. Remove old open OAuth endpoints (optional)

---

## 9. ADR (Architecture Decision Records)

### ADR-001: SQLite over Redis for Session Storage

**Decision**: Use SQLite instead of Redis for initial implementation.

**Rationale**:
- Docker container already has SQLite
- Simpler deployment (no additional service)
- Sufficient for expected load (<100 users)
- Can migrate to Redis later if needed

### ADR-002: RS256 over HS256

**Decision**: Use RS256 (asymmetric) instead of HS256 (symmetric).

**Rationale**:
- ChatGPT can verify tokens via JWKS without shared secret
- More secure (private key never leaves server)
- Standard practice for public OAuth providers

---

**Version**: 1.0.0
**Created**: 2025-12-25
**Author**: Claude Code
