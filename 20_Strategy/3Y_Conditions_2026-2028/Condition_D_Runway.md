---
entity_type: Condition
entity_id: cond-d
entity_name: Condition_D_Runway
created: 2024-12-18
updated: 2024-12-20
status: in_progress
parent_id: mh-4
aliases:
- cond-d
- Condition_D_Runway
- cond-d
- Runway
outgoing_relations:
- type: triggers_shutdown
  target_id: action:cost_reduction
  description: 미충족 시 비용 절감 모드
validates: []
validated_by:
- mh-4
condition: 월 매출 또는 런웨이가 전략 지속 가능 수준인가?
unlock: GLP-1 OS 착수
if_broken: 비용 절감, 비규제 매출 집중
metrics:
- name: 월 매출
  threshold: 2,000~5,000만 원
  current: 측정 중
  status: 진행 중
- name: 런웨이
  threshold: 18개월 이상
  current: 측정 중
  status: 진행 중
risk_level: medium
confidence: 0.7
tags:
- condition
- 3year
- financial
- runway
priority_flag: high
break_triggers: []
---

# Condition D: Runway

> 조건 ID: `cond-d` | 상태: In Progress | 위험도: Medium

## 조건 선언

**"월 매출 또는 런웨이가 전략 지속 가능 수준인가?"**

- 월 2~5천만 원 또는 18개월 런웨이

---

## 왜 이 Condition이 핵심인가

- 아무리 맞는 전략도 **버틸 수 없으면 무의미**하다.
- D는 전략 가설이 아니라 **존속 가설**이다.
- 이 조건이 무너지면 모든 선택지는 "이상"이 아니라 "생존" 기준으로 바뀐다.
- 그래서 D는 다른 Condition과 **성격이 다르다**.
- 판단은 냉정해야 하고, 감정 개입은 최소화해야 한다.

---

## Hard Falsification Trigger

> **(재정은 정량 판단이므로 별도 Trigger 불필요)**

### 이 Trigger를 선택한 이유

- 재정은 정성 판단이 아니라 **정량 판단이 가능**하다.
- 별도의 Hard Trigger를 두면 오히려 판단을 늦춘다.
- 숫자가 기준선을 못 넘으면 즉시 대응하면 된다.
- 그래서 D는 **Failure Branch만으로 충분**하다.

---

## 이게 깨지면 무너지는 가설들

- 중장기 연구 지속 가능성
- PL3/PL4 병행 전략
- "속도보다 정확성"을 유지할 수 있다는 전제

---

## 고려했지만 채택하지 않은 대안

| 대안 | 배제 이유 |
|------|-----------|
| '의미 있는 전략이면 투자는 따라온다'는 낙관 가설 | 대표 판단을 흐리게 함 |
| 외부 지원금 의존 구조 | 자율성 상실 |

→ **대표 판단을 흐리기 때문에 배제**

---

## 충족 시 Unlock

- GLP-1 OS 착수

## Failure Branch

- 비용 절감
- 비규제 매출 집중
