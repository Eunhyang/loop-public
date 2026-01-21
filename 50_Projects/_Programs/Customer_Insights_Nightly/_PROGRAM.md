---
entity_type: Program
entity_id: pgm-customer-insights-nightly
entity_name: Nightly Customer Insights (23:00)
created: 2026-01-21
updated: 2026-01-21
status: doing
program_type: infrastructure
owner: 김은향, 한명학
principles:
  - No Skip (예외: 출근/사망급)
  - One Raw Evidence daily (매일 원문 1개 이상)
  - One Decision + One Action daily (매일 액션 1개)
  - 기록 없으면 실행 없음
kpis:
  - name: Customer Touch Rate
    description: "주 5회 이상 고객 원문 입력"
  - name: Insight Throughput
    description: "주 10개 인사이트 카드 생성"
  - name: Action Conversion
    description: "인사이트 → 태스크/실험 연결율 60%+"
  - name: Decision Latency
    description: "문제 기록 → 결정까지 p50 72시간 이내"
process_steps:
  - "22:30 입력 마감 (원문 근거 최소 1개)"
  - "23:00 25분 타임박스 회의"
  - "Problem → Insight → Action 1개 커밋"
  - "주간 Top3/패턴/진행률 리포트"
tags:
  - program
  - customer
  - insights
  - ritual
  - operating-system
exec_rounds_path: "50_Projects/2026/P025_Nightly_Customer_Review_6w"
---

# Nightly Customer Insights (23:00)

## 목적

팀이 바빠도 고객 문제를 뒤로 미루지 않도록 **매일 강제 학습 루프**를 만든다.

> "매일 고객 문제를 SSOT로 축적하고, 다음날 실행으로 연결하는 학습 루프를 강제한다"

## 핵심 설계 원리

- 매일 23:00은 '회의'가 아니라 **운영 라인** (빠지면 시스템이 깨진다)
- "고객 문제"가 안 들어오면 회의는 망한다 → **22:30 입력 마감 강제**

## 산출물 (매일 고정 3개)

| 산출물 | 설명 | 필수 |
|--------|------|------|
| **Problem** | 고객 원문 증거 포함 (스크린샷/로그/DM/콜 기록) | O |
| **Insight** | 패턴/해석 (문제를 일반화한 문장 1개) | O |
| **Next Action** | 내일 할 1개 액션 (담당/마감 포함) | O |

## 회의 타임박스 (25분)

| 시간 | 내용 |
|------|------|
| 00-05 | 오늘 들어온 원문 1~3개 읽기 |
| 05-15 | "진짜 문제" 한 문장으로 압축 (누구/언제/무엇/왜) |
| 15-22 | 인사이트(패턴/가설) 1개 도출 |
| 22-25 | 내일 액션 1개 커밋 (담당/마감 포함) |

## 입력 파이프라인

원문이 들어오는 곳 (22:30까지):
- 앱 피드백
- CS 채널
- 카톡/DM
- 콜 기록
- 데이터 로그

## 액션 라우팅 룰

액션은 다음 중 하나로 라우팅:
1. **제품 태스크** → Task (type: dev/bug)
2. **실험** → Experiment
3. **카피/콘텐츠** → Task (type: ops)
4. **고객 인터뷰** → Task (type: research)

## 관련 엔티티

- 검증 가설: [[hyp-2-13]]
- 시스템 구축 프로젝트: [[prj-024]]
- 6주 운영 라운드: [[prj-025]]
