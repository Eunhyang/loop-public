---
entity_type: Task
entity_id: tsk-019-25
entity_name: "Schema - Task type에 meeting 추가"
created: 2026-01-06
updated: 2026-01-06
status: doing

# === 계층 ===
parent_id: prj-dashboard-ux-v1
project_id: prj-dashboard-ux-v1
aliases:
  - tsk-019-25
  - Schema - Task type에 meeting 추가

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: 김은향
start_date: 2026-01-06
due: 2026-01-06
priority: medium
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 분류 ===
tags:
  - schema
  - task-type
  - meeting
priority_flag: medium
---

# Schema - Task type에 meeting 추가

> Task ID: `tsk-019-25` | Project: `prj-dashboard-ux-v1` | Status: doing

## 목표

Task의 type enum에 `meeting` 값을 추가하여 미팅/약속/일정 유형의 Task를 구분할 수 있게 함.

**완료 조건**:
1. `00_Meta/schema_constants.yaml`의 `task.types`에 `meeting` 추가
2. `00_Meta/_TEMPLATES/template_task.md`의 type 주석에 `meeting` 추가
3. 기존 타입들(dev, bug, strategy, research, ops)과 호환성 유지

---

## 상세 내용

### 배경

현재 Task type은 `dev | bug | strategy | research | ops` 5가지로 제한되어 있음.
미팅이나 약속 관련 Task를 생성할 때 적절한 type이 없어 null로 두거나 ops로 분류하는 문제가 있음.

### 작업 내용

1. **schema_constants.yaml 수정**
   - `task.types` 배열에 `meeting` 추가
   - 주석으로 용도 설명 추가

2. **template_task.md 수정**
   - type 필드 주석에 `meeting` 옵션 추가

---

## 체크리스트

- [x] `00_Meta/schema_constants.yaml` - task.types에 meeting 추가
- [x] `00_Meta/_TEMPLATES/template_task.md` - type 주석 업데이트
- [x] 검증: validate_schema.py 실행

---

## Notes

### Tech Spec

**변경 파일:**
1. `00_Meta/schema_constants.yaml`
   - 위치: `task.types` 배열
   - 변경: `- meeting  # 미팅/약속/일정` 추가

2. `00_Meta/_TEMPLATES/template_task.md`
   - 위치: `type:` 필드 주석
   - 변경: `# dev | bug | strategy | research | ops | meeting | null`

**의존성:**
- API 서버는 schema_constants.yaml을 동적으로 로드하므로 rebuild 필요
- Dashboard는 API에서 상수를 가져오므로 추가 수정 불필요

### Todo
- [x] schema_constants.yaml 수정
- [x] template_task.md 수정
- [x] 검증 스크립트 실행
- [ ] API 서버 rebuild 확인 (NAS에서 수동 실행 필요)

### 작업 로그

#### 2026-01-06 16:30
**개요**: Task type enum에 meeting 추가 완료. schema_constants.yaml과 template_task.md 수정.

**변경사항**:
- `00_Meta/schema_constants.yaml`: task.types에 `- meeting # 미팅/약속/일정` 추가
- `00_Meta/_TEMPLATES/template_task.md`: type 주석에 meeting 추가

**결과**: ✅ validate_schema.py 검증 통과

**다음 단계**: API 서버 rebuild 후 Dashboard에서 meeting type 사용 가능


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[00_Meta/schema_constants.yaml]] - Schema SSOT

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
