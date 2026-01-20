---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-28"
entity_name: "Dashboard - Calendar 사이드바 Google 계정 관리 UX 개선"
created: 2026-01-06
updated: 2026-01-06
status: done

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-28"]

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
tags: [dashboard, calendar, ux, google-calendar]
priority_flag: medium
---

# Dashboard - Calendar 사이드바 Google 계정 관리 UX 개선

> Task ID: `tsk-dashboard-ux-v1-28` | Project: `prj-dashboard-ux-v1` | Status: done

## 목표

**완료 조건**:
1. "+계정 추가" 버튼이 계정이 있을 때도 사이드바 상단에 항상 표시
2. 각 계정 헤더에 연결해제/설정 옵션 추가
3. 계정 헤더 개선: 이메일 + 아이콘 + 접기/펼치기 기능
4. 캘린더 토글 UX: 체크박스 + 색상 + 이름 + "기본" 배지
5. 모바일에서도 잘 작동하는 반응형 스타일

---

## 상세 내용

### 배경

현재 Google Calendar 사이드바는 기본적인 기능만 제공하고 있습니다.
Notion Calendar 스타일로 UX를 개선하여 사용자 경험을 향상시킵니다.

### 작업 내용

1. **사이드바 상단**
   - "+계정 추가" 버튼을 항상 표시 (계정 유무 관계없이)
   - 섹션 헤더에 Google Calendar 아이콘 추가

2. **계정 헤더 개선**
   - 이메일 앞에 프로필 아이콘/아바타
   - 계정별 접기/펼치기 (collapse/expand) 기능
   - "..." 메뉴 버튼 → 연결해제 옵션

3. **캘린더 아이템 개선**
   - 체크박스 + 색상 도트 + 이름 + "기본" 배지
   - hover 시 subtle한 배경색 변경
   - 체크박스 커스텀 스타일 (색상 반영)

4. **반응형 스타일**
   - 모바일에서 사이드바 축소/확장
   - 터치 친화적인 버튼 크기

---

## 체크리스트

- [x] renderGoogleCalendarSidebar() 함수 리팩토링
- [x] "+계정 추가" 버튼 항상 표시
- [x] 계정별 collapse/expand 기능
- [x] 연결해제 메뉴 추가
- [x] CSS 스타일 개선
- [x] 모바일 반응형 테스트

---

## Notes

### Tech Spec
- 프레임워크: Vanilla JavaScript
- 파일: `_dashboard/js/components/calendar.js`, `_dashboard/css/calendar.css`
- 관련 함수: `renderGoogleCalendarSidebar()` (298-351줄)

### 참고 디자인
- Notion Calendar 사이드바 스타일
- Google Calendar 앱 사이드바

### Todo
- [x] renderGoogleCalendarSidebar 분석
- [x] UI 컴포넌트 설계
- [x] JavaScript 구현
- [x] CSS 스타일링
- [x] 테스트

### 작업 로그

#### 2026-01-06 완료
**개요**: Notion Calendar 스타일로 Google Calendar 사이드바 UX 개선

**변경사항**:
- 개발: `renderGoogleCalendarSidebar()` 함수 리팩토링
  - "+계정 추가" 버튼 항상 표시 (gcal-sidebar-header)
  - 계정별 collapse/expand 기능 (collapsedAccounts Set)
  - "..." 메뉴 버튼 + 연결해제 옵션
- 추가: 새 함수들
  - `toggleAccountCollapse(email)` - 계정 접기/펼치기
  - `loadCollapsedAccounts()` / `saveCollapsedAccounts()` - localStorage 저장
  - `showAccountMenu()` / `hideAccountMenu()` - 계정 메뉴 팝업
  - `disconnectAccount(accountId, email)` - API 호출로 연결 해제
- 개선: CSS 스타일
  - 계정 아바타 (첫 글자 + 그라데이션 배경)
  - 접기/펼치기 아이콘 애니메이션
  - 메뉴 버튼 hover 시 표시
  - 다크 모드 지원
  - 모바일 반응형 (터치 친화적 버튼 크기)

**핵심 코드**:
- `calendar.js`: collapsedAccounts, accountMenu 상태 추가
- `calendar.css`: 170줄+ 새 스타일 추가

**결과**: 구현 완료


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[tsk-dashboard-ux-v1-24]] - Google OAuth 계정 연결
- [[tsk-dashboard-ux-v1-25]] - 캘린더 Google Calendar 연동

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
