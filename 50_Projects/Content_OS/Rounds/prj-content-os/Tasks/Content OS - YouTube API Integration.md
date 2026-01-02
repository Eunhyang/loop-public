---
entity_type: Task
entity_id: "tsk-content-os-09"
entity_name: "Content OS - YouTube API Integration"
created: 2026-01-02
updated: 2026-01-02
status: doing

# === 계층 ===
parent_id: "prj-content-os"
project_id: "prj-content-os"
aliases: ["tsk-content-os-09"]

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
tags: ["content-os", "youtube-api", "api-integration", "video-explorer"]
priority_flag: high
---

# Content OS - YouTube API Integration

> Task ID: `tsk-content-os-09` | Project: `prj-content-os` | Status: doing

## 목표

**완료 조건**:
1. YouTube Data API v3 연동으로 실시간 영상 검색 가능
2. 검색 결과가 기존 Video Explorer UI에 정상 표시
3. API 에러 핸들링 및 Rate Limiting 처리

---

## 상세 내용

### 배경

`tsk-content-os-07`에서 Video Explorer Live Search UI를 구현했으나, 현재 더미 데이터로만 동작한다. 실제 YouTube Data API를 연동하여 키워드 검색 시 실시간 영상 데이터를 가져오는 기능이 필요하다.

### 작업 내용

1. **YouTube Data API v3 설정**
   - API Key 또는 OAuth 설정
   - 환경변수로 API Key 관리

2. **검색 API 연동**
   - `/search` endpoint로 키워드 검색
   - 필터링 옵션 (업로드 날짜, 정렬 등)

3. **영상 상세 정보 가져오기**
   - `/videos` endpoint로 조회수, 좋아요 등 통계
   - duration (영상 길이) 정보

4. **채널 정보 가져오기**
   - `/channels` endpoint로 구독자 수

5. **API 응답 → Video 타입 매핑**
   - 기존 ProcessedVideo 타입에 맞게 변환
   - 점수 계산 (기여도, 성과도, 노출확률)

6. **Rate Limiting / 에러 핸들링**
   - API 할당량 관리
   - 에러 시 사용자 피드백

---

## 체크리스트

- [ ] YouTube Data API 키 설정
- [ ] 검색 API 연동 (/search)
- [ ] 영상 통계 API 연동 (/videos)
- [ ] 채널 구독자 API 연동 (/channels)
- [ ] API 응답 → Video 타입 매핑
- [ ] Rate Limiting 처리
- [ ] 에러 핸들링 및 UI 피드백

---

## Notes

### PRD (Product Requirements Document)

#### 1. Overview

**Problem Statement**: 현재 Video Explorer는 `dummy-videos.ts`의 더미 데이터(24개 영상)로만 동작하여 실제 콘텐츠 기획에 활용할 수 없다. 사용자가 실시간으로 YouTube 영상을 검색하고 분석하여 콘텐츠 아이디어를 발굴할 수 있어야 한다.

**Solution**: YouTube Data API v3를 연동하여 Video Explorer에서 실시간 영상 검색 기능을 제공한다.

**Success Metrics**:
- YouTube API 연동 후 실제 검색 결과 반환
- 기존 UI/UX 완벽 호환 (Live Search, Collection, Block 기능)
- API 할당량 내 효율적 운영 (일 10,000 units)

#### 2. Functional Requirements

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-01 | 실시간 YouTube 검색 | 검색어 입력 시 YouTube에서 관련 영상 실시간 검색. 디바운싱 300ms, 최소 쿼리 2자 |
| FR-02 | 영상 상세 정보 조회 | videos.list API로 조회수, 좋아요, duration 등 상세 정보 조회 |
| FR-03 | 채널 정보 조회 | channels.list API로 채널 구독자 수 조회 (contribution score 계산용) |
| FR-04 | 기존 더미 데이터 호환 | 환경변수로 데이터 소스 전환 가능 |

#### 3. Non-Functional Requirements

| ID | Requirement | Description |
|----|-------------|-------------|
| NFR-01 | API 할당량 관리 | search: 100 units, videos: 1 unit/video, channels: 1 unit/channel. 일 100회 검색 지원 |
| NFR-02 | 성능 | 검색 응답 3초 이내, 디바운싱으로 불필요한 호출 방지 |
| NFR-03 | 에러 처리 | API 키 만료, 할당량 초과, 네트워크 에러 시 사용자 친화적 메시지 |
| NFR-04 | 보안 | API 키는 서버 사이드에서만 사용 (Route Handler) |

#### 4. User Stories

**US-01**: 콘텐츠 기획자로서, 특정 키워드로 YouTube 영상을 검색하여 어떤 콘텐츠가 인기 있는지 파악하고 싶다.
- Acceptance: 검색어 입력 후 300ms 후 자동 검색, 최대 50개 결과, 조회수/채널/게시일 포함

**US-02**: 콘텐츠 기획자로서, 검색된 영상의 Contribution/Impact Score를 보고 콘텐츠 성과를 분석하고 싶다.
- Acceptance: 모든 검색 결과에 Score 자동 계산, Score 기준 정렬 가능

**US-03**: 콘텐츠 기획자로서, 검색된 영상을 Collection에 저장하여 나중에 참고하고 싶다.
- Acceptance: 기존 Collect/Block 기능 그대로 동작

#### 5. Out of Scope
- YouTube 인증 (OAuth) - API 키 방식만 사용
- 댓글 조회
- 채널 검색 (영상 검색만)
- 영상 재생 기능

### Tech Spec

#### 1. Architecture

```
┌─────────────────────────────────────────────────┐
│            Browser (Client)                      │
│  useYouTubeSearch → fetch → /api/youtube/search │
└─────────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────────┐
│        Next.js API Routes (Server)               │
│  YouTubeService → search.list / videos.list /   │
│                   channels.list                  │
└─────────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────────┐
│          YouTube Data API v3                     │
└─────────────────────────────────────────────────┘
```

#### 2. Type Definitions

**YouTube API Response Types** (`types/youtube-api.ts`):
- `YouTubeSearchResponse`, `YouTubeSearchItem`
- `YouTubeVideoResponse`, `YouTubeVideoItem`
- `YouTubeChannelResponse`, `YouTubeChannelItem`

**Internal Types** (`types/youtube.ts`):
- `YouTubeSearchParams` (query, maxResults, pageToken, order 등)
- `YouTubeSearchResult` (videos, totalResults, nextPageToken, quotaUsed)
- `YouTubeAPIErrorCode` (QUOTA_EXCEEDED, INVALID_API_KEY 등)

**Video Type Extension** (`types/video.ts`):
- `youtubeId`, `channelId`, `likeCount`, `commentCount`, `categoryId`, `description`

#### 3. API Route

**Endpoint**: `GET /api/youtube/search`

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| q | string | Yes | - | 검색 쿼리 (min 2 chars) |
| maxResults | number | No | 25 | 결과 수 (max 50) |
| pageToken | string | No | - | 페이지네이션 토큰 |
| order | string | No | relevance | 정렬 순서 |

**Response**:
```typescript
{ success: boolean, data?: { videos, totalResults, nextPageToken }, error?: { code, message }, meta: { quotaUsed, timestamp } }
```

#### 4. Core Components

**YouTubeService** (`lib/youtube/youtube-service.ts`):
- `search()`: 검색 + 영상 상세 + 채널 정보 조합
- `searchVideos()`: search.list API 호출
- `getVideoDetails()`: videos.list API 호출
- `getChannelDetails()`: channels.list API 호출

**VideoTransformer** (`lib/youtube/video-transformer.ts`):
- YouTube API response → Video 타입 변환
- Duration parsing (PT10M32S → "10:32")
- Velocity 계산 (조회수 / 경과시간)

**useYouTubeSearch** (`app/explorer/hooks/use-youtube-search.ts`):
- React Query 기반 검색 훅
- Score 자동 계산 (processVideos 연동)
- 캐싱, 에러 처리

#### 5. File Structure

```
apps/content-os/
├── app/api/youtube/search/route.ts    # API endpoint
├── app/explorer/hooks/use-youtube-search.ts
├── lib/youtube/
│   ├── youtube-service.ts
│   ├── video-transformer.ts
│   └── errors.ts
├── types/
│   ├── youtube-api.ts
│   └── youtube.ts
└── .env.local (YOUTUBE_API_KEY)
```

### Todo

#### Phase 1: Foundation
- [ ] `.env.local` 파일 생성, `YOUTUBE_API_KEY` 설정
- [ ] `types/youtube-api.ts` 생성 (YouTube API response types)
- [ ] `types/youtube.ts` 생성 (internal types)
- [ ] `types/video.ts` 확장 (YouTube 필드 추가)
- [ ] `@tanstack/react-query` 설치 및 Provider 설정

#### Phase 2: Backend Implementation
- [ ] `lib/youtube/youtube-service.ts` 생성
- [ ] `lib/youtube/video-transformer.ts` 생성
- [ ] `lib/youtube/errors.ts` 생성
- [ ] `/api/youtube/search/route.ts` 생성
- [ ] API 테스트 (curl)

#### Phase 3: Frontend Integration
- [ ] `app/explorer/hooks/use-youtube-search.ts` 생성
- [ ] `page.tsx` 수정: 더미 데이터 → YouTube 검색 전환
- [ ] 로딩/에러 UI 추가

#### Phase 4: UX Enhancement
- [ ] 스켈레톤 UI 또는 로딩 인디케이터
- [ ] 할당량 초과 에러 메시지
- [ ] 페이지네이션 (Optional)

#### Phase 5: Testing & Polish
- [ ] 검색 → 결과 표시 플로우 테스트
- [ ] Score 계산 정확성 확인
- [ ] Collection/Block 호환성 확인
- [ ] `USE_DUMMY_DATA` fallback 로직

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)

#### YYYY-MM-DD HH:MM
**개요**: 2-3문장 요약

**변경사항**:
- 개발:
- 수정:
- 개선:

**핵심 코드**: (필요시)

**결과**: ✅ 빌드 성공 / ❌ 실패

**다음 단계**:
-->


---

## 참고 문서

- [[prj-content-os]] - 소속 Project
- [[tsk-content-os-07]] - 선행 Task (Video Explorer Live Search)

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**:
