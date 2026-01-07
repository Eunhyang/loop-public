---
entity_type: Meta
entity_id: meta:ssot-contract
entity_name: LOOP Vault SSOT Contract
created: 2026-01-07
updated: 2026-01-07
version: "1.0"
tags: ["meta", "ssot", "contract", "governance"]
---

# LOOP Vault SSOT Contract

> **Single Source of Truth 계약서 - 시스템 전체가 준수해야 할 강제 규칙**

이 문서는 LOOP Vault의 **SSOT(Single Source of Truth)** 원칙을 정의하고, 모든 코드/API/UI/스크립트가 준수해야 할 강제 규칙을 명시한다.

**목적**: "엉망진창"을 끝내고, SSOT가 깨지지 않는 구조를 만든다.

---

## 1. SSOT는 무엇인가?

### 원칙

**SSOT = Markdown Frontmatter + Git Commit Rule**

```yaml
# SSOT 정의 (강제)
1. 각 엔티티의 유일한 진실의 원천은 Markdown 파일의 frontmatter이다
2. 모든 쓰기(write)는 Git 워크플로를 통해서만 유효하다
3. 현재 단계에서 DB는 없다 (frontmatter가 유일한 SSOT)
```

### Git Commit Rule (강제)

**모든 SSOT 변경은 반드시 Git commit + audit log로 귀결되어야 한다**

- NAS/UI/API에서 직접 편집하더라도, **즉시 커밋/로그 기록**이 따라야 함
- 커밋 없이 수정된 SSOT는 "유효하지 않은 상태"로 간주
- 로컬 sync에 의해 덮여쓰이거나 충돌 발생 시, **Git history가 유일한 진실**

### 예외 조항

**NAS/UI 직접 편집은 "허용"하되, 다음 조건을 만족해야 함:**

1. 최소 요구사항: `_build/run_log/` 또는 `decision_log.jsonl` 등 **append-only 기록**
2. 이상적 요구사항: 서버가 변경 사항을 **commit(PR)로 생성** 또는 "커밋 대기 큐" 운영
3. 동기화 규칙: MacBook ↔ NAS 실시간 동기화가 있는 경우, **커밋이 우선**

**위반 시**: SSOT가 로컬/원격 sync에 의해 덮여쓰이고, 변경 이력이 사라짐

---

## 2. Derived는 무엇인가?

### 원칙

**Derived는 SSOT에서 자동 생성되는 산출물이며, 절대 write target이 아니다**

```yaml
# Derived 정의 (강제)
1. Derived는 어떤 API/UI도 직접 수정할 수 없다
2. 오직 생성 스크립트만 Derived를 쓸 수 있다
3. Derived는 언제든 삭제하고 재생성 가능해야 한다
```

### Derived 목록 (수동 수정 절대 금지)

| 파일/디렉토리 | 생성 스크립트 | 용도 | 재생성 시점 |
|--------------|--------------|------|-------------|
| `_Graph_Index.md` | `build_graph_index.py` | 엔티티 그래프 인덱스 | pre-commit |
| `_build/impact.json` | `build_impact.py` | A/B 점수 계산 결과 | 수동 |
| `_build/index.json` | - | 검색 인덱스 | - |
| `_build/ai_audit/` | n8n workflow | AI 감사 로그 | 자동 |
| `_build/run_log/` | API server | 실행 로그 | 자동 |
| `90_Archive/00_Catalog/` | `build_archive_catalog.py` | 아카이브 카탈로그 | pre-commit |

**헤더 표시 규칙**: 모든 Derived 파일은 최상단에 다음 문구 필수
```markdown
> 자동 생성됨 - 수동 편집 금지
```

### Derived 필드 (Frontmatter 저장 금지)

**출처**: `schema_constants.yaml` → `validation_rules.derived_fields`

| 엔티티 | 금지 필드 | 계산 방법 |
|--------|----------|----------|
| Hypothesis | `validated_by` | Evidence에서 역인덱스 계산 |
| Track | `realized_sum` | 하위 Project B 집계 |
| Condition | `realized_sum` | 하위 Project B 집계 |

**위반 시**: `validate_schema.py`가 경고 발생

---

## 3. 엔티티별 SSOT 위치

**출처**: `schema_constants.yaml` → `file_locations`

| 엔티티 | 위치 | 파일명 규칙 |
|--------|------|------------|
| NorthStar | `01_North_Star/` | `ns-{id}_{name}.md` |
| MetaHypothesis | `01_North_Star/` | `mh-{id}_{name}.md` |
| Condition | `20_Strategy/3Y_Conditions_{period}/` | `cond-{id}_{name}.md` |
| Track | `20_Strategy/12M_Tracks/{year}/` | `trk-{id}_{name}.md` |
| Program | `50_Projects/{ProgramName}/` | `_PROGRAM.md` |
| **Project** | `50_Projects/.../` | **`project.md`** (강제) |
| **Task** | `50_Projects/.../Tasks/` | **`tsk-{id}.md`** (권장) |
| Hypothesis | `60_Hypotheses/{year}/` | `hyp-{id}_{name}.md` |
| Experiment | `70_Experiments/` | `exp-{id}_{name}.md` |

**참고**: Program은 `_PROGRAM.md`, Project는 `project.md`로 구분됨

---

## 4. 파일명 규칙 (강제 조항)

### 4.1 Project SSOT 파일명 (전 Vault 통일)

**강제 규칙**:
```yaml
Project 정의 파일명: project.md (public/exec 동일)
```

**적용 범위**:
- `public/50_Projects/**/**/project.md`
- `exec/50_Projects/**/**/project.md`

**과거 파일명 (read-only legacy)**:
- `Project_정의.md` - 마이그레이션 완료 전까지 읽기 전용
- `_INDEX.md` - 인덱스/요약(derived) 용도로만 사용, **검증/SSOT 대상 아님**

**새 프로젝트 생성 규칙**:
- 모든 생성기(`loop-entity-creator`, `/new-project`)는 **`project.md`만 생성**
- `Project_정의.md` 생성 절대 금지

**API/Validator 가정**:
- `validate_schema.py`: `project.md`만 스캔
- `api/routers/projects.py`: `project.md`만 읽기/쓰기
- `build_graph_index.py`: `project.md`만 파싱

**마이그레이션 계획**:
- [x] public vault: `Project_정의.md` → `project.md` (tsk-022-18) ✅ 2026-01-07
- [x] exec vault: `Project_정의.md` → `project.md` ✅ 2026-01-07
- [x] API 코드 업데이트: `Project_정의.md` 참조 제거 ✅ 2026-01-07
- [x] 문서 업데이트: CLAUDE.md, TEAM_GUIDE 등 ✅ 2026-01-07

### 4.2 Task SSOT 파일명 (통일 권장)

**권장 규칙**:
```yaml
Task 정의 파일명: tsk-{id}.md
예: tsk-001-01.md, tsk-022-18.md
```

**현재 상태**: Tasks 폴더 안에 다양한 이름 혼재
- `tsk-001-01.md` ✅
- `Episode_엔티티_검증.md` ⚠️ (파일명에 내용 포함)
- `작업명.md` ⚠️ (ID 없음)

**통일 이점**:
- API가 파일명으로 Task ID 추론 가능
- 검색/색인 단순화
- 파일명 충돌 방지

### 4.3 _INDEX.md 파일의 위상

**_INDEX.md는 SSOT가 아니다**

```yaml
# _INDEX.md 규칙 (강제)
1. 용도: 인덱스/요약/네비게이션 (Derived)
2. 검증 제외: validate_schema.py에서 스캔하지 않음
3. SSOT 금지: 엔티티 정의를 _INDEX.md에 저장하지 않음
4. 참조: schema_constants.yaml → paths.exclude_files
```

**올바른 사용**:
- 폴더 구조 설명
- 하위 엔티티 요약 목록
- 네비게이션 링크

**잘못된 사용**:
- ❌ Project 정의를 `_INDEX.md`에 저장
- ❌ `_INDEX.md`를 SSOT로 참조
- ❌ API가 `_INDEX.md`를 읽어서 엔티티 파싱

---

## 5. exec/public 분리 규칙 (권한 강제)

### 5.1 Vault 구분

| 구분 | 경로 | 접근 권한 | 민감정보 |
|------|------|----------|---------|
| **public** | `~/dev/loop/public/` | Team + C-Level | 공개 정보만 |
| **exec** | `~/dev/loop/exec/` | **C-Level only** | 급여, 계약, 런웨이, 투자 |

### 5.2 권한 강제 규칙

**exec vault 경로는 read 권한을 C-Level로 제한 (강제)**

```yaml
# exec vault 접근 제어 (기술 구현 필수)
read: C-Level only (파일시스템 권한 or API scope)
write: C-Level + 승인된 경로 (예: PR approval or 특정 관리자)
```

**구현 방법** (Firestore / 파일시스템 동일):
1. OAuth scope: `mcp:exec` (C-Level 전용)
2. API middleware: `check_scope("mcp:exec")`
3. 파일시스템: exec vault를 별도 clone, 권한 분리

**위반 시**: 민감 정보 노출 위험

### 5.3 ID 규칙 (충돌 방지)

**출처**: `schema_constants.yaml` → `cross_vault.exec_id_patterns`

| 패턴 | 예시 | 사용처 | 용도 |
|------|------|--------|------|
| `prj-NNN` | `prj-001` | public only | 일반 프로젝트 |
| `tsk-NNN-NN` | `tsk-001-01` | public only | 일반 태스크 |
| `prj-exec-NNN` | `prj-exec-001` | exec only | 민감 단독 프로젝트 |
| `tsk-exec-NNN` | `tsk-exec-001` | exec only | 민감 단독 태스크 |
| `prj-{pgm}-{round}` | `prj-tips-primer` | exec only | Program Round |

**금지 패턴** (exec vault):
- ❌ `prj-NNN` (public과 충돌)
- ❌ `tsk-NNN-NN` (public과 충돌)

---

## 6. 쓰기 경로 (UI/API Write 규칙 - 강제 조항)

### 6.1 원칙

**UI/API를 통한 수정은 SSOT frontmatter를 변경하되, 반드시 audit log + Git 반영이 따라야 한다**

### 6.2 강제 요구사항

**최소 요구사항** (반드시 구현):
```yaml
1. Append-only 기록: _build/run_log/*.json 또는 decision_log.jsonl
2. 변경 주체 기록: user_id, timestamp, modified_fields
3. 변경 전/후 값: old_value, new_value
```

**이상적 요구사항** (권장):
```yaml
1. 서버가 변경 사항을 commit(PR)로 생성
2. 또는 "커밋 대기 큐"를 운영 (나중에 일괄 커밋)
3. 승인 워크플로: Pending Review → Approve → Git commit
```

### 6.3 수정 가능 필드 (SSOT Write Target)

**UI/API가 수정할 수 있는 frontmatter 필드**:

| 엔티티 | 수정 가능 필드 | 예시 |
|--------|---------------|------|
| Task | `status`, `assignee`, `due`, `priority` | 태스크 진행 상태 변경 |
| Project | `status`, `owner`, `expected_impact`, `realized_impact` | 프로젝트 완료 처리 |
| Hypothesis | `evidence_status`, `confidence` | 가설 검증 진행 |

**수정 금지 필드** (생성 후 변경 불가):
- `entity_id`: 생성 후 절대 변경 금지
- `created`: 생성 시점 고정
- `parent_id`: 계층 변경은 별도 프로세스 필요

### 6.4 수정 방법

**방법 1: Claude Code 스킬/명령어**
```bash
/loop-entity-creator edit
"tsk-001-02 상태를 in_progress로 변경"
```
→ 자동으로 frontmatter 수정 + git commit

**방법 2: 직접 수정 후 commit**
```bash
# 1. Frontmatter 수정
vim 50_Projects/P001_Ontology/Tasks/tsk-001-02.md

# 2. Validation
python3 scripts/validate_schema.py public/

# 3. Git commit
git add .
git commit -m "Update task status"
```

**방법 3: API를 통한 수정 (추후 구현)**
```bash
POST /api/tasks/tsk-001-02
{
  "status": "in_progress",
  "assignee": "김코치"
}
```
→ 서버가 frontmatter 수정 + audit log 기록 + (선택) PR 생성

### 6.5 위반 시 문제점

**NAS/UI 수정이 Git 반영 없이 이루어지면**:
1. 로컬 sync에 의해 변경 사항이 덮여쓰임
2. "SSOT가 깨졌다"는 혼란 반복
3. 변경 이력이 사라져 감사(audit) 불가능

**해결**:
- 모든 수정은 Git commit으로 귀결
- MacBook ↔ NAS sync는 Git pull/push로만 동기화
- UI 수정 시 서버가 자동으로 commit 생성

---

## 7. 빌드/동기화 규칙

### 7.1 Pre-commit Hook 실행 순서

**출처**: `00_Meta/build_config.md`

| 순서 | 스크립트 | 동작 | 차단 |
|------|---------|------|------|
| 1 | `validate_schema.py` | 스키마 검증 | ERROR 시 차단 |
| 2 | `check_frontmatter_body_sync.py` | frontmatter↔body 동기화 | ERROR 시 차단 |
| 3 | `check_orphans.py` | 고아 엔티티 검사 | 경고만 (차단 안 함) |
| 4 | `build_graph_index.py` | `_Graph_Index.md` 재생성 | 자동 스테이징 |
| 5 | `build_archive_catalog.py` | 아카이브 카탈로그 재생성 | 자동 스테이징 |

### 7.2 수동 빌드 명령어

```bash
# 전체 검증
python3 scripts/validate_schema.py public/

# 그래프 인덱스 재생성
python3 scripts/build_graph_index.py public/

# Impact 계산
python3 scripts/build_impact.py public/

# 아카이브 카탈로그 재생성
python3 scripts/build_archive_catalog.py public/
```

---

## 8. 금지 규칙 요약

### 8.1 절대 금지 (시스템 전체)

| 금지 사항 | 이유 |
|----------|------|
| Derived 파일 수동 수정 | SSOT 불일치 발생 |
| `entity_id` 변경 | 참조 무결성 파괴 |
| `validated_by`, `realized_sum` 직접 저장 | Derived 필드 (계산 필요) |
| exec vault에서 `prj-NNN`, `tsk-NNN-NN` 사용 | public과 ID 충돌 |
| `_INDEX.md`를 SSOT로 사용 | 검증 제외 대상 |
| `Project_정의.md` 신규 생성 | Legacy 파일명 (마이그레이션 중) |

### 8.2 강제 요구사항

| 강제 사항 | 조건 |
|----------|------|
| 모든 SSOT 변경은 Git commit 필수 | 예외 없음 |
| Derived 생성은 오직 스크립트만 | API/UI 쓰기 금지 |
| Project 정의 파일명은 `project.md` | public/exec 동일 |
| exec vault 접근은 C-Level만 | OAuth scope 검증 |
| UI/API 수정은 audit log 필수 | append-only 기록 |

---

## 9. 마이그레이션 규칙 (Legacy 처리)

### 9.1 Legacy 파일명 처리

**대상**:
- `Project_정의.md` (public/exec)
- `_INDEX.md` (일부 프로젝트)

**규칙**:
```yaml
# Legacy 기간 중 (마이그레이션 완료 전)
read: 허용 (하위 호환성)
write: 금지 (신규 생성 불가)
validate: 제외 (검증 대상 아님)
```

**마이그레이션 절차**:
1. `Project_정의.md` → `project.md` 파일명 변경
2. API/스크립트에서 `Project_정의.md` 참조 제거
3. `validate_schema.py`에서 legacy 경고 추가
4. 일정 기간(예: 3개월) 후 legacy 파일 삭제

### 9.2 exec vault 마이그레이션

**현재 상태**:
- `project.md`: 3개
- `Project_정의.md`: 4개

**목표**:
- 전체 `project.md`로 통일

**실행**:
```bash
# exec vault 이동
cd ~/dev/loop/exec

# 파일명 변경
find 50_Projects -name "Project_정의.md" -exec bash -c 'mv "$0" "${0%/*}/project.md"' {} \;

# Git commit
git add .
git commit -m "Migrate: Project_정의.md → project.md"
```

---

## 10. 참고 문서

- [[LOOP_PHILOSOPHY]] - SSOT + Derived 철학
- [[schema_constants.yaml]] - 스키마 정의 SSOT
- [[build_config]] - 빌드 자동화 규칙
- [[relation_types]] - 관계 타입 정의
- [[CLAUDE.md]] - Vault 운영 가이드

---

**Version**: 1.0
**Last Updated**: 2026-01-07
**Status**: Active (모든 코드/API/UI가 준수해야 함)

**변경 이력**:
- v1.0 (2026-01-07): 초안 작성 - SSOT 계약 강제 조항 정의
