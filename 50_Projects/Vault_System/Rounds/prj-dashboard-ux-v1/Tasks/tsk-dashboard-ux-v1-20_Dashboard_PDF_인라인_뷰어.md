---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-20"
entity_name: "Dashboard - PDF 인라인 뷰어"
created: 2026-01-02
updated: 2026-01-02
status: done

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-20"]

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
tags: [dashboard, pdf, viewer, attachment]
priority_flag: medium
---

# Dashboard - PDF 인라인 뷰어

> Task ID: `tsk-dashboard-ux-v1-20` | Project: `prj-dashboard-ux-v1` | Status: todo

## 목표

대시보드에서 PDF 첨부파일을 다운로드 없이 바로 볼 수 있는 뷰어 구현

**완료 조건**:
1. PDF 파일 클릭 시 모달/패널에서 PDF 뷰어 열림
2. PDF.js 기반 뷰어 (페이지 넘기기, 확대/축소)
3. 뷰어 닫기 버튼
4. 다운로드 버튼 (뷰어 내)

---

## 상세 내용

### 배경

- 첨부된 PDF 문서를 대시보드에서 바로 확인하고 싶음
- 다운로드 후 별도 앱으로 열기는 불편
- PDF.js는 브라우저에서 PDF 렌더링을 지원하는 라이브러리

### 작업 내용

1. PDF.js CDN 추가 (index.html)
2. PDF 뷰어 모달 컴포넌트 생성
3. 첨부파일 목록에서 PDF 클릭 시 뷰어 열기
4. 기본 컨트롤 (페이지 이동, 확대/축소)
5. 다운로드/닫기 버튼

---

## 체크리스트

- [ ] PDF.js CDN 추가
- [ ] pdf-viewer.js 컴포넌트 생성
- [ ] 뷰어 모달 HTML/CSS
- [ ] PDF 로딩 및 렌더링
- [ ] 페이지 네비게이션 (이전/다음/입력)
- [ ] 확대/축소 컨트롤
- [ ] 다운로드 버튼
- [ ] 닫기 버튼 및 ESC 키
- [ ] 모바일 반응형

---

## Notes

### PRD (Product Requirements Document)

#### 프로젝트 컨텍스트
| 항목 | 값 |
|------|-----|
| Framework | Vanilla JavaScript (ES6+) |
| PDF Library | PDF.js 4.x (CDN) |
| UI Pattern | Modal overlay (풀스크린) |
| 의존성 | tsk-19 (첨부파일 UI) |

#### 기능 요구사항
1. PDF 링크 클릭 시 모달 뷰어 열기
2. 페이지 네비게이션 (이전/다음, 페이지 번호)
3. 확대/축소 (50%~200%, 25% 단위)
4. 다운로드 버튼
5. 닫기 (X 버튼, ESC 키, 배경 클릭)

#### Modal Layout
```
┌──────────────────────────────────────────────────────────────┐
│  [filename.pdf]              < 1 / 10 >   [-] 100% [+]   ⬇ ✕ │
├──────────────────────────────────────────────────────────────┤
│                    ┌─────────────────┐                       │
│                    │   PDF Page      │                       │
│                    │   (Canvas)      │                       │
│                    └─────────────────┘                       │
└──────────────────────────────────────────────────────────────┘
```

---

### Tech Spec

#### 파일 구조
```
public/_dashboard/
├── index.html              # PDF.js CDN + Modal HTML
├── css/pdf-viewer.css      # 신규 스타일
├── js/components/
│   └── pdf-viewer.js       # 신규 컴포넌트
└── js/app.js               # PDFViewer.init() 호출
```

#### PDFViewer 객체
```javascript
const PDFViewer = {
    pdfDoc: null,
    currentPage: 1,
    totalPages: 0,
    scale: 1.0,

    init(),           // 모달 생성, 이벤트 바인딩
    open(url),        // PDF 로드, 첫 페이지 렌더링
    close(),          // 정리, 모달 숨김
    renderPage(num),  // 페이지 렌더링
    prevPage(),       // 이전 페이지
    nextPage(),       // 다음 페이지
    zoomIn(),         // +25%, max 200%
    zoomOut(),        // -25%, min 50%
    download(),       // 다운로드 트리거
};
```

#### PDF.js CDN
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs" type="module"></script>
```

#### 키보드 단축키
| 키 | 동작 |
|---|------|
| ESC | 닫기 |
| ← / → | 페이지 이동 |
| + / - | 확대/축소 |

---

### Todo
- [ ] PDF.js CDN 추가 (`index.html`)
- [ ] PDF 뷰어 모달 HTML 추가
- [ ] `pdf-viewer.css` 생성 (풀스크린 모달, 툴바)
- [ ] `pdf-viewer.js` 생성
- [ ] `init()` - 모달 생성, 이벤트 바인딩
- [ ] `open(url)` - PDF 로드, 렌더링
- [ ] `renderPage(num)` - 캔버스 렌더링
- [ ] 페이지 네비게이션 구현
- [ ] 확대/축소 구현
- [ ] 다운로드 버튼
- [ ] 닫기 기능 (X, ESC, 배경)
- [ ] 키보드 단축키
- [ ] 로딩 스피너
- [ ] 에러 핸들링
- [ ] `app.js`에 `PDFViewer.init()` 추가
- [ ] 모바일 반응형

### 작업 로그

#### 2026-01-02
**개요**: PDF.js 기반 인라인 PDF 뷰어를 대시보드에 구현했습니다. Codex와의 코드 리뷰를 통해 race condition, memory leak 등 품질 이슈를 개선했습니다.

**변경사항**:
- 신규:
  - `_dashboard/css/pdf-viewer.css` - 풀스크린 모달, 툴바, 로딩 스피너, 모바일 반응형
  - `_dashboard/js/components/pdf-viewer.js` - PDFViewer 객체 (~520 lines)
- 수정:
  - `_dashboard/index.html` - PDF 뷰어 모달 HTML (ARIA 속성 포함)
  - `_dashboard/js/components/task-panel.js` - PDF 뷰어 버튼 연동
  - `_dashboard/js/app.js` - PDFViewer.init() 호출

**핵심 기능**:
- PDF.js 4.x CDN 동적 로드 (ES Module)
- 페이지 네비게이션 (이전/다음/직접 입력)
- 확대/축소 (50%~200%, 25% 단위)
- 다운로드 버튼
- 키보드 단축키 (ESC, ←/→, +/-)
- 접근성 (ARIA attributes, focus trap)

**Codex 리뷰 반영**:
- **Race condition 방지**: requestToken으로 stale 요청 무시
- **Memory leak 방지**: AbortController로 fetch 취소, loadingTask.destroy()
- **중복 로드 제거**: HTML script 태그 제거, import()만 사용
- **CDN 에러 처리**: 에러 시 사용자에게 알림 + 재시도 기능

**결과**: PDF 첨부파일을 대시보드에서 인라인으로 볼 수 있음


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[tsk-dashboard-ux-v1-19]] - 첨부파일 UI (의존)
- [PDF.js](https://mozilla.github.io/pdf.js/)

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**: 2026-01-02
