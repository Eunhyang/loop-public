---
entity_type: Task
entity_id: tsk-018-01
entity_name: API - VaultCache exec vault 프로젝트 로드
created: 2026-01-02
updated: 2026-01-03
closed: 2026-01-03

# === 연결 ===
project_id: prj-api-exec-vault
parent_id: null

# === 실행 ===
assignee: 김은향
status: done
priority_flag: high

# === 일정 ===
start_date: 2026-01-02
due: 2026-01-02

# === Dev Task 정보 ===
type: dev
target_project: loop-api

# === 메타 ===
aliases:
  - tsk-018-01
tags: ["task", "api", "vault-cache", "exec-vault"]
---

# API - VaultCache exec vault 프로젝트 로드

> Task ID: `tsk-018-01` | Project: [[prj-api-exec-vault]] | Status: done

## 목표

VaultCache가 exec vault의 프로젝트도 로드하여 대시보드에서 채용 프로그램 등의 하위 프로젝트가 표시되도록 개선.

## 배경

- exec vault (`~/dev/loop/exec/50_Projects/`)의 프로젝트가 API 캐시에 로드되지 않음
- `P016_다온_영상편집자` (prj-exec-001)가 Hiring 프로그램 하위로 보이지 않음
- VaultCache가 public vault만 스캔하기 때문

## 작업 내용

- [x] `vault_cache.py`에서 exec vault 경로 추가
- [x] `_load_projects()`에서 exec vault 프로젝트 로드
- [x] exec vault Task 로드 기능 추가
- [x] 민감 정보 필터링 로직 추가 (계약 단가 등 숨김)
- [x] 캐시 새로고침 시 exec vault 데이터 유지 버그 수정
- [x] API 테스트
- [x] 대시보드에서 확인

## 기술 상세

**변경 대상**: `api/cache/vault_cache.py`

**현재 구조**:
```python
self.vault_path = vault_path  # public vault only
self.projects_dir = vault_path / "50_Projects" / "2025"
```

**변경 방향**:
```python
# exec vault 경로 추가
self.exec_vault_path = get_exec_vault_dir()
self.exec_projects_dir = self.exec_vault_path / "50_Projects"

# _load_projects()에서 exec vault도 스캔
```

**민감 정보 필터링**:
- `contract.rate`, `contract.terms` 등은 API 응답에서 제외
- `vault: exec` 마커로 exec 프로젝트 식별

## Notes

### PRD (Product Requirements Document)

VaultCache가 exec vault의 프로젝트와 Task를 로드하여 대시보드에서 표시되도록 개선.

**요구사항**:
1. exec vault (`~/dev/loop/exec/50_Projects/`)의 프로젝트 로드
2. exec vault의 Task도 함께 로드 (칸반보드 표시용)
3. 민감 정보 필터링 (contract, salary, rate, terms, contact 제외)
4. 캐시 새로고침 시 exec vault 데이터 유지

---

### 작업 로그

#### 2026-01-02 ~ 2026-01-03
**개요**: VaultCache에 exec vault 프로젝트/Task 로드 기능 구현. 캐시 새로고침 시 데이터 사라지는 버그 수정.

**변경사항**:
- `api/cache/vault_cache.py`:
  - `_load_exec_projects()` 메서드 추가 (exec vault 프로젝트 + Task 로드)
  - `_load_exec_task_file()` 메서드 추가 (단일 exec Task 로드, 민감 정보 필터링)
  - `get_projects_by_program_id()` 메서드 추가 (program_id로 프로젝트 조회)
  - `get_all_tasks()` 캐시 새로고침 시 `_load_exec_projects()` 호출 추가 (버그 수정)
  - `EXEC_SENSITIVE_FIELDS` 상수 정의 (필터링할 민감 필드 목록)

- `api/routers/mcp_composite.py`:
  - `get_program_rounds()`가 VaultCache 사용하도록 변경
  - `_normalize_date()` 함수로 date → string 변환 (Pydantic 검증 오류 수정)

- `_dashboard/js/api.js`:
  - `getProgramRounds()` API 경로 수정 (`/api/admin/...` → `/api/mcp/admin/...`)

- Docker:
  - exec vault 볼륨 마운트 `:ro` → `:rw`로 변경 (admin 수정 권한)

**핵심 수정 (캐시 새로고침 버그)**:
```python
# get_all_tasks()에서 캐시 새로고침 시 exec vault도 다시 로드
if reload_needed:
    self.tasks.clear()
    self._task_count = 0
    self._load_tasks()
    self._load_exec_projects()  # exec vault project + task 함께 로드
```

**결과**:
- 채용 칸반보드에서 exec vault 프로젝트/Task 표시 확인
- exec vault Task 수정 가능 (admin 권한)
- 캐시 새로고침 후에도 exec vault 데이터 유지

---

**Created**: 2026-01-02
**Assignee**: 김은향
