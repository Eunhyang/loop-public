---
entity_type: Task
entity_id: tsk-dashboard-ux-v1-05
entity_name: Schema 상수 중앙화
created: 2025-12-26
updated: '2025-12-27'
status: done
closed: '2025-12-27'
parent_id: prj-dashboard-ux-v1
project_id: prj-dashboard-ux-v1
aliases:
- tsk-dashboard-ux-v1-05
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
due: '2025-12-27'
priority: medium
estimated_hours: null
actual_hours: null
type: dev
target_project: loop
tags:
- schema
- refactoring
priority_flag: medium
start_date: '2025-12-27'
---
# Schema 상수 중앙화

> Task ID: `tsk-dashboard-ux-v1-05` | Project: `prj-dashboard-ux-v1` | Status: doing

## 목표

**완료 조건**:
1. 모든 status/priority 값이 `00_Meta/schema_constants.yaml`에서 관리됨
2. api/constants.py가 YAML에서 로드
3. 하드코딩된 값 제거

---

## 상세 내용

### 배경

status 값이 여러 곳에 하드코딩됨:
- api/constants.py
- _dashboard/js/state.js (fallback, filters)
- 00_Meta/schema_registry.md
- CLAUDE.md

hold 추가할 때 5곳 이상 수정 필요 → 누락/불일치 발생

### 작업 내용

**Single Source of Truth 구조:**
```
00_Meta/
├── schema_constants.yaml   ← Single Source of Truth
└── schema_registry.md      ← 이 파일을 참조
```

**참조 방식:**
- api/constants.py → YAML 파일 로드
- _dashboard/js/state.js → API /api/constants에서 가져옴
- schema_registry.md → YAML 파일 경로 명시
- CLAUDE.md → schema_registry.md 참조 안내

---

## 체크리스트

- [x] 00_Meta/schema_constants.yaml 생성
- [x] api/constants.py에서 YAML 로드하도록 수정
- [x] schema_registry.md에서 YAML 참조 추가 (v4.0)
- [x] CLAUDE.md 하드코딩 제거 (v6.4)
- [x] state.js fallback 정리 (status_mapping API 로드)
- [x] Docker rebuild

---

## Notes

### Tech Spec
- **파일**: `00_Meta/schema_constants.yaml`
- **포맷**: YAML
- **로드 방식**: Python `yaml.safe_load()`
- **추가할 섹션**:
  - `paths` - include/exclude 경로
  - `id_patterns` - 엔티티별 ID 정규식
  - `required_fields` - 엔티티별 필수 필드
  - `known_fields` - freshness check용
  - `entity_order` - 정렬 순서
  - `status_mapping` - Dashboard status 매핑
- **영향 파일** (이후 Task에서 수정):
  - `scripts/validate_schema.py`
  - `scripts/build_graph_index.py`
  - `api/constants.py`
  - `_dashboard/js/state.js`
  - `loop-entity-creator SKILL.md`
  - `00_Meta/schema_registry.md`

### Todo
- [x] paths 섹션 추가 (include, exclude, exclude_files)
- [x] id_patterns 섹션 추가 (ns, mh, cond, trk, prj, tsk, hyp, exp, pgm 등)
- [x] required_fields 섹션 추가 (all, Task, Project 등)
- [x] known_fields 섹션 추가
- [x] entity_order 섹션 추가
- [x] status_mapping 섹션 추가
- [x] impact 섹션 추가 (tiers, magnitudes)
- [x] YAML 문법 검증
- [ ] validate_schema.py 로드 테스트 (별도 Task)

### 작업 로그
#### 2025-12-27 12:20
**개요**: Schema 상수 중앙화 완료. YAML 확장 + 모든 참조 파일 수정 + Docker rebuild.

**변경사항**:
- 확장: `00_Meta/schema_constants.yaml` - paths, id_patterns, required_fields, known_fields, entity_order, status_mapping, impact 섹션 추가
- 수정: `api/constants.py` - status_mapping 추가, get_all_constants()에 포함
- 수정: `_dashboard/js/state.js` - normalizeStatus()가 API constants에서 status_mapping 로드
- 수정: `00_Meta/schema_registry.md` - 하드코딩 제거, YAML 참조로 통일 (v4.0)
- 수정: `CLAUDE.md` - 하드코딩된 상수 테이블 제거, YAML 참조로 변경 (v6.4)
- 배포: Docker rebuild 완료

**결과**: ✅ 완료

**다음 단계**:
- validate_schema.py, build_graph_index.py YAML 로드 (별도 Task)

#### 2025-12-26 19:00
**개요**: Schema 상수 중앙화 작업 시작. YAML 파일 생성 및 api/constants.py 수정 완료.

**변경사항**:
- 개발: `00_Meta/schema_constants.yaml` 생성 (Single Source of Truth)
- 수정: `api/constants.py` - YAML에서 상수 로드하도록 변경
- 수정: `schema_registry.md` - YAML 참조 섹션 추가 (진행중)

**결과**: ✅ 1단계 완료


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[00_Meta/schema_constants.yaml]] - Single Source of Truth
- [[00_Meta/schema_registry.md]] - 스키마 정의

---

**Created**: 2025-12-26
**Assignee**: 김은향
**Due**:
