---
entity_type: Track
entity_id: "trk:{{NUMBER}}"
entity_name: "{{TRACK_NAME}}"
created: {{DATE}}
updated: {{DATE}}
status: active

# === 계층 ===
parent_id: "cond:{{CONDITION}}"
aliases: []

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Track 전용 ===
horizon: "12month"
hypothesis: "{{TRACK_HYPOTHESIS}}"
focus: []
owner: "{{OWNER}}"
objectives:
  - metric: ""
    target: ""
    current: ""
    status: "진행 중"

# === 분류 ===
tags: ["track", "12month"]
priority_flag: medium
---

# Track {{NUMBER}}: {{TRACK_NAME}}

> Track ID: `trk:{{NUMBER}}` | Status: Active | Owner: {{OWNER}}

## Track 선언

**"{{TRACK_HYPOTHESIS}}"**

---

## 이 Track의 본질

### 이것이 아니다
-

### 이것이다
-

---

## 12개월 Focus

### Focus 1:
**현재**:
**목표**:
**진행률**: %

### Focus 2:
**현재**:
**목표**:
**진행률**: %

---

## 목표 (중단 신호)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| | | | |

---

## Projects

| ID | Name | Status | Progress |
|----|------|--------|----------|
| [[prj:{{PRJ_ID}}]] | | | |

---

## Track 간 관계

### 의존
-

### 지원
-

---

## 참고 문서

- [[cond:{{CONDITION}}]] - 상위 Condition

---

**Created**: {{DATE}}
**Owner**: {{OWNER}}
