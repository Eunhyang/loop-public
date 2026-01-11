# Hypothesis Templates Pack v1 (5 Types)

> 사용법: 새 가설 작성/리라이트 시 아래 템플릿 중 하나를 선택해 **필드 100% 채운다**.
> 비어 있으면 상태는 `draft` 고정.

---

## 공통 체크리스트 (작성 후 통과해야 함)

* [ ] If/Then 한 문장으로 요약 가능
* [ ] Primary Metric 1개만 존재
* [ ] Baseline이 수치로 존재
* [ ] Target이 수치로 존재
* [ ] Failure line이 수치로 존재
* [ ] Window가 기간/표본으로 존재
* [ ] Decision & Action이 존재
* [ ] 금지어(“내부 기준/유의미/차이 없음/충분/기준 이상”)가 없다

---

## Type 1) Causal (A/B)

**If/Then**:

* If (개입 X) then (Primary Metric Y)가 (Target Z)만큼 변한다.

**Primary Metric**:

* 지표명 / 단위 / 계산식

**Baseline**:

* 기준 기간/코호트 / baseline 값

**Target & Failure**:

* Target:
* Failure:

**Window**:

* 기간 / 표본수(n) / 최소 유효 샘플

**Experiment Design**:

* Control vs Treatment 정의
* 랜덤/매칭/순차 롤아웃 방식
* Guardrails(최대 2개)

**Decision & Action**:

* Validated → (전면 적용/확장/가격 반영 등)
* Falsified → (개입 폐기/변형/세그먼트 한정 등)

**Evidence Card 규격 링크**:

* (대시보드/쿼리/로그)

---

## Type 2) Cohort / Segment

**If/Then**:

* If (세그먼트 S) then (효과 크기)가 (전체 대비) (k배/Δ) 더 크다.

**Segmentation Rule**:

* 태깅 규칙 / 분류 기준(예: GLP-1 off, Tier2 등)

**Primary Metric**:

* 지표명

**Baseline/Comparison**:

* 비교 대상: 전체/다른 세그먼트/이전 코호트
* baseline 값

**Target & Failure**:

* Target: (효과 크기 Δ 또는 ratio)
* Failure: (차이가 임계치 미만)

**Window**:

* 기간/표본

**Guardrails**:

* (최대 2개)

**Decision & Action**:

* 승리 세그먼트에 우선 투자/메시지/온보딩 분기
* 실패 시 세그먼트 정의 재설계

---

## Type 3) Demand (Repeatability)

**If/Then**:

* If (제안/랜딩/채널/모집 X) then (결제/신청 Y)가 (n명/전환율 Z)로 재현된다.

**Primary Metric**:

* 결제 전환율 / 신청 완료율 / 유료 cohort 성립 여부(숫자화)

**Baseline**:

* 이전 모집/캠페인 성과

**Target & Failure**:

* Target: “2회 연속” + “각 회차 n명/전환율”
* Failure: “2회 연속 목표의 50% 미만” 같은 형태

**Window**:

* 모집 기간/회차 수

**Guardrails**:

* 환불률 / CS 급증 / 노쇼 등

**Decision & Action**:

* 재현 성공 → 스케일(채널 확대/가격 최적화)
* 실패 → 포지셔닝/오퍼/채널 재설계

---

## Type 4) Quality / Infra

**If/Then**:

* If (시스템/스키마/운영 X) then (품질 지표 Y)가 (임계치 Z)를 만족한다.

**Primary Metric**:

* 예: breaking change 0, 누락률 ≤ 5%, 라벨 일치율 ≥ 70%

**Baseline**:

* 현재 값 / 최근 4주 평균

**Target & Failure**:

* Target: (임계치)
* Failure: (임계치 미달이 N주 지속)

**Window**:

* 4주/12주 등

**Guardrails**:

* 개발 리드타임, 운영 부담 등

**Decision & Action**:

* 만족 → 표준 고정(SSOT)
* 미달 → 원인 분해(측정/수집/정의/훈련)

---

## Type 5) Unit Economics

**If/Then**:

* If (가격/구성/운영 구조 X) then (순매출/마진/런웨이 Y)가 (목표 Z)로 간다.

**Primary Metric**:

* 순매출(환불 차감) / 월 이탈률 / CAC 회수기간 / 마진

**Baseline**:

* 적용 전 2개월 평균

**Target & Failure**:

* Target: +30% 순매출 2개월 유지 / 이탈 ≤10%
* Failure: 환불 ≥12% 지속 / 마진 악화

**Window**:

* 월 단위(최소 2개월), 또는 cohort 30일

**Guardrails**:

* CS/평점/환불사유(기대 불일치)

**Decision & Action**:

* 성공 → 가격/플랜 고정 + 확장
* 실패 → 오퍼/메시지/가치 전달 재설계

---

## 금지어 탐지(수동 운영 규칙)

아래 단어가 들어가면 **즉시 수정**:

* 내부 기준 / 유의미 / 충분 / 기준 이상 / 차이 없음 / 개선됨 / 좋아짐
