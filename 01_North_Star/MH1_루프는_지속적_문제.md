---
entity_type: MetaHypothesis
entity_id: mh:1
entity_name: MH1_루프는_지속적_문제
created: 2024-12-18
updated: 2024-12-20
status: validating
parent_id: ns:001
aliases:
- mh:1
- MH1_루프는_지속적_문제
- mh-1
outgoing_relations: []
validates: []
validated_by:
- trk:1
- trk:3
- cond:a
hypothesis_text: 인간은 체중이 아니라 정서–섭식–습관 루프를 지속적 문제로 인식한다
if_broken: B2C 전면 축소, 전문군 중심 피봇
evidence_status: validating
confidence: 0.6
evidence:
  positive:
  - 사용자들이 체중보다 "왜 먹게 되는지"에 관심
  - 폭식/야식 습관에 대한 자기 인식 존재
  - 스트레스-섭식 연결에 대한 공감
  negative:
  - 공감은 되지만 굳이 필요 없다는 반응 일부 존재
  - GLP-1 사용자 중 루프 문제 인식 낮은 경우 있음
risk_signals:
  critical:
  - 공감은 되지만 굳이 필요 없다는 반응 증가
  - GLP-1 사용자들이 루프 문제에 무관심
  - 체중 감량 후 서비스 이탈 급증
  warning:
  - 무료 사용자 전환율 낮음
  - 루프 언어 사용 빈도 감소
tags:
- meta-hypothesis
- core
- problem-recognition
priority_flag: critical
enables:
- Condition_A
depends_on:
- Track_1_Product
- Track_3_Content
supports:
- 10년_비전
---

# MH1: 루프는 지속적 문제

> 가설 ID: `mh:1` | 상태: Validating | 신뢰도: 60%

## 가설 선언

**"인간은 체중이 아니라 정서–섭식–습관 루프를 지속적 문제로 인식한다"**

---

## 이 가설의 의미

### 핵심 주장

- 체중 조절이 완벽해져도 (GLP-1로 해결)
- 사람들은 여전히 "왜 스트레스 받으면 먹게 되지?", "야식 습관을 못 끊겠어" 같은 루프 문제를 가짐
- 이것이 10~20년 이상 지속되는 인간 보편 문제

### 전제 조건

- 사람들이 "체중"이 아니라 "행동 패턴"을 문제로 인식해야 함
- 루프 언어(정서-섭식-습관)가 사용자에게 resonance가 있어야 함
- GLP-1 이후에도 이 문제 인식이 유지되어야 함

---

## 이게 틀렸다는 신호

| 신호 유형 | 내용 |
|----------|------|
| **Critical** | "공감은 되지만 굳이 필요 없다" 반응 증가 |
| **Critical** | GLP-1 사용자들이 루프 문제에 무관심 |
| **Critical** | 체중 감량 후 서비스 이탈 급증 |
| Warning | 무료 사용자 전환율 낮음 |
| Warning | 루프 언어 사용 빈도 감소 |

---

## 그때의 결정 (If Broken)

**"B2C 전면 축소, 전문군 중심 피봇"**

구체적으로:
- 일반 대중 대상 B2C 서비스 축소
- 섭식장애 전문군 / 의료기관 중심으로 전환
- 또는 회사 존재 이유 재검토

---

## 검증 방법

1. **사용자 인터뷰**: "왜 이 서비스를 쓰시나요?" 응답 분석
2. **리텐션 분석**: 체중 목표 달성 후에도 사용 지속 여부
3. **루프 언어 채택률**: 사용자가 스스로 "루프" 용어를 사용하는지
4. **GLP-1 사용자 반응**: 약물 사용 중에도 루프 서비스 필요 인식 여부

---

## 관계도

```
MH1 (루프는 지속 문제)
  ↓ enables
Condition A (국내 PMF)
  ↓ validates
Track 1 (Product) + Track 3 (Content)
```

---

## 관련 문서

- [[10년 비전]] - 상위 North Star
- [[Condition_A_PMF]] - MH1이 충족되어야 PMF 가능
- [[Track_1_Product]] - 루프 경험 UX 검증
- [[Track_3_Content]] - 루프 서사/콘텐츠 검증

---

**최초 작성**: 2024-12-18
**마지막 검토**: 2024-12-20
