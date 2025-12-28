---
entity_type: Task
entity_id: "tsk-impact-schema-v2-05"
entity_name: "Schema - Derived 필드 롤업 로직 완성"
created: 2025-12-28
updated: 2025-12-28
status: doing

# === 계층 ===
parent_id: "prj-impact-schema-v2"
project_id: "prj-impact-schema-v2"
aliases: ["tsk-impact-schema-v2-05"]

# === 관계 ===
outgoing_relations: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2025-12-28
due: 2025-12-28
priority: medium
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-b"]

# === 분류 ===
tags: ["build_impact", "derived-fields", "rollup"]
priority_flag: high
---

# Schema - Derived 필드 롤업 로직 완성

> Task ID: `tsk-impact-schema-v2-05` | Project: `prj-impact-schema-v2` | Status: doing

## 목표

**완료 조건**:
1. `Track.realized_by_quarter`에 secondary 프로젝트 포함 (weight 반영)
2. ~~`Condition.realized_by_half`~~ ✅ 이미 구현됨 (month/quarter/half 포맷 지원)
3. `python3 scripts/build_impact.py .` 정상 실행
4. `_build/impact.json`에서 Track 롤업 결과 확인

---

## 상세 내용

### 배경

Schema v5.2에서 Derived 필드 정의 완료 후, `build_impact.py`의 분기/반기 롤업 로직에 미완성 부분 발견:

| Derived 필드 | 현재 상태 | 수정 필요 |
|-------------|----------|----------|
| `Track.realized_by_quarter` | primary만 집계 | **secondary 포함** |
| `Condition.realized_by_half` | month만 처리 | **quarter/half 포맷 지원** |

### 작업 내용

#### 1. Track.realized_by_quarter 수정
- 분기 버킷에 `track_contributes[]` secondary 프로젝트 포함
- weight 반영: `B(prj) × weight(prj→trk)`

#### 2. Condition.realized_by_half 수정
- window_id 포맷 일반화:
  - `YYYY-MM` → month ∈ half 매칭
  - `YYYY-QN` → Q1/Q2=H1, Q3/Q4=H2
  - `YYYY-HN` → 동일 반기 매칭

---

## 체크리스트

- [x] build_impact.py 현재 로직 분석
- [ ] Track.realized_by_quarter에 secondary 추가 (weight 반영)
- [x] ~~Condition.realized_by_half~~ 이미 구현됨 (수정 불필요)
- [ ] script_version → "1.3.1" 업데이트
- [ ] 테스트: `python3 scripts/build_impact.py .`
- [ ] _build/impact.json 결과 검증

---

## Notes

### PRD (Product Requirements Document)

**프로젝트 컨텍스트**:
- Script: `scripts/build_impact.py` v1.3.0
- Config: `impact_model_config.yml` v1.2.0
- Pattern: SSOT 원칙 (Project에만 데이터 저장, Track/Condition은 Derived)
- Output: `_build/impact.json`

**수정 대상 분석**:

| 이슈 | 위치 | 현재 상태 | 수정 필요 |
|------|------|----------|----------|
| Track.realized_by_quarter | `calculate_track_rollup()` L548-564 | primary만 집계 | **secondary 포함** |
| Condition.realized_by_half | `calculate_condition_rollup()` L463-483 | ✅ 이미 구현됨 | 수정 불필요 |

**결론**: Track.realized_by_quarter만 수정 필요

### Tech Spec

**수정 파일**: `scripts/build_impact.py`
**수정 위치**: `calculate_track_rollup()` 함수, L567-587 (Secondary Track 처리 블록)

**수정 내용**:
1. Secondary Track 처리 블록에 분기별 집계 로직 추가
2. secondary_projects에 window_id 필드 추가
3. weight 반영: `project["realized_score"] * weight`
4. script_version → "1.3.1" 업데이트

**수정 코드**:
```python
# Secondary Track 처리
for tc in track_contributes:
    # ... 기존 코드 ...
    if policy["include_in_rollup"]:
        # ... 기존 코드 ...
        rollup[track_id]["secondary_projects"].append({
            # ... 기존 필드 ...
            "window_id": window_id,  # v5.2 추가
        })

        # v5.2: Secondary Track도 분기별 집계 (weight 반영)
        if parsed_window:
            quarter_key = None
            if parsed_window["format"] == "month":
                quarter = month_to_quarter(parsed_window["month"])
                quarter_key = f"{parsed_window['year']}-Q{quarter}"
            elif parsed_window["format"] == "quarter":
                quarter_key = f"{parsed_window['year']}-Q{parsed_window['quarter']}"

            if quarter_key:
                if quarter_key not in rollup[track_id]["realized_by_quarter"]:
                    rollup[track_id]["realized_by_quarter"][quarter_key] = {
                        "sum": 0.0,
                        "projects": [],
                    }
                rollup[track_id]["realized_by_quarter"][quarter_key]["sum"] += project["realized_score"] * weight
                rollup[track_id]["realized_by_quarter"][quarter_key]["projects"].append(project["id"])
```

### Todo
- [ ] calculate_track_rollup() 함수에서 Secondary Track 분기 집계 추가
- [ ] secondary_projects에 window_id 필드 추가
- [ ] script_version → "1.3.1" 업데이트
- [ ] 테스트: python3 scripts/build_impact.py .
- [ ] impact.json 결과 검증

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

- [[prj-impact-schema-v2]] - 소속 Project
- [[impact_model_config.yml]] - Impact 모델 설정
- [[build_impact.py]] - 수정 대상 스크립트

---

**Created**: 2025-12-28
**Assignee**: 김은향
**Due**: 2025-12-28
