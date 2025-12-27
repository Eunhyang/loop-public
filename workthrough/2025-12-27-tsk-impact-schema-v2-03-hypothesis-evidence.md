# Schema v5.2: Hypothesis-Evidence 연결 설계

## Overview

LOOP Vault 스키마 v5.2 구현 완료. Evidence 엔티티를 정식 등록하고, A/B(Impact)와 Hypothesis를 Evidence를 통해 연결하는 구조를 확립. SSOT 원칙에 따라 derived 필드(validated_by, realized_sum) 저장 금지 규칙 추가.

## Context

**문제점:**
- A/B(Impact)와 Hypothesis가 동일 축으로 취급되어 혼란
- Evidence 엔티티가 템플릿만 있고 schema_constants.yaml에 미등록
- Hypothesis.validated_by가 수동 저장되어 SSOT 원칙 위반 (드리프트 발생)
- Project의 hypothesis_id와 primary_hypothesis_id 구분 불명확

**설계 결정:**
- A/B: 베팅 가치 + 결과 점수 (전략적 포트폴리오 관리)
- Hypothesis: 참/거짓 판정 (지식 생산 레이어)
- Evidence: 둘을 연결하는 매개체 (B 계산 + Hypothesis 판정 기록)

## Changes Made

### 1. schema_constants.yaml 수정

**entity_types에 Evidence 추가:**
```yaml
entity_types:
  - Evidence      # v5.2 추가: 프로젝트 결과/학습 기록
```

**required_fields.Evidence 추가:**
```yaml
required_fields:
  Evidence:
    - project
    - normalized_delta
    - evidence_strength
```

**known_fields.Evidence 추가:**
```yaml
known_fields:
  Evidence:
    - project                    # 필수
    - normalized_delta           # 필수
    - evidence_strength          # 필수
    - attribution_share          # 권장
    - window_id                  # 권장
    - time_range                 # 권장
    - impact_metric
    - learning_value
    - validated_hypotheses       # [hyp-*] 이 Evidence가 확증한 가설
    - falsified_hypotheses       # [hyp-*] 이 Evidence가 반증한 가설
    - confirmed_insights
```

**Project 필드 정리 (Deprecation):**
```yaml
known_fields:
  Project:
    - hypothesis_id           # deprecated → primary_hypothesis_id
    - primary_hypothesis_id   # 신규: 프로젝트 생성 근본 질문 (hyp-*)
```

**validation_rules.derived_fields 섹션 추가:**
```yaml
validation_rules:
  # Derived 필드 (저장 금지 - 빌드 시 역인덱스 계산)
  derived_fields:
    Hypothesis:
      - validated_by         # Evidence에서 역인덱스 계산
    Track:
      - realized_sum         # 하위 Project B 집계
    Condition:
      - realized_sum         # 하위 Project B 집계
```

**Schema version 업데이트:**
```yaml
schema_version: "5.2"
last_updated: "2025-12-27"
# v5.2 변경:
# - Evidence 엔티티 정식 등록 (entity_types, required_fields, known_fields)
# - Project.primary_hypothesis_id 필드 추가 (hypothesis_id deprecated)
# - validation_rules.derived_fields 섹션 추가 (저장 금지 필드 규칙)
```

### 2. template_project.md 수정

`primary_hypothesis_id` 필드 추가:
```yaml
# === 관계 ===
outgoing_relations: []
validates: []                     # 검증하는 가설들 (0..N)
validated_by: []
primary_hypothesis_id: null       # 프로젝트 생성 근본 질문 (0..1, hyp-*)
```

### 3. validate_schema.py v7.1 업데이트

**validate_derived_fields() 함수 추가:**
```python
def validate_derived_fields(frontmatter: Dict, entity_type: str) -> List[str]:
    """Derived 필드 검증 (v5.2) - 저장 금지 필드에 값이 있으면 경고"""
    warnings = []

    # YAML에서 derived_fields 규칙 로드
    derived_rules = _SCHEMA_CONSTANTS.get("validation_rules", {}).get("derived_fields", {})

    # 현재 entity_type에 해당하는 derived 필드들
    forbidden_fields = derived_rules.get(entity_type, [])

    for field in forbidden_fields:
        value = frontmatter.get(field)
        if value is not None:
            if isinstance(value, list) and len(value) > 0:
                warnings.append(f"⚠️  Derived field '{field}' should not be stored...")
            elif isinstance(value, (str, int, float)) and value:
                warnings.append(f"⚠️  Derived field '{field}' should not be stored...")
            elif isinstance(value, dict) and len(value) > 0:
                warnings.append(f"⚠️  Derived field '{field}' should not be stored...")

    return warnings
```

**validate_file() 함수에 통합:**
```python
# Derived 필드 검증 (v5.2) - 모든 엔티티 대상
derived_warnings = validate_derived_fields(frontmatter, entity_type)
errors.extend(derived_warnings)
```

### 4. Task 파일 업데이트

- 체크리스트 모든 항목 완료 표시
- 작업 로그 섹션에 상세 기록 추가
- status: doing → done
- closed: 2025-12-27 추가

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `00_Meta/schema_constants.yaml` | 수정 | Evidence 등록, derived_fields 규칙, v5.2 업데이트 |
| `00_Meta/_TEMPLATES/template_project.md` | 수정 | primary_hypothesis_id 필드 추가 |
| `scripts/validate_schema.py` | 수정 | v7.1 - derived 필드 검증 로직 추가 |
| `50_Projects/.../Tasks/Schema - Hypothesis-Evidence 연결 설계.md` | 수정 | 체크리스트, 로그, 상태 업데이트 |

## Verification Results

### Schema Validation
```bash
$ python3 scripts/validate_schema.py . --no-freshness

=== Schema Validation Report ===
Files checked: 206
Files with errors: 48
```

**예상된 경고 (정상 동작):**
- 기존 Hypothesis 파일들의 `validated_by` 필드에 SSOT 경고 출력
- 이 경고들은 점진적 마이그레이션 대상임

### Derived Field Warning Example
```
60_Hypotheses/2026/hyp-2-01_스키마_최소세트_충분.md:
  - ⚠️  Derived field 'validated_by' should not be stored (SSOT 원칙 위반).
        Value will be computed at build time.
```

## Architecture Decision

### SSOT + Derived 원칙

```
SSOT (Single Source of Truth)    Derived (계산값)
─────────────────────────────    ────────────────────
Project.validates = [hyp-...]  → Hypothesis.validated_by
Project.realized_impact        → Track.realized_sum
                               → Condition.realized_sum
```

### Evidence 역할

```
Evidence
  ├── B(Realized) 계산 입력값
  │   ├── normalized_delta
  │   ├── evidence_strength
  │   └── attribution_share
  │
  └── Hypothesis 판정 결과
      ├── validated_hypotheses = [hyp-*]  확증
      └── falsified_hypotheses = [hyp-*]  반증
```

## Next Steps

1. **점진적 마이그레이션**: 기존 Hypothesis 파일들의 `validated_by` 필드 제거
2. **Evidence ID 패턴**: `ev:YYYY-NNNN` 형식 강제 (나중에)
3. **build_graph_index.py**: Evidence → Hypothesis 역인덱스 계산 로직 추가

## Related

- Task: `tsk-impact-schema-v2-03`
- Project: `prj-impact-schema-v2`
- Schema Version: 5.1 → 5.2
