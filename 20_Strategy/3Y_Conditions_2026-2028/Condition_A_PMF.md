---
entity_type: Condition
entity_id: cond-a
entity_name: Condition_A_PMF
created: 2024-12-18
updated: 2024-12-20
status: in_progress
parent_id: mh-1
aliases:
- cond-a
- Condition_A_PMF
- cond-a
- 국내 PMF
outgoing_relations:
- type: triggers_shutdown
  target_id: action:pmf_pivot
  description: 깨지면 PMF 가설 폐기
- type: depends_on
  target_id: mh-2
  description: MH2 Intervenability 의존
validates: []
validated_by:
- mh-1
- mh-2
- trk-1
condition: |
  1차(인지/프레임): Tier1/2가 Loop 언어로 문제를 설명하거나 Loop 기반 선택을 한다
  2차(비가역/의존): 문제 발생 시 LOOP를 찾는 것이 기본값이 되고, 중단 시 불안/회귀불가 신호가 나타난다
unlock: Core OS 강화, GLP-1 콘텐츠 투입, 의료 제휴 검토
if_broken: UX 재설계, 고밀도 중심 축소, '섬세한 먹기 OS' 소프트 피봇
metrics:
# === 기준 이벤트 정의 (모든 지표의 전제) ===
# problem_event := 폭식(자가리포트) OR 통제붕괴(충동≥7 AND problem_behavior 발생)
# problem_behavior ∈ {폭식, 과식, 야식, 배달/간식 폭주, 음주, 쇼핑 등 보상행동}
# trigger_event := 충동≥7 (자가리포트)
# Cohort := problem_event ≥ 1회 + 개입 세션 ≥ 1회 사용자

# === 핵심 지표 (Episode OS) ===
- name: TTR (Time-to-Relief)
  threshold: "(절대) p50 ≤ 10분 / (상대) Cohort 기준 4주 내 20% 개선"
  current: 측정 중
  status: 진행 중
  note: "결측 처리: 완화 체크 미응답 30분 이내 => censored as 30min"
- name: Relapse Interval
  threshold: "(절대) 주 단위 증가 / (상대) Baseline 대비 4주 내 +3일"
  current: 측정 중
  status: 진행 중
- name: D+1 Recovery Activation
  threshold: "60%+"
  current: 측정 중
  status: 진행 중
  note: "분모: problem_event 기록된 사용자 / 분자: 다음날 회복 프로토콜 실행 시작"
- name: LTO (Lag-to-Open)
  threshold: "p50 ≤ 24h"
  current: 측정 중
  status: 진행 중
  note: "분모: problem_event 발생 사용자 / 측정: 오픈 시점만"
- name: PUPI (Post-usage PMF Index)
  threshold: "Tier1/2 중 50%가 PUPI=1"
  current: 측정 중
  status: 진행 중
  note: "PUPI=1: survey 1개 + 행동 시그널 1개 동시 충족"
- name: TBR-24 (Trigger-based Return)
  threshold: "trigger_event 발생 후 24h 내 앱 실행률 40%+"
  current: N/A
  status: planned
  note: "trigger_event := 충동≥7 / Micro Brake 단계에서 측정"

# === Guardrail 지표 (Wedge/습관 PMF 보존) ===
- name: Meal Session Completion Rate
  threshold: "≥ 70%"
  current: 측정 중
  status: guardrail
- name: Timer Start Rate
  threshold: "활성 사용자 중 주 3회+ 타이머 시작률 ≥ 50%"
  current: 측정 중
  status: guardrail
- name: Avg Meal Duration Distribution
  threshold: "10~20분대 식사 비율 ≥ 60%"
  current: 측정 중
  status: guardrail
- name: Session Drop-off at First 30s
  threshold: "첫 30초 이탈률 ≤ 20%"
  current: 측정 중
  status: guardrail
  note: "대시보드 홈/유료화 개편 시 코어 마찰 감지용"

# === 참고 지표 (왜곡 가능) ===
- name: DAU (Reference)
  threshold: "3,000~6,000"
  current: 측정 중
  status: reference
- name: 유지율 (Reference)
  threshold: "25~30%"
  current: 측정 중
  status: reference
risk_level: high
confidence: 0.5
tags:
- condition
- 3year
- critical
- pmf
priority_flag: critical
break_triggers:
# 1차 트리거 (프레임)
- 2026년 말까지 Tier1/2가 Loop 언어로 문제를 설명하지 않음
- Loop 기반 선택이 관찰되지 않음
# 2차 트리거 (비가역)
- 2026년 말까지 PUPI 임계치 미달 시 PMF 가설 수정
- D+1 Recovery Activation 40% 미만 지속 시 Episode OS 가설 재검토
# Guardrail 트리거 (Wedge 붕괴)
- Meal Session Completion Rate 50% 미만 3개월 지속 시 타이머 코어 재설계
- Session Drop-off at First 30s 40% 초과 시 UX 긴급 점검
---

# Condition A: 국내 PMF

> 조건 ID: `cond-a` | 상태: In Progress | 위험도: High

## 조건 선언

**"Tier1/2 사용자가 Loop 언어로 자신의 문제를 설명하거나 Loop 기반 선택을 하는가?"**

---

## 왜 이 Condition이 핵심인가

- Inner Loop OS 전략의 출발점은 **'사람이 이 문제를 문제로 인식하는가'**다.
- 체중·칼로리 이전에 **정서–섭식–습관 루프 언어가 실제로 작동**해야 한다.
- 이 단계에서 PMF가 없으면 이후 데이터·의료·GLP-1 전략은 모두 공중분해된다.
- 숫자 성장은 대체 가능하지만, **언어·선택·사고 프레임 변화는 대체 불가**다.
- 그래서 Condition A는 모든 전략의 **가장 상위 관문**이다.

---

## Hard Falsification Trigger

> **2026년 말까지 Tier1/2 사용자가 Loop 언어로 자신의 문제를 설명하거나 Loop 기반 선택을 하지 않는다면 PMF 가설 폐기**

### 이 Trigger를 선택한 이유

- DAU/유지율은 **마케팅·보상 구조로 왜곡 가능**하다.
- 반면 "자기 문제를 Loop 언어로 설명하는지"는 **위장 불가능한 신호**다.
- Loop 기반 선택은 사용자가 **인지 비용을 지불했음을 의미**한다.
- 이 변화가 없다면, 제품은 이해는 되지만 **삶을 바꾸지 못하는 도구**에 머문다.
- 그래서 정량보다 **정서·언어·선택 기준**을 트리거로 삼았다.

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

## OS 점착 정의 (Zero-to-One 조건)

> 참고: [[OS_Stickiness]]

PMF는 "많이 쓰는 앱"이 아니라 **기본값이 되는 재방문 + 없어지면 불안**으로 정의한다.

### 4가지 점착 신호
1. **기본값**: 위험 상태에서 가장 먼저 떠오르는가
2. **완화**: 켠 뒤 빨리 내려오는가 (TTR)
3. **간격**: 재발 간격이 늘어나는가
4. **비가역**: "없으면 불안" 언어가 수렴하는가

### 2층 PMF 구조
| 단계 | 설명 | 측정 지표 | 현재 상태 |
|------|------|-----------|-----------|
| Recovery OS | 다음날 복귀 (폭식 후 회복) | D+1 Recovery, LTO | ✅ 이미 작동 |
| Micro Brake | 당일 15~30초 초저마찰 개입 | TBR-24 | 🔜 planned |

### Wedge(습관 PMF) Guardrails
> ⚠️ OS 확장을 위해 습관 PMF를 버리는 게 아니다. 습관 PMF는 **Wedge(쐐기)**이며, 이게 망가지면 OS 확장도 같이 망한다.

| 지표 | 임계치 | 역할 |
|------|--------|------|
| Meal Session Completion Rate | ≥ 70% | 타이머 핵심 사용성 |
| Timer Start Rate | ≥ 50% (주 3회+) | 활성 사용자 코어 행동 |
| Avg Meal Duration (10~20분) | ≥ 60% | 개입 효과 기본 지표 |
| Session Drop-off at First 30s | ≤ 20% | 진입 마찰 감지 |

### PUPI 측정 규칙
> PUPI=1 조건: survey 문항 1개 + 행동 시그널 1개 이상 **동시 충족**

| 유형 | 항목 |
|------|------|
| Survey | "이 앱 없으면 불안하다" 동의 (리커트 4점 이상) |
| 행동 시그널 1 | 트리거 발생 시 1순위로 앱 오픈 (대체재보다 먼저) |
| 행동 시그널 2 | 90일 내 재방문 OR 30일 내 2회 이상 복귀 |
| 행동 시그널 3 | 유료 결제 이유가 "필요할 때 확실히" |

---

## 이게 깨지면 무너지는 가설들

- **MH1**: 사람은 정서–섭식–습관 루프를 지속적 문제로 인식한다
- "기록 + 개입"이 단순 위로가 아니라 **행동 전환을 만든다**는 가설
- Loop 언어가 **보편적 인터페이스가 될 수 있다**는 가설

---

## 고려했지만 채택하지 않은 대안

| 대안 | 배제 이유 |
|------|-----------|
| 체중 감소율 / BMI 변화 중심 PMF 정의 | 결과 지표로서 늦음 |
| 코칭 만족도·정서 안정감 설문 중심 판단 | 전략 전환 신호로 부적합 |
| "폭식 빈도 감소" 단일 지표 기준 | 단일 지표는 맥락을 놓침 |

→ **모두 결과 지표로서 늦고, 전략 전환 신호로는 부적합**

---

## 충족 시 Unlock

- Core OS 강화
- GLP-1 콘텐츠 투입
- 의료 제휴 검토

## Failure Branch

- UX 재설계
- 고밀도 중심 축소
- '섬세한 먹기 OS' 소프트 피봇
