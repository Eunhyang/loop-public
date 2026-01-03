---
entity_type: Task
entity_id: tsk-018-02
entity_name: "API - exec vault 프로젝트 스캔 로직 리팩토링"
created: 2026-01-03
updated: 2026-01-03
status: doing

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

> Task ID: `tsk-018-02` | Project: `prj-api-exec-vault` | Status: doing

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

- [ ] 공통 함수 `_find_project_files()` 작성
- [ ] 공통 함수 `_find_task_files()` 작성
- [ ] `_load_exec_projects()` 리팩토링
- [ ] `_load_projects()` 리팩토링 (public vault)
- [ ] API 재빌드 및 health check
- [ ] 모든 프로젝트 로드 확인

---

## Notes

### PRD
(prompt-enhancer에서 생성 예정)

### 작업 로그


---

## 참고 문서

- [[prj-api-exec-vault]] - 소속 Project
- `api/cache/vault_cache.py` - 수정 대상 파일

---

**Created**: 2026-01-03
**Assignee**: 김은향
**Due**: 2026-01-03
