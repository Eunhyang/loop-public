---
entity_type: Task
entity_id: tsk-vault-gpt-02
entity_name: MCP API TaskUpdate 모델 확장
created: 2025-12-26
updated: '2025-12-27'
status: hold
parent_id: prj-vault-gpt
project_id: prj-vault-gpt
aliases:
- tsk-vault-gpt-02
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
due: '2025-12-27'
priority: high
estimated_hours: 2
actual_hours: null
type: dev
target_project: loop
tags:
- mcp
- api
- agent-builder
priority_flag: high
start_date: '2025-12-27'
---
# MCP API TaskUpdate 모델 확장

> Task ID: `tsk-vault-gpt-02` | Project: `prj-vault-gpt` | Status: doing

## 목표

**완료 조건**:
1. TaskUpdate 모델에 `conditions_3y`, `closed`, `closed_inferred`, `project_id` 필드 추가
2. PUT /api/tasks/{task_id} 엔드포인트에서 해당 필드 수정 가능
3. OpenAI Agent Builder에서 MCP를 통해 Task 프로퍼티 자동 채우기 파이프라인 구현 가능

---

## 상세 내용

### 배경

OpenAI Agent Builder로 "빠진 프로퍼티 자동 채우기" 파이프라인을 구현하려면 MCP API가 모든 Task 필드를 수정할 수 있어야 함.

현재 TaskUpdate 모델에 빠진 필드:
- `conditions_3y` - 3년 전략 연결
- `closed` - 완료일
- `closed_inferred` - closed 추론 출처
- `project_id` - 프로젝트 ID

### 작업 내용

1. `api/models/entities.py`의 TaskUpdate 클래스 확장
2. `api/routers/tasks.py`의 update_task 함수에서 새 필드 처리
3. MCP를 통한 테스트

---

## 체크리스트

- [ ] TaskUpdate 모델에 필드 추가
- [ ] update_task 라우터에서 필드 처리
- [ ] Docker 재빌드 및 배포
- [ ] Agent Builder에서 테스트

---

## 메모

Agent Builder 파이프라인:
1. GET /api/tasks → 빠진 필드 감지
2. LLM 추론 (conditions_3y, due, priority 등)
3. PUT /api/tasks/{id} → 수정

---

## 참고 문서

- [[prj-vault-gpt]] - 소속 Project
- `api/models/entities.py` - Pydantic 모델
- `api/routers/tasks.py` - Task API 라우터

---

**Created**: 2025-12-26
**Assignee**: 김은향
**Due**: 2025-12-26