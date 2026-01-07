---
entity_type: Task
entity_id: tsk-022-11
entity_name: Dashboard - 미팅 태스크 클릭/삭제 동기화 버그 수정
created: 2026-01-07
updated: 2026-01-07
project_id: prj-dashboard-ux-v1
assignee: 김은향
status: doing
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
---

# Dashboard - 미팅 태스크 클릭/삭제 동기화 버그 수정

> Task ID: `tsk-022-11` | Project: [[prj-dashboard-ux-v1]] | Status: doing

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
- [ ] **버그 3: TaskPanel에서 Google Meet 링크 미표시 수정**
- [ ] 테스트 및 검증

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

**Created**: 2026-01-07
**Assignee**: 김은향
