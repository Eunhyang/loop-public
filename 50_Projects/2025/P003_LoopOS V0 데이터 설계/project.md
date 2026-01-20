---
entity_type: Project
entity_id: prj-003
entity_name: LoopOS - V0 데이터 설계
created: 2025-12-18
updated: '2026-01-20'
status: planning
parent_id: trk-2
aliases:
- prj-003
- LoopOS V0 데이터 설계
- prj-003
outgoing_relations: []
validates:
- hyp-2-01
- hyp-2-02
- hyp-2-03
- hyp-2-04
- hyp-2-08
validated_by: []
owner: 김은향
budget: null
deadline: null
hypothesis_text: Notion CSV에서 마이그레이션된 프로젝트
tier: enabling
impact_magnitude: high
confidence: 0.6
condition_contributes:
- to: cond-b
  weight: 0.5
  description: 패턴 저장 스키마 = cond-b 달성의 필수 기반
- to: cond-a
  weight: 0.3
  description: null
track_contributes: []
expected_impact:
  statement: 이 프로젝트가 성공하면 LoopOS V0 데이터 스키마가 실제 사용 가능함이 증명된다
  metric: 스키마 정의 완료율
  target: 10개 엔티티 필수 필드 정의 완료
realized_impact:
  outcome: null
  evidence: null
  updated: null
experiments: []
conditions_3y:
- cond-b
tags: []
priority_flag: medium
primary_hypothesis_id: hyp-2-01
summary: 'ㅇ

  ㅇ'
notes: PATCH test
---
## 이 프로젝트는 뭐하는가? (하위태스크 기준)

이 프로젝트는 LoopOS v0 데이터 설계를 **“운영 가능한 형태로 끝까지 완성**”하는 작업이다.\
단순히 스키마 초안을 만드는 수준이 아니라, **수집→관계→최소 로깅→품질검증→저장→리포트/문서화**까지 한 번에 닫는다.

### 하위태스크가 의미하는 실행 범위

1. **스키마 초안 만들기**: v0에서 표현할 데이터(엔티티/필드) 정의

2. **데이터 플로우 정의**: 데이터가 어디서 생성되고 어떻게 흐르는지(수집→처리→적재) 규정

3. **관계(Relationship) 설계**: 엔티티 간 연결/참조 규칙 설계

4. **Minimal Logging Spec**: 반드시 남겨야 할 최소 로그 규격 확정

5. **데이터 QA 규칙**: 누락/중복/이상치 등 데이터 품질 검증 규칙 정의

6. **저장 전략 결정**: 저장 구조/버전 관리/원본 보존 등 운영 전략 결정

7. **리포트 정의 & V0 문서화**: 리포트 형태를 정의하고 V0 설계를 문서로 고정