---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-29"
entity_name: "Dashboard - Google Calendar 연동 버그 수정"
created: 2026-01-06
updated: 2026-01-06
status: doing

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-29"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-06
due: 2026-01-06
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: bug
target_project: loop

# === 분류 ===
tags: [dashboard, google-calendar, bug, oauth]
priority_flag: high
---

# Dashboard - Google Calendar 연동 버그 수정

> Task ID: `tsk-dashboard-ux-v1-29` | Project: `prj-dashboard-ux-v1` | Status: doing

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
