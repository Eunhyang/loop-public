---
entity_type: Project
entity_id: prj-1kthoh
entity_name: Ontology - Vault Ontology Lite v1
created: '2026-01-18'
updated: '2026-01-19'
status: planning
owner: 김은향
priority_flag: medium
parent_id: trk-2
program_id: pgm-vault-system
aliases:
- prj-1kthoh
tags: []
conditions_3y:
- cond-b
- cond-d
condition_contributes:
- to: cond-b
  weight: 0.7
  description: 프로젝트가 데이터 패턴을 재현하는 데 중점을 두고 있어, 재현 가능한 패턴의 수와 패턴 재현율이 중요한 지표입니다.
- to: cond-d
  weight: 0.3
  description: 프로젝트의 성공적인 실행은 매출 또는 런웨이의 지속 가능성에 영향을 미치므로, 이 조건도 중요한 기여를 합니다.
track_contributes:
- to: trk-1
  weight: 0.7
  description: Track_1_Product는 Loop Core OS 제품의 PMF 달성을 목표로 하며, 데이터 패턴화와 관련된 프로젝트의
    성공에 기여할 수 있습니다.
- to: trk-4
  weight: 0.2
  description: Track_4_Coaching은 고품질 데이터 생성을 목표로 하며, 프로젝트의 데이터 패턴화와 관련이 있습니다.
validates:
- hyp-2-12
primary_hypothesis_id: hyp-2-12
summary: '[Track 2(Data)] Track 2(Data)에서 Ontology Lite v1의 edge_types 정의로 데이터 패턴화를
  검증하는 프로젝트.'
expected_impact:
  tier: operational
  impact_magnitude: low
  confidence: 0.7
  contributes: []
  rationale: Ontology - Vault Ontology Lite v1 프로젝트는 데이터 패턴화 가능성을 높이는 데 기여하며, 전략 실행을
    지원하는 기반 프로젝트로 평가됩니다.
---
# Ontology - Vault Ontology Lite v1

> Project: `Ontology - Vault Ontology Lite v1` | Track: `Track_2_Data` | Status: planning

## 한 줄 정의

Strategic Context를 **Ontology Lite v1 그래프(nodes/edges)** 로 정규화하고, edge_types 의미를 고정해서 **Agent가 subgraph context를 일관되게 생성·이해·활용**하게 만든다.

## 문제

- Strategic Context는 반쯤 구조화돼 있지만, 관계 의미가 런타임에 흔들려 **agent가 매번 다르게 해석**할 수 있음

- 관계를 “추론”에 맡기면 실행/근거/결정 연결이 불안정해지고, 재현 가능한 전략 운영이 깨짐

## 목표 (v1)

1. **결정론적 정규화**: 동일 입력 → 동일 nodes/edges

2. **관계 의미 고정**: edge_types 사전으로 관계를 정의(추론 금지)

3. **Agent 입력 표준화**: 질문/대상 엔티티 → 최소 subgraph + evidence 자동 생성

4. **진단 가능성**: 누락/충돌/애매함을 diagnostics로 노출

## Scope

### In-Scope

- Ontology Lite v1: 엔티티/필수필드/ID 규칙

- edge_types 사전: 의미/제약/from-to/예시

- Strategic Context → Graph 매핑 함수(PRD + 구현)

- Subgraph Context Builder(Agent Context Builder)

- 회귀 테스트(스냅샷) + 샘플 케이스 검증

### Out-of-Scope (v1 제외)

- full-graph 실시간 검색/인덱싱 고도화(v2)

- 온톨로지 자동 진화(v2)

- 학습형 라우팅/강화학습(v2)

## 핵심 산출물

- 30_Ontology/Schema/ontology_lite_v1.yaml

- 30_Ontology/Schema/edge_types.yaml

- 30_Ontology/Code/normalize_strategic_context.(lang)

- 30_Ontology/Code/build_subgraph_context.(lang)

- 30_Ontology/Tests/regression_cases.json + expected_snapshots/

## 성공 기준

- (필수) normalize 결정론성: regression snapshot 100% 통과

- (필수) edge 타입 오류/누락률 &lt; 5% (샘플 20케이스)

- (필수) “컨텍스트 생성 리드타임” 베이스라인 대비 50% 단축

- (보조) 자동 설명 품질(내부 루브릭) 4/5 이상

## Strategic Context (v1 edge_types 초안)

```yaml
edge_types:
  validates:
    from: [Track, Project, Hypothesis]
    to: [Condition, MetaHypothesis]

  enables:
    from: [Track, Project]
    to: [Condition, Track]

  depends_on:
    from: [Track, Project]
    to: [Track, Condition]

  unlocks:
    from: [Condition]
    to: [StrategyPhase, Track]

  breaks:
    from: [Condition]
    to: [Strategy, Track]

  terminates:
    from: [Track]
    to: [Company]
```

## Tasks

- Ontology Lite v1 - 엔티티 및 ID 규칙 정의

- Ontology Lite v1 - edge_types 사전 정의 및 예시 작성

- Ontology Lite v1 - Strategic Context 매핑 함수 PRD 작성

- Ontology Lite v1 - Subgraph Context Builder 구현

- Ontology Lite v1 - 회귀 테스트 및 샘플 케이스 검증