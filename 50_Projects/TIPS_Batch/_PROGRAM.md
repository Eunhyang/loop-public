---
entity_type: Program
entity_id: pgm-tips
entity_name: 투자/TIPS 준비
created: 2025-12-26
updated: 2025-12-26
status: doing

# === Program 정의 ===
program_type: fundraising
owner: 김은향

# === 원칙/프로세스 ===
principles:
  - "전략적 적합성 우선: LOOP 방향과 맞는 배치/투자처만 지원"
  - "자원 효율: 동시 지원 3개 이하로 집중"
  - "사전 준비: 마감 2주 전 초안 완성"

process_steps:
  - "탐색: 배치 프로그램/투자처 발굴 및 적합성 평가"
  - "준비: 지원서/사업계획서 작성"
  - "제출: 신청서 제출 및 보완"
  - "발표: PT 자료 준비 및 발표"
  - "선정후: 후속 투자 연계, TIPS 추천 활용"

templates: []

# === 운영 KPI ===
kpis:
  - name: "지원 건수"
    description: "분기당 지원한 배치/투자 프로그램 수"
  - name: "선정률"
    description: "지원 대비 선정 비율"
  - name: "투자 연계"
    description: "배치 → TIPS/후속투자 연계 건수"

# === Cross-Vault ===
exec_rounds_path: null

# === 계층 ===
parent_id: null
aliases:
  - pgm-tips
  - 투자/TIPS 준비
  - TIPS Batch
  - 배치 프로그램

outgoing_relations: []
validates:
  - hyp-6-13
  - hyp-6-14
validated_by: []
conditions_3y: ['cond-d', 'cond-e']
tags: ["program", "fundraising", "tips", "batch"]
priority_flag: high
---

# 투자/TIPS 준비

> Program ID: `pgm-tips` | Type: fundraising | Status: doing

## 프로그램 개요

TIPS 추천 및 후속 투자 확보를 목표로, 배치 프로그램 지원 및 투자 유치 활동을 관리하는 상시 프로그램.

**목표**: 2026년 TIPS 선정 및 시리즈 투자 레버리지 확보

---

## 운영 원칙

1. **전략적 적합성 우선**: LOOP 방향과 맞는 배치/투자처만 지원
2. **자원 효율**: 동시 지원 3개 이하로 집중
3. **사전 준비**: 마감 2주 전 초안 완성

---

## 프로세스

```
탐색 → 준비 → 제출 → 발표 → 선정후 관리
```

| 단계 | 주요 활동 |
|------|----------|
| 탐색 | 배치 프로그램/투자처 발굴, 적합성 평가 |
| 준비 | 지원서/사업계획서 작성 |
| 제출 | 신청서 제출, 보완 요청 대응 |
| 발표 | PT 자료 준비, 발표 진행 |
| 선정후 | 후속 투자 연계, TIPS 추천 활용 |

---

## Rounds (지원 프로젝트)

| Round | Status | Link |
|-------|--------|------|
| 아이디어파트너스 배치 | todo | [[prj-017]] |
| 프라이머 배치 | todo | [[prj-018]] |

---

**Created**: 2025-12-26
**Owner**: 김은향
