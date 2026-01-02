---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-21"
entity_name: "Dashboard - 첨부파일 텍스트 추출 API"
created: 2026-01-02
updated: 2026-01-02
status: todo

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-21"]

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
tags: [dashboard, attachment, text-extraction, llm, b-score]
priority_flag: medium
---

# Dashboard - 첨부파일 텍스트 추출 API

> Task ID: `tsk-dashboard-ux-v1-21` | Project: `prj-dashboard-ux-v1` | Status: todo

## 목표

첨부파일(PDF, HWP 등)에서 텍스트를 추출하여 LLM이 읽을 수 있도록 API 제공

**완료 조건**:
1. GET /api/tasks/{id}/attachments/{filename}/text - 텍스트 추출 반환
2. PDF 텍스트 추출 (PyPDF2 또는 pdfplumber)
3. HWP 텍스트 추출 (olefile 또는 hwp5)
4. n8n 워크플로우에서 호출 가능
5. B Score 계산 시 증거자료로 활용 가능

---

## 상세 내용

### 배경

- B Score (Realized Impact) 계산 시 첨부된 증거자료 분석 필요
- n8n 워크플로우에서 LLM에게 첨부파일 내용을 컨텍스트로 전달
- 파일 바이너리가 아닌 텍스트로 추출해야 LLM이 읽을 수 있음

### 작업 내용

1. 텍스트 추출 엔드포인트 추가 (`/text`)
2. PDF 추출: pdfplumber 라이브러리 사용
3. HWP 추출: olefile 또는 hwp5 라이브러리 사용
4. 지원하지 않는 형식은 에러 반환
5. 캐싱 고려 (동일 파일 재추출 방지)

### 지원 형식

| 형식 | 라이브러리 | 비고 |
|------|-----------|------|
| PDF | pdfplumber | 텍스트 + 테이블 추출 |
| HWP | olefile/hwp5 | 한글 문서 |
| TXT | 직접 읽기 | 인코딩 감지 |
| MD | 직접 읽기 | 마크다운 |

---

## 체크리스트

- [ ] pdfplumber 의존성 추가 (pyproject.toml)
- [ ] olefile/hwp5 의존성 추가
- [ ] GET /text 엔드포인트 구현
- [ ] PDF 텍스트 추출 함수
- [ ] HWP 텍스트 추출 함수
- [ ] 지원 형식 검사 및 에러 처리
- [ ] 추출 결과 캐싱 (선택)
- [ ] n8n 연동 테스트

---

## Notes

### Todo
- [ ] 라이브러리 조사 (pdfplumber vs PyPDF2)
- [ ] HWP 추출 방법 확인
- [ ] 엔드포인트 구현
- [ ] n8n 워크플로우 테스트

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)
-->


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[tsk-dashboard-ux-v1-18]] - 첨부파일 API (의존)
- [pdfplumber](https://github.com/jsvine/pdfplumber)
- [olefile](https://olefile.readthedocs.io/)

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**: 2026-01-02
