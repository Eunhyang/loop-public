---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-10"
entity_name: "api/constants.py 응답 확장"
created: 2025-12-27
updated: 2025-12-27
status: doing

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-10"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
due: null
priority: medium
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-e"]

# === 분류 ===
tags: ["schema", "api", "constants"]
priority_flag: medium
start_date: '2025-12-27'
---

# api/constants.py 응답 확장

> Task ID: `tsk-dashboard-ux-v1-10` | Project: `prj-dashboard-ux-v1` | Status: doing

## 목표

**완료 조건**:
1. `get_all_constants()` 함수에 새 필드 추가 (entity_order, id_patterns, condition_ids 등)
2. Dashboard state.js에서 활용할 수 있는 완전한 constants 제공
3. Fallback 값 최소화 (YAML 우선)

---

## 상세 내용

### 배경

`api/constants.py`가 이미 YAML에서 상수를 로드하지만, `get_all_constants()` 응답에 일부 필드가 누락됨:
- `entity_order` - 엔티티 정렬 순서
- `id_patterns` - ID 정규식 패턴
- `condition_ids` - 3년 조건 ID 목록
- `paths` - include/exclude 경로 설정

### 작업 내용

**변경 대상:**
- `api/constants.py`

**추가할 필드:**
- `entity_order`
- `id_patterns`
- `condition_ids`
- `hypothesis.evidence_status` (있으면)
- `task.types`
- `task.target_projects`

---

## 체크리스트

- [x] 현재 get_all_constants() 응답 확인
- [x] entity_order 추가 (이미 있음)
- [x] condition_ids 추가 (이미 있음)
- [x] task.types, task.target_projects 추가 (이미 있음)
- [x] id_patterns 추가
- [x] paths (include/exclude/exclude_files) 추가
- [x] required_fields 추가
- [x] known_fields 추가
- [x] northstar.status 추가
- [x] project.status_colors 추가
- [x] API 테스트

---

## Notes

### Tech Spec
- **파일**: `api/constants.py`
- **함수**: `get_all_constants()`
- **의존성**: Task 1 (schema_constants.yaml 확장) 완료됨

### Todo
- [x] entity_order 로드 및 응답 추가 (이미 있음)
- [x] condition_ids 로드 및 응답 추가 (이미 있음)
- [x] task 섹션 확장 (types, target_projects) (이미 있음)
- [x] id_patterns 추가
- [x] paths (include/exclude/exclude_files) 추가
- [x] required_fields 추가
- [x] known_fields 추가
- [x] northstar.status 추가
- [x] project.status_colors 추가
- [x] 테스트 완료

### 작업 로그

**2025-12-27**: `api/constants.py` 확장 완료
- 기존에 entity_order, condition_ids, task.types, task.target_projects 이미 있음 확인
- 누락된 필드 추가:
  - `ID_PATTERNS` - 엔티티별 ID 정규식 패턴
  - `PATHS_INCLUDE`, `PATHS_EXCLUDE`, `PATHS_EXCLUDE_FILES` - 검증/인덱싱 경로
  - `REQUIRED_FIELDS` - 엔티티별 필수 필드
  - `KNOWN_FIELDS` - freshness check용 필드
  - `NORTHSTAR_STATUS` - 북극성 상태
  - `PROJECT_STATUS_COLORS` - 프로젝트 상태 색상
- `get_all_constants()` 응답에 새 필드 모두 포함
- Python 문법 검증 및 로드 테스트 완료


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[tsk-dashboard-ux-v1-05]] - 선행 Task (YAML 확장)
- [[00_Meta/schema_constants.yaml]] - Single Source of Truth

---

**Created**: 2025-12-27
**Assignee**: 김은향
**Due**:
