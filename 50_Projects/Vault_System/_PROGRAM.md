---
entity_type: Program
entity_id: pgm-vault-system
entity_name: Vault 시스템 체계화
created: 2025-12-25
updated: 2025-12-25
status: active

# === Program 정의 ===
program_type: infrastructure
owner: 한명학

# === 원칙/프로세스 ===
principles:
  - "LLM 최적화: Claude Code가 O(1)-O(2) 단계로 정보 탐색 가능하도록 구조화"
  - "스키마 일관성: schema_registry.md 기준 모든 엔티티 YAML 준수"
  - "자동화 우선: 수동 작업 최소화, 스크립트/훅으로 자동 검증"

process_steps:
  - "분석: 현재 vault 구조 및 문제점 파악"
  - "설계: 개선 방안 및 스키마 변경 설계"
  - "구현: 스크립트, 템플릿, 문서 업데이트"
  - "검증: validation 통과 및 LLM 탐색 테스트"
  - "문서화: CLAUDE.md 및 관련 문서 반영"

templates: []

# === 운영 KPI ===
kpis:
  - name: "스키마 준수율"
    description: "validate_schema.py 통과율"
  - name: "고아 문서 수"
    description: "check_orphans.py 경고 수"
  - name: "LLM 탐색 효율"
    description: "정보 도달까지 평균 hop 수"

# === Cross-Vault ===
exec_rounds_path: null

# === 계층 ===
parent_id: null
aliases:
  - pgm-vault-system
  - Vault 시스템 체계화
  - Vault System

outgoing_relations: []
validates: []
validated_by: []
tags: ["program", "vault", "infrastructure", "llm-optimization"]
priority_flag: high
---

# Vault 시스템 체계화

> Program ID: `pgm-vault-system` | Type: infrastructure | Status: active

## 프로그램 개요

LOOP Obsidian vault의 구조, 스키마, 자동화 시스템을 체계적으로 관리하고 개선하는 상시 프로그램.

**목표**: LLM(Claude Code)과 인간 모두가 효율적으로 탐색 가능한 knowledge vault 유지

---

## 운영 원칙

1. **LLM 최적화**: Claude Code가 O(1)-O(2) 단계로 정보 탐색 가능하도록 구조화
2. **스키마 일관성**: schema_registry.md 기준 모든 엔티티 YAML 준수
3. **자동화 우선**: 수동 작업 최소화, 스크립트/훅으로 자동 검증

---

## 프로세스

```
분석 → 설계 → 구현 → 검증 → 문서화
```

| 단계 | 주요 활동 |
|------|----------|
| 분석 | 현재 vault 구조 및 문제점 파악 |
| 설계 | 개선 방안 및 스키마 변경 설계 |
| 구현 | 스크립트, 템플릿, 문서 업데이트 |
| 검증 | validation 통과 및 LLM 탐색 테스트 |
| 문서화 | CLAUDE.md 및 관련 문서 반영 |

---

## 범위

이 Program에 속하는 작업 유형:
- 스키마 정의 및 업데이트 (`00_Meta/schema_registry.md`)
- 검증 스크립트 개발/수정 (`scripts/`)
- 템플릿 관리 (`00_Meta/_TEMPLATES/`)
- Graph Index 구조 개선
- Archive 시스템 관리
- Dashboard/API 연동

---

## Rounds (개선 프로젝트)

| Round | Cycle | Status | Link |
|-------|-------|--------|------|
| ChatGPT Vault MCP 연결 | 2025 | in_progress | [[prj-vault-gpt]] |

---

**Created**: 2025-12-25
**Owner**: 한명학