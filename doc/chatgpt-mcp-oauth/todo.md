# ChatGPT MCP OAuth - Task List

> Production OAuth 2.0 implementation for ChatGPT MCP

## Current Status: Completed (Critical Fixes Applied)

---

## Completed Tasks

### Phase 1: Core OAuth Infrastructure

- [x] **OAUTH-001** SQLAlchemy 모델 생성 (models.py)
  - 파일: `api/oauth/models.py`
  - 작업: AuthCode, User, Session, OAuthClient 테이블 정의
  - 완료일: 2025-12-25

- [x] **OAUTH-002** RS256 + JWKS 구현 (jwks.py)
  - 파일: `api/oauth/jwks.py`
  - 작업: RSA 키 생성, JWKS 엔드포인트, JWT 서명/검증
  - 완료일: 2025-12-25

- [x] **OAUTH-003** 보안 유틸리티 (security.py)
  - 파일: `api/oauth/security.py`
  - 작업: bcrypt, 세션 관리, PKCE, rate limiting, path allowlist
  - 완료일: 2025-12-25

### Phase 2: OAuth Endpoints

- [x] **OAUTH-004** 로그인 페이지 (templates/login.html)
  - 파일: `api/templates/login.html`
  - 작업: 로그인 폼 + CSRF hidden field
  - 완료일: 2025-12-25

- [x] **OAUTH-005** OAuth 라우트 구현 (routes.py)
  - 파일: `api/oauth/routes.py`
  - 작업: /.well-known/*, /authorize, /login, /token, /register
  - 완료일: 2025-12-25

- [x] **OAUTH-006** main.py 통합
  - 파일: `api/main.py`
  - 작업: OAuth 라우터 등록, 기존 open OAuth 제거, startup init
  - 완료일: 2025-12-25

### Phase 3: Critical Security Fixes (Codex Review)

- [x] **FIX-001** Auth code race condition 수정
  - 파일: `api/oauth/security.py:consume_auth_code`
  - 작업: SELECT FOR UPDATE + atomic delete
  - 완료일: 2025-12-25

- [x] **FIX-002** Login rate limiting 추가
  - 파일: `api/oauth/routes.py:oauth_login`
  - 작업: IP별 분당 5회 제한
  - 완료일: 2025-12-25

- [x] **FIX-003** CSRF token 추가
  - 파일: `api/oauth/routes.py`, `api/templates/login.html`
  - 작업: csrf_token 생성 및 hidden field 추가
  - 완료일: 2025-12-25

- [x] **FIX-004** redirect_uri client binding
  - 파일: `api/oauth/security.py:validate_client_redirect_uri`
  - 작업: 클라이언트 등록 URI와 정확 일치 검증
  - 완료일: 2025-12-25

---

## Remaining Tasks (Non-Critical)

- [x] **OAUTH-007** 초기 사용자 생성 CLI 스크립트
  - 파일: `api/oauth/cli.py`
  - 작업: `python -m api.oauth.cli create-user --email x --password y`
  - 완료일: 2025-12-25

- [x] **OAUTH-008** bcrypt 직접 사용 (passlib 호환성 문제 해결)
  - 파일: `api/oauth/security.py`
  - 작업: bcrypt 5.0 직접 호출로 변경
  - 완료일: 2025-12-25

- [x] **OAUTH-009** Docker 빌드 및 NAS 배포
  - 작업: Dockerfile 수정, `/mcp-server rebuild`
  - 완료일: 2025-12-25

- [x] **OAUTH-010** MCP 엔드포인트 검증
  - 작업: `/.well-known/oauth-authorization-server`, JWKS, `/mcp` 정상 확인
  - 완료일: 2025-12-25

- [ ] **OAUTH-011** 만료 세션/코드 정리 스케줄러
  - 작업: Background task for cleanup_expired()

- [ ] **OAUTH-012** ChatGPT Developer Mode 실제 연결 테스트
  - 작업: Settings → Connectors → Add MCP server

---

## Security Checklist (All Passed)

| Item | Status |
|------|--------|
| PKCE S256 verification | ✅ |
| Auth code single-use (atomic delete) | ✅ |
| Login required for /authorize | ✅ |
| Login rate limiting | ✅ |
| CSRF token on login form | ✅ |
| redirect_uri global allowlist | ✅ |
| redirect_uri client binding | ✅ |
| RS256 JWT with JWKS | ✅ |
| Sensitive path blocking | ✅ |
| Access logging | ✅ |
| Session cookie (httponly, secure, samesite) | ✅ |

---

**Last Updated**: 2025-12-25
