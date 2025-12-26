---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-09"
entity_name: "loop-entity-creator 문서 수정"
created: 2025-12-27
updated: 2025-12-27
status: done
closed: '2025-12-27'

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-09"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
due: null
priority: low
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-e"]

# === 분류 ===
tags: ["schema", "documentation", "skill"]
priority_flag: low
---

# loop-entity-creator 문서 수정

> Task ID: `tsk-dashboard-ux-v1-09` | Project: `prj-dashboard-ux-v1` | Status: todo

## 목표

**완료 조건**:
1. `loop-entity-creator` 스킬 문서에서 하드코딩된 상수 값 제거
2. `schema_constants.yaml` 참조 안내 추가

---

## 상세 내용

### 배경

`loop-entity-creator` 스킬 문서(SKILL.md)에 다음 값들이 하드코딩되어 있음:
- status 유효값 (todo, doing, done, blocked)
- type 유효값 (dev, strategy, research, ops)
- target_project 유효값 (sosi, kkokkkok, loop-api)
- assignee 유효값 (김은향, 한명학, 임단, 미정)

이를 `schema_constants.yaml` 참조로 변경하여 Single Source of Truth 유지.

### 작업 내용

**변경 대상:**
- `~/.claude/skills/loop-entity-creator/SKILL.md`

**변경 내용:**
- 하드코딩된 값 목록 → "schema_constants.yaml 참조" 안내로 변경
- 구체적인 값은 YAML 파일 경로만 명시

---

## 체크리스트

- [x] SKILL.md 파일 읽기
- [x] 하드코딩된 status 값 → YAML 참조로 변경
- [x] 하드코딩된 type 값 → YAML 참조로 변경
- [x] 하드코딩된 target_project 값 → YAML 참조로 변경
- [x] 하드코딩된 assignee 값 → members.yaml 참조 유지
- [x] YAML 참조 방법 안내 추가

---

## Notes

### Tech Spec
- **파일**: `~/.claude/skills/loop-entity-creator/SKILL.md`
- **참조**: `00_Meta/schema_constants.yaml`
- **유지**: `00_Meta/members.yaml` (assignee용)
- **우선순위**: 낮음 (문서만 변경, 동작에 영향 없음)

### Todo
- [ ] SKILL.md 읽기
- [ ] status/type/target_project 하드코딩 찾기
- [ ] YAML 참조 문구로 교체
- [ ] 문서 일관성 확인

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)
-->


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[tsk-dashboard-ux-v1-05]] - 선행 Task (YAML 확장)
- [[00_Meta/schema_constants.yaml]] - Single Source of Truth

---

**Created**: 2025-12-27
**Assignee**: 김은향
**Due**:
