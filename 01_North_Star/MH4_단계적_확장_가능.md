---
entity_type: MetaHypothesis
entity_id: mh-4
entity_name: MH4_단계적_확장_가능
created: 2024-12-18
updated: 2024-12-20
status: validating
parent_id: ns-001
aliases:
- mh-4
- MH4_단계적_확장_가능
- mh-4
outgoing_relations: []
validates: []
validated_by:
- trk-5
- trk-6
- cond-d
- cond-e
hypothesis_text: 비규제 → 의료 → 글로벌로 단계적 확장 경로가 가능하다
if_broken: 의료 우선 전략으로 전환
evidence_status: validating
confidence: 0.5
evidence:
  positive:
  - 국내 웰니스/코칭 시장 진입 가능
  - 비규제 단계에서 데이터 축적 가능
  - 의료 파트너십 탐색 진행 중
  negative:
  - 초반부터 의료 요구 과다 가능성
  - 글로벌 규제 환경 불확실
risk_signals:
  critical:
  - 초반부터 의료 요구 과다
  - 비규제 시작 불가, 처음부터 FDA 필요
  - 웰니스 시장에서 PMF 불가
  warning:
  - 의료기관 파트너십 난항
  - 규제 환경 급변
tags:
- meta-hypothesis
- core
- expansion
- regulatory
priority_flag: critical
enables:
- Condition_D
- Condition_E
depends_on:
- Track_5_Partnership
- Track_6_Revenue
supports:
- 10년_비전
---

# MH4: 단계적 확장 가능

> 가설 ID: `mh-4` | 상태: Validating | 신뢰도: 50%

## 가설 선언

**"비규제 → 의료 → 글로벌로 단계적 확장 경로가 가능하다"**

---

## 이 가설의 의미

### 핵심 주장

- 처음부터 글로벌 규제 대응 필요 없음
- 국내 웰니스/코칭으로 시작 → PMF 확보
- 데이터 쌓이면 의료 진입 (IRB, 임상)
- 의료 검증되면 글로벌 확장

### 단계별 경로

```
Stage 1: 비규제 (Wellness/Coaching)
    ↓ PMF + 데이터 축적
Stage 2: 국내 의료 (IRB, 클리닉 제휴)
    ↓ 임상 검증 + 프로토콜 확립
Stage 3: 글로벌 확장 (FDA, 해외 파트너십)
```

### 전제 조건

- 비규제 단계에서 충분한 데이터 축적 가능
- 의료 진입 시점까지 런웨이 확보
- 글로벌 스키마가 미리 설계되어 있어야 함

---

## 이게 틀렸다는 신호

| 신호 유형 | 내용 |
|----------|------|
| **Critical** | 초반부터 의료 요구 과다 |
| **Critical** | 비규제 시작 불가, 처음부터 FDA 필요 |
| **Critical** | 웰니스 시장에서 PMF 불가 |
| Warning | 의료기관 파트너십 난항 |
| Warning | 규제 환경 급변 |

---

## 그때의 결정 (If Broken)

**"의료 우선 전략으로 전환"**

구체적으로:
- 비규제 단계 스킵, 처음부터 의료 중심
- 스타트업 단독 진행 어려움 → 의료기관/제약사 파트너십 필수
- 또는 회사 존재 이유 재검토 (처음부터 글로벌 규제 대응 필요하면 스타트업으로 불가능)

---

## 검증 방법

1. **비규제 PMF 달성**: 웰니스/코칭으로 DAU 3,000+ 달성 가능 여부
2. **데이터 축적 속도**: 의료 진입 전 충분한 데이터 확보 가능 여부
3. **의료 파트너십 탐색**: 클리닉/병원과의 협업 가능성
4. **규제 환경 모니터링**: DTx 규제, FDA 요구사항 변화

---

## 확장 경로 상세

### Stage 1: 비규제 (2025-2026)

- 코칭 프로그램 운영
- 앱 기반 루프 트래킹
- 고밀도 데이터 수집
- PMF 확보

### Stage 2: 국내 의료 (2027-2028)

- 비만클리닉/정신건강센터 제휴
- IRB 승인, 임상 설계
- Early Warning Index 검증
- DTx 프로토콜 개발

### Stage 3: 글로벌 (2029-2035)

- 해외 경량 트래커 출시
- Cross-cultural 스키마 검증
- FDA 또는 CE 마크
- 글로벌 파트너십

---

## 관계도

```
MH4 (단계적 확장 가능)
  ↓ enables
Condition D (Runway) + Condition E (Team)
  ↓ validates
Track 5 (Partnership) + Track 6 (Revenue)
```

---

## 관련 문서

- [[10년 비전]] - 상위 North Star
- [[Condition_D_Runway]] - 런웨이 확보
- [[Condition_E_Team]] - 팀 준비
- [[Track_5_Partnership]] - 파트너십 검증
- [[Track_6_Revenue]] - 수익 모델 검증

---

**최초 작성**: 2024-12-18
**마지막 검토**: 2024-12-20
