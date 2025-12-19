# LOOP Project Impact A/B Model — Implementation Spec

**Project**: LOOP Dashboard Impact Tracking
**Version**: 1.0.0
**Last Updated**: 2025-12-19
**Status**: Ready to Implement

---

## 0. 절대 원칙 (Implementation Lock)

1. **Impact는 Project 단위에서만 측정한다**
2. Task에는 Impact 계산 로직이 없다
3. LLM은 "계산 근거와 원천값"만 제안한다
4. 점수 계산/롤업은 서버 코드가 결정적으로 수행한다
5. 사용자는 항상 **Preview → Accept** 단계를 거친다

---

## 1. 전체 시스템 아키텍처

```
[Dashboard UI]
   └─ [New Project]
        └─ [Auto-fill Project Impact]  ← 버튼
              ↓
          [API Server]
              ↓
     (Vault Index / Graph 탐색)
              ↓
           [LLM]
              ↓
        Impact Proposal
              ↓
       Preview / Accept
              ↓
         Project 저장
              ↓
     build_graph / build_impact
              ↓
      Dashboard Roll-up
```

---

## 2. Project 생성 UX

### 사용자가 입력하는 최소 정보
- Project title
- Project description (2~3줄)
- Track 선택
- 관련 3Y Condition 1개 이상 선택

### UI 버튼
- **[Auto-fill Project Impact]**

> 이 버튼을 누르는 순간부터 아래 흐름이 자동으로 시작된다.

---

## 3. Auto-fill Project Impact — API 흐름

### 3.1 API Endpoint

```
POST /api/projects/autofill-impact
```

### 3.2 Request (Dashboard → API)

```json
{
  "title": "외부 비서 채용 시스템 구축",
  "description": "대표 운영 업무를 위임할 외부 비서 채용 프로세스 구축",
  "track_id": "TR-Operations",
  "condition_ids": ["C3-B"],
  "context": {
    "northstar_id": "NS-2035",
    "impact_model_version": "IM-2025-01"
  }
}
```

---

## 4. API 내부 동작 (문서 탐색 로직)

> **중요**: LLM이 vault를 직접 뒤지지 않는다.
> API가 이미 정리된 인덱스/그래프를 사용해 **관련 문서만 추출**한다.

### API가 참조하는 내부 자산

| 파일 | 용도 |
|------|------|
| `_build/index.json` | 각 문서의 요약, type, id, metrics, weight 정보 |
| `_build/graph.json` | Project ↔ Condition ↔ NorthStar 관계 그래프 |
| `impact_model_config.yml` | magnitude_points, metric_ranges 등 |

### API가 구성하는 LLM Context

- 선택된 Condition(C3-B)의:
  - 정의
  - metrics
  - weight_to_northstar
- 연결된 NorthStar(NS-2035)의:
  - 비전 요약 (1~2문장)
- 선택된 Track 요약
- 과거 유사 Project(있다면) 요약

---

## 5. LLM 호출 (핵심)

### LLM의 역할 (엄격히 제한됨)

LLM은 **다음 값만 제안**한다:
- Project tier (strategic / enabling / operational)
- impact_magnitude
- confidence
- contributes[{to, weight, mechanism}]
- Impact rationale (근거 설명)
- Measurement plan 초안

❌ LLM은 점수를 직접 계산하지 않는다
❌ LLM은 저장을 직접 수행하지 않는다

### LLM Response 예시

```json
{
  "tier": "enabling",
  "impact_magnitude": "mid",
  "confidence": 0.8,
  "contributes": [
    {
      "to": "C3-B",
      "weight": 0.3,
      "mechanism": "운영 부담 감소로 전략 실행 속도 개선"
    }
  ],
  "rationale": {
    "magnitude_reason": "전략 실행 자체를 가속하는 기반 프로젝트",
    "confidence_reason": "채용 성공 가능성이 높고 실행 리스크가 낮음",
    "measurement_plan": "채용 완료 후 대표 주당 운영 시간 절감 관측"
  }
}
```

---

## 6. Dashboard Preview / Accept 단계 (필수)

### UI에서 보여줘야 할 것
- Tier
- impact_magnitude / confidence
- contributes (Condition + weight)
- 근거 텍스트
- ⚠️ 경고:
  - "이 Project는 KPI 직접 측정 대상이 아닙니다" (enabling일 경우)

### 사용자 선택
- **Accept** → 저장 진행
- **Edit** → 수정 후 저장
- **Cancel** → 폐기

---

## 7. Project 저장 스키마 (정본)

```yaml
---
type: project
id: P-External-Assistant-Hiring
title: "외부 비서 채용 시스템 구축"

tier: enabling
track: TR-Operations

contributes:
  - to: C3-B
    weight: 0.3
    mechanism: "운영 부담 감소로 전략 실행 속도 개선"

northstar: [NS-2035]

impact_magnitude: mid
confidence: 0.8

realized_status: planned
evidence: []

created: 2025-01-10
updated: 2025-01-10
---
## Impact Rationale
- Magnitude: 전략 실행 가속을 위한 기반 프로젝트
- Confidence: 실행 가능성 높음
- Measurement: 채용 완료 후 주당 업무 시간 절감 관측
```

---

## 8. Task 생성 (Impact 상속)

```yaml
---
type: task
id: T-2025-0341
title: "공고용 업무·요건 문단 작성"

project: P-External-Assistant-Hiring
status: todo
stage: plan

created: 2025-01-12
updated: 2025-01-12
---
```

> Task에는 Impact 필드가 **절대 없다**

---

## 9. Evidence → Realized(B) 업데이트

### Evidence 생성 시

```yaml
---
type: evidence
id: E-2025-0112
project: P-External-Assistant-Hiring

summary: "비서 채용 완료, 대표 주당 5시간 절감"

normalized_delta: 0.5
evidence_strength: medium
attribution_share: 0.7

created: 2025-03-01
---
```

### 서버 동작
- RealizedScore 계산
- Project.realized_status 갱신
- `_build/impact.json` 재생성

---

## 10. 대시보드 롤업

### Project Table

| Column | Description |
|--------|-------------|
| Project | 프로젝트명 |
| Tier | strategic / enabling / operational |
| Expected | Expected Impact Score |
| Realized | Realized Impact Score |
| Condition | 연결된 Condition |
| Status | 진행 상태 |

### Condition Roll-up
- ExpectedSum
- RealizedSum
- Enabling vs Strategic 분포

---

## 11. 왜 이 구조가 깨지지 않는가

1. LLM은 **판단만**, 서버는 **결정적 계산**
2. Impact는 Project에만 존재 → 노이즈 없음
3. Task는 아무리 작아도 문제 없음
4. 전략 변경 시 Project만 재계산하면 됨

---

## 12. 점수 계산 공식

### Expected Score (A)

```
ExpectedScore = magnitude_points[impact_magnitude] × confidence
```

**magnitude_points**:
| Tier | high | mid | low |
|------|------|-----|-----|
| strategic | 10 | 6 | 3 |
| enabling | 5 | 3 | 1.5 |
| operational | 2 | 1 | 0.5 |

### Realized Score (B)

```
RealizedScore = normalized_delta × strength_mult × attribution_share
```

**strength_mult**:
| evidence_strength | multiplier |
|-------------------|------------|
| strong | 1.0 |
| medium | 0.7 |
| weak | 0.4 |

---

## 13. 필수 빌드 산출물

| 파일 | 생성 스크립트 | 용도 |
|------|---------------|------|
| `_build/graph.json` | `build_graph_index.py` | Entity 관계 그래프 |
| `_build/index.json` | `build_index.py` | LLM용 문서 요약 |
| `_build/impact.json` | `build_impact.py` | Project별 A/B 점수 |

---

## 한 줄 결론

> **Project에서만 Impact를 계산한다.
> 버튼 하나로 LLM이 근거를 제안하고,
> 사람은 승인하고,
> 시스템은 계산하고 롤업한다.**

---

**Version**: 1.0.0
**Author**: LOOP Team
