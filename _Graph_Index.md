---
entity_type: GraphIndex
entity_id: meta:graph
entity_name: LOOP Vault Graph Index
created: 2025-12-18
updated: 2025-12-18
total_entities: 10
auto_generated: true
tags: ["meta", "graph", "index"]
---

# LOOP Vault Graph Index

> 자동 생성됨 - 수동 편집 금지

---

## 요약 통계

- **총 엔티티**: 10개
- **마지막 업데이트**: 2025-12-18

### 타입별
| Type | Count |
|------|-------|
| NorthStar | 1 |
| MetaHypothesis | 1 |
| Condition | 1 |
| Track | 6 |

### 상태별
| Status | Count |
|--------|-------|
| active | 5 |
| fixed | 1 |
| in_progress | 1 |
| planning | 1 |
| unknown | 1 |
| validating | 1 |

---

## NorthStar (1개)

| ID | Name | Status | Path |
|----|------|--------|------|
| `ns:001` | 10년 비전 | fixed | `01_North_Star/10년 비전.md` |


## MetaHypothesis (1개)

| ID | Name | Status | Path |
|----|------|--------|------|
| `mh:3` | MH3_데이터_모델링_가능 | validating | `01_North_Star/MH3_데이터_모델링_가능.md` |


## Condition (1개)

| ID | Name | Status | Path |
|----|------|--------|------|
| `cond:b` | Condition_B_Loop_Dataset | in_progress | `20_Strategy/3Y_Conditions/Condition_B_Loop_Dataset.md` |


## Track (6개)

| ID | Name | Status | Path |
|----|------|--------|------|
| `trk:1` | Track_1_Product | active | `20_Strategy/12M_Tracks/Track_1_Product.md` |
| `trk:2` | Track_2_Data | active | `20_Strategy/12M_Tracks/Track_2_Data.md` |
| `trk:3` | Track_3_Content | active | `20_Strategy/12M_Tracks/Track_3_Content.md` |
| `trk:4` | Track_4_Coaching | active | `20_Strategy/12M_Tracks/Track_4_Coaching.md` |
| `trk:5` | Track_5_Partnership | planning | `20_Strategy/12M_Tracks/Track_5_Partnership.md` |
| `trk:6` | Track_6_Revenue | active | `20_Strategy/12M_Tracks/Track_6_Revenue.md` |


---

## 관계 요약

### Parent-Child 관계

- **cond:b** (Condition_B_Loop_Dataset)
  - trk:2 (Track_2_Data)
  - trk:4 (Track_4_Coaching)
- **mh:3** (MH3_데이터_모델링_가능)
  - cond:b (Condition_B_Loop_Dataset)
- **ns:001** (10년 비전)
  - mh:3 (MH3_데이터_모델링_가능)

---

## Critical Paths

### Critical 엔티티

- **mh:3**: MH3_데이터_모델링_가능 (status: validating)
- **ns:001**: 10년 비전 (status: fixed)
- **cond:b**: Condition_B_Loop_Dataset (status: in_progress)
- **trk:6**: Track_6_Revenue (status: active)
- **trk:2**: Track_2_Data (status: active)

---

**Auto-generated**: 2025-12-18
**Script**: scripts/build_graph_index.py