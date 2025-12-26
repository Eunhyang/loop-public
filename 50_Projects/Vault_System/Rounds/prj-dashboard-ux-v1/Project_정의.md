---
entity_type: Project
entity_id: prj-dashboard-ux-v1
entity_name: 대시보드 UX 개선 v1
created: 2025-12-26
updated: '2025-12-26'
status: doing
program_id: pgm-vault-system
cycle: '2025'
owner: 한명학
budget: null
deadline: null
expected_impact:
  tier: none
  impact_magnitude: null
  confidence: null
  contributes: []
realized_impact:
  verdict: null
  outcome: null
  evidence_links: []
  decided: null
hypothesis_id: null
experiments: []
parent_id: trk-6
conditions_3y:
- cond-e
aliases:
- prj-dashboard-ux-v1
- 대시보드 UX 개선 v1
- Dashboard UX v1
outgoing_relations: []
validates: []
validated_by: []
tags:
- project
- vault-system
- dashboard
- ux
- keyboard
priority_flag: medium
---
# 대시보드 UX 개선 v1

> Project ID: `prj-dashboard-ux-v1` | Program: [[pgm-vault-system]] | Status: planning

## 프로젝트 개요

LOOP Dashboard의 키보드 단축키 기본 세트를 구현하여 팀원 생산성을 향상시키는 프로젝트.

**Scope**: 키보드 단축키 기본 세트 (뷰 전환, 필터, 도움말)

---

## 목표

### 성공 기준
1. 숫자키(1/2/3)로 뷰 전환 가능
2. F/R 키로 필터 토글/리셋 가능
3. ? 키로 단축키 도움말 표시

### 실패 신호
1. 단축키가 Quick Search와 충돌
2. 입력 필드에서 의도치 않게 동작

---

## Tasks

| ID | Name | Assignee | Status | Due |
|----|------|----------|--------|-----|
| tsk-dashboard-ux-v1-01 | 뷰 전환 단축키 (1/2/3) | 한명학 | planning | |
| tsk-dashboard-ux-v1-02 | 필터 단축키 (F/R) | 미정 | planning | |
| tsk-dashboard-ux-v1-03 | 단축키 도움말 (?) | 미정 | planning | |

---

## 참조

- **Program**: [[_PROGRAM|Vault 시스템 체계화]]
- **Dashboard**: `_dashboard/index.html`
- **관련 JS**: `_dashboard/js/app.js`, `_dashboard/js/components/quick-search.js`

---

**Created**: 2025-12-26
**Owner**: 한명학
