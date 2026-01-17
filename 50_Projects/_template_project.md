---
entity_type: Project
entity_id: "prj-{NUMBER}"
entity_name: "{프로젝트명}"
created: {YYYY-MM-DD}
updated: {YYYY-MM-DD}
status: planning

# === 계층 ===
parent_id: "trk-{TRACK_NUMBER}"
aliases: ["prj-{NUMBER}"]

# === 관계 ===
outgoing_relations: []
validates: []                     # 검증하는 가설들 (0..N)
validated_by: []
primary_hypothesis_id: null       # 프로젝트 생성 근본 질문 (0..1, hyp-*)

# === Project 전용 ===
owner: "{담당자}"
budget: null
deadline: null
hypothesis_text: "{프로젝트 가설}"
experiments: []

# === Expected Impact (A) ===
# null = 아직 미정 | "none" = 계산 불필요 (operational task)
tier: null                        # strategic | enabling | operational | null | "none"
impact_magnitude: null            # high | mid | low | null
confidence: null                  # 0.0-1.0 | null

# === Condition 기여 (필수) ===
# weight 합계 <= 1.0
condition_contributes:
  - to: "cond-{CONDITION}"
    weight: 0.5
    description: "{기여 설명}"

# === Secondary Track 기여 (선택) ===
track_contributes: []

# === Expected Impact Statement ===
expected_impact:
  statement: "{이 프로젝트가 성공하면 X가 증명된다}"
  metric: "{측정 지표}"
  target: "{목표값}"

# === Realized Impact (B) ===
# 프로젝트 종료 시 작성
realized_impact:
  verdict: null                    # pending | go | no-go | pivot
  outcome: null                    # supported | rejected | inconclusive
  evidence_links: []
  decided: null
  window_id: null
  time_range: null
  metrics_snapshot: {}

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-{CONDITION}"]  # 최소 1개 필수 (a-e)

# === 분류 ===
tags: []
priority_flag: medium

# === 협업 필드 ===
summary: null
notes: null
links: []
attachments: []
---

# {프로젝트명}

> Project ID: `prj-{NUMBER}` | Track: `trk-{TRACK_NUMBER}` | Status: planning

---

## Project Rollup

> 프로젝트 종료 시 필수 작성 (진행 중에는 비워둠)

### Conclusion
1.
2.
3.

### Evidence
| # | Type | 근거 요약 | 링크 |
|---|------|----------|------|
| 1 | | | [[]] |
| 2 | | | [[]] |

> Type: `task` | `meeting` | `experiment` | `decision` | `finance`

### Metric Delta
| Metric | Before | After | Delta | 판정 |
|--------|--------|-------|-------|------|
| | | | | |

### Decision
- **Verdict**: `pending`
- **Next Action**:
- **Decided**:

---

## Project 가설

**"{프로젝트 가설}"**

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
| tsk-{NUMBER}-01 | | | planning | |

---

## 관련 가설

- [[hyp-{HYP_ID}]] -

---

## Notes

### PRD (Product Requirements Document)

**문제 정의**:


**목표**:


**핵심 요구사항**:
1.
2.
3.

**기술 스펙**:


**제약 조건**:


**성공 지표**:


---

## 참고 문서

- [[trk-{TRACK_NUMBER}]] - 소속 Track

---

**Created**: {YYYY-MM-DD}
**Owner**: {담당자}
