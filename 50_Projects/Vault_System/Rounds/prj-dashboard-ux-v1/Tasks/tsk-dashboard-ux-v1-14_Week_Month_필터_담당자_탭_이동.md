---
entity_type: Task
entity_id: tsk-dashboard-ux-v1-14
entity_name: Week/Month 필터 담당자 탭 이동
created: 2025-12-27
updated: '2025-12-27'
status: done
parent_id: prj-dashboard-ux-v1
project_id: prj-dashboard-ux-v1
aliases:
- tsk-dashboard-ux-v1-14
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
start_date: 2025-12-27
due: 2025-12-27
priority: medium
estimated_hours: null
actual_hours: null
type: dev
target_project: loop
tags:
- dashboard
- ux
- filter
priority_flag: medium
---
# Week/Month 필터 담당자 탭 이동

> Task ID: `tsk-dashboard-ux-v1-14` | Project: `prj-dashboard-ux-v1` | Status: doing

## 목표

**완료 조건**:
1. Filter Panel에 있던 Week/Month 필터가 담당자 탭 옆으로 이동됨
2. [W][M] 토글 버튼으로 둘 중 하나 선택 시 오른쪽에 하위 필터 표시
3. Filter Panel에서 해당 섹션 제거

---

## 상세 내용

### 배경

현재 Week/Month 필터가 Filter Panel (우측 사이드 패널) 안에 있어서 접근성이 떨어짐.
담당자 탭 옆에 배치하여 빠른 날짜 필터링 가능하도록 개선.

### 작업 내용

**UI 구조:**
```
[전체|김은향|한명학]        [W][M]  [W-2][W-1][W0][W+1][W+2]
                            ↑       ↑
                        토글 버튼  오른쪽에 하위 필터 표시
```

**동작:**
1. `[W]` `[M]` 버튼이 담당자 탭 옆에 위치
2. **둘 중 하나만** 선택 가능 (라디오 버튼처럼)
3. 선택하면 **오른쪽에** 해당 하위 필터 버튼들이 나타남
4. 다시 클릭하면 해제 (하위 필터 숨김)
5. Filter Panel에서 해당 섹션 제거

---

## 체크리스트

- [ ] index.html: 담당자 탭 영역에 [W][M] 버튼 및 하위 필터 컨테이너 추가
- [ ] filter-panel.js: Quick Date Filter 관련 로직 분리/이동
- [ ] 새 컴포넌트 또는 Tabs 확장: [W][M] 토글 및 하위 필터 렌더링
- [ ] CSS: 담당자 탭 옆 스타일링
- [ ] Filter Panel에서 Quick Date Filter 섹션 제거
- [ ] 기존 필터 기능 (week/month 선택) 유지 확인

---

## Notes

### Todo
- [ ]
- [ ]
- [ ]

### 작업 로그

#### 2025-12-27 06:15
**개요**: W/M 필터 모드 전환 시 독립성 버그 수정. 모드 전환 시 이전 선택값이 남아있어 다시 돌아오면 예전 선택이 유지되는 문제 해결.

**변경사항**:
- 수정: `_dashboard/js/components/tabs.js` - `toggleMode()` 함수 로직 변경
- 개선: W→M 또는 M→W 전환 시 `selectedWeeks`, `selectedMonths` 양쪽 모두 클리어하도록 수정

**핵심 코드**:
```javascript
toggleMode(mode) {
    if (this.activeMode === mode) {
        this.activeMode = null;
    } else {
        this.activeMode = mode;
        State.setQuickDateMode(mode);
    }
    // 모드 변경 시 양쪽 선택값 모두 클리어 (W/M 독립성 보장)
    State.filters.task.selectedWeeks = [];
    State.filters.task.selectedMonths = [];
    ...
}
```

**결과**: ✅ 수정 완료

**다음 단계**:
- 대시보드에서 W/M 전환 테스트 확인 필요


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- `_dashboard/index.html` - 메인 HTML
- `_dashboard/js/components/filter-panel.js` - 현재 Week/Month 필터 위치
- `_dashboard/js/state.js` - 필터 상태 관리

---

**Created**: 2025-12-27
**Assignee**: 김은향
**Due**: 2025-12-27
