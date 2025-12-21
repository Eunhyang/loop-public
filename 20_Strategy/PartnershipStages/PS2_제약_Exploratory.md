---
entity_type: PartnershipStage
entity_id: ps-2
entity_name: PS2_제약_Exploratory
created: 2024-12-20
updated: 2024-12-20
status: planning
parent_id: cond-b
aliases:
- ps-2
- PS2_제약_Exploratory
- Stage 2 제약 Exploratory
outgoing_relations:
- type: unlocked_by
  target_id: cond-b
  description: GLP-1 사용자 데이터 1,000명 이상 필요
validates: []
validated_by:
- cond-b
description: 제약사 탐색적 협업 단계
partner_type: 제약사
unlock_condition: GLP-1 사용자 데이터 >= 1,000명
stage_goal: 제약사 니즈 확보 및 협업 구조 설계
timeline: "2027"
deliverables:
- 유지율/RWE 니즈 확보
- Behavioral OS 협업 논의
- GLP-1 병용 DTx 초기 구조 공유
risk_level: medium
tags:
- partnership
- pharma
- exploratory
priority_flag: medium
---

# PS2: 제약사 Exploratory

> Partnership Stage ID: `ps-2` | 상태: Planning | 기간: 2027

## 개요

제약사와의 탐색적 협업 단계. GLP-1 사용자 데이터를 기반으로 니즈 확보.

## Unlock 조건

- **GLP-1 사용자 데이터** >= 1,000명

## 결과물

1. 유지율/RWE 니즈 확보
2. Behavioral OS 협업 논의
3. GLP-1 병용 DTx 초기 구조 공유

## 관계도

```mermaid
graph TD
    CB[Condition B<br/>Loop Dataset] --> PS2[PS2<br/>제약 Exploratory]
```
