---
entity_type: ProductLine
entity_id: pl-5
entity_name: PL5_GLP1_Behavioral_OS
created: 2024-12-20
updated: 2024-12-20
status: planning
parent_id: pl-3
aliases:
- pl-5
- PL5_GLP1_Behavioral_OS
- GLP-1 Behavioral OS
outgoing_relations:
- type: unlocked_by
  target_id: pl-3
  description: PL3 Eating Disorder DTx 완료 필요
- type: unlocked_by
  target_id: pl-4
  description: PL4 International Loop Tracker 완료 필요
- type: enables
  target_id: ps-4
  description: PS4 글로벌 제약/보험 API 활성화
validates: []
validated_by:
- pl-3
- pl-4
description: GLP-1 병용 DTx 및 글로벌 Behavioral OS
target_market: 글로벌 GLP-1 시장
unlock_condition: Product Line 3 완료 + Global Schema v1
components:
- Off-phase Crash Predictor v2
- GLP-1 Behavioral DTx v1
- 제약/보험사 유지율 API
- 글로벌 파트너십 확장
goals:
- GLP-1 + LOOP = 정석 조합 시장 공식화
timeline: "2028+"
risk_level: high
tags:
- productline
- glp1
- global
- dtx
priority_flag: critical
---

# PL5: GLP-1 Behavioral OS

> Product Line ID: `pl-5` | 상태: Planning | 기간: 2028+

## 개요

GLP-1 병용 DTx 및 글로벌 Behavioral OS. 최종 목표는 **"GLP-1 + LOOP = 정석 조합"** 시장 공식화.

## Unlock 조건

- **Product Line 3 완료** (Eating Disorder DTx)
- **Product Line 4 완료** (International Loop Tracker)
- **Global Schema v1**

## 구성 요소

- Off-phase Crash Predictor v2
- GLP-1 Behavioral DTx v1
- 제약/보험사 유지율 API
- 글로벌 파트너십 확장

## 목표

- **"GLP-1 + LOOP = 정석 조합"** 시장 공식화

## 관계도

```mermaid
graph TD
    PL3[PL3<br/>Eating Disorder DTx] --> PL5[PL5<br/>GLP-1 Behavioral OS]
    PL4[PL4<br/>International Loop Tracker] --> PL5
    PL5 --> PS4[PS4<br/>글로벌 제약/보험 API]
```
