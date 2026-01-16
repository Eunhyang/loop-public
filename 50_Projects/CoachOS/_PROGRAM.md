---
entity_type: Program
entity_id: pgm-coachos
entity_name: CoachOS
created: "2026-01-16"
updated: "2026-01-16"
status: doing
program_type: infrastructure
owner: 한명학
principles:
  - "SSOT + Derived: 결정/맥락은 SSOT에, 집계/스코어는 Derived로"
  - "계산은 코드가, 판단은 사람이: LLM은 제안, 승인/책임은 인간"
  - "Evidence 품질 메타 + 승인 로그(append-only)를 최우선으로"
  - "코치의 판단/개입/학습 루프를 엔티티로 고정(재현성 확보)"
process_steps:
  - "Model: Coach workflow(판단→개입→기록→학습) 온톨로지/필드 정의"
  - "Build: 코치 라벨링/어드민/가드레일(스키마 검증) 구축"
  - "Operate: 코치 운영에 자연스럽게 데이터/증거가 생성되게 설계"
  - "Learn: A/B(Expected/Realized) 기반 회고→룰/플레이북 업데이트"
templates: []
kpis:
  - name: "Decision Cycle Time"
    description: "초안 생성 → 승인까지 리드타임"
  - name: "Evidence Production Time"
    description: "회고/관측 → Evidence 구조화까지 평균 소요"
  - name: "Labeling Consistency"
    description: "코치 간 라벨 합치도(일관성) 추적"
  - name: "Adoption"
    description: "코치 세션/운영 중 CoachOS 플로우 사용률"
exec_rounds_path: null
parent_id: trk-2
aliases:
  - pgm-coachos
  - CoachOS
  - coachos
outgoing_relations:
  - type: supports
    target_id: trk-2
    description: "고품질 라벨링/증거 생산으로 Data Track 가속"
  - type: supports
    target_id: trk-4
    description: "코치 운영 표준화/학습 축적으로 Coaching Track 효율화"
validates: []
validated_by: []
tags:
  - program
  - coachos
  - infrastructure
  - labeling
  - evidence
priority_flag: high
---

# CoachOS

> Program ID: `pgm-coachos` | Type: infrastructure | Status: doing

## 프로그램 개요
코치의 **판단–개입–기록–학습** 루프를 SSOT + Derived 구조로 고정하고,
증거 품질/승인 로그 기반으로 “재현 가능한 코칭 운영”을 만드는 상시 프로그램.

## 운영 원칙 (SSOT 준수)
- 결정/기준/정의는 frontmatter(SSOT)에 남기고, 집계/스코어/롤업은 Derived로만 생성
- Evidence 품질 메타(출처/표본/측정품질/반사실 등) 없이는 “점수”를 신뢰하지 않음
- AI 제안은 Pending, 인간 승인만이 트랜잭션

## Rounds (프로젝트)
> CoachOS는 “끝나는 프로젝트”가 아니라 “프로젝트들을 계속 생산하는 운영체계”로 관리.
- (예정) CoachOS Phase 1: 라벨링/어드민/QA
- (예정) CoachOS Decision Log v1: 승인/의사결정 로그 표준
- (예정) CoachOS Evidence Pack v1: 증거 자동 생성/품질 메타 표준

---
**Created**: 2026-01-16  
**Owner**: 한명학
