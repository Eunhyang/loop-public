---
entity_type: Task
entity_id: "tsk-mcp-rbac-01"
entity_name: "User 모델 role 필드 + CLI"
created: 2025-12-26
updated: 2025-12-26
status: done

closed: 2025-12-26
# === 계층 ===
parent_id: "prj-mcp-dual-vault-rbac"
project_id: "prj-mcp-dual-vault-rbac"
program_id: "pgm-vault-system"
aliases: ["tsk-mcp-rbac-01"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
type: dev
assignee: "김은향"
priority: high
due: null
estimate: null
target_project: "loop"

# === 3Y 전략 연결 ===
conditions_3y: ["cond-b"]

# === 분류 ===
tags: ["oauth", "rbac", "user-model", "cli"]
priority_flag: high
---

# User 모델 role 필드 + CLI

> Task ID: `tsk-mcp-rbac-01` | Project: `prj-mcp-dual-vault-rbac` | Status: in_progress

---

## 목표

User 모델에 role 필드를 추가하고 CLI에서 role 관리 가능하도록 구현

---

## 작업 항목

### RBAC-001: User 모델에 role 필드 추가
- [ ] `api/oauth/models.py`에 `role = Column(String, default="member")` 추가
- [ ] 기존 DB 마이그레이션 (ALTER TABLE)

### RBAC-002: CLI에 role 관련 명령어 추가
- [ ] `create-user --role` 옵션 추가
- [ ] `set-role` 명령어 추가
- [ ] `list-users`에 role 표시

---

## 관련 파일

- `api/oauth/models.py` - User 모델
- `api/oauth/cli.py` - CLI 스크립트

---

## 완료 조건

1. `role` 필드가 DB에 존재
2. CLI로 role 지정하여 사용자 생성 가능
3. CLI로 기존 사용자 role 변경 가능

---

**Created**: 2025-12-26
**Assignee**: 김은향
