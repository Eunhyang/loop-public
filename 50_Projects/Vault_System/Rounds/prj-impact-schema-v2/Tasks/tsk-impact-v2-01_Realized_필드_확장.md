---
entity_type: Task
entity_id: tsk-impact-schema-v2-01
entity_name: "Impact - Realized 필드 확장"
created: 2025-12-27
updated: 2025-12-27
closed: 2025-12-27
status: done

# === 계층 ===
parent_id: prj-impact-schema-v2
project_id: prj-impact-schema-v2
aliases:
  - tsk-impact-schema-v2-01
  - "Impact - Realized 필드 확장"

# === 관계 ===
outgoing_relations: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2025-12-27
due: 2025-12-27
priority: high
estimated_hours: 4
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===
# === 분류 ===
tags: ["schema", "impact", "dev"]
priority_flag: high
---

# Impact - Realized 필드 확장

> Task ID: `tsk-impact-schema-v2-01` | Project: `prj-impact-schema-v2` | Status: doing

## 목표

**완료 조건**:
1. `realized_impact`에 `time_range`, `window_id`, `metrics_snapshot` 필드 추가
2. `template_evidence.md`에 동일 필드 추가
3. `impact_model_config.yml`에 운영 리듬(평가 주기) 정의
4. `build_impact.py`에서 window 정보 출력

---

## 상세 내용

### 배경

ChatGPT 조언 분석 결과, 현재 A/B 점수 구조에서 누락된 핵심 요소:

**GAP 1: time_range / window_id 부재**
```yaml
# 현재 (문제)
realized_impact:
  verdict: null
  outcome: null
  evidence_links: []
  decided: null    # 결정일만 있고 "어떤 기간의 결과인지" 없음

# 목표 (개선)
realized_impact:
  verdict: null
  outcome: null
  evidence_links: []
  decided: null
  window_id: "2025-12"           # 신규
  time_range: "2025-12-01..2025-12-31"  # 신규
  metrics_snapshot:              # 신규
    retention_d7: 0.42
    nps: 38
```

**GAP 2: 운영 리듬 미정의**
- Project: 월간 평가
- Track: 분기 평가
- Condition: 반기 평가

---

## 체크리스트

- [x] `schema_constants.yaml` - realized_impact 필드 확장 (line 348, 447-456)
- [x] `template_project.md` - 신규 필드 추가 (line 53-63)
- [x] `template_evidence.md` - time_range, window_id 추가 (line 26-31)
- [x] `impact_model_config.yml` - evaluation_windows + status_mapping + metrics_snapshot 제약
- [ ] `build_impact.py` - window 정보 출력 (Phase 2로 이관)
- [x] 기존 프로젝트 호환성 테스트 - optional 필드로 마이그레이션 불필요

---

## Notes

### 완료된 작업 (2025-12-27)

**Phase 1: 스키마 확장**
- schema_constants.yaml:348 - summary 블록에 window_id, time_range, metrics_snapshot 추가
- schema_constants.yaml:447-456 - realized_impact 상세 정의 확장

**Phase 2: 템플릿 업데이트**
- template_project.md - realized_impact에 3개 신규 필드 추가
- template_evidence.md - window_id, time_range 필드 추가

**Phase 3: Config 정의**
- impact_model_config.yml v1.2.0:
  - evaluation_windows (defaults, auto_fill, warnings)
  - status_mapping (realized_status → verdict/outcome)
  - metrics_snapshot 제약 (scalar types, max 20 keys)

**Codex Review 반영**
- template 주석에 weekly(YYYY-WNN) 포맷 추가

### 작업 로그

**2025-12-27 - v5.2 스키마 확장 완료**
- ChatGPT 조언 기반 GAP 분석: time_range, window_id, metrics_snapshot 부재 확인
- Codex-Claude Loop으로 Plan 검증 및 구현
- 모든 스키마/템플릿/설정 파일 업데이트 완료
- 기존 프로젝트 호환성: optional 필드로 마이그레이션 불필요


---

## 참고 문서

- [[prj-impact-schema-v2]] - 소속 Project
- [[00_Meta/schema_constants.yaml]] - 스키마 SSOT
- [[impact_model_config.yml]] - Impact 모델 설정

---

**Created**: 2025-12-27
**Assignee**: 김은향
**Due**: 2025-12-27
