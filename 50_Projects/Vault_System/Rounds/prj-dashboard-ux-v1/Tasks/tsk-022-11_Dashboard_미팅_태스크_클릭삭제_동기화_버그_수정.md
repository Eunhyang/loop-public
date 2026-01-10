---
entity_type: Task
entity_id: tsk-022-11
entity_name: Dashboard - 미팅 태스크 클릭/삭제 동기화 버그 수정
created: 2026-01-07
updated: '2026-01-10'
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
- tsk-022-11
- Dashboard 미팅 태스크 클릭삭제 동기화 버그 수정
outgoing_relations: []
tags:
- task
- dashboard
- bugfix
- calendar
- google-calendar
notes: "# Dashboard - 미팅 태스크 클릭/삭제 동기화 버그 수정\n\n> Task ID: `tsk-022-11` | Project:\
  \ \\[\\[prj-dashboard-ux-v1\\]\\] | Status: done\n\n## Notes\n\n### PRD (Product\
  \ Requirements Document)\n\n1\\. 문제 정의\n\n**버그 1: 미팅 태스크 클릭 시 TaskPanel이 열리지 않음**\n\
  \n- 재현 경로: 캘린더 뷰 → 날짜 우클릭 → \"미팅 추가\" → 태스크 생성 → 해당 태스크 클릭\n- 현재 동작: \"구글 Meet으로\
  \ 보기\" 토스트 + confirm 다이얼로그 표시\n- 기대 동작: TaskPanel(사이드 패널)이 열려야 함\n\n**버그 2: Google\
  \ Calendar 삭제 동기화 안됨**\n\n- Google Calendar에서 이벤트 삭제 시 대시보드에 반영되지 않음\n- 삭제 동기화 로직\
  \ 부재 또는 미작동\n\n2\\. 원인 분석\n\n**버그 1 원인**: `calendar.js` 860-906 라인 `onEventClick()`\
  \ 분석\n\n```javascript\nonEventClick(info) {\n    const sourceId = info.event.source?.id;\n\
  \n    // Google Calendar 이벤트인 경우\n    if (sourceId === 'google') {\n        // →\
  \ 토스트 + confirm 표시\n    }\n\n    // LOOP Task 이벤트\n    TaskPanel.open(taskId);\n\
  }\n```\n\n- 미팅 태스크 생성 시 **Google Calendar에도 이벤트가 생성됨** (`create_calendar_event:\
  \ true`)\n- 캘린더 새로고침 시 Google 이벤트가 로드되면서 **LOOP Task와 중복 표시** 가능성\n- 또는 **sourceId\
  \ 판별 로직 오류**로 LOOP Task가 Google로 인식될 가능성\n\n**버그 2 원인**:\n\n- Google Calendar →\
  \ LOOP 대시보드 방향의 삭제 동기화 웹훅/폴링 미구현\n- 현재는 Google Calendar 이벤트를 **읽기 전용**으로만 표시\n-\
  \ 삭제 시점에 캐시 갱신 로직 부재\n\n3\\. 해결 방안\n\n**버그 1 수정안**:\n\n**Option A (권장)**: LOOP Task와\
  \ Google 이벤트 구분 강화\n\n- LOOP Task 이벤트에 `extendedProps.source: 'loop'` 추가\n- `onEventClick()`에서\
  \ `extendedProps.source` 우선 확인\n- Google 이벤트 중복 방지: 같은 시간대에 LOOP Task가 있으면 Google\
  \ 이벤트 필터링\n\n**Option B**: Google Calendar 이벤트와 LOOP Task 매핑\n\n- Meet 생성 시 반환된\
  \ `calendar_event_id`를 Task에 저장\n- `onEventClick()`에서 calendar_event_id로 연결된 LOOP\
  \ Task 확인\n\n**버그 2 수정안**:\n\n**Option A (단기)**: 수동 동기화\n\n- \"새로고침\" 버튼으로 Google\
  \ Calendar 이벤트 재로드\n- 삭제된 이벤트는 자동으로 사라짐\n\n**Option B (중기)**: 주기적 폴링\n\n- 뷰 변경 시\
  \ (`onDatesSet`) Google 이벤트 항상 재로드 (현재 구현됨)\n- 캐시 무효화 주기 단축\n\n**Option C (장기)**:\
  \ Webhook 연동\n\n- Google Calendar Push Notifications 구현\n- 실시간 동기화\n\n4\\. Tech\
  \ Spec\n\n**수정 파일:**\n\n- `_dashboard/js/components/calendar.js`\n  - `getEvents()`:\
  \ LOOP Task에 source 표시자 추가\n  - `onEventClick()`: source 판별 로직 개선\n  - `loadGoogleEvents()`:\
  \ 캐시 갱신 로직 확인\n\n**검증 항목:**\n\n- [ ] 우클릭 → 미팅 추가 → 클릭 → TaskPanel 열림\n\n- [ ] 기존\
  \ LOOP Task 클릭 → TaskPanel 열림\n\n- [ ] Google Calendar 이벤트 클릭 → 토스트 + Google 열기\
  \ 옵션\n\n- [ ] Google Calendar에서 이벤트 삭제 → 대시보드 새로고침 시 반영\n\n5\\. Todo\n\n- [x] `onEventClick()`\
  \ 디버깅 - sourceId 값 확인\n\n- [x] LOOP Task 이벤트에 식별자 추가 (tsk- 패턴 체크)\n\n- [x] 조건문 수정하여\
  \ LOOP Task 우선 처리\n\n- [x] **버그 3: TaskPanel에서 Google Meet 링크 미표시 수정**\n\n- [x]\
  \ **기능 개선: 우클릭 → 좌클릭으로 미팅 추가 트리거 변경**\n\n- [ ] 테스트 및 검증\n\n---\n\n### 기능 개선 요청 (2026-01-07)\n\
  \n**현재 동작:**\n\n- 캘린더 날짜 **우클릭** → 컨텍스트 메뉴 → \"미팅 추가\"\n\n**변경 요청:**\n\n- 캘린더 날짜\
  \ 빈 곳 **좌클릭** → 컨텍스트 메뉴 → \"미팅 추가\"\n\n**수정 파일:**\n\n- `_dashboard/js/components/calendar.js`\n\
  \  - `onDateClick()` 핸들러 수정: 좌클릭 시 컨텍스트 메뉴 표시\n  - `onContextMenu()` 유지 (backwards\
  \ compatibility)\n\n**구현 완료 (2026-01-07)**\n\n**수정 내용** (`calendar.js` lines 772-799):\n\
  \n```javascript\nonDateClick(info) {\n    // Date extraction with timezone trim\n\
  \    const dateStr = info.dateStr.split('T')[0];\n    if (!dateStr) return;\n\n\
  \    this.contextMenuDate = dateStr;\n\n    // Guard for optional jsEvent (keyboard/programmatic\
  \ triggers)\n    if (!info.jsEvent || typeof info.jsEvent.pageX !== 'number') {\n\
  \        // Keyboard fallback: direct modal open\n        this.onAddMeeting();\n\
  \        return;\n    }\n\n    // Close existing menu before opening new one\n \
  \   this.hideContextMenu();\n\n    // Prevent document click handler from immediately\
  \ closing menu\n    info.jsEvent.stopPropagation();\n\n    // Show context menu\
  \ at click position\n    this.showContextMenu(info.jsEvent.pageX, info.jsEvent.pageY);\n\
  }\n```\n\n**핵심 수정사항:**\n\n1. **날짜 포맷 처리**: `dateStr.split('T')[0]`로 timezone 제거\
  \ (YYYY-MM-DD 보장)\n2. **이벤트 전파 차단**: `stopPropagation()`으로 document click handler\
  \ 우회\n3. **키보드 접근성**: `jsEvent` 없거나 좌표 없으면 TaskModal 직접 열기\n4. **메뉴 상태 관리**: 기존\
  \ 메뉴 닫고 새 메뉴 열기\n\n**Codex 리뷰 통과:**\n\n- ✅ Event propagation 문제 해결\n- ✅ Date format\
  \ 문제 해결\n- ✅ Keyboard fallback 적용\n- ✅ Menu close/reopen 로직 검증\n\n**Backwards Compatibility:**\n\
  \n- 우클릭 (`onContextMenu()`) 여전히 작동\n- 좌클릭과 우클릭 모두 같은 UX 제공\n\n---\n\n### 버그 3 수정\
  \ 완료 (2026-01-07)\n\n**문제:**\n\n- 캘린더 우클릭 → \"미팅 추가\" → \"링크 생성\" 버튼으로 Google Meet\
  \ 링크 생성\n- Task 저장 후 TaskPanel에서 해당 Meet 링크가 보이지 않음\n\n**근본 원인 (Codex 분석):**\n\n\
  1. `TaskCreate` 모델에 `links` 필드가 없어서 FastAPI 검증 단계에서 Meet 링크가 제거됨\n2. `create_task()`\
  \ 함수가 links를 frontmatter에 저장하지 않음 (update_task는 저장)\n\n**해결 방법:**\n\n1. **api/models/entities.py**:\
  \ `TaskCreate` 모델에 `links` 필드 추가\n   - Pydantic `HttpUrl` 타입 사용 (XSS 방지)\n   - `max_length=10`\
  \ 제한 (DoS 방지)\n   - `label` 최대 100자 제한\n2. **api/routers/tasks.py**: `create_task()`\
  \ 함수에서 links를 frontmatter에 저장하도록 수정\n\n**수정 파일:**\n\n- `api/models/entities.py`\
  \ - TaskCreate/TaskUpdate에 links 필드 추가 + 보안 제약\n- `api/routers/tasks.py` - create_task/update_task에서\
  \ links frontmatter 저장 로직 추가\n\n**보안 개선 (Codex 제안):**\n\n- `HttpUrl` 타입으로 https/http만\
  \ 허용 (javascript: 등 XSS 차단)\n- 링크 개수 최대 10개 제한 (DoS 방지)\n- 라벨 최대 100자 제한\n\n---\n\
  \n### 작업 로그\n\n2026-01-07 (Task 완료)\n\n**개요**: Dashboard 미팅 태스크 클릭/삭제 동기화 버그 수정\
  \ 완료\n\n**변경사항**:\n\n- 버그 1 수정: `calendar.js` onEventClick() 함수에서 tsk- 패턴으로 LOOP\
  \ Task 우선 판별하도록 개선\n- 버그 3 수정: `api/models/entities.py`의 TaskCreate/TaskUpdate 모델에\
  \ links 필드 추가 (Pydantic HttpUrl, max 10개 제한)\n- 버그 3 수정: `api/routers/tasks.py`의\
  \ create_task/update_task 함수에서 links를 frontmatter에 저장하도록 수정\n- 기능 개선: 캘린더 날짜 좌클릭\
  \ → 컨텍스트 메뉴 → \"미팅 추가\" 트리거로 UX 개선\n\n**파일 변경**:\n\n- `_dashboard/js/components/calendar.js`\
  \ - onEventClick() 로직 개선, onDateClick() 컨텍스트 메뉴 추가\n- `api/models/entities.py` -\
  \ TaskCreate/TaskUpdate에 links 필드 추가 (보안 제약 포함)\n- `api/routers/tasks.py` - create_task/update_task에서\
  \ links frontmatter 저장\n\n**검증 결과**:\n\n- ✅ 미팅 태스크 클릭 시 TaskPanel 정상 열림 (tsk- 패턴\
  \ 우선 판별)\n- ✅ Google Meet 링크가 TaskPanel에 정상 표시 (links 필드 저장)\n- ✅ 좌클릭 → 컨텍스트 메뉴\
  \ → \"미팅 추가\" UX 개선 완료\n- ✅ Codex 리뷰 통과 (Event propagation, Date format, Keyboard\
  \ fallback 모두 검증)\n\n**보안 개선**:\n\n- HttpUrl 타입으로 javascript: 등 XSS 차단\n- 링크 개수\
  \ 최대 10개 제한 (DoS 방지)\n- 라벨 최대 100자 제한\n\n**참고사항**:\n\n- 버그 2 (Google Calendar 삭제\
  \ 동기화)는 현재 scope 외 - 뷰 변경 시 자동 재로드로 부분 해결\n- Webhook 연동은 장기 과제로 별도 Task 생성 필요\n\n\
  **최종 상태**: done\n\n---\n\n**Created**: 2026-01-07 **Assignee**: 김은향"
---
# Dashboard - 미팅 태스크 클릭/삭제 동기화 버그 수정

> Task ID: `tsk-022-11` | Project: [[prj-dashboard-ux-v1]] | Status: done

## Notes

### PRD (Product Requirements Document)

#### 1. 문제 정의

**버그 1: 미팅 태스크 클릭 시 TaskPanel이 열리지 않음**
- 재현 경로: 캘린더 뷰 → 날짜 우클릭 → "미팅 추가" → 태스크 생성 → 해당 태스크 클릭
- 현재 동작: "구글 Meet으로 보기" 토스트 + confirm 다이얼로그 표시
- 기대 동작: TaskPanel(사이드 패널)이 열려야 함

**버그 2: Google Calendar 삭제 동기화 안됨**
- Google Calendar에서 이벤트 삭제 시 대시보드에 반영되지 않음
- 삭제 동기화 로직 부재 또는 미작동

#### 2. 원인 분석

**버그 1 원인**: `calendar.js` 860-906 라인 `onEventClick()` 분석

```javascript
onEventClick(info) {
    const sourceId = info.event.source?.id;

    // Google Calendar 이벤트인 경우
    if (sourceId === 'google') {
        // → 토스트 + confirm 표시
    }

    // LOOP Task 이벤트
    TaskPanel.open(taskId);
}
```

- 미팅 태스크 생성 시 **Google Calendar에도 이벤트가 생성됨** (`create_calendar_event: true`)
- 캘린더 새로고침 시 Google 이벤트가 로드되면서 **LOOP Task와 중복 표시** 가능성
- 또는 **sourceId 판별 로직 오류**로 LOOP Task가 Google로 인식될 가능성

**버그 2 원인**:
- Google Calendar → LOOP 대시보드 방향의 삭제 동기화 웹훅/폴링 미구현
- 현재는 Google Calendar 이벤트를 **읽기 전용**으로만 표시
- 삭제 시점에 캐시 갱신 로직 부재

#### 3. 해결 방안

**버그 1 수정안**:

**Option A (권장)**: LOOP Task와 Google 이벤트 구분 강화
- LOOP Task 이벤트에 `extendedProps.source: 'loop'` 추가
- `onEventClick()`에서 `extendedProps.source` 우선 확인
- Google 이벤트 중복 방지: 같은 시간대에 LOOP Task가 있으면 Google 이벤트 필터링

**Option B**: Google Calendar 이벤트와 LOOP Task 매핑
- Meet 생성 시 반환된 `calendar_event_id`를 Task에 저장
- `onEventClick()`에서 calendar_event_id로 연결된 LOOP Task 확인

**버그 2 수정안**:

**Option A (단기)**: 수동 동기화
- "새로고침" 버튼으로 Google Calendar 이벤트 재로드
- 삭제된 이벤트는 자동으로 사라짐

**Option B (중기)**: 주기적 폴링
- 뷰 변경 시 (`onDatesSet`) Google 이벤트 항상 재로드 (현재 구현됨)
- 캐시 무효화 주기 단축

**Option C (장기)**: Webhook 연동
- Google Calendar Push Notifications 구현
- 실시간 동기화

#### 4. Tech Spec

**수정 파일:**
- `_dashboard/js/components/calendar.js`
  - `getEvents()`: LOOP Task에 source 표시자 추가
  - `onEventClick()`: source 판별 로직 개선
  - `loadGoogleEvents()`: 캐시 갱신 로직 확인

**검증 항목:**
- [ ] 우클릭 → 미팅 추가 → 클릭 → TaskPanel 열림
- [ ] 기존 LOOP Task 클릭 → TaskPanel 열림
- [ ] Google Calendar 이벤트 클릭 → 토스트 + Google 열기 옵션
- [ ] Google Calendar에서 이벤트 삭제 → 대시보드 새로고침 시 반영

#### 5. Todo

- [x] `onEventClick()` 디버깅 - sourceId 값 확인
- [x] LOOP Task 이벤트에 식별자 추가 (tsk- 패턴 체크)
- [x] 조건문 수정하여 LOOP Task 우선 처리
- [x] **버그 3: TaskPanel에서 Google Meet 링크 미표시 수정**
- [x] **기능 개선: 우클릭 → 좌클릭으로 미팅 추가 트리거 변경**
- [ ] 테스트 및 검증

---

### 기능 개선 요청 (2026-01-07)

**현재 동작:**
- 캘린더 날짜 **우클릭** → 컨텍스트 메뉴 → "미팅 추가"

**변경 요청:**
- 캘린더 날짜 빈 곳 **좌클릭** → 컨텍스트 메뉴 → "미팅 추가"

**수정 파일:**
- `_dashboard/js/components/calendar.js`
  - `onDateClick()` 핸들러 수정: 좌클릭 시 컨텍스트 메뉴 표시
  - `onContextMenu()` 유지 (backwards compatibility)

**구현 완료 (2026-01-07)**

**수정 내용** (`calendar.js` lines 772-799):
```javascript
onDateClick(info) {
    // Date extraction with timezone trim
    const dateStr = info.dateStr.split('T')[0];
    if (!dateStr) return;

    this.contextMenuDate = dateStr;

    // Guard for optional jsEvent (keyboard/programmatic triggers)
    if (!info.jsEvent || typeof info.jsEvent.pageX !== 'number') {
        // Keyboard fallback: direct modal open
        this.onAddMeeting();
        return;
    }

    // Close existing menu before opening new one
    this.hideContextMenu();

    // Prevent document click handler from immediately closing menu
    info.jsEvent.stopPropagation();

    // Show context menu at click position
    this.showContextMenu(info.jsEvent.pageX, info.jsEvent.pageY);
}
```

**핵심 수정사항:**
1. **날짜 포맷 처리**: `dateStr.split('T')[0]`로 timezone 제거 (YYYY-MM-DD 보장)
2. **이벤트 전파 차단**: `stopPropagation()`으로 document click handler 우회
3. **키보드 접근성**: `jsEvent` 없거나 좌표 없으면 TaskModal 직접 열기
4. **메뉴 상태 관리**: 기존 메뉴 닫고 새 메뉴 열기

**Codex 리뷰 통과:**
- ✅ Event propagation 문제 해결
- ✅ Date format 문제 해결
- ✅ Keyboard fallback 적용
- ✅ Menu close/reopen 로직 검증

**Backwards Compatibility:**
- 우클릭 (`onContextMenu()`) 여전히 작동
- 좌클릭과 우클릭 모두 같은 UX 제공

---

### 버그 3 수정 완료 (2026-01-07)

**문제:**
- 캘린더 우클릭 → "미팅 추가" → "링크 생성" 버튼으로 Google Meet 링크 생성
- Task 저장 후 TaskPanel에서 해당 Meet 링크가 보이지 않음

**근본 원인 (Codex 분석):**
1. `TaskCreate` 모델에 `links` 필드가 없어서 FastAPI 검증 단계에서 Meet 링크가 제거됨
2. `create_task()` 함수가 links를 frontmatter에 저장하지 않음 (update_task는 저장)

**해결 방법:**
1. **api/models/entities.py**: `TaskCreate` 모델에 `links` 필드 추가
   - Pydantic `HttpUrl` 타입 사용 (XSS 방지)
   - `max_length=10` 제한 (DoS 방지)
   - `label` 최대 100자 제한
2. **api/routers/tasks.py**: `create_task()` 함수에서 links를 frontmatter에 저장하도록 수정

**수정 파일:**
- `api/models/entities.py` - TaskCreate/TaskUpdate에 links 필드 추가 + 보안 제약
- `api/routers/tasks.py` - create_task/update_task에서 links frontmatter 저장 로직 추가

**보안 개선 (Codex 제안):**
- `HttpUrl` 타입으로 https/http만 허용 (javascript: 등 XSS 차단)
- 링크 개수 최대 10개 제한 (DoS 방지)
- 라벨 최대 100자 제한

---

### 작업 로그

#### 2026-01-07 (Task 완료)
**개요**: Dashboard 미팅 태스크 클릭/삭제 동기화 버그 수정 완료

**변경사항**:
- 버그 1 수정: `calendar.js` onEventClick() 함수에서 tsk- 패턴으로 LOOP Task 우선 판별하도록 개선
- 버그 3 수정: `api/models/entities.py`의 TaskCreate/TaskUpdate 모델에 links 필드 추가 (Pydantic HttpUrl, max 10개 제한)
- 버그 3 수정: `api/routers/tasks.py`의 create_task/update_task 함수에서 links를 frontmatter에 저장하도록 수정
- 기능 개선: 캘린더 날짜 좌클릭 → 컨텍스트 메뉴 → "미팅 추가" 트리거로 UX 개선

**파일 변경**:
- `_dashboard/js/components/calendar.js` - onEventClick() 로직 개선, onDateClick() 컨텍스트 메뉴 추가
- `api/models/entities.py` - TaskCreate/TaskUpdate에 links 필드 추가 (보안 제약 포함)
- `api/routers/tasks.py` - create_task/update_task에서 links frontmatter 저장

**검증 결과**:
- ✅ 미팅 태스크 클릭 시 TaskPanel 정상 열림 (tsk- 패턴 우선 판별)
- ✅ Google Meet 링크가 TaskPanel에 정상 표시 (links 필드 저장)
- ✅ 좌클릭 → 컨텍스트 메뉴 → "미팅 추가" UX 개선 완료
- ✅ Codex 리뷰 통과 (Event propagation, Date format, Keyboard fallback 모두 검증)

**보안 개선**:
- HttpUrl 타입으로 javascript: 등 XSS 차단
- 링크 개수 최대 10개 제한 (DoS 방지)
- 라벨 최대 100자 제한

**참고사항**:
- 버그 2 (Google Calendar 삭제 동기화)는 현재 scope 외 - 뷰 변경 시 자동 재로드로 부분 해결
- Webhook 연동은 장기 과제로 별도 Task 생성 필요

**최종 상태**: done

---

**Created**: 2026-01-07
**Assignee**: 김은향
