---
entity_type: Task
entity_id: tsk-n8n-20
entity_name: "Dashboard - Pending Panel Entity Preview UX 개선"
created: 2026-01-06
updated: 2026-01-06
status: doing

# === 계층 ===
parent_id: prj-n8n
project_id: prj-n8n
aliases:
- tsk-n8n-20

# === 관계 ===
outgoing_relations:
- tsk-n8n-10
- tsk-n8n-13
validates: []

# === Task 전용 ===
assignee: 김은향
start_date: 2026-01-06
due: 2026-01-06
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 분류 ===
tags:
- dashboard
- pending-reviews
- ux
- entity-preview
priority_flag: high
---

# Dashboard - Pending Panel Entity Preview UX 개선

> Task ID: `tsk-n8n-20` | Project: `prj-n8n` | Status: doing

## 목표

**완료 조건**:
1. Entity Preview 패널에서 Notes/body 마크다운 렌더링이 정상적으로 표시됨
2. Entity Preview 패널 너비가 확장되어 컨텐츠가 잘 보임
3. 테스트 완료 및 NAS 배포

---

## 상세 내용

### 배경

tsk-n8n-10에서 3단 레이아웃 구현, tsk-n8n-13에서 필드 선택 UX 개선 완료.
현재 문제:
1. Notes/body 마크다운 렌더링이 깨져 보임 - renderTaskPreview/renderProjectPreview에서 Notes 렌더링 누락
2. 패널 너비가 너무 작아서 컨텐츠가 잘 안 보임 - 현재 350px (min: 300px, max: 400px)

### 작업 내용

1. **Notes/body 마크다운 렌더링 수정**
   - renderTaskPreview(): Notes 섹션 추가
   - renderProjectPreview(): Notes 섹션 추가
   - 마크다운 렌더링 적용 (marked.js 사용)

2. **패널 너비 확장**
   - .pending-entity-pane: width 350px → 450px
   - min-width: 300px → 400px
   - max-width: 400px → 550px

---

## 체크리스트

- [x] renderTaskPreview()에 Notes 섹션 추가
- [x] renderProjectPreview()에 Notes 섹션 추가
- [x] 마크다운 렌더링 적용 (renderMarkdown() 메서드 추가)
- [x] CSS: .pending-entity-pane 너비 확장 (350px -> 450px)
- [x] CSS: 반응형 미디어 쿼리 추가 (1400px, 1200px)
- [ ] 로컬 테스트
- [ ] NAS 배포

---

## Notes

### PRD (Product Requirements Document)

#### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| Task ID | tsk-n8n-20 |
| Task Name | Dashboard - Pending Panel Entity Preview UX 개선 |
| Project | LOOP Vault Dashboard |
| 목표 | Entity Preview 패널에서 Notes 렌더링 및 너비 확장으로 UX 개선 |

#### 1.2 문제 정의

**현재 상태:**
- Entity Preview에서 Task/Project 선택 시 Notes 내용이 표시되지 않음
- 오른쪽 패널 너비가 350px로 좁아서 컨텐츠 확인이 어려움

**사용자 Pain Point:**
1. Task Notes에 작성된 중요 내용을 Preview에서 볼 수 없음
2. 좁은 패널로 인해 긴 텍스트나 테이블이 잘려서 표시됨

#### 1.3 기능 상세

**Notes 렌더링 추가:**
- Task: body 또는 notes 필드가 있으면 마크다운으로 렌더링
- Project: body 필드가 있으면 마크다운으로 렌더링
- marked.js 라이브러리 사용 (이미 Dashboard에서 사용 중)

**패널 너비 확장:**
- 기존: 350px (min: 300px, max: 400px)
- 변경: 450px (min: 400px, max: 550px)
- 전체 레이아웃 비율 조정 필요시 center pane 축소

---

### Tech Spec

#### 2.1 수정 대상 파일

| 파일 | 수정 범위 |
|------|-----------|
| `_dashboard/js/components/pending-panel.js` | renderTaskPreview, renderProjectPreview 수정 |
| `_dashboard/css/panel.css` | .pending-entity-pane 너비 수정 |

#### 2.2 pending-panel.js 수정

**renderTaskPreview() 수정:**
```javascript
renderTaskPreview(task) {
    let html = '';
    // 기존 필드 렌더링...

    // Notes 섹션 추가
    const notes = task.body || task.notes || '';
    if (notes) {
        html += `
            <div class="entity-section entity-notes-section">
                <div class="entity-section-title">Notes</div>
                <div class="entity-notes-content markdown-body">
                    ${this.renderMarkdown(notes)}
                </div>
            </div>
        `;
    }
    return html;
}
```

**renderProjectPreview() 수정:**
```javascript
renderProjectPreview(project) {
    let html = '';
    // 기존 필드 렌더링...

    // Notes 섹션 추가
    const notes = project.body || '';
    if (notes) {
        html += `
            <div class="entity-section entity-notes-section">
                <div class="entity-section-title">Notes</div>
                <div class="entity-notes-content markdown-body">
                    ${this.renderMarkdown(notes)}
                </div>
            </div>
        `;
    }
    return html;
}
```

**renderMarkdown() 메서드 추가:**
```javascript
renderMarkdown(text) {
    if (!text) return '';
    if (typeof marked !== 'undefined') {
        return marked.parse(text);
    }
    // 폴백: 기본 이스케이프
    return this.escapeHtml(text).replace(/\n/g, '<br>');
}
```

#### 2.3 CSS 수정

```css
/* Right Pane: Entity Preview - 너비 확장 */
.pending-entity-pane {
    width: 450px;
    min-width: 400px;
    max-width: 550px;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
    .pending-entity-pane {
        width: 400px;
        min-width: 350px;
    }
}
```

---

### Todo

1. [ ] PendingPanel에 renderMarkdown() 메서드 추가
2. [ ] renderTaskPreview() 수정 - Notes 섹션 추가
3. [ ] renderProjectPreview() 수정 - Notes 섹션 추가
4. [ ] panel.css: .pending-entity-pane 너비 확장
5. [ ] 로컬 테스트 (Task/Project Notes 렌더링 확인)
6. [ ] NAS 배포

### 작업 로그

#### 2026-01-06
**개요**: Pending Panel Entity Preview에서 Notes 마크다운 렌더링 추가 및 패널 너비 확장

**변경사항**:
- `_dashboard/js/components/pending-panel.js`:
  - `renderMarkdown()` 메서드 추가 (marked.js 사용, 폴백 지원)
  - `renderProjectPreview()` 수정 - Notes 섹션 추가
  - `renderTaskPreview()` 수정 - Notes 섹션 추가
- `_dashboard/css/panel.css`:
  - `.pending-entity-pane` 너비 확장: 350px → 450px (min: 400px, max: 550px)
  - 반응형 미디어 쿼리 추가: @media (max-width: 1400px), @media (max-width: 1200px)

**핵심 코드**:
```javascript
// renderMarkdown() - 마크다운 렌더링
renderMarkdown(text) {
    if (!text) return '';
    if (typeof marked !== 'undefined') {
        try { return marked.parse(text); } catch (e) { }
    }
    return this.escapeHtml(text).replace(/\n/g, '<br>');
}
```

**결과**: 코드 구현 완료, 로컬 테스트 대기 중

---

## 참고 문서

- [[prj-n8n]] - 소속 Project
- [[tsk-n8n-10]] - 선행 Task (3단 레이아웃)
- [[tsk-n8n-13]] - 선행 Task (필드 선택 UX)

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
