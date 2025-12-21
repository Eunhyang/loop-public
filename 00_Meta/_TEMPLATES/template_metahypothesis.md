---
entity_type: MetaHypothesis
entity_id: "mh-{{NUMBER}}"
entity_name: "{{MH_NAME}}"
created: {{DATE}}
updated: {{DATE}}
status: assumed

# === 계층 ===
parent_id: "ns-001"
aliases: ["mh-{{NUMBER}}"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === MetaHypothesis 전용 ===
if_broken: "회사 재검토"
evidence_status: assumed
confidence: 0.0

# === 분류 ===
tags: ["metahypothesis", "core"]
priority_flag: critical
---

# MH{{NUMBER}}: {{MH_NAME}}

> MetaHypothesis ID: `mh-{{NUMBER}}` | Status: assumed | **CRITICAL**

## 가설

**"{{MH_FULL_TEXT}}"**

---

## 왜 이것이 Meta Hypothesis인가?

이것이 거짓이면 **회사의 존재 이유가 사라짐**.

---

## 검증 상태

| 증거 | 방향 | 출처 | 신뢰도 |
|------|------|------|--------|
| | positive/negative | | |

**Evidence Status**: assumed
**Confidence**: 0%

---

## 만약 거짓이라면?

### 영향
- 회사 존재 이유 재검토
-

### 대응 옵션
1. 피봇
2. 종료
3.

---

## 검증하는 것들

| Entity | Type | Status |
|--------|------|--------|
| | | |

---

## 하위 Conditions

| Condition | Status |
|-----------|--------|
| [[cond-{{COND_LETTER}}]] | |

---

## 참고 문서

- [[ns-001]] - North Star

---

**Created**: {{DATE}}
**If Broken**: 회사 재검토
