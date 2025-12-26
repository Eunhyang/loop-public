---
entity_type: PartnershipStage
entity_id: ps-3
entity_name: PS3_해외_클리닉
created: 2024-12-20
updated: 2024-12-20
status: todo
parent_id: cond-c
aliases:
- ps-3
- PS3_해외_클리닉
- Stage 3 해외 클리닉
outgoing_relations:
- type: unlocked_by
  target_id: cond-c
  description: Condition C Phase 1 (해외 500~2,000명) 충족 시 활성화
validates: []
validated_by:
- cond-c
description: 해외 클리닉 파일럿 단계
partner_type: 해외 클리닉
unlock_condition: Condition C Phase 1 (해외 500~2,000명)
stage_goal: 글로벌 Loop 모델 검증
timeline: "2027-2028"
deliverables:
- Non-regulated Behavioral Pilot
- Loop Index 국제 버전 검증
- Cross-Cultural Loop Model 확보
risk_level: high
tags:
- partnership
- international
- clinic
priority_flag: medium
---

# PS3: 해외 클리닉 파일럿

> Partnership Stage ID: `ps-3` | 상태: Planning | 기간: 2027-2028

## 개요

해외 클리닉과의 파일럿 협업. Cross-Cultural Loop Model 검증이 핵심.

## Unlock 조건

- **Condition C Phase 1**: 해외 사용자 500~2,000명

## 결과물

1. Non-regulated Behavioral Pilot
2. Loop Index 국제 버전 검증
3. Cross-Cultural Loop Model 확보

## 관계도

```mermaid
graph TD
    CC[Condition C<br/>Global Data] --> PS3[PS3<br/>해외 클리닉]
```
