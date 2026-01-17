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
validates: []                     # 검증하는 가설들 (0..N)
validated_by: []
primary_hypothesis_id: null       # 프로젝트 생성 근본 질문 (0..1, hyp-*)

# === Project 전용 ===
owner: "{{OWNER_NAME}}"
budget: null
deadline: null
hypothesis_text: "{{PROJECT_HYPOTHESIS}}"
experiments: []

# === Expected Impact (A) ===
# null = 아직 미정 | "none" = 계산 불필요 (operational task)
tier: {{IMPACT_TIER}}              # strategic | enabling | operational | null | "none"
impact_magnitude: {{IMPACT_MAG}}   # high | mid | low | null
confidence: {{CONFIDENCE}}         # 0.0-1.0 | null

# === Condition 기여 (필수) ===
# weight 합계 ≤ 1.0
condition_contributes:
  - to: "{{COND_ID}}"
    weight: {{WEIGHT}}
    description: "{{COND_DESCRIPTION}}"

# === Secondary Track 기여 (선택) ===
# Primary Track = parent_id (암묵적 weight 1.0)
# 다른 Track에도 기여할 경우 여기에 추가
track_contributes: []
# 예시:
#   - to: "trk-3"
#     weight: 0.3
#     description: "Product Track에 코칭 데이터 제공"

# === Expected Impact Statement ===
expected_impact:
  statement: "{{IMPACT_STATEMENT}}"  # "이 프로젝트가 성공하면 X가 증명된다"
  metric: "{{IMPACT_METRIC}}"
  target: "{{IMPACT_TARGET}}"

# === Realized Impact (B) - v5.2 ===
# 프로젝트 종료 시 작성 (본문 Rollup 섹션과 동기화)
# Evidence 문서에서 대표 스냅샷 복사
realized_impact:
  verdict: null                    # pending | go | no-go | pivot
  outcome: null                    # supported | rejected | inconclusive
  evidence_links: []               # ["[[link1]]", "[[link2]]", ...]
  decided: null                    # 결정일 (YYYY-MM-DD)
  window_id: null                  # 평가 윈도우 (YYYY-MM | YYYY-QN | YYYY-HN | YYYY-WNN)
  time_range: null                 # 평가 기간 (YYYY-MM-DD..YYYY-MM-DD)
  metrics_snapshot: {}             # 당시 지표 스냅샷 {metric_name: value}

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-{{CONDITION}}"]  # 최소 1개 필수 (a-e)

# === 분류 ===
tags: []
priority_flag: medium

# === 협업 필드 ===
summary: null                     # 1-2줄 프로젝트 요약 (리스트/hover용)
notes: null
links: []
attachments: []
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

## Notes

### PRD (Product Requirements Document)
<!-- prompt-enhancer 스킬로 자동 생성 또는 수동 작성 -->

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

- [[trk-{{TRACK_NUMBER}}]] - 소속 Track

---

**Created**: {{DATE}}
**Owner**: {{OWNER_NAME}}
