---
entity_type: Offering
entity_id: off-app-subscription-v0
entity_name: 앱 구독 v0 (부분 유료 / RevenueCat default)
created: 2026-01-20
updated: 2026-01-20
status: doing
owner: Product Team
parent_id: trk-1
tags:
  - gtm
  - monetization
  - subscription
priority_flag: high

# 그래프 연결을 위한 최소 필드(권장)
attached_surface_id: prj-app-kkokkkok
monetizes_track_id: trk-6

revenuecat:
  project_id: f712ee71
  offering_identifier: default
  revenuecat_id: ofrng1d4357f47a
  packages:
    - package_id: $rc_monthly
      rc_product_identifier: pro.monthly:promonthly
      store_product_id: pro_monthly_1
    - package_id: $rc_annual
      rc_product_identifier: pro.annual:proannual
      store_product_id: pro_annual_1
---

# Offering: 앱 구독 v0

## 1) 한 줄 정의

앱(꼭꼭)의 유료 권한(Entitlement)을 구독 형태로 제공하는 기본 오퍼.

## 2) Entitlement (권한)

* entitlement_id: pro
* free_scope: Quick Brake(15~30초) + 회복 시작(첫 1분)
* paid_scope: 대시보드/인사이트/개인화/회복 리플레이/심화

## 3) Plans (가격/기간 구조)

* monthly: TBD (현재 운영값은 RevenueCat/스토어 기준)
* annual: TBD
* 다음 스텝(v1): 전면 유료화 월 ₩9,800 (신규 offering으로 분리)

## 4) Evidence / Source of Truth

* RevenueCat offering: default
* 운영 지표: RevenueCat Charts + 결제/전환 퍼널

## 5) Notes

* v1(₩9,800 전면 유료화)은 별도 offering으로 생성해 실험/리포팅 분리.
