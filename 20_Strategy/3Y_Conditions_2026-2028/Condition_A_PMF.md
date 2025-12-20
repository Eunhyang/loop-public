---
entity_type: Condition
entity_id: cond:a
entity_name: Condition_A_PMF
created: 2024-12-18
updated: 2024-12-20
status: in_progress
parent_id: mh:1
aliases:
- cond:a
- Condition_A_PMF
- cond-a
- 국내 PMF
outgoing_relations:
- type: triggers_shutdown
  target_id: action:pmf_pivot
  description: 깨지면 PMF 가설 폐기
- type: depends_on
  target_id: mh:2
  description: MH2 Intervenability 의존
validates: []
validated_by:
- mh:1
- mh:2
- trk:1
condition: Tier1/2 사용자가 Loop 언어로 자신의 문제를 설명하거나 Loop 기반 선택을 하는가?
unlock: Core OS 강화, GLP-1 콘텐츠 투입, 의료 제휴 검토
if_broken: UX 재설계, 고밀도 중심 축소, '섬세한 먹기 OS' 소프트 피봇
metrics:
- name: DAU
  threshold: 3,000~6,000
  current: 측정 중
  status: 진행 중
- name: 유지율
  threshold: 25~30%
  current: 측정 중
  status: 진행 중
- name: 고밀도 사용자
  threshold: 800~1,200명
  current: 측정 중
  status: 진행 중
- name: Loop Mapping v1
  threshold: 완료
  current: 진행 중
  status: 진행 중
risk_level: high
confidence: 0.5
tags:
- condition
- 3year
- critical
- pmf
priority_flag: critical
break_triggers:
- 2026년 말까지 Tier1/2 사용자가 Loop 언어로 문제를 설명하지 않음
- Loop 기반 선택이 관찰되지 않음
---

# Condition A: 국내 PMF

> 조건 ID: `cond:a` | 상태: In Progress | 위험도: High

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
