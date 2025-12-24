---
entity_type: Program
entity_id: pgm-grants
entity_name: 정부지원사업
created: 2025-12-23
updated: 2025-12-23
status: active

# === Program 정의 ===
program_type: grants
owner: 한명학

# === 원칙/프로세스 ===
principles:
  - "전략적 적합성 우선: 회사 방향과 맞지 않는 과제는 지원하지 않음"
  - "선택과 집중: 동시 진행 과제 수 3개 이하 유지"
  - "사전 준비 철저: 마감 2주 전 초안 완성"

process_steps:
  - "탐색: 적합한 지원사업 발굴 및 적합성 평가"
  - "준비: 사업계획서 작성, 서류 준비"
  - "제출: 신청서 제출 및 보완"
  - "발표: PT 자료 준비 및 발표"
  - "선정후: 협약, 정산, 보고서 작성"

templates: []

# === 운영 KPI ===
kpis:
  - name: "지원 건수"
    description: "분기당 지원한 과제 수"
  - name: "선정률"
    description: "지원 대비 선정 비율"
  - name: "확보 금액"
    description: "연간 확보한 지원금 총액"

# === Cross-Vault ===
exec_rounds_path: null

# === 계층 ===
parent_id: null
aliases:
  - pgm-grants
  - 정부지원사업
  - Grants

outgoing_relations: []
validates: []
validated_by: []
tags: ["program", "grants", "funding"]
priority_flag: high
---

# 정부지원사업

> Program ID: `pgm-grants` | Type: grants | Status: active

## 프로그램 개요

정부 및 공공기관 지원사업(TIPS, 창업진흥원, R&D 과제 등)의 탐색, 지원, 운영을 관리하는 상시 프로그램.

**목표**: 회사 전략과 부합하는 지원사업 선별 및 효율적 수행

---

## 운영 원칙

1. **전략적 적합성 우선**: 회사 방향과 맞지 않는 과제는 지원하지 않음
2. **선택과 집중**: 동시 진행 과제 수 3개 이하 유지
3. **사전 준비 철저**: 마감 2주 전 초안 완성

---

## 프로세스

```
탐색 → 준비 → 제출 → 발표 → 선정후 관리
```

| 단계 | 주요 활동 |
|------|----------|
| 탐색 | 적합한 지원사업 발굴, 적합성 평가 |
| 준비 | 사업계획서 작성, 서류 준비 |
| 제출 | 신청서 제출, 보완 요청 대응 |
| 발표 | PT 자료 준비, 발표 진행 |
| 선정후 | 협약, 정산, 결과보고서 작성 |

---

## Rounds (지원사업별 프로젝트)

| Round | Cycle | Status | Link |
|-------|-------|--------|------|
| JEMI디딤돌 | 2025 | planning | [[prj-grants-jemi]] |

---

**Created**: 2025-12-23
**Owner**: 한명학
