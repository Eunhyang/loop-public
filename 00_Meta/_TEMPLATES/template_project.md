---
entity_type: Project
entity_id: "prj:{{NUMBER}}"
entity_name: "{{PROJECT_NAME}}"
created: {{DATE}}
updated: {{DATE}}
status: planning

# === 계층 ===
parent_id: "trk:{{TRACK_NUMBER}}"
aliases: []

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Project 전용 ===
owner: "{{OWNER_NAME}}"
budget: null
deadline: null
hypothesis_text: "{{PROJECT_HYPOTHESIS}}"
experiments: []

# === 분류 ===
tags: []
priority_flag: medium
---

# {{PROJECT_NAME}}

> Project ID: `prj:{{NUMBER}}` | Track: `trk:{{TRACK_NUMBER}}` | Status: planning

## Project 가설

**"{{PROJECT_HYPOTHESIS}}"**

---

## 목표

### 성공 기준
1.

### 실패 신호
1.

---

## 배경

### 왜 이 프로젝트인가?


### 선행 조건


---

## 실행 계획

### Phase 1:
- [ ]

### Phase 2:
- [ ]

---

## Tasks

| ID | Name | Assignee | Status | Due |
|----|------|----------|--------|-----|
| tsk:{{NUMBER}}-01 | | | planning | |

---

## 관련 가설

- [[hyp:{{HYP_ID}}]] -

---

## 참고 문서

- [[trk:{{TRACK_NUMBER}}]] - 소속 Track

---

**Created**: {{DATE}}
**Owner**: {{OWNER_NAME}}
