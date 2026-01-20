---
entity_type: Hypothesis
entity_id: hyp-4-12
entity_name: "한끼꼭꼭 챌린지 - 유지 재참여"
created: 2026-01-13
updated: 2026-01-13
status: validating
evidence_status: assumed
confidence: 0.5
start_date: null
horizon: "6week"
deadline: 2026-02-23

# === 계층 관계 ===
parent_id: prj-012
aliases:
  - hyp-4-12
  - 한끼꼭꼭_챌린지_유지
  - kkok_challenge_stickiness

outgoing_relations:
  - type: supports
    target_id: trk-4
    description: "코칭/운영 트랙의 리드/리텐션 기반"
  - type: supports
    target_id: prj-012
    description: "챌린지 운영 프로젝트의 핵심 가설"
  - type: depends_on
    target_id: hyp-4-11
    description: "첫 참여(Activation)가 성립해야 유지(Stickiness) 평가 가능"

# === 가설 정의 (필수 4요소) ===
hypothesis_question: "못하는 날 허용 + 작은 보상 구조가 참여자의 재참여(돌아오기)를 만들어 6주 챌린지 유지율을 끌어올리는가?"
success_criteria: |
  Week1:
  - 첫 인증자 중 2회 이상 인증 ≥ 40%

  Week2:
  - 첫 인증자 중 2주차 1회 이상 인증 ≥ 25%

  Week6:
  - 첫 인증자 중 6주차 1회 이상 인증 ≥ 10%

  (보조 신호) 인증 게시물의 소감 포함률 ≥ 30%
failure_criteria: |
  Week1:
  - 2회 이상 인증 비율 < 25% → "인증 장벽" 또는 "리마인드 설계" 문제

  Week2:
  - 2주차 활성 비율 < 15% → "6주 설계 과부하" (주 2회 챌린지로 다운시프트 필요)

  Week6:
  - 6주차 활성 비율 < 5% → 보상/의미/커뮤니티 구조 재설계 필요
measurement: |
  윈도우: Week1 / Week2 / Week6
  - Week1: 첫 인증자 중 "2회 이상 인증" 비율
  - Week2: 첫 인증자 중 "2주차에 1회 이상 인증" 비율
  - Week6: 첫 인증자 중 "6주차에 1회 이상 인증" 비율
  - 인증당 '한 줄 소감' 포함률 (정성 몰입 신호)
  - 운영자 리마인드 횟수 대비 참여 반응 (댓글/리액션)

# === 시간 범위 ===
start_date: null
horizon: "6week"
deadline: 2026-02-23

# === 상태 ===
evidence_status: assumed
confidence: 0.5

# === 분류 ===
loop_layer: ["Habit Loop"]
tags: ["challenge", "retention", "stickiness", "kkokkkok", "2026", "trk-4"]

# === 검증 연결 ===
validates: [cond-b, cond-d]
validated_by: []

# === Condition 기여 ===
condition_contributes:
  - to: cond-b
    weight: 0.25
    description: 참여자 유지 → 기록/스크린샷/소감 데이터 누적
  - to: cond-d
    weight: 0.2
    description: 유지자 중 일부가 유료/코칭 등 다음 전환으로 이동

# === 협업 필드 ===
notes: "'앱 스샷' 요구가 유지율을 떨어뜨릴 수 있음 → 식사사진/한줄만으로도 인정하는 기간(초반 1~2주) 고려"
links:
  - label: "Project"
    url: "[[50_Projects/CS/Rounds/P012_CS_2026Q1/project.md|prj-012]]"
  - label: "Condition B"
    url: "[[20_Strategy/3Y_Conditions_2026-2028/Condition_B_Loop_Dataset.md|cond-b]]"
  - label: "Condition D"
    url: "[[20_Strategy/3Y_Conditions_2026-2028/Condition_D_Runway.md|cond-d]]"
attachments: []
---

# 한끼꼭꼭 챌린지 - 유지 재참여

> Hypothesis ID: `hyp-4-12` | Track: [[20_Strategy/12M_Tracks/2026/Track_4_Coaching.md|trk-4]] | 상태: validating

## 가설

**Q: "못하는 날 허용" + "인증 1회당 100원 적립/기부" 구조가 참여자의 재참여(돌아오기)를 만들어 6주 챌린지 유지율을 끌어올리는가?**

**맥락**:
챌린지에서 '매일'이 아니라 '돌아오기'를 규범으로 만들면,
참여자는 죄책감 없이 재진입하고,
결과적으로 1~2주차 유지율이 확보된다.

---

## 판정 기준

### 성공 (Success)

**Week1**:
- 첫 인증자 중 2회 이상 인증 ≥ 40%

**Week2**:
- 첫 인증자 중 2주차 1회 이상 인증 ≥ 25%

**Week6**:
- 첫 인증자 중 6주차 1회 이상 인증 ≥ 10%

**(보조 신호)**: 인증 게시물의 소감 포함률 ≥ 30%

### 실패 (Failure)

**Week1**:
- 2회 이상 인증 비율 < 25%
→ "인증 장벽" 또는 "리마인드 설계" 문제

**Week2**:
- 2주차 활성 비율 < 15%
→ "6주 설계 과부하" (주 2회 챌린지로 다운시프트 필요)

**Week6**:
- 6주차 활성 비율 < 5%
→ 보상/의미/커뮤니티 구조 재설계 필요

---

## 측정 방법

**윈도우**: Week1 / Week2 / Week6

**측정 지표**:
- Week1: 첫 인증자 중 "2회 이상 인증" 비율
- Week2: 첫 인증자 중 "2주차에 1회 이상 인증" 비율
- Week6: 첫 인증자 중 "6주차에 1회 이상 인증" 비율
- 인증당 '한 줄 소감' 포함률 (정성 몰입 신호)
- 운영자 리마인드 횟수 대비 참여 반응 (댓글/리액션)

---

## Condition 기여

| Condition | Weight | 설명 |
|-----------|--------|------|
| cond-b | 0.25 | 참여자 유지 → 기록/스크린샷/소감 데이터 누적 |
| cond-d | 0.2 | 유지자 중 일부가 유료/코칭 등 다음 전환으로 이동 |

---

## 검증 로그

| 날짜 | 상태 | 메모 |
|------|------|------|
| 2026-01-13 | assumed | 가설 정의 완료. Stickiness 구조 설계 중 |

---

## 관련 엔티티

### 검증 프로젝트
| Project | 역할 | Status |
|---------|------|--------|
| [[50_Projects/CS/Rounds/P012_CS_2026Q1/project.md|prj-012]] | 오픈카톡 챌린지 운영 | planning |

---

## 만약 실패한다면?

### 영향
- 6주 챌린지 설계가 과부하
- 참여자 유지 메커니즘 재설계 필요

### 대응 (피벗/중단)
- **피벗 1**: 6주 → 2주 미니챌린지로 축소
- **피벗 2**: 리마인드 강도/빈도 조정
- **피벗 3**: 앱 스샷 요구 제거 (초반 1~2주)

---

## 핵심 인사이트

**왜 "못하는 날 허용"인가?**
- 죄책감 없는 재진입이 장기 유지의 핵심
- "매일"보다 "돌아오기"가 실제 습관 형성에 효과적

**왜 Week1/2/6인가?**
- Week1: 초기 momentum 확인
- Week2: 재참여(돌아오기) 패턴 검증
- Week6: 장기 유지 가능성 측정

---

**Created**: 2026-01-13
**Horizon**: 6week
**Evidence Status**: assumed
