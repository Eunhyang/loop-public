---
entity_type: Task
entity_id: "tsk-impact-schema-v2-02"
entity_name: "build_impact.py window 지원 (Phase 2)"
created: 2025-12-27
updated: 2025-12-27
status: done

# === 계층 ===
parent_id: "prj-impact-schema-v2"
project_id: "prj-impact-schema-v2"
aliases: ["tsk-impact-schema-v2-02"]

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
# === 분류 ===
tags: ["schema", "impact", "build-script"]
priority_flag: medium
---

# build_impact.py window 지원 (Phase 2)

> Task ID: `tsk-impact-schema-v2-02` | Project: `prj-impact-schema-v2` | Status: done

## 목표

**완료 조건**:
1. `build_impact.py`에서 window_id, time_range 정보를 JSON 출력에 포함
2. `/retro` 커맨드에서 window 자동 채우기 연동

---

## 상세 내용

### 배경

Phase 1에서 스키마에 window_id, time_range, metrics_snapshot 필드를 추가했습니다.
Phase 2에서는 이 필드들을 실제로 활용하는 스크립트와 커맨드를 구현합니다.

### 작업 내용

1. **build_impact.py 수정**
   - Project의 realized_impact에서 window_id, time_range 읽기
   - JSON 출력에 window 정보 포함
   - window별 집계 옵션 추가 (선택)

2. **/retro 커맨드 연동**
   - Evidence 생성 시 window_id 자동 계산
   - impact_model_config.yml의 auto_fill 규칙 적용
   - base_date fallback: decided → updated → today

---

## 체크리스트

- [x] build_impact.py: window 필드 파싱
- [x] build_impact.py: JSON 출력에 window 포함
- [x] /retro 커맨드: window_id 자동 채우기
- [x] /retro 커맨드: time_range 자동 계산
- [x] 테스트: 샘플 프로젝트로 검증

---

## Notes

### 핵심 원칙: SSOT + Derived

| 레벨 | SSOT (저장) | Derived (계산) |
|------|-------------|----------------|
| **Project** | `realized_impact.B` @ 월간 window | - |
| **Track** | ❌ 저장 안 함 | `Track.B @ 분기` = 해당 분기 Project.B 롤업 |
| **Condition** | ❌ 저장 안 함 | `Condition.B @ 반기` = 해당 반기 롤업 |

### PRD/Tech Spec

#### 1. build_impact.py 수정

**1.1 build_project_impact() - window 필드 읽기**
```python
# realized_impact에서 v5.2 필드 읽기
realized_impact = fm.get("realized_impact", {})
window_id = realized_impact.get("window_id")
time_range = realized_impact.get("time_range")
metrics_snapshot = realized_impact.get("metrics_snapshot", {})

# record에 추가
"window_id": window_id,
"time_range": time_range,
"metrics_snapshot": metrics_snapshot,
```

**1.2 calculate_track_rollup() - window 기반 집계**
- 분기 window로 Project.B 집계
- window_id 파싱: YYYY-MM → YYYY-QN 변환
- 해당 분기에 속하는 Project만 롤업

**1.3 calculate_condition_rollup() - window 기반 집계**
- 반기 window로 Track.B 집계
- window_id 파싱: YYYY-QN → YYYY-HN 변환

**1.4 Summary 추가**
```python
"projects_with_window": len([p for p in project_records if p.get("window_id")]),
```

#### 2. /retro 스킬 - window 자동 채우기

**base_date 우선순위:**
1. `realized_impact.decided`
2. 문서 `updated`
3. 오늘 날짜 (fallback)

**window_id 생성:**
- Evidence: YYYY-MM (월간)
- 예: 2025-12-27 → "2025-12"

**time_range 계산:**
- "2025-12" → "2025-12-01..2025-12-31"

#### 3. 스키마 문서화

```yaml
# Track/Condition realized_impact: derived field (do not store)
# 계산 시점: build_impact.py 실행 시
# 계산 방식: 하위 엔티티의 확정된 B를 해당 window로 묶어 집계
```

### 작업 로그

#### 2025-12-27 완료
**개요**: build_impact.py v1.3.0에 window 기반 집계 기능을 추가하고, SSOT + Derived 원칙을 문서화했습니다. Codex 검증 후 월 범위 검증 및 다중 포맷 지원 버그를 수정했습니다.

**변경사항**:
- 개발:
  - `scripts/build_impact.py`: window 헬퍼 함수 추가 (parse_window_id, month_to_quarter, month_to_half)
  - Track rollup: realized_by_quarter 집계 (월/분기 포맷 모두 처리)
  - Condition rollup: realized_by_half 집계 (월/분기/반기 포맷 모두 처리)
- 수정:
  - 월 범위 검증 추가 (1-12 범위 체크, 2025-13 같은 잘못된 값 거부)
  - Track rollup에서 quarter 포맷 window_id 직접 처리 추가
  - Condition rollup에서 month/quarter/half 포맷 모두 처리 추가
- 개선:
  - `00_Meta/schema_constants.yaml`에 SSOT + Derived 원칙 문서화
  - `/retro` 스킬에 window_id 자동 계산 로직 추가

**핵심 코드**:
```python
# Track rollup - 분기별 집계
for prj in track_projects:
    window_id = prj.get("window_id")
    parsed = parse_window_id(window_id)
    if parsed and parsed["format"] == "month":
        quarter = month_to_quarter(parsed["month"])
        quarter_key = f"{parsed['year']}-Q{quarter}"
        realized_by_quarter[quarter_key] += prj.get("realized_score", 0)
    elif parsed and parsed["format"] == "quarter":
        quarter_key = f"{parsed['year']}-Q{parsed['quarter']}"
        realized_by_quarter[quarter_key] += prj.get("realized_score", 0)
```

**결과**: ✅ 빌드 성공 (24 projects, 7 tracks, 3 conditions with rollup)

**다음 단계**:
- 실제 Project에 realized_impact.window_id 설정 후 집계 테스트
- /retro 커맨드로 Evidence 생성 시 window 자동 채우기 검증


---

## 참고 문서

- [[prj-impact-schema-v2]] - 소속 Project
- [[tsk-impact-schema-v2-01]] - Phase 1 Task
- [[impact_model_config.yml]] - Window 규칙 정의

---

**Created**: 2025-12-27
**Assignee**: 김은향
**Due**: 2025-12-27
