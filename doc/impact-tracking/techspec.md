# LOOP Vault Impact Tracking v0.1

> Expected Impact / Realized Impact 기반 "비전-전략-프로젝트-가설-태스크" 추적 & 수치화 설계

이 문서는 현재 LOOP Obsidian vault 구조(North Star / Strategy / Projects / Meta / Graph scripts)를 유지하면서,
칸반(태스크 단위)에서 비전/전략 연계성을 끝까지 추적하고 영향도를 수치로 롤업하기 위한 **구현 가능한** 운영/스키마/파이프라인을 정리한 스펙이다.

---

## 0. 목표 (What & Why)

### 우리가 만들고 싶은 것

1. 모든 태스크(Task)가 상위 전략(3Y Conditions)과 비전(North Star)에 **반드시 연결**된다.
2. 각 태스크는 **Expected**(될 것 같은 기여)와 **Realized**(실제로 일어난 기여)를 가진다.
3. 이 점수는 **Condition(3Y) → North Star(10Y)**까지 자동 롤업된다.
4. 사람은 칸반에서 카드(태스크)를 보면서 **우선순위/집중/학습**을 한눈에 본다.
5. LLM은 Vault에 진입하면 `_ENTRY_POINT.md`와 `_Graph_Index.md`를 기반으로 전역 맥락을 빠르게 로딩하고, query recipe대로 누락 없이 추적한다.

---

## 1. 전제: 현재 Vault 구조에서 "최소 변경" 원칙

### 현재 레포에서 확인되는 핵심 뼈대 (이미 존재)

```
01_North_Star/…                    # 10년 비전/상위 문서
20_Strategy/3Y_Conditions/…        # + _INDEX.md
20_Strategy/12M_Tracks/…
50_Projects/…
00_Meta/schema_registry.md
00_Meta/relation_types.md
00_Meta/query_recipes.md
00_Meta/_TEMPLATES/                # template_task.md, template_condition.md, etc.
scripts/                           # build_graph_index.py, validate_schema.py, etc.
_ENTRY_POINT.md, _Graph_Index.md, _Dashboard.md
```

### 따라서 "점수화(Impact)"는 3단만 하면 된다

1. **템플릿(frontmatter) 확장**
2. **검증 규칙 추가**
3. **그래프/대시보드 생성 스크립트 확장**

---

## 2. 온톨로지(객체 타입) - 팔란티어식 Object/Relation 최소 세트

### 핵심 객체 타입 (type)

| type | 설명 |
|------|------|
| `northstar` | 10년 비전 (절대 좌표) |
| `condition` | 3년 전략 조건 (3Y Condition) |
| `track` | 12개월 트랙 (운영 단위) |
| `project` | 프로젝트 |
| `hypothesis` | 가설 |
| `task` | 최소 실행 단위 (칸반 카드) |
| `evidence` | 증거 (데이터/로그/분석/실험결과) |

### 필수 관계 (추적 경로)

```
task -> hypothesis -> project -> condition(3y) -> northstar(10y)
```

**운영 안정성을 위해 중복 경로 권장:**
- `task -> condition(3y)` 직접 링크도 반드시 둔다
- `project -> condition(3y)`도 둔다

> 그래야 링크 하나가 빠져도 추적이 무너지지 않는다.

---

## 3. 점수 모델 (Impact Model) - Expected / Realized 이중 점수

### A. Expected Impact (사전 점수)

**목적**: 실행 전/중에 "우선순위/집중"을 정렬하기 위한 점수
**성격**: 계획 기반(추정치), 운영을 위한 선행지표

#### Expected 구성요소 (최소)

| 필드 | 타입 | 설명 |
|------|------|------|
| `impact_magnitude` | `small \| mid \| large` | 영향 크기 |
| `confidence` | `0.0 ~ 1.0` | 확신도 |
| `contributes[]` | array | 어떤 3Y Condition에 얼마나 기여하는지 |

#### ExpectedScore 계산 (권장 기본식)

```
MagnitudePoints: small=20, mid=50, large=80
ExpectedScore = MagnitudePoints * confidence
```

> 이 점수는 "맞추기"가 아니라 "같은 기준으로 판단"하게 만드는 게 목표다.

### B. Realized Impact (사후 점수, Evidence 기반)

**목적**: 실행 후 "실제로 무엇이 바뀌었고 무엇을 배웠는지"를 축적하는 점수
**성격**: 증거 기반(업데이트 가능), 학습 자산을 위한 후행지표

#### Realized는 KPI만으로 만들면 망가진다 (그래서 4층 구조)

| 층 | 설명 |
|----|------|
| **Output** | 산출물 (했냐/안했냐) |
| **Outcome** | 즉시 관측 가능한 직접 결과 (행동/신호 변화) |
| **Impact** | KPI/전략 지표 변화 (지연 존재) |
| **EvidenceStrength** | "이 결과가 우리 태스크 때문이라고 말할 수 있는 정도" |

#### EvidenceStrength 등급 (최소 3단계)

| 등급 | 계수 | 설명 |
|------|------|------|
| `weak` | 0.3 | 정성/관찰/상관 수준 |
| `medium` | 0.6 | 전후 비교, cohort 비교, 재현 가능한 로그 |
| `strong` | 1.0 | A/B, 명확한 counterfactual, 반복 재현 |

#### RealizedScore 계산 (권장 기본식)

```
RealizedScore = NormalizedMetricDelta * EvidenceStrength * AttributionShare
```

| 용어 | 설명 |
|------|------|
| `NormalizedMetricDelta` | 지표 변화량을 목표 범위로 정규화한 값 (0~1 또는 음수 허용) |
| `EvidenceStrength` | weak/medium/strong → 0.3/0.6/1.0 |
| `AttributionShare` | 기여 비중 (0~1). 여러 태스크가 동시에 영향 주면 과대평가 방지용 |

> **중요**: Realized는 태스크 완료 시점에 1회로 끝나지 않는다.
> Evidence가 추가될 때마다 업데이트되어야 한다. (예: 1주 후 Outcome 업데이트, 4주 후 KPI 업데이트, A/B 완료 후 strength 상승)

---

## 4. 롤업 (Trace & Roll-up) - 태스크 점수를 비전까지 올리는 방식

### 4.1 태스크 → 3Y Condition 기여도

태스크가 여러 Condition에 기여할 수 있으므로 `contributes[]`로 분해한다.

```
TaskToConditionScore_expected = ExpectedScore * contributes.weight
TaskToConditionScore_realized = RealizedScore * contributes.weight
```

**규칙 (권장)**:
- `sum(contributes.weight) == 1.0` (중복 카운팅 방지)
- 최소 1개 Condition에 기여해야 한다

### 4.2 3Y Condition → North Star 기여도

Condition이 비전에 얼마나 직접 중요한지 `weight_to_northstar`로 둔다.

```
TaskToNorthStarScore_expected = TaskToConditionScore_expected * Condition.weight_to_northstar
TaskToNorthStarScore_realized = TaskToConditionScore_realized * Condition.weight_to_northstar
```

> 이렇게 하면 "태스크 한 장"이 3년 전략 및 10년 비전에 미치는 영향이 수치로 연결된다.

---

## 5. 필수 스키마 (Frontmatter) - 구현 가능한 최소 필드

> **중요**: field 이름을 통일해야 LLM/스크립트/Dataview가 안정적으로 작동한다.

### 5.1 Condition (3Y Condition) 템플릿

**저장 위치**: `20_Strategy/3Y_Conditions/Condition_*.md`

```yaml
---
type: condition
id: C3-B
title: "Condition B: Loop Dataset"
northstar: [NS-2035]
weight_to_northstar: 0.7

owner: TBD
status: active  # active|paused|done
metrics: [M-DatasetCoverage, M-LoopPrediction]
definition_of_done: TBD

created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

### 5.2 Task 템플릿 (칸반 카드) - Expected 포함

**저장 위치 (권장)**: `60_Tasks/YYYY/…` (없으면 신설 권장)

```yaml
---
type: task
id: T-2025-0001
title: "TBD"

track: TR-2-Data
project: P001_Ontology
hypotheses: [H-2025-0003]

# 전략/비전 연결 (필수)
contributes:
  - to: C3-B
    weight: 1.0
    mechanism: "TBD (왜 이 태스크가 Condition에 기여하는지 1줄)"
northstar: [NS-2035]  # (선택) 직접 표기해도 됨

# Kanban
status: todo  # todo|doing|done
stage: plan   # plan|run|analyze|ship
owner: TBD

# Expected Impact (사전)
impact_magnitude: mid   # small|mid|large
confidence: 0.6         # 0.0~1.0

# Realized Impact (사후) - 태스크 자체에 "요약만" 둔다
realized_status: unknown  # unknown|positive|neutral|negative
evidence: []              # [E-2025-0007, ...]

created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

### 5.3 Evidence 템플릿 - Realized의 본체 (증거 객체)

**저장 위치 (권장)**: `70_Evidence/YYYY/…` (없으면 신설 권장)

```yaml
---
type: evidence
id: E-2025-0007
title: "Evidence for T-2025-0001"

task: T-2025-0001
condition: C3-B
northstar: NS-2035

# 4층 구조
output_done: true
outcome_summary: "TBD"
impact_metric: M-DatasetCoverage
metric_delta: TBD          # 원시 변화량 (예: +0.8pp)
normalized_delta: TBD      # 정규화 (예: 0.32) / 음수 가능
window: "YYYY-MM-DD~YYYY-MM-DD"

# Evidence strength & attribution
evidence_strength: medium  # weak|medium|strong
attribution_share: 0.5     # 0.0~1.0

# 자동 계산 (스크립트가 채움 권장)
realized_score: TBD

links:
  dashboard: TBD
  query: TBD
  raw_data: TBD

created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

### 5.4 Hypothesis / Project에도 최소 연결을 둔다

```yaml
conditions_3y: [C3-B]
northstar: [NS-2035]
```

> Task가 Hypothesis만 연결해도 롤업되게 한다.
> Project에도 conditions_3y를 넣어, 프로젝트 단위 대시보드가 안정적으로 된다.

---

## 6. 검증 규칙 (Validate / Orphan Check)

> "규칙 강제"가 시스템을 완성한다.

### 6.1 validate_schema.py에 추가할 최소 규칙

**type: task 필수 조건**:
- `id`, `status`, `impact_magnitude`, `confidence`를 가진다
- `contributes`가 최소 1개이며, 각 요소가 `to`, `weight`를 가진다

**type: condition 필수 조건**:
- `id`, `weight_to_northstar`, `northstar`를 가진다

**값 범위 검증**:
- `0 <= confidence <= 1`
- `0 <= weight_to_northstar <= 1`
- `0 <= contributes.weight <= 1`
- `sum(contributes.weight) == 1.0` (권장, 초기엔 경고로 시작 가능)

### 6.2 check_orphans.py 고아 정의 (권장)

Task가 다음 조건에 해당하면 **orphan**으로 잡는다:
- `project`가 없거나
- `contributes`가 비어 있거나
- `contributes.to`가 존재하지 않는 Condition id를 가리킴

---

## 7. 생성 파이프라인 (Automation)

### 7.1 build_graph_index.py 확장 방향

노드/엣지에 아래를 포함하도록 확장:

| 노드 필드 | 엣지 필드 |
|----------|----------|
| `type`, `id`, `path`, `title` | `from`, `to`, `relation_type`, `weight(optional)` |

**권장 산출물 (2개)**:
- `_Graph_Index.md` : 사람용 네비게이션
- `_build/graph.json` : LLM/스크립트용 머신 인덱스

### 7.2 build_dashboard.py에 "Impact Roll-up" 추가

#### (1) Task Impact Table (칸반용)

| 컬럼 |
|------|
| id / title / status / ExpectedScore / RealizedScore / C3 / NS / owner / updated |

#### (2) Condition Roll-up (3Y 전략)

Condition별:
- ExpectedSum, RealizedSum
- Top tasks by realized, Top tasks by expected
- Evidence strength 분포

#### (3) NorthStar Roll-up (10Y)

NS별:
- ExpectedSum, RealizedSum
- "어떤 Condition이 NS를 실제로 밀고 있는가" 순위

### 7.3 (선택) 별도 스크립트: build_impact.py

```
scripts/build_impact.py → graph + frontmatter 읽음
                       → _build/impact.json 생성
                       → DataviewJS가 읽어 칸반 카드에 표시
```

---

## 8. 칸반에서 "숫자"를 보이게 하는 운영 방식

### 사람이 보는 화면 (권장)

**프로젝트별 칸반**: `project == P001_Ontology` 필터

**카드 표시 필드**:
- ExpectedScore (큰 숫자)
- RealizedScore (완료 후 업데이트)
- C3 (기여하는 Condition id)
- NS (연결된 NorthStar id)

### 핵심 운영 규칙 (팀 2~3명 최적)

1. 태스크 생성은 **템플릿/버튼 경로로만** 만들기 (형식 통일)
2. 완료(done) 시점에 반드시:
   - Evidence 노트를 생성한다
   - Task의 `evidence: [E-…]`를 연결한다
   - 대시보드/impact index 재생성

---

## 9. LLM "첫 진입 최적화"

### LLM은 항상 다음을 먼저 읽게 한다

1. `_ENTRY_POINT.md`
2. `00_Meta/schema_registry.md`
3. `00_Meta/relation_types.md`
4. `00_Meta/query_recipes.md`
5. `_Graph_Index.md` (+ 가능하면 `_build/graph.json`)
6. `_Dashboard.md`

### Query Recipes에 반드시 넣을 대표 레시피

- "3년 전략(3Y Conditions) 전부 요약"
- "Condition C3-B에 연결된 모든 프로젝트/가설/태스크"
- "Expected는 높은데 Realized가 낮은 태스크 Top N"
- "Realized가 strong evidence인 학습만 모아 전략 업데이트 제안"

---

## 10. 최소 구현 체크리스트 (가장 빠른 MVP)

### Day 1 (스키마/템플릿)

- [ ] `template_task.md`에 `impact_magnitude` / `confidence` / `contributes[]` 추가
- [ ] `template_condition.md`에 `id` / `northstar` / `weight_to_northstar` 추가
- [ ] `template_evidence.md` 신설 (없다면)

### Day 2 (검증/게이트)

- [ ] `validate_schema.py`에 필수 필드 검증 추가
- [ ] `check_orphans.py`에 "Task는 Condition에 연결 필수" 규칙 추가

### Day 3 (대시보드/롤업)

- [ ] `build_dashboard.py`에 Expected/Realized 롤업 표 추가
- [ ] `_Dashboard.md`에 "Condition별 / NS별 합산"이 보이게 만들기

---

## 11. 운영에서 가장 중요한 한 줄

> **Expected는 "정렬(우선순위)"을 위한 점수, Realized는 "학습(증거)"을 위한 점수다.**
> 둘을 섞지 않으면, 태스크가 수천 개로 늘어도 시스템이 무너지지 않는다.

---

## 12. 점수 모델 업데이트 방법

### 12.1 업데이트 핵심 원리

매주/격주로 아래를 계산:

```
Prediction Error = RealizedScore - ExpectedScore
```

패턴 분석:
- 특정 `impact_magnitude`가 항상 과대/과소평가되는지
- 특정 `evidence_strength`가 점수에 너무 약/강하게 반영되는지
- 특정 Condition이 "일은 많이 했는데 Realized가 안 쌓이는지"
- 특정 타입(데이터 작업/리서치/제품)이 Expected 산정 방식과 안 맞는지

### 12.2 업데이트 레버 5개

| 레버 | 설명 | 예시 |
|------|------|------|
| **A) MagnitudePoints** | 크기별 기본 점수 | small=20→25, large=80→70 |
| **B) EvidenceStrength 계수** | 증거 강도 가중치 | strong=1.0→1.2 |
| **C) Metric 정규화 범위** | 지표별 1.0 기준 | Activation +1.0pp = 1.0 |
| **D) AttributionShare 규칙** | 기여도 분배 | 같은 기간 N개면 1/N |
| **E) weight_to_northstar** | 전략 중요도 | Condition A: 0.7→0.8 |

### 12.3 모델 파라미터를 파일로 분리

**추천**: `00_Meta/impact_model_config.yml` 하나를 "단일 진실"로 둔다.

```yaml
# 00_Meta/impact_model_config.yml
version: "1.0.0"
updated: 2025-01-01

magnitude_points:
  small: 20
  mid: 50
  large: 80

evidence_strength:
  weak: 0.3
  medium: 0.6
  strong: 1.0

metric_ranges:
  M-DatasetCoverage:
    unit: "pp"
    max_delta: 5.0  # +5pp = 1.0
  M-LoopPrediction:
    unit: "pp"
    max_delta: 10.0

attribution_rules:
  default_share: 1.0
  multi_task_divisor: true  # 같은 기간 N개면 1/N
```

**장점**:
- 모델이 바뀔 때마다 PR로 리뷰/기록 가능
- 과거 데이터도 재계산(rebuild) 가능
- "왜 점수가 달라졌지?"에 대해 버전으로 설명 가능

### 12.4 업데이트 주기 (작은 팀 최적)

**매주 15분 "Calibration"**:
- 지난주 done 태스크 중 evidence가 생긴 것만 모아
- Expected vs Realized 오차를 확인
- 레버 1개만 바꾸기 (너무 많이 바꾸면 원인 추적이 안 됨)

**매월 30분 "Model Refresh"**:
- Metric 정규화 범위 업데이트
- evidence_strength 계수 재평가
- Condition weight_to_northstar 재점검 (전략 우선순위 변화 반영)

### 12.5 LLM 역할 (가장 실용적)

LLM 역할은 "모델을 마음대로 바꾸는 것"이 아니라:
1. 이번 주 오차 패턴 요약
2. 바꿀 레버 후보 1~2개 제안
3. 변경안의 부작용 (어떤 태스크/전략이 과대평가될지) 경고
4. 변경 후 재계산 결과 요약

> 결정은 사람이, 분석/제안/리포트는 LLM이 맡는 구조가 안정적

---

## 13. Strategy Change Protocol (전략 변경 관리)

상위 전략(Condition/Track)이 바뀔 때 시스템이 깨지지 않도록 하는 프로토콜.

### 13.1 Condition/Track이 바뀔 때 생기는 문제 3가지

| 문제 | 설명 |
|------|------|
| **링크 깨짐** | 태스크가 가리키던 Condition이 이름/파일/구조가 바뀌면 추적 실패 |
| **점수 왜곡** | `weight_to_northstar`나 metric 정의가 바뀌면 과거 태스크의 NS 기여도가 뒤틀림 |
| **의미 변질** | "같은 ID인데 내용이 완전히 다른 Condition"이 되면 학습 자산이 오염됨 |

### 13.2 해결 전략: "Stable ID + Versioning + Migration" 3종 세트

#### A. Stable ID 원칙 (절대)

- **ID는 절대 재사용/재할당 금지**
- 파일명은 바뀌어도 OK, 내용은 바뀌어도 OK, **ID는 고정**
- 예: `C3-B`는 영원히 `C3-B`

#### B. 바뀐 정도에 따라 "수정" vs "신규 발급" 구분

| 변경 유형 | 기준 | 처리 |
|----------|------|------|
| **Minor change** | 문구/설명/범위 약간 조정 | 같은 ID 유지 + `version`만 올림 |
| **Major change** | 정의/목표/metric/의미가 달라짐 | 새 ID 발급 + "후계 관계"로 연결 |

예: `C3-B` → `C3-B2` (또는 `C3-2026-Dataset` 같이 연도 포함)

#### C. Migration(이관) 자동화

Major change로 새 Condition이 생기면:
1. 기존 태스크 중 일부/전체를 새 Condition으로 옮겨야 함
2. `backfill_conditions_3y.py` 같은 스크립트로 일괄 업데이트
3. validate/orphan check로 검증

### 13.3 변경 관리 필드 (Condition 스키마 확장)

```yaml
---
type: condition
id: C3-B
version: 1
status: active  # active | deprecated | replaced
valid_from: 2025-01-01
valid_to: null

# 변경 이력/후계 관계 (중요)
supersedes: []          # 내가 대체한 이전 조건들
superseded_by: []       # 나를 대체한 후속 조건 (있으면 여기에)
aliases: []             # 과거 이름/별칭

northstar: [NS-2035]
weight_to_northstar: 0.7
---
```

**핵심 포인트**:
- 삭제하지 말고 `deprecated`/`replaced`로 남겨서 **추적과 감사(why)**가 가능하게
- `valid_from`/`valid_to`로 "그때는 뭐가 정답이었나"를 LLM이 이해할 수 있게

### 13.4 점수(Impact)는 "재계산"하되, "당시 기준"도 같이 남긴다

전략이 바뀌면 점수는 **두 가지 관점**이 필요:

| View | 용도 | 기준 |
|------|------|------|
| **Current View** | "현재 우리 방향에서 가장 임팩트 큰 태스크" | 지금의 weight_to_northstar / metric |
| **Historical View** | "그때 우리는 합리적으로 무엇을 했나" | 태스크 생성/완료 당시의 모델 파라미터 |

#### 구현 방법 (가장 쉬운 방식)

Task/Evidence에 아래 두 필드 추가:

```yaml
impact_model_version: IM-2025-01
expected_score_snapshot: 42   # 생성 당시
realized_score_snapshot: 18   # 평가 당시
```

대시보드는:
- `expected_score_current` (재계산) + `expected_score_snapshot` (당시값)
- 둘 다 보여주면 됨

### 13.5 운영 프로토콜: Minor vs Major Change

#### (1) Minor change (ID 유지)

```
1. Condition 문서 수정 (version+1, 내용 업데이트)
2. build_graph_index + build_dashboard 재생성
3. 끝
```

#### (2) Major change (새 ID 발급)

```
1. 새 Condition 생성: C3-B2
2. 기존 Condition 업데이트:
   - status: replaced
   - superseded_by: [C3-B2]
3. 이관 규칙 결정 (어떤 태스크를 옮길지)
4. backfill 스크립트로 태스크 frontmatter의 contributes.to 일괄 업데이트
5. validate_schema.py / check_orphans.py로 깨진 링크 없는지 검사
6. 그래프/대시보드 재생성
7. impact_model_version 올리고 "변경 이유"를 changelog에 3줄 기록
```

### 13.6 Track 변경도 동일한 원칙

- Track ID도 고정 (예: `TR-2-Data`)
- Major shift면 새 Track ID 발급 + `supersedes`/`superseded_by`
- 태스크는 track이 바뀌어도 `project`/`condition` 링크가 남아 있으면 **전략 추적은 유지됨**

> Track 변경은 "뷰/운영" 영향이 크고, 전략 추적은 `condition`/`northstar`가 핵심축

### 13.7 LLM의 역할 (변경 발생 시)

LLM에게 시키는 "정해진 역할":

| 역할 | 설명 |
|------|------|
| **영향 분석** | "어떤 태스크가 영향 받는지" (이관 대상 목록) 산출 |
| **Orphan 탐지** | "연결 깨진 태스크" 탐지 |
| **순위 변화** | "재계산 후 Top 변화" 요약 |
| **구조 검토** | "새 Condition이 기존 NorthStar에 미치는 weight 구조" 검토 |

> **결정(major/minor, 이관 범위)은 사람**이 하고, **LLM은 자동 변경/요약/검증**을 담당

### 13.8 한 줄 결론

> 상위 전략이 바뀌어도 문제 없게 하려면 **"ID 고정 + 버전/후계 관계 + 이관 스크립트 + 점수 재계산(현재/당시)"**로 운영한다.

---

## Appendix A) 점수 필드 표준 (권장 이름)

**Task**:
- `impact_magnitude`, `confidence`, `contributes[]`, `evidence[]`

**Condition**:
- `weight_to_northstar`, `northstar[]`

**Evidence**:
- `metric_delta`, `normalized_delta`, `evidence_strength`, `attribution_share`, `realized_score`

## Appendix B) 추천 ID 규칙 (예시)

| Entity | Pattern | Example |
|--------|---------|---------|
| NorthStar | `NS-YYYY` | `NS-2035` |
| 3Y Condition | `C3-X` | `C3-A`, `C3-B` |
| Project | `PNNN_…` | `P001_Ontology` |
| Hypothesis | `H-YYYY-NNNN` | `H-2025-0003` |
| Task | `T-YYYY-NNNN` | `T-2025-0001` |
| Evidence | `E-YYYY-NNNN` | `E-2025-0007` |

## Appendix C) 왜 이 방식이 현재 vault에 가장 잘 맞나

1. **템플릿/스키마/관계/그래프/검증/대시보드 스크립트가 이미 존재** → 점수 필드만 얹으면 된다
2. **3Y_Conditions/_INDEX.md가 이미 있어 "전략 중심 탐색"이 가능** → Condition을 축으로 롤업이 자연스럽다
3. **check_orphans / validate_schema가 있어 "규칙 강제"가 가능** → 유기적 연결이 운영 중에도 유지된다
4. **Graph index가 있어 LLM이 전역 추적을 할 수 있다** → 팔란티어식 추적(Traceability) 기반을 충족한다

---

**Version**: 0.2
**Created**: 2025-12-19
**Updated**: 2025-12-19
**Author**: LOOP Team

**Changelog**:
- v0.2: Added Section 13 "Strategy Change Protocol" - Stable ID, versioning, migration, score snapshot
- v0.1: Initial spec - Expected/Realized model, roll-up, validation rules
