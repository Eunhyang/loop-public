---
entity_type: Task
entity_id: "tsk:{{PRJ_NUMBER}}-{{SEQ}}"
entity_name: "{{TASK_NAME}}"
created: {{DATE}}
updated: {{DATE}}
status: planning

# === 계층 ===
parent_id: "prj:{{PRJ_NUMBER}}"
project_id: "prj:{{PRJ_NUMBER}}"
aliases: ["tsk:{{PRJ_NUMBER}}-{{SEQ}}"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "{{ASSIGNEE}}"
due: null
priority: medium
estimated_hours: null
actual_hours: null

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond:{{CONDITION}}"]  # 최소 1개 필수 (a-e)

# === 분류 ===
tags: []
priority_flag: medium
---

# {{TASK_NAME}}

> Task ID: `tsk:{{PRJ_NUMBER}}-{{SEQ}}` | Project: `prj:{{PRJ_NUMBER}}` | Status: planning

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

## 메모


---

## 참고 문서

- [[prj:{{PRJ_NUMBER}}]] - 소속 Project

---

**Created**: {{DATE}}
**Assignee**: {{ASSIGNEE}}
**Due**:
