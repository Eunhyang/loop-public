# Dashboard Activate Filter - TODO

> 작업 추적 문서

## 태스크 목록

### Phase 1: State 변경

- [x] **ACT-001** State.filters에 showInactiveMembers 필드 추가
  - 파일: `_dashboard/js/state.js`
  - 작업: `filters.showInactiveMembers` 추가 (기본값: false)
  - 완료일: 2025-12-25

- [x] **ACT-002** State에 멤버 관련 헬퍼 메서드 추가
  - 파일: `_dashboard/js/state.js`
  - 작업:
    - `getActiveMembers()` - 활성 멤버 목록 반환
    - `getInactiveMemberIds()` - 비활성 멤버 ID 목록 반환
    - `isMemberActive(memberId)` - 멤버 활성 상태 확인
  - 완료일: 2025-12-25

- [x] **ACT-003** getFilteredTasks()에 멤버 activate 필터 적용
  - 파일: `_dashboard/js/state.js`
  - 작업: 비활성 멤버의 Task 필터링
  - 완료일: 2025-12-25

- [x] **ACT-004** getStrategyFilteredTasks()에 멤버 activate 필터 적용
  - 파일: `_dashboard/js/state.js`
  - 작업: 동일한 필터 로직 추가
  - 완료일: 2025-12-25

- [x] **ACT-005** getProjectsForAssignee()에 멤버 activate 필터 적용
  - 파일: `_dashboard/js/state.js`
  - 작업: 비활성 멤버 소유 Project 필터링
  - 완료일: 2025-12-25

- [x] **ACT-006** resetFilters()에 showInactiveMembers 초기화 추가
  - 파일: `_dashboard/js/state.js`
  - 완료일: 2025-12-25

### Phase 2: UI 변경

- [x] **ACT-007** Tabs.render()에서 getActiveMembers() 사용
  - 파일: `_dashboard/js/components/tabs.js`
  - 작업: `State.members` → `State.getActiveMembers()` 변경
  - 완료일: 2025-12-25

- [x] **ACT-008** FilterPanel renderActivateFilters() 수정
  - 파일: `_dashboard/js/components/filter-panel.js`
  - 작업: "Show inactive members" 토글 추가
  - 완료일: 2025-12-25

- [x] **ACT-009** FilterPanel attachActivateListeners() 수정
  - 파일: `_dashboard/js/components/filter-panel.js`
  - 작업: members 타입 핸들링 추가
  - 완료일: 2025-12-25

- [x] **ACT-010** updateFilterIndicator()에 showInactiveMembers 상태 반영
  - 파일: `_dashboard/js/components/filter-panel.js`
  - 완료일: 2025-12-25

### Phase 3: 테스트 및 문서화

- [ ] **ACT-011** 기능 테스트
  - members.yaml에서 `active: false`인 멤버(임단) 탭 숨김 확인
  - 해당 멤버의 Task 숨김 확인
  - 해당 멤버 소유 Project 숨김 확인
  - "Show inactive members" 토글 시 모두 표시 확인

- [ ] **ACT-012** 문서 업데이트
  - techspec.md 최종 업데이트

---

**Created**: 2025-12-25
**Last Updated**: 2025-12-25
