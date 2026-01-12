---
entity_type: Program
entity_id: pgm-ops
entity_name: 운영/경영 관리
created: 2026-01-13
updated: 2026-01-13
status: doing

# === Program 정의 ===
program_type: infrastructure
owner: 한명학

# === 원칙/프로세스 ===
principles:
  - "데드라인 준수: 급여, 세무, 계약, 정산 등 법정/약정 기한 엄수"
  - "리스크 제로: 연체, 가산세, 서류 누락 등 운영 리스크 사전 차단"
  - "분기 단위 판정: 분기마다 Round 프로젝트 생성하여 운영 성과 기록"

process_steps:
  - "준비: 분기 초 필수 데드라인 정리, 체크리스트 작성"
  - "실행: 급여, 세무, 계약, 총무, 법무, 지원사업 정산 등 운영 업무 수행"
  - "모니터링: 데드라인 준수율, 리스크 이벤트 추적"
  - "회고: 분기 종료 시 Evidence 기반 회고, 개선점 도출"

templates: []

# === 운영 KPI ===
kpis:
  - name: "On-time Compliance Rate"
    description: "데드라인 내 제출/처리 비율 (목표: >= 95%)"
  - name: "리스크 이벤트"
    description: "연체, 가산세, 서류 누락 등 운영 리스크 건수 (목표: 0건)"
  - name: "외주/세무사 SLA"
    description: "외부 협력사와의 커뮤니케이션 응답 시간 (목표: 48시간 이내)"

# === Cross-Vault ===
exec_rounds_path: null

# === 계층 ===
parent_id: null
aliases:
  - pgm-ops
  - 운영/경영 관리
  - Operations

outgoing_relations: []
validates: []
validated_by: []
tags: ["program", "operations", "management"]
priority_flag: high
---

# 운영/경영 관리

> Program ID: `pgm-ops` | Type: infrastructure | Status: doing

## 프로그램 개요

회사의 필수 운영 업무(급여, 세무, 계약, 총무, 법무, 지원사업 정산 등)를 관리하는 상시 프로그램.

**목표**: 법정/약정 데드라인을 엄수하고 운영 리스크를 제로로 유지

---

## 운영 원칙

1. **데드라인 준수**: 급여, 세무, 계약, 정산 등 법정/약정 기한 엄수
2. **리스크 제로**: 연체, 가산세, 서류 누락 등 운영 리스크 사전 차단
3. **분기 단위 판정**: 분기마다 Round 프로젝트 생성하여 운영 성과 기록

---

## 프로세스

```
준비 → 실행 → 모니터링 → 회고
```

| 단계 | 주요 활동 |
|------|----------|
| 준비 | 분기 초 필수 데드라인 정리, 체크리스트 작성 |
| 실행 | 급여, 세무, 계약, 총무, 법무, 지원사업 정산 등 운영 업무 수행 |
| 모니터링 | 데드라인 준수율, 리스크 이벤트 추적 |
| 회고 | 분기 종료 시 Evidence 기반 회고, 개선점 도출 |

---

## Rounds (분기별 프로젝트)

> **Note**: 분기마다 Round 프로젝트 1개 생성

| Round | Period | Status | Location |
|-------|--------|--------|----------|
| 경영관리 - 2026 Q1 | 2026-01 ~ 2026-03 | doing | prj-021 |

---

## 운영 KPI

- **On-time Compliance Rate**: 데드라인 내 제출/처리 비율 (목표: >= 95%)
- **리스크 이벤트**: 연체, 가산세, 서류 누락 등 운영 리스크 건수 (목표: 0건)
- **외주/세무사 SLA**: 외부 협력사와의 커뮤니케이션 응답 시간 (목표: 48시간 이내)

---

**Created**: 2026-01-13
**Owner**: 한명학
