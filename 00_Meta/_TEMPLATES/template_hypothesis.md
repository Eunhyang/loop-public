---
entity_type: Hypothesis
entity_id: "hyp-{{TRK}}-{{SEQ}}"
entity_name: "{{HYPOTHESIS_NAME}}"
created: {{DATE}}
updated: {{DATE}}
status: planning

# === 계층 관계 ===
parent_id: "trk-{{TRK}}"
aliases:
  - "hyp-{{TRK}}-{{SEQ}}"
  - "{{HYPOTHESIS_NAME_SNAKE}}"

# === 가설 정의 (필수 4요소) ===
hypothesis_question: "{{QUESTION}}?"
success_criteria: "{{SUCCESS_CRITERIA}}"
failure_criteria: "{{FAILURE_CRITERIA}}"
measurement: "{{MEASUREMENT}}"

# === 시간 범위 ===
horizon: "{{YEAR}}"
deadline: {{DEADLINE}}

# === 상태 ===
evidence_status: planning
confidence: 0.5

# === 분류 ===
loop_layer: []
tags: ["{{YEAR}}", "trk-{{TRK}}"]

# === 검증 연결 ===
validates: []
validated_by: []

# === 협업 필드 ===
notes: null
links: []
attachments: []
---

# {{HYPOTHESIS_NAME}}

> Track: [[Track_{{TRK}}_{{TRACK_NAME}}]] | ID: `hyp-{{TRK}}-{{SEQ}}` | 상태: planning

## 가설

**Q: {{QUESTION}}?**

---

## 판정 기준

### 성공 (Success)
{{SUCCESS_CRITERIA}}

### 실패 (Failure)
{{FAILURE_CRITERIA}}

---

## 측정 방법

**데이터 소스**: {{MEASUREMENT}}

**측정 지표**:
-

---

## 검증 로그

| 날짜 | 상태 | 메모 |
|------|------|------|
| {{DATE}} | planning | 가설 정의 완료 |

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

**Created**: {{DATE}}
**Horizon**: {{YEAR}}
**Evidence Status**: planning
