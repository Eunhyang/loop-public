---
entity_type: Task
entity_id: "tsk-vault-gpt-07"
entity_name: "OAuth 인증 서버 분리 (loop-auth)"
created: 2026-01-02
updated: 2026-01-02
status: doing

# === 계층 ===
parent_id: "prj-vault-gpt"
project_id: "prj-vault-gpt"
aliases: ["tsk-vault-gpt-07"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-02
due: 2026-01-02
priority: high
estimated_hours: 3
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop-api

# === 3Y 전략 연결 (필수) ===
# === 분류 ===
tags: [mcp, oauth, docker, auth, infrastructure]
priority_flag: high
---

# OAuth 인증 서버 분리 (loop-auth)

> Task ID: `tsk-vault-gpt-07` | Project: `prj-vault-gpt` | Status: doing

## 목표

MCP API 서버와 OAuth 인증 서버를 분리하여, API 서버 rebuild 시에도 인증 세션이 유지되도록 함

**완료 조건**:
1. `loop-auth` 컨테이너 생성 (OAuth 전용)
2. `loop-api` 컨테이너는 API + MCP만 담당
3. API rebuild 시 재인증 불필요 확인
4. ChatGPT 연동 테스트 성공

---

## 상세 내용

### 배경

현재 상황:
- `loop-api` 단일 컨테이너에 OAuth + API + MCP 모두 포함
- Docker rebuild 시 모든 세션 무효화
- ChatGPT에서 매번 재인증 필요

목표 아키텍처:
```
┌──────────────────┐    ┌──────────────────┐
│  loop-auth       │    │  loop-api        │
│  (인증 전용)      │    │  (API + MCP)     │
│  - OAuth         │    │  - MCP SSE       │
│  - Token 발급    │←──→│  - API 로직      │
│  - SQLite DB     │    │                  │
│  포트: 8083      │    │  포트: 8082      │
└──────────────────┘    └──────────────────┘
```

### 작업 내용

1. **OAuth 라우터 분리**: `api/routers/oauth.py` 독립 실행 가능하도록
2. **loop-auth Dockerfile 생성**: 최소 의존성
3. **loop-api에서 OAuth 제거**: API/MCP만 담당
4. **docker-compose로 통합 관리**
5. **Nginx 리버스 프록시 설정** (선택)

---

## 체크리스트

- [ ] OAuth 라우터 독립 실행 가능 여부 확인
- [ ] loop-auth용 Dockerfile.auth 생성
- [ ] loop-api용 Dockerfile 수정 (OAuth 제외)
- [ ] docker-compose.yml 작성 (두 컨테이너 연동)
- [ ] NAS 배포 테스트
- [ ] ChatGPT 재인증 테스트

---

## Notes

### PRD (Product Requirements Document)

#### 📊 아키텍처 도식

```
┌─────────────────────────────────────────────────────────────────┐
│                OAuth Server Separation Architecture             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ External (ChatGPT / Dashboard)                            │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  [Client] ──→ Nginx (8082) ──→ Routing                   │   │
│  │                   │                                       │   │
│  │           ┌───────┴───────┐                               │   │
│  │           ↓               ↓                               │   │
│  │      /oauth/*        /api/*, /mcp/*                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│           │                       │                              │
│           ↓                       ↓                              │
│  ┌───────────────────┐   ┌───────────────────┐                  │
│  │ loop-auth (8083)  │   │ loop-api (8081)   │                  │
│  ├───────────────────┤   ├───────────────────┤                  │
│  │ - OAuth Discovery │   │ - MCP SSE         │                  │
│  │ - /authorize      │   │ - REST API        │                  │
│  │ - /token          │   │ - VaultCache      │                  │
│  │ - /register       │   │                   │                  │
│  │ - Login/Logout    │   │                   │                  │
│  │                   │   │                   │                  │
│  │ SQLite: oauth.db  │   │ Verify JWT only   │                  │
│  │ Keys: RS256       │   │ (JWKS fetch)      │                  │
│  └───────────────────┘   └───────────────────┘                  │
│           │                       ↑                              │
│           │                       │                              │
│           └── JWT Token ──────────┘                              │
│                                                                  │
│  Volumes:                                                        │
│  - oauth.db: /vault/api/oauth/oauth.db (shared)                 │
│  - keys/: /vault/api/oauth/keys/ (shared)                       │
│  - LOOP Vault: /vault (loop-api only)                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 📋 프로젝트 컨텍스트

- **Framework**: FastAPI (Python 3.11)
- **Current State**: 단일 loop-api 컨테이너에 OAuth + API + MCP 통합
- **OAuth**: RS256 JWT + PKCE + SQLite
- **Pain Point**: loop-api rebuild 시 세션 무효화 → 재인증 필요

#### 🎯 구현 범위

##### 주요 기능
1. **loop-auth 컨테이너**: OAuth 전용 (Discovery, Login, Token)
2. **loop-api 수정**: OAuth 제거, JWT 검증만 유지
3. **Nginx 설정**: URL 패턴 기반 라우팅

##### 파일 구조
```
api/
├── oauth/                    # loop-auth에서만 사용
│   ├── routes.py            # OAuth endpoints
│   ├── security.py          # Auth logic
│   ├── models.py            # SQLAlchemy models
│   ├── jwks.py              # RS256 key management
│   └── keys/                # RSA key pair (shared volume)
├── main.py                  # loop-api: OAuth 라우터 제거
└── main_auth.py             # NEW: loop-auth 전용 진입점

Dockerfile                    # loop-api (기존, OAuth 제외)
Dockerfile.auth              # NEW: loop-auth 전용

docker-compose.yml           # NEW: 두 컨테이너 통합 관리
nginx.conf                   # NEW: 라우팅 설정 (선택)
```

#### 📝 상세 요구사항

##### 1. loop-auth 컨테이너 (OAuth 전용)
- **포트**: 8083 (내부)
- **엔드포인트**:
  - `/.well-known/oauth-authorization-server`
  - `/.well-known/jwks.json`
  - `/authorize`, `/token`, `/register`
  - `/oauth/login`, `/oauth/logout`
- **의존성**: FastAPI, SQLAlchemy, python-jose, bcrypt, jinja2
- **볼륨**: oauth.db, keys/ (공유)

##### 2. loop-api 수정
- **제거**: OAuth 라우터 (`oauth_router`)
- **유지**: JWT 검증 (`verify_jwt`) - JWKS 공유 또는 HTTP fetch
- **포트**: 8081 (기존)

##### 3. Docker Compose 구성
```yaml
version: '3.8'
services:
  loop-auth:
    build:
      context: .
      dockerfile: Dockerfile.auth
    ports:
      - "8083:8083"
    volumes:
      - /volume1/LOOP_CORE/vault/LOOP/api/oauth:/app/api/oauth:rw
    environment:
      - OAUTH_DB_PATH=/app/api/oauth/oauth.db

  loop-api:
    build: .
    ports:
      - "8082:8081"
    volumes:
      - /volume1/LOOP_CORE/vault/LOOP:/vault:rw
      - /volume1/LOOP_CORE/vault/LOOP/api/oauth/keys:/app/api/oauth/keys:ro
    environment:
      - VAULT_DIR=/vault
      - JWKS_URL=http://loop-auth:8083/.well-known/jwks.json
    depends_on:
      - loop-auth
```

##### 4. JWT 검증 전략 (loop-api)
```python
# Option A: 공유 볼륨 (keys/ 마운트)
# - 장점: 네트워크 호출 없음
# - 단점: 키 로테이션 시 재시작 필요

# Option B: JWKS HTTP fetch (권장)
# - 장점: 키 로테이션 자동 반영
# - 단점: 네트워크 의존

# 구현: jwks.py의 verify_jwt()가 JWKS_URL 환경변수 확인
JWKS_URL = os.getenv("JWKS_URL")
if JWKS_URL:
    # Fetch JWKS from loop-auth
    response = requests.get(JWKS_URL, timeout=5)
    jwks = response.json()
```

#### ✅ 성공 기준

- [ ] loop-auth 단독 실행 및 OAuth 플로우 정상 동작
- [ ] loop-api rebuild 시 기존 JWT 토큰 유효 (재인증 불필요)
- [ ] ChatGPT MCP 연결 → API rebuild → 재연결만 필요 (재로그인 X)
- [ ] docker-compose로 두 컨테이너 통합 관리
- [ ] Health check 엔드포인트 각각 정상

#### 🔍 확인 사항

- **Q1**: Nginx 프록시 추가할지? (현재 NAS는 직접 포트 노출)
- **Q2**: JWKS 캐싱 전략 (TTL 설정)
- **A1**: 현재는 직접 포트 노출 유지, 추후 Nginx 추가 가능
- **A2**: JWKS 1시간 캐싱 적용

### Tech Spec

#### 📁 파일 변경

| 파일 | 작업 | 설명 |
|------|------|------|
| `api/main_auth.py` | 신규 | loop-auth 진입점 |
| `api/main.py` | 수정 | OAuth 라우터 제거, JWKS fetch 추가 |
| `api/oauth/jwks.py` | 수정 | JWKS_URL 환경변수 지원 |
| `Dockerfile.auth` | 신규 | loop-auth 이미지 |
| `docker-compose.yml` | 신규 | 두 컨테이너 통합 |

#### 📝 구현 순서

1. `api/main_auth.py` 생성 (OAuth 전용 FastAPI 앱)
2. `api/oauth/jwks.py` 수정 (JWKS_URL fetch 지원)
3. `api/main.py` 수정 (OAuth 라우터 제거)
4. `Dockerfile.auth` 생성
5. `docker-compose.yml` 작성
6. NAS 배포 테스트
7. ChatGPT 재인증 테스트

### Todo
- [ ] main_auth.py 생성
- [ ] jwks.py JWKS_URL fetch 지원 추가
- [ ] main.py OAuth 라우터 제거
- [ ] Dockerfile.auth 생성
- [ ] docker-compose.yml 작성
- [ ] NAS 배포 테스트

### 작업 로그

---

## 참고 문서

- [[prj-vault-gpt]] - 소속 Project
- [[tsk-vault-gpt-06]] - 이전 Task (vault-full-scan API)
- [[api/routers/oauth.py]] - OAuth 라우터

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**: 2026-01-02
