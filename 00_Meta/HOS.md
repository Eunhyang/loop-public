# Hypothesis Operating Standard (HOS) v1 — LOOP

> 목적: 가설이 “아이디어 목록”이 아니라 **결정 가능한 운영 단위**가 되게 만든다.
> 원칙: 가설은 늘리지 말고 **닫거나(Validated/Falsified) 키운다(roll-up)**.

---

## 0. 용어 정의 (SSOT)

* **Hypothesis**: 의사결정 단위의 상위 가설(roll-up 가능)
* **Experiment**: Hypothesis를 검증하기 위한 실행 단위(A/B, 코호트, 운영 변경)
* **Evidence Card**: 실험 결과를 **판정 가능**하게 만든 표준 기록
* **Primary Metric**: 가설 판정을 결정하는 단일 지표(1개)
* **Guardrail Metrics**: 부작용/리스크 감시 지표(최대 2개)

---

## 1. 가설 등록 게이트 (필수 7요건)

가설은 아래 7개를 모두 만족하지 못하면 **등록 불가(=draft로만 존재)**

1. **If/Then 한 문장**

   * “만약 X를 하면, Y가 Z만큼 변한다.”
2. **Primary Metric 1개 지정**
3. **Baseline 명시**

   * before/after, control/treatment, 이전 cohort 등 “비교 기준”
4. **Target(숫자) 명시**

   * 예: +20%, -50%, ≥70%, p50 ≤ 10min
5. **Window(기간/표본) 명시**

   * 예: 14일, n≥200, 10 sessions
6. **Failure line(숫자) 명시**

   * 예: < +5%면 실패
7. **Decision & Action 명시**

   * 성공/실패 시 무엇을 할지(확장/유지/중단/수정/피벗)

---

## 2. 금지어 규칙 (자동 반려)

아래 표현이 들어가면 **미완성**으로 보고 등록/승인 불가:

* “내부 기준”, “유의미”, “충분”, “기준 이상”, “차이 없음”, “개선됨”, “좋아짐”
* “가능한가?”만 있고 **숫자/기간/베이스라인**이 없는 형태

---

## 3. 가설 타입 5종 (반드시 하나로 분류)

1. **Causal(A/B)**: 개입 X → 결과 Y
2. **Cohort/Segment**: 세그먼트별 효과 차이
3. **Demand**: 수요/모집/결제 의지 재현
4. **Quality/Infra**: 스키마/데이터/운영 품질 임계치
5. **Unit Economics**: 매출/비용/환불/CAC/런웨이

> 타입이 정해지면 “측정 방식/증거 카드/판정”이 자동 표준화되어야 한다.
> 상세 템플릿: [[Hypothesis_Templates_Pack]]

---

## 4. 측정 규칙: “1 + 2” (절대 고정)

* Primary Metric: 1개
* Guardrail: 최대 2개
* 그 외 지표는 **참고**로만 기록 (판정 근거로 사용 금지)

---

## 5. 상태 머신 (닫히는 시스템)

허용 상태:

* `draft` → `planned` → `running` → `validated | falsified` (+ `deprecated`)

운영 규칙:

* `planned`가 **30일** 넘으면 자동으로 `deprecated 후보`
* 가설은 최소 월 1회 **상태 변화**가 있어야 한다(정체 = 부채)

---

## 6. Evidence Card 표준 (이 형식만 인정)

Evidence는 감상문이 아니라 아래 필드를 가진 카드로만 인정한다.

* hypothesis_id
* experiment_id (또는 실행명)
* window_id / time_range
* cohort 정의(분모/분자 포함)
* baseline 값
* observed 값
* delta(절대/상대) + 판정(OK/FAIL)
* confounders(교란 1~3개)
* source links(대시보드/쿼리/문서 링크)

---

## 7. 중복 방지 규칙 (가설 생성 제한)

새 가설을 만들기 전에 반드시 셋 중 하나:

1. 기존 Hypothesis에 **Experiment로 추가**
2. 기존 Hypothesis를 **scope 확장(세그먼트/채널 추가)**
3. 기존 가설 2개를 **merge**하고 하나를 `deprecated`

> 원칙: Hypothesis는 “늘리는 것”이 아니라 “키우는 것”.

---

## 8. 주간 운영(15분) 표준 의사결정

매주 1회:

* 이번 주 `running`으로 올릴 가설 1개
* 이번 주 `validated/falsified`로 닫을 가설 1개
* 나머지는 유지/폐기만 결정

---

## 9. 품질 기준 (LLM 판정 가능성)

다음 질문에 “예/아니오”로 답이 나와야 한다:

* 무엇이 성공인가(숫자)?
* 무엇이 실패인가(숫자)?
* 언제까지인가(기간/표본)?
* 어디서 측정되는가(데이터 소스)?
* 성공/실패 시 무엇을 할 것인가(액션)?
