# Vault 운영용 SSOT 맵 — Ontology-lite(회사 운영) 버전
> **문서 ID**: SSOT:Decision→Action→Evidence v1.0
>
> **목적**: Vault 시스템을 “의사결정→행동→증거→업데이트”의 **단일 루프**로 고정(SSOT)하고, 속도가 빠른 상황에서도 **일희일비를 줄이면서 판단 정확도를 높이기**.
>
> **권장 위치**: `50_Projects/Vault_System/_SSOT_Decision_Action_Evidence_Map.md`

---

## 0) 이 문서는 무엇을 고정하나
### 우리가 운영에서 절대 잃으면 안 되는 3가지
1. **의사결정 기록은 최소 입력으로 남는다** (속도에 맞춰 지속 가능)
2. **결과 평가는 Evidence 기반으로만 한다** (감정/기억 왜곡 방지)
3. **전략 변경은 트리거 기반으로만 한다** (단일 사건으로 세계관 변경 금지)

### 핵심 원칙(한 줄)
> **계산은 코드/자동화가, 판단은 사람이(Preview→Accept)**

---

## 1) Quick Links (기존 문서)
### Vault 구조/인덱스
- `README.md`
- `[[ _Graph_Index.md ]]` (자동 생성)

### Ontology-lite(원리) & 전략 연결
- `[[30_Ontology/Schema/v0.1/Ontology-lite v0.1 (ILOS) — 규칙(4조건) + 최소 엔티티 스펙]]`
- `[[30_Ontology/_Strategy_Link]]`
- `[[50_Projects/2025/P001_Ontology/project]]`

### Evidence / Impact(A/B) 레일
- `.claude/commands/retro.md` (회고 → Evidence 변환 커맨드)
- `.claude/skills/retrospective-to-evidence/SKILL.md`
- `[[50_Projects/Vault_System/Rounds/prj-impact-schema-v2/project]]`
- `impact_model_config.yml`

---

## 2) 사람 친화 용어(별칭) — “ID는 유지, 표시명만 바꾼다”
> **규칙**: ID(예: `cond-a`)는 SSOT/자동화를 위해 유지한다.
> 사람(은향/명학)이 읽는 화면/문서/회의에서는 아래 별칭을 우선 사용한다.

### 2.1 3Y Conditions (cond-*)
| ID | 사람용 별칭 | 한 줄 의미 |
|---|---|---|
| `cond-a` | **PMF 관문** | 국내 PMF가 열렸는가 |
| `cond-b` | **패턴/데이터 관문** | 재현 패턴(Loop Dataset)이 늘어나는가 |
| `cond-c` | **글로벌 데이터 관문** | 문화권 확장 가능한 데이터가 확보되는가 |
| `cond-d` | **런웨이(생존선)** | 현금/매출로 지속 가능성이 확보되는가 |
| `cond-e` | **팀/조직 관문** | 팀이 이 속도를 감당 가능한가 |

### 2.2 A/B 및 증거 용어
| 시스템 용어 | 사람용 표시명 |
|---|---|
| `expected_impact` / A | 기대 베팅(예상 효과) |
| `realized_impact` / B | 실제 결과(증거 기반) |
| `tier` | 결정 레벨(전략/기반/운영) |
| `impact_magnitude` | 효과 크기(대/중/소) |
| `evidence_strength` | 신호 강도(정보 vs 운) |
| `normalized_delta` | 목표 대비 달성률 |
| `attribution_share` | 기여도(외부요인 제외) |
| `learning_value` | 학습 가치 |

---

## 3) Ontology-lite 관점 도식화

### 3.1 정적 구조(엔티티 계층 + 관계)
> “전략 계층(목표 구조)” + “지식/증거 계층(검증 구조)”가 동시에 존재한다.

```mermaid
flowchart TD
  NS[NorthStar] --> MH[MetaHypothesis]
  MH --> C[Condition (cond-a~e)]
  C --> T[Track (trk-1~6)]
  T --> PGM[Program]
  PGM --> PRJ[Project]
  PRJ --> TSK[Task]

  %% Knowledge / Proof layer
  T --> H[Hypothesis]
  H --> EXP[Experiment]
  PRJ -- validates / primary_hypothesis_id --> H
  EVD[Evidence] -- about(project) --> PRJ
  EVD -- supports / falsifies --> H
  RETRO[Retrospective] --> EVD
```

### 3.2 동적 흐름(결정→행동→증거→업데이트)
> “일희일비 방지 장치”의 본체는 **결과가 아니라 업데이트 규칙**이다.

```mermaid
flowchart LR
  D[Decide<br/>(시작/전환/중단/우선순위)] --> A[Action<br/>(Task 수행)]
  A --> R[Result/Metric 변화]
  R --> EV[Evidence 생성<br/>(회고→증거)]
  EV --> B[B(Realized) 자동 계산]
  D --> Aexp[A(Expected) 자동 생성<br/>(tier/magnitude/condition)]
  Aexp --> Comp[A vs B 비교]
  B --> Comp
  Comp --> Upd[Update<br/>- Hypothesis 업데이트<br/>- Condition/Track 롤업]
  Upd --> Next[Next Decide]
```

---

## 4) Action(회사 운영 버전)을 어떻게 “기록/측정”하나
### 원칙
- **새 입력 시스템 금지**: 바쁘면 포기한다.
- Action은 이미 있는 흔적에서 자동 추출한다:
  - Task/Project **상태 변화**
  - Task/Project **결정 1줄 메모**
  - 종료 시점의 **회고→Evidence**

### Action 타입(3종)
1. **Decide**: 착수/전환/중단/우선순위 변경
2. **Ship**: 배포/런칭/적용 등 외부로 나간 변화
3. **Learn**: 회고/실험 결과로 판단이 업데이트된 변화

### 자동 캡처 트리거(권장 규칙)
- Task `doing→done` : Ship 후보
- Task `todo/doing→hold/blocked` : Decide 후보(보류/중단)
- Project `planning→doing` : Decide 후보(착수)
- Project `doing→done/cancelled` : Ship/Decide + **Retro 필수**

---

## 5) 운영 루틴(최소 입력) — “속도 빠른 상황에서 굴러가는 버전”

### 5.1 시작(30초): A(Expected)의 재료만 남긴다
프로젝트 생성/착수 시 아래 3가지만 확정하면 A는 자동화 가능:
- `tier` : `strategic | enabling | operational`
- `impact_magnitude` : `high | mid | low`
- `conditions_3y` : 1~2개 (PMF/데이터/런웨이/팀/글로벌)

> `confidence`는 기본값(예: 0.7) 자동, 세부 가중치(`condition_contributes`)는 나중에.

### 5.2 진행 중(5초): “결정은 1줄만” 남긴다
Project 또는 핵심 Task의 notes에 아래 형식 1줄만 남긴다.

**결정 1줄 템플릿(복붙용)**
- `DECISION: (무엇을) → (왜) | NEXT: (다음 행동 1개) | WINDOW: (유효기간)`

예)
- `DECISION: 와디즈 메시지A 폐기 → 전환율 1% 미만 지속 | NEXT: 메시지B 3안 실험 | WINDOW: 2주`

### 5.3 종료(90초): 회고 → Evidence로 B(Realized)를 자동 생성한다
프로젝트가 done/cancelled 되거나 “라운드가 끝난 사건”이 있으면:
1) **Retrospective**를 짧게 작성(아래 템플릿)
2) `.claude/commands/retro.md` 흐름대로 **Retrospective → Evidence 변환(Preview→Accept)**
3) Evidence가 생성되면 B는 자동 계산된다.

---

## 6) Evidence 시스템(현재 설계) — B를 “채점”이 아니라 “증거”로 만든다
### Evidence 최소 필드(운영 최소)
- `project` : 대상 프로젝트
- `summary` : 1줄 요약
- `normalized_delta` : 0~1 (목표 대비 달성률)
- `evidence_strength` : `strong | medium | weak`

### 권장 필드(가능하면)
- `attribution_share` : 0~1 (외부 요인 제외)
- `learning_value` : `high | medium | low`
- `window_id`, `time_range` : 결과가 어떤 기간의 것인지
- `metrics_snapshot` : 핵심 지표 스냅샷(최대 20개)
- `validated_hypotheses / falsified_hypotheses` : 가설 판정 연결

### 판정 규칙(권장; 스킬 문서 참고)
- `normalized_delta ≥ 0.8` → succeeded
- `delta < 0.5` AND `learning_value=high` → failed_but_high_signal
- `delta < 0.5` AND `learning_value=low` → failed_low_signal
- `attribution_share < 0.3` → inconclusive

---

## 7) 의사결정 화면/회의에서 사람에게 보여줄 최소 신호(결정권자 모드)
> 숫자(A/B) 자체는 펼쳐보기로 숨기고, 아래 4개만 기본으로 본다.

1) **어디에 걸렸나**: (PMF/데이터/런웨이/팀/글로벌) 1~2개
2) **방향**: ↑(개선) / →(유지) / ↓(악화)
3) **신호 강도**: strong/medium/weak (정보 vs 운)
4) **다음 행동 1개**: 실험/유지/전환/중단

---

## 8) 템플릿(복붙용)

### 8.1 Retrospective 최소 템플릿(종료 90초)
**제목**: (프로젝트명) 회고 — (YYYY-MM / Round)

- **목표(Target)**:
- **실제(Actual)**:
- **잘 된 것(1~2)**:
- **안 된 것(1~2)**:
- **핵심 학습(1~2)**:
- **다음 결정(1)**: go / pivot / no-go / pending

> 작성 후 `.claude/commands/retro.md`로 Evidence 변환(Preview→Accept).

### 8.2 Evidence 최소 템플릿(운영 버전)
- project: prj-XXX
- summary: (한 줄)
- normalized_delta: 0.00~1.00
- evidence_strength: strong|medium|weak
- attribution_share: 0.0~1.0 (기본 1.0)
- learning_value: high|medium|low
- window_id: YYYY-MM
- time_range: YYYY-MM-01..YYYY-MM-31
- metrics_snapshot:
  - key: value

---

## 9) 드리프트 방지 규칙(이 문서의 불변 원칙)
1) **ID는 바꾸지 않는다.** (사람용 별칭만 변경)
2) **결정은 1줄 포맷을 유지한다.** (길어지면 루틴 붕괴)
3) **B는 점수가 아니라 Evidence로 만든다.**
4) **전략 변경은 단일 사건으로 하지 않는다.** (신호 강도/반복/관문 영향으로 업데이트)
