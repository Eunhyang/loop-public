# Dashboard Quick Search - TODO

**Project**: dashboard-quick-search
**Last Updated**: 2025-12-25

---

## 완료된 작업

- [x] **TASK-001** HTML 모달 구조 추가
  - 수정 파일: `_dashboard/index.html`
  - 작업 내용: Quick Search 모달 HTML 추가
  - 변경 사항:
    - Quick Search overlay 및 modal 추가 (line 268-285)
    - CSS 링크 추가 (line 15)
    - JS 스크립트 링크 추가 (line 585)
  - 완료일: 2025-12-25

- [x] **TASK-002** CSS 스타일 작성
  - 수정 파일: `_dashboard/css/quick-search.css` (신규)
  - 작업 내용: 모달, 검색바, 결과 리스트 스타일
  - 변경 사항:
    - 오버레이 스타일 (반투명 배경)
    - 모달 스타일 (600px, 둥근 모서리, 그림자)
    - 입력창 스타일 (아이콘, ESC 키 표시)
    - 결과 리스트 스타일 (카테고리별 그룹핑)
    - 키보드 네비게이션 하이라이트
    - 스크롤바 커스텀
  - 완료일: 2025-12-25

- [x] **TASK-003** JavaScript 컴포넌트 작성
  - 수정 파일: `_dashboard/js/components/quick-search.js` (신규)
  - 작업 내용:
    - 모달 열기/닫기 (Cmd+K, Cmd+P)
    - 검색 로직 (debounce 150ms)
    - 결과 렌더링 (카테고리별 그룹핑)
    - 키보드 네비게이션 (↑↓ Enter ESC)
    - 액션 실행 (Task Panel, Project Panel, Commands)
  - 변경 사항:
    - QuickSearch 객체 (init, open, close, search, render)
    - 커맨드 목록 (new task, new project, view kanban/calendar/graph, reload)
    - Tasks, Projects, Tracks, Conditions, Hypotheses 검색
    - DOM 자동 초기화
  - 완료일: 2025-12-25

- [x] **TASK-004** app.js 초기화 추가
  - 작업 내용: QuickSearch는 자동 초기화 포함, 별도 수정 불필요
  - 완료일: 2025-12-25

---

## 진행 중

(없음)

---

## 예정된 작업

### Phase 2: 개선 (Optional)

- [ ] **TASK-006** Fuzzy search 추가
  - 작업 내용: fuse.js 또는 자체 구현으로 fuzzy matching
  - 우선순위: Low

- [ ] **TASK-007** 최근 검색 기록
  - 작업 내용: localStorage에 최근 검색어 저장
  - 우선순위: Low

- [ ] **TASK-008** 검색 결과 하이라이트
  - 작업 내용: 매칭된 텍스트 하이라이트
  - 우선순위: Low

---

## 알려진 이슈

(없음)

---

**Last Updated**: 2025-12-25
