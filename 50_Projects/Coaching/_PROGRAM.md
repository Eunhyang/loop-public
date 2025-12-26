---
entity_type: Program
entity_id: pgm-coaching
entity_name: 코칭서비스
created: 2025-12-26
updated: 2025-12-26
status: active

# === Program 정의 ===
program_type: launch
owner: 한명학

# === 원칙/프로세스 ===
principles:
  - "고객 중심: 고객의 변화와 성장에 집중"
  - "일관성 유지: 코칭 품질과 프로세스 표준화"
  - "피드백 수렴: 코칭 후 피드백 반영"

process_steps:
  - "상담: 고객 니즈 파악 및 코칭 목표 설정"
  - "매칭: 적합한 코치 배정"
  - "진행: 1:1 코칭 세션 진행"
  - "피드백: 세션 후 피드백 및 개선"

templates: []

# === 운영 KPI ===
kpis:
  - name: "코칭 세션 수"
    description: "월간 진행된 코칭 세션 수"
  - name: "고객 만족도"
    description: "코칭 후 고객 만족도 점수"
  - name: "재이용률"
    description: "재구매/재이용 고객 비율"

# === Cross-Vault ===
exec_rounds_path: null

# === 계층 ===
parent_id: trk-1
aliases:
  - pgm-coaching
  - 코칭서비스
  - Coaching

outgoing_relations: []
validates: []
validated_by: []
tags: ["program", "coaching", "서비스"]
priority_flag: high
---

# 코칭서비스

> Program ID: `pgm-coaching` | Type: launch | Status: active

## 프로그램 개요

1:1 코칭, 그룹 코칭 등 코칭 서비스 운영을 관리하는 상시 프로그램.

**목표**: 고품질 코칭 서비스 제공 및 고객 성장 지원

---

## 운영 원칙

1. **고객 중심**: 고객의 변화와 성장에 집중
2. **일관성 유지**: 코칭 품질과 프로세스 표준화
3. **피드백 수렴**: 코칭 후 피드백 반영

---

## 프로세스

```
상담 → 매칭 → 진행 → 피드백
```

---

## Rounds (코칭 프로젝트)

| Round | Cycle | Status | Link |
|-------|-------|--------|------|
| 1:1 코칭 | 2025 | active | [[prj-coaching-1on1]] |

---

**Created**: 2025-12-26
**Owner**: 한명학
