---
entity_type: Project
entity_id: prj-impact-schema-v2
entity_name: Schema - Realized Impact 확장
created: 2025-12-27
updated: '2026-01-11'
status: doing
parent_id: trk-2
program_id: pgm-vault-system
aliases:
- prj-impact-schema-v2
- Schema - Realized Impact 확장
outgoing_relations: []
validates: []
validated_by: []
owner: 김은향
budget: null
deadline: null
hypothesis_text: Realized Impact에 time_range와 metrics_snapshot을 추가하면 A/B 비교가 재현 가능해진다
experiments: []
tier: enabling
impact_magnitude: mid
confidence: 0.75
condition_contributes:
- to: cond-b
  weight: 0.3
  description: 스키마 개선으로 데이터 품질 및 추적 가능성 향상
track_contributes: []
expected_impact:
  statement: 이 프로젝트가 성공하면 모든 프로젝트의 B(Realized) 점수가 시간 창 기반으로 비교 가능해진다
  metric: window_id 필드 적용률
  target: 신규 프로젝트 100% 적용
realized_impact:
  verdict: null
  outcome: null
  evidence_links: []
  decided: null
conditions_3y:
- cond-b
tags:
- schema
- impact
- palantir-lite
priority_flag: high
---
# Schema - Realized Impact 확장

> Project ID: `prj-impact-schema-v2` | Program: `pgm-vault-system` | Track: `trk-2` | Status: active

---

## 🏁 Project Rollup

> ⚠️ **프로젝트 종료 시 필수 작성** (진행 중에는 비워둠)

### Conclusion
<!-- 3줄 이내 핵심 결론 -->
1.
2.
3.

### Evidence
| # | Type | 근거 요약 | 링크 |
|---|------|----------|------|
| 1 | | | [[]] |
| 2 | | | [[]] |
| 3 | | | [[]] |

> Type: `task` | `meeting` | `experiment` | `decision` | `finance`

### Metric Delta
| Metric | Before | After | Δ | 판정 |
|--------|--------|-------|---|------|
| | | | | |

### Decision
- **Verdict**: `pending` → `go` | `no-go` | `pivot`
- **Next Action**:
- **Decided**:

---

## Project 가설

**"Realized Impact에 time_range와 metrics_snapshot을 추가하면 A/B 비교가 재현 가능해진다"**

---

## 배경

### 왜 이 프로젝트인가?

ChatGPT 조언에 따르면 현재 A/B 점수 구조는 좋지만, B(Realized)에 **시간 창(window)** 개념이 없어서:
- "언제 기준 결과인가?"가 불명확
- 같은 프로젝트도 사람마다 다른 기간 보고 B를 쓰게 됨
- Evidence 재현 가능성 떨어짐

### 현재 GAP

| 항목 | 조언 | 현재 | 상태 |
|------|------|------|------|
| time_range | 필수 | 없음 | ❌ GAP |
| window_id | 필수 | 없음 | ❌ GAP |
| metrics_snapshot | frontmatter | 본문만 | △ 구조화 필요 |
| 운영 리듬 | 정의 필요 | 없음 | ❌ GAP |

---

## 목표

### 성공 기준
1. `realized_impact`에 `time_range`, `window_id` 필드 추가
2. `Evidence` 템플릿에 동일 필드 추가
3. `build_impact.py`에서 window 기반 집계 가능

### 실패 신호
1. 기존 프로젝트와 호환성 깨짐
2. 스키마 복잡도가 과도하게 증가

---

## 실행 계획

### Phase 1: 스키마 확장
- [ ] schema_constants.yaml 필드 추가
- [ ] template_project.md 수정
- [ ] template_evidence.md 수정

### Phase 2: 스크립트 업데이트
- [ ] build_impact.py window 지원
- [ ] impact_model_config.yml 운영 리듬 정의

---

## Tasks

| ID | Name | Assignee | Status | Due |
|----|------|----------|--------|-----|
| tsk-impact-schema-v2-01 | Impact - Realized 필드 확장 | 김은향 | done | 2025-12-27 |
| tsk-impact-schema-v2-02 | build_impact.py window 지원 (Phase 2) | 김은향 | doing | 2025-12-27 |
| tsk-impact-schema-v2-03 | Hypothesis-Evidence 연결 설계 | 김은향 | done | 2025-12-27 |

---

## 참고 문서

- [[trk-2]] - 소속 Track (Data)
- [[pgm-vault-system]] - 소속 Program
- [[impact_model_config.yml]] - Impact 모델 설정

---

**Created**: 2025-12-27
**Owner**: 김은향
