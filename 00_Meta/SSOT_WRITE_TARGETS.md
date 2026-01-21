---
entity_type: Meta
entity_id: meta:ssot-write-targets
entity_name: SSOT Write Targets Reference
created: 2026-01-21
updated: 2026-01-21
tags: [meta, ssot, derived, auto-generated]
---

# SSOT Write Targets

> **DO NOT EDIT** - Auto-generated from `schema_constants.yaml`
> 
> Run: `python3 scripts/build_ssot_docs.py`

**Schema Version**: 5.11
**Generated**: 2026-01-21 14:21:20

---

## Overview

이 문서는 API를 통해 수정 가능한 필드 목록입니다.
SSOT는 `schema_constants.yaml`의 `write_targets.writable_fields` 섹션입니다.

---

## Hypothesis

### Writable Fields (API 수정 가능)

- `status`
- `evidence_status`
- `confidence`
- `start_date`
- `deadline`
- `notes`

### Read-Only Fields (API 수정 불가)

- `aliases`
- `attachments`
- `conditions_3y`
- `created`
- `entity_id`
- `entity_name`
- `entity_type`
- `failure_criteria`
- `horizon`
- `hypothesis_question`
- `hypothesis_text`
- `links`
- `loop_layer`
- `measurement`
- `outgoing_relations`
- `parent_id`
- `priority_flag`
- `success_criteria`
- `tags`
- `updated`
- `validated_by`
- `validates`

---

## Project

### Writable Fields (API 수정 가능)

- `status`
- `owner`
- `start_date`
- `deadline`
- `summary`
- `expected_impact`
- `realized_impact`
- `notes`

### Read-Only Fields (API 수정 불가)

- `aliases`
- `attachments`
- `budget`
- `condition_contributes`
- `conditions_3y`
- `created`
- `cycle`
- `entity_id`
- `entity_name`
- `entity_type`
- `experiments`
- `hypothesis_id`
- `hypothesis_text`
- `links`
- `outgoing_relations`
- `parent_id`
- `primary_hypothesis_id`
- `priority_flag`
- `program_id`
- `tags`
- `track_contributes`
- `updated`
- `validated_by`
- `validates`

---

## Task

### Writable Fields (API 수정 가능)

- `status`
- `assignee`
- `due`
- `priority`
- `start_date`
- `closed`
- `estimated_hours`
- `actual_hours`
- `notes`

### Read-Only Fields (API 수정 불가)

- `aliases`
- `archived_at`
- `attachments`
- `candidate_id`
- `closed_inferred`
- `conditions_3y`
- `created`
- `entity_id`
- `entity_name`
- `entity_type`
- `has_exec_details`
- `links`
- `outgoing_relations`
- `parent_id`
- `priority_flag`
- `project_id`
- `tags`
- `target_project`
- `type`
- `updated`
- `validated_by`
- `validates`

---

## Validation

### API 검증 흐름

```
1. known_fields 체크 → 알 수 없는 필드 거부 (400 UNKNOWN_FIELD)
2. writable_fields 체크 → 읽기 전용 필드 거부 (400 WRITE_TARGET_VIOLATION)
```

### 일관성 검증

```python
from shared.ssot_loader import validate_writable_subset
validate_writable_subset()  # writable ⊆ known 검증
```

---

**Source**: `00_Meta/schema_constants.yaml`
