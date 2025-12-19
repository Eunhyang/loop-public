---
entity_type: Experiment
entity_id: "exp:{{NUMBER}}"
entity_name: "{{EXPERIMENT_NAME}}"
created: {{DATE}}
updated: {{DATE}}
status: planning

# === 계층 ===
parent_id: null
aliases: []

# === 관계 ===
outgoing_relations: []
validates: ["hyp:{{HYP_NUMBER}}"]
validated_by: []

# === Experiment 전용 ===
hypothesis_id: "hyp:{{HYP_NUMBER}}"
protocol: "{{PROTOCOL}}"
metrics: []
start_date: null
end_date: null
result_summary: null
outcome: null

# === 분류 ===
tags: []
priority_flag: medium
---

# {{EXPERIMENT_NAME}}

> Experiment ID: `exp:{{NUMBER}}` | Hypothesis: `hyp:{{HYP_NUMBER}}` | Status: planning

## 검증 대상 가설

**[[hyp:{{HYP_NUMBER}}]]**: "{{HYPOTHESIS_TEXT}}"

---

## 실험 설계

### 프로토콜
{{PROTOCOL}}

### 측정 지표
| Metric | 측정 방법 | 성공 기준 |
|--------|----------|----------|
| | | |

### 기간
- **시작**:
- **종료**:

---

## 대상

### 참여자
-

### 조건
-

---

## 결과

### 데이터
| Metric | 결과 | 기준 대비 |
|--------|------|----------|
| | | |

### 결론
**Outcome**: (positive / negative / inconclusive)

### 요약


---

## 다음 단계

### 결과가 positive면
-

### 결과가 negative면
-

---

## 참고 문서

- [[hyp:{{HYP_NUMBER}}]] - 검증 대상 가설

---

**Created**: {{DATE}}
**Outcome**: pending
