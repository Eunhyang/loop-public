---
entity_type: Condition
entity_id: "cond:{{LETTER}}"
entity_name: "{{CONDITION_NAME}}"
created: {{DATE}}
updated: {{DATE}}
status: in_progress

# === 계층 ===
parent_id: "mh:{{MH_NUMBER}}"
aliases: []

# === 관계 ===
outgoing_relations:
  - type: triggers_shutdown
    target_id: "action:{{SHUTDOWN_ACTION}}"
    description: "{{IF_BROKEN_DESC}}"
validates: []
validated_by: []

# === Condition 전용 ===
unlock: "{{UNLOCK_DESC}}"
if_broken: "{{IF_BROKEN_DESC}}"
metrics:
  - name: ""
    threshold: ""
    current: ""
    status: ""

# === 분류 ===
tags: ["condition", "3year"]
priority_flag: high
---

# Condition {{LETTER}}: {{CONDITION_NAME}}

> Condition ID: `cond:{{LETTER}}` | Status: in_progress

## Condition 정의

**조건**: "{{CONDITION_QUESTION}}"

**충족 시**: {{UNLOCK_DESC}}

**깨짐 시**: {{IF_BROKEN_DESC}}

---

## 측정 지표

| Metric | Threshold | Current | Status |
|--------|-----------|---------|--------|
| | | | |

---

## 충족 경로

### 현재 상태


### 필요 액션


---

## 만약 깨지면?

### 트리거
-

### 대응
-

---

## 관련 Tracks

| Track | 역할 |
|-------|------|
| [[trk:{{TRK_NUMBER}}]] | |

---

## 참고 문서

- [[mh:{{MH_NUMBER}}]] - 상위 MetaHypothesis

---

**Created**: {{DATE}}
**Status**: in_progress
