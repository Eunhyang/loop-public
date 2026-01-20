---
entity_type: Offering
entity_id: off-app-subscription-v1
entity_name: 앱 구독 v1 (전면 유료화)
created: 2026-01-20
updated: 2026-01-20
status: doing
parent_id: trk-1
owner: Product Team

# 최소 필수
offering_type: subscription
currency: KRW
price: 9900
billing_period: monthly

# 결제 시 열리는 권한(최소)
entitlements:
  - dashboard_insights
  - personalization_recommendations
  - recovery_replay_full
  - trend_and_prediction

# Free boundary (전면 유료화의 불변 정의)
free_boundary:
  description: "Emergency Brake는 항상 접근 가능"
  includes:
    - "Quick Brake (15~30초): 타이머 시작 + 심호흡 + 포만감 1회 체크"
    - "회복 시작 (첫 1분): 식후 감정일기 진입 + 첫 문항"

# 권장(없어도 되지만 있으면 GTM이 단단해짐)
eligibility: all
paywall_surfaces:
  - "report_view"
  - "after_brake"
primary_kpi:
  - "subscription_conversion"
  - "mrr"
guardrails:
  - "refund_rate"
  - "d7_retention"
evidence_refs:
  - "RevenueCat: 구독 전환/해지 대시보드 링크"
  - "Paywall 정책 결정 메모 링크"
---
# Offering: 앱 구독 v1 (전면 유료화)

## 한 줄 정의
앱의 “보험형 가치”를 구독 오퍼로 고정한다. (무료 Emergency 범위를 명시적으로 제한)

## 설명
- 앱(Project) 그 자체가 아니라, 가격/권한/노출/무료범위를 갖는 “결제 오퍼” 엔티티다.
- 전면 유료화의 핵심은 기능이 아니라 Free boundary 정의의 고정이다.

## 변경 로그
- 2026-01-20: v1 생성