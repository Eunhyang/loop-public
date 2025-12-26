---
entity_type: PartnershipStage
entity_id: ps-1
entity_name: PS1_국내_의료기관
created: 2024-12-20
updated: 2024-12-20
status: todo
parent_id: cond-b
aliases:
- ps-1
- PS1_국내_의료기관
- Stage 1 국내 의료기관
outgoing_relations:
- type: unlocked_by
  target_id: cond-b
  description: Condition B (Loop Dataset 3,000+) 충족 시 활성화
validates: []
validated_by:
- cond-b
description: 국내 비만/정신건강센터 제휴 단계
partner_type: 국내 의료기관
unlock_condition: Loop Dataset 3,000+ 고밀도
stage_goal: 의료 제휴 기반 구축
timeline: "2026-2027"
deliverables:
- 비만/정신건강센터 제휴
- Early Warning Index validation
- IRB 준비
- DTx 프로토콜 공동 개발
risk_level: medium
tags:
- partnership
- medical
- domestic
priority_flag: high
---

# PS1: 국내 의료기관 제휴

> Partnership Stage ID: `ps-1` | 상태: Planning | 기간: 2026-2027

## 개요

국내 비만/정신건강센터와의 제휴를 통한 의료 기반 구축.

## Unlock 조건

- **Condition B (Loop Dataset)**: 고밀도 3,000명 이상

## 결과물

1. 비만/정신건강센터 제휴
2. Early Warning Index validation
3. IRB 준비
4. DTx 프로토콜 공동 개발

## 관계도

```mermaid
graph TD
    CB[Condition B<br/>Loop Dataset] --> PS1[PS1<br/>국내 의료기관]
```
