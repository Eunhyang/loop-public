---
entity_type: Task
entity_id: tsk-dashboard-ux-v1-08
entity_name: build_graph_index.py YAML 일원화
created: 2025-12-27
updated: '2025-12-27'
status: done
closed: '2025-12-27'
parent_id: prj-dashboard-ux-v1
project_id: prj-dashboard-ux-v1
aliases:
- tsk-dashboard-ux-v1-08
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
- graph-index
priority_flag: medium
start_date: '2025-12-27'
notes: '# build_graph_index.py YAML 일원화


  > Task ID: `tsk-dashboard-ux-v1-08` | Project: `prj-dashboard-ux-v1` | Status: todo


  ## 목표


  **완료 조건**:

  1. `scripts/build_graph_index.py`가 `00_Meta/schema_constants.yaml`에서 상수 로드

  2. 하드코딩된 INCLUDE_PATHS, ENTITY_ORDER 제거

  3. 하드코딩된 FOLDER_INDEX_CONFIG 제거


  ---


  ## 상세 내용


  ### 배경


  `build_graph_index.py`에 다음 상수들이 하드코딩되어 있음:

  - `INCLUDE_PATHS` - 인덱싱 대상 경로

  - `ENTITY_ORDER` - 엔티티 정렬 순서

  - `FOLDER_INDEX_CONFIG` - 폴더별 인덱스 설정


  이를 `schema_constants.yaml`에서 로드하도록 변경하여 Single Source of Truth 유지.


  ### 작업 내용


  **변경 대상:**

  - `scripts/build_graph_index.py`


  **참조할 YAML 섹션:**

  - `paths.include`

  - `entity_order`


  ---


  ## 체크리스트


  - [ ] YAML 로드 함수 추가

  - [ ] INCLUDE_PATHS를 YAML에서 로드

  - [ ] ENTITY_ORDER를 YAML에서 로드

  - [ ] 기존 하드코딩 제거

  - [ ] 테스트 실행 (build_graph_index.py .)


  ---


  ## Notes


  ### Tech Spec

  - **파일**: `scripts/build_graph_index.py`

  - **로드 방식**: Python `yaml.safe_load()`

  - **YAML 경로**: `00_Meta/schema_constants.yaml`

  - **의존성**: Task 1 (schema_constants.yaml 확장) 완료 필요


  ### Todo

  - [ ] YAML 로드 유틸 함수 작성

  - [ ] paths.include 로드

  - [ ] entity_order 로드

  - [ ] 하드코딩 상수 삭제

  - [ ] 테스트 검증 (_Graph_Index.md 정상 생성 확인)


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

  '
---
# build_graph_index.py YAML 일원화

> Task ID: `tsk-dashboard-ux-v1-08` | Project: `prj-dashboard-ux-v1` | Status: todo

## 목표

**완료 조건**:
1. `scripts/build_graph_index.py`가 `00_Meta/schema_constants.yaml`에서 상수 로드
2. 하드코딩된 INCLUDE_PATHS, ENTITY_ORDER 제거
3. 하드코딩된 FOLDER_INDEX_CONFIG 제거

---

## 상세 내용

### 배경

`build_graph_index.py`에 다음 상수들이 하드코딩되어 있음:
- `INCLUDE_PATHS` - 인덱싱 대상 경로
- `ENTITY_ORDER` - 엔티티 정렬 순서
- `FOLDER_INDEX_CONFIG` - 폴더별 인덱스 설정

이를 `schema_constants.yaml`에서 로드하도록 변경하여 Single Source of Truth 유지.

### 작업 내용

**변경 대상:**
- `scripts/build_graph_index.py`

**참조할 YAML 섹션:**
- `paths.include`
- `entity_order`

---

## 체크리스트

- [x] YAML 로드 함수 추가
- [x] INCLUDE_PATHS를 YAML에서 로드
- [x] ENTITY_ORDER를 YAML에서 로드
- [x] 기존 하드코딩 제거
- [x] 테스트 실행 (build_graph_index.py .)

---

## Notes

### Tech Spec
- **파일**: `scripts/build_graph_index.py`
- **로드 방식**: Python `yaml.safe_load()`
- **YAML 경로**: `00_Meta/schema_constants.yaml`
- **의존성**: Task 1 (schema_constants.yaml 확장) 완료 필요

### Todo
- [ ] YAML 로드 유틸 함수 작성
- [ ] paths.include 로드
- [ ] entity_order 로드
- [ ] 하드코딩 상수 삭제
- [ ] 테스트 검증 (_Graph_Index.md 정상 생성 확인)

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
