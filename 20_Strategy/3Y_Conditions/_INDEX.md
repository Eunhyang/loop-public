---
entity_type: Index
entity_id: idx:3y-conditions
entity_name: 3Y Conditions Index
created: 2025-12-19
updated: 2025-12-19
purpose: LLM-optimized index for all 3-year Conditions
tags: ["meta", "index", "strategy", "conditions"]
---

# 3년 조건 인덱스

> 3년 전략의 모든 Conditions를 빠르게 탐색하기 위한 인덱스

---

## Conditions 목록

| ID | Name | Status | Parent MH | Unlock | If Broken |
|----|------|--------|-----------|--------|-----------|
| `cond:a` | Market PMF | 🔲 planned | mh:1 | Product-Market Fit 진입 | 시장 전략 재검토 |
| `cond:b` | Loop Dataset | 🟡 in_progress | mh:3 | 3년 전략 진입 | 데이터 전략 폐기 |
| `cond:c` | Global Data | 🔲 planned | mh:3 | 글로벌 확장 가능 | 글로벌 전략 재검토 |
| `cond:d` | Healthcare | 🔲 planned | mh:2 | 의료 시장 진입 | 의료 전략 재검토 |
| `cond:e` | Revenue | 🔲 planned | mh:4 | 지속가능 수익 | 수익 모델 재검토 |

---

## 현재 활성 Condition

### cond:b - Loop Dataset (In Progress)

**조건**: "데이터 수가 아니라 재현 가능한 패턴이 늘어나는가?"

**메트릭**:
| Metric | Threshold | Current | Status |
|--------|-----------|---------|--------|
| 재현 패턴 수 | 10개 이상 | 3 | 🔴 위험 |
| 패턴 재현율 | 70% 이상 | 측정 중 | 🟡 진행 중 |
| 패턴 발견 속도 | 월 1개 이상 | 1.0 | 🟢 정상 |

**Break Triggers**:
- 6개월간 패턴 3개 정체
- 패턴 재현율 30% 미만
- 새 패턴 발견 0개/월이 3개월 지속

→ [[Condition_B_Loop_Dataset]]

---

## Condition Dependencies

```
┌─────────────────────────────────────────────────────┐
│                   MH1-4 (Meta Hypotheses)           │
│                         │                           │
│    ┌────────┬───────────┼───────────┬────────┐     │
│    ▼        ▼           ▼           ▼        ▼     │
│ cond:a   cond:b      cond:c     cond:d    cond:e   │
│ (PMF)    (Data)      (Global)   (Health)  (Rev)    │
│    │        │           │           │        │     │
│    │        ▼           │           │        │     │
│    │   ──────────       │           │        │     │
│    │  │ trk:2,4 │       │           │        │     │
│    │   ──────────       │           │        │     │
│    └────────────────────┴───────────┴────────┘     │
└─────────────────────────────────────────────────────┘
```

**Track → Condition 매핑**:
| Track | Primary Condition | Secondary |
|-------|-------------------|-----------|
| trk:1 (Product) | cond:a | - |
| trk:2 (Data) | cond:b | - |
| trk:3 (Content) | cond:a | - |
| trk:4 (Coaching) | cond:b | cond:d |
| trk:5 (Partnership) | cond:c | cond:d |
| trk:6 (Revenue) | cond:e | - |

---

## Documents

### 존재하는 Condition 문서
- [[Condition_B_Loop_Dataset]] - `cond:b` ✅

### 생성 필요한 Condition 문서
- Condition_A_Market_PMF - `cond:a` 📝
- Condition_C_Global_Data - `cond:c` 📝
- Condition_D_Healthcare - `cond:d` 📝
- Condition_E_Revenue - `cond:e` 📝

---

## Related Indexes

- [[20_Strategy/12M_Tracks/_INDEX.md]] - Track 인덱스
- [[50_Projects/_INDEX.md]] - Project 인덱스 (conditions_3y별 그룹)
- [[_Graph_Index.md]] - 전체 엔티티 그래프

---

**Auto-updated**: No (manual curation required)
**Last Updated**: 2025-12-19