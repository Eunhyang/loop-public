---
entity_type: Project
entity_id: prj:001
entity_name: Ontology v0.1
created: 2025-12-18
updated: '2025-12-19'
status: active
parent_id: trk:2
track_id: trk:2
aliases:
- prj:001
- Ontology v0.1
- prj-001
outgoing_relations:
- type: validates
  target_id: mh:3
  description: MH3 데이터 모델링 가능성 검증
- type: enables
  target_id: cond:b
  description: Condition B 재현 패턴 10개 enable
- type: part_of
  target_id: trk:2
  description: Track 2 Data의 핵심 프로젝트
validates:
- mh:3
- hyp:2-01
- hyp:2-02
validated_by: []
hypothesis_id: hyp:001
objective: 5개 코어 엔티티로 Loop 데이터 표현 가능성 검증
success_criteria:
- 스키마 3개월 안정 (변경 없음)
- 코치 라벨링 일관성 70% 이상
- 재현 패턴 5개 이상 발견
owner: Founder + 온톨로지 팀
start_date: 2024-12-01
target_end: 2025-06-30
milestones:
- name: 스키마 정의 완료
  date: 2024-12-15
  status: done
- name: Event/Episode 검증
  date: 2025-01-31
  status: in_progress
- name: 패턴 5개 발견
  date: 2025-03-31
  status: pending
progress: 0.4
risk_level: medium
conditions_3y:
- cond:b
tags:
- project
- ontology
- track-2
- core
priority_flag: critical
expected_impact:
  statement: "이 프로젝트가 성공하면 5개 코어 엔티티로 Loop 데이터 표현이 가능함이 증명된다"
  metric: "스키마 안정성 + 코치 라벨링 일관성 + 재현 패턴 수"
  target: "3개월 안정 + 70% 일관성 + 5개 패턴"
realized_impact:
  outcome: null  # supported | rejected | inconclusive
  evidence: null
  updated: null
---
# Project: Ontology v0.1

> Project ID: `prj:001` | Track: `trk:2` Data | Status: Active (40%)

## 프로젝트 목표

**"5개 코어 엔티티로 Loop 데이터 표현 가능성 검증"**

---

## 전략적 위치

```
MH3 (데이터 모델링 가능)
    ↓ validates
Ontology v0.1 (이 프로젝트)
    ↓ enables
Condition B (재현 패턴 10개)
    ↓ unlocks
3년 전략 진입
```

---

## 성공 기준

| 기준 | 목표 | 현재 | 상태 |
|------|------|------|------|
| 스키마 안정성 | 3개월 변경 없음 | 1개월 | 🟡 진행 중 |
| 코치 라벨링 일관성 | 70% | 측정 전 | ⏸️ |
| 재현 패턴 수 | 5개 | 3개 | 🟡 진행 중 |

---

## Tasks

```dataview
TABLE
  status as "Status",
  assignee as "담당자",
  priority as "우선순위",
  due as "마감일"
FROM "50_Projects/2025/P001_Ontology/Tasks"
WHERE entity_type = "Task"
SORT status ASC, priority DESC
```

---

## Kanban 보기

[[_Kanban_View|📋 Kanban Board 열기]]

---

## 관계도

```mermaid
graph TD
    MH3[MH3<br/>데이터 모델링 가능]
    Track2[Track 2<br/>Data]

    PRJ001[prj:001<br/>Ontology v0.1]

    TSK001[tsk:prj001-001<br/>Event 검증]
    TSK002[tsk:prj001-002<br/>Episode 검증]
    TSK003[tsk:prj001-003<br/>스키마 문서화]

    CondB[Condition B<br/>재현 패턴 10개]

    MH3 -->|validated by| PRJ001
    Track2 -->|contains| PRJ001

    PRJ001 -->|contains| TSK001
    PRJ001 -->|contains| TSK002
    PRJ001 -->|contains| TSK003

    PRJ001 -->|enables| CondB
```

---

## 참고 문서

- [[Track_2_Data]] - 소속 Track
- [[MH3_데이터_모델링_가능]] - 검증 대상
- [[Condition_B_Loop_Dataset]] - Enable 대상
- [[30_Ontology/Schema/v0.1/Ontology-lite v0.1]] - 스키마 정의

---

**Created**: 2024-12-01
**Owner**: Founder + 온톨로지 팀
**Target End**: 2025-06-30
