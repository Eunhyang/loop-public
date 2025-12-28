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

#### 2025-12-27: Schema v5.2 Hypothesis validated_by 필드 마이그레이션

**Overview**

LOOP Vault의 모든 Hypothesis 파일에서 `validated_by` 필드를 완전히 삭제하여 SSOT(Single Source of Truth) 원칙을 준수. Schema v5.2에서 `validated_by`는 derived field로 지정되어 저장하지 않고 빌드 시 역인덱스로 계산하도록 변경됨.

**Context**

문제점:
- Schema v5.2에서 `Hypothesis.validated_by`가 derived field로 지정됨
- 기존 45개 Hypothesis 파일들이 `validated_by` 필드를 저장하고 있었음
- 14개 파일은 실제 값 포함, 31개 파일은 빈 배열 `[]`
- 이로 인해 validate_schema.py에서 SSOT 위반 경고 발생

SSOT 원칙:
```
SSOT (Source)                    Derived (Computed)
─────────────────────────────    ────────────────────
Project.validates = [hyp-...]  → Hypothesis.validated_by
```
- `Project.validates`가 원본 데이터 (어떤 가설을 검증하는지)
- `Hypothesis.validated_by`는 역인덱스로 계산되어야 함 (저장 금지)

**Changes Made**

1. 값이 있는 Hypothesis 파일 수정 (14개)
   - hyp-2-01~04 (4개), hyp-4-01/03~07 (6개), hyp-6-09/10/13/14 (4개)
   - validated_by 필드 및 값 완전 삭제

2. 빈 배열 Hypothesis 파일 수정 (31개)
   - hyp-1-* (11개), hyp-2-05~10 (6개), hyp-4-02/08~10 (4개), hyp-6-01~08/11/12 (10개)
   - `validated_by: []` 라인 삭제

수정 방법:
- 값이 있는 14개 파일: Edit 도구로 개별 수정
- 빈 배열 31개 파일: sed 명령으로 일괄 삭제

**File Changes Summary**

| 카테고리 | 파일 수 | 작업 |
|---------|--------|------|
| hyp-1-* | 11 | 빈 필드 삭제 |
| hyp-2-* | 10 | 4개 값 삭제 + 6개 빈 필드 삭제 |
| hyp-4-* | 10 | 6개 값 삭제 + 4개 빈 필드 삭제 |
| hyp-6-* | 14 | 4개 값 삭제 + 10개 빈 필드 삭제 |
| **합계** | **45** | **모두 완료** |

**Verification Results**

```bash
$ python3 scripts/validate_schema.py . 2>&1 | grep -i "derived\|validated_by"
No derived field warnings found!

$ grep -r "validated_by" 60_Hypotheses/
No files found
```

결과: `validated_by` derived field 경고 0건, 모든 Hypothesis 파일에서 완전 삭제됨

**Architecture Decision: 데이터 흐름**

```
Project 파일:                     빌드 스크립트:
  validates: [hyp-2-01]          build_graph_index.py
        │                               │
        └───────────────┬───────────────┘
                        ↓
                  _build/graph.json:
                    hyp-2-01.validated_by = [prj-xxx, ...]
```

왜 필드를 삭제했는가:
1. 드리프트 방지: 수동 저장 시 Project.validates와 불일치 발생 가능
2. SSOT 원칙: 데이터는 한 곳에만 저장 (Project.validates)
3. 유지보수성: 빌드 시 자동 계산으로 항상 최신 상태 유지

---

## 참고 문서

- [[prj-impact-schema-v2]] - 소속 Project
- [[tsk-impact-schema-v2-03]] - 이전 Task (Schema v5.2 구현)
- [[00_Meta/schema_constants.yaml]] - Schema SSOT

---

**Created**: 2025-12-27
**Assignee**: 김은향
**Due**: 2025-12-27
