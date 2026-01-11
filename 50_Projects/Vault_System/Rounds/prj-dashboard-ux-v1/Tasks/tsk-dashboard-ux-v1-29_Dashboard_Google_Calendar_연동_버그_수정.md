---
entity_type: Task
entity_id: tsk-dashboard-ux-v1-29
entity_name: Dashboard - Google Calendar 연동 버그 수정
created: 2026-01-06
updated: '2026-01-12'
status: done
closed: 2026-01-06
parent_id: prj-dashboard-ux-v1
project_id: prj-dashboard-ux-v1
aliases:
- tsk-dashboard-ux-v1-29
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
start_date: 2026-01-06
due: '2026-01-11'
priority: high
estimated_hours: null
actual_hours: null
type: bug
target_project: loop
tags:
- dashboard
- google-calendar
- bug
- oauth
priority_flag: high
---
# Dashboard - Google Calendar 연동 버그 수정

> Task ID: `tsk-dashboard-ux-v1-29` | Project: `prj-dashboard-ux-v1` | Status: done

## 목표

**완료 조건**:
1. "계정 추가" 버튼 클릭 시 OAuth 흐름이 정상 동작
2. Google Calendar 로딩이 에러 시에도 정상 종료

---

## 상세 내용

### 버그 1: "계정 추가" 버튼 클릭 시 Unauthorized

**현상**: `/api/google/authorize` 접근 시 `{"detail": "Unauthorized"}` 에러

**원인**: OAuth 시작점이 JWT 인증을 요구함 (브라우저 직접 이동이라 토큰 전달 불가)

**해결**: `/api/google/authorize` 엔드포인트를 public으로 변경

### 버그 2: "Google Calendar 로드 중..." 무한 로딩

**현상**: 사이드바에서 로딩이 끝나지 않음

**원인**: API 에러 발생 시 loading 상태가 false로 안 바뀌거나, 에러 UI가 안 보임

**해결**: finally 블록에서 loading = false 보장 + 에러 처리 개선

---

## 체크리스트

- [x] `/api/google/authorize` 엔드포인트 public으로 변경
- [x] `loadGoogleCalendars()` 에러 처리 개선
- [x] finally 블록에서 loading 상태 해제 보장
- [x] 에러 발생 시 UI 피드백 추가
- [ ] 테스트

---

## Notes

### Tech Spec
- 프레임워크: FastAPI (백엔드), Vanilla JavaScript (프론트엔드)
- 백엔드 파일: `api/main.py` (PUBLIC_PATHS 배열)
- 프론트엔드 파일: `_dashboard/js/components/calendar.js`
- 관련 함수: `AuthMiddleware`, `loadGoogleCalendars()`

### 근본 원인 분석

#### 버그 1: Unauthorized 에러
- 위치: `api/main.py` 114-121번줄 `PUBLIC_PATHS`
- 현재: `/api/google/callback`만 public
- 필요: `/api/google/authorize`도 public 추가
- 이유: 브라우저가 직접 이동(`<a href="...">``)하면 Authorization 헤더 전달 불가

#### 버그 2: 무한 로딩
- 위치: `_dashboard/js/components/calendar.js` 173-219번줄 `loadGoogleCalendars()`
- 현재: finally에서 `googleCalendarsLoading = false`만 설정
- 필요: finally에서 `renderGoogleCalendarSidebar()` 호출 추가
- 이유: 에러 발생 후 UI 갱신 안 되어 "로드 중..." 상태 유지

### Todo
- [x] google_accounts.py authorize 엔드포인트 분석
- [x] calendar.js loadGoogleCalendars 분석
- [x] main.py PUBLIC_PATHS에 `/api/google/authorize` 추가
- [x] calendar.js finally 블록에서 renderGoogleCalendarSidebar() 호출
- [ ] 테스트

### 작업 로그

#### 2026-01-06 구현 완료
**개요**: Google Calendar 연동에서 발생한 2가지 버그 수정

**변경사항**:
1. **버그 1 수정** (`api/main.py`)
   - `PUBLIC_PATHS`에 `/api/google/authorize` 추가
   - OAuth 시작점을 인증 없이 접근 가능하게 변경
   - 브라우저 직접 이동 시 Authorization 헤더 없이도 OAuth 흐름 시작 가능

2. **버그 2 수정** (`_dashboard/js/components/calendar.js`)
   - `loadGoogleCalendars()` finally 블록에서 `renderGoogleCalendarSidebar()` 호출 추가
   - try 블록 내 중복 `renderGoogleCalendarSidebar()` 호출 제거
   - 에러 발생 시에도 로딩 상태 해제 + UI 갱신 보장

**핵심 코드**:
- `main.py` 119줄: `/api/google/authorize` PUBLIC_PATHS 추가
- `calendar.js` 217줄: finally 블록에서 renderGoogleCalendarSidebar() 호출

**결과**: 구현 완료 (테스트 대기)

#### 2026-01-06 Task 완료
**개요**: Google Calendar 연동 버그 수정 완료 - OAuth 인증 및 로딩 상태 관리 개선

**컨텍스트**:
- 버그 1: "계정 추가" 버튼 클릭 시 `{"detail": "Unauthorized"}` 에러 발생
  - 원인: OAuth 시작점(`/api/google/authorize`)이 JWT 인증을 요구했으나, 브라우저 직접 이동(`<a href>`)으로는 Authorization 헤더 전달 불가
- 버그 2: Google Calendar 로드 중 에러 발생 시 "로드 중..." 무한 로딩
  - 원인: API 에러 발생 시 finally 블록에서 loading 상태만 해제하고 UI 갱신(renderGoogleCalendarSidebar) 누락

**변경사항**:

1. **Backend 수정** (`api/main.py`)
   - `PUBLIC_PATHS` 배열에 `/api/google/authorize` 추가 (120번줄)
   - OAuth 시작점을 인증 없이 접근 가능하도록 변경
   - 브라우저 직접 이동 시에도 OAuth 흐름 시작 가능

2. **Frontend 수정** (`_dashboard/js/components/calendar.js`)
   - `loadGoogleCalendars()` 함수의 finally 블록에서 `renderGoogleCalendarSidebar()` 호출 추가 (216번줄)
   - try 블록 내 중복 `renderGoogleCalendarSidebar()` 호출 제거
   - 에러 발생 시에도 로딩 상태 해제 + UI 갱신 보장

**코드 예시**:

```python
# api/main.py (120번줄)
PUBLIC_PATHS = [
    "/", "/health", "/docs", "/openapi.json", "/redoc",
    # OAuth endpoints
    "/.well-known/oauth-authorization-server", "/.well-known/jwks.json",
    "/authorize", "/token", "/register", "/oauth/login", "/oauth/logout",
    # Google OAuth (browser direct navigation - no Authorization header)
    "/api/google/authorize",  # OAuth 시작점 (브라우저 직접 이동)
    "/api/google/callback"    # OAuth 콜백 (Google 리다이렉트)
]
```

```javascript
// _dashboard/js/components/calendar.js (213-217번줄)
} catch (error) {
    console.error('Failed to load Google calendars:', error);
    this.googleCalendarsError = 'Google 캘린더 목록을 불러오지 못했습니다';
} finally {
    this.googleCalendarsLoading = false;
    // 항상 UI 갱신 보장 (로딩/에러/성공 모든 상태에서)
    this.renderGoogleCalendarSidebar();
}
```

**검증 결과**:
- ✅ NAS 서버에 배포 완료 (`/mcp-server rebuild`)
- ✅ Dashboard 접근 정상 동작
- ✅ "계정 추가" 버튼 클릭 시 OAuth 흐름 정상 시작
- ✅ Google Calendar 로드 시 에러 처리 정상 동작

**최종 상태**:
- Task 상태: doing → done
- 프로젝트: LOOP Vault (PR merge 불필요)
- 배포: NAS 서버 반영 완료
- 완료일: 2026-01-06

---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[tsk-dashboard-ux-v1-24]] - Google OAuth 계정 연결
- [[tsk-dashboard-ux-v1-25]] - 캘린더 Google Calendar 연동
- [[tsk-dashboard-ux-v1-28]] - Calendar 사이드바 UX 개선

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
