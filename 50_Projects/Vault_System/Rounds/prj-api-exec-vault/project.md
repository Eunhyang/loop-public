---
entity_type: Project
entity_id: prj-api-exec-vault
entity_name: API - Exec Vault 통합
created: 2026-01-02
updated: '2026-01-15'
status: doing
program_id: pgm-vault-system
cycle: '2026'
owner: 김은향
budget: null
deadline: null
expected_impact:
  tier: enabling
  impact_magnitude: mid
  confidence: 0.7
  contributes:
  - to: cond-e
    weight: 0.3
    description: Dual-vault 통합으로 Vault 시스템 완성도 향상
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
- prj-api-exec-vault
- API - Exec Vault 통합
- Exec Vault API
outgoing_relations: []
validates: []
validated_by: []
tags:
- project
- vault-system
- api
- exec-vault
- dual-vault
priority_flag: high
track_contributes: []
---
# API - Exec Vault 통합

> Project ID: `prj-api-exec-vault` | Program: \[\[pgm-vault-system\]\] | Status: doing

## 프로젝트 개요

LOOP API가 exec vault (민감 정보 vault)의 프로젝트도 로드하여 대시보드에서 통합 관리할 수 있도록 개선.

**배경**:

- exec vault의 프로젝트 (예: `prj-exec-001` 다온 영상편집자)가 대시보드에서 보이지 않음
- VaultCache가 public vault만 스캔하기 때문
- 채용 프로그램 (`pgm-hiring`) 하위 프로젝트가 누락됨

**목표**:

- VaultCache가 exec vault 프로젝트도 로드
- 민감 정보 (계약 단가 등)는 API 응답에서 필터링
- 대시보드에서 Program 하위 프로젝트 완전 표시

---

## Tasks

| Task ID | Task Name | Assignee | Status |
| --- | --- | --- | --- |
| tsk-018-01 | API - VaultCache exec vault 프로젝트 로드 | 김은향 | doing |
| tsk-018-02 | API - exec vault 프로젝트 스캔 로직 리팩토링 | 김은향 | doing |
| tsk-018-03 | API - SSOT 아키텍처 통합 | 김은향 | done |
| tsk-018-04 | API - exec MCP mount 구현 | 김은향 | done |
| tsk-018-05 | API - public shared import 경로 수정 | 김은향 | done |
| tsk-018-06 | API - Members SSOT 통합 | 김은향 | doing |
| tsk-0vault-1768106628300 | OAuth - SQLite busy_timeout 설정 | 김은향 | doing |

---

## 참조

- **Program**: \[\[\_PROGRAM|Vault 시스템 체계화\]\]
- **exec vault 구조**: `exec/50_Projects/`
- **관련 코드**: `api/cache/vault_cache.py`

---

**Created**: 2026-01-02 **Owner**: 김은향