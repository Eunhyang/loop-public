---
entity_type: Task
entity_id: "tsk-017-14"
entity_name: "Dual-Vault - exec ID 체계 정비"
created: 2026-01-03
updated: 2026-01-03
status: doing

# === 계층 ===
parent_id: "prj-019"
project_id: "prj-019"
aliases: ["tsk-017-14"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-03
due: 2026-01-03
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 분류 ===
tags: ["dual-vault", "exec", "id-system", "ssot", "api"]
priority_flag: high
---

# Dual-Vault - exec ID 체계 정비

> Task ID: `tsk-017-14` | Project: `prj-019` | Status: doing

## 목표

**완료 조건**:
1. exec vault ID 체계 SSOT 정의 (schema_constants.yaml)
2. 기존 exec 파일들 ID 마이그레이션
3. loop-entity-creator 스킬에 exec ID 규칙 반영
4. API에 exec ID 생성 로직 반영

---

## 상세 내용

### 배경

현재 exec vault의 ID 체계가 4가지 패턴으로 혼재:

| 패턴 | 예시 | 문제 |
|------|------|------|
| `prj-NNN` | prj-017, prj-018 | public과 충돌 위험 |
| `prj-exec-NNN` | prj-exec-001 | 원래 의도 |
| `prj-{keyword}` | prj-grants-jemi | 의미 있지만 비일관 |
| `tsk-NNN-NN` | tsk-017-01 | public과 충돌 위험 |

### 제안 체계

```yaml
# exec vault ID 규칙

# 1. 민감 단독 프로젝트 (다온, 채용 등)
exec_standalone:
  project: "prj-exec-NNN"  # prj-exec-001
  task: "tsk-exec-NNN"     # tsk-exec-001

# 2. Program Round 프로젝트 (지원사업 배치 등)
exec_program_round:
  project: "prj-{program}-{round}"  # prj-tips-primer
  task: "tsk-{keyword}-NN"          # tsk-primer-01

# 절대 금지: 순차 번호 (tsk-NNN-NN, prj-NNN)
```

### 작업 내용

1. **schema_constants.yaml 확장**
   - `exec_id_patterns` 섹션 추가
   - exec vault 전용 ID 규칙 정의

2. **기존 파일 마이그레이션**
   - prj-017 → prj-tips-idp
   - prj-018 → prj-tips-primer (이미 폴더명에 primer 있음)
   - tsk-017-01~04 → tsk-tips-idp-01~04
   - tsk-019-09~11 → tsk-grants-jemi-09~11

3. **loop-entity-creator 스킬 수정**
   - Exec Vault Entity Creation 섹션에 새 ID 규칙 반영

4. **API 수정**
   - entity_generator.py에 exec ID 생성 로직 추가
   - 요청 vault에 따라 ID 패턴 분기

---

## 체크리스트

- [ ] schema_constants.yaml에 exec_id_patterns 추가
- [ ] 기존 exec 파일들 ID 마이그레이션 스크립트 작성/실행
- [ ] loop-entity-creator SKILL.md 수정
- [ ] API entity_generator.py 수정
- [ ] 테스트: exec vault에 새 Project/Task 생성

---

## Notes

### PRD

_(prompt-enhancer 실행 후 작성)_

### 작업 로그

<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)
-->

---

## 참고 문서

- [[prj-019]] - 소속 Project (Dual-Vault - 정비)
- [[tsk-017-13]] - 선행 Task (exec_rounds_path 자동 라우팅)
- `00_Meta/schema_constants.yaml` - SSOT

---

**Created**: 2026-01-03
**Assignee**: 김은향
**Due**: 2026-01-03
