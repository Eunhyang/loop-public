---
entity_type: Task
entity_id: "tsk-{{PRJ_NUMBER}}-{{SEQ}}"
entity_name: "{{TASK_NAME}}"
created: {{DATE}}
updated: {{DATE}}
status: todo

# === 계층 ===
parent_id: "prj-{{PRJ_NUMBER}}"
project_id: "prj-{{PRJ_NUMBER}}"
aliases: ["tsk-{{PRJ_NUMBER}}-{{SEQ}}"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "{{ASSIGNEE}}"
start_date: {{DATE}}
due: {{DATE}}
priority: medium
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: {{TYPE}}                   # dev | strategy | research | ops | null
target_project: {{TARGET_PROJECT}}  # type=dev일 때만: sosi | kkokkkok | loop-api | null

# === 분류 ===
tags: []
priority_flag: medium
---

# {{TASK_NAME}}

> Task ID: `tsk-{{PRJ_NUMBER}}-{{SEQ}}` | Project: `prj-{{PRJ_NUMBER}}` | Status: todo

## 목표

**완료 조건**:
1.

---

## 상세 내용

### 배경


### 작업 내용


---

## 체크리스트

- [ ]
- [ ]
- [ ]

---

## Notes

### Todo
- [ ]
- [ ]
- [ ]

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

- [[prj-{{PRJ_NUMBER}}]] - 소속 Project

---

**Created**: {{DATE}}
**Assignee**: {{ASSIGNEE}}
**Due**:
