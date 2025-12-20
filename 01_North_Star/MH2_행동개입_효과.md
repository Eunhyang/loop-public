---
entity_type: MetaHypothesis
entity_id: mh:2
entity_name: MH2_행동개입_효과
created: 2024-12-18
updated: 2024-12-20
status: validating
parent_id: ns:001
aliases:
- mh:2
- MH2_행동개입_효과
- mh-2
outgoing_relations: []
validates: []
validated_by:
- trk:4
- cond:a
hypothesis_text: 이 루프는 행동·정서 개입으로 의미 있게 변한다
if_broken: OS 개입 범위 축소
evidence_status: validating
confidence: 0.65
evidence:
  positive:
  - 코칭 개입 후 폭식 빈도 감소 사례
  - 천천히 먹기/멈춤 개입의 효과 관찰
  - 정서 인식 훈련 후 충동 억제 성공률 증가
  negative:
  - 일부 사용자에서 반복 개입에도 패턴 변화 없음
  - 장기 유지율 데이터 부족
risk_signals:
  critical:
  - 반복 개입에도 패턴 변화 없음
  - 6개월간 개입해도 루프 변화 없음
  - 코칭 효과가 코치 개인 역량에만 의존
  warning:
  - 개입 후 일시적 효과만 있고 원복
  - 사용자가 개입을 "귀찮음"으로 인식
tags:
- meta-hypothesis
- core
- intervention
- coaching
priority_flag: critical
enables:
- Condition_A
depends_on:
- Track_4_Coaching
supports:
- 10년_비전
---

# MH2: 행동개입 효과

> 가설 ID: `mh:2` | 상태: Validating | 신뢰도: 65%

## 가설 선언

**"이 루프는 행동·정서 개입으로 의미 있게 변한다"**

---

## 이 가설의 의미

### 핵심 주장

- 단순히 "참아라"가 아니라
- 구조화된 개입(천천히 먹기, 멈춤, 대체 행동, 인지적 재구성)으로
- 루프가 실제로 바뀜 (폭식 빈도 감소, 충동 억제 성공률 증가 등)

### 전제 조건

- 개입 프로토콜이 재현 가능해야 함
- 코치 개인 역량이 아닌 시스템으로 효과가 나야 함
- 효과가 일시적이 아니라 지속적이어야 함

---

## 이게 틀렸다는 신호

| 신호 유형 | 내용 |
|----------|------|
| **Critical** | 반복 개입에도 패턴 변화 없음 |
| **Critical** | 6개월간 개입해도 루프 변화 없음 |
| **Critical** | 코칭 효과가 코치 개인 역량에만 의존 |
| Warning | 개입 후 일시적 효과만 있고 원복 |
| Warning | 사용자가 개입을 "귀찮음"으로 인식 |

---

## 그때의 결정 (If Broken)

**"OS 개입 범위 축소"**

구체적으로:
- 적극적 개입 → 수동적 기록/모니터링으로 전환
- 코칭 기반 비즈니스 모델 재검토
- 또는 회사 존재 이유 재검토 (개입이 안 먹히면 OS가 아니라 단순 기록 앱)

---

## 검증 방법

1. **폭식 빈도 측정**: 개입 전후 폭식 횟수 비교
2. **충동 억제 성공률**: 갈망 발생 시 대체 행동 선택 비율
3. **코치 간 효과 일관성**: 서로 다른 코치의 사용자에서도 유사한 효과
4. **장기 유지율**: 3개월, 6개월 후에도 효과 유지 여부

---

## Loop Intervention Protocol

MH2 검증을 위한 핵심 개입 프로토콜:

| 루프 타입 | 개입 방법 |
|----------|----------|
| 폭식 루프 | 멈춤 + 호흡 + 대체 행동 |
| 정서 루프 | 정서 명명 + 신체 감각 연결 |
| 보상 루프 | 대체 보상 탐색 + 지연 만족 훈련 |
| 습관 루프 | 트리거 인식 + 루틴 재설계 |

---

## 관계도

```
MH2 (행동개입 효과)
  ↓ enables
Condition A (국내 PMF)
  ↓ validates
Track 4 (Coaching)
```

---

## 관련 문서

- [[10년 비전]] - 상위 North Star
- [[Condition_A_PMF]] - MH2가 충족되어야 PMF 가능
- [[Track_4_Coaching]] - 코칭 기반 개입 검증

---

**최초 작성**: 2024-12-18
**마지막 검토**: 2024-12-20
