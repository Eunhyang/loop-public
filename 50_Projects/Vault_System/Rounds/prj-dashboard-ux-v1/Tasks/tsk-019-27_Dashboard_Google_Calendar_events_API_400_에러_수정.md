---
entity_type: Task
entity_id: tsk-019-27
entity_name: Dashboard - Google Calendar events API 400 에러 수정
created: 2026-01-06
updated: '2026-01-12'
status: done
parent_id: prj-dashboard-ux-v1
project_id: prj-dashboard-ux-v1
aliases:
- tsk-019-27
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
start_date: '2026-01-06'
due: '2026-01-12'
priority: high
estimated_hours: null
actual_hours: null
type: bug
target_project: loop
tags:
- dashboard
- google-calendar
- api
- bug
priority_flag: high
notes: "# Dashboard - Google Calendar events API 400 에러 수정\n\n> Task ID: `tsk-019-27`\
  \ | Project: `prj-dashboard-ux-v1` | Status: doing\n\n## 목표\n\n**완료 조건**:\n1. `/api/google/events`\
  \ 호출 시 400 Bad Request 에러 해결\n2. 캘린더 ID 파라미터 형식 정상 처리\n\n---\n\n## 상세 내용\n\n###\
  \ 문제 현상\n\n```\nGET /api/google/events?calendar_ids=1:help@kkokkkok.app,2:eunhyang90218@gmail.com\n\
  → 400 Bad Request\n```\n\n### 배경\n\n- 클라이언트 (`calendar.js`)에서 calendar_ids를 `{account_id}:{calendar_email}`\
  \ 형식으로 보냄\n- 서버 (`google_accounts.py`)에서 파싱 시 `int(acc_id_str)` 변환에서 문제 발생 가능\n\n\
  ### 분석 결과\n\n**클라이언트 코드 (calendar.js:193, 231-233):**\n```javascript\n// 캘린더 키 형식:\
  \ {account_id}:{calendar_id}\nconst calKey = `${cal.account_id}:${cal.id}`;\n\n\
  // API 호출\nconst calendarIds = Array.from(this.enabledCalendars).join(',');\nconst\
  \ response = await fetch(\n    `/api/google/events?start=${start}&end=${end}&calendar_ids=${encodeURIComponent(calendarIds)}`,\n\
  \    { headers: API.getHeaders() }\n);\n```\n\n**서버 코드 (google_accounts.py:633-645):**\n\
  ```python\nfor cal_spec in cal_id_list:\n    if \":\" in cal_spec:\n        try:\n\
  \            acc_id_str, _ = cal_spec.split(\":\", 1)\n            acc_id = int(acc_id_str)\n\
  \            if acc_id not in account_ids:\n                raise HTTPException(status_code=403,\
  \ ...)\n        except ValueError:\n            raise HTTPException(status_code=400,\
  \ detail=f\"Invalid calendar ID format: {cal_spec}\")\n```\n\n### 가능한 원인\n\n1. **URL\
  \ 인코딩 문제**: `encodeURIComponent`로 인코딩된 콜론(`:`)이 서버에서 제대로 디코딩되지 않을 수 있음\n2. **account_id가\
  \ 정수가 아닌 경우**: 서버에서 `int()` 변환 실패\n3. **빈 문자열 처리**: calendar_ids 파라미터가 비어있거나 잘못된\
  \ 형식\n\n---\n\n## Tech Spec\n\n### 프레임워크/라이브러리\n- **Backend**: FastAPI (Python)\n\
  - **Frontend**: Vanilla JavaScript\n- **관련 파일**:\n  - `api/routers/google_accounts.py`\
  \ (라인 571-670)\n  - `api/services/google_calendar.py` (라인 557-623)\n  - `_dashboard/js/components/calendar.js`\
  \ (라인 220-251)\n\n### 디버깅 전략\n\n1. **서버 로깅 추가**: `calendar_ids` 파라미터 원본 값 로깅\n2.\
  \ **에러 메시지 개선**: 어떤 값이 파싱 실패했는지 명확히\n3. **방어적 코딩**: 빈 문자열, 잘못된 형식 처리\n\n### 수정 방안\n\
  \n**Option A: 서버 측 에러 핸들링 개선**\n- `calendar_ids` 파싱 전 값 검증\n- 상세한 에러 메시지 반환\n\n\
  **Option B: 클라이언트 측 방어 코드**\n- 빈 calendar_ids 체크\n- 형식 검증 후 API 호출\n\n---\n\n##\
  \ 체크리스트\n\n- [x] 서버 로그로 실제 `calendar_ids` 값 확인\n- [x] 파싱 로직에서 정확한 에러 위치 파악\n- [x]\
  \ 수정 코드 구현\n- [ ] 테스트 (캘린더 선택 후 이벤트 로드)\n- [ ] 배포\n\n---\n\n## Notes\n\n### Todo\n\
  - [x] 서버에서 calendar_ids 파라미터 로깅\n- [x] int() 변환 실패 케이스 확인\n- [x] 수정 코드 작성\n\n###\
  \ 작업 로그\n\n#### 2026-01-06 18:45\n**개요**: calendar_ids URL 파라미터에서 콜론(:) 구분자가 NAS\
  \ reverse proxy에서 URL 파싱 문제를 일으켜 400 에러 발생. 구분자를 이중 밑줄(__)로 변경.\n\n**근본 원인**:\n\
  - Synology NAS reverse proxy가 URL에서 콜론(:)을 포트 구분자로 해석\n- `1:help@kkokkkok.app` 형식이\
  \ 잘못된 URL로 처리됨\n\n**변경사항**:\n- Backend (`api/routers/google_accounts.py`):\n  -\
  \ 구분자 감지 로직을 regex 기반으로 변경: `^\\d+__` (새 형식), `^\\d+:` (구 형식)\n  - 백워드 호환성 유지 (두\
  \ 형식 모두 지원)\n- Backend (`api/services/google_calendar.py`):\n  - 동일한 파싱 로직 적용\n\
  - Frontend (`_dashboard/js/components/calendar.js`):\n  - calKey 형식을 `${account_id}__${calendar_id}`로\
  \ 변경\n  - `loadEnabledCalendars()`에 마이그레이션 로직 추가 (구 형식 -> 새 형식)\n\n**Codex 리뷰 반영**:\n\
  - calendar_id에 `__`가 포함된 경우를 대비해 단순 `includes()` 대신 regex 패턴 매칭으로 변경\n- `^\\d+__`\
  \ 패턴으로 새 형식을 우선 감지\n\n**결과**: 빌드 대기 (로컬 수정 완료)\n\n#### 2026-01-06 19:30\n**개요**:\
  \ 추가 버그 발견 및 수정\n\n**발견된 버그**:\n- `disconnectAccount()` 함수에서 여전히 구 형식(콜론)을 사용\n\
  - 계정 연결 해제 시 enabledCalendars에서 해당 계정의 캘린더를 찾지 못하는 문제\n\n**변경사항**:\n- Frontend (`_dashboard/js/components/calendar.js`):\n\
  \  - 647행: `accountId + ':'` → `accountId + '__'` 변경\n  - 주석 추가로 변경 이유 명확화\n\n**코드\
  \ 리뷰**:\n- 구 형식 사용 위치 전체 검색 완료\n- 더 이상 콜론 구분자 사용하는 곳 없음 확인\n\n**결과**: 빌드 및 배포 필요\
  \ (`/mcp-server rebuild`)\n\n---\n\n## 참고 문서\n\n- [[prj-dashboard-ux-v1]] - 소속 Project\n\
  - [[tsk-dashboard-ux-v1-25]] - Dashboard - 캘린더 Google Calendar 연동\n- [[tsk-dashboard-ux-v1-29]]\
  \ - Dashboard - Google Calendar 연동 버그 수정\n\n---\n\n**Created**: 2026-01-06\n**Assignee**:\
  \ 김은향\n**Due**: 2026-01-06\n"
---
# Dashboard - Google Calendar events API 400 에러 수정

> Task ID: `tsk-019-27` | Project: `prj-dashboard-ux-v1` | Status: doing

## 목표

**완료 조건**:
1. `/api/google/events` 호출 시 400 Bad Request 에러 해결
2. 캘린더 ID 파라미터 형식 정상 처리

---

## 상세 내용

### 문제 현상

```
GET /api/google/events?calendar_ids=1:help@kkokkkok.app,2:eunhyang90218@gmail.com
→ 400 Bad Request
```

### 배경

- 클라이언트 (`calendar.js`)에서 calendar_ids를 `{account_id}:{calendar_email}` 형식으로 보냄
- 서버 (`google_accounts.py`)에서 파싱 시 `int(acc_id_str)` 변환에서 문제 발생 가능

### 분석 결과

**클라이언트 코드 (calendar.js:193, 231-233):**
```javascript
// 캘린더 키 형식: {account_id}:{calendar_id}
const calKey = `${cal.account_id}:${cal.id}`;

// API 호출
const calendarIds = Array.from(this.enabledCalendars).join(',');
const response = await fetch(
    `/api/google/events?start=${start}&end=${end}&calendar_ids=${encodeURIComponent(calendarIds)}`,
    { headers: API.getHeaders() }
);
```

**서버 코드 (google_accounts.py:633-645):**
```python
for cal_spec in cal_id_list:
    if ":" in cal_spec:
        try:
            acc_id_str, _ = cal_spec.split(":", 1)
            acc_id = int(acc_id_str)
            if acc_id not in account_ids:
                raise HTTPException(status_code=403, ...)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid calendar ID format: {cal_spec}")
```

### 가능한 원인

1. **URL 인코딩 문제**: `encodeURIComponent`로 인코딩된 콜론(`:`)이 서버에서 제대로 디코딩되지 않을 수 있음
2. **account_id가 정수가 아닌 경우**: 서버에서 `int()` 변환 실패
3. **빈 문자열 처리**: calendar_ids 파라미터가 비어있거나 잘못된 형식

---

## Tech Spec

### 프레임워크/라이브러리
- **Backend**: FastAPI (Python)
- **Frontend**: Vanilla JavaScript
- **관련 파일**:
  - `api/routers/google_accounts.py` (라인 571-670)
  - `api/services/google_calendar.py` (라인 557-623)
  - `_dashboard/js/components/calendar.js` (라인 220-251)

### 디버깅 전략

1. **서버 로깅 추가**: `calendar_ids` 파라미터 원본 값 로깅
2. **에러 메시지 개선**: 어떤 값이 파싱 실패했는지 명확히
3. **방어적 코딩**: 빈 문자열, 잘못된 형식 처리

### 수정 방안

**Option A: 서버 측 에러 핸들링 개선**
- `calendar_ids` 파싱 전 값 검증
- 상세한 에러 메시지 반환

**Option B: 클라이언트 측 방어 코드**
- 빈 calendar_ids 체크
- 형식 검증 후 API 호출

---

## 체크리스트

- [x] 서버 로그로 실제 `calendar_ids` 값 확인
- [x] 파싱 로직에서 정확한 에러 위치 파악
- [x] 수정 코드 구현
- [ ] 테스트 (캘린더 선택 후 이벤트 로드)
- [ ] 배포

---

## Notes

### Todo
- [x] 서버에서 calendar_ids 파라미터 로깅
- [x] int() 변환 실패 케이스 확인
- [x] 수정 코드 작성

### 작업 로그

#### 2026-01-06 18:45
**개요**: calendar_ids URL 파라미터에서 콜론(:) 구분자가 NAS reverse proxy에서 URL 파싱 문제를 일으켜 400 에러 발생. 구분자를 이중 밑줄(__)로 변경.

**근본 원인**:
- Synology NAS reverse proxy가 URL에서 콜론(:)을 포트 구분자로 해석
- `1:help@kkokkkok.app` 형식이 잘못된 URL로 처리됨

**변경사항**:
- Backend (`api/routers/google_accounts.py`):
  - 구분자 감지 로직을 regex 기반으로 변경: `^\d+__` (새 형식), `^\d+:` (구 형식)
  - 백워드 호환성 유지 (두 형식 모두 지원)
- Backend (`api/services/google_calendar.py`):
  - 동일한 파싱 로직 적용
- Frontend (`_dashboard/js/components/calendar.js`):
  - calKey 형식을 `${account_id}__${calendar_id}`로 변경
  - `loadEnabledCalendars()`에 마이그레이션 로직 추가 (구 형식 -> 새 형식)

**Codex 리뷰 반영**:
- calendar_id에 `__`가 포함된 경우를 대비해 단순 `includes()` 대신 regex 패턴 매칭으로 변경
- `^\d+__` 패턴으로 새 형식을 우선 감지

**결과**: 빌드 대기 (로컬 수정 완료)

#### 2026-01-06 19:30
**개요**: 추가 버그 발견 및 수정

**발견된 버그**:
- `disconnectAccount()` 함수에서 여전히 구 형식(콜론)을 사용
- 계정 연결 해제 시 enabledCalendars에서 해당 계정의 캘린더를 찾지 못하는 문제

**변경사항**:
- Frontend (`_dashboard/js/components/calendar.js`):
  - 647행: `accountId + ':'` → `accountId + '__'` 변경
  - 주석 추가로 변경 이유 명확화

**코드 리뷰**:
- 구 형식 사용 위치 전체 검색 완료
- 더 이상 콜론 구분자 사용하는 곳 없음 확인

**결과**: 빌드 및 배포 필요 (`/mcp-server rebuild`)

---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[tsk-dashboard-ux-v1-25]] - Dashboard - 캘린더 Google Calendar 연동
- [[tsk-dashboard-ux-v1-29]] - Dashboard - Google Calendar 연동 버그 수정

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
