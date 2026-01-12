---
entity_type: Project
entity_id: prj-019
entity_name: Dual-Vault - 정비
created: 2026-01-02
updated: '2026-01-13'
status: doing
parent_id: trk-2
program_id: pgm-vault-system
aliases:
- prj-019
- Dual-Vault 정비
- Dual-Vault Cleanup
outgoing_relations:
- type: extends
  target_id: prj-mcp-dual-vault-rbac
  description: Dual-Vault RBAC 기반 경로 표준화
validates: []
validated_by: []
primary_hypothesis_id: null
owner: 김은향
budget: null
deadline: null
hypothesis_text: exec vault와 public vault의 경로 구조를 통일하면 API와 스크립트의 재사용성이 높아진다
experiments: []
expected_impact:
  tier: enabling
  impact_magnitude: mid
  confidence: 0.8
  contributes: []
  statement: exec vault와 public vault의 경로 구조 통일로 API/스크립트 재사용성 향상
  metric: 경로 통일 완료율
  target: 100%
realized_impact:
  verdict: null
  outcome: null
  evidence_links: []
  decided: null
conditions_3y:
- cond-b
tasks:
- tsk-019-13
- tsk-kly0ry-1767960471502
tags:
- vault
- dual-vault
- infrastructure
- cleanup
priority_flag: high
track_contributes: []
---
# Dual-Vault - 정비

> Project ID: `prj-019` | Program: `pgm-vault-system` | Status: doing

---

## Project 가설

**"exec vault와 public vault의 경로 구조를 통일하면 API와 스크립트의 재사용성이 높아진다"**

---

## 목표

### 성공 기준

1. 

- [x] exec vault의 `50_Projects_Exec/` 구조를 `50_Projects/`로 마이그레이션 완료

- [x] exec CLAUDE.md 문서 업데이트 완료

- [x] public과 동일한 API 경로 패턴 사용 가능 (예: `/api/projects`, `/api/tasks`)

- [ ] 기존 기능 정상 동작 확인 (Validation 필요)

### 실패 신호

1. 마이그레이션 후 기존 링크 깨짐
2. API 접근 실패

---

## 배경

### 왜 이 프로젝트인가?

exec vault가 `50_Projects_Exec/P015/` 구조를 사용하고 있어 public vault의 `50_Projects/` 구조와 불일치했음. 이로 인해:

- API 라우팅 로직 중복
- 스크립트 재사용 어려움
- CLAUDE.md 문서 복잡화

A안(경로 통일)을 적용하여 양쪽 vault 모두 `50_Projects/` 구조로 통일 완료.

### 선행 조건

- [x] prj-mcp-dual-vault-rbac 진행 중 (RBAC 기반 접근 제어)

- [x] exec vault 기본 구조 정의 완료

---

## 실행 계획

### Phase 1: 경로 마이그레이션

- [x] `50_Projects_Exec/` → `50_Projects/` 디렉토리 이름 변경 (git mv)

- [x] 내부 파일 링크 업데이트 (R001\_단님\_파일럿\_회고.md)

### Phase 2: 문서 업데이트

- [x] exec CLAUDE.md 문서 업데이트

- [x] `40_People/Hiring_Rounds/` 예시를 `50_Projects/Hiring_Rounds/`로 변경

- [x] API mcp_composite.py 예시 경로 수정

### Phase 3: 검증

- [ ] 기존 기능 정상 동작 확인

- [ ] API 경로 테스트

---

## Tasks

| ID | Name | Assignee | Status | Due |
| --- | --- | --- | --- | --- |
| tsk-017-08 | Dual-Vault - exec 경로 표준 확정 | 김은향 | doing | 2026-01-02 |

---

## Notes

### PRD (Product Requirements Document)

**문제 정의**:

- exec vault의 `50_Projects_Exec/` 경로가 public vault의 `50_Projects/`와 불일치했음
- API 및 스크립트에서 경로 분기 로직 필요했음

**목표**:

- 양쪽 vault 모두 `50_Projects/` 구조로 통일 (완료)

**핵심 요구사항** (모두 완료):

1. 

- [x] 디렉토리 이름 `50_Projects_Exec/` → `50_Projects/` 변경

- [x] 내부 파일 링크 업데이트

- [x] exec CLAUDE.md 문서 업데이트

- [x] `40_People/Hiring_Rounds/` 예시 정리

---

## 참고 문서

- \[\[pgm-vault-system\]\] - 상위 Program
- \[\[prj-mcp-dual-vault-rbac\]\] - 관련 RBAC 프로젝트
- \[\[loop_exec/CLAUDE.md\]\] - exec vault 문서

---

**Created**: 2026-01-02 **Owner**: 김은향