# Dashboard Activate Filter

> 대시보드에서 비활성(inactive) 멤버, 프로젝트, 태스크를 기본적으로 숨기고, 필터 패널에서 토글 가능하게 하는 기능

## 목표

1. **멤버 필터링**: `members.yaml`에서 `active: false`인 멤버 숨김
   - 해당 멤버 탭 숨김
   - 해당 멤버의 Task 숨김
   - 해당 멤버 소유 Project 숨김

2. **엔티티 필터링**: Task/Project의 `activate: false` 숨김

3. **필터 토글**: FilterPanel에서 토글로 다시 표시 가능

## 구현 완료

### 수정된 파일

| 파일 | 변경 내용 |
|------|-----------|
| `_dashboard/js/state.js` | `showInactiveMembers` 필터, 헬퍼 메서드, 필터 로직 |
| `_dashboard/js/components/tabs.js` | `getActiveMembers()` 사용 |
| `_dashboard/js/components/filter-panel.js` | 3개 토글 UI (members, projects, tasks) |
| `_dashboard/css/filter-panel.css` | 토글 스위치 스타일 |
| `_dashboard/index.html` | VISIBILITY 섹션 추가 |

### State 헬퍼 메서드

```javascript
// 활성 멤버만 반환 (필터 적용)
State.getActiveMembers()

// 비활성 멤버 ID 목록
State.getInactiveMemberIds()

// 멤버 활성 상태 확인
State.isMemberActive(memberId)
```

### 필터 구조

```javascript
State.filters = {
    project: {
        status: [...],
        priority: [...],
        showInactive: false    // Project.activate 필터
    },
    task: {
        status: [...],
        priority: [...],
        dueDateStart: null,
        dueDateEnd: null,
        showInactive: false    // Task.activate 필터
    },
    showInactiveMembers: false // Member.active 필터
}
```

## 동작 흐름

```
대시보드 로드
    ↓
State.filters.showInactiveMembers = false (기본값)
    ↓
Tabs.render() → getActiveMembers() → active: false 멤버 탭 숨김
getFilteredTasks() → 비활성 멤버 assignee의 Task 숨김
getProjectsForAssignee() → 비활성 멤버 owner의 Project 숨김
    ↓
[사용자가 "Show inactive members" 토글 ON]
    ↓
State.filters.showInactiveMembers = true
    ↓
모든 멤버, Task, Project 표시
```

## 테스트 확인 사항

1. `members.yaml`의 `active: false` 멤버(임단)가 탭에서 안 보임
2. 임단의 Task가 Kanban에서 안 보임
3. 임단 소유 Project가 안 보임
4. 필터 패널 > VISIBILITY > "Show inactive members" 토글 → 모두 표시
5. Reset All 클릭 → 다시 숨김

---

**Created**: 2025-12-25
**Status**: Complete
