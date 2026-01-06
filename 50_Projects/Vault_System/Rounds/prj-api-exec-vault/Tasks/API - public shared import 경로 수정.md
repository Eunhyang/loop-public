---
entity_type: Task
entity_id: "tsk-018-05"
entity_name: "API - public shared import 경로 수정"
created: 2026-01-06
updated: 2026-01-06
status: doing

# === 계층 ===
parent_id: "prj-api-exec-vault"
project_id: "prj-api-exec-vault"
aliases: ["tsk-018-05"]

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
tags: ["api", "refactoring", "shared"]
priority_flag: high
---

# API - public shared import 경로 수정

> Task ID: `tsk-018-05` | Project: `prj-api-exec-vault` | Status: doing

## 목표

**완료 조건**:
1. public/api가 shared/ 모듈을 import하도록 수정
2. 기존 코드 호환성 유지
3. 중복 코드 제거

---

## 상세 내용

### 배경

tsk-018-03에서 public/shared/ 모듈을 생성했으나,
public/api는 아직 기존 경로 (api/utils/, api/oauth/) 사용 중.

### 작업 내용

1. public/api/main.py에서 shared/ import
2. 기존 utils/vault_utils.py → shared/utils/vault_utils.py 참조
3. 기존 oauth/security.py 일부 → shared/auth/ 참조
4. 중복 코드 정리 (기존 파일은 shared로 redirect)

---

## 체크리스트

- [ ] public/api/main.py import 경로 수정
- [ ] 기존 utils/ → shared/utils/ 마이그레이션
- [ ] 기존 oauth/ 일부 → shared/auth/ 마이그레이션
- [ ] 기존 코드 호환성 테스트
- [ ] 서버 시작 테스트

---

## Notes

### PRD (Product Requirements Document)


### 작업 로그


---

## 참고 문서

- [[prj-api-exec-vault]] - 소속 Project
- [[tsk-018-03]] - 선행 작업 (shared/ 모듈)

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
