---
entity_type: Project
entity_id: "prj-{{NUMBER}}"
entity_name: "{{PROJECT_NAME}}"
created: {{DATE}}
updated: {{DATE}}
status: planning

# === 계층 ===
parent_id: "trk-{{TRACK_NUMBER}}"
aliases: ["prj-{{NUMBER}}"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Project 전용 ===
owner: "{{OWNER_NAME}}"
budget: null
deadline: null
hypothesis_text: "{{PROJECT_HYPOTHESIS}}"
experiments: []

# === Expected Impact (A) ===
# null = 아직 미정 | "none" = 계산 불필요 (operational task)
expected_impact:
  tier: {{IMPACT_TIER}}           # strategic | enabling | operational | null | "none"
  impact_magnitude: {{IMPACT_MAG}}  # high | mid | low | null
  confidence: {{CONFIDENCE}}        # 0.0-1.0 | null
  contributes:                      # 기여하는 Condition 목록
    - condition_id: "{{COND_ID}}"
      weight: {{WEIGHT}}

# === Realized Impact (B) ===
# 프로젝트 종료 시 작성 (본문 Rollup 섹션과 동기화)
realized_impact:
  verdict: null                    # pending | go | no-go | pivot
  outcome: null                    # supported | rejected | inconclusive
  evidence_links: []               # ["[[link1]]", "[[link2]]", ...]
  decided: null                    # 결정일 (YYYY-MM-DD)

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-{{CONDITION}}"]  # 최소 1개 필수 (a-e)

# === 분류 ===
tags: []
priority_flag: medium
---

# {{PROJECT_NAME}}

> Project ID: `prj-{{NUMBER}}` | Track: `trk-{{TRACK_NUMBER}}` | Status: planning

---

## 🏁 Project Rollup

> ⚠️ **프로젝트 종료 시 필수 작성** (진행 중에는 비워둠)

### Conclusion
<!-- 3줄 이내 핵심 결론 -->
1.
2.
3.

### Evidence
| # | Type | 근거 요약 | 링크 |
|---|------|----------|------|
| 1 | | | [[]] |
| 2 | | | [[]] |
| 3 | | | [[]] |

> Type: `task` | `meeting` | `experiment` | `decision` | `finance`

### Metric Delta
| Metric | Before | After | Δ | 판정 |
|--------|--------|-------|---|------|
| | | | | |

### Decision
- **Verdict**: `pending` → `go` | `no-go` | `pivot`
- **Next Action**:
- **Decided**:

---

## Project 가설

**"{{PROJECT_HYPOTHESIS}}"**

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
| tsk-{{NUMBER}}-01 | | | planning | |

---

## 관련 가설

- [[hyp-{{HYP_ID}}]] -

---

## 참고 문서

- [[trk-{{TRACK_NUMBER}}]] - 소속 Track

---

**Created**: {{DATE}}
**Owner**: {{OWNER_NAME}}
