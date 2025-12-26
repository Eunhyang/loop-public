---
entity_type: Condition
entity_id: cond-c
entity_name: Condition_C_Global_Data
created: 2024-12-18
updated: 2024-12-20
status: todo
parent_id: mh-3
aliases:
- cond-c
- Condition_C_Global_Data
- cond-c
- Global Data
outgoing_relations:
- type: triggers_shutdown
  target_id: action:global_expansion_shutdown
  description: 깨지면 글로벌 확장 가설 폐기
validates: []
validated_by:
- mh-3
- trk-5
condition: 문화권별 Loop 해석이 구조적으로 수렴하는가?
unlock: International Tracker, 해외 파일럿
if_broken: 일본 중심 전환, 해외 제품 지연
metrics:
- name: US/JP 스키마 검증
  threshold: 완료
  current: 미시작
  status: 대기
- name: 글로벌 사용자
  threshold: 3,000~4,000명
  current: 0
  status: 대기
- name: Loop 해석 수렴율
  threshold: 70% 이상
  current: 측정 전
  status: 대기
risk_level: medium
confidence: 0.4
tags:
- condition
- 3year
- global
- schema
priority_flag: high
break_triggers:
- 문화권별 Loop 해석이 구조적으로 수렴하지 않음
- 3개 문화권 검증 후 공통 패턴 5개 미만
---

# Condition C: Global Data

> 조건 ID: `cond-c` | 상태: Planning | 위험도: Medium

## 조건 선언

**"문화권별 Loop 해석이 구조적으로 수렴하는가?"**

---

## 왜 이 Condition이 핵심인가

- LOOP가 OS가 되려면 **문화권을 넘는 공통 구조**가 있어야 한다.
- 한국 특화 솔루션이면 의료·글로벌 확장은 제한적이다.
- 이 단계는 매출이 아니라 **보편성 검증**이다.
- 특히 정서·섭식은 문화 차이가 크기 때문에 **조기 검증이 필수**다.
- 그래서 C는 확장이 아니라 **사전 반증 단계**다.

---

## Hard Falsification Trigger

> **문화권별 Loop 해석이 구조적으로 수렴하지 않으면 글로벌 확장 가설 폐기**

### 이 Trigger를 선택한 이유

- 유입 수는 마케팅으로 만들 수 있다.
- 하지만 문화권별 해석이 수렴하지 않으면 **Schema 자체가 틀린 것**이다.
- 이 경우 확장은 속도 문제가 아니라 **방향 문제**다.
- 늦게 알수록 비용이 기하급수적으로 커진다.
- 그래서 수렴 실패를 즉시 전략 폐기 신호로 둔다.

---

## 이게 깨지면 무너지는 가설들

- **"Global Loop Schema"** 가설
- International Tracker 확장 전략
- 글로벌 DTx/제약 파트너링 전제

---

## 고려했지만 채택하지 않은 대안

| 대안 | 배제 이유 |
|------|-----------|
| 국가별 별도 스키마 허용 | OS 전략과 정면 충돌 |
| 문화권별 완전 분리 모델 | 확장성 없음 |

→ **OS 전략과 정면 충돌**

---

## 충족 시 Unlock

- International Tracker
- 해외 파일럿

## Failure Branch

- 일본 중심 전환
- 해외 제품 지연
