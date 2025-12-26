---
entity_type: ProductLine
entity_id: pl-1
entity_name: PL1_LOOP_Core_OS
created: 2024-12-20
updated: 2024-12-20
status: doing
parent_id: cond-a
aliases:
- pl-1
- PL1_LOOP_Core_OS
- LOOP Core OS
outgoing_relations:
- type: unlocked_by
  target_id: cond-a
  description: Condition A (국내 PMF) 충족 시 강화
validates: []
validated_by:
- cond-a
description: 국내 PMF 확립을 위한 핵심 제품
target_market: 국내 B2C
unlock_condition: Condition A (국내 PMF)
components:
- Loop Mapping v1
- Emotion-Eating-Habit Tracking v1
- Loop Intervention v0.5
- 폭식/정서 루프 탐지 기능
- GLP-1 대비 Core Schema
goals:
- 국내 PMF 확립
- 고밀도 루프 데이터 확보
timeline: "2026"
risk_level: medium
tags:
- productline
- core
- 2026
priority_flag: high
---

# PL1: LOOP Core OS

> Product Line ID: `pl-1` | 상태: Active | 기간: 2026

## 개요

국내 PMF 확립을 위한 핵심 Inner Loop OS 제품.

## Unlock 조건

- **Condition A (국내 PMF)** 충족 시 활성화

## 구성 요소

- Loop Mapping v1
- Emotion-Eating-Habit Tracking v1
- Loop Intervention v0.5
- 폭식/정서 루프 탐지 기능
- GLP-1 대비 Core Schema

## 목표

1. 국내 PMF 확립
2. 고밀도 루프 데이터 확보

## 관계도

```mermaid
graph TD
    CA[Condition A<br/>국내 PMF] --> PL1[PL1<br/>LOOP Core OS]
```
