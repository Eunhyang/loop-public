---
entity_type: Hypothesis
entity_id: "hyp-4-02"
entity_name: "GLP-1 과정 수요 재현"
created: 2025-12-20
updated: 2025-12-20
status: planning

# === 계층 관계 ===
parent_id: "trk-4"
aliases:
  - "hyp-4-02"
  - "GLP1과정_수요재현"

# === 가설 정의 (필수 4요소) ===
hypothesis_question: "GLP-1 과정은 '결제 의지'가 있는 수요가 반복되는가?"
success_criteria: "2026-06-30까지 2회 연속 유료 코호트 성립"
failure_criteria: "문의는 있는데 결제가 안 됨(결제전환 낮음) 반복"
measurement: "문의→상담→결제 퍼널"

# === 시간 범위 ===
horizon: "2026"
deadline: 2026-06-30

# === 상태 ===
evidence_status: planning
confidence: 0.5

# === 분류 ===
loop_layer: []
tags: ["2026", "trk-4", "coaching", "glp-1", "demand"]

# === 검증 연결 ===
validates: []
validated_by: []
---

# GLP-1 과정 수요 재현

> Track: [[Track_4_Coaching]] | ID: `hyp-4-02` | 상태: planning

## 가설

**Q: GLP-1 과정은 '결제 의지'가 있는 수요가 반복되는가?**

---

## 판정 기준

### 성공 (Success)
2026-06-30까지 2회 연속 유료 코호트 성립

### 실패 (Failure)
문의는 있는데 결제가 안 됨(결제전환 낮음) 반복

---

## 측정 방법

**데이터 소스**: 문의→상담→결제 퍼널

**측정 지표**:
- 문의 건수
- 상담 전환율
- 결제 전환율

---

## 검증 로그

| 날짜 | 상태 | 메모 |
|------|------|------|
| 2025-12-20 | planning | 가설 정의 완료 |
