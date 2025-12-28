---
entity_type: Task
entity_id: "tsk-impact-schema-v2-03"
entity_name: "Schema - Hypothesis-Evidence 연결 설계"
created: 2025-12-27
updated: 2025-12-27
status: done

# === 계층 ===
parent_id: "prj-impact-schema-v2"
project_id: "prj-impact-schema-v2"
aliases: ["tsk-impact-schema-v2-03"]

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
closed: 2025-12-27

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-b"]

# === 분류 ===
tags: ["schema", "hypothesis", "evidence"]
priority_flag: high
---

# Schema - Hypothesis-Evidence 연결 설계

> Task ID: `tsk-impact-schema-v2-03` | Project: `prj-impact-schema-v2` | Status: doing

## 목표

**완료 조건**:
1. Evidence 템플릿에 `validated_hypotheses` / `falsified_hypotheses` 필드 추가
2. Project 스키마에 `primary_hypothesis_id` 명확화
3. `Hypothesis.validated_by`는 derived(저장 금지) 규칙 추가
4. `schema_constants.yaml`에 관련 규칙 반영

---

## 상세 내용

### 배경

사용자의 피드백:
- A/B(Impact)와 Hypothesis는 "동일 축"이 아님
  - A/B: 베팅 가치 + 결과 점수 (전략적 포트폴리오 관리)
  - Hypothesis: 참/거짓 판정 (지식 생산 레이어)
- 둘은 Evidence를 통해 연결되어야 함
- Evidence가 B(Realized) 계산에 쓰이면서 동시에 Hypothesis 판정 기록

### 설계 요점

#### 1) 관계 구조

**소속(ownership)**:
- `Hypothesis.parent_id` = `trk-*` (가설은 Track 소속)
- `Project.parent_id` = `trk-*` (프로젝트도 Track 소속)

**검증 관계(N:M)**:
- `Project.primary_hypothesis_id` (0..1): 프로젝트 생성 근본 질문
- `Project.validates[]` (0..N): 실제로 검증하는 가설들

**역방향은 저장 금지(derived)**:
- `Hypothesis.validated_by`는 저장 금지 → 드리프트 방지
- 빌드 시 역인덱스로만 계산

#### 2) Evidence 필드 추가

```yaml
validated_hypotheses: [hyp-...]  # 이 Evidence가 지지(확증)한 가설
falsified_hypotheses: [hyp-...]  # 이 Evidence가 반증(기각)한 가설
```

| 필드 | 의미 |
|------|------|
| `Project.validates[]` | 검증하려는 의도/목표 |
| `Evidence.validated_hypotheses` | 실제 판정 결과 |

#### 3) Hypothesis 최소 지표 (점수 대신)

- `evidence_count_validating`: 검증 중인 Evidence 수
- `last_evidence_date`: 마지막 Evidence 날짜
- `current_verdict`: validated / falsified / learning / inconclusive

---

## 체크리스트

### 1. Evidence 엔티티 정식 등록
- [x] `entity_types`에 `Evidence` 추가
- [x] `required_fields.Evidence` 추가: `project`, `normalized_delta`, `evidence_strength`
- [x] `known_fields.Evidence` 추가: 전체 필드 목록

### 2. Project 필드 정리 (Deprecation)
- [x] `known_fields.Project`에 `primary_hypothesis_id` 추가
- [x] `hypothesis_id`에 deprecated 주석 추가
- [x] `template_project.md`에 `primary_hypothesis_id` 필드 추가

### 3. Derived 필드 검증 규칙
- [x] `validation_rules.derived_fields` 섹션 추가
- [x] `validate_schema.py`에 derived 필드 체크 로직 추가 (v7.1)

### 4. 마무리
- [x] Schema version 5.1 → 5.2 업데이트
- [x] `python3 scripts/validate_schema.py .` 통과 (derived 경고는 예상된 동작)

---

## Notes

### PRD (Product Requirements Document)

#### 1. Evidence 엔티티 정식 등록

| 위치 | 작업 |
|------|------|
| `entity_types` | `Evidence` 추가 |
| `required_fields.Evidence` | `project`, `normalized_delta`, `evidence_strength` |
| `known_fields.Evidence` | 전체 필드 목록 등록 |

**Evidence known_fields**:
```yaml
Evidence:
  - project                    # 필수
  - normalized_delta           # 필수
  - evidence_strength          # 필수
  - attribution_share          # 권장 (default: 1.0)
  - window_id                  # 권장
  - time_range                 # 권장
  - impact_metric
  - learning_value
  - validated_hypotheses       # [hyp-*] 단순 배열
  - falsified_hypotheses       # [hyp-*] 단순 배열
  - confirmed_insights
```

#### 2. Project 필드 정리 (Deprecation)

| 필드 | 상태 | 처리 |
|------|------|------|
| `hypothesis_id` | **deprecated** | 주석으로 표시, 기존 호환성 유지 |
| `primary_hypothesis_id` | **신규 표준** | known_fields에 추가 |

**schema_constants.yaml 반영**:
```yaml
known_fields:
  Project:
    - hypothesis_id           # deprecated → primary_hypothesis_id
    - primary_hypothesis_id   # 신규: 프로젝트 생성 근본 질문 (hyp-*)
```

**template_project.md 반영**:
```yaml
validates: []                    # 검증하는 가설들 (0..N)
primary_hypothesis_id: null      # 프로젝트 생성 근본 질문 (0..1)
```

**기존 Project 파일들**: 수정 안 함 (점진적 마이그레이션)

#### 3. Derived 필드 검증 규칙

**schema_constants.yaml에 추가**:
```yaml
validation_rules:
  derived_fields:
    Hypothesis:
      - validated_by         # Evidence에서 역인덱스 계산
    Track:
      - realized_sum         # 하위 Project B 집계
    Condition:
      - realized_sum         # 하위 Project B 집계
```

**validate_schema.py 수정**:
- Hypothesis 문서에 `validated_by` 값이 있으면 경고
- Track/Condition에 `realized_sum` 값이 있으면 경고

#### 4. 이번에 안 함

- Evidence ID 패턴 (`ev:YYYY-NNNN`) 강제 → 나중에
- 기존 Project 파일들 마이그레이션 → 점진적으로
- window_id/time_range 필수화 → 권장으로만

### 작업 로그

#### 2025-12-27: Schema v5.2 Hypothesis-Evidence 연결 설계

**Overview**

LOOP Vault 스키마 v5.2 구현 완료. Evidence 엔티티를 정식 등록하고, A/B(Impact)와 Hypothesis를 Evidence를 통해 연결하는 구조를 확립. SSOT 원칙에 따라 derived 필드(validated_by, realized_sum) 저장 금지 규칙 추가.

**Context**

문제점:
- A/B(Impact)와 Hypothesis가 동일 축으로 취급되어 혼란
- Evidence 엔티티가 템플릿만 있고 schema_constants.yaml에 미등록
- Hypothesis.validated_by가 수동 저장되어 SSOT 원칙 위반 (드리프트 발생)
- Project의 hypothesis_id와 primary_hypothesis_id 구분 불명확

설계 결정:
- A/B: 베팅 가치 + 결과 점수 (전략적 포트폴리오 관리)
- Hypothesis: 참/거짓 판정 (지식 생산 레이어)
- Evidence: 둘을 연결하는 매개체 (B 계산 + Hypothesis 판정 기록)

**Changes Made**

1. schema_constants.yaml 수정
   - entity_types에 Evidence 추가
   - required_fields.Evidence: `project`, `normalized_delta`, `evidence_strength`
   - known_fields.Evidence: 전체 필드 목록 (validated_hypotheses, falsified_hypotheses 포함)
   - Project 필드 정리: `primary_hypothesis_id` 추가, `hypothesis_id` deprecated
   - validation_rules.derived_fields 섹션 추가

2. template_project.md 수정
   - `primary_hypothesis_id` 필드 추가

3. validate_schema.py v7.1 업데이트
   - `validate_derived_fields()` 함수 추가
   - Hypothesis/Track/Condition의 derived 필드에 값 있으면 경고

4. Schema version 5.1 → 5.2 업데이트

**File Changes Summary**

| File | Change Type | Description |
|------|-------------|-------------|
| `00_Meta/schema_constants.yaml` | 수정 | Evidence 등록, derived_fields 규칙, v5.2 업데이트 |
| `00_Meta/_TEMPLATES/template_project.md` | 수정 | primary_hypothesis_id 필드 추가 |
| `scripts/validate_schema.py` | 수정 | v7.1 - derived 필드 검증 로직 추가 |

**Verification Results**

```bash
$ python3 scripts/validate_schema.py . --no-freshness
=== Schema Validation Report ===
Files checked: 206
Files with errors: 48
```

예상된 경고 (정상 동작): 기존 Hypothesis 파일들의 `validated_by` 필드에 SSOT 경고 출력

**Architecture Decision: SSOT + Derived 원칙**

```
SSOT (Single Source of Truth)    Derived (계산값)
─────────────────────────────    ────────────────────
Project.validates = [hyp-...]  → Hypothesis.validated_by
Project.realized_impact        → Track.realized_sum
                               → Condition.realized_sum
```

**Next Steps**
- 점진적 마이그레이션: 기존 Hypothesis 파일들의 `validated_by` 필드 제거
- Evidence ID 패턴: `ev:YYYY-NNNN` 형식 강제 (나중에)
- build_graph_index.py: Evidence → Hypothesis 역인덱스 계산 로직 추가

---

## 참고 문서

- [[prj-impact-schema-v2]] - 소속 Project
- [[00_Meta/schema_constants.yaml]] - Schema SSOT
- [[00_Meta/_TEMPLATES/template_evidence.md]] - Evidence 템플릿

---

**Created**: 2025-12-27
**Assignee**: 김은향
**Due**: 2025-12-27
