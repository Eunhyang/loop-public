## 목표

Palantir “복제 수준”의 온톨로지를 지금 구현하지 않는다.

대신 **향후 확장이 ‘승격(promote)’로 끝나도록**, v0.1에서 되돌릴 수 없는 최소 규칙만 고정한다.

---

## A) Ontology-lite v0.1 확장 가능성 규칙 (4조건)

### Rule A — Type System 고정 (타입 안정성)

아래 5개 타입을 “코어 타입”으로 고정하고, 어떤 기능/제품 라인도 이 경계를 섞지 않는다.

- **Event**
- **Episode (LoopInstance)**
- **LoopStateWindow**
- **ActionExecution**
- **OutcomeMeasurement**

> 원칙: Type(스키마)와 Instance(실제 기록)를 혼용하지 않는다.
> 
> 코어 타입 추가는 v0.2+에서만, 코어 타입 삭제/의미 변경은 금지.

---

### Rule B — ID & Reference 불변 (참조 안정성)

모든 코어 엔티티는 **불변 ID**를 가지며, 관계는 최소한의 **Reference**로 항상 표현된다.

- Event → `eventId`
- Episode → `episodeId`
- LoopStateWindow → `stateWindowId`
- ActionExecution → `actionExecutionId`
- OutcomeMeasurement → `outcomeId`

필수 Reference 규칙:

- 모든 Event는 **0 또는 1개의 episodeId**를 가진다. (없으면 “미분류 이벤트”)
- 모든 ActionExecution은 **반드시 episodeId**를 가진다.
- 모든 OutcomeMeasurement는 **반드시 actionExecutionId**를 가진다.
- 모든 LoopStateWindow는 **반드시 episodeId**를 가진다.

> 원칙: v0.1 이후에도 ID/Reference 필드명과 의미는 절대 바꾸지 않는다.
> 
> (나중에 LinkType으로 승격할 수 있도록 “참조”를 남긴다.)

---

### Rule C — Action은 트랜잭션 + 전/후 윈도우를 강제 (인과 가능성)

ActionExecution은 “추천 문장”이 아니라 **실행 트랜잭션**으로 기록된다. 필수 포함:

- **actor**(user/coach/system)
- **parameters**(개입 파라미터)
- **startTime / endTime**
- **target**(최소: targetLoopTypes 또는 targetEventType)
- **adherence**(실행 여부/강도)

그리고 OutcomeMeasurement는 ActionExecution에 대해 **측정 윈도우(window)** 를 반드시 갖는다.

- 예: `next_2h`, `next_meal`, `today`, `next_7d`

> 원칙: Outcome은 “좋아짐/나빠짐” 서술이 아니라, window 기반의 측정값(또는 최소 스코어)로 남긴다.

---

### Rule D — specVersion 강제 (해석 규칙의 버전)

모든 코어 엔티티는 `specVersion`을 가진다.

- `specVersion`은 “이 기록을 해석하는 규칙 버전”이다.
- v0.1에서 시작해, v0.2/v0.3로 갈수록 **추가 필드/의미 확장**은 가능하되, v0.1 의미를 깨면 안 된다.

> 원칙: “데이터는 남고, 해석 규칙이 진화한다.”
> 
> Palantir급 거버넌스는 나중에 붙이고, 버전만 지금 고정한다.

---

## B) 최소 엔티티 스펙 (Core Entities)

### 0) 공통 필드 (모든 코어 엔티티 공통)

- `id` (불변)
- `userId`
- `createdAt`
- `updatedAt`
- `source` (app/coach/system/import)
- `specVersion` (예: “0.1”)

---

### 1) Event (원자 사실)

**정의:** 관찰 기반 “원자적 사실(fact)”. 단독으로는 상관까지만, 인과는 아님.

필수 필드

- 공통 필드
- `eventType` (예: meal, satiety_check, emotion_tag, urge, binge, sleep, pms, social, context_change 등)
- `timestamp`
- `payload` (type별 스키마는 v0.2부터 registry로 분리 가능)
- `episodeId` (optional; 미분류 이벤트 허용)

권장 필드

- `confidence` (self-report/coach-labeled/system-inferred)
- `tags` (context, environment, social)

---

### 2) Episode (LoopInstance) — 에피소드 컨테이너

**정의:** “한 번의 루프 단위”를 담는 상위 컨테이너.

예: 2–4시간 위험 구간, 폭식 전후 구간, 하루 저녁 루틴 블록 등.

필수 필드

- 공통 필드
- `episodeType` (예: risk_window, meal_episode, binge_episode, daily_block)
- `startTime`, `endTime`
- `status` (active/closed)

권장 필드

- `dominantLoopTypes` (emotional/eating/habit/reward/nervous)
- `contextClusterId` (있으면)
- `summary` (짧은 요약, optional)

---

### 3) LoopStateWindow (상태 벡터 윈도우)

**정의:** 30–60분(또는 micro/meso/macro) 단위의 “상태 벡터” 기록.

필수 필드

- 공통 필드
- `episodeId`
- `startTime`, `endTime`
- `timeScale` (micro/meso/macro)
- `stateVector` (최소 블록 구조)
    - `emotional_state` (valence/anxiety/emptiness 등)
    - `eating_state` (hunger/fullness/mealRegularity 등)
    - `habit_state` (contextTrigger/automaticity 등)
    - `reward_state` (cravingLevel/highRewardExposure 등)
    - `nervous_state` (arousal/shutdown 등)

권장 필드

- `derivedFeatures` (optional)
- `missingness` (결측률/품질)

---

### 4) ActionExecution (개입 실행 트랜잭션)

**정의:** 코치/시스템/사용자가 실제로 실행한 변화(중재). 인과의 “스위치”.

필수 필드

- 공통 필드
- `episodeId`
- `actionName` (v0.1에서는 문자열 허용; v0.2에서 ActionType registry로 승격)
- `actor` (user/coach/system)
- `parameters` (예: duration=10m, intensity=low, target=screen_time 등)
- `startTime`, `endTime`
- `target` (최소 1개)
    - `targetLoopTypes` (array) 또는 `targetEventType`
- `adherence` (performed/partial/skipped + optional score)

권장 필드

- `deliveryChannel` (push/chat/coach)
- `notes` (짧은 코치 메모)

---

### 5) OutcomeMeasurement (결과 측정)

**정의:** ActionExecution 이후 “윈도우 기반으로” 회수 가능한 결과 기록. 인과의 “증거”.

필수 필드

- 공통 필드
- `actionExecutionId`
- `window` (next_2h / next_meal / today / next_7d)
- `metricName` (v0.1에서는 문자열 허용; v0.2에서 Metric registry로 승격)
- `value` (number 또는 ordinal score)
- `baselineValue` (가능하면; 없으면 null)
- `delta` (가능하면; 없으면 null)

권장 필드

- `confidence`
- `notes`

---

## C) 최소 인과 구조 (Event–Action–Result)

- Event는 “인과 재료”
- ActionExecution은 “인과 스위치”
- OutcomeMeasurement는 “인과 증거”

v0.1의 성공 기준은 하나: **ActionExecution 1건마다 OutcomeMeasurement가 window 포함 형태로 붙는 것.**

---

## D) v0.1에서 ‘의도적으로 포기’하는 것 (나중에 승격)

- LinkType/Link를 1급 엔티티로 완전 구현 (v0.2+)
- ActionType registry(프로토콜 버전/제약/side effects) (v0.2+)
- Metric registry(계산식/윈도우 정의) (v0.2+)
- Governance(active/experimental/deprecated), 권한/감사 워크플로우 (B2B 단계에서)

---

## E) Palantir급으로 올라가는 승격 경로 (요약)

- Reference → LinkType/Link 승격
- actionName(string) → ActionType registry + rule-set 분리
- metricName(string) → Metric registry + derived computation
- specVersion 기반으로 거버넌스/감사/권한을 “덧대기”