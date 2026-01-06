---
entity_type: Task
entity_id: "tsk-019-02"
entity_name: "Dashboard - Google Meet 생성 UX 개선 (수동 생성)"
created: 2026-01-06
updated: 2026-01-06
status: done
closed: 2026-01-06

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-019-02"]

# === 관계 ===
outgoing_relations:
  - target: "tsk-dashboard-ux-v1-26"
    type: depends_on
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-06
due: 2026-01-07
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 분류 ===
tags: [dashboard, google-meet, ux, meeting]
priority_flag: high
---

# Dashboard - Google Meet 생성 UX 개선 (수동 생성)

> Task ID: `tsk-019-02` | Project: `prj-dashboard-ux-v1` | Status: done

## 목표

**완료 조건**:
1. ❌ Task 저장 시 자동 생성 금지
2. ❌ Meeting 타입 선택 시 자동 생성 금지
3. ✅ "링크 생성" 버튼 클릭 시에만 생성
4. ✅ Google 계정 드롭다운 목록 표시
5. ✅ 첫 번째 계정이 기본 선택됨
6. ✅ 사용자가 다른 계정 선택 가능
7. ✅ 생성된 링크는 모달에 표시 (모달 유지)

---

## 상세 내용

### 배경

기존 구현 (tsk-dashboard-ux-v1-26)에서는 Meeting 타입 Task 생성 시 체크박스를 선택하면 자동으로 Google Meet 링크가 생성되었습니다. 이 방식은 다음 문제가 있습니다:

1. **의도하지 않은 생성**: 체크박스를 실수로 선택하면 불필요한 Meet 링크 생성
2. **계정 선택 타이밍**: 링크 생성 전에 계정을 미리 선택해야 하는 UX 불편
3. **취소 불가**: 한 번 생성하면 취소/재생성 어려움

### 개선 방향

**수동 생성 방식으로 변경**:
- Task 저장과 Meet 링크 생성을 분리
- "링크 생성" 명시적 버튼 클릭 시에만 생성
- 계정 선택 후 생성 버튼 클릭하는 명확한 플로우

### 작업 내용

#### 1. UI 변경 (`_dashboard/js/components/task-modal.js`, `_dashboard/index.html`)

**Before (자동 생성):**
```
☑ Google Meet 자동 생성
  계정 선택: [work@gmail.com ▼]
  ☑ Google Calendar에 일정 추가
  → Task 저장 시 자동 생성
```

**After (수동 생성):**
```
Google Meet 링크 생성
  계정 선택: [work@gmail.com ▼] (첫 번째 계정 기본 선택)
  [링크 생성] 버튼

  생성된 링크: https://meet.google.com/abc-defg-hij
  [복사] 버튼
```

#### 2. 로직 변경

- ❌ 제거: Task 저장 시 `createGoogleMeet()` 자동 호출
- ❌ 제거: Meeting 타입 선택 시 Meet 생성 체크박스
- ✅ 추가: "링크 생성" 버튼 클릭 이벤트 핸들러
- ✅ 추가: 계정 목록 로드 및 첫 번째 계정 기본 선택
- ✅ 유지: 생성된 링크 모달에 표시 및 복사 기능

#### 3. 캘린더 뷰 미팅 추가

캘린더 뷰에서 "미팅 추가" 버튼/우클릭 메뉴 클릭 시:
- Task Modal 열림
- Task Type 기본값 = "meeting" (자동 선택)
- 나머지는 수동 입력

---

## 체크리스트

- [x] UI: 체크박스 -> 버튼 방식으로 변경
- [x] UI: Google 계정 드롭다운 추가 (첫 번째 기본 선택)
- [x] UI: "링크 생성" 버튼 추가
- [x] 로직: Task 저장 시 자동 생성 제거
- [x] 로직: Meeting 타입 선택 시 자동 생성 제거
- [x] 로직: 버튼 클릭 시에만 `createGoogleMeet()` 호출
- [x] 캘린더: "미팅 추가" 버튼 구현 (type=meeting 기본값)
- [x] 테스트: 수동 생성 플로우 확인
- [x] 테스트: 캘린더 뷰 미팅 추가 확인

---

## Notes

### PRD

#### 문제 정의

현재 Meeting Task Google Meet 생성은 체크박스 자동 생성 방식으로, 다음 문제가 있습니다:

1. **의도하지 않은 생성**: 체크박스 실수로 선택 시 불필요한 링크 생성
2. **계정 선택 타이밍**: 링크 생성 전에 계정을 미리 선택해야 함
3. **취소 불가**: 한 번 생성하면 재생성 어려움

#### 목표

| 목표 | 성공 기준 |
|------|-----------|
| 명시적 생성 | "링크 생성" 버튼 클릭 시에만 Meet 링크 생성 |
| 계정 선택 UX | 드롭다운에서 계정 선택, 첫 번째 계정 기본값 |
| 캘린더 연동 | 캘린더 뷰에서 "미팅 추가" 시 type=meeting 자동 선택 |

#### 핵심 요구사항

**1. UI 변경**
- 체크박스 제거
- Google 계정 드롭다운 (API.getGoogleAccounts() 사용)
- "링크 생성" 버튼
- 생성된 링크 표시 영역 (모달 내)

**2. 로직 변경**
- Task 저장 시 자동 생성 **금지**
- Meeting 타입 선택 시 자동 생성 **금지**
- 버튼 클릭 시에만 Meet API 호출

**3. 캘린더 뷰**
- "미팅 추가" 버튼/우클릭 메뉴
- Task Modal 열기 (type=meeting 기본값)

### 기술 설계

#### 파일 수정 목록

1. `_dashboard/index.html`
   - 체크박스 → 버튼 UI 변경
   - 계정 선택 드롭다운 추가

2. `_dashboard/js/components/task-modal.js`
   - `handleTypeChange()`: 자동 생성 로직 제거
   - `generateMeetLink()`: 버튼 클릭 시에만 호출
   - `loadGoogleAccounts()`: 첫 번째 계정 기본 선택
   - `save()`: Meet 생성 자동 호출 제거

3. `_dashboard/js/components/calendar-view.js` (NEW)
   - "미팅 추가" 버튼 구현
   - Task Modal 호출 (type=meeting 전달)

#### 의존성

- 기존: `tsk-dashboard-ux-v1-26` (Google Meet 생성 기능)
- API: `GET /api/google/accounts`, `POST /api/google/meet`

---

### 구현 완료 (2026-01-06)

**수정된 파일:**
- `_dashboard/js/components/task-modal.js`

**변경 사항:**
1. `loadGoogleAccounts()`: 첫 번째 계정 자동 선택 (`index === 0 ? 'selected' : ''`)
2. `save()`: type 필드 추가 (`type: taskType`)
3. `save()`: 기존 links 보존 로직 개선 (Meet 링크만 추가/업데이트, non-Meet 링크 보존)

**기존 구현 확인 완료:**
- `generateMeetLink()`: "링크 생성" 버튼 클릭 시에만 Meet 생성
- `handleTypeChange()`: meeting 타입 선택 시 옵션 표시만 (자동 생성 없음)
- `save()`: 자동 생성 로직 없음, 수동 생성된 링크만 사용
- `calendar.js > onAddMeeting()`: 캘린더 우클릭 시 type=meeting 자동 선택

---

### 작업 로그

#### 2026-01-06
**개요**: Task 완료 - Google Meet 수동 생성 UX 개선

**결과**:
- 첫 번째 Google 계정 자동 선택 기능 구현 완료
- Task save 시 type 필드 추가 및 기존 links 보존 로직 개선 완료
- 수동 생성 플로우 전체 검증 완료
- 캘린더 뷰 미팅 추가 기능 확인 완료

**최종 상태**: done

#### 2026-01-06 (보안 패치)
**개요**: XSS 취약점 수정

**수정된 파일:**
- `_dashboard/js/components/task-modal.js`

**변경 사항:**
1. `escapeHtml()` 헬퍼 함수 추가 - XSS 방지를 위한 HTML 이스케이프
2. `loadGoogleAccounts()`: `acc.google_email`, `acc.label` 렌더링 시 `escapeHtml()` 적용

**보안 개선**:
- Google 계정 이메일/라벨 렌더링 시 XSS 공격 방지

---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[tsk-dashboard-ux-v1-26]] - 기존 구현 (자동 생성 방식)
- `_dashboard/js/components/task-modal.js`
- `_dashboard/index.html`

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-07
