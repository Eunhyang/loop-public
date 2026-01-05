---
entity_type: Project
entity_id: prj-dashboard-ux-v1
entity_name: 대시보드 UX 개선 v1
created: 2025-12-26
updated: '2025-12-27'
status: ''
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
parent_id: trk-2
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
| tsk-dashboard-ux-v1-05 | Schema 상수 중앙화 | 김은향 | done | |
| tsk-dashboard-ux-v1-07 | validate_schema.py YAML 일원화 | 김은향 | done | |
| tsk-dashboard-ux-v1-08 | build_graph_index.py YAML 일원화 | 김은향 | done | |
| tsk-dashboard-ux-v1-09 | loop-entity-creator 문서 수정 | 김은향 | done | |
| tsk-dashboard-ux-v1-22 | Dashboard - PDF 첨부파일 500 에러 진단 | 김은향 | done | 2026-01-05 |
| tsk-019-25 | Schema - Task type에 meeting 추가 | 김은향 | doing | |

---

## 참조

- **Program**: [[_PROGRAM|Vault 시스템 체계화]]
- **Dashboard**: `_dashboard/index.html`
- **관련 JS**: `_dashboard/js/app.js`, `_dashboard/js/components/quick-search.js`

---

## Notes

### PRD (Product Requirements Document)

#### tsk-dashboard-ux-v1-05: Schema 상수 중앙화
- **문제 정의**: 스키마 상수(status, priority, ID 패턴 등)가 7개 파일에 분산되어 있어 변경 시 누락/불일치 발생
- **목표**: schema_constants.yaml을 Single Source of Truth로 확장하여 모든 스키마 상수 일원화
- **핵심 요구사항**:
  - paths, id_patterns, required_fields, known_fields, entity_order, status_mapping 섹션 추가
  - 기존 상수들과 호환성 유지
  - 이후 Task들(validate_schema.py, build_graph_index.py, api/constants.py, state.js)이 참조할 수 있도록 구조화

#### tsk-dashboard-ux-v1-06: Dashboard Reset Filter 전체 초기화
- **문제 정의**: 현재 "Reset All" 버튼은 Filter Panel 내부 필터만 초기화하고, 상단 탭(담당자/프로젝트)과 Sidebar(Track/Hypothesis/Condition) 필터는 유지됨
- **목표**: 모든 필터를 한 번에 초기화하여 전체 태스크 표시 (기간 없는 태스크 포함)
- **핵심 요구사항**:
  - `State.resetAllFilters()` 메서드 구현 (모든 필터 상태 초기화)
  - `FilterPanel.reset()`에서 `resetAllFilters()` 호출 및 UI 갱신
  - Quick date 필터 완전 해제 (due_date 없는 태스크도 표시)
  - Tabs, Sidebar 렌더링 갱신

---

**Created**: 2025-12-26
**Owner**: 한명학
