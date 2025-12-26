---
entity_type: Condition
entity_id: cond-e
entity_name: Condition_E_Team
created: 2024-12-18
updated: 2024-12-20
status: doing
parent_id: mh-4
aliases:
- cond-e
- Condition_E_Team
- cond-e
- Team Readiness
outgoing_relations:
- type: triggers_shutdown
  target_id: action:lite_focus
  description: 미충족 시 Lite 중심 전환
validates: []
validated_by:
- mh-4
condition: 핵심 역할(PM/Dev/Data)이 갖춰진 팀인가?
unlock: Global Schema, DTx 준비
if_broken: 외주 병행, Lite 중심
metrics:
- name: Core 팀원
  threshold: 5~7명
  current: 측정 중
  status: 진행 중
- name: 핵심 역할
  threshold: PM/Dev/Data 각 1명 이상
  current: 측정 중
  status: 진행 중
risk_level: medium
confidence: 0.6
tags:
- condition
- 3year
- team
- organization
priority_flag: high
break_triggers: []
---

# Condition E: Team Readiness

> 조건 ID: `cond-e` | 상태: In Progress | 위험도: Medium

## 조건 선언

**"핵심 역할(PM/Dev/Data)이 갖춰진 팀인가?"**

- Core 5~7명, PM/Dev/Data 역할 충족

---

## 왜 이 Condition이 핵심인가

- LOOP는 단순 앱이 아니라 **다학제 시스템**이다.
- 팀 구성이 안 되면 전략은 맞아도 **실행 왜곡**이 발생한다.
- 특히 데이터·임상·제품의 균형이 중요하다.
- 이 Condition은 속도가 아니라 **복잡도 관리 능력**을 본다.
- 그래서 E는 확장보다 **안정성 조건**이다.

---

## Hard Falsification Trigger

> **(조직은 구조 조정으로 대응, 별도 Trigger 불필요)**

### 이 Trigger를 선택한 이유

- 조직 문제는 "틀림"보다 "지연"의 형태로 나타난다.
- 명확한 Hard Trigger를 두면 불필요한 구조 해체가 발생한다.
- 대신 **대응 전략(외주, Lite)**로 흡수하는 게 합리적이다.
- 그래서 E도 별도 Hard Trigger를 두지 않았다.

---

## 이게 깨지면 무너지는 가설들

- PL3/PL4의 동시 추진 가능성
- 고도화된 Schema 유지 가능성

---

## 고려했지만 채택하지 않은 대안

| 대안 | 배제 이유 |
|------|-----------|
| 초기부터 풀스택 정규직 팀 구성 | 현 단계에서 리스크가 더 큼 |
| 글로벌 인력 선제 채용 | 시기상조 |

→ **현 단계에서는 리스크가 더 큼**

---

## 충족 시 Unlock

- Global Schema
- DTx 준비

## Failure Branch

- 외주 병행
- Lite 중심
