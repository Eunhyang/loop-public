---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-39"
entity_name: "Dashboard - 캘린더뷰 유효하지않은 날짜 필터링"
created: 2026-01-07
updated: 2026-01-07
status: todo

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-39"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-07
due: 2026-01-07
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: null

# === 분류 ===
tags: [dashboard, calendar, bug-fix]
priority_flag: high
---

# Dashboard - 캘린더뷰 유효하지않은 날짜 필터링

> Task ID: `tsk-dashboard-ux-v1-39` | Project: `prj-dashboard-ux-v1` | Status: todo

## 목표

**완료 조건**:
1. 날짜가 없거나 유효하지 않은 형식(예: `2026-01-첫째주`)을 가진 Task는 캘린더 이벤트에서 제외
2. `Maximum call stack size exceeded` 에러 발생하지 않음
3. 유효한 날짜를 가진 Task만 캘린더에 정상 표시

---

## 상세 내용

### 배경

FullCalendar에서 `Maximum call stack size exceeded` 에러가 발생:
- 원인: 날짜가 없거나 형식이 잘못된 태스크(예: `2026-01-첫째주`)가 캘린더에 추가될 때
- FullCalendar의 `handleInvalidInsertion` 함수가 무한 재귀에 빠짐

### 문제 예시

```
Invalid date in task: tsk-exec-003 2026-01-첫째주
Invalid date in task: tsk-exec-004 2026-01-둘째주
```

### 작업 내용

1. `calendar.js`에서 태스크를 캘린더 이벤트로 변환할 때 날짜 유효성 검사 추가
2. 유효하지 않은 날짜를 가진 태스크는 캘린더 이벤트 목록에서 제외(스킵)
3. 유효한 날짜 = `YYYY-MM-DD` 형식 또는 유효한 Date 객체로 파싱 가능한 값

### 검사할 필드
- `start_date` (시작일)
- `due` (마감일)
- 둘 다 없거나 유효하지 않으면 → 캘린더에 표시 안 함

---

## 체크리스트

- [ ] `calendar.js`에서 이벤트 생성 전 날짜 유효성 검사 함수 구현
- [ ] 유효하지 않은 날짜 태스크 필터링 로직 추가
- [ ] 콘솔에 경고 로그 출력 (개발자 디버깅용)
- [ ] FullCalendar 무한 루프 에러 해결 확인

---

## Notes

### Tech Spec

**수정 대상 파일**: `public/_dashboard/js/components/calendar.js`

**날짜 유효성 검사 함수**:
```javascript
function isValidDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return false;
    // YYYY-MM-DD 형식 검사
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) return false;
    // 실제 유효한 날짜인지 확인
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
}
```

**필터링 위치**: Task → 캘린더 이벤트 변환 시점

### Todo
- [ ] isValidDate 함수 구현
- [ ] Task 이벤트 생성 로직에 필터링 적용
- [ ] 테스트: 유효하지 않은 날짜 태스크가 스킵되는지 확인
- [ ] NAS 배포 및 검증

### 작업 로그


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[tsk-022-16]] - 관련 태스크 (Google Calendar 400 에러)

---

**Created**: 2026-01-07
**Assignee**: 김은향
**Due**: 2026-01-07
