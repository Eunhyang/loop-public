---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-25"
entity_name: "Dashboard - 캘린더 Google Calendar 연동"
created: 2026-01-06
updated: 2026-01-06
status: done
closed: 2026-01-06

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-25"]

# === 관계 ===
outgoing_relations:
  - target: "tsk-dashboard-ux-v1-24"
    type: depends_on
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: null
due: null
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 분류 ===
tags: [dashboard, google, calendar, integration, sync]
priority_flag: high
---

# Dashboard - 캘린더 Google Calendar 연동

> Task ID: `tsk-dashboard-ux-v1-25` | Project: `prj-dashboard-ux-v1` | Status: done

## 목표

**완료 조건**:
1. 캘린더 뷰에서 연결된 Google Calendar 이벤트 표시
2. 여러 계정의 캘린더를 동시에 표시 (색상 구분)
3. 캘린더별 표시/숨김 토글 가능
4. Google Calendar 이벤트는 읽기 전용 (LOOP Task만 편집 가능)

---

## 상세 내용

### 배경

LOOP Task 일정과 Google Calendar 일정을 한 화면에서 보고 싶음. 개인 캘린더, 업무 캘린더 등 여러 계정 지원 필요.

### 의존성

- `tsk-dashboard-ux-v1-24` (Google OAuth 계정 연결) 완료 후 진행

### 작업 내용

1. **API 엔드포인트**
   - `GET /api/google/calendars` - 연결된 계정들의 캘린더 목록
   - `GET /api/google/events?start=&end=` - 기간별 이벤트 조회

2. **Calendar API 연동**
   - calendarList.list() - 사용자 캘린더 목록
   - events.list() - 이벤트 조회

3. **Dashboard UI**
   - 캘린더 뷰 사이드바에 Google 캘린더 목록
   - 각 캘린더 체크박스로 표시/숨김
   - Google 이벤트는 다른 스타일로 표시 (점선 테두리 등)

4. **캐싱**
   - 이벤트 캐시 (5분)
   - 캘린더 목록 캐시 (1시간)

---

## 체크리스트

- [ ] API `/api/google/calendars` 엔드포인트
- [ ] API `/api/google/events` 엔드포인트
- [ ] Calendar API 연동 서비스 구현
- [ ] Dashboard 캘린더 목록 UI
- [ ] FullCalendar에 Google 이벤트 렌더링
- [ ] 이벤트 스타일 구분 (LOOP vs Google)
- [ ] 캐싱 구현
- [ ] 다중 계정 테스트

---

## Notes

### PRD

#### 문제 정의

현재 LOOP Dashboard 캘린더는 LOOP Task만 표시하므로, 사용자는 전체 일정을 파악하기 위해 Google Calendar와 Dashboard를 번갈아 확인해야 한다.

**문제점:**
- 일정 충돌을 사전에 파악하기 어려움
- 업무 계획 수립 시 외부 일정 고려가 누락됨
- 두 시스템 간 context switching으로 인한 생산성 저하

#### 목표

1. **통합 뷰 제공**: LOOP Task와 Google Calendar 이벤트를 단일 캘린더에서 확인
2. **다중 계정 지원**: 개인/업무용 등 여러 Google 계정의 캘린더를 동시 표시
3. **시각적 구분**: 캘린더별 색상 코딩으로 일정 출처 즉시 식별
4. **선택적 표시**: 필요한 캘린더만 토글하여 뷰 커스터마이징

**성공 기준**:
- Google Calendar 연동 후 3초 내 이벤트 로드
- 최소 5개 캘린더 동시 표시 지원
- 캘린더 토글 상태 브라우저 저장 (새로고침 후에도 유지)

#### 핵심 요구사항

| 우선순위 | 요구사항 | 상세 |
|---------|---------|------|
| P0 | Google Calendar 이벤트 조회 | OAuth 토큰으로 사용자 캘린더 목록 및 이벤트 fetch |
| P0 | FullCalendar 통합 | 기존 calendar.js에 Google 이벤트를 추가 이벤트 소스로 등록 |
| P0 | 읽기 전용 표시 | Google 이벤트 클릭 시 상세 보기만 (편집/삭제 불가) |
| P1 | 캘린더별 색상 지정 | 각 캘린더에 고유 색상 자동 할당 |
| P1 | 표시/숨김 토글 | 사이드바에 캘린더 목록 + 체크박스 UI |
| P2 | 토글 상태 저장 | localStorage에 선택 상태 persist |

#### 기술 설계

**API 엔드포인트**

```
GET /api/google/calendars
- Response: { calendars: [{ id, name, color, primary }] }

GET /api/google/events?calendarIds=...&start=...&end=...
- Response: { events: [{ id, calendarId, title, start, end, allDay, color }] }
```

**데이터 모델 (FullCalendar 호환)**

```javascript
{
  id: 'gcal_{calendarId}_{eventId}',
  title: string,
  start: ISO8601,
  end: ISO8601,
  allDay: boolean,
  backgroundColor: string,
  editable: false,
  extendedProps: {
    source: 'google',
    calendarId: string,
    calendarName: string
  }
}
```

**이벤트 표시 구분**

| 속성 | LOOP Task | Google Event |
|------|-----------|--------------|
| 테두리 | 실선 | 점선 |
| 클릭 | 편집 모달 | 상세 보기 (읽기 전용) |
| 드래그 | 가능 | 불가 |

#### 의존성

| 의존성 | 상태 | 설명 |
|--------|------|------|
| tsk-dashboard-ux-v1-24 (OAuth) | 필수 선행 | Google OAuth 토큰 획득 기반 |
| Google Calendar API v3 | 외부 서비스 | `calendar.readonly` scope 필요 |
| FullCalendar | 기존 사용 | v6.x 버전 |

---

### 작업 로그

#### 2026-01-06 (Task 완료)
**개요**: Google Calendar 연동 기능 구현 완료. API 엔드포인트, 서비스 레이어, Dashboard UI 통합까지 전체 구현.

**변경사항**:
- 개발: `GET /api/google/calendars` - 연결된 계정들의 캘린더 목록 조회 엔드포인트
- 개발: `GET /api/google/events` - 기간별 이벤트 조회 엔드포인트 (start, end 파라미터)
- 개발: `api/services/google_calendar.py` - Calendar API 연동 서비스 (calendarList.list, events.list)
- 개발: 캘린더별 색상 구분 및 표시/숨김 토글 기능
- 수정: Dashboard 캘린더 뷰에 Google Calendar 이벤트 렌더링 통합
- 수정: FullCalendar에 Google 이벤트를 추가 이벤트 소스로 등록

**파일 변경**:
- `api/routers/google.py` - Google Calendar API 라우터 추가
- `api/services/google_calendar.py` - Calendar API 연동 서비스
- `_dashboard/js/components/calendar.js` - Google 이벤트 렌더링 통합
- `api/main.py` - 라우터 등록

**결과**:
- API 서버 rebuild 완료
- 캘린더 목록/이벤트 조회 동작 확인
- LOOP Task + Google Calendar 이벤트 단일 뷰 통합 완료

**최종 상태**: done

---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[tsk-dashboard-ux-v1-24]] - 의존 Task (OAuth)
- `public/_dashboard/js/components/calendar.js`
- Google Calendar API: https://developers.google.com/calendar/api

---

**Created**: 2026-01-06
**Assignee**: 김은향
