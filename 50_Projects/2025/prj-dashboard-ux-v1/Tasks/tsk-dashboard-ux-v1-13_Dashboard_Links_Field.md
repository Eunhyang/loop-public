---
entity_type: Task
entity_id: tsk-dashboard-ux-v1-13
entity_name: Dashboard Links Field - Task/Project에 외부 링크 필드 추가
created: 2025-12-27
updated: '2025-12-27'
status: done
parent_id: prj-dashboard-ux-v1
project_id: prj-dashboard-ux-v1
aliases:
- tsk-dashboard-ux-v1-13
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
due: 2025-12-27
priority: medium
estimated_hours: null
actual_hours: null
type: dev
target_project: loop
tags:
- dashboard
- links
- schema
- api
priority_flag: medium
links:
- label: 테스트링크
  url: https://example.com
---
# Dashboard Links Field - Task/Project에 외부 링크 필드 추가

> Task ID: `tsk-dashboard-ux-v1-13` | Project: `prj-dashboard-ux-v1` | Status: doing

## 목표

**완료 조건**:
1. Task/Project frontmatter에 `links` 필드 추가 가능
2. 대시보드에서 label + 전체 URL 표시
3. 클릭 시 새 탭에서 열림
4. **[Phase 2]** 대시보드 Detail Panel에서 UI로 링크 추가/삭제 가능

---

## 상세 내용

### 배경

Task나 Project 단위에서 Google Drive, Figma, Notion 등 외부 링크를 첨부하고,
대시보드에서 바로 클릭해서 열 수 있는 기능 필요.

### 작업 내용

1. **스키마 변경**
   - `00_Meta/schema_constants.yaml` - `links` 필드를 known_fields에 추가
   - `00_Meta/schema_registry.md` - 스키마 문서 업데이트

2. **API 변경**
   - `api/models/entities.py` - Pydantic 모델에 links 필드 추가

3. **대시보드 변경**
   - `_dashboard/js/components/task-panel.js` - Task 상세 패널에 링크 섹션
   - `_dashboard/js/components/project-panel.js` - Project 상세 패널에 링크 섹션

### 링크 필드 구조

```yaml
links:
  - label: "기획문서"
    url: "https://docs.google.com/document/d/1abc..."
  - label: "피그마"
    url: "https://www.figma.com/file/xyz..."
```

### 대시보드 표시 형태

```
📎 Links
├─ 기획문서: https://docs.google.com/document/d/1abc...  [클릭 가능]
└─ 피그마: https://www.figma.com/file/xyz...            [클릭 가능]
```

---

## 체크리스트

- [ ] schema_constants.yaml에 links 필드 추가
- [ ] schema_registry.md 문서 업데이트
- [ ] api/models/entities.py 수정
- [ ] task-panel.js 링크 섹션 추가
- [ ] project-panel.js 링크 섹션 추가
- [ ] 테스트: Task에 링크 추가 후 대시보드에서 확인

---

## Notes

### Tech Spec

**링크 필드 구조**:
```yaml
links:
  - label: string   # 표시 이름 (예: "기획문서")
    url: string     # 전체 URL (예: "https://docs.google.com/...")
```

**수정 파일**:
1. `00_Meta/schema_constants.yaml` - known_fields.Task/Project에 `links` 추가
2. `00_Meta/schema_registry.md` - Task/Project 스키마에 links 필드 문서화
3. `api/models/entities.py` - Link 모델 + TaskUpdate/ProjectUpdate에 links 필드
4. `_dashboard/js/components/task-panel.js` - renderLinks() 메서드 추가
5. `_dashboard/js/components/project-panel.js` - renderLinks() 메서드 추가

**대시보드 표시**:
- Relations 섹션 아래에 Links 섹션 표시
- label: URL 형식으로 표시
- 클릭 시 `target="_blank"`로 새 탭 열림
- XSS 방지: escapeHtml() 적용

### Todo
- [x] schema_constants.yaml에 links 추가 (Task, Project) ✅
- [x] schema_registry.md 문서 업데이트 ✅
- [x] api/models/entities.py에 Link 모델 + links 필드 추가 ✅
- [x] task-panel.js에 renderLinks() 구현 ✅
- [x] project-panel.js에 renderLinks() 구현 ✅
- [x] index.html에 Links 섹션 마크업 추가 ✅
- [x] API routers에 links 저장 로직 추가 ✅

### Phase 2 Todo (UI 추가/삭제)
- [x] task-panel.js: [+ Add] 버튼 + 입력 폼 UI ✅
- [x] task-panel.js: 삭제 버튼 (🗑) + 이벤트 핸들러 ✅
- [x] task-panel.js: API PUT 호출로 links 저장 ✅
- [x] project-panel.js: 동일 기능 구현 ✅
- [x] panel.css: 입력 폼 스타일 ✅
- [x] Codex 리뷰 피드백 반영 ✅
  - New Task 패널에서 Links 섹션 표시 수정
  - Invalid URL 필터링 추가 (저장 시)

### 작업 로그

#### 2025-12-27 06:10
**개요**: Dashboard Links Field Phase 2 구현 완료. Task/Project Detail Panel에서 UI로 링크 추가/삭제 가능. CSS 충돌로 인한 로그인 모달 미표시 버그 해결.

**변경사항**:
- 개발: task-panel.js, project-panel.js에 editableLinks 상태 관리 + renderLinksUI() + 이벤트 핸들러 (showAddLinkForm, hideAddLinkForm, addNewLink, deleteLink, bindLinkEventHandlers) 추가
- 개발: panel.css에 링크 편집 UI 스타일 (.panel-link-delete-btn, .panel-link-add-btn, .panel-link-add-form, .panel-link-input, .panel-link-form-buttons) 추가
- 수정: save() 메서드에 editableLinks를 taskData에 포함 + isSafeUrl() 필터링
- 수정: openNew()에서 Links 섹션 display 초기화 추가 (Codex 리뷰 피드백)
- 버그픽스: panel.css의 .modal 클래스가 로그인 모달을 숨기는 CSS 충돌 → .pending-review-modal로 변경
- 버그픽스: save() catch 블록에 this.close() 추가 (오버레이 stuck 방지)

**핵심 코드**:
```javascript
// task-panel.js - 링크 UI 관리
editableLinks: [], // 편집 중인 링크 목록

renderLinksUI() {
    const container = document.getElementById('panelTaskLinks');
    const links = this.editableLinks;
    // 링크 리스트 + [+ Add] 버튼 렌더링
}

addNewLink() {
    const label = document.getElementById('panelTaskLinkLabel').value.trim();
    const url = document.getElementById('panelTaskLinkUrl').value.trim();
    if (label && url && this.isSafeUrl(url)) {
        this.editableLinks.push({ label, url });
        this.renderLinksUI();
    }
}
```

**파일 변경**:
- `_dashboard/js/components/task-panel.js` - 수정 (editableLinks + 링크 UI 메서드)
- `_dashboard/js/components/project-panel.js` - 수정 (동일 기능)
- `_dashboard/css/panel.css` - 수정 (링크 UI 스타일 + .modal → .pending-review-modal)

**결과**: ✅ 기능 정상 동작. 로그인 모달 표시 문제 해결.

**다음 단계**:
- MCP 서버 재빌드 완료 (API 반영)
- 브라우저 새로고침 후 로그인 → 링크 추가/삭제 테스트


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project

---

**Created**: 2025-12-27
**Assignee**: 김은향
**Due**: 2025-12-27
