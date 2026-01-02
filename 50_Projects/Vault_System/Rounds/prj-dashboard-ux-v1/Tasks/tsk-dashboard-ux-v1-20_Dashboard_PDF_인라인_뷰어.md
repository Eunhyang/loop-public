---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-20"
entity_name: "Dashboard - PDF 인라인 뷰어"
created: 2026-01-02
updated: 2026-01-02
status: todo

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

### Todo
- [ ] PDF.js 라이브러리 조사
- [ ] 뷰어 컴포넌트 설계
- [ ] 구현 및 테스트

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)
-->


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[tsk-dashboard-ux-v1-19]] - 첨부파일 UI (의존)
- [PDF.js](https://mozilla.github.io/pdf.js/)

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**: 2026-01-02
