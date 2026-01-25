---
entity_type: Project
entity_id: prj-001
entity_name: Ontology v0.1
created: 2025-12-18
updated: '2026-01-25'
status: planning
parent_id: trk-2
track_id: trk-2
aliases:
- prj-001
- Ontology v0.1
- prj-001
outgoing_relations:
- type: validates
  target_id: mh-3
  description: MH3 데이터 모델링 가능성 검증
- type: enables
  target_id: cond-b
  description: Condition B 재현 패턴 10개 enable
- type: part_of
  target_id: trk-2
  description: Track 2 Data의 핵심 프로젝트
validates:
- hyp-2-01
- hyp-2-02
validated_by: []
hypothesis_id: hyp-001
objective: 5개 코어 엔티티로 Loop 데이터 표현 가능성 검증
success_criteria:
- 스키마 3개월 안정 (변경 없음)
- 코치 라벨링 일관성 70% 이상
- 재현 패턴 5개 이상 발견
owner: 김은향
start_date: '2024-12-01'
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
- cond-b
tags:
- project
- ontology
- track-2
- core
priority_flag: critical
tier: strategic
impact_magnitude: high
confidence: 0.65
condition_contributes:
- to: cond-b
  weight: 0.7
  description: Ontology가 Condition B(재현 패턴 10개)의 핵심 기반
track_contributes: []
expected_impact:
  tier: operational
  impact_magnitude: mid
  confidence: 0.7
  contributes: []
  rationale: null
realized_impact:
  outcome: null
  evidence: null
  updated: null
deadline: '2026-01-31'
program_id: pgm-coaching
primary_hypothesis_id: hyp-2-01
summary: null
links: []
attachments: []
---
<p></p>