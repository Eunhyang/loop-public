---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-26"
entity_name: "Dashboard - Meeting Task Google Meet 생성"
created: 2026-01-06
updated: 2026-01-06
status: doing

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-26"]

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
tags: [dashboard, google, meet, meeting, video-call]
priority_flag: high
---

# Dashboard - Meeting Task Google Meet 생성

> Task ID: `tsk-dashboard-ux-v1-26` | Project: `prj-dashboard-ux-v1` | Status: doing

## 목표

**완료 조건**:
1. type=meeting Task 생성 시 Google Meet 링크 자동 생성 옵션
2. 연결된 Google 계정 중 하나 선택 가능
3. 생성된 Meet 링크가 Task.links에 저장
4. Google Calendar에도 이벤트 자동 생성 (선택)

---

## 상세 내용

### 배경

meeting 타입 Task 생성 시 별도로 Google Meet 접속해서 링크 만드는 번거로움 제거. Task 생성과 동시에 Meet 링크 확보.

### 의존성

- `tsk-dashboard-ux-v1-24` (Google OAuth 계정 연결) 완료 후 진행

### 작업 내용

1. **Schema 확장**
   - Task에 `meeting_link` 필드 추가 (또는 links 활용)
   - Task에 `google_calendar_event_id` 필드 추가 (선택)

2. **API 엔드포인트**
   - `POST /api/google/meet/create` - Meet 링크 생성
     - 입력: title, start_time, end_time, account_id
     - 출력: meet_link, calendar_event_id

3. **Calendar API 연동**
   - events.insert() with conferenceDataVersion=1
   - conferenceData.createRequest로 Meet 자동 생성

4. **Dashboard UI (TaskModal)**
   - type=meeting 선택 시 추가 옵션 표시
   - "Google Meet 생성" 체크박스
   - 계정 선택 드롭다운
   - 생성 후 링크 표시 및 복사 버튼

---

## 체크리스트

- [x] Schema: Task.links 필드 활용 (meeting_link 별도 필드 대신)
- [x] API `POST /api/google/meet` 엔드포인트
- [x] Calendar API events.insert with conferenceData
- [x] TaskModal UI 확장 (meeting 옵션)
- [x] 계정 선택 드롭다운
- [x] Meet 링크 복사 기능
- [x] Task 저장 시 links 필드에 Meet URL 추가
- [ ] 테스트 (API 서버 배포 후)

---

## Notes

### PRD

#### 문제 정의

현재 Meeting 타입 Task 생성 시 사용자가 별도로 Google Meet을 열어 링크를 복사하고 Task에 수동으로 붙여넣어야 한다.

**문제점:**
1. **컨텍스트 스위칭** 발생 (Dashboard → Google Meet → Dashboard)
2. **수동 복사/붙여넣기** 오류 가능성
3. **Google Calendar 연동 부재**로 일정 관리 이원화

#### 목표

| 목표 | 성공 기준 |
|------|-----------|
| 원클릭 Meet 생성 | type=meeting Task 생성 시 "Google Meet 생성" 체크박스로 링크 자동 생성 |
| 계정 선택 지원 | 연결된 Google 계정이 2개 이상일 때 드롭다운으로 선택 가능 |
| Calendar 연동 | 선택적으로 Google Calendar에 이벤트 생성, Meet 링크 포함 |
| 링크 저장 | 생성된 Meet URL이 `Task.meeting_link` 필드에 저장 |

#### 핵심 요구사항

**1. UI 컴포넌트 (TaskModal)**
- `type=meeting` 선택 시 "Google Meet 자동 생성" 섹션 표시
- Google 계정 선택 드롭다운 (연결된 계정 목록)
- "Google Calendar에 일정 추가" 체크박스 (기본값: checked)
- 생성된 Meet 링크 표시 및 복사 버튼

**2. API 엔드포인트**
```
POST /api/google/meet
- Input: { account_id, title, start_time?, duration_minutes? }
- Output: { meet_link, calendar_event_id? }
```

**3. 데이터 모델**
- Task 스키마에 `meeting_link: string` 필드 추가
- Task 스키마에 `calendar_event_id: string` 필드 추가

#### 기술 설계

**TaskModal UI**

```
┌─────────────────────────────────────────────────────┐
│  ☑ Google Meet 자동 생성                            │
│  ┌─────────────────────────────────────┐            │
│  │ 계정 선택: [work@gmail.com     ▼]  │            │
│  └─────────────────────────────────────┘            │
│  ☑ Google Calendar에 일정 추가                      │
│  ┌─────────────────────────────────────┐            │
│  │ 📅 시작: [2026-01-10] [14:00]      │            │
│  │ ⏱ 시간: [60분            ▼]        │            │
│  └─────────────────────────────────────┘            │
└─────────────────────────────────────────────────────┘
```

**Google Calendar API 호출**

```javascript
const event = {
  summary: taskTitle,
  start: { dateTime: startTime },
  end: { dateTime: endTime },
  conferenceData: {
    createRequest: {
      requestId: `task-${taskId}`,
      conferenceSolutionKey: { type: 'hangoutsMeet' }
    }
  }
};

calendar.events.insert({
  calendarId: 'primary',
  conferenceDataVersion: 1,
  resource: event
});
// → event.hangoutLink에 Meet URL 반환
```

#### 의존성

| 의존성 | 상태 | 설명 |
|--------|------|------|
| tsk-dashboard-ux-v1-24 (Google OAuth) | **필수 선행** | 계정 연결 및 토큰 관리 |
| Google Calendar API | 외부 | `calendar.events.insert` 권한 필요 |
| OAuth Scope | 설정 필요 | `calendar.events` scope 추가 |

---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[tsk-dashboard-ux-v1-24]] - 의존 Task (OAuth)
- `public/_dashboard/js/components/task-modal.js`
- Google Calendar API conferenceData: https://developers.google.com/calendar/api/guides/create-events#conferencing

---

### Implementation Summary (2026-01-06)

#### Files Created
1. **`api/services/google_calendar.py`**
   - `create_meet_event()`: Google Calendar API로 Meet 링크 생성
   - conferenceDataVersion=1로 Meet 자동 생성
   - 에러 핸들링, 로깅 포함

#### Files Modified
1. **`api/routers/google_accounts.py`**
   - `POST /api/google/meet` 엔드포인트 추가
   - MeetCreateRequest/MeetCreateResponse Pydantic 모델

2. **`_dashboard/js/api.js`**
   - `getGoogleAccounts()`: 연결된 Google 계정 목록 조회
   - `createGoogleMeet(options)`: Meet 링크 생성 API 호출

3. **`_dashboard/js/components/task-modal.js`**
   - `init()`: 이벤트 리스너 초기화
   - `handleTypeChange()`: type=meeting 선택 시 Meet 옵션 표시
   - `loadGoogleAccounts()`: 계정 목록 로드
   - `generateMeetLink()`: Meet 링크 생성
   - Task 저장 시 links 필드에 Meet URL 추가

4. **`_dashboard/index.html`**
   - Task Type 선택 (dev/meeting/doc/design/review/research/other)
   - Duration 선택 (30/60/90/120분)
   - Meeting Options 섹션 (Google Meet 생성 체크박스, 계정 선택, 시간 입력)

5. **`_dashboard/css/modal.css`**
   - .meeting-options 스타일
   - .meet-link-result 스타일

6. **`_dashboard/js/app.js`**
   - `TaskModal.init()` 호출 추가

#### Data Flow
1. User selects type=meeting in TaskModal
2. Meeting options section appears
3. User checks "Google Meet" and selects account
4. On save: API.createGoogleMeet() creates Calendar event with Meet
5. Meet link stored in Task.links array as `{label: "Google Meet", url: "..."}`

---

**Created**: 2026-01-06
**Assignee**: 김은향
