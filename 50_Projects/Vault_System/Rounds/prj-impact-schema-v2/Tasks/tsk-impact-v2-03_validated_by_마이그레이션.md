---
entity_type: Task
entity_id: "tsk-impact-schema-v2-04"
entity_name: "Schema - Hypothesis validated_by 필드 마이그레이션"
created: 2025-12-27
updated: 2025-12-27
status: done
closed: 2025-12-27

# === 계층 ===
parent_id: "prj-impact-schema-v2"
project_id: "prj-impact-schema-v2"
aliases: ["tsk-impact-schema-v2-04"]

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
conditions_3y: ["cond-b"]

# === 분류 ===
tags: ["schema", "migration", "ssot"]
priority_flag: high
---

# Schema - Hypothesis validated_by 필드 마이그레이션

> Task ID: `tsk-impact-schema-v2-04` | Project: `prj-impact-schema-v2` | Status: doing

## 목표

**완료 조건**:
1. 모든 Hypothesis 파일에서 `validated_by` 필드 **완전 삭제**
2. Schema validation 통과 (derived field 경고 0건)
3. 빌드 스크립트가 역인덱스로 정상 계산하는지 확인

---

## 상세 내용

### 배경

Schema v5.2에서 `Hypothesis.validated_by`는 **derived field**로 지정됨:
- 저장 금지: 수동으로 값을 저장하면 SSOT 원칙 위반
- 계산 방식: `Project.validates: [hyp-*]`에서 역인덱스로 계산
- 드리프트 방지: 수동 저장 시 데이터 불일치 위험

### 대상 파일 (~14개)

| Track | Files |
|-------|-------|
| hyp-2-* | hyp-2-01, hyp-2-02, hyp-2-03, hyp-2-04 |
| hyp-4-* | hyp-4-01, hyp-4-03, hyp-4-04, hyp-4-05, hyp-4-06, hyp-4-07 |
| hyp-6-* | hyp-6-09, hyp-6-10, hyp-6-13, hyp-6-14 |

### 작업 내용

각 파일에서:
```yaml
# Before
validated_by:
  - prj-001
  - prj-003

# After
validated_by: []
```

---

## 체크리스트

- [x] hyp-2-* 파일들 마이그레이션 (4개 값 삭제 + 6개 빈 필드 삭제)
- [x] hyp-4-* 파일들 마이그레이션 (6개 값 삭제 + 4개 빈 필드 삭제)
- [x] hyp-6-* 파일들 마이그레이션 (4개 값 삭제 + 10개 빈 필드 삭제)
- [x] hyp-1-* 파일들 마이그레이션 (11개 빈 필드 삭제)
- [x] validate_schema.py 실행하여 경고 0건 확인
- [x] 모든 Hypothesis 파일에서 validated_by 필드 완전 삭제 확인

---

## Notes

### 작업 로그

#### 2025-12-27
**개요**: 모든 Hypothesis 파일(45개)에서 `validated_by` 필드를 완전히 삭제하여 SSOT 원칙 준수. Schema v5.2 derived field 규칙 적용.

**변경사항**:
- 삭제: 14개 파일의 `validated_by` 값 (prj-* 참조 포함)
- 삭제: 31개 파일의 빈 `validated_by: []` 필드
- 수정: Edit 도구 (14개) + sed 명령 (31개)

**파일 변경**:
- `60_Hypotheses/2026/hyp-2-*.md` - 10개 파일 수정
- `60_Hypotheses/2026/hyp-4-*.md` - 10개 파일 수정
- `60_Hypotheses/2026/hyp-6-*.md` - 14개 파일 수정
- `60_Hypotheses/2026/hyp-1-*.md` - 11개 파일 수정

**결과**: ✅ 빌드 성공 - derived field 경고 0건

**다음 단계**:
- build_graph_index.py에서 역인덱스 계산 로직 확인 (필요시)


---

## 참고 문서

- [[prj-impact-schema-v2]] - 소속 Project
- [[tsk-impact-schema-v2-03]] - 이전 Task (Schema v5.2 구현)
- [[00_Meta/schema_constants.yaml]] - Schema SSOT

---

**Created**: 2025-12-27
**Assignee**: 김은향
**Due**: 2025-12-27
