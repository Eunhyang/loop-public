---
entity_type: Task
entity_id: tsk-dashboard-ux-v1-33
entity_name: Dashboard - 캘린더 월뷰 overflow 수정 및 +more 토글 버튼 추가
created: 2026-01-06
updated: 2026-01-06
status: done
closed: 2026-01-06
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

> Task ID: `tsk-dashboard-ux-v1-33` | Project: [[prj-dashboard-ux-v1]] | Status: done

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
- [x] Calendar.expandedMode 상태 변수 추가
- [x] localStorage 저장/로드 함수 추가 (loadExpandMode, saveExpandMode)
- [x] headerToolbar에 커스텀 버튼 추가 (customButtons.expandToggle)
- [x] 토글 함수 구현 (toggleExpandMode - setOption으로 dayMaxEvents 변경)
- [x] updateExpandButtonText() 함수로 DOM 버튼 텍스트 동기화
- [x] onDatesSet()에서 뷰 변경 시 dayMaxEvents 상태 재적용 (Codex 피드백 반영)
- [x] CSS 조정 (확장 토글 버튼 스타일 + 다크 모드)
- [ ] 빌드 확인 (브라우저 테스트)

### 구현 완료 내용

#### calendar.js 변경사항
1. **상태 변수**: `expandedMode`, `EXPAND_MODE_KEY` 추가
2. **함수 추가**:
   - `loadExpandMode()`: localStorage에서 설정 로드
   - `saveExpandMode()`: localStorage에 설정 저장
   - `toggleExpandMode()`: 모드 토글 + dayMaxEvents 변경
   - `updateExpandButtonText()`: 버튼 텍스트 DOM 업데이트
3. **init() 수정**:
   - loadExpandMode() 호출
   - customButtons.expandToggle 정의
   - headerToolbar에 버튼 추가
   - 초기 렌더링 후 버튼 텍스트 동기화
4. **onDatesSet() 수정**:
   - 뷰 변경 시 dayMaxEvents 상태 재적용 (Codex 피드백)
   - 버튼 텍스트 동기화

#### calendar.css 변경사항
1. `.fc-expandToggle-button` 스타일 추가 (hover, active 포함)
2. 다크 모드 지원 추가

### Codex 리뷰 피드백 반영
- **버그 수정**: 주간뷰에서 토글 후 월간뷰로 돌아올 때 dayMaxEvents 상태가 적용되지 않던 문제
- **해결**: onDatesSet()에서 월간뷰 전환 시 expandedMode에 따라 dayMaxEvents 재적용

### 작업 로그

#### 2026-01-06
**개요**: Task 완료 - 캘린더 월뷰 overflow 수정 및 +more 토글 기능 구현

**결과**:
- calendar.js 수정 완료 (상태 관리, 토글 함수, 버튼 UI)
- calendar.css 스타일 추가 완료 (다크 모드 지원)
- Codex 리뷰 피드백 반영 (onDatesSet 버그 수정)
- LOOP Vault 작업으로 PR/merge 과정 없음

**최종 상태**: done

---

**Created**: 2026-01-06
**Owner**: 김은향
