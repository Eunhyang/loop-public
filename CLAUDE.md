# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference: Common Commands

This is an **Obsidian vault** for knowledge management - there is no code compilation or testing.

### Validation Commands
```bash
# Validate all frontmatter schemas
python3 scripts/validate_schema.py .

# Check for broken entity references
python3 scripts/check_orphans.py .

# Regenerate graph index
python3 scripts/build_graph_index.py .
```

### Key Entry Points
- `_HOME.md` - Main navigation hub
- `_Graph_Index.md` - Auto-generated entity index (do not edit manually)
- `01_North_Star/` - 10-year vision and meta-hypotheses
- `20_Strategy/` - Strategic layer (Conditions, Tracks)
- `30_Ontology/` - Ontology schema development

### Templates Location
- `00_Meta/_TEMPLATES/` - Templates for all entity types

---

## 프로젝트 개요

이 Obsidian vault는 **Inner Loop OS (ILOS)** 의 전체 전략, 온톨로지 스키마, 프로젝트 실행을 통합 관리하는 지식 시스템입니다.

Inner Loop OS는 인간의 정서-섭식-습관-보상-신경계 루프를 하나의 시스템으로 다루는 행동 OS입니다.

**중요:** 이것은 Obsidian vault이므로 코드 실행이나 빌드 명령이 없습니다. 모든 작업은 마크다운 문서 작성과 관리에 집중됩니다.

---

## 🎯 이 Vault가 다루는 모든 것

1. **10년 비전**: Human Inner Loop OS 글로벌 표준
2. **전략 가설**: Meta Hypotheses (MH1-4), Conditions (A-E), Tracks (1-6)
3. **온톨로지 스키마**: 데이터 모델 (Event, Episode, ActionExecution 등)
4. **프로젝트 실행**: Track별 Project와 Task
5. **가설 검증**: 검증 중인 Hypotheses 로그
6. **실제 구현**: SoSi, KkokKkokFit 프로젝트 연결

→ **"가설을 빠르게 죽이면서 살아남는 조직"의 모든 구조**

---

## 🏗️ 전략 계층 구조 (핵심 이해)

```
10년 비전 (North Star) - 절대 불변
 └─ Meta Hypotheses (MH1-4) - 하나라도 무너지면 회사 재검토
     └─ 3년 Conditions (A-E) - 충족 시 Unlock, 깨지면 특정 피봇/폐기
         └─ 12개월 Tracks (1-6) - 투자 방향 가설
             └─ Projects - 실험 단위
                 └─ Tasks - 실행 단위
```

### 핵심 원칙
1. **비전은 고정, 전략은 조건부**
2. **수치 ≠ 목표**, 수치 = 중단 신호
3. **나쁜 결과 ≠ 실패**, 나쁜 결과 = 가설 생성 기회
4. **Condition 깨짐 → 명확한 피봇/폐기 결정**

**예시**:
- Condition B (재현 패턴 10개) 깨짐 → 데이터 전략 폐기
- MH3 (데이터 모델링 가능) 거짓 → 회사 존재 이유 재검토

---

## 📁 폴더 구조 (v2.0 - GraphRAG 최적화)

```
LOOP/
├── _HOME.md                            # 메인 네비게이션 허브
├── _Graph_Index.md                     # 전체 그래프 인덱스 ⭐
├── README.md
├── CLAUDE.md                           # 이 파일
│
├── 00_Inbox/                           # 임시 메모
├── 00_Meta/                            # 메타 문서
│   └── _TEMPLATES/                     # 문서 템플릿
│
├── 01_North_Star/                      # 🆕 10년 비전 + Meta Hypotheses
│   ├── 10년 비전.md                    # Human Inner Loop OS 글로벌 표준
│   ├── MH1_루프는_지속적_문제.md       # (생성 예정)
│   ├── MH2_행동개입_효과.md            # (생성 예정)
│   ├── MH3_데이터_모델링_가능.md       # ⭐ 온톨로지가 검증
│   └── MH4_단계적_확장_가능.md         # (생성 예정)
│
├── 10_Study/                           # 온톨로지 학습
│   ├── _MOC 온톨로지 학습.md
│   ├── 01_Foundations/
│   ├── 02_Languages/
│   ├── 03_Tools/
│   ├── 04_Methodology/
│   ├── 05_Case-Studies/
│   └── 06_Exercises/
│
├── 20_Strategy/                        # 🔄 전략 (기존 30_Strategy)
│   ├── _MOC_전략.md                    # (생성 예정)
│   ├── 3Y_Conditions/                  # 3년 조건
│   │   ├── Condition_A_국내_PMF.md     # (생성 예정)
│   │   ├── Condition_B_Loop_Dataset.md  # ⭐ 온톨로지가 enable
│   │   ├── Condition_C_Global_Data.md  # (생성 예정)
│   │   ├── Condition_D_Runway.md       # (생성 예정)
│   │   └── Condition_E_Team.md         # (생성 예정)
│   ├── 12M_Tracks/                     # 12개월 Track
│   │   ├── Track_1_Product.md
│   │   ├── Track_2_Data.md              # ⭐ 온톨로지 소속
│   │   ├── Track_3_Content.md
│   │   ├── Track_4_Coaching.md
│   │   ├── Track_5_Partnership.md
│   │   └── Track_6_Revenue.md
│   └── Legacy/                         # 기존 전략 문서 보관
│
├── 30_Ontology/                        # 🔄 온톨로지 (기존 20_Ontology)
│   ├── _MOC_온톨로지_개발.md
│   ├── _Strategy_Link.md               # 🆕 ⭐ 온톨로지-전략 연결
│   ├── Schema/
│   │   └── v0.1/
│   │       └── Ontology-lite v0.1.md
│   ├── Entities/
│   │   └── Event (GraphRAG 최적화 예시).md
│   ├── Relations/
│   ├── Rules/
│   ├── _Communities/                   # 🆕 GraphRAG 커뮤니티
│   │   └── C1_Core_Entities.md
│   ├── RelationTypes/                  # 🆕 관계 타입 레지스트리
│   └── GraphRAG 최적화 가이드.md       # 🆕
│
├── 40_LOOP_OS/                         # ILOS 시스템 정의
│   ├── Inner Loop OS 정의v1.md
│   └── LOOP OS관련 문서.md
│
├── 50_Projects/                        # 🆕 프로젝트 (실험 단위)
│   ├── _MOC_프로젝트.md                # (생성 예정)
│   ├── P1_Loop_Core_OS/                # (생성 예정)
│   ├── P2_CoachOS_Phase1/              # (생성 예정)
│   ├── P3_Ontology_v0.1/               # ⭐ 온톨로지 프로젝트
│   │   ├── Project_정의.md             # (생성 예정)
│   │   ├── Tasks/                      # (생성 예정)
│   │   └── Results/                    # (생성 예정)
│   └── P4_Pattern_Discovery_v1/        # (생성 예정)
│
├── 60_Hypotheses/                      # 🆕 가설 검증 로그
│   ├── _MOC_가설.md                    # (생성 예정)
│   ├── H_천천히먹기_효과.md            # (생성 예정)
│   ├── H_Loop_모델링_가능.md           # ⭐ 온톨로지 핵심 가설 (생성 예정)
│   └── H_유료화_고밀도_비율.md         # (생성 예정)
│
├── 70_Experiments/                     # 🔄 실험 (기존 50_Experiments)
│   └── Use-cases/
│
├── 90_Archive/                         # 아카이브 (생성 예정)
│
├── scripts/                            # 자동화 스크립트
└── .claude/                            # Claude Code 설정
    ├── commands/                       # 커스텀 슬래시 커맨드
    └── skills/                         # 커스텀 스킬
```

### 주요 폴더 설명
- `00_Meta/` - 메타 문서, 템플릿, 빌드 설정
- `01_North_Star/` - 10년 비전 + Meta Hypotheses (MH1-4)
- `10_Study/` - 온톨로지 학습 자료
- `20_Strategy/` - 전략 계층 (Conditions, Tracks)
- `30_Ontology/` - 온톨로지 스키마 개발
- `40_LOOP_OS/` - LOOP OS 시스템 정의
- `50_Projects/` - 프로젝트 실행 단위
- `60_Hypotheses/` - 가설 검증 로그
- `70_Experiments/` - 실험 및 검증 결과
- `scripts/` - Python 자동화 스크립트
- `.claude/` - Claude Code 커스터마이제이션

### 현재 존재하는 핵심 파일
- ✅ `01_North_Star/10년 비전.md`
- ✅ `01_North_Star/MH3_데이터_모델링_가능.md`
- ✅ `20_Strategy/3Y_Conditions/Condition_B_Loop_Dataset.md`
- ✅ `20_Strategy/12M_Tracks/Track_*.md` (6개)
- ✅ `30_Ontology/Entities/Event (GraphRAG 최적화 예시).md`
- ✅ `40_LOOP_OS/Inner Loop OS 정의v1.md`

### 생성 예정 문서
대부분의 전략 문서(MH1,2,4, Condition A,C,D,E)와 프로젝트/가설 문서는 이 CLAUDE.md에 정의된 구조에 따라 생성될 예정입니다.

---

## 🔗 온톨로지와 전략의 관계 (핵심!)

### 온톨로지의 3가지 역할

#### 1. MH3 검증 도구
**MH3**: "루프는 데이터로 모델링 가능하다"

**온톨로지가 검증하는 방법**:
- 5개 코어 엔티티로 Loop 데이터 표현 가능한지
- Event-Action-Result 인과 구조가 작동하는지
- 재현 패턴을 데이터로 저장 가능한지

**현재 상태**: 70% 검증 (긍정적)

**만약 MH3가 거짓이라면**?
→ 회사 존재 이유 재검토

**문서**: [[MH3_데이터_모델링_가능]], [[30_Ontology/_Strategy_Link]]

---

#### 2. Condition B Enable 인프라
**Condition B**: "재현 패턴 10개"

**온톨로지가 Enable하는 방법**:
- 패턴을 Event-Episode-Action-Outcome으로 데이터화
- 패턴 재현 테스트 가능
- 패턴 수 카운트 가능

**만약 Condition B가 깨진다면**?
→ 데이터 전략 폐기, 3년 전략 진입 불가

**온톨로지 없으면**?
- 패턴 저장 불가
- Condition B 측정 불가

**문서**: [[Condition_B_Loop_Dataset]]

---

#### 3. Track 2 핵심 구성요소
**Track 2 (Data)**: "코치+기록 데이터는 패턴화 가능"

**온톨로지는 Track 2의 Focus 3** (Schema 안정화)

**Track 2 성공 조건**:
- 고밀도 50명 ✅
- 재현 패턴 10개 ← **온톨로지 필수**
- 스키마 3개월 안정 ← **온톨로지 필수**

**문서**: [[Track_2_Data]]

---

## 📊 Entity Types (전략 + 온톨로지)

### 전략 계층
```yaml
entity_type: NorthStar          # 10년 비전
entity_type: MetaHypothesis     # MH1-4
entity_type: Condition          # 3년 조건 (A-E)
entity_type: Track              # 12개월 Track (1-6)
entity_type: Hypothesis         # 검증할 가설
entity_type: Project            # 실험 단위
entity_type: Task               # 실행 단위
```

### 온톨로지 계층
```yaml
entity_type: CoreEntity         # Event, Episode 등 (v0.1 고정)
entity_type: Relation           # 관계 정의
entity_type: Rule               # 제약조건
entity_type: Community          # GraphRAG 커뮤니티
entity_type: RelationType       # 관계 타입 레지스트리
```

### 연결
```yaml
entity_type: StrategyOntologyLink  # 전략-온톨로지 연결
entity_type: GraphIndex            # 전체 그래프 인덱스
```

---

## 🔗 Relation Types (주요 관계)

### 전략 관계
```yaml
relation: validates          # Ontology v0.1 validates MH3
relation: enables            # Ontology v0.1 enables Condition B
relation: part_of            # Ontology v0.1 part_of Track 2
relation: unlocks            # Condition B unlocks 3년_전략
relation: triggersShutdown   # Condition 깨짐 → 폐기
relation: implements         # Project implements Hypothesis
relation: executes           # Task executes Project
```

### 온톨로지 관계
```yaml
relation: contains           # Episode contains Event
relation: evaluatedBy        # ActionExecution evaluatedBy OutcomeMeasurement
relation: precedes           # Event precedes Event
relation: triggers           # Event triggers ActionExecution
relation: contextOf          # LoopStateWindow contextOf Episode
```

---

## 📝 핵심 문서 (빠른 참조)

### 전략
| 문서 | 경로 | 설명 |
|------|------|------|
| 10년 비전 | `01_North_Star/10년 비전.md` | 절대 불변 좌표 |
| MH3 | `01_North_Star/MH3_데이터_모델링_가능.md` | 온톨로지가 검증 ⭐ |
| Condition B | `20_Strategy/3Y_Conditions/Condition_B_Loop_Dataset.md` | 온톨로지가 enable ⭐ |
| Track 2 | `20_Strategy/12M_Tracks/Track_2_Data.md` | 온톨로지 소속 ⭐ |

### 온톨로지
| 문서 | 경로 | 설명 |
|------|------|------|
| 스키마 v0.1 | `30_Ontology/Schema/v0.1/` | 5개 코어 엔티티 + 4조건 규칙 |
| 전략 연결 | `30_Ontology/_Strategy_Link.md` | 온톨로지-전략 연결 ⭐ |
| Event 예시 | `30_Ontology/Entities/Event (GraphRAG 최적화 예시).md` | GraphRAG 최적화 |
| GraphRAG 가이드 | `30_Ontology/GraphRAG 최적화 가이드.md` | GraphRAG 활용법 |

### 프로젝트
| 문서 | 경로 | 설명 |
|------|------|------|
| 온톨로지 v0.1 | `50_Projects/P3_Ontology_v0.1/Project_정의.md` | 온톨로지 프로젝트 ⭐ |

### 인덱스
| 문서 | 경로 | 설명 |
|------|------|------|
| Graph Index | `_Graph_Index.md` | 전체 그래프 인덱스 ⭐ |
| HOME | `_HOME.md` | 메인 네비게이션 |

---

## 🎨 YAML Frontmatter 표준

### 전략 문서 (예: Condition)
```yaml
---
entity_type: Condition
entity_id: cond:b
entity_name: Condition_B_Loop_Dataset

# 전략 계층
layer: 3year-strategy
level: condition
sequence: B

# 조건 정의
condition: "재현 가능한 패턴이 늘어나는가?"
unlock: "3년 전략 진입"
if_broken: "데이터 전략 폐기"

# 측정 지표 (중단 신호)
metrics:
  - name: "재현 패턴 수"
    threshold: "10개 이상"
    current: 3

# 현재 상태
status: in_progress
risk_level: medium
confidence: 0.6

# 관계
validated_by: [MH3]
enabled_by: [Ontology_v0.1, Track_2]
unlocks: [3년_전략_진입]

tags: [condition, track-2, critical]
---
```

### 온톨로지 문서 (예: Event)
```yaml
---
entity_type: CoreEntity
entity_name: Event
entity_id: entity:event:v0.1

# 온톨로지 메타데이터
version: "0.1"
parent: [LoopInstance]
relations:
  - type: contains
    source: Episode
    direction: incoming
    cardinality: "0..1:N"

# 🆕 전략 연결
strategy_link:
  validates: [MH3]
  part_of: [Project:Ontology_v0.1]
  enables: [Condition_B]
  supports: [Track_2_Data]

# 🆕 가설 검증 기여
hypothesis_contribution:
  - hypothesis: "Loop는 모델링 가능"
    evidence: "Event로 meal/emotion/urge/binge 모두 표현 가능"

# GraphRAG
community: [C1_Core_Entities, C3_Causality]
importance: critical
centrality: 0.95

# 다층 요약
summaries:
  executive: "원자적 사실 기록 엔티티"
  technical: "관찰 기반 최소 단위 데이터"
  detailed: "..."

tags: [ontology/entity, version/v0-1, core]
---
```

---

## 🚀 작업 규칙

### 파일 생성 위치 (반드시 준수)
| 내용 유형 | 생성 위치 | 예시 | 상태 |
|----------|----------|------|------|
| 10년 비전/Meta Hypotheses | `01_North_Star/` | MH3 문서 | 부분 완성 |
| 3년 Conditions | `20_Strategy/3Y_Conditions/` | Condition B | 부분 완성 |
| 12개월 Tracks | `20_Strategy/12M_Tracks/` | Track 2 | 완성 |
| 온톨로지 엔티티 | `30_Ontology/Entities/` | Event 정의 | 부분 완성 |
| 온톨로지 관계 | `30_Ontology/Relations/` | contains 관계 | 생성 예정 |
| 온톨로지 규칙 | `30_Ontology/Rules/` | Rule A | 생성 예정 |
| 온톨로지-전략 연결 | `30_Ontology/_Strategy_Link.md` | 전략 연결 | 생성 예정 |
| 프로젝트 | `50_Projects/P{N}_{Name}/` | Ontology v0.1 | 생성 예정 |
| 가설 검증 | `60_Hypotheses/` | Loop 모델링 가능 | 생성 예정 |
| 실험 결과 | `70_Experiments/Use-cases/` | 검증 결과 | 폴더 존재 |
| 템플릿 | `00_Meta/_TEMPLATES/` | 전략/온톨로지 템플릿 | 폴더 존재 |

### 전략 문서 작성 시
1. **entity_type** 명확히 지정 (NorthStar, MetaHypothesis, Condition, Track, Project, Task)
2. **if_broken** 조건 명시 (무엇이 트리거되는지)
3. **enables/validated_by** 관계 명시
4. **수치는 중단 신호지 목표 아님** 강조

### 온톨로지 문서 작성 시
1. **strategy_link** 섹션 필수 (validates, enables, supports)
2. **hypothesis_contribution** 섹션 추가
3. **community** 소속 명시
4. **다층 요약** (executive/technical/detailed) 작성
5. **예시 포함** (JSON, 시나리오)

### 관계 문서화
- 전략 → 온톨로지: `validates`, `enables`, `supports`
- 온톨로지 내부: `contains`, `evaluatedBy`, `precedes`, `triggers`
- 전략 내부: `unlocks`, `triggersShutdown`, `implements`

---

## ⚠️ 절대 규칙 (Immutable Rules)

### v0.1 고정 사항 (절대 변경 금지)
- ❌ 5개 코어 엔티티 (Event, Episode, LoopStateWindow, ActionExecution, OutcomeMeasurement) 삭제/의미 변경
- ❌ ID 필드명 변경 (eventId, episodeId, stateWindowId, actionExecutionId, outcomeId)
- ❌ Reference 구조 파괴 (episodeId, actionExecutionId 참조)
- ❌ 공통 필드 제거 (id, userId, createdAt, updatedAt, source, specVersion)
- ❌ 4조건 규칙 (Rule A-D) 변경

### 허용되는 변경
- ✅ 새 엔티티 추가 (Rule A 위반 아님)
- ✅ 새 필드 추가 (기존 필드 의미 유지)
- ✅ payload 내부 구조 확장

### 전략 문서 원칙
- ❌ 수치를 목표로 설정 금지 (중단 신호로만)
- ❌ "성공/실패" 용어 사용 금지 ("가설 검증/반증")
- ✅ Condition 깨짐 시 명확한 대응 명시
- ✅ if_broken 조건 항상 명시

---

## 🔍 GraphRAG 활용

### GraphRAG가 답할 수 있어야 하는 질문

**Global 질문 (전체 맥락)**:
- "이 회사의 10년 목표는?" → Inner Loop OS 글로벌 표준
- "온톨로지는 왜 만드나?" → MH3 검증 + Condition B enable + Track 2 실행
- "MH3가 거짓이면?" → 회사 존재 이유 재검토

**Conditional 질문 (If-Then)**:
- "Condition B가 깨지면?" → 데이터 전략 폐기 → 3년 전략 포기
- "온톨로지 실패하면?" → MH3 위험 → 회사 재검토 OR v0.2 재설계
- "패턴 10개 안 되면?" → Condition B 미달 → 데이터 전략 폐기

**Relation 질문 (연결)**:
- "Event 엔티티는 어떤 가설 검증?" → MH3 (데이터 모델링 가능)
- "Track 2와 온톨로지의 관계?" → 온톨로지는 Track 2의 Focus 3
- "온톨로지 성공 시 unlock?" → Condition B → 3년 전략 → 의료 진입

**Timeline 질문 (시계열)**:
- "12개월 후 성공 조건?" → Condition A,B 명확화 + Condition D 확보
- "3년 전략 진입 조건?" → Condition A,B,D,E 충족
- "온톨로지 v0.1 → v0.2 트리거?" → 3개월 안정 + 패턴 10개 + 새 요구사항

**문서**: [[_Graph_Index]], [[30_Ontology/GraphRAG 최적화 가이드]]

---

## 🛠️ 일반적인 작업 워크플로우

### 새 전략 가설 추가
1. 가설 타입 결정 (MetaHypothesis, Condition, Track, Hypothesis)
2. 적절한 폴더에 문서 생성 (`01_North_Star/`, `20_Strategy/`)
3. YAML frontmatter 작성 (entity_type, if_broken, validates/enables)
4. 관계 명시 (상위/하위 가설, 온톨로지 연결)
5. `_Graph_Index.md` 업데이트
6. 관련 MOC 업데이트

### 새 온톨로지 엔티티 추가
1. `30_Ontology/Entities/`에 문서 생성
2. YAML frontmatter에 **strategy_link** 섹션 필수
3. **hypothesis_contribution** 작성 (어떤 가설 검증에 기여하는지)
4. 3-level summary 작성 (executive/technical/detailed)
5. 관계 섹션 추가 (테이블 형식)
6. JSON 예시 포함
7. `_MOC 온톨로지 개발.md` 업데이트
8. `_Graph_Index.md` 업데이트

### 온톨로지-전략 갭 분석
1. 온톨로지 스펙 작성
2. SoSi/KkokKkokFit 실제 구현 확인
   - SoSi: `/Users/gim-eunhyang/dev/flutter/sosi`
   - KkokKkokFit: `/Users/gim-eunhyang/dev/flutter/kkokkkokfit_web`
3. 갭 분석:
   - 온톨로지에만 있음 → 구현 계획
   - 구현에만 있음 → 온톨로지 확장
4. 조정:
   - 온톨로지가 더 나음 → 구현 변경 제안 (마이그레이션)
   - 구현이 더 현실적 → 온톨로지 조정 (v0.1 규칙 위반 금지)
5. 결과를 `70_Experiments/Use-cases/`에 문서화

### Condition 체크
1. 해당 Condition 문서 열기 (`20_Strategy/3Y_Conditions/`)
2. metrics 현재 값 업데이트
3. risk_level 재평가
4. break_triggers 체크 (충족 시 폐기 결정)
5. 관련 Track/Project 상태 확인
6. `_Graph_Index.md` 업데이트

---

## 📚 참고 문서 (Quick Links)

### 전략 계층
- [[10년 비전]] - `01_North_Star/10년 비전.md`
- [[MH3_데이터_모델링_가능]] - `01_North_Star/MH3_데이터_모델링_가능.md` ⭐
- [[Condition_B_Loop_Dataset]] - `20_Strategy/3Y_Conditions/Condition_B_Loop_Dataset.md` ⭐
- [[Track_2_Data]] - `20_Strategy/12M_Tracks/Track_2_Data.md` ⭐

### 온톨로지 계층
- [[Ontology-lite v0.1]] - `30_Ontology/Schema/v0.1/`
- [[_Strategy_Link]] - `30_Ontology/_Strategy_Link.md` ⭐
- [[Event (GraphRAG 최적화 예시)]] - `30_Ontology/Entities/`
- [[GraphRAG 최적화 가이드]] - `30_Ontology/GraphRAG 최적화 가이드.md`

### 시스템 정의
- [[Inner Loop OS 정의v1]] - `40_LOOP_OS/Inner Loop OS 정의v1.md`

### 인덱스
- [[_Graph_Index]] - `_Graph_Index.md` ⭐
- [[_HOME]] - `_HOME.md`

---

## 🎓 자주 묻는 질문 (FAQ)

**Q: 온톨로지와 전략은 어떤 관계?**
A: 온톨로지는 MH3를 검증하고 Condition B를 enable하는 **전략 실행 도구**. 온톨로지 없으면 데이터 전략 불가능.

**Q: Condition이 깨지면 어떻게 되나?**
A: Condition마다 if_broken 명시. 예: Condition B 깨짐 → 데이터 전략 폐기.

**Q: 수치 목표는 어디에?**
A: 수치는 **목표가 아니라 중단 신호**. Condition/Track의 metrics는 "이 밑으로 떨어지면 폐기"하는 임계치.

**Q: v0.1 규칙을 바꾸고 싶으면?**
A: Rule A-D 고정. 새 엔티티 추가는 가능하나 기존 5개는 절대 변경 금지. v0.2로 승격 계획.

**Q: GraphRAG는 어떻게 쓰나?**
A: Microsoft GraphRAG나 LangChain+Neo4j. YAML frontmatter의 관계 정보를 그래프로 구축.

---

## 🤖 Claude Code 통합

### 커스텀 슬래시 커맨드
`.claude/commands/` 폴더에 커스텀 슬래시 커맨드를 추가할 수 있습니다.

**예시 사용 케이스**:
- `/new-strategy` - 새로운 전략 가설 문서 생성
- `/new-entity` - 새로운 온톨로지 엔티티 생성
- `/check-condition` - Condition 상태 체크 및 업데이트
- `/update-graph` - _Graph_Index.md 자동 업데이트

### 커스텀 스킬
`.claude/skills/` 폴더에 특화된 스킬을 추가할 수 있습니다.

**예시 사용 케이스**:
- `strategy-analyzer` - 전략 계층 분석 및 관계 검증
- `ontology-validator` - v0.1 규칙 위반 체크
- `gap-analyzer` - 온톨로지-구현 갭 분석

### 자동화 스크립트
`scripts/` 폴더에 반복 작업 자동화 스크립트를 추가할 수 있습니다.

**참고**: 이 vault는 순수 마크다운 기반이므로, 스크립트는 주로 문서 생성/검증/인덱싱에 사용됩니다.

---

## 📌 중요 참고 사항

### Obsidian Vault 특성
- **코드 실행 없음**: 이것은 지식 관리 vault이지 소프트웨어 프로젝트가 아닙니다
- **빌드 명령 없음**: `npm`, `cargo`, `go build` 등의 명령은 사용하지 않습니다
- **테스트 없음**: 단위 테스트나 통합 테스트가 없습니다
- **마크다운 중심**: 모든 작업은 `.md` 파일 생성, 편집, 구조화에 집중됩니다

### 실제 구현 프로젝트
이 vault는 전략과 온톨로지 **명세**를 관리합니다. 실제 구현은:
- **SoSi**: `/Users/gim-eunhyang/dev/flutter/sosi`
- **KkokKkokFit**: `/Users/gim-eunhyang/dev/flutter/kkokkkokfit_web`

온톨로지-구현 갭 분석 시 이 경로들을 참조하세요.

---

---

## 🛠️ Validation & Automation

### Python Scripts

This vault includes three Python scripts for maintaining data integrity:

#### 1. Validate Schema
```bash
python3 scripts/validate_schema.py .
```

Validates all markdown frontmatter against schema rules:
- Checks required fields for each entity type
- Validates ID format patterns (ns:001, mh:1-4, cond:a-e, etc.)
- Verifies status values
- Ensures parent_id references are valid

**Scans**: `01_North_Star/`, `20_Strategy/`, `50_Projects/`, `60_Hypotheses/`, `70_Experiments/`
**Excludes**: `00_Meta/_TEMPLATES/`, `10_Study/`, `30_Ontology/`, `40_LOOP_OS/`, `90_Archive/`

#### 2. Check Orphans
```bash
python3 scripts/check_orphans.py .
```

Detects broken references:
- Finds parent_id references to non-existent entities
- Checks project_id and hypothesis_id validity
- Verifies validates/validated_by symmetry
- Reports broken outgoing_relations

**Note**: Currently reports warnings but doesn't block commits

#### 3. Build Graph Index
```bash
python3 scripts/build_graph_index.py .
```

Auto-generates `_Graph_Index.md`:
- Scans all entities with frontmatter
- Derives children_ids from parent_id
- Derives incoming_relations from outgoing_relations
- Creates summary tables and relationship maps
- Flags critical entities

**Auto-runs**: On every commit via pre-commit hook

### Recommended Workflow

**Before creating new entity documents**:
1. Check existing templates in `00_Meta/_TEMPLATES/`
2. Follow YAML frontmatter standards from this guide
3. Use correct entity_id patterns

**After editing entity documents**:
```bash
# Validate your changes
python3 scripts/validate_schema.py .

# Check for broken links
python3 scripts/check_orphans.py .

# Regenerate graph index
python3 scripts/build_graph_index.py .
```

**On git commit**:
- All three scripts run automatically via pre-commit hook
- `_Graph_Index.md` auto-updates and stages
- Commit blocked if validation fails

---

**마지막 업데이트**: 2025-12-18
**문서 버전**: 3.2 (automation scripts 문서화)
**작성자**: Claude Code
**변경사항**:
- Python 스크립트 사용법 추가
- 검증 워크플로우 명시
- pre-commit hook 동작 설명 추가
