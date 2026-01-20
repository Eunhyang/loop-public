---
entity_type: Project
entity_id: prj-mcp-dual-vault-rbac
entity_name: MCP Dual-Vault RBAC
created: 2025-12-26
updated: '2026-01-20'
status: planning
parent_id: trk-2
program_id: pgm-vault-system
aliases:
- prj-mcp-dual-vault-rbac
- MCP RBAC
- Dual Vault RBAC
outgoing_relations:
- type: extends
  target_id: prj-vault-gpt
  description: ChatGPT MCP OAuth 기반으로 RBAC 확장
validates: []
validated_by: []
owner: 김은향
budget: null
start_date: null
deadline: null
hypothesis_text: 역할 기반 접근 제어로 loop_exec 민감 데이터를 코어팀으로부터 보호할 수 있다
experiments: []
expected_impact:
  tier: enabling
  impact_magnitude: high
  confidence: 0.9
  contributes: []
realized_impact:
  verdict: null
  outcome: null
  evidence_links: []
  decided: null
conditions_3y:
- cond-b
tags:
- vault
- mcp
- oauth
- rbac
- security
priority_flag: high
track_contributes: []
---
# MCP Dual-Vault RBAC

> Project ID: `prj-mcp-dual-vault-rbac` | Program: `pgm-vault-system` | Status: active

---

## Project 가설

**"역할 기반 접근 제어로 loop_exec 민감 데이터를 코어팀으로부터 보호할 수 있다"**

---

## 목표

### 성공 기준

1. User 모델에 role 필드 추가 완료 (member | exec | admin)
2. JWT 토큰에 role/scope 포함
3. exec/ 경로 접근 시 role 체크로 member 차단
4. ChatGPT MCP에서 role별 데이터 접근 테스트 통과

### 실패 신호

1. Role 체크 우회 가능
2. exec 데이터 노출

---

## 배경

### 왜 이 프로젝트인가?

loop_exec vault에는 C-Level 민감 데이터(runway, cashflow, salary 등)가 있음. ChatGPT MCP를 통해 코어팀 멤버가 접근할 수 있으면 안 됨. 기존 OAuth 구조에 RBAC를 추가하여 역할별 접근 제어 필요.

### 선행 조건

- [x] OAuth 2.0 기본 구현 완료 (prj-vault-gpt)

- [x] JWT 토큰 발급 및 검증 작동

- [x] ChatGPT MCP 연결 성공

---

## 실행 계획

### Phase 1: User Model & Database

- [ ] RBAC-001: User 모델에 role 필드 추가

- [ ] RBAC-002: CLI에 role 관련 명령어 추가

### Phase 2: JWT & Access Control

- [ ] RBAC-003: JWT 발급 시 role/scope 포함

- [ ] RBAC-004: 경로 접근 제어 강화 (exec/ 차단)

- [ ] RBAC-005: API 미들웨어에서 role 체크

### Phase 3: Docker & Deployment

- [ ] RBAC-006: Docker 볼륨 마운트 추가

- [ ] RBAC-007: 환경변수 추가

- [ ] RBAC-008: Docker 재빌드 및 배포

### Phase 4: Testing

- [ ] RBAC-009: 테스트 사용자 생성

- [ ] RBAC-010: 접근 제어 테스트

- [ ] RBAC-011: ChatGPT 연결 테스트

---

## Tasks

| ID | Name | Assignee | Status | Due |
| --- | --- | --- | --- | --- |
| tsk-mcp-rbac-01 | User 모델 role 필드 + CLI | 김은향 | done |  |
| tsk-mcp-rbac-02 | 대시보드 OAuth 로그인 통합 | 김은향 | planning | 2025-12-26 |
| tsk-mcp-rbac-03 | loop_exec Vault 라우팅 | 김은향 | doing |  |
| tsk-mcp-rbac-04 | 복합 API exec vault 필터링 | 김은향 | doing |  |

---

## 기술 스펙

상세 기술 명세: `doc/mcp-dual-vault-rbac/techspec.md`

---

## 참고 문서

- \[\[prj-vault-gpt\]\] - ChatGPT MCP OAuth 기본 구현
- \[\[pgm-vault-system\]\] - 상위 Program

---

**Created**: 2025-12-26 **Owner**: 김은향