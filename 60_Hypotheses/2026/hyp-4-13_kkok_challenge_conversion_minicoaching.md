---
entity_type: Hypothesis
entity_id: hyp-4-13
entity_name: "한끼꼭꼭 챌린지 - 미니코칭 전환"
created: 2026-01-13
updated: 2026-01-13
status: validating
evidence_status: assumed
confidence: 0.45
start_date: null
horizon: "6week"
deadline: 2026-02-23

# === 계층 관계 ===
parent_id: prj-012
aliases:
  - hyp-4-13
  - 한끼꼭꼭_챌린지_코칭전환
  - kkok_challenge_conversion

outgoing_relations:
  - type: supports
    target_id: trk-4
    description: "코칭/운영 트랙의 리드/리텐션 기반"
  - type: supports
    target_id: prj-012
    description: "챌린지 운영 프로젝트의 핵심 가설"
  - type: depends_on
    target_id: hyp-4-12
    description: "유지(Stickiness)가 확보돼야 문의/전환이 의미 있게 발생"

# === 가설 정의 (필수 4요소) ===
hypothesis_question: "챌린지 참여 과정에서 드러나는 문제(앱 사용 어려움/다이어트 불안/탈다이어트 접근)가 30분 미니코칭 문의/신청으로 전환되는가?"
success_criteria: |
  Week2까지:
  - 문의 ≥ 5건
  - 예약 ≥ 2건

  Week6까지:
  - 누적 문의 ≥ 12건
  - 누적 예약 ≥ 5건

  (강한 신호) "챌린지 하다 보니…"로 시작하는 자발적 문제진술 ≥ 5건
failure_criteria: |
  Week2까지:
  - 문의 < 2건 → CTA 문구/타이밍/접근성(예약 동선) 문제로 판단

  Week6까지:
  - 누적 예약 < 2건 → 제품/코칭 가치 제안 재정의 필요 ("누구에게 어떤 30분인가")
measurement: |
  윈도우: Week1~2, Week6
  - 미니코칭 '문의' 수 (댓글/오픈톡/DM 포함)
  - 실제 '예약' 수
  - 문의 유형 Top3 (앱 사용 / 폭식-절식 / 탈다이어트 / 정서 등)
  - CTA 노출 방식별 전환 (공지 단독 vs 후기/하이라이트 후 CTA)

# === 시간 범위 ===
start_date: null
horizon: "6week"
deadline: 2026-02-23

# === 상태 ===
evidence_status: assumed
confidence: 0.45

# === 분류 ===
loop_layer: ["Emotional Loop"]
tags: ["challenge", "conversion", "coaching", "lead", "2026", "trk-4"]

# === 검증 연결 ===
validates: [cond-b, cond-d]
validated_by: []

# === Condition 기여 ===
condition_contributes:
  - to: cond-d
    weight: 0.35
    description: 코칭 리드/매출 및 재등록률 개선 (직접 기여)

# === 협업 필드 ===
notes: "문의가 없을 때는 '상품이 없어서'보다 '요청을 유발하는 질문/안전감'이 없어서일 확률이 큼. 운영자 메시지에 '괜찮다/부담 없다/비난 없다'를 고정 원칙으로 두기"
links:
  - label: "Project"
    url: "[[50_Projects/CS/Rounds/P012_CS_2026Q1/project.md|prj-012]]"
  - label: "Condition D"
    url: "[[20_Strategy/3Y_Conditions_2026-2028/Condition_D_Runway.md|cond-d]]"
attachments: []
---

# 한끼꼭꼭 챌린지 - 미니코칭 전환

> Hypothesis ID: `hyp-4-13` | Track: [[20_Strategy/12M_Tracks/2026/Track_4_Coaching.md|trk-4]] | 상태: validating

## 가설

**Q: 챌린지 참여 과정에서 드러나는 문제(앱 사용 어려움/다이어트 불안/탈다이어트 접근)가 30분 미니코칭 문의/신청으로 전환되는가?**

**맥락**:
챌린지로 "나 혼자"가 아니라 "같이"의 분위기가 형성되면,
참여자는 자신의 막힘을 더 쉽게 말하게 되고,
그 결과 미니코칭 문의/신청이 발생한다.

---

## 판정 기준

### 성공 (Success)

**Week2까지**:
- 문의 ≥ 5건
- 예약 ≥ 2건

**Week6까지**:
- 누적 문의 ≥ 12건
- 누적 예약 ≥ 5건

**(강한 신호)**: "챌린지 하다 보니…"로 시작하는 자발적 문제진술 ≥ 5건

### 전환 (Pivot)

**Week2까지**:
- 문의 < 2건
→ CTA 문구/타이밍/접근성(예약 동선) 문제로 판단

**Week6까지**:
- 누적 예약 < 2건
→ 제품/코칭 가치 제안 재정의 필요 ("누구에게 어떤 30분인가")

---

## 측정 방법

**윈도우**: Week1~2, Week6

**측정 지표**:
- 미니코칭 '문의' 수 (댓글/오픈톡/DM 포함)
- 실제 '예약' 수
- 문의 유형 Top3 (앱 사용 / 폭식-절식 / 탈다이어트 / 정서 등)
- CTA 노출 방식별 전환 (공지 단독 vs 후기/하이라이트 후 CTA)

---

## Condition 기여

| Condition | Weight | 설명 |
|-----------|--------|------|
| cond-d | 0.35 | 코칭 리드/매출 및 재등록률 개선 (직접 기여) |

---

## 검증 로그

| 날짜 | 상태 | 메모 |
|------|------|------|
| 2026-01-13 | assumed | 가설 정의 완료. CTA 설계 및 운영 준비 중 |

---

## 관련 엔티티

### 검증 프로젝트
| Project | 역할 | Status |
|---------|------|--------|
| [[50_Projects/CS/Rounds/P012_CS_2026Q1/project.md|prj-012]] | 오픈카톡 챌린지 운영 | planning |

---

## 전환 시나리오

### 영향
- 챌린지 → 코칭 전환 경로 부재
- 코칭 가치 제안 재정의 필요

### 대응 (피벗/중단)
- **피벗 1**: CTA 타이밍 조정 (Week1 → Week2~3)
- **피벗 2**: 코칭 가치 제안 재설계 ("30분 미니코칭은 누구에게 어떤 가치인가?")
- **피벗 3**: 안전감 강화 ("괜찮다/부담 없다/비난 없다" 메시지 반복)

---

## 핵심 인사이트

**왜 "도움 요청"이 중요한가?**
- 챌린지는 문제를 수면 위로 올리는 안전한 공간
- 문의/신청 = 코칭 니즈의 실제 신호

**왜 Week2/6인가?**
- Week2: 초기 막힘이 드러나는 시점
- Week6: 장기 참여자의 깊은 니즈 확인

**문의가 없을 때**:
- '상품이 없어서'보다 '요청을 유발하는 질문/안전감'이 없어서일 확률이 큼
- 운영자 메시지에 "괜찮다/부담 없다/비난 없다"를 고정 원칙으로 두기

---

**Created**: 2026-01-13
**Horizon**: 6week
**Evidence Status**: assumed
