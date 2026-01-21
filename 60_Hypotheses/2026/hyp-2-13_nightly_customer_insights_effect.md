---
entity_type: Hypothesis
entity_id: hyp-2-13
entity_name: Nightly Customer Insights 운영 효과
created: 2026-01-21
updated: 2026-01-21
status: todo
parent_id: trk-2
horizon: "2026"
start_date: 2026-01-21
deadline: 2026-03-15
evidence_status: validating
confidence: 0.6
tags:
  - 2026
  - trk-2
  - data
  - customer
  - operating-system
hypothesis_question: "매일 23:00 고객 문제 리뷰를 운영하면, 고객 문제 기반 실행(실험/개발/카피 수정) 리드타임이 단축되는가?"
success_criteria: |
  - 4주 내 Insight → Action 리드타임 p50 30% 단축
  - 주간 Problem 카드 5개 이상 (원문 근거 포함)
  - 주간 Action 5개 이상 생성
failure_criteria: |
  - 4주 후에도 Problem 카드 주 2개 미만
  - Insight → Action 연결율 30% 미만
measurement: |
  - Vault 카드 수/링크/태스크 생성 로그
  - 리드타임 측정: 작성일 → 첫 액션일
  - 주간 스코어보드에서 자동 집계
---

# Nightly Customer Insights 운영 효과

## 핵심 질문

> 매일 23:00 고객 문제 리뷰를 운영하면, 고객 문제 기반 실행 리드타임이 단축되는가?

## 정의

| 용어 | 정의 |
|------|------|
| **Problem 카드** | 고객 원문(스크린샷/로그/DM/콜 기록) 1개 이상 포함 |
| **Insight 카드** | 문제를 '패턴'으로 일반화한 문장 1개 |
| **Action** | 다음날 실행할 태스크/실험/카피 수정 중 1개 |
| **리드타임** | Problem 작성일 → 첫 Action 완료일 |

## 검증 계획

### Phase 1: 시스템 구축 (1주)
- 22:30 입력 마감 규칙
- 23:00 회의 타임박스
- 템플릿 3종 (Problem/Insight/Action)

### Phase 2: 6주 운영 라운드
- 매일 23:00 회의 실행
- 주간 스코어보드 리뷰
- 2주차/4주차 중간 점검

### Phase 3: 판정 (6주차)
- 성공/실패 기준 대조
- 시스템 개선점 도출
- 다음 라운드 계획

## 관련 엔티티

- 운영 프로그램: [[pgm-customer-insights-nightly]]
- 시스템 구축: [[prj-024]]
- 6주 운영 라운드: [[prj-025]]
