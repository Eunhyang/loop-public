---
entity_type: Task
entity_id: tsk-022-16
entity_name: Dashboard - Google Calendar 날짜 형식 400 에러 수정
created: 2026-01-07
updated: 2026-01-07
closed: 2026-01-07
project_id: prj-dashboard-ux-v1
assignee: 김은향
status: done
start_date: 2026-01-07
due: 2026-01-07
priority: high
type: dev
target_project: loop
aliases:
- tsk-022-16
- Dashboard Google Calendar 날짜 형식 400 에러 수정
outgoing_relations: []
tags:
- task
- dashboard
- bugfix
- google-calendar
- api
---

# Dashboard - Google Calendar 날짜 형식 400 에러 수정

> Task ID: `tsk-022-16` | Project: [[prj-dashboard-ux-v1]] | Status: done

## Notes

### PRD (Product Requirements Document)

#### 1. 문제 정의

**현상:**
- 대시보드 캘린더뷰에서 Google Calendar 이벤트 로드 시 400 Bad Request 에러 발생
- 콘솔에서 `Maximum call stack size exceeded` 에러 동시 발생 (무한 재시도로 인함)

**재현 경로:**
1. Dashboard → 캘린더뷰
2. Google 계정 연결된 상태에서 날짜 이동 (월간뷰 네비게이션)
3. `/api/google/events` API가 400 에러 반환

**에러 로그 (Docker logs):**
```
GET /api/google/events?start=2025-12-28T00:00:00+09:00&end=...
→ 400 Bad Request

GET /api/google/events?start=2025-12-27&end=...
→ 200 OK
```

#### 2. 원인 분석

**근본 원인:** FullCalendar `onDatesSet` 콜백의 날짜 형식

FullCalendar의 `info.startStr`, `info.endStr`은 ISO 8601 형식으로 전달:
```
2025-12-28T00:00:00+09:00
```

그러나 API의 `/api/google/events` 엔드포인트는 `YYYY-MM-DD` 형식을 기대:
```
2025-12-28
```

**코드 위치:**
- `_dashboard/js/components/calendar.js` 라인 176:
  ```javascript
  this.loadGoogleEvents(info.startStr, info.endStr);
  ```
- 라인 372:
  ```javascript
  `/api/google/events?start=${start}&end=${end}&calendar_ids=...`
  ```

**API 서버 측 (google_accounts.py):**
- `start`, `end` 파라미터를 `datetime.strptime(start, '%Y-%m-%d')`로 파싱
- ISO 형식 전달 시 파싱 실패 → 400 Bad Request

#### 3. 해결 방안

**Option A (권장): 클라이언트 측 날짜 형식 정규화**
- `loadGoogleEvents()` 함수 진입부에서 ISO 형식을 `YYYY-MM-DD`로 변환
- 기존 API 호환성 유지

```javascript
async loadGoogleEvents(start, end) {
    // ISO 형식(2025-12-28T00:00:00+09:00)을 YYYY-MM-DD로 변환
    const startDate = start.split('T')[0];
    const endDate = end.split('T')[0];

    // ...기존 로직에서 startDate, endDate 사용
}
```

**Option B: 서버 측 날짜 파싱 유연화**
- API에서 ISO 형식과 YYYY-MM-DD 모두 허용
- `dateutil.parser.parse()` 또는 `fromisoformat()` 사용

**권장 방안: Option A**
- 변경 범위 최소화 (클라이언트 1줄 수정)
- 기존 API 스펙 유지
- 다른 클라이언트 영향 없음

#### 4. Tech Spec

**수정 파일:**
- `_dashboard/js/components/calendar.js`
  - `loadGoogleEvents()` 함수 (라인 362-394)

**수정 내용:**
```javascript
async loadGoogleEvents(start, end) {
    if (this.enabledCalendars.size === 0) {
        this.googleEventsCache = [];
        this.refreshGoogleEventSource();
        return;
    }

    // tsk-022-16: ISO 형식(2025-12-28T00:00:00+09:00)을 YYYY-MM-DD로 변환
    const startDate = start.split('T')[0];
    const endDate = end.split('T')[0];

    try {
        const calendarIds = Array.from(this.enabledCalendars).join(',');
        const response = await fetch(
            `/api/google/events?start=${startDate}&end=${endDate}&calendar_ids=${encodeURIComponent(calendarIds)}`,
            { headers: API.getHeaders() }
        );
        // ... 이하 동일
    }
}
```

**검증 항목:**
- [ ] 월간뷰 네비게이션 시 Google 이벤트 정상 로드
- [ ] 주간뷰에서도 정상 동작
- [ ] 콘솔에 400 에러 없음
- [ ] Maximum call stack 에러 없음

#### 5. Todo

- [ ] `loadGoogleEvents()` 함수에 날짜 형식 변환 추가
- [ ] `/mcp-server rebuild`로 배포
- [ ] 테스트 및 검증

---

### 참고 문서

- [[tsk-019-27]] - Dashboard - Google Calendar events API 400 에러 수정 (calendar_ids 콜론 이슈 - 다른 문제)
- [[tsk-022-11]] - Dashboard - 미팅 태스크 클릭/삭제 동기화 버그 수정

---

### 작업 로그

#### 2026-01-07

**개요**: Task 완료 - Google Calendar API 날짜 형식 400 에러 수정

**수정 내용**:
1. `api/services/google_calendar.py` - ISO 형식 날짜도 허용하도록 파싱 로직 유연화
   - `dateutil.parser.parse()` 사용하여 YYYY-MM-DD와 ISO 8601 형식 모두 지원
2. `_dashboard/index.html` - 캐시 버스팅 파라미터 추가
   - calendar.js 파일에 버전 파라미터 추가하여 캐시 무효화
3. exec vault Task 파일들의 잘못된 날짜 형식(예: 20260-01-07) 수정

**결과**:
- 대시보드 캘린더뷰에서 월간/주간 네비게이션 시 Google Calendar 이벤트 정상 로드
- 400 Bad Request 에러 해결
- Maximum call stack size exceeded 에러 해결 (무한 재시도 중단)

**최종 상태**: done

---

**Created**: 2026-01-07
**Assignee**: 김은향
