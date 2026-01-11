---
entity_type: Task
entity_id: tsk-dashboard-ux-v1-24
entity_name: Dashboard - Google OAuth 계정 연결
created: 2026-01-06
updated: '2026-01-11'
status: doing
parent_id: prj-dashboard-ux-v1
project_id: prj-dashboard-ux-v1
aliases:
- tsk-dashboard-ux-v1-24
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
start_date: null
due: '2026-01-25'
priority: high
estimated_hours: null
actual_hours: null
type: dev
target_project: loop
tags:
- dashboard
- google
- oauth
- calendar
- multi-account
priority_flag: high
---
# Dashboard - Google OAuth 계정 연결

> Task ID: `tsk-dashboard-ux-v1-24` | Project: `prj-dashboard-ux-v1` | Status: todo

## 목표

**완료 조건**:
1. 대시보드 설정에서 Google 계정 연결 버튼 제공
2. 여러 Google 계정 연결 가능 (다중 계정 지원)
3. 연결된 계정 목록 표시 및 삭제 가능
4. OAuth 토큰 안전하게 저장 및 자동 갱신

---

## 상세 내용

### 배경

캘린더 뷰에서 Google Calendar 연동, Meeting Task에서 Google Meet 링크 생성을 위해 Google OAuth 인증 기반이 필요함.

### 작업 내용

1. **Google Cloud 설정**
   - Calendar API, Drive API, Docs API 활성화
   - OAuth 클라이언트 ID 생성 (웹 애플리케이션)

2. **API 엔드포인트 추가**
   - `POST /api/google/auth/start` - OAuth 시작 (redirect URL 반환)
   - `GET /api/google/auth/callback` - OAuth 콜백 처리
   - `GET /api/google/accounts` - 연결된 계정 목록
   - `DELETE /api/google/accounts/{id}` - 계정 연결 해제

3. **토큰 저장**
   - SQLite 또는 별도 파일에 암호화 저장
   - access_token, refresh_token, expiry 관리

4. **Dashboard UI**
   - 설정 패널에 "Google 계정 연결" 섹션
   - 연결된 계정 목록 (이메일, 연결일, 삭제 버튼)

---

## 체크리스트

- [ ] Google Cloud 프로젝트 설정 (API 활성화, OAuth 클라이언트)
- [ ] API 라우터 `/api/google/` 생성
- [ ] OAuth 플로우 구현 (start → callback → token 저장)
- [ ] 토큰 저장소 구현 (SQLite 또는 encrypted file)
- [ ] 토큰 자동 갱신 로직
- [ ] Dashboard 설정 UI
- [ ] 다중 계정 지원 테스트

---

## Notes

### PRD

#### 문제 정의

현재 LOOP Dashboard는 내부 인증 시스템만 지원하며, Google Calendar, Drive, Docs 등의 Google 서비스와 연동하려면 별도의 계정 관리 체계가 필요하다.

**해결해야 할 문제:**
1. **Google 서비스 연동 불가**: Calendar 동기화, Drive 첨부파일 연동 등 Google API 기능 사용 불가
2. **다중 계정 필요성**: 사용자가 개인/업무용 여러 Google 계정을 상황에 따라 사용해야 함
3. **토큰 관리 부재**: Google OAuth 토큰의 안전한 저장 및 자동 갱신 메커니즘 없음

#### 목표

| 성공 기준 | 측정 방법 |
|-----------|-----------|
| Google 계정 연결 가능 | Dashboard 설정에서 OAuth 플로우 완료 |
| 다중 계정 지원 | 최소 3개 Google 계정 동시 연결 가능 |
| 토큰 자동 갱신 | refresh_token으로 access_token 자동 갱신 (만료 5분 전) |
| 계정 관리 UI | 연결된 계정 목록 조회, 개별 삭제 가능 |

#### 핵심 요구사항

**1. Google OAuth 연동 (Backend)**
- Google Cloud Console에서 OAuth 2.0 클라이언트 설정 (Web application)
- 필수 Scopes: `calendar.readonly`, `calendar.events`, `drive.readonly`, `documents.readonly`
- Authorization Code Flow with PKCE 적용
- 토큰 저장: SQLite google_tokens.db

**2. 다중 계정 관리**
- 사용자당 여러 Google 계정 연결 가능
- 각 계정별 용도 라벨링 (예: "개인", "업무")
- 계정별 활성화/비활성화 토글

**3. Dashboard UI**
- Settings 섹션 추가 (Header 또는 사용자 메뉴)
- "Connect Google Account" 버튼
- 연결된 계정 리스트 (이메일, 연결일, 용도 라벨)
- 개별 계정 삭제 기능 (OAuth 토큰 revoke 포함)

**4. 토큰 보안 및 갱신**
- access_token: 1시간 유효
- refresh_token: 암호화하여 DB 저장 (AES-256-GCM)
- 자동 갱신: API 호출 시 만료 5분 전 자동 refresh
- 토큰 revoke: 계정 삭제 시 Google API로 revoke 호출

#### 기술 설계

**API 엔드포인트**

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/google/authorize` | OAuth 시작 (redirect to Google) |
| GET | `/api/google/callback` | OAuth 콜백 (토큰 수신 및 저장) |
| GET | `/api/google/accounts` | 연결된 계정 목록 조회 |
| DELETE | `/api/google/accounts/{account_id}` | 계정 연결 해제 (토큰 revoke) |

**데이터 모델**

```python
class GoogleAccount(Base):
    __tablename__ = "google_accounts"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    google_email = Column(String(256), nullable=False)
    label = Column(String(64), default="default")
    access_token_enc = Column(Text, nullable=False)
    refresh_token_enc = Column(Text, nullable=False)
    token_expires_at = Column(DateTime, nullable=False)
    scopes = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
```

#### 의존성

**환경변수**
```bash
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"
GOOGLE_REDIRECT_URI="https://mcp.sosilab.synology.me/api/google/callback"
TOKEN_ENCRYPTION_KEY="32-byte-key"
```

**Python 패키지**
```
google-auth
google-auth-oauthlib
cryptography
```

---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- `public/api/oauth/` - 기존 OAuth 구현 참고
- Google OAuth 2.0 문서: https://developers.google.com/identity/protocols/oauth2

---

## Implementation Log (2026-01-06)

### 구현 완료 파일

1. **api/models/google_accounts.py** (신규)
   - `GoogleAccount` 모델: 암호화된 토큰 저장
   - `GoogleOAuthState` 모델: CSRF 방지용 state 저장
   - SQLite DB 초기화

2. **api/services/google_oauth.py** (신규)
   - AES-256-GCM 토큰 암호화/복호화
   - PKCE 지원 OAuth 플로우
   - 토큰 자동 갱신 로직
   - Google API 토큰 revoke

3. **api/routers/google_accounts.py** (신규)
   - `GET /api/google/authorize` - OAuth 시작
   - `GET /api/google/callback` - 콜백 처리
   - `GET /api/google/accounts` - 계정 목록
   - `DELETE /api/google/accounts/{id}` - 계정 삭제
   - `PATCH /api/google/accounts/{id}` - 라벨 수정

4. **api/main.py** (수정)
   - google_accounts 라우터 등록
   - `/api/google/callback` PUBLIC_PATHS 추가
   - startup에서 init_google_oauth() 호출

### 보안 조치

- Open redirect 방지 (allowlist 기반 redirect_after 검증)
- Multi-tenant 소유권 체크 (user_id 기반)
- HTTP 요청 timeout (30초)
- Encryption key 검증 (startup 시 경고)
- CSRF 방지 (state + PKCE)

### 필요 환경변수

```bash
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"
GOOGLE_REDIRECT_URI="https://mcp.sosilab.synology.me/api/google/callback"
TOKEN_ENCRYPTION_KEY="64-char-hex-or-44-char-base64"
```

### 다음 단계

- Google Cloud Console에서 OAuth 클라이언트 생성
- 환경변수 설정
- Dashboard UI에 계정 연결 버튼 추가

---

**Created**: 2026-01-06
**Assignee**: 김은향
