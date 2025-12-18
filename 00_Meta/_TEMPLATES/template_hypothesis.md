---
entity_type: Hypothesis
entity_id: "hyp:{{NUMBER}}"
entity_name: "{{HYPOTHESIS_NAME}}"
created: {{DATE}}
updated: {{DATE}}
status: planning

# === 계층 ===
parent_id: null
aliases: []

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Hypothesis 전용 ===
hypothesis_text: "{{HYPOTHESIS_FULL_TEXT}}"
evidence_status: planning
confidence: 0.0
loop_layer: []

# === 분류 ===
tags: []
priority_flag: medium
---

# {{HYPOTHESIS_NAME}}

> Hypothesis ID: `hyp:{{NUMBER}}` | Status: planning | Confidence: 0%

## 가설

**"{{HYPOTHESIS_FULL_TEXT}}"**

---

## 검증 방법

### 검증 기준
**참(True)으로 판정하려면**:
1.

**거짓(False)으로 판정하려면**:
1.

---

## 검증 상태

| 증거 | 방향 | 출처 | 신뢰도 |
|------|------|------|--------|
| | positive/negative | | |

---

## 관련 프로젝트

| Project | 역할 | Status |
|---------|------|--------|
| [[prj:{{PRJ_ID}}]] | 검증 | |

---

## 관련 실험

| Experiment | 결과 | Date |
|------------|------|------|
| [[exp:{{EXP_ID}}]] | | |

---

## 만약 거짓이라면?

### 영향
-

### 대응
-

---

## 참고 문서

-

---

**Created**: {{DATE}}
**Evidence Status**: planning
**Confidence**: 0%
