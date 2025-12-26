---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-15"
entity_name: "Schema 상수 하드코딩 제거 및 일원화 강제"
created: 2025-12-27
updated: 2025-12-27
status: doing

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-15"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2025-12-27
due: 2025-12-27
priority: medium
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-e"]

# === 분류 ===
tags: [schema, refactor, ssot]
priority_flag: high
---

# Schema 상수 하드코딩 제거 및 일원화 강제

> Task ID: `tsk-dashboard-ux-v1-15` | Project: `prj-dashboard-ux-v1` | Status: doing

## 목표

**완료 조건**:
1. hypotheses.py, entities.py 등 API 코드에서 하드코딩된 상수값 제거
2. state.js의 분산된 Fallback 값을 단일 객체로 중앙화
3. Pre-commit hook에 하드코딩 패턴 검출 추가

---

## 상세 내용

### 배경

현재 `00_Meta/schema_constants.yaml`이 Single Source of Truth로 지정되어 있지만,
일부 파일에서 여전히 상수값이 하드코딩되어 있어 스키마 변경 시 불일치 발생 가능.

### 작업 내용

**1. 하드코딩 즉시 수정**
- `api/routers/hypotheses.py:136` - `valid_statuses` 리스트 → constants 참조
- `api/models/entities.py` - description의 상태값 나열 → 동적 또는 제거

**2. Dashboard Fallback 중앙화**
- `_dashboard/js/state.js` 상단에 `FALLBACK_CONSTANTS` 단일 객체 정의
- 분산된 Fallback 값들(라인 168-438)을 중앙 객체 참조로 변경

**3. Pre-commit Hook 추가**
- `.git/hooks/pre-commit`에 하드코딩 패턴 검출 로직 추가
- 검출 패턴: `'todo'.*'doing'.*'done'`, `'planning'.*'active'` 등

---

## 체크리스트

- [x] hypotheses.py 하드코딩 제거
- [x] entities.py 하드코딩 제거
- [x] state.js Fallback 중앙화
- [x] Pre-commit hook 하드코딩 검출 추가
- [x] 테스트: API 서버 정상 동작 확인
- [ ] 테스트: Dashboard 정상 동작 확인

---

## Notes

### Todo
- [ ]
- [ ]
- [ ]

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)

#### YYYY-MM-DD HH:MM
**개요**: 2-3문장 요약

**변경사항**:
- 개발:
- 수정:
- 개선:

**핵심 코드**: (필요시)

**결과**: ✅ 빌드 성공 / ❌ 실패

**다음 단계**:
-->


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[00_Meta/schema_constants.yaml]] - SSOT
- [[api/constants.py]] - Python 상수 로더 (참고용)

---

**Created**: 2025-12-27
**Assignee**: 김은향
**Due**: 2025-12-27
