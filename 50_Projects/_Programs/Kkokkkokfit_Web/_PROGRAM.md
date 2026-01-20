---
entity_type: Program
entity_id: pgm-kkokkkokfit-web
entity_name: kkokkkokfit Web
created: "2026-01-16"
updated: "2026-01-16"
status: doing
program_type: launch
owner: 김은향
principles:
  - "단일 퍼널 SSOT: 랜딩/폼/결제/CRM 이벤트 정의를 한 번만 정한다"
  - "측정 없는 개선 금지: 변경은 항상 전후 비교 가능해야 한다"
  - "릴리즈는 작게/자주: 주 단위 실험(카피/섹션/CTA/가격표현)"
  - "결제/계정/도메인 장애는 Incident로 기록하고 재발방지까지 닫는다"
process_steps:
  - "Instrument: 이벤트/픽셀/전환 정의(SSOT) + 대시보드 연결"
  - "Iterate: 랜딩/폼/결제/온보딩 실험 설계 → 반영"
  - "Measure: 전환/이탈/성공률 모니터링"
  - "Learn: 학습 카드화(무엇이/왜/다음 실험) + 템플릿 업데이트"
templates: []
kpis:
  - name: "Landing CVR"
    description: "랜딩 방문 → 신청/리드 전환율"
  - name: "Lead-to-Purchase"
    description: "리드 → 결제/계약 전환율"
  - name: "Payment Success Rate"
    description: "결제 시도 대비 성공률(실패 원인 분류 포함)"
  - name: "Page Performance"
    description: "핵심 페이지 로딩/가용성(장애/다운타임 포함)"
exec_rounds_path: null
parent_id: trk-6
aliases:
  - pgm-kkokkkokfit-web
  - kkokkkokfit-web
  - kkokkkokfit Web
outgoing_relations:
  - type: depends_on
    target_id: pgm-coachos
    description: "코칭 운영/제품 가치는 CoachOS가 뒷받침"
  - type: enables
    target_id: trk-6
    description: "전환 개선으로 Revenue/Runway에 직접 기여"
validates: []
validated_by: []
tags:
  - program
  - kkokkkokfit
  - web
  - funnel
  - growth
priority_flag: high
---

# kkokkkokfit Web

> Program ID: `pgm-kkokkkokfit-web` | Type: launch | Status: doing

## 프로그램 개요
kkokkkokfit의 웹 기반 퍼널(랜딩–신청–결제–온보딩)을 **측정/실험/학습 루프**로 운영하는 상시 프로그램.

## 운영 원칙
- 퍼널 정의/이벤트/전환 기준은 SSOT로 고정
- 변경은 항상 실험으로 기록(전후 비교 + 학습 카드)
- 장애(결제/계정/도메인)는 “복구 + 재발방지”까지 완료해야 Done

## Rounds (프로젝트)
- (예정) 랜딩 리뉴얼 v1
- (예정) 결제 실패/재시도/알림 체계 v1
- (예정) 콘텐츠→랜딩→상담 연결 v1

---
**Created**: 2026-01-16  
**Owner**: 김은향
