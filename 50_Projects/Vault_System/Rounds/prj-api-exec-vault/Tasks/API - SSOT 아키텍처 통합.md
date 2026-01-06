---
entity_type: Task
entity_id: "tsk-018-03"
entity_name: "API - SSOT 아키텍처 통합"
created: 2026-01-06
updated: 2026-01-06
status: doing

# === 계층 ===
parent_id: "prj-api-exec-vault"
project_id: "prj-api-exec-vault"
aliases: ["tsk-018-03"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-06
due: 2026-01-06
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop-api

# === 분류 ===
tags: ["api", "ssot", "architecture", "exec-vault"]
priority_flag: high
---

# API - SSOT 아키텍처 통합

> Task ID: `tsk-018-03` | Project: `prj-api-exec-vault` | Status: doing

## 목표

**완료 조건**:
1. 공통 코드를 `shared/`로 분리 (OAuth, 미들웨어, 유틸리티)
2. exec/api를 public/api와 동일한 SSOT 구조로 재구성
3. KPI Analytics를 exec/api/routers/에 통합
4. OAuth scope 기반 접근 제어 구현

---

## 상세 내용

### 배경

현재 public/api와 exec/api가 별도로 존재하며:
- public/api: LOOP Vault API (팀 공개)
- exec/api: KPI Analytics (Amplitude, RevenueCat)

보안 요구사항:
- exec vault 관련 코드는 exec/에만 있어야 함 (코어팀에게 소스코드 비공개)
- OAuth로 API 응답 차단 가능하지만, 소스코드 자체가 노출되면 안 됨

### 작업 내용

**1. shared/ 공통 코드 분리**
- `shared/auth/` - OAuth, 미들웨어, JWT 검증
- `shared/utils/` - vault_utils, yaml_utils, cache
- `shared/models/` - 공통 Pydantic 모델

**2. exec/api SSOT 구조화**
- constants.py - exec vault 스키마 상수
- routers/ - runway, cashflow, people, kpi
- MCP mount (/mcp)

**3. OAuth scope 기반 접근 제어**
- `mcp:read` - LOOP Vault (public)
- `mcp:exec` - Exec Vault
- `kpi:read` - KPI Analytics

---

## 체크리스트

- [ ] shared/ 폴더 생성 및 공통 코드 이동
- [ ] exec/api 구조 재설계
- [ ] KPI Analytics 통합
- [ ] OAuth scope 검증 로직 추가
- [ ] 테스트

---

## Notes

### PRD (Product Requirements Document)


### 작업 로그


---

## 참고 문서

- [[prj-api-exec-vault]] - 소속 Project
- 논의 내용: shared/ 공통 코드 분리 구조

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
