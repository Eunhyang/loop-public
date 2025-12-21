---
entity_type: Concept
entity_id: concept-os-stickiness
entity_name: OS_Stickiness
created: 2025-12-22
updated: 2025-12-22
status: active
aliases:
- OS 점착
- Zero-to-One 조건
tags:
- concept
- pmf
- stickiness
---

# OS 점착 (Zero-to-One 조건)

> 개념 ID: `concept-os-stickiness` | 상태: Active

## 정의

PMF는 **"많이 쓰는 앱"**이 아니라 **"기본값이 되는 재방문 + 없어지면 불안"**으로 정의한다.

---

## 기준 이벤트 정의 (Problem Event / Trigger Event)

> ⚠️ 모든 Episode OS 지표(TTR, LTO, D+1, TBR, Relapse)는 이 정의를 전제로 한다.

### Problem Event (문제행동 이벤트)
```
problem_event := 폭식(자가리포트) OR 통제붕괴(충동≥7 AND problem_behavior 발생)
```

### Problem Behavior (문제행동 목록)
```
problem_behavior ∈ {폭식, 과식, 야식, 배달/간식 폭주, 음주, 쇼핑 등 보상행동}
```

### Trigger Event (트리거 이벤트)
```
trigger_event := 충동≥7 (자가리포트)
```
> TBR-24 측정의 기준. Micro Brake 단계에서 사용.

### Cohort 정의
```
Cohort := problem_event ≥ 1회 + 개입 세션 ≥ 1회 사용자
```
> TTR/Relapse의 "4주 내 개선" 측정 시 분모.

| 유형 | 정의 | 소스 |
|------|------|------|
| 폭식 (자가리포트) | 사용자가 "폭식했다"고 직접 보고 | 식후 감정일기, 회복 프로토콜 진입 시 |
| 통제붕괴 | 충동 레벨 ≥ 7 AND problem_behavior 발생 | Episode Logging 데이터 |
| 트리거 | 충동 레벨 ≥ 7 (행동 발생 전) | Episode Logging 데이터 |

---

## 4가지 점착 신호

| 신호 | 질문 | 측정 지표 |
|------|------|-----------|
| 1. 기본값 | 위험 상태에서 가장 먼저 떠오르는가? | TBR-24, D+1 Recovery |
| 2. 완화 | 켠 뒤 빨리 내려오는가? | TTR (Time-to-Relief) |
| 3. 간격 | 재발 간격이 늘어나는가? | Relapse Interval |
| 4. 비가역 | "없으면 불안" 언어가 수렴하는가? | PUPI |

---

## 왜 DAU/스트릭이 아닌가?

### 습관앱 스티키니스 (❌)
- DAU/MAU 끌어올리기
- 매일 사용 만들기
- 스트릭/루틴 강화
- → **레드오션 문법으로 끌려감**

### Episode OS 스티키니스 (✅)
- Trigger-based Return: 위험 순간에 "가장 먼저" 켜는가
- Time-to-Relief: 켜고 나서 빨리 내려오는가
- Relapse Interval: 재발 간격이 늘어나는가
- "없으면 불안" 지표: 삭제가 아니라 보험처럼 유지되는가
- → **OS형 스티키니스**

---

## Wedge(습관 PMF) Guardrails

> ⚠️ OS 확장을 위해 습관 PMF를 버리는 게 아니다. 습관 PMF는 **Wedge(쐐기)**이며, 이게 망가지면 OS 확장도 같이 망한다.

| 지표 | 정의 | 임계치 | 중단 신호 |
|------|------|--------|-----------|
| Meal Session Completion Rate | 시작한 식사 세션 완료율 | ≥ 70% | 50% 미만 3개월 |
| Timer Start Rate | 활성 사용자 중 주 3회+ 타이머 시작 | ≥ 50% | 30% 미만 |
| Avg Meal Duration (10~20분) | 적정 식사 시간대 비율 | ≥ 60% | 40% 미만 |
| Session Drop-off at First 30s | 첫 30초 이탈률 | ≤ 20% | 40% 초과 |

---

## 지표 정의

### TTR (Time-to-Relief)
- **정의**: 개입 시작 → 충동/불안이 내려갈 때까지 시간
- **분모**: 개입 시작한 세션
- **임계치**:
  - (절대) p50 ≤ 10분
  - (상대) Cohort 기준 4주 내 20% 개선
- **측정**: 개입 시작 시점 ~ "완화" 체크 시점
- **결측 처리**: 완화 체크 미응답 30분 이내 => censored as 30min

### Relapse Interval
- **정의**: problem_event 재발까지 간격
- **분모**: problem_event 발생 사용자
- **임계치**:
  - (절대) 주 단위 증가
  - (상대) Baseline 대비 4주 내 +3일 이상
- **측정**: problem_event 간 시간 간격

### D+1 Recovery Activation
- **정의**: problem_event 다음날 회복 프로토콜 **실행** 시작률
- **분모**: problem_event가 기록된 사용자
- **분자**: 다음날 회복 프로토콜을 실제 시작한 사용자
- **임계치**: 60%+
- **LTO와 구분**: D+1은 "실행", LTO는 "오픈"

### LTO (Lag-to-Open)
- **정의**: problem_event 후 앱을 다시 **여는** 데 걸린 시간
- **분모**: problem_event 발생 사용자
- **임계치**: p50 ≤ 24h
- **측정**: problem_event 시점 → 다음 앱 오픈 시점 (분포/중앙값)
- **D+1과 구분**: LTO는 "오픈 시점", D+1은 "실행 여부"

### TBR-24 (Trigger-based Return)
- **정의**: trigger_event 발생 후 24h 내 앱 실행률
- **분모**: trigger_event 감지된 사용자
- **임계치**: 40%+
- **현재 상태**: planned (Micro Brake 단계에서 측정 예정)
- **trigger_event**: 충동≥7 (자가리포트)

### PUPI (Post-usage PMF Index)
- **정의**: "없으면 불안" 합성지표
- **PUPI=1 조건**: survey 문항 1개 + 행동 시그널 1개 이상 **동시 충족**
  - **Survey**: "이 앱 없으면 불안하다" 동의 (리커트 4점 이상)
  - **행동 시그널** (1개 이상):
    1. 트리거 발생 시 1순위로 앱 오픈 (대체재보다 먼저)
    2. 90일 내 재방문 OR 30일 내 2회 이상 복귀
    3. 유료 결제 이유가 "필요할 때 확실히"
- **임계치**: Tier1/2 중 50%가 PUPI=1

---

## 2층 PMF 구조

| 단계 | 설명 | 측정 지표 | 현재 상태 |
|------|------|-----------|-----------|
| Recovery OS | 다음날 복귀 (폭식 후 회복) | D+1 Recovery, LTO | ✅ 이미 작동 |
| Micro Brake | 당일 15~30초 초저마찰 개입 | TBR-24 | 🔜 planned |

**전략**:
1. Recovery OS로 D+1 Recovery 60%+ 달성
2. 이후 Micro Brake로 당일 개입까지 확장

---

## Emergency Brake Free 원칙

> Track 6 유료화의 불변 원칙

| 영역 | Paywall | 범위 정의 |
|------|---------|-----------|
| **Quick Brake (15~30초)** | **Free** | 타이머 시작 + 심호흡 + 포만감 1회 체크 |
| **회복 시작 (첫 1분)** | **Free** | 식후 감정일기 진입 + 첫 문항 |
| 대시보드/인사이트 | Paid | 패턴 분석, 트렌드, 예측 |
| 개인화/패턴 추천 | Paid | 맞춤 개입, 트리거 예측 |
| 회복 리플레이/심화 | Paid | 전체 회복 프로토콜, 히스토리 |

> ⚠️ Free 범위를 넓히면 수익 불가, 좁히면 PMF 붕괴.

---

## 관련 문서

- [[Condition_A_PMF]] - 이 정의를 사용하는 Condition
- [[Track_1_Product]] - Episode OS로 제품 타입 정의
- [[Track_6_Revenue]] - 보험형 가치로 유료화 정의

---

**최초 작성**: 2025-12-22
**마지막 업데이트**: 2025-12-22
