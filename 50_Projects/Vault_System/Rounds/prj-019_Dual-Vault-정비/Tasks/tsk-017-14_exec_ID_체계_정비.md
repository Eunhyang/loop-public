---
entity_type: Task
entity_id: "tsk-017-14"
entity_name: "Dual-Vault - exec ID 체계 정비"
created: 2026-01-03
updated: 2026-01-03
status: done
closed: 2026-01-03

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

- [x] schema_constants.yaml에 exec_id_patterns 추가
- [ ] 기존 exec 파일들 ID 마이그레이션 (별도 Task로 분리)
- [x] loop-entity-creator SKILL.md 수정
- [x] API entity_generator.py 수정
- [ ] 테스트: exec vault에 새 Project/Task 생성

---

## Notes

### 작업 로그

#### 2026-01-03 20:30
**개요**: exec vault ID 체계 SSOT 정의 및 API/스킬 반영 완료

**변경사항**:
1. **schema_constants.yaml v5.4**
   - `cross_vault.exec_id_patterns` 섹션 추가
   - standalone 패턴: `prj-exec-NNN`, `tsk-exec-NNN`
   - program_round 패턴: `prj-{program}-{round}`, `tsk-{keyword}-NN`
   - 금지 패턴 명시: `prj-NNN`, `tsk-NNN-NN` (public 충돌)

2. **loop-entity-creator SKILL.md**
   - Exec Vault ID 규칙 섹션 추가
   - Exec Project/Task ID 생성 Step 수정

3. **api/utils/entity_generator.py**
   - `generate_exec_project_id()` 메서드 추가
   - `generate_exec_task_id()` 메서드 추가
   - `validate_exec_id()` 메서드 추가
   - 편의 함수 3개 추가

**파일 변경**:
- `00_Meta/schema_constants.yaml` - exec_id_patterns 섹션 (+55 lines)
- `.claude/skills/loop-entity-creator/SKILL.md` - ID 규칙 섹션 (+50 lines)
- `api/utils/entity_generator.py` - exec ID 생성 로직 (+200 lines)

**결과**: ✅ SSOT 정의 + API/스킬 반영 완료

**남은 작업**:
- 기존 exec 파일들 ID 마이그레이션 (prj-017 → prj-tips-idp 등) - 별도 Task로 분리 권장
- 테스트 실행

---

## 참고 문서

- [[prj-019]] - 소속 Project (Dual-Vault - 정비)
- [[tsk-017-13]] - 선행 Task (exec_rounds_path 자동 라우팅)
- `00_Meta/schema_constants.yaml` - SSOT

---

**Created**: 2026-01-03
**Assignee**: 김은향
**Due**: 2026-01-03
