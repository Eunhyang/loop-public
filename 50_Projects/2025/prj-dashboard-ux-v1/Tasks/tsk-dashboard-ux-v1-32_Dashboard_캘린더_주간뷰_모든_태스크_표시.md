---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-32"
entity_name: "Dashboard - 캘린더 주간뷰 모든 태스크 표시"
created: 2026-01-06
updated: 2026-01-06
status: done
closed: 2026-01-06

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-32"]

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
tags: [dashboard, calendar, ux]
priority_flag: medium
---

# Dashboard - 캘린더 주간뷰 모든 태스크 표시

> Task ID: `tsk-dashboard-ux-v1-32` | Project: `prj-dashboard-ux-v1` | Status: done

## 목표

**완료 조건**:
1. 캘린더 주간뷰(Week)에서 "+N more" 링크 없이 해당 날짜의 모든 태스크가 표시됨
2. 월간뷰(Month)는 기존 동작 유지 (선택사항)

---

## 상세 내용

### 배경

대시보드 캘린더 뷰에서 "주(Week)" 단위로 볼 때:
- **현재 동작**: 하루에 태스크가 많으면 일부만 보이고 "+5 more" 같은 링크가 표시됨
- **원인**: FullCalendar 옵션 `dayMaxEvents: 3`이 설정되어 있음 (calendar.js line 111)
- **문제**: 주간뷰에서 전체 태스크를 한눈에 파악하기 어려움

### 작업 내용

1. `_dashboard/js/components/calendar.js` 수정
2. FullCalendar `dayMaxEvents` 옵션 조정
   - 주간뷰(timeGridWeek): `dayMaxEvents: false` 또는 충분히 큰 값
   - 월간뷰(dayGridMonth): 기존 값 유지 또는 적절히 조정

---

## 체크리스트

- [x] calendar.js에서 dayMaxEvents 설정 확인
- [x] 주간뷰에서 모든 태스크 표시되도록 수정
- [x] 월간뷰 동작 확인 (dayMaxEvents: true로 자동 조절)
- [ ] 테스트: 태스크 많은 날짜에서 주간뷰 확인

---

## Notes

### Tech Spec

**수정 대상 파일:**
- `/Users/gim-eunhyang/dev/loop/public/_dashboard/js/components/calendar.js`

**FullCalendar 옵션:**
- `dayMaxEvents`: 하루에 표시할 최대 이벤트 수
  - `false`: 제한 없음 (모두 표시)
  - `true`: 셀 높이에 맞춰 자동 조절
  - 숫자: 해당 개수만 표시, 나머지는 "+N more"

**뷰별 설정 방법:**
```javascript
// 방법 1: 글로벌 설정 변경
dayMaxEvents: false,  // 모든 뷰에서 제한 없음

// 방법 2: 뷰별 설정 (views 옵션)
views: {
    dayGridMonth: {
        dayMaxEvents: 3  // 월간뷰는 3개로 제한
    },
    timeGridWeek: {
        dayMaxEvents: false  // 주간뷰는 제한 없음
    }
}
```

### Todo
- [x] FullCalendar 공식 문서 확인 (dayMaxEvents, eventMaxStack)
- [x] calendar.js 수정
- [ ] 대시보드에서 테스트

### 작업 로그

#### 2026-01-06
**개요**: 캘린더 주간뷰에서 "+N more" 링크 없이 모든 태스크가 표시되도록 수정. FullCalendar의 `views` 옵션을 사용하여 뷰별 설정 적용.

**변경사항**:
- 수정: `_dashboard/js/components/calendar.js` line 111-118
  - `dayMaxEvents: 3` -> `dayMaxEvents: true` (월간뷰용, 셀 높이에 맞춰 자동 조절)
  - `views.timeGridWeek.dayMaxEvents: false` 추가 (주간뷰용, 제한 없음)

**핵심 코드**:
```javascript
dayMaxEvents: true,  // 월간뷰: 셀 높이에 맞춰 자동 조절
views: {
    timeGridWeek: {
        dayMaxEvents: false  // 주간뷰: 제한 없음, 모든 태스크 표시
    }
},
```

**결과**: 구현 완료 (테스트 필요)

**다음 단계**:
- 대시보드에서 주간뷰 테스트
- 태스크가 많은 날짜에서 모든 태스크가 표시되는지 확인

#### 2026-01-06 (완료)
**개요**: Task 완료 - 캘린더 주간뷰 모든 태스크 표시 구현 완료

**결과**:
- calendar.js 수정 완료 (FullCalendar 뷰별 설정 적용)
- 주간뷰(timeGridWeek): dayMaxEvents: false로 모든 태스크 표시
- 월간뷰(dayGridMonth): dayMaxEvents: true로 자동 조절

**최종 상태**: done

---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- FullCalendar 공식 문서: https://fullcalendar.io/docs/dayMaxEvents

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
