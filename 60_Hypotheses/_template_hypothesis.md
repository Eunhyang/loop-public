---
entity_type: Hypothesis
entity_id: "hyp-{TRK}-{SEQ}"
entity_name: "{가설 제목}"
created: {YYYY-MM-DD}
updated: {YYYY-MM-DD}
status: planning

# === 계층 관계 ===
parent_id: "trk-{TRK}"
aliases:
  - "hyp-{TRK}-{SEQ}"
  - "{가설_제목_스네이크}"

# === 가설 정의 (필수 4요소) ===
hypothesis_question: "{핵심 질문}?"
success_criteria: "{성공 판정 기준 - 구체적 수치 포함}"
failure_criteria: "{실패 판정 기준 - 구체적 수치 포함}"
measurement: "{측정 방법/데이터 소스}"

# === 시간 범위 ===
horizon: "2026"
deadline: null

# === 상태 ===
evidence_status: planning
confidence: 0.5

# === 분류 ===
loop_layer: []
tags: ["2026", "trk-{TRK}"]

# === 검증 연결 ===
validates: []
validated_by: []

# === 협업 필드 ===
notes: null
links: []
attachments: []
---

# {가설 제목}

> Track: [[Track_{TRK}_{TRACK_NAME}]] | ID: `hyp-{TRK}-{SEQ}` | 상태: planning

## 가설

**Q: {핵심 질문}?**

---

## 판정 기준

### 성공 (Success)
{성공 판정 기준}

### 실패 (Failure)
{실패 판정 기준}

---

## 측정 방법

**데이터 소스**: {측정 방법/데이터 소스}

**측정 지표**:
-

---

## 검증 로그

| 날짜 | 상태 | 메모 |
|------|------|------|
| {YYYY-MM-DD} | planning | 가설 정의 완료 |

---

## 관련 엔티티

### 검증 프로젝트
| Project | 역할 | Status |
|---------|------|--------|
| | | |

### 실험
| Experiment | 결과 | Date |
|------------|------|------|
| | | |

---

## 만약 실패한다면?

### 영향
-

### 대응 (피벗/중단)
-

---

**Created**: {YYYY-MM-DD}
**Horizon**: 2026
**Evidence Status**: planning
