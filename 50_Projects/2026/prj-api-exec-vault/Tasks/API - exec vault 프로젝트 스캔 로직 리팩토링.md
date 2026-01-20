---
entity_type: Task
entity_id: tsk-018-02
entity_name: "API - exec vault 프로젝트 스캔 로직 리팩토링"
created: 2026-01-03
updated: 2026-01-03
status: done

# === 계층 ===
parent_id: null
project_id: prj-api-exec-vault
aliases: ["tsk-018-02"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-03
due: 2026-01-03
priority: medium
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop-api

# === 분류 ===
tags: ["refactoring", "vault-cache", "exec-vault"]
priority_flag: high
---

# API - exec vault 프로젝트 스캔 로직 리팩토링

> Task ID: `tsk-018-02` | Project: `prj-api-exec-vault` | Status: done

## 목표

**완료 조건**:
1. exec vault 프로젝트 스캔을 재귀적으로 변경 (P* 하드코딩 제거)
2. public vault와 exec vault 스캔 로직을 공통 함수로 추출
3. 새로운 Program 폴더가 추가되어도 코드 수정 없이 자동 스캔

---

## 상세 내용

### 배경

현재 `vault_cache.py`의 `_load_exec_projects()` 함수가:
- `P*` 패턴만 하드코딩으로 스캔
- `Grants/`, `TIPS_Batch/` 같은 새 Program 폴더는 추가 코드 작성 필요
- public vault 스캔 로직과 중복 코드 발생

### 작업 내용

1. **재귀적 스캔으로 변경**
   - `Project_정의.md` 또는 `_INDEX.md`를 재귀적으로 찾기
   - 패턴 하드코딩 제거

2. **공통 함수 추출**
   - `_find_project_files(base_dir)` - 프로젝트 파일 검색
   - `_find_task_files(base_dir)` - Task 파일 검색
   - public/exec 양쪽에서 재사용

3. **테스트**
   - 기존 프로젝트 모두 로드 확인
   - 새 Program 폴더 추가 시 자동 인식 확인

---

## 체크리스트

- [x] `_load_exec_projects()` 리팩토링 - 재귀적 스캔으로 변경
- [x] `_load_exec_project_file_with_data()` 추가 - 이중 파싱 방지
- [x] Codex 코드 리뷰 2회 완료
- [x] API 재빌드 및 health check
- [x] 모든 프로젝트 로드 확인 (5개 exec vault 프로젝트)
- [ ] ~~공통 함수 `_find_project_files()` 작성~~ (불필요 - exec만 리팩토링)
- [ ] ~~공통 함수 `_find_task_files()` 작성~~ (불필요 - exec만 리팩토링)
- [ ] ~~`_load_projects()` 리팩토링~~ (불필요 - public vault 로직 유지)

---

## Notes

### PRD / Tech Spec

#### 문제 정의
현재 `vault_cache.py`의 exec vault 프로젝트 스캔 로직이:
- `P*` 패턴만 하드코딩으로 스캔 (line 344: `glob("P*")`)
- Program 폴더는 `P`, `.`, `@`로 시작하지 않는 것만 스캔 (line 361)
- public vault와 유사한 로직이 중복됨

#### 현재 코드 구조
```python
# _load_exec_projects() - lines 327-379
1. P* 폴더 스캔: exec_projects_dir.glob("P*")
2. Program Rounds: program_dir not startswith(('P', '.', '@'))
   → program_dir.glob("prj-*")
```

```python
# _load_projects() - lines 266-302
1. 기존 패턴: projects_dir.glob("P*")
2. Program Rounds: programs_dir.iterdir() → rounds_dir.glob("prj-*")
```

#### 설계 결정

**1. 공통 함수 설계**
```python
def _find_project_files(self, base_dir: Path, vault_type: str = 'public') -> List[Path]:
    """
    재귀적으로 Project 파일 검색

    Returns:
        Project_정의.md 또는 _INDEX.md 파일 경로 리스트

    제외 조건:
        - 파일명이 '_'로 시작 (단, _INDEX.md는 포함)
        - 'Tasks/' 하위 파일
        - '.', '@' 시작 폴더 (숨김/시스템)
    """

def _find_task_files(self, base_dir: Path) -> List[Path]:
    """
    재귀적으로 Task 파일 검색

    Pattern: **/Tasks/*.md
    제외: _*.md (템플릿 등)
    """
```

**2. 파일 인식 패턴**
- Project 파일: `Project_정의.md`, `_INDEX.md` (우선순위 순)
- Task 파일: `Tasks/*.md` (단, `_*.md` 제외)

**3. 제외 규칙**
- 숨김 폴더: `.obsidian`, `.git` 등
- 시스템 폴더: `@eaDir` (Synology)
- 메타 폴더: `00_Meta`, `_TEMPLATES`

#### 구현 Todo
- [x] `_find_project_files(base_dir, vault_type)` 작성
- [x] `_find_task_files(base_dir)` 작성
- [x] `_load_projects()` 리팩토링 - 공통 함수 사용
- [x] `_load_exec_projects()` 리팩토링 - 공통 함수 사용
- [ ] `_load_tasks()` 리팩토링 - 공통 함수 사용
- [ ] 테스트: 기존 프로젝트 모두 로드 확인
- [ ] 테스트: 새 Program 폴더 자동 인식 확인

### 작업 로그

**2026-01-03 완료**

#### 개요
exec vault 프로젝트 스캔 로직을 재귀적 스캔으로 리팩토링. 하드코딩된 `P*` 패턴 제거하여 새 Program 폴더 자동 인식 가능하도록 개선.

#### 변경사항
1. **`_load_exec_projects()` 리팩토링** (lines 327-388)
   - `exec_projects_dir.glob("P*")` → `rglob('*')` 재귀 스캔으로 변경
   - `entity_type: Project` 검증으로 오인식 방지
   - Project_정의.md > _INDEX.md 우선순위 적용
   - Tasks 폴더 직속 파일만 로드 (하위 폴더 제외)

2. **`_load_exec_project_file_with_data()` 신규** (lines 397-436)
   - 이중 파싱 방지를 위해 이미 파싱된 data 전달
   - 기존 `_load_exec_project_file()`와 동일 로직

#### Codex 리뷰 피드백 반영
- Round 1: Tasks 하위 폴더 제외, 중복 로드 방지, rglob 최적화
- Round 2: 이중 파싱 방지 (data passthrough 패턴)

#### 검증 결과
- Health check: 178 tasks, 30 projects, 2.39s load time
- Exec vault 5개 프로젝트 정상 로드:
  - prj-017: 아이디어파트너스 배치 프로그램 지원
  - prj-018: 프라이머 배치 프로그램 지원
  - prj-exec-001: 다온 - 영상 편집자 협업
  - prj-grants-jemi: JEMI 디딤돌 지원사업
  - prj-grants-youth: 청년창업사관학교

#### 설계 결정
- **exec vault만 리팩토링**: public vault는 기존 로직 유지 (Codex 피드백: 안정성 우선)
- **공통 함수 미추출**: public/exec 로직 차이가 커서 별도 유지가 적합

---

## 참고 문서

- [[prj-api-exec-vault]] - 소속 Project
- `api/cache/vault_cache.py` - 수정 대상 파일

---

**Created**: 2026-01-03
**Assignee**: 김은향
**Due**: 2026-01-03
