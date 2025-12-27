---
entity_type: Task
entity_id: tsk-impact-schema-v2-01
entity_name: "Impact - Realized 필드 확장"
created: 2025-12-27
updated: 2025-12-27
status: doing

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
conditions_3y: ["cond-b"]

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

- [ ] `schema_constants.yaml` - realized_impact 필드 확장
- [ ] `template_project.md` - 신규 필드 추가
- [ ] `template_evidence.md` - time_range, window_id 추가
- [ ] `impact_model_config.yml` - 평가 윈도우 규칙 추가
- [ ] `build_impact.py` - window 정보 출력 (선택)
- [ ] 기존 프로젝트 호환성 테스트

---

## Notes

### Todo
- [ ] 스키마 변경
- [ ] 템플릿 업데이트
- [ ] 스크립트 수정
- [ ] 검증

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)
-->


---

## 참고 문서

- [[prj-impact-schema-v2]] - 소속 Project
- [[00_Meta/schema_constants.yaml]] - 스키마 SSOT
- [[impact_model_config.yml]] - Impact 모델 설정

---

**Created**: 2025-12-27
**Assignee**: 김은향
**Due**: 2025-12-27
