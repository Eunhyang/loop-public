---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-37"
entity_name: "Dashboard - 캘린더뷰 Google 이벤트 최상단 표시"
created: 2026-01-06
updated: 2026-01-06
status: doing

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-37"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-06
due: 2026-01-06
priority: medium
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 분류 ===
tags: [dashboard, calendar, google, ux, sort]
priority_flag: medium
---

# Dashboard - 캘린더뷰 Google 이벤트 최상단 표시

> Task ID: `tsk-dashboard-ux-v1-37` | Project: `prj-dashboard-ux-v1` | Status: doing

## 목표

**완료 조건**:
1. 캘린더 뷰에서 Google Calendar 이벤트가 LOOP Task보다 상단에 표시
2. 동일 시간대 이벤트 정렬 순서: Google 이벤트 → LOOP Task
3. 사용자가 시각적으로 외부 일정을 먼저 인지할 수 있도록 개선

---

## 상세 내용

### 배경

현재 Dashboard 캘린더에서 Google Calendar 이벤트와 LOOP Task가 함께 표시되지만, 정렬 순서가 명확하지 않아 외부 일정(Google Calendar)을 놓치기 쉽습니다. 사용자 피드백에 따라 Google 이벤트를 최상단에 표시하여 외부 일정을 먼저 확인할 수 있도록 개선이 필요합니다.

### 작업 내용

1. **FullCalendar 이벤트 정렬 설정**
   - `eventOrder` 옵션 활용
   - Google 이벤트에 우선순위 부여

2. **이벤트 렌더링 순서 조정**
   - `calendar.js`의 이벤트 소스 로직 검토
   - Google 이벤트에 `order` 속성 추가 (낮은 값 = 상단 표시)

3. **시각적 피드백**
   - Google 이벤트가 상단에 표시되는 것을 확인할 수 있는 테스트 케이스

---

## 체크리스트

- [ ] FullCalendar `eventOrder` 설정 확인
- [ ] Google 이벤트에 `order` 속성 추가
- [ ] 이벤트 렌더링 순서 테스트
- [ ] 다양한 뷰(주간, 월간)에서 정렬 확인
- [ ] 브라우저 테스트

---

## Notes

### PRD (Product Requirements Document)

#### 📊 아키텍처 도식

```
┌─────────────────────────────────────────────────────────────────┐
│              Google Events Top Display Architecture              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ UI Layer (_dashboard/js/components/calendar.js)          │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  FullCalendar Instance                                    │   │
│  │       │                                                   │   │
│  │       ├─→ eventSources (순서 결정)                        │   │
│  │       │    ├─ [1] google (extendedProps.order: 0)        │   │
│  │       │    └─ [2] loop (extendedProps.order: 1)          │   │
│  │       │                                                   │   │
│  │       └─→ eventOrder: ['order', 'start']                 │   │
│  │            (order 우선, start 시간 보조)                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│       │                                                          │
│       ↓                                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Event Rendering Layer                                     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Google Event (order: 0) ──→ 최상단 렌더링              │   │
│  │  LOOP Task (order: 1)    ──→ 하단 렌더링                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 프로젝트 컨텍스트

- **Framework**: FullCalendar v6.x (Vanilla JS)
- **Architecture**: Calendar Component Pattern
- **State Management**: Calendar 객체의 인스턴스 상태
- **Key Libraries**: FullCalendar
- **Existing Features**: Google Calendar 연동, LOOP Task 캘린더 뷰

#### 구현 범위

##### 주요 기능
1. Google Calendar 이벤트를 LOOP Task보다 시각적으로 위에 표시
2. 동일 시간대 이벤트 정렬 순서 제어
3. 기존 기능 호환성 유지 (드래그, 클릭, 편집)

##### 파일 구조
```
public/_dashboard/
├── js/components/calendar.js  # 수정 대상 (eventOrder 설정)
└── css/calendar.css           # (필요 시) 스타일 조정
```

#### 상세 요구사항

##### 1. FullCalendar eventOrder 옵션 추가
- **위치**: `calendar.js` - `init()` 메서드의 FullCalendar 초기화 블록
- **목적**: 이벤트 렌더링 순서 제어
- **구현 내용**:
  - `eventOrder: ['order', 'start']` 옵션 추가 (order 필드 우선, start 시간 보조)
  - eventOrder는 FullCalendar의 표준 옵션으로, 이벤트 객체의 extendedProps.order 값 기준 정렬
- **기존 패턴 따르기**: 기존 init() 메서드 내 옵션 구조 유지

##### 2. Google 이벤트에 order 속성 부여
- **위치**: `calendar.js` - `loadGoogleEvents()` 메서드
- **목적**: Google 이벤트에 우선순위 부여
- **구현 내용**:
  - Google 이벤트 객체 변환 시 `extendedProps.order: 0` 추가
  - 낮은 order 값 = 더 높은 우선순위 (최상단 표시)
- **기존 패턴 따르기**: extendedProps 구조 유지 (source, calendarId, calendarName 등)

##### 3. LOOP Task 이벤트에 order 속성 부여
- **위치**: `calendar.js` - `getEvents()` 메서드
- **목적**: LOOP Task 이벤트에 낮은 우선순위 부여
- **구현 내용**:
  - LOOP Task 이벤트 객체 변환 시 `extendedProps.order: 1` 추가
  - 높은 order 값 = 더 낮은 우선순위 (Google 이벤트 아래 표시)
- **기존 패턴 따르기**: 기존 extendedProps 구조 유지

#### Tech Spec

##### FullCalendar eventOrder 동작 원리
```javascript
// eventOrder: ['order', 'start']
// - 첫 번째 기준: order 필드 (낮은 값이 위)
// - 두 번째 기준: start 시간 (같은 order면 시간순)
```

##### 구현 코드 예시

**1. init() 메서드 수정 (eventOrder 옵션 추가)**
```javascript
this.instance = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'ko',
    // ... 기존 옵션
    eventOrder: ['order', 'start'],  // 🆕 추가: order 우선, start 보조
    // ...
});
```

**2. loadGoogleEvents() 수정 (Google 이벤트에 order: 0)**
```javascript
const events = data.events.map(event => ({
    id: `gcal_${event.id}`,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    backgroundColor: calendar.color,
    editable: false,
    extendedProps: {
        source: 'google',
        calendarId: event.calendarId,
        calendarName: calendar.summary,
        order: 0  // 🆕 추가: Google 이벤트 우선순위 최상
    }
}));
```

**3. getEvents() 수정 (LOOP Task에 order: 1)**
```javascript
const events = filteredTasks.map(task => ({
    id: task.entity_id,
    title: task.entity_name,
    start: task.start_date || task.due,
    end: this.getEndDateForCalendar(task.due),
    backgroundColor: this.getColorByProject(task.project_id),
    extendedProps: {
        task: task,
        order: 1  // 🆕 추가: LOOP Task 우선순위 하위
    }
}));
```

#### 성공 기준

- [ ] FullCalendar에 `eventOrder: ['order', 'start']` 옵션 추가
- [ ] Google 이벤트에 `extendedProps.order: 0` 추가
- [ ] LOOP Task 이벤트에 `extendedProps.order: 1` 추가
- [ ] 동일 시간대에서 Google 이벤트가 LOOP Task 위에 표시
- [ ] 기존 기능 유지 (이벤트 클릭, 드래그, 편집)
- [ ] 주간뷰/월간뷰 모두에서 정렬 적용 확인
- [ ] 브라우저 테스트 (Chrome, Safari)

#### 확인 사항

- eventOrder는 FullCalendar의 표준 옵션이므로 추가 라이브러리 불필요
- order 값은 낮을수록 우선순위 높음 (0 < 1)
- extendedProps는 FullCalendar의 커스텀 속성 저장 공간

### Todo
- [x] PRD/Tech Spec 작성 완료
- [x] calendar.js - init() 메서드에 eventOrder 옵션 추가
- [x] calendar.js - loadGoogleEvents()에서 order: 0 추가
- [x] calendar.js - getEvents()에서 order: 1 추가
- [ ] 브라우저에서 동작 확인 (동일 시간대 이벤트 정렬 테스트)
- [ ] 주간뷰/월간뷰 모두 확인
- [ ] 빌드 확인

### 작업 로그

#### 2026-01-06

**개요**: Google Calendar 이벤트를 LOOP Task보다 상단에 표시하는 기능 구현 완료. FullCalendar의 eventOrder 옵션과 order 필드를 활용하여 이벤트 렌더링 순서 제어.

**변경사항**:
- 개발: `calendar.js` line 132 - eventOrder 옵션 추가 (`['order', 'start', 'duration', 'allDay', 'title']`)
- 개발: `calendar.js` lines 381-385 - Google 이벤트에 order: 0 추가 (map 함수)
- 개발: `calendar.js` line 810 - LOOP Task 이벤트에 order: 1 추가

**핵심 코드**:

1. FullCalendar eventOrder 설정:
```javascript
eventOrder: ['order', 'start', 'duration', 'allDay', 'title'],  // order 우선, 나머지는 기본 정렬
```

2. Google 이벤트 매핑:
```javascript
this.googleEventsCache = (data.events || []).map(event => ({
    ...event,
    order: 0  // Google 이벤트 우선순위 최상
}));
```

3. LOOP Task 이벤트:
```javascript
order: 1,  // LOOP Task 우선순위 하위 (Google 이벤트 아래)
```

**Codex 리뷰 피드백**:
- Issue 1: 초기 `eventOrder: 'order'` 설정은 동일 order 값 내에서 시간순 정렬이 불가능했음
- Fix 1: `eventOrder: ['order', 'start']`로 변경하여 order 우선, start 시간 보조 정렬 적용
- Issue 2: start만으로는 all-day vs timed events, duration 차이 등에서 불안정한 정렬 가능
- Fix 2: `eventOrder: ['order', 'start', 'duration', 'allDay', 'title']`로 확장하여 FullCalendar 기본 정렬 동작 유지

**결과**: ✅ 구현 완료, Codex 리뷰 통과, 브라우저 테스트 대기

**다음 단계**:
- 브라우저에서 실제 동작 확인 (Google 이벤트 + LOOP Task 동시 표시 시나리오)
- 월간뷰/주간뷰에서 정렬 순서 검증

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

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[tsk-dashboard-ux-v1-25]] - Google Calendar 연동 (선행 작업)
- `public/_dashboard/js/components/calendar.js`

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
