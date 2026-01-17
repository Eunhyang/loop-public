---
entity_type: Track
entity_id: "trk-{NUMBER}"
entity_name: "{트랙명}"
created: {YYYY-MM-DD}
updated: {YYYY-MM-DD}
status: active

# === 계층 ===
parent_id: "cond-{CONDITION}"
aliases: ["trk-{NUMBER}"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Track 전용 ===
horizon: "12month"
hypothesis: "{트랙 가설}"
focus: []
owner: "{담당자}"
objectives:
  - metric: ""
    target: ""
    current: ""
    status: "진행 중"

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-{CONDITION}"]  # 최소 1개 필수 (a-e)

# === 분류 ===
tags: ["track", "12month"]
priority_flag: medium
---

# Track {NUMBER}: {트랙명}

> Track ID: `trk-{NUMBER}` | Status: Active | Owner: {담당자}

## Track 선언

**"{트랙 가설}"**

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
| [[prj-{NUMBER}]] | | | |

---

## Track 간 관계

### 의존
-

### 지원
-

---

## 참고 문서

- [[cond-{CONDITION}]] - 상위 Condition

---

**Created**: {YYYY-MM-DD}
**Owner**: {담당자}
