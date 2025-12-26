---
entity_type: Project
entity_id: "prj-014"
entity_name: "코칭 서비스 운영 체계 재구축"
created: 2025-12-18
updated: 2025-12-23
status: doing

# === 계층 ===
parent_id: "trk-4"
aliases:
  - "prj-014"
  - "코칭 서비스 운영 체계 재구축"

# === 관계 ===
outgoing_relations: []
validates:
  - hyp-4-03
  - hyp-4-04
  - hyp-4-05
validated_by: []

# === Project 전용 ===
owner: "한명학"
budget: null
deadline: null
hypothesis_text: "코칭 운영 프로토콜과 철칙을 수립하면 서비스 품질과 확장성이 확보된다"

# === Impact 점수 필드 (A) ===
tier: enabling
impact_magnitude: mid
confidence: 0.70
contributes:
  - to: "cond-b"
    weight: 0.15
    description: "코칭 품질 향상 → 데이터 품질 향상 (간접)"
  - to: "cond-e"
    weight: 0.20
    description: "팀 역량/프로세스 표준화"

expected_impact:
  statement: "운영 체계가 수립되면 코칭 서비스 품질 일관성과 확장 가능성이 확보된다"
  metric: "프로토콜 문서화 + 코치 온보딩 적용"
  target: "핵심 프로토콜 3개 이상 문서화 + 신규 코치 1명 이상 적용"
realized_impact:
  outcome: null  # supported | rejected | inconclusive
  evidence: null
  updated: null
experiments: []

# === 분류 ===
conditions_3y: ['cond-b', 'cond-e']
tags: []
priority_flag: medium
---

# 코칭 서비스 운영 체계 재구축

> Project ID: `prj-014` | Track: `trk-4` | Status: active

## 프로젝트 개요

이 프로젝트는 Notion Tasks 데이터베이스에서 마이그레이션되었습니다.

---

## Tasks

아래 Tasks/ 폴더에 프로젝트의 모든 태스크가 포함되어 있습니다.

---

## 참고 문서

- [[Track_2_Data]] - 소속 Track

---

**Created**: 2025-12-18
**Owner**: 한명학
