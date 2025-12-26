---
entity_type: Task
entity_id: tsk-dashboard-ux-v1-07
entity_name: validate_schema.py YAML 일원화
created: 2025-12-27
updated: '2025-12-27'
status: done
closed: '2025-12-27'
parent_id: prj-dashboard-ux-v1
project_id: prj-dashboard-ux-v1
aliases:
- tsk-dashboard-ux-v1-07
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
conditions_3y:
- cond-e
tags:
- schema
- refactoring
- validation
priority_flag: medium
start_date: '2025-12-27'
notes: '# validate_schema.py YAML 일원화


  > Task ID: `tsk-dashboard-ux-v1-07` | Project: `prj-dashboard-ux-v1` | Status: todo


  ## 목표


  **완료 조건**:

  1. `scripts/validate_schema.py`가 `00_Meta/schema_constants.yaml`에서 상수 로드

  2. 하드코딩된 ID_PATTERNS, REQUIRED_FIELDS, KNOWN_FIELDS 제거

  3. 하드코딩된 INCLUDE/EXCLUDE 경로 제거


  ---


  ## 상세 내용


  ### 배경


  `validate_schema.py`에 다음 상수들이 하드코딩되어 있음:

  - `ID_PATTERNS` - 엔티티별 ID 정규식

  - `REQUIRED_FIELDS` - 엔티티별 필수 필드

  - `KNOWN_FIELDS` - freshness check용 필드 목록

  - `INCLUDE_PATHS` / `EXCLUDE_PATHS` - 검증 대상 경로


  이를 `schema_constants.yaml`에서 로드하도록 변경하여 Single Source of Truth 유지.


  ### 작업 내용


  **변경 대상:**

  - `scripts/validate_schema.py`


  **참조할 YAML 섹션:**

  - `paths.include` / `paths.exclude` / `paths.exclude_files`

  - `id_patterns`

  - `required_fields`

  - `known_fields`


  ---


  ## 체크리스트


  - [x] YAML 로드 함수 추가

  - [x] ID_PATTERNS를 YAML에서 로드

  - [x] REQUIRED_FIELDS를 YAML에서 로드

  - [x] KNOWN_FIELDS를 YAML에서 로드

  - [x] INCLUDE/EXCLUDE 경로를 YAML에서 로드

  - [x] 기존 하드코딩 제거

  - [x] 테스트 실행 (validate_schema.py .)


  ---


  ## Notes


  ### Tech Spec

  - **파일**: `scripts/validate_schema.py`

  - **로드 방식**: Python `yaml.safe_load()`

  - **YAML 경로**: `00_Meta/schema_constants.yaml`

  - **의존성**: Task 1 (schema_constants.yaml 확장) 완료 필요


  ### Todo

  - [ ] YAML 로드 유틸 함수 작성

  - [ ] ID_PATTERNS 로드 및 정규식 컴파일

  - [ ] REQUIRED_FIELDS 로드

  - [ ] KNOWN_FIELDS 로드

  - [ ] paths 로드 (include, exclude, exclude_files)

  - [ ] 하드코딩 상수 삭제

  - [ ] 테스트 검증


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

  - [[tsk-dashboard-ux-v1-05]] - 선행 Task (YAML 확장)

  - [[00_Meta/schema_constants.yaml]] - Single Source of Truth


  ---


  **Created**: 2025-12-27

  **Assignee**: 김은향

  **Due**:

  '
---
# validate_schema.py YAML 일원화

> Task ID: `tsk-dashboard-ux-v1-07` | Project: `prj-dashboard-ux-v1` | Status: todo

## 목표

**완료 조건**:
1. `scripts/validate_schema.py`가 `00_Meta/schema_constants.yaml`에서 상수 로드
2. 하드코딩된 ID_PATTERNS, REQUIRED_FIELDS, KNOWN_FIELDS 제거
3. 하드코딩된 INCLUDE/EXCLUDE 경로 제거

---

## 상세 내용

### 배경

`validate_schema.py`에 다음 상수들이 하드코딩되어 있음:
- `ID_PATTERNS` - 엔티티별 ID 정규식
- `REQUIRED_FIELDS` - 엔티티별 필수 필드
- `KNOWN_FIELDS` - freshness check용 필드 목록
- `INCLUDE_PATHS` / `EXCLUDE_PATHS` - 검증 대상 경로

이를 `schema_constants.yaml`에서 로드하도록 변경하여 Single Source of Truth 유지.

### 작업 내용

**변경 대상:**
- `scripts/validate_schema.py`

**참조할 YAML 섹션:**
- `paths.include` / `paths.exclude` / `paths.exclude_files`
- `id_patterns`
- `required_fields`
- `known_fields`

---

## 체크리스트

- [x] YAML 로드 함수 추가
- [x] ID_PATTERNS를 YAML에서 로드
- [x] REQUIRED_FIELDS를 YAML에서 로드
- [x] KNOWN_FIELDS를 YAML에서 로드
- [x] INCLUDE/EXCLUDE 경로를 YAML에서 로드
- [x] 기존 하드코딩 제거
- [x] 테스트 실행 (validate_schema.py .)

---

## Notes

### Tech Spec
- **파일**: `scripts/validate_schema.py`
- **로드 방식**: Python `yaml.safe_load()`
- **YAML 경로**: `00_Meta/schema_constants.yaml`
- **의존성**: Task 1 (schema_constants.yaml 확장) 완료 필요

### Todo
- [ ] YAML 로드 유틸 함수 작성
- [ ] ID_PATTERNS 로드 및 정규식 컴파일
- [ ] REQUIRED_FIELDS 로드
- [ ] KNOWN_FIELDS 로드
- [ ] paths 로드 (include, exclude, exclude_files)
- [ ] 하드코딩 상수 삭제
- [ ] 테스트 검증

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
- [[tsk-dashboard-ux-v1-05]] - 선행 Task (YAML 확장)
- [[00_Meta/schema_constants.yaml]] - Single Source of Truth

---

**Created**: 2025-12-27
**Assignee**: 김은향
**Due**:
