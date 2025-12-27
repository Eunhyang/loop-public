---
entity_type: Task
entity_id: tsk-n8n-04
entity_name: n8n LLM 프롬프트 템플릿 개선
created: 2025-12-27
updated: 2025-12-27
status: doing

# === 계층 ===
parent_id: prj-n8n-entity-autofill
project_id: prj-n8n-entity-autofill
aliases:
- tsk-n8n-04

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: 김은향
start_date: 2025-12-27
due: 2025-12-27
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===
conditions_3y:
- cond-e

# === 분류 ===
tags:
- n8n
- llm
- automation
priority_flag: high
---

# n8n LLM 프롬프트 템플릿 개선

> Task ID: `tsk-n8n-04` | Project: `prj-n8n-entity-autofill` | Status: doing

## 목표

**완료 조건**:
1. LLM 프롬프트에 Task 컨텍스트(entity_name, notes, project_id 등)가 정상 전달
2. LLM이 Task별 맥락에 맞는 제안값 생성 (동일 패턴 응답 해결)
3. E2E 테스트 통과

---

## 상세 내용

### 배경

tsk-n8n-02에서 발견된 이슈:
- n8n 템플릿 `{{ JSON.stringify($json.original_task, null, 2) }}` 치환 실패
- LLM이 "과업 성격 불명확" 등 generic 응답 반환
- 12개 Task 모두 동일 패턴 제안 (cond-a, 김은향/소상민, 2026-01-10)

**현재 상태 평가**:
| 항목 | 결과 |
|------|------|
| Input 전달 | ✅ 12개 Task, original_task 완벽 포함 |
| LLM 응답 | ✅ 12/12 성공 (에러/빈 응답 없음) |
| 이슈 탐지 | ✅ 정확함 |
| LLM 맥락 참조 | ⚠️ 실패 (개선 필요) |

### 작업 내용

1. **n8n LLM 노드 분석**
   - OpenAI 노드의 프롬프트 표현식 확인
   - `$json.original_task` 참조 방식 점검
   - n8n 템플릿 치환 메커니즘 이해

2. **프롬프트 개선**
   - LLM에 Task 데이터가 실제로 전달되도록 수정
   - entity_name, notes, project_id 등 핵심 필드 명시적 전달
   - 프롬프트 템플릿 재구성

3. **테스트 및 검증**
   - n8n 워크플로우 재실행
   - LLM 응답이 Task별로 맥락에 맞는지 확인

---

## 체크리스트

- [ ] n8n LLM Inference 노드 프롬프트 분석
- [ ] 프롬프트 템플릿 수정 (original_task 데이터 포함)
- [ ] n8n 워크플로우 재배포
- [ ] E2E 테스트 (LLM이 Task별 맥락 응답 확인)

---

## Notes

### 기술 스택

- **n8n**: https://n8n.sosilab.synology.me
- **워크플로우 파일**: `_build/n8n_workflows/entity_schema_validator.json`
- **LLM**: OpenAI GPT-4o

### 참고

- 선행 Task: [[tsk-n8n-02]] (기본 워크플로우 완료)
- n8n 템플릿 문법: `{{ expression }}`

### 작업 로그

---

## 참고 문서

- [[prj-n8n-entity-autofill]] - 소속 Project
- [[tsk-n8n-02]] - 선행 Task

---

**Created**: 2025-12-27
**Assignee**: 김은향
**Due**: 2025-12-27
