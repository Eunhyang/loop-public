---
entity_type: Task
entity_id: "tsk-n8n-14"
entity_name: "Impact Model - SSOT 구조 개선"
created: 2026-01-03
updated: 2026-01-03
status: doing

# === 계층 ===
parent_id: "prj-n8n"
project_id: "prj-n8n"
aliases: ["tsk-n8n-14"]

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
target_project: loop-api

# === 분류 ===
tags: [ssot, impact-model, refactoring]
priority_flag: high
---

# Impact Model - SSOT 구조 개선

> Task ID: `tsk-n8n-14` | Project: `prj-n8n` | Status: doing

## 목표

**완료 조건**:
1. `impact_model_config.yml`이 유일한 SSOT로 동작
2. 중복 판단 기준 제거 (프롬프트, n8n JavaScript 등)
3. API 엔드포인트로 yml 내용 노출

---

## 상세 내용

### 배경

현재 Impact A/B Score 판단 기준이 여러 곳에 분산/중복:
- `impact_model_config.yml` (SSOT라고 하지만...)
- `api/prompts/expected_impact.py` (하드코딩)
- `api/prompts/realized_impact.py` (하드코딩)
- `.claude/skills/auto-fill-project-impact/references/impact_fields.md` (복사본)
- n8n 워크플로우 JavaScript (하드코딩)

yml 수정해도 프롬프트/n8n에 반영 안 됨.

### 작업 내용

1. `/api/config/impact-model` 엔드포인트 추가
2. `prompts/*.py` → yml 동적 로드로 변경
3. `impact_fields.md` 삭제
4. n8n 워크플로우 → API fetch로 변경

---

## 체크리스트

- [ ] `/api/config/impact-model` 엔드포인트 구현
- [ ] `expected_impact.py` yml 동적 로드
- [ ] `realized_impact.py` yml 동적 로드
- [ ] `impact_fields.md` 삭제
- [ ] n8n 워크플로우 수정 (하드코딩 → API fetch)
- [ ] CLAUDE.md 업데이트

---

## Notes

### Todo
- [ ]
- [ ]
- [ ]

### 작업 로그


---

## 참고 문서

- [[prj-n8n]] - 소속 Project
- `impact_model_config.yml` - SSOT
- `api/utils/impact_calculator.py` - 이미 yml 로드 구현됨

---

**Created**: 2026-01-03
**Assignee**: 김은향
**Due**: 2026-01-03
