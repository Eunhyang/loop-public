# Schema v5.2: Hypothesis validated_by 필드 마이그레이션

## Overview

LOOP Vault의 모든 Hypothesis 파일에서 `validated_by` 필드를 완전히 삭제하여 SSOT(Single Source of Truth) 원칙을 준수. Schema v5.2에서 `validated_by`는 derived field로 지정되어 저장하지 않고 빌드 시 역인덱스로 계산하도록 변경됨.

## Context

**문제점:**
- Schema v5.2에서 `Hypothesis.validated_by`가 derived field로 지정됨
- 기존 45개 Hypothesis 파일들이 `validated_by` 필드를 저장하고 있었음
- 14개 파일은 실제 값 포함, 31개 파일은 빈 배열 `[]`
- 이로 인해 validate_schema.py에서 SSOT 위반 경고 발생

**SSOT 원칙:**
```
SSOT (Source)                    Derived (Computed)
─────────────────────────────    ────────────────────
Project.validates = [hyp-...]  → Hypothesis.validated_by
```
- `Project.validates`가 원본 데이터 (어떤 가설을 검증하는지)
- `Hypothesis.validated_by`는 역인덱스로 계산되어야 함 (저장 금지)

## Changes Made

### 1. 값이 있는 Hypothesis 파일 수정 (14개)

**대상 파일:**
- `hyp-2-01`, `hyp-2-02`, `hyp-2-03`, `hyp-2-04` (4개)
- `hyp-4-01`, `hyp-4-03`, `hyp-4-04`, `hyp-4-05`, `hyp-4-06`, `hyp-4-07` (6개)
- `hyp-6-09`, `hyp-6-10`, `hyp-6-13`, `hyp-6-14` (4개)

**수정 내용:**
```yaml
# Before
validates: ["mh-3"]
validated_by:
  - prj-001
  - prj-003
  - prj-005
---

# After
validates: ["mh-3"]
---
```

### 2. 빈 배열 Hypothesis 파일 수정 (31개)

**대상 파일:**
- `hyp-1-*` (11개)
- `hyp-2-05` ~ `hyp-2-10` (6개)
- `hyp-4-02`, `hyp-4-08`, `hyp-4-09`, `hyp-4-10` (4개)
- `hyp-6-01` ~ `hyp-6-08`, `hyp-6-11`, `hyp-6-12` (10개)

**수정 내용:**
```yaml
# Before
validates: []
validated_by: []
---

# After
validates: []
---
```

### 3. 수정 방법

- 값이 있는 14개 파일: Edit 도구로 개별 수정 (정확한 패턴 매칭)
- 빈 배열 31개 파일: sed 명령으로 일괄 삭제
```bash
sed -i '' '/^validated_by: \[\]$/d' "$file"
```

## File Changes Summary

| 카테고리 | 파일 수 | 작업 |
|---------|--------|------|
| hyp-1-* | 11 | 빈 필드 삭제 |
| hyp-2-* | 10 | 4개 값 삭제 + 6개 빈 필드 삭제 |
| hyp-4-* | 10 | 6개 값 삭제 + 4개 빈 필드 삭제 |
| hyp-6-* | 14 | 4개 값 삭제 + 10개 빈 필드 삭제 |
| **합계** | **45** | **모두 완료** |

## Verification Results

### Derived Field 경고 확인
```bash
$ python3 scripts/validate_schema.py . 2>&1 | grep -i "derived\|validated_by"
No derived field warnings found!
```

### validated_by 필드 존재 확인
```bash
$ grep -r "validated_by" 60_Hypotheses/
No files found
```

### Schema Validation
```bash
$ python3 scripts/validate_schema.py .

=== Schema Validation Report ===
Files checked: 207
Files with errors: 34  # 기존 다른 이슈들 (conditions_3y 누락 등)
```

**결과:**
- `validated_by` derived field 경고: **0건**
- 모든 Hypothesis 파일에서 `validated_by` 필드 **완전 삭제됨**

## Architecture Decision

### 데이터 흐름 (마이그레이션 후)

```
Project 파일:                     빌드 스크립트:
  validates: [hyp-2-01]          build_graph_index.py
        │                               │
        └───────────────┬───────────────┘
                        ↓
                  _build/graph.json:
                    hyp-2-01.validated_by = [prj-xxx, ...]
```

### 왜 필드를 삭제했는가?

1. **드리프트 방지**: 수동 저장 시 Project.validates와 불일치 발생 가능
2. **SSOT 원칙**: 데이터는 한 곳에만 저장 (Project.validates)
3. **유지보수성**: 빌드 시 자동 계산으로 항상 최신 상태 유지

## Related

- Task: `tsk-impact-schema-v2-04`
- Project: `prj-impact-schema-v2`
- 선행 Task: `tsk-impact-schema-v2-03` (Schema v5.2 구현)
- Schema Version: 5.2 (derived_fields 규칙)
