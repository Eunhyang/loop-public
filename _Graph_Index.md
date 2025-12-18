---
entity_type: GraphIndex
title: LOOP Vault 전체 그래프 인덱스
index_version: 2.0
last_updated: 2024-12-18
coverage: comprehensive
tags: [index, graph, navigation]
---

# LOOP Vault 전체 그래프 인덱스

> **목적**: GraphRAG가 전체 구조를 한눈에 파악하고, 관계 기반 추론을 수행할 수 있도록 지원

---

## 📍 Quick Navigation

| 계층 | 문서 | 경로 |
|------|------|------|
| 🎯 10년 비전 | [[10년 비전]] | `01_North_Star/` |
| 🧪 Meta Hypotheses | [[MH3_데이터_모델링_가능]] | `01_North_Star/` |
| ✅ 3년 Conditions | [[Condition_B_Loop_Dataset]] | `20_Strategy/3Y_Conditions/` |
| 📊 12개월 Tracks | [[Track_2_Data]] | `20_Strategy/12M_Tracks/` |
| 🔷 온톨로지 | [[30_Ontology/_Strategy_Link]] | `30_Ontology/` |
| 🚀 Projects | `50_Projects/P3_Ontology_v0.1/` | `50_Projects/` |

---

## 전략 계층 (Strategy Layer)

### 10년 비전 (North Star)
| Entity | ID | Status | Type |
|--------|-----|--------|------|
| [[10년 비전]] | vision:inner-loop-os | fixed | NorthStar |

**핵심 내용**: "인간의 정서–섭식–습관 루프를 읽고, 예측하고, 전환하는 Human Inner Loop OS의 글로벌 표준"

**특성**:
- 제품 형태 독립 (앱/코칭/DTx/API)
- 시장 변화 독립 (GLP-1 유무 무관)
- 인과 구조 다룬다는 점만 고정

---

### Meta Hypotheses (4개)
| Entity | ID | Status | If Broken | Validated By |
|--------|-----|--------|-----------|--------------|
| MH1_루프는_지속적_문제 | mh:1 | assumed | 회사 재검토 | - |
| MH2_행동개입_효과 | mh:2 | assumed | 회사 재검토 | Track 1 |
| [[MH3_데이터_모델링_가능]] | mh:3 | validating (70%) | 회사 재검토 | **Ontology v0.1** ⭐ |
| MH4_단계적_확장_가능 | mh:4 | assumed | 회사 재검토 | - |

**중요**: MH3는 온톨로지가 직접 검증하는 핵심 가설

---

### 3년 Conditions (5개)
| Entity | ID | Status | If Broken | Enabled By |
|--------|-----|--------|-----------|------------|
| Condition_A_국내_PMF | cond:a | in_progress | UX 재설계/소프트 피봇 | Track 1 |
| [[Condition_B_Loop_Dataset]] | cond:b | in_progress (60%) | **데이터 전략 폐기** | **Track 2 (온톨로지)** ⭐ |
| Condition_C_Global_Data | cond:c | not_started | 글로벌 확장 가설 폐기 | Track 2 |
| Condition_D_Runway | cond:d | active | 생존 위협 | Track 6 |
| Condition_E_Team | cond:e | monitoring | 외주/Lite | - |

**중요**: Condition B는 온톨로지가 직접 enable하는 핵심 조건

**Condition B 측정 지표**:
- 재현 패턴 수: 현재 3개 / 임계치 10개
- 패턴 재현율: 측정 중 / 임계치 70%
- 스키마 안정성: 2개월 / 임계치 3개월

---

### 12개월 Tracks (6개)
| Entity | ID | Hypothesis | Focus | Status |
|--------|-----|------------|-------|--------|
| Track_1_Product | track:1 | 느린 식사/기록/개입이 루프 바꿈 | Loop Core OS | active |
| [[Track_2_Data]] | track:2 | **코치+기록 데이터는 패턴화 가능** | **Schema 안정화 (온톨로지)** ⭐ | active (60%) |
| Track_3_Content | track:3 | 언어를 바꾸면 선택 바뀜 | GLP-1 콘텐츠 | active |
| Track_4_Coaching | track:4 | 코치는 데이터 엔진 일부 | 코치 확장 | active |
| Track_5_Partnership | track:5 | 데이터 쌓이면 의료 열림 | 의원급 파일럿 | planning |
| Track_6_Revenue | track:6 | 매출은 조건 충족의 결과 | Runway 18개월 | active |

**중요**: Track 2는 온톨로지의 소속 Track

**Track 2 목표**:
- 고밀도 사용자: 32명 → 50명
- 재현 패턴: 3개 → 10개
- 스키마 안정성: 2개월 → 3개월

---

## 온톨로지 계층 (Ontology Layer)

### 온톨로지의 전략 연결
**문서**: [[30_Ontology/_Strategy_Link]]

**온톨로지의 3가지 역할**:
1. **MH3 검증 도구**: "루프는 데이터 모델링 가능"을 검증
2. **Condition B Enable 인프라**: "재현 패턴 10개"를 가능하게
3. **Track 2 핵심 구성요소**: Focus 3 (Schema 안정화)

**만약 온톨로지 실패하면**:
- MH3 위험 → 회사 존재 이유 재검토
- Condition B 달성 불가 → 3년 전략 진입 불가
- Track 2 실패 → 데이터 전략 폐기

---

### Core Entities (5개) - v0.1 고정
| Entity | ID | Role | Validates | Enables | Status |
|--------|-----|------|-----------|---------|--------|
| [[Event]] | entity:event:v0.1 | 원자적 사실 | MH3 | Condition B | stable |
| [[Episode]] | entity:episode:v0.1 | 루프 컨테이너 | MH3 | Condition B | stable |
| [[LoopStateWindow]] | entity:statewindow:v0.1 | 상태 벡터 | MH3 | Condition B | stable |
| [[ActionExecution]] | entity:action:v0.1 | 개입 트랜잭션 | MH3 | Condition B | stable |
| [[OutcomeMeasurement]] | entity:outcome:v0.1 | 결과 측정 | MH3 | Condition B | stable |

**중요 규칙 (v0.1 고정)**:
- **Rule A**: Type System 고정 (5개 절대 불변)
- **Rule B**: ID & Reference 불변
- **Rule C**: Action은 트랜잭션 + 전/후 윈도우 강제
- **Rule D**: specVersion 강제

**문서**: [[30_Ontology/Schema/v0.1/Ontology-lite v0.1]]

---

### Extended Entities (추가 엔티티 - v0.1+)
| Entity | ID | Version | Status | Purpose |
|--------|-----|---------|--------|---------|
| SignalObservation | entity:signal:v0.1 | 0.1 | active | 센서 데이터 |
| UserLoopModelSnapshot | entity:usermodel:v0.1 | 0.1 | active | 개인화 모델 |
| PredictionRun | entity:prediction:v0.1 | 0.1 | active | 위험 예측 |
| DecisionPoint | entity:decision:v0.1 | 0.1 | active | JITAI 개입 |

---

### Relations (관계 타입)
#### 전략 관계
| Relation | From | To | Meaning | Cardinality |
|----------|------|-----|---------|-------------|
| validates | Ontology v0.1 | MH3 | 온톨로지가 가설 검증 | 1:1 |
| enables | Ontology v0.1 | Condition B | 스키마가 조건 enable | 1:1 |
| part_of | Ontology v0.1 | Track 2 | 프로젝트가 Track 소속 | N:1 |
| unlocks | Condition B | 3년_전략 | 조건 충족 시 unlock | 1:1 |
| triggersShutdown | Condition B | 데이터_전략_폐기 | 조건 깨짐 시 | 1:1 |

#### 온톨로지 관계
| Relation | From | To | Type | Cardinality |
|----------|------|-----|------|-------------|
| contains | Episode | Event | compositional | 0..1:N |
| contains | Episode | LoopStateWindow | compositional | 1:N |
| contains | Episode | ActionExecution | compositional | 0..1:N |
| evaluatedBy | ActionExecution | OutcomeMeasurement | evaluative | 1:N |
| precedes | Event | Event | temporal | N:M |
| triggers | Event | ActionExecution | causal | N:M |
| contextOf | LoopStateWindow | Episode | contextual | N:1 |

---

### Communities (커뮤니티 구조)
| Community | ID | Members | Importance |
|-----------|-----|---------|------------|
| C1_Core_Entities | C1 | Event, Episode, LoopStateWindow, ActionExecution, OutcomeMeasurement | critical |
| C2_Loop_Types | C2 | Emotional, Eating, Habit, Reward, Nervous | high |
| C3_Causality | C3 | Event-Action-Result 구조 | critical |
| C4_Time_Scales | C4 | micro, meso, macro | medium |
| C5_Versioning | C5 | v0.1, v0.2+ 계획 | high |

---

## 프로젝트 계층 (Project Layer)

### Active Projects
| Project | Track | Hypothesis | Status | Progress |
|---------|-------|------------|--------|----------|
| Loop_Core_OS_v0.1 | Track 1 | 천천히 먹기가 폭식 줄임 | active | 70% |
| **Ontology_v0.1** | **Track 2** | **Loop는 5개 엔티티로 표현 가능** | **active** ⭐ | **80%** |
| CoachOS_Phase1 | Track 2,4 | 라벨링이 패턴 품질 높임 | active | 60% |
| Pattern_Discovery_v1 | Track 2 | 코치+AI로 패턴 발견 가능 | active | 30% |
| 앱_구독_전환 | Track 6 | 유료화가 고밀도 비율 높임 | planning | 10% |

**Ontology v0.1 세부**:
- **가설**: "Loop는 5개 코어 엔티티로 모델링 가능"
- **목표**: Schema 안정화 (3개월 변경 없음)
- **현재**: 2개월 안정, 실제 구현 검증 중
- **경로**: `50_Projects/P3_Ontology_v0.1/`

---

## 가설 계층 (Hypothesis Layer)

### 검증 중인 가설
| Hypothesis | Track | Project | Status | Evidence |
|------------|-------|---------|--------|----------|
| 천천히_먹기_효과 | Track 1 | Loop Core OS | validating | 부분 검증 |
| 라벨링_품질_향상 | Track 2 | CoachOS | validating | 긍정적 |
| **Loop_모델링_가능** | **Track 2** | **Ontology v0.1** | **validating (70%)** ⭐ | **긍정적** |
| 유료화_고밀도_비율 | Track 6 | 앱 구독 전환 | planning | 미검증 |

**Loop_모델링_가능 증거**:
- ✅ Event로 meal/emotion/urge/binge 모두 표현 가능
- ✅ Episode로 2-4시간 위험 구간 캡처
- ✅ 스키마 2개월간 안정
- ✅ 패턴 3개 발견
- ⚠️ 패턴 10개 목표 (현재 30%)

---

## 관계 인덱스 (전체 맵)

### 전략 - 온톨로지 연결
```
10년 비전
 ↓
MH3 (데이터 모델링 가능)
 ↓ (validated by)
Ontology v0.1
 ↓ (enables)
Condition B (재현 패턴 10개)
 ↓ (unlocks)
3년 전략 진입
 ↓
Track 5 (의료 파트너십)
```

### 온톨로지 내부 관계
```
Episode
 ├─ contains → Event (0..1:N)
 ├─ contains → LoopStateWindow (1:N)
 └─ contains → ActionExecution (0..1:N)

ActionExecution
 └─ evaluatedBy → OutcomeMeasurement (1:N)

Event
 ├─ precedes → Event (N:M)
 └─ triggers → ActionExecution (N:M)
```

---

## 통계

### 전략 레이어
- **North Star**: 1개 (고정)
- **Meta Hypotheses**: 4개 (1개 검증 중)
- **Conditions**: 5개 (3개 in_progress, 1개 active)
- **Tracks**: 6개 (5개 active, 1개 planning)
- **Projects**: 5개 (4개 active, 1개 planning)

### 온톨로지 레이어
- **Core Entities**: 5개 (stable, v0.1 고정)
- **Extended Entities**: 4개 (active)
- **Relations**: 12개 (7개 온톨로지 + 5개 전략)
- **Communities**: 5개
- **Rules**: 4개 (v0.1 고정)

### 중요도 분포
- **Critical**: MH1-4, Condition B,D, Ontology v0.1, Core Entities
- **High**: Track 2, Track 6, Condition A
- **Medium**: 나머지

---

## GraphRAG 쿼리 예시

### Global 질문 (전체 맥락)
**Q**: "이 회사의 10년 목표는?"
**A**: Inner Loop OS 글로벌 표준. 제품 형태/시장 변화 독립.

**Q**: "회사를 접어야 하는 조건은?"
**A**: MH1-4 중 하나라도 무너짐. 특히 MH3(데이터 모델링 불가)가 거짓이면 회사 재검토.

**Q**: "온톨로지는 왜 만드나?"
**A**: MH3 검증 + Condition B enable + Track 2 실행. 온톨로지 없으면 패턴 저장/재현 불가.

---

### Conditional 질문 (If-Then)
**Q**: "Condition B가 깨지면?"
**A**: 데이터 전략 폐기 → 3년 전략 진입 불가 → Track 5 (의료) 불가능.

**Q**: "온톨로지 v0.1이 실패하면?"
**A**: MH3 위험 → 회사 재검토. 또는 v0.2로 재설계 (Track 2 지연 3개월).

**Q**: "패턴이 10개 안 되면?"
**A**: Condition B 미달 → 데이터 전략 폐기 → 3년 전략 포기.

---

### Relation 질문 (연결)
**Q**: "Event 엔티티는 어떤 가설 검증?"
**A**: MH3 (데이터 모델링 가능). Event로 meal/emotion/urge/binge 모두 표현 가능함을 증명.

**Q**: "Track 2와 Track 4의 관계?"
**A**: Track 2는 Track 4에 의존. 코치가 고밀도 사용자 관리 + 패턴 발견.

**Q**: "온톨로지 성공 시 unlock?"
**A**: Condition B → 3년 전략 진입 → Track 5 (의료) 본격 시작.

---

### Timeline 질문 (시계열)
**Q**: "12개월 후 성공 조건?"
**A**: Condition A,B 명확화 + Condition D 확보. 특히 Condition B (재현 패턴 10개).

**Q**: "3년 전략 진입 조건?"
**A**: Condition A,B,D,E 충족. Condition B가 핵심 (온톨로지 필수).

**Q**: "온톨로지 v0.1 → v0.2 트리거?"
**A**: v0.1이 3개월 안정 + 새 요구사항 명확 + 의료/글로벌 준비.

---

## 핵심 경로 (Critical Paths)

### Path 1: 온톨로지 → 3년 전략
```
Ontology v0.1 성공
  ↓
스키마 3개월 안정 + 패턴 10개 발견
  ↓
Condition B 충족
  ↓
3년 전략 진입
  ↓
Track 5 (의료 파트너십) 본격 시작
```

### Path 2: 온톨로지 실패 → 회사 재검토
```
Ontology v0.1 실패
  ↓
스키마 계속 깨짐 OR 패턴 정체
  ↓
MH3 거짓 가능성
  ↓
회사 존재 이유 재검토
  ↓
피봇 OR 종료
```

### Path 3: Track 2 성공 → 의료 진입
```
Track 2 성공
  ↓
고밀도 50명 + 패턴 10개 + 스키마 안정
  ↓
Condition B + MH3 검증
  ↓
의료 기관 설득 근거 확보
  ↓
IRB 승인 + 임상 프로토콜
  ↓
Track 5 (의료) 성공
```

---

## 참고 문서 (전체)

### 전략
- [[10년 비전]] - `01_North_Star/`
- [[MH3_데이터_모델링_가능]] - `01_North_Star/`
- [[Condition_B_Loop_Dataset]] - `20_Strategy/3Y_Conditions/`
- [[Track_2_Data]] - `20_Strategy/12M_Tracks/`

### 온톨로지
- [[30_Ontology/Schema/v0.1/Ontology-lite v0.1]]
- [[30_Ontology/_Strategy_Link]] ⭐ 전략 연결
- [[Event (GraphRAG 최적화 예시)]]
- [[30_Ontology/_MOC_온톨로지_개발]]

### 프로젝트
- `50_Projects/P3_Ontology_v0.1/` - 온톨로지 프로젝트

### 가이드
- [[CLAUDE.md]] - 개발 가이드
- [[GraphRAG 최적화 가이드]] - GraphRAG 활용법

---

**Index Version**: 2.0 (GraphRAG 최적화)
**Coverage**: 전략 + 온톨로지 + 프로젝트 전체
**Last Updated**: 2024-12-18
**Next Update**: 온톨로지 v0.1 완성 시 (2025-03)
**Maintainer**: Founder + 전략 팀
