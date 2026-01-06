---
entity_type: Task
entity_id: tsk-dashboard-ux-v1-33
entity_name: Dashboard - 캘린더 월뷰 overflow 수정 및 +more 토글 버튼 추가
created: 2026-01-06
updated: 2026-01-06
status: doing
parent_id: prj-dashboard-ux-v1
project_id: prj-dashboard-ux-v1
assignee: 김은향
due: 2026-01-06
type: dev
target_project: loop
priority: medium
aliases:
  - tsk-dashboard-ux-v1-33
  - 캘린더 월뷰 overflow 수정
  - Calendar month view overflow fix
tags:
  - task
  - dashboard
  - calendar
  - ux
  - bugfix
---
# Dashboard - 캘린더 월뷰 overflow 수정 및 +more 토글 버튼 추가

> Task ID: `tsk-dashboard-ux-v1-33` | Project: [[prj-dashboard-ux-v1]] | Status: doing

## 요약

대시보드 캘린더 월(Month) 뷰에서 태스크가 많을 때 발생하는 overflow 문제를 수정하고, 사용자가 원할 때 "+N more" 모드로 전환할 수 있는 토글 버튼을 추가합니다.

---

## 문제 정의

1. **월(Month) 뷰 overflow 문제**:
   - 현재: 캘린더가 흰색 바탕으로 고정된 높이를 가짐
   - 문제: `dayMaxEvents: true` 설정으로 태스크가 많으면 캘린더 고정 영역을 벗어남 (overflow)
   - 해결: 캘린더 높이가 내용에 맞게 조절되거나, overflow가 적절히 처리되도록 수정

2. **+more 모드 토글 필요**:
   - 현재: `dayMaxEvents: true`로 고정되어 있어 사용자 선택 불가
   - 문제: 모든 태스크를 보고 싶을 때와 간략히 보고 싶을 때 전환 불가
   - 해결: 버튼으로 "모든 태스크 표시" ↔ "+more 축소 모드" 전환 가능

---

## 수정 대상 파일

- `/Users/gim-eunhyang/dev/loop/public/_dashboard/js/components/calendar.js`
- `/Users/gim-eunhyang/dev/loop/public/_dashboard/css/` (필요시)

---

## Notes

### Tech Spec

#### 현재 상태 분석
```javascript
// calendar.js line 111
dayMaxEvents: true,  // 월간뷰: 셀 높이에 맞춰 자동 조절
```

#### 구현 방향

1. **토글 상태 관리**:
   - `Calendar.expandedMode` 상태 추가 (default: false = +more 모드)
   - localStorage에 상태 저장하여 새로고침 후에도 유지

2. **토글 버튼 UI**:
   - FullCalendar headerToolbar에 커스텀 버튼 추가
   - 버튼 텍스트: "모두 표시" / "+more"

3. **FullCalendar 옵션 변경**:
   - `dayMaxEvents: true` (축소 모드) ↔ `dayMaxEvents: false` (확장 모드) 전환
   - 옵션 변경 후 `calendar.setOption()` 또는 `calendar.render()` 호출

4. **스타일 조정**:
   - 확장 모드에서 캘린더 컨테이너가 내용에 맞게 확장되도록 CSS 조정
   - overflow 처리

### Todo
- [ ] Calendar.expandedMode 상태 변수 추가
- [ ] localStorage 저장/로드 함수 추가
- [ ] headerToolbar에 커스텀 버튼 추가
- [ ] 토글 함수 구현 (setOption으로 dayMaxEvents 변경)
- [ ] CSS 조정 (확장 모드 높이 처리)
- [ ] 빌드 확인 (브라우저 테스트)

---

**Created**: 2026-01-06
**Owner**: 김은향
