---
entity_type: Program
entity_id: pgm-hiring
entity_name: 채용
created: 2025-12-25
updated: 2025-12-25
status: doing

# === Program 정의 ===
program_type: hiring
owner: 한명학

# === 원칙/프로세스 ===
principles:
  - "문화 적합성 우선: 스킬보다 협업 능력과 성장 의지"
  - "실전 과제 기반: 이력서보다 실제 작업물로 평가"
  - "충분한 온보딩: 첫 3개월은 투자 기간"

process_steps:
  - "탐색: 채용 니즈 정의, 채널 선정"
  - "커피챗: 가벼운 대화로 상호 적합성 확인"
  - "과제: 실전 과제 수행 및 평가"
  - "면접: 기술 리뷰 및 문화 적합성 확인"
  - "온보딩: Day1 온보딩, 파일럿 프로젝트"

templates: []

# === 운영 KPI ===
kpis:
  - name: "채용 성공률"
    description: "면접 대비 최종 합류 비율"
  - name: "온보딩 이탈률"
    description: "3개월 내 이탈 비율"
  - name: "파일럿 전환율"
    description: "파일럿 → 정규 전환 비율"

# === Cross-Vault ===
exec_rounds_path: null

# === 계층 ===
parent_id: null
aliases:
  - pgm-hiring
  - 채용
  - Hiring

outgoing_relations: []
validates: []
validated_by: []
tags: ["program", "hiring", "team"]
priority_flag: high
---

# 채용

> Program ID: `pgm-hiring` | Type: hiring | Status: active

## 프로그램 개요

코치, 개발자, 운영 등 팀원 채용을 관리하는 상시 프로그램.

**목표**: 문화 적합성과 성장 의지를 갖춘 팀원 채용

---

## 운영 원칙

1. **문화 적합성 우선**: 스킬보다 협업 능력과 성장 의지
2. **실전 과제 기반**: 이력서보다 실제 작업물로 평가
3. **충분한 온보딩**: 첫 3개월은 투자 기간

---

## 프로세스

```
탐색 → 커피챗 → 과제 → 면접 → 온보딩
```

| 단계 | 주요 활동 |
|------|----------|
| 탐색 | 채용 니즈 정의, 채널 선정 |
| 커피챗 | 가벼운 대화로 상호 적합성 확인 |
| 과제 | 실전 과제 수행 및 평가 |
| 면접 | 기술 리뷰 및 문화 적합성 확인 |
| 온보딩 | Day1 온보딩, 파일럿 프로젝트 |

---

## Rounds (채용별 프로젝트)

| Round | Role | Status | Link |
|-------|------|--------|------|
| 주니어 개발자 채용 | Developer | in_progress | [[prj-015]] |
| 코치 채용 | Coach | in_progress | [[prj-006]] |
| 외부 비서 채용 | Overseas Assistant | done | [[prj-007]] |

---

**Created**: 2025-12-25
**Owner**: 한명학
