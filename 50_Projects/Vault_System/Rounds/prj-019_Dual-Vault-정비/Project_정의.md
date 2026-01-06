---
entity_type: Project
entity_id: "prj-019"
entity_name: "Dual-Vault - 정비"
created: 2026-01-02
updated: 2026-01-02
status: doing

# === 계층 ===
parent_id: "trk-2"
program_id: "pgm-vault-system"
aliases: ["prj-019"]

# === 관계 ===
outgoing_relations:
  - type: extends
    target_id: "prj-mcp-dual-vault-rbac"
    description: "Dual-Vault RBAC 기반으로 운영 정비"
validates: []
validated_by: []
primary_hypothesis_id: null

# === Project 전용 ===
owner: "김은향"
budget: null
deadline: null
hypothesis_text: "Dual-Vault 구조를 정비하면 exec 데이터 보호와 팀 자동화를 동시에 달성할 수 있다"
experiments: []
tasks:
  - tsk-017-09
  - tsk-017-11
  - tsk-017-12
  - tsk-017-13
  - tsk-017-14
  - tsk-017-15
  - tsk-022-02

# === Expected Impact (A) ===
expected_impact:
  tier: enabling
  impact_magnitude: mid
  confidence: 0.85
  statement: "이 프로젝트가 성공하면 exec 데이터 보호와 팀 자동화 분리가 명확해진다"
  metric: "토큰 분리 완료율"
  target: "100%"

# === Realized Impact (B) ===
realized_impact:
  verdict: null
  outcome: null
  evidence_links: []
  decided: null
  window_id: null
  time_range: null
  metrics_snapshot: {}

# === Condition 기여 ===
condition_contributes:
  - to: "cond-b"
    weight: 0.8
    description: "Loop Dataset 보호 및 분리"

# === Secondary Track 기여 ===
track_contributes: []

# === 3Y 전략 연결 ===
conditions_3y: ["cond-b"]

# === 분류 ===
tags: ["vault", "dual-vault", "security", "n8n", "ops"]
priority_flag: high
---

# Dual-Vault - 정비

> Project ID: `prj-019` | Track: `trk-2` | Status: doing

---

## Project 가설

**"Dual-Vault 구조를 정비하면 exec 데이터 보호와 팀 자동화를 동시에 달성할 수 있다"**

---

## 목표

### 성공 기준
1. n8n 토큰 분리 완료 (svc_public / svc_admin)
2. API 서버 권한 분리 구현 (/admin/* → admin 토큰 필수)
3. 팀 자동화가 public API만으로 정상 동작
4. exec 데이터는 admin 토큰으로만 접근 가능

### 실패 신호
1. 팀 토큰으로 exec 데이터 접근 가능
2. 권한 분리로 인한 기존 자동화 실패

---

## 배경

### 왜 이 프로젝트인가?

Dual-Vault (LOOP + loop_exec) 구조에서 접근 권한을 명확히 분리해야 함.
현재 n8n에서 단일 토큰으로 모든 API에 접근 가능한 상태.
팀 자동화와 C-Level 전용 데이터를 토큰 수준에서 분리 필요.

### 선행 조건

- [x] Dual-Vault RBAC 기본 구현 완료 (prj-mcp-dual-vault-rbac)
- [x] API 서버 인증 체계 작동
- [x] n8n 워크플로우 동작 확인

---

## 실행 계획

### Phase 1: 토큰 분리 설정
- [ ] svc_public 토큰 생성 (팀 자동화용)
- [ ] svc_admin 토큰 생성 (exec 수집/집계용)
- [ ] API 서버 권한 분리 구현

### Phase 2: n8n 워크플로우 업데이트
- [ ] 팀 자동화 워크플로우 svc_public 토큰으로 전환
- [ ] exec 수집 워크플로우 svc_admin 토큰으로 전환
- [ ] 기존 토큰 폐기

---

## Tasks

| ID | Name | Assignee | Status | Due |
|----|------|----------|--------|-----|
| tsk-017-09 | Dual-Vault - Program-Round 조인 API | 김은향 | done | 2026-01-02 |
| tsk-017-11 | Dual-Vault - n8n 토큰 분리 설정 | 김은향 | doing | |
| tsk-017-12 | Dual-Vault - Program-Round 대시보드 통합 | 김은향 | done | 2026-01-02 |
| tsk-017-13 | Dual-Vault - exec_rounds_path 자동 라우팅 | 김은향 | done | 2026-01-03 |
| tsk-017-14 | Dual-Vault - exec ID 체계 정비 | 김은향 | done | 2026-01-03 |
| tsk-017-15 | Dual-Vault - exec ID 마이그레이션 | 김은향 | done | 2026-01-03 |

---

## 참고 문서

- [[prj-mcp-dual-vault-rbac]] - Dual-Vault RBAC 기본 구현
- [[pgm-vault-system]] - 상위 Program
- [[trk-2]] - Data Track

---

**Created**: 2026-01-02
**Owner**: 김은향
