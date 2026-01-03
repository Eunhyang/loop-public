---
entity_type: Task
entity_id: "tsk-017-13"
entity_name: "Dual-Vault - exec_rounds_path 자동 라우팅"
created: 2026-01-03
updated: 2026-01-03
status: doing

# === 계층 ===
parent_id: "prj-019"
project_id: "prj-019"
aliases: ["tsk-017-13"]

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
tags: ["skill", "dual-vault", "exec", "entity-creator"]
priority_flag: high
---

# Dual-Vault - exec_rounds_path 자동 라우팅

> Task ID: `tsk-017-13` | Project: `prj-019` | Status: doing

## 목표

**완료 조건**:
1. loop-entity-creator 스킬에서 Program의 `exec_rounds_path` 설정 확인 로직 추가
2. Project 생성 시: program_id가 있으면 해당 Program의 exec_rounds_path 확인
   - exec_rounds_path가 설정되어 있으면 → exec/50_Projects/에 생성
   - null이면 → public/50_Projects/에 생성
3. Task 생성 시: 부모 Project의 vault 확인
   - Project가 exec에 있으면 → Task도 exec에 생성
4. /new-project, /new-task 명령어로 테스트 성공

---

## 상세 내용

### 배경

현재 loop-entity-creator 스킬은 "민감 정보 여부"를 사용자에게 직접 질문하여 vault를 결정합니다.
하지만 Program에 `exec_rounds_path` 필드가 있어, 이 설정에 따라 자동으로 exec vault에 생성되어야 합니다.

**현재 동작:**
- 사용자에게 "민감 정보 포함?" 직접 질문
- Program의 exec_rounds_path 무시

**기대 동작:**
- program_id가 있으면 Program 파일 읽기
- exec_rounds_path가 설정되어 있으면 자동으로 exec vault에 생성
- Task는 부모 Project의 vault를 따름

### 작업 내용

1. **스킬 문서 수정**: `loop-entity-creator/SKILL.md`
   - "Vault Selection" 섹션에 Program exec_rounds_path 확인 로직 추가
   - Task 생성 시 부모 Project vault 확인 로직 추가

2. **워크플로우 변경**:
   ```
   Project 생성 시:
   1. program_id 있음?
      ├── YES → Program 파일 읽기
      │   └── exec_rounds_path != null?
      │       ├── YES → vault: exec
      │       └── NO → vault: public
      └── NO → 기존 로직 (사용자 질문)

   Task 생성 시:
   1. project_id로 Project 파일 찾기
   2. Project 경로가 exec/?
      ├── YES → Task도 exec에 생성
      └── NO → Task도 public에 생성
   ```

---

## 체크리스트

- [ ] SKILL.md "Vault Selection" 섹션 수정
- [ ] Program exec_rounds_path 확인 로직 추가
- [ ] Task 생성 시 부모 Project vault 확인 로직 추가
- [ ] 테스트: exec_rounds_path가 설정된 Program 하위 Project 생성
- [ ] 테스트: exec Project 하위 Task 생성

---

## Notes

### Todo
- [ ] SKILL.md 읽기
- [ ] Vault Selection 섹션 수정
- [ ] Creating a Project 섹션에 Program 확인 로직 추가
- [ ] Creating a Task 섹션에 Project vault 확인 로직 추가
- [ ] 예시 추가

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)
-->


---

## 참고 문서

- [[prj-019]] - 소속 Project (Dual-Vault - 정비)
- `~/.claude/skills/loop-entity-creator/SKILL.md` - 수정 대상 스킬

---

**Created**: 2026-01-03
**Assignee**: 김은향
**Due**: 2026-01-03
