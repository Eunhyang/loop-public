---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-18"
entity_name: "Dashboard - Task 첨부파일 업로드 API"
created: 2026-01-02
updated: 2026-01-02
status: doing

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-18"]

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
tags: [dashboard, attachment, api, upload]
priority_flag: medium
---

# Dashboard - Task 첨부파일 업로드 API

> Task ID: `tsk-dashboard-ux-v1-18` | Project: `prj-dashboard-ux-v1` | Status: doing

## 목표

Task에 첨부파일을 업로드/조회/삭제할 수 있는 백엔드 API 구현

**완료 조건**:
1. POST /api/tasks/{id}/attachments - 파일 업로드 동작
2. GET /api/tasks/{id}/attachments - 첨부파일 목록 반환
3. GET /api/tasks/{id}/attachments/{filename} - 파일 서빙 (다운로드/뷰어용)
4. DELETE /api/tasks/{id}/attachments/{filename} - 파일 삭제
5. 파일은 `_attachments/{task_id}/` 폴더에 저장
6. `.gitignore`에 `_attachments/` 추가 (Git 제외)

---

## 상세 내용

### 배경

- 칸반 대시보드에서 Task에 증거자료(PDF, HWP, MP3 등) 첨부 필요
- 첨부파일은 NAS에만 저장, Git 동기화 제외
- 추후 LLM이 파일 내용을 읽어 B Score 계산에 활용

### 작업 내용

1. `api/routers/attachments.py` 라우터 생성
2. 파일 업로드 핸들러 (multipart/form-data)
3. 파일 목록 조회 (파일명, 크기, 타입, 업로드일시)
4. 파일 서빙 (Content-Type 적절히 설정)
5. 파일 삭제
6. `.gitignore` 업데이트

---

## 체크리스트

- [ ] `api/routers/attachments.py` 생성
- [ ] POST 업로드 엔드포인트 구현
- [ ] GET 목록 엔드포인트 구현
- [ ] GET 파일 서빙 엔드포인트 구현
- [ ] DELETE 삭제 엔드포인트 구현
- [ ] `_attachments/` 폴더 구조 생성
- [ ] `.gitignore`에 추가
- [ ] API 테스트

---

## Notes

### Todo
- [ ] attachments.py 라우터 생성
- [ ] main.py에 라우터 등록
- [ ] 파일 업로드 테스트

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)

#### YYYY-MM-DD HH:MM
**개요**: 2-3문장 요약

**변경사항**:
- 개발:
- 수정:
- 개선:

**핵심 코드**: (필요시)

**결과**: ✅ 빌드 성공 / ❌ 실패

**다음 단계**:
-->


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**: 2026-01-02
