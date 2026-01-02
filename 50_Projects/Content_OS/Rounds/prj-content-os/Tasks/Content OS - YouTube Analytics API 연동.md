---
entity_type: Task
entity_id: "tsk-content-os-10"
entity_name: "Content OS - YouTube Analytics API 연동"
created: 2026-01-02
updated: 2026-01-02
status: done

# === 계층 ===
parent_id: "prj-content-os"
project_id: "prj-content-os"
aliases: ["tsk-content-os-10"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-02
due: null
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===
# === 분류 ===
tags: ["content-os", "youtube-analytics", "oauth", "performance-dashboard"]
priority_flag: high
---

# Content OS - YouTube Analytics API 연동

> Task ID: `tsk-content-os-10` | Project: `prj-content-os` | Status: doing

## 목표

**완료 조건**:
1. YouTube Analytics API 연동으로 내 채널 실제 성과 데이터 조회 가능
2. 기존 Performance Dashboard UI에 실제 데이터 표시
3. OAuth 2.0 인증 플로우 구현

---

## 상세 내용

### 배경

`tsk-content-os-06`에서 Performance Dashboard Phase 1 UI를 구현했으나, 현재 더미 데이터로만 동작한다. 실제 YouTube Analytics API를 연동하여 내 채널 영상의 성과 지표(impressions, CTR, views, avg_view_duration)를 가져오는 기능이 필요하다.

### 이전 작업과 차이점

| 항목 | tsk-content-os-09 (완료) | 이번 작업 |
|------|--------------------------|-----------|
| API | YouTube Data API v3 | YouTube Analytics API |
| 용도 | 공개 영상 검색 | 내 채널 성과 데이터 |
| 인증 | API Key | OAuth 2.0 |
| 데이터 | 조회수, 좋아요, duration | impressions, CTR, avg_view_duration |

### 작업 내용

1. **OAuth 2.0 설정**
   - GCP에서 YouTube Analytics API 활성화
   - OAuth 2.0 Consent Screen 설정
   - OAuth 2.0 Client ID 생성 (Web application)

2. **Analytics API 연동**
   - `/youtubeAnalytics/v2/reports` endpoint 호출
   - 지표: impressions, views, averageViewDuration, estimatedMinutesWatched
   - 필터: video별, 기간별 (24h, 7d)

3. **OAuth 인증 플로우**
   - 로그인 버튼 → Google OAuth → 토큰 저장
   - Access Token + Refresh Token 관리

4. **더미 데이터 → 실제 데이터 전환**
   - Performance Dashboard에서 API 데이터 사용
   - 24h/7d 비교 로직 적용

---

## 체크리스트

- [x] YouTube Analytics API 활성화 (GCP)
- [x] OAuth 2.0 Consent Screen 설정
- [x] OAuth 2.0 Client ID 생성
- [x] OAuth 인증 API Route 구현
- [x] Analytics API 서비스 구현
- [x] Performance Dashboard 실제 데이터 연동
- [x] 토큰 저장/갱신 로직

---

## Notes

### PRD (Product Requirements Document)

#### 1. Overview

**Problem Statement**: Performance Dashboard가 더미 데이터로만 동작하여 실제 채널 성과 분석이 불가능하다. 사용자가 자신의 YouTube 채널을 연결하여 실제 성과 지표를 확인할 수 있어야 한다.

**Solution**: YouTube Analytics API와 OAuth 2.0을 연동하여 실제 채널 성과 데이터를 Performance Dashboard에 표시한다.

**Success Metrics**:
- OAuth 2.0 로그인/로그아웃 정상 동작
- 실제 YouTube Analytics 데이터 조회 및 표시
- 기존 UI/UX 완벽 호환 (리스트 뷰, 상세 뷰, 주간 요약)

#### 2. Functional Requirements

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-01 | OAuth 2.0 인증 | Google OAuth 2.0으로 YouTube 채널 연결. PKCE 플로우 |
| FR-02 | Analytics 데이터 조회 | 영상별 views, averageViewDuration, estimatedMinutesWatched 조회 |
| FR-03 | 24h/7d 비교 | 지난 24시간과 지난 7일 데이터 비교 표시 |
| FR-04 | 더미 데이터 Fallback | 미인증 시 더미 데이터로 동작 또는 안내 메시지 |

#### 3. Non-Functional Requirements

| ID | Requirement | Description |
|----|-------------|-------------|
| NFR-01 | 보안 | Token은 HTTP-only Secure Cookie 저장. Client Secret 서버에서만 사용 |
| NFR-02 | 성능 | API 응답 5분 캐시 (TanStack Query) |
| NFR-03 | 에러 처리 | 토큰 만료, API 할당량 초과, 네트워크 에러 시 적절한 메시지 |

#### 4. User Stories

**US-01**: 콘텐츠 기획자로서, 내 YouTube 채널을 연결하여 실제 영상 성과를 확인하고 싶다.
- Acceptance: OAuth 로그인 → 채널 연결 → 성과 데이터 표시

**US-02**: 콘텐츠 기획자로서, 영상별 24시간/7일 성과 변화를 비교하고 싶다.
- Acceptance: 모든 영상에 24h/7d 지표 표시, Delta 계산

#### 5. Out of Scope
- 다중 채널 지원
- 댓글/커뮤니티 분석
- 수익 데이터 (monetization)
- 알림 기능

#### 6. API 제한 사항 (중요)

> **YouTube Analytics API는 impressions(노출수)와 CTR에 대해 제한적 데이터만 제공**

- `impressions`: Card 노출만 제공, 일반 노출은 YouTube Studio API만 가능
- `annotationClickThroughRate`: 정확한 CTR이 아닌 annotation CTR만 제공

**대안**:
1. 제한된 데이터로 진행 (views, averageViewDuration 중심)
2. 사용자 직접 입력 필드 추가 (수동)
3. YouTube Studio Data API 검토 (비공개, 승인 필요)

### Tech Spec

#### 1. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser (Client)                             │
│  usePerformanceData → fetch → /api/youtube/analytics/reports    │
│  useAuthStatus → fetch → /api/auth/youtube/status               │
└─────────────────────────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────────────────────────┐
│        Next.js API Routes (Server)                               │
│  OAuthService → Token 관리 (Cookie)                              │
│  AnalyticsService → YouTube Analytics API 호출                   │
└─────────────────────────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────────────────────────┐
│  Google OAuth 2.0          │  YouTube Analytics API v2           │
│  accounts.google.com       │  youtubeanalytics.googleapis.com    │
└─────────────────────────────────────────────────────────────────┘
```

#### 2. Type Definitions

**OAuth Types** (`types/youtube-analytics.ts`):
- `YouTubeOAuthTokens`: accessToken, refreshToken, expiresAt, scope
- `AuthStatus`: isAuthenticated, channelId, channelName, expiresAt

**Analytics Types** (`types/youtube-analytics.ts`):
- `YouTubeAnalyticsResponse`: kind, columnHeaders, rows
- `VideoAnalyticsData`: videoId, views, estimatedMinutesWatched, averageViewDuration

#### 3. OAuth Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/youtube/login` | GET | OAuth 시작 → Google 리다이렉트 |
| `/api/auth/youtube/callback` | GET | OAuth 콜백 → 토큰 저장 |
| `/api/auth/youtube/logout` | POST | 로그아웃 → 토큰 삭제 |
| `/api/auth/youtube/status` | GET | 인증 상태 확인 |

#### 4. Analytics Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/youtube/analytics/reports` | GET | 채널 전체 리포트 |
| `/api/youtube/analytics/videos` | GET | 영상별 성과 데이터 |

#### 5. Core Components

**OAuthService** (`lib/youtube/oauth-service.ts`):
- `generateAuthUrl()`: PKCE + 인증 URL
- `exchangeCodeForTokens()`: 코드 → 토큰
- `refreshAccessToken()`: 토큰 갱신
- `revokeToken()`: 토큰 철회

**AnalyticsService** (`lib/youtube/youtube-analytics-service.ts`):
- `getVideoAnalytics()`: 영상별 성과
- `getChannelAnalytics()`: 채널 전체 성과
- `getRecentVideosWithAnalytics()`: 영상 목록 + 성과 조합

**usePerformanceData** (`app/performance/hooks/use-performance-data.ts`):
- TanStack Query 기반 데이터 fetching
- 5분 캐시, 에러 핸들링

#### 6. File Structure

```
apps/content-os/
├── app/api/
│   ├── auth/youtube/
│   │   ├── login/route.ts
│   │   ├── callback/route.ts
│   │   ├── logout/route.ts
│   │   └── status/route.ts
│   └── youtube/analytics/
│       ├── reports/route.ts
│       └── videos/route.ts
├── app/performance/
│   ├── hooks/use-performance-data.ts
│   └── components/auth-status-banner.tsx
├── lib/youtube/
│   ├── oauth-service.ts
│   └── youtube-analytics-service.ts
├── types/youtube-analytics.ts
└── .env.local (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
```

### Todo

#### Phase 1: OAuth 설정
- [x] GCP에서 YouTube Analytics API 활성화
- [x] OAuth Consent Screen 설정
- [x] OAuth Client ID 생성 (Web application)
- [x] `.env.local`에 GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET 추가

#### Phase 2: OAuth 구현
- [x] `types/youtube-analytics.ts` 생성
- [x] `lib/youtube/oauth-service.ts` 생성
- [x] `/api/auth/youtube/*` 라우트 생성
- [x] OAuth 플로우 테스트

#### Phase 3: Analytics 구현
- [x] `lib/youtube/youtube-analytics-service.ts` 생성
- [x] `/api/youtube/analytics/*` 라우트 생성
- [x] API 응답 → ContentPerformance 변환 로직

#### Phase 4: UI 연결
- [x] `use-performance-data.ts` 훅 생성
- [x] `auth-status-banner.tsx` 컴포넌트 생성
- [x] `page.tsx` 수정: 더미 데이터 → API 데이터

#### Phase 5: Testing
- [x] OAuth 플로우 E2E 테스트
- [x] Analytics 데이터 표시 확인
- [x] 에러 핸들링 확인

### 작업 로그

#### 2026-01-02 20:30
**개요**: YouTube Analytics API와 OAuth 2.0 인증을 Content OS Performance Dashboard에 연동 완료. Google OAuth PKCE 플로우, Analytics API 서비스, UI 통합 전체 구현.

**변경사항**:
- 개발:
  - `types/youtube-analytics.ts` - OAuth/Analytics 타입 정의
  - `lib/youtube/oauth-service.ts` - PKCE OAuth, Token 관리 (HTTP-only Cookie)
  - `lib/youtube/youtube-analytics-service.ts` - Analytics API 서비스
  - `app/api/auth/youtube/login/route.ts` - OAuth 시작
  - `app/api/auth/youtube/callback/route.ts` - OAuth 콜백
  - `app/api/auth/youtube/logout/route.ts` - 로그아웃
  - `app/api/auth/youtube/status/route.ts` - 인증 상태
  - `app/api/youtube/analytics/videos/route.ts` - 영상별 성과
  - `app/performance/hooks/use-auth-status.ts` - 인증 상태 훅
  - `app/performance/hooks/use-performance-data.ts` - 성과 데이터 훅
  - `app/performance/components/auth-status-banner.tsx` - 로그인 배너
- 수정:
  - `app/performance/page.tsx` - API 데이터 연결, AuthStatusBanner 추가
  - `next.config.ts` - YouTube 이미지 도메인 추가 (*.ytimg.com, yt3.ggpht.com)
  - `docker-compose.yml` - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI 환경변수

**파일 변경**: 신규 11개, 수정 4개 (총 15개)

**결과**: ✅ 빌드 성공, OAuth 플로우 테스트 성공

**다음 단계**:
- NAS 배포 시 docker-compose.yml에 환경변수 추가
- 채널 선택 문제 해결 (Brand Account 연결 확인)


---

## 참고 문서

- [[prj-content-os]] - 소속 Project
- [[tsk-content-os-06]] - 선행 Task (Performance Dashboard Phase 1)
- [[tsk-content-os-09]] - YouTube Data API 연동 (검색 API)

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**:
