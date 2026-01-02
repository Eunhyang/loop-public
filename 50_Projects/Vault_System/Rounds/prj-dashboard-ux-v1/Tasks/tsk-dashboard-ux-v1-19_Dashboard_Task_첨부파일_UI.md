---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-19"
entity_name: "Dashboard - Task 첨부파일 UI"
created: 2026-01-02
updated: 2026-01-02
status: todo

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-19"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-02
due: 2026-01-02
priority: medium
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 분류 ===
tags: [dashboard, attachment, ui, upload]
priority_flag: medium
---

# Dashboard - Task 첨부파일 UI

> Task ID: `tsk-dashboard-ux-v1-19` | Project: `prj-dashboard-ux-v1` | Status: todo

## 목표

Task Panel에서 첨부파일을 업로드/조회/삭제할 수 있는 UI 구현

**완료 조건**:
1. Task Panel에 "Attachments" 섹션 추가
2. 파일 업로드 버튼 (드래그앤드롭 또는 클릭)
3. 첨부파일 목록 표시 (파일명, 크기, 타입)
4. 파일별 다운로드/삭제 버튼
5. PDF 파일은 뷰어 아이콘 표시 (tsk-20에서 구현)

---

## 상세 내용

### 배경

- Task Panel(`task-panel.js`)에서 첨부파일 관리 UI 필요
- 기존 Links 섹션과 유사한 UX
- API는 tsk-18에서 구현

### 작업 내용

1. `task-panel.js`에 Attachments 섹션 추가
2. 파일 업로드 UI (input type=file + 드래그앤드롭)
3. 첨부파일 목록 렌더링
4. 파일별 액션 버튼 (다운로드, 삭제, PDF 뷰어)
5. 업로드 진행 상태 표시
6. CSS 스타일링

---

## 체크리스트

- [ ] task-panel.js에 Attachments 섹션 HTML 추가
- [ ] 파일 업로드 UI 구현 (input + 드래그앤드롭)
- [ ] API 연동 (upload, list, delete)
- [ ] 첨부파일 목록 렌더링
- [ ] 다운로드 링크 동작
- [ ] 삭제 버튼 동작
- [ ] 업로드 진행 상태 UI
- [ ] CSS 스타일 추가

---

## Notes

### PRD (Product Requirements Document)

#### 프로젝트 컨텍스트
| 항목 | 값 |
|------|-----|
| Framework | Vanilla JavaScript (ES6+) |
| Architecture | 모듈 패턴 (단일 객체) |
| State | `State` 전역 객체 |
| API Client | `API` 모듈 (`api.js`) |
| 의존성 | tsk-18 (API), tsk-20 (PDF 뷰어) |

#### UI 컴포넌트 구조
```
Task Panel
├── [기존 섹션들: Basic Info, Relations, Links]
└── Attachments 섹션 (신규)
    ├── 업로드 영역 (드래그앤드롭 + 버튼)
    ├── 업로드 진행 바
    └── 첨부파일 목록
        └── 각 파일: 아이콘, 이름, 크기, 타입, 액션(뷰어/다운로드/삭제)
```

#### 파일 타입별 아이콘
| 타입 | 아이콘 |
|------|--------|
| PDF | 📄 (+ 뷰어 버튼 👁) |
| HWP | 📋 |
| 이미지 | 🖼 |
| 오디오 | 🎵 |
| 비디오 | 🎬 |
| 기타 | 📎 |

---

### Tech Spec

#### 파일 변경
```
public/_dashboard/
├── js/
│   ├── api.js                    # API 함수 추가
│   └── components/task-panel.js  # Attachments 섹션 추가
├── css/panel.css                 # 스타일 추가
└── index.html                    # HTML 구조 추가
```

#### api.js 추가 함수
```javascript
uploadAttachment(taskId, file, onProgress)  // POST (XMLHttpRequest for progress)
getAttachments(taskId)                       // GET 목록
getAttachmentUrl(taskId, filename)           // URL 생성
deleteAttachment(taskId, filename)           // DELETE
```

#### task-panel.js 추가 메서드
```javascript
renderAttachments(taskId)      // 섹션 렌더링
renderAttachmentList(taskId)   // 파일 목록 렌더링
getFileIcon(mimeType, filename) // 타입별 아이콘
formatFileSize(bytes)          // 크기 포맷 (KB/MB)
setupUploadEvents()            // 드래그앤드롭 이벤트
uploadFiles(files)             // 업로드 처리
bindAttachmentEvents(taskId)   // 이벤트 바인딩
```

---

### Todo
- [ ] `api.js`에 첨부파일 API 함수 추가
- [ ] `index.html`에 Attachments 섹션 HTML 추가
- [ ] `task-panel.js`에 `renderAttachments()` 구현
- [ ] 드래그앤드롭 업로드 구현
- [ ] 업로드 진행 바 표시
- [ ] 파일 목록 렌더링 (아이콘, 크기, 타입)
- [ ] PDF 뷰어 버튼 (tsk-20 연동 포인트)
- [ ] 다운로드 버튼
- [ ] 삭제 버튼 (확인 후 삭제)
- [ ] `open()`/`openNew()` 함수에 attachments 로드 추가
- [ ] `panel.css`에 스타일 추가
- [ ] 모바일 반응형

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)
-->


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[tsk-dashboard-ux-v1-18]] - 첨부파일 API (의존)

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**: 2026-01-02
