---
entity_type: Hypothesis
entity_id: hyp-4-11
entity_name: "한끼꼭꼭 챌린지 - 첫 참여 발생"
created: 2026-01-13
updated: 2026-01-13
status: validating
evidence_status: assumed
confidence: 0.55
start_date: null
horizon: "2week"
deadline: 2026-01-20

# === 계층 관계 ===
parent_id: prj-012
aliases:
  - hyp-4-11
  - 한끼꼭꼭_챌린지_첫참여
  - kkok_challenge_activation

outgoing_relations:
  - type: supports
    target_id: trk-4
    description: "코칭/운영 트랙의 리드/리텐션 기반"
  - type: supports
    target_id: prj-012
    description: "챌린지 운영 프로젝트의 핵심 가설"

# === 가설 정의 (필수 4요소) ===
hypothesis_question: "챌린지 공지(기부/100원 적립 포함)만으로도 초기 참여(첫 인증)가 유의미하게 발생하는가?"
success_criteria: |
  D3(3일) 기준 아래 중 1개 이상 충족:
  - 첫 인증자 ≥ 10명
  - 또는 공지 리액션(🙋‍♀️ 등) ≥ 30개 AND 첫 인증자 ≥ 7명

  D7(7일) 기준:
  - 누적 인증 게시물 ≥ 50개 (운영자 제외 60% 이상)
failure_criteria: |
  D3까지:
  - 첫 인증자 < 5명 → 공지/동기/포맷/심리적 안전감 중 하나가 병목

  D7까지:
  - 누적 인증 게시물 < 20개 → "6주 챌린지"보다 "1주 미션" 수준으로 재설계 필요
measurement: |
  기간: D1~D3, D7
  - 첫 인증자 수 (unique)
  - 인증 게시물 수/일
  - 공지 반응(🙋‍♀️/리액션) 수
  - 운영자 제외 참여자 비율

# === 시간 범위 ===
start_date: null
horizon: "2week"
deadline: 2026-01-20

# === 상태 ===
evidence_status: assumed
confidence: 0.55

# === 분류 ===
loop_layer: ["Habit Loop"]
tags: ["challenge", "community", "activation", "kkokkkok", "2026", "trk-4"]

# === 검증 연결 ===
validates: [cond-b, cond-d]
validated_by: []

# === Condition 기여 ===
condition_contributes:
  - to: cond-b
    weight: 0.2
    description: 참여자가 늘수록 앱/기록 데이터 지속 수집 기반 강화
  - to: cond-d
    weight: 0.15
    description: 참여 기반이 만들어져야 이후 전환(코칭/재등록/결제) 가능

# === 협업 필드 ===
notes: "실패 시 원인 후보: (1) 인증 포맷이 부담 (2) 앱 스샷 장벽 (3) 기부/보상 메시지 불명확 (4) 운영자 리마인드 부족"
links:
  - label: "Project"
    url: "[[50_Projects/CS/Rounds/P012_CS_2026Q1/project.md|prj-012]]"
  - label: "Condition B"
    url: "[[20_Strategy/3Y_Conditions_2026-2028/Condition_B_Loop_Dataset.md|cond-b]]"
  - label: "Condition D"
    url: "[[20_Strategy/3Y_Conditions_2026-2028/Condition_D_Runway.md|cond-d]]"
attachments: []
---

# 한끼꼭꼭 챌린지 - 첫 참여 발생

> Hypothesis ID: `hyp-4-11` | Track: [[20_Strategy/12M_Tracks/2026/Track_4_Coaching.md|trk-4]] | 상태: validating

## 가설

**Q: 챌린지 공지(기부/100원 적립 포함)만으로도 초기 참여(첫 인증)가 유의미하게 발생하는가?**

**맥락**:
오픈카톡방에 **[한 끼 꼭꼭 챌린지]**를 공지하면,
참여자가 "부담 낮은 인증(스크린샷/식사사진 + 한 줄)"을 통해 **첫 인증을 시작**하고,
방이 '조용한 방 → 활동하는 방'으로 전환된다.

---

## 판정 기준

### 성공 (Success)

**D3(3일) 기준** 아래 중 1개 이상 충족:
- 첫 인증자 ≥ 10명
- 또는 공지 리액션(🙋‍♀️ 등) ≥ 30개 AND 첫 인증자 ≥ 7명

**D7(7일) 기준**:
- 누적 인증 게시물 ≥ 50개 (운영자 제외 60% 이상)

### 전환 (Pivot)

**D3까지**:
- 첫 인증자 < 5명
→ 공지/동기/포맷/심리적 안전감 중 하나가 병목이라고 판단

**D7까지**:
- 누적 인증 게시물 < 20개
→ "6주 챌린지"보다 "1주 미션" 수준으로 재설계 필요

---

## 측정 방법

**기간**: D1~D3, D7

**측정 지표**:
- 첫 인증자 수 (unique)
- 인증 게시물 수/일
- 공지 반응(🙋‍♀️/리액션) 수
- 운영자 제외 참여자 비율

---

## Condition 기여

| Condition | Weight | 설명 |
|-----------|--------|------|
| cond-b | 0.2 | 참여자가 늘수록 앱/기록 데이터 지속 수집 기반 강화 |
| cond-d | 0.15 | 참여 기반이 만들어져야 이후 전환(코칭/재등록/결제) 가능 |

---

## 검증 로그

| 날짜 | 상태 | 메모 |
|------|------|------|
| 2026-01-13 | assumed | 가설 정의 완료. 챌린지 공지 준비 중 |

---

## 관련 엔티티

### 검증 프로젝트
| Project | 역할 | Status |
|---------|------|--------|
| [[50_Projects/CS/Rounds/P012_CS_2026Q1/project.md|prj-012]] | 오픈카톡 챌린지 운영 | planning |

---

## 전환 시나리오

### 영향
- 챌린지 설계가 참여 장벽을 제거하지 못함
- 오픈카톡 커뮤니티 활성화 전략 재검토 필요

### 대응 (피벗/중단)
- **피벗 1**: 인증 포맷 단순화 (앱 스샷 → 식사사진만)
- **피벗 2**: 운영자 리마인드 강화 (매일 → 하루 2회)
- **피벗 3**: 보상 메시지 명확화 (기부/적립 설명 강화)

---

## 핵심 인사이트

**왜 첫 참여가 중요한가?**
- 첫 인증 = 심리적 진입장벽 돌파
- 방 분위기 전환의 시작점 (조용함 → 활발함)

**왜 D3/D7인가?**
- D3: 초기 momentum 확인
- D7: 1주 지속 가능성 검증

---

**Created**: 2026-01-13
**Horizon**: 2week
**Evidence Status**: assumed
