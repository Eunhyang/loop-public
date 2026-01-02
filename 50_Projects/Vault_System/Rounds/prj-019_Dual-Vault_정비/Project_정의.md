---
entity_type: Project
entity_id: "prj-019"
entity_name: "Dual-Vault - 정비"
created: 2026-01-02
updated: 2026-01-02
status: active

# === 계층 (전략 연결) ===
parent_id: "trk-2"
program_id: "pgm-vault-system"
aliases: ["prj-019", "Dual-Vault 정비", "Dual Vault Maintenance"]

# === 관계 ===
outgoing_relations:
  - type: related
    target_id: "prj-mcp-dual-vault-rbac"
    description: "Dual-Vault RBAC 프로젝트와 관련된 인프라 정비"
validates: []
validated_by: []
primary_hypothesis_id: null

# === Project 전용 ===
owner: "김은향"
budget: null
deadline: null
hypothesis_text: "exec vault에 pre-commit hook과 validation을 추가하면 데이터 품질이 향상된다"
experiments: []

# === Expected Impact (A) ===
tier: enabling
impact_magnitude: mid
confidence: 0.8
condition_contributes:
  - to: "cond-b"
    weight: 0.3
    description: "Vault 데이터 품질 향상으로 Loop Dataset 신뢰도 증가"
track_contributes: []

expected_impact:
  statement: "exec vault의 스키마 검증 자동화로 데이터 일관성 보장"
  metric: "validation 에러 수"
  target: "0 errors on commit"

# === Realized Impact (B) ===
realized_impact:
  verdict: null
  outcome: null
  evidence_links: []
  decided: null
  window_id: null
  time_range: null
  metrics_snapshot: {}

# === 3Y 전략 연결 ===
conditions_3y: ["cond-b"]

# === 분류 ===
tags: ["vault", "dual-vault", "exec", "pre-commit", "validation", "infrastructure"]
priority_flag: medium
---

# Dual-Vault - 정비

> Project ID: `prj-019` | Program: `pgm-vault-system` | Status: active

---

## 🏁 Project Rollup

> ⚠️ **프로젝트 종료 시 필수 작성** (진행 중에는 비워둠)

### Conclusion
<!-- 3줄 이내 핵심 결론 -->
1.
2.
3.

### Evidence
| # | Type | 근거 요약 | 링크 |
|---|------|----------|------|
| 1 | | | [[]] |
| 2 | | | [[]] |
| 3 | | | [[]] |

> Type: `task` | `meeting` | `experiment` | `decision` | `finance`

### Metric Delta
| Metric | Before | After | Δ | 판정 |
|--------|--------|-------|---|------|
| | | | | |

### Decision
- **Verdict**: `pending` → `go` | `no-go` | `pivot`
- **Next Action**:
- **Decided**:

---

## Project 가설

**"exec vault에 pre-commit hook과 validation을 추가하면 데이터 품질이 향상된다"**

---

## 목표

### 성공 기준
1. exec vault에 pre-commit hook 설치 완료
2. validate_schema.py가 에러 시 커밋 차단
3. check_orphans.py가 경고 출력
4. build_graph_index.py가 자동 실행 및 스테이징

### 실패 신호
1. pre-commit hook이 정상 동작하지 않음
2. public vault scripts 복사로 인한 중복 관리 발생

---

## 배경

### 왜 이 프로젝트인가?

public vault에는 pre-commit hook이 있어 스키마 검증이 자동화되어 있음.
exec vault에는 아직 이 자동화가 없어 수동 검증에 의존.
exec vault도 동일한 품질 관리 체계가 필요함.

### 선행 조건

- [x] public vault에 pre-commit hook 구현 완료
- [x] validate_schema.py, check_orphans.py, build_graph_index.py 스크립트 존재

---

## 실행 계획

### Phase 1: exec vault pre-commit hook
- [ ] pre-commit hook 파일 생성
- [ ] public scripts 재사용 (복사 금지, 경로 참조)
- [ ] validate_schema.py 실행 (에러 시 커밋 차단)
- [ ] check_orphans.py 실행 (경고만)
- [ ] build_graph_index.py 실행 + 자동 스테이징

---

## Tasks

| ID | Name | Assignee | Status | Due |
|----|------|----------|--------|-----|
| tsk-019-01 | exec pre-commit hook 추가 | 김은향 | todo | |

---

## Notes

### PRD (Product Requirements Document)

**문제 정의**:
exec vault에 커밋 전 자동 검증이 없어 스키마 불일치가 발생할 수 있음.

**목표**:
public vault와 동일한 pre-commit 자동화를 exec vault에 적용.

**핵심 요구사항**:
1. validate_schema.py 실행 - 에러 시 커밋 차단
2. check_orphans.py 실행 - 경고 출력만 (차단 없음)
3. build_graph_index.py 실행 - 자동 스테이징 포함
4. public vault의 scripts/ 재사용 (복사 금지)

**기술 스펙**:
- pre-commit hook 위치: exec/.git/hooks/pre-commit
- 스크립트 경로: public/scripts/ 참조 (상대 경로 또는 환경변수)

**제약 조건**:
- scripts 파일 복사 금지 (유지보수 단일화)
- public vault의 스크립트를 직접 호출

**성공 지표**:
- pre-commit hook 설치 후 스키마 에러 있는 파일 커밋 시 차단됨
- 정상 파일은 커밋 성공

---

## 참고 문서

- [[prj-mcp-dual-vault-rbac]] - Dual-Vault RBAC 프로젝트
- [[pgm-vault-system]] - 상위 Program
- [[public/scripts/]] - 재사용할 validation 스크립트

---

**Created**: 2026-01-02
**Owner**: 김은향
