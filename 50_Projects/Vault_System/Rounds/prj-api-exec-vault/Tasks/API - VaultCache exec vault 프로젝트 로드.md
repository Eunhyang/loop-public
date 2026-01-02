---
entity_type: Task
entity_id: tsk-018-01
entity_name: API - VaultCache exec vault 프로젝트 로드
created: 2026-01-02
updated: 2026-01-02

# === 연결 ===
project_id: prj-api-exec-vault
parent_id: null

# === 실행 ===
assignee: 김은향
status: doing
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

> Task ID: `tsk-018-01` | Project: [[prj-api-exec-vault]] | Status: doing

## 목표

VaultCache가 exec vault의 프로젝트도 로드하여 대시보드에서 채용 프로그램 등의 하위 프로젝트가 표시되도록 개선.

## 배경

- exec vault (`~/dev/loop/exec/50_Projects/`)의 프로젝트가 API 캐시에 로드되지 않음
- `P016_다온_영상편집자` (prj-exec-001)가 Hiring 프로그램 하위로 보이지 않음
- VaultCache가 public vault만 스캔하기 때문

## 작업 내용

- [ ] `vault_cache.py`에서 exec vault 경로 추가
- [ ] `_load_projects()`에서 exec vault 프로젝트 로드
- [ ] 민감 정보 필터링 로직 추가 (계약 단가 등 숨김)
- [ ] API 테스트
- [ ] 대시보드에서 확인

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

(Step 4에서 생성 예정)

---

**Created**: 2026-01-02
**Assignee**: 김은향
