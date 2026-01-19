# Strategic Context Template — GTM Subgraph (v1)

> 목적: “콘텐츠 → 앱 → 구독” + “콘텐츠 → 코칭(앱 동반) → 결제” + “코칭 데이터 → 앱 가치 → 구독 성장”을
> **추론 없이** 그래프에 고정하기 위한 정형 블록.
>
> 사용법:
>
> 1. 이 블록을 Strategic Context 문서에 그대로 붙여넣는다.
> 2. id는 가능하면 실제 Vault entity id(예: prj-xxx, trk-x)를 사용한다.
> 3. ontology_lite_v1.yaml을 확장하지 않는 경우, type은 Track/Project만 써도 된다.

---

## [GTM_SUBGRAPH] v1

### Nodes

> 규칙: id는 고유해야 하며, title은 Vault의 실제 엔티티명과 일치시키는 것을 권장.

* id: prj-content
  type: Project
  title: "Content Channel (대표 콘텐츠 엔진: YouTube 1주 1업로드 등)"
  tags: ["gtm:channel", "content", "top_of_funnel"]

* id: prj-app
  type: Project
  title: "Product (꼭꼭앱)"
  tags: ["gtm:product", "app"]

* id: prj-subscription
  type: Project
  title: "Offer (앱 유료 구독)"
  tags: ["gtm:offer", "subscription", "revenuecat"]

* id: prj-coaching
  type: Project
  title: "Offer (코칭 프로그램/상품)"
  tags: ["gtm:offer", "coaching", "service_revenue"]

* id: prj-coachos
  type: Project
  title: "CoachOS (코칭 운영/데이터 저장·매핑 시스템)"
  tags: ["gtm:ops", "coachos", "data_engine"]

* id: trk-revenue
  type: Track
  title: "Track_6_Revenue (Revenue Stream Aggregation)"
  tags: ["gtm:revenue_stream", "mrr", "cashflow"]

### Edges

> 규칙:
>
> * type은 edge_types.yaml에 정의된 키를 사용한다 (예: gtm_activates_into).
> * evidence는 URL/대시보드/리포트 키/문서 링크 등 “재검증 가능한 근거”를 넣는다.
> * measured_at은 가능하면 YYYY-MM-DD로 입력한다.

# (A) 현재 퍼널 1: 콘텐츠 → 앱(활성) → 구독(결제)

* type: gtm_activates_into
  from_id: prj-content
  to_id: prj-app
  evidence: "amplitude_campaign_install_activation_report"
  strength: "medium"
  measured_at: "YYYY-MM-DD"
  note: "콘텐츠 CTA/랜딩/링크를 통해 앱 설치·가입·활성화로 연결된다."

* type: gtm_upsells_to
  from_id: prj-app
  to_id: prj-subscription
  evidence: "revenuecat_trial_to_paid_conversion_report"
  strength: "medium"
  measured_at: "YYYY-MM-DD"
  note: "앱 사용자가 유료 구독으로 전환된다(전환율/리텐션 기반)."

* type: gtm_monetized_by
  from_id: prj-subscription
  to_id: trk-revenue
  evidence: "revenuecat_mrr_dashboard"
  strength: "strong"
  measured_at: "YYYY-MM-DD"
  note: "앱 구독 결제가 RevenueCat/매출 지표로 귀속된다."

# (B) 현재 퍼널 2: 콘텐츠 → 코칭(결제) (+ 코칭에서 앱 동반 사용)

* type: gtm_upsells_to
  from_id: prj-content
  to_id: prj-coaching
  evidence: "coaching_landing_lead_to_paid_funnel_report"
  strength: "weak"
  measured_at: "YYYY-MM-DD"
  note: "콘텐츠가 코칭 상담/구매 전환(리드→결제)을 만든다."

* type: gtm_includes
  from_id: prj-coaching
  to_id: prj-app
  note: "코칭 제공 과정에서 앱 기록/루틴을 동반 사용한다(패키지 구성/운영 방식)."

* type: gtm_monetized_by
  from_id: prj-coaching
  to_id: trk-revenue
  evidence: "coaching_sales_sheet_or_payment_dashboard"
  strength: "medium"
  measured_at: "YYYY-MM-DD"
  note: "코칭 프로그램 결제가 매출로 귀속된다."

# (C) 목표 플라이휠: 코칭 데이터 → 앱 가치 강화 → 앱 구독 성장

* type: gtm_data_feeds
  from_id: prj-coachos
  to_id: prj-app
  evidence: "coachos_to_app_ontology_mapping_spec"
  strength: "medium"
  measured_at: "YYYY-MM-DD"
  note: "코칭에서 생성된 라벨/개입/패턴 데이터가 앱(온톨로지/인사이트/AI코칭)에 축적된다."

* type: gtm_upsells_to
  from_id: prj-coaching
  to_id: prj-subscription
  evidence: "post_coaching_subscription_cohort"
  strength: "medium"
  measured_at: "YYYY-MM-DD"
  note: "코칭 경험/데이터 기반 가치 체감이 앱 유료 구독 전환/유지를 강화한다."

---

## Optional: Entity ID Binding (권장)

> 실제 Vault entity id가 이미 있으면 아래처럼 덮어쓰기(운영 시 오류/중복 방지)

* bind:
  prj-content: "prj-<your_actual_content_project_id>"
  prj-app: "prj-<your_actual_app_project_id>"
  prj-subscription: "prj-<your_actual_subscription_project_id>"
  prj-coaching: "prj-<your_actual_coaching_project_id>"
  prj-coachos: "prj-<your_actual_coachos_project_id>"
  trk-revenue: "trk-6"

---

## Normalization Notes (for implementers)

* Parser는 [GTM_SUBGRAPH] 섹션을 찾으면 Nodes/Edges를 그대로 Graph Payload에 포함한다.
* id 충돌 시 bind 값을 우선한다.
* evidence가 비어있더라도 edge를 생성할 수 있으나,
  gtm_activates_into / gtm_upsells_to / gtm_monetized_by / gtm_data_feeds 는 evidence 입력을 강하게 권장한다.
