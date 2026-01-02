---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-17"
entity_name: "Dashboard - Google Calendar 연동 (읽기 전용)"
created: 2025-12-29
updated: 2025-12-29
status: doing

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-17"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2025-12-29
due: 2025-12-29
priority: medium
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===
# === 분류 ===
tags: [dashboard, calendar, google, integration]
priority_flag: medium
---

# Dashboard - Google Calendar 연동 (읽기 전용)

> Task ID: `tsk-dashboard-ux-v1-17` | Project: `prj-dashboard-ux-v1` | Status: doing

## 목표

Dashboard 캘린더 뷰에서 Google Calendar 일정을 읽기 전용으로 함께 표시

**완료 조건**:
1. Google Calendar 일정이 FullCalendar에 LOOP Task와 함께 표시됨
2. Google 일정은 읽기 전용 (드래그 불가)
3. Vault에는 아무런 파일도 생성되지 않음 (순수 뷰 레벨)

---

## 상세 내용

### 배경

- Dashboard는 FullCalendar 라이브러리를 사용해 Task를 캘린더 뷰로 표시
- FullCalendar는 Google Calendar Plugin을 공식 지원
- 사용자가 개인 일정(Google)과 업무 일정(LOOP Task)을 한 눈에 보고 싶어함

### 작업 내용

1. FullCalendar Google Calendar Plugin 추가
2. Google Calendar API Key 설정
3. calendar.js에 Google Calendar eventSource 추가
4. Google 일정은 읽기 전용으로 설정 (editable: false)

---

## 체크리스트

- [ ] Google Calendar Plugin CDN 추가 (index.html)
- [ ] API Key 환경변수/설정 구조 결정
- [ ] calendar.js eventSources 배열 구성
- [ ] Google 일정 스타일 구분 (다른 색상/아이콘)
- [ ] 에러 처리 (API 실패 시 graceful degradation)

---

## Notes

### PRD (Product Requirements Document)

#### 1. 프로젝트 컨텍스트
- **Framework**: Vanilla JavaScript (ES6+)
- **Calendar Library**: FullCalendar 6.1.10 (CDN)
- **Architecture**: Component-based (Calendar, Kanban, Graph views)
- **State Management**: Custom State object (js/state.js)

#### 2. 기능 요구사항

**핵심 기능**:
1. **Google Calendar 일정 표시**: Google Calendar의 일정을 FullCalendar에 함께 표시
2. **읽기 전용 동작**: Google Calendar 일정은 드래그 불가, 클릭 시 정보만 표시
3. **Vault 무영향**: 순수 뷰 레벨, Vault에 어떤 파일도 생성/수정하지 않음

**사용자 경험**:
- Google 일정과 LOOP Task가 동일 캘린더에서 한눈에 확인 가능
- 시각적으로 명확하게 구분 (색상, 테두리)
- 로딩 실패 시 graceful degradation (에러 표시 후 LOOP Task만 표시)

#### 3. 비기능 요구사항
- **성능**: Google Calendar API 호출 최소화 (캐싱)
- **보안**: API Key는 브라우저에 노출됨 (Public API Key), 공개 캘린더만 지원
- **호환성**: 기존 Calendar 기능 유지, Dark mode 지원

#### 4. 성공 기준
| # | 기준 | 검증 방법 |
|---|------|----------|
| 1 | Google Calendar 일정이 LOOP Task와 함께 표시됨 | 캘린더 뷰에서 확인 |
| 2 | Google 일정은 읽기 전용 (드래그 불가) | 드래그 시도 테스트 |
| 3 | Vault에 파일 생성 없음 | git status 확인 |
| 4 | 기존 LOOP Task 기능 정상 동작 | 드래그/클릭 테스트 |
| 5 | Google 로드 실패 시 에러 핸들링 | 잘못된 ID로 테스트 |

---

### Tech Spec

#### 1. 아키텍처 개요

```
index.html
  └── <script> FullCalendar Google Calendar Plugin (CDN)

calendar.js (수정)
  ├── GOOGLE_CALENDAR_CONFIG (새 상수)
  ├── init() - Google Calendar 이벤트 소스 추가
  ├── getGoogleCalendarEventSource() (신규)
  ├── onEventClick() 수정 (Google 이벤트 분기)
  └── refresh() 수정 (Google 소스 유지)

calendar.css (수정)
  └── .fc-event.google-event (신규 스타일)
```

#### 2. 파일 변경 요약

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `index.html` | 수정 | Google Calendar Plugin CDN 추가 |
| `js/components/calendar.js` | 수정 | Google Calendar 통합 로직 추가 |
| `css/calendar.css` | 수정 | Google 이벤트 스타일 추가 |

#### 3. 핵심 구현

**2.1 index.html - Plugin CDN 추가**
```html
<script src="https://cdn.jsdelivr.net/npm/@fullcalendar/google-calendar@6.1.10/index.global.min.js"></script>
```

**2.2 calendar.js - 설정 상수**
```javascript
GOOGLE_CALENDAR_CONFIG: {
    apiKey: 'AIzaSyDhdIFvqgVcnOCsp2vkG_KC5nD7cBawkAk',
    calendarId: 'YOUR_GOOGLE_CALENDAR_ID@group.calendar.google.com',
    color: '#4285F4',  // Google Blue
    textColor: '#FFFFFF',
    className: 'google-event'
},
```

**2.3 calendar.js - Google 이벤트 소스**
```javascript
getGoogleCalendarEventSource() {
    return {
        googleCalendarId: this.GOOGLE_CALENDAR_CONFIG.calendarId,
        className: this.GOOGLE_CALENDAR_CONFIG.className,
        color: this.GOOGLE_CALENDAR_CONFIG.color,
        editable: false,           // 드래그 불가
        durationEditable: false,   // 리사이즈 불가
        failure: (error) => showToast('Google Calendar 로드 실패', 'warning')
    };
}
```

**2.4 calendar.js - init() 수정**
- `events` → `eventSources` 변경 (다중 소스 지원)
- `googleCalendarApiKey` 추가

**2.5 onEventClick() - Google 이벤트 분기**
```javascript
if (event.source && event.source.googleCalendarId) {
    showToast(`📅 ${event.title}\n${timeInfo}`, 'info');
    return;
}
// 기존 LOOP Task 로직
```

**2.6 calendar.css - 스타일**
```css
.fc .fc-event.google-event {
    border-left: 3px solid #1a73e8;
    cursor: default;
}
```

---

### Todo

- [ ] `index.html`에 Google Calendar Plugin CDN 추가
- [ ] `calendar.js`에 GOOGLE_CALENDAR_CONFIG 상수 추가
- [ ] `calendar.js`에 getGoogleCalendarEventSource() 메서드 추가
- [ ] `calendar.js` init() 수정 (eventSources, googleCalendarApiKey)
- [ ] `calendar.js` onEventClick() 수정 (Google 이벤트 분기)
- [ ] `calendar.js` refresh() 수정 (Google 소스 유지)
- [ ] `calendar.css`에 google-event 스타일 추가
- [ ] 실제 Google Calendar ID 설정 및 테스트
- [ ] 에러 핸들링 테스트 (잘못된 ID)
- [ ] 기존 LOOP Task 기능 회귀 테스트

---

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

**결과**: 빌드 성공 / 실패

**다음 단계**:
-->


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [FullCalendar Google Calendar Plugin](https://fullcalendar.io/docs/google-calendar)
- Google API Key: `AIzaSyDhdIFvqgVcnOCsp2vkG_KC5nD7cBawkAk`

---

**Created**: 2025-12-29
**Assignee**: 김은향
**Due**: 2025-12-29
