---
entity_type: ProductLine
entity_id: pl-3
entity_name: PL3_Eating_Disorder_DTx
created: 2024-12-20
updated: 2024-12-20
status: planning
parent_id: cond-b
aliases:
- pl-3
- PL3_Eating_Disorder_DTx
- Eating Disorder DTx
outgoing_relations:
- type: unlocked_by
  target_id: cond-b
  description: Condition B 충족 필요
- type: unlocked_by
  target_id: cond-e
  description: Condition E (Team) 충족 필요
- type: enables
  target_id: pl-5
  description: PL5 GLP-1 Behavioral OS의 전제
validates: []
validated_by:
- cond-b
- cond-e
description: 섭식장애 디지털 치료제 (한국 중심)
target_market: 섭식장애 환자, 비만 클리닉
unlock_condition: Condition B + Condition E + 국내 병원 2곳 제휴
components:
- DTx 프로토콜 v1
- Early Warning Index v1
- IRB/임상 설계
- 비급여/식약처 루트
goals:
- 매출이 아니라 Medical Grade 권위 획득
timeline: "2027-2028"
risk_level: high
tags:
- productline
- dtx
- medical
priority_flag: high
---

# PL3: Eating Disorder DTx

> Product Line ID: `pl-3` | 상태: Planning | 기간: 2027-2028

## 개요

섭식장애 디지털 치료제. 한국 중심으로 의료 등급(Medical Grade) 권위 획득이 목표.

## Unlock 조건

- **Condition B (Loop Dataset)** + **Condition E (Team Readiness)**
- 국내 병원 2곳 제휴

## 구성 요소

- DTx 프로토콜 v1
- Early Warning Index v1
- IRB/임상 설계
- 비급여/식약처 루트

## 목표

- 매출이 아니라 **Medical Grade 권위** 획득

## 관계도

```mermaid
graph TD
    CB[Condition B] --> PL3[PL3<br/>Eating Disorder DTx]
    CE[Condition E] --> PL3
    PL3 --> PL5[PL5<br/>GLP-1 Behavioral OS]
```
