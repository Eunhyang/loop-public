---
entity_type: Project
entity_id: prj-024
entity_name: Nightly Customer Problem Review 시스템 구축
created: 2026-01-21
updated: 2026-01-21
status: planning
start_date: 2026-01-21
parent_id: trk-2
program_id: pgm-customer-insights-nightly
owner: 김은향
conditions_3y:
  - cond-a
  - cond-b
priority_flag: high
expected_impact:
  statement: "고객 원문 → 인사이트 → 액션이 매일 자동으로 생성되는 운영 라인이 구축된다"
  metric: "Problem 5+/주 & Insight → Action 60%+"
  target: "4주 내 안정화"
validates:
  - hyp-2-13
tags:
  - 2026
  - trk-2
  - system
  - customer
  - infrastructure
---

# Nightly Customer Problem Review 시스템 구축

## 목표

22:30 입력 마감 → 23:00 회의 → Problem/Insight/Action 매일 생성되는 **운영 라인 구축**

## 범위

1. 회의 규칙 확정 + 예외 규칙 정의
2. 22:30 입력 마감 + 최소 원문 1개 강제
3. 23:00 25분 타임박스 아젠다
4. Problem/Insight/Action 템플릿 고정
5. 주간 스코어보드
6. 액션 라우팅 룰

## 산출물

- [ ] 회의 규칙 문서 (10줄)
- [ ] 23:00 캘린더 + 알람
- [ ] 입력 인박스 정의 (22:30 마감)
- [ ] 템플릿 3종 (Problem/Insight/Action)
- [ ] 25분 타임박스 아젠다
- [ ] 주간 스코어보드 페이지
- [ ] 액션 라우팅 룰 문서

## 관련 엔티티

- 운영 프로그램: [[pgm-customer-insights-nightly]]
- 검증 가설: [[hyp-2-13]]
- 6주 운영 라운드: [[prj-025]]
