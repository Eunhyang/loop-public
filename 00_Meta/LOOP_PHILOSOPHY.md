# LOOP Vault: 0→1 소수 정예를 위한 AI 의사결정 인프라 (Palantir-lite by Design)

> **LLM Entry Point**: 이 문서는 LOOP Vault의 설계 철학과 핵심 원리를 정의한다.
> CLAUDE.md(운영 가이드)와 함께 반드시 읽어야 한다.

**본 문서는 '0→1 단계(소수 정예)에서 AI 인프라를 먼저 깔고, LLM 발전 속도를 조직 의사결정 속도로 레버리지하는 최선의 구조'로서 LOOP Vault를 정의한다.**
핵심은 "사람을 AI로 대체"가 아니라, **결정–증거–학습 루프를 표준화해 팀의 결정 속도/정확도/재현성을 누적시키는 것**이다.

---

## 1) 한 줄 정의

**LOOP Vault는 '결정(Decision)–증거(Evidence)–정량화(A/B)–승인(Approval)–학습(Loop)'을 문서 기반 SSOT + 자동화(Derived)로 구현한 0→1 단계용 Palantir-lite 운영 OS다.**

---

## 2) 우리가 해결하는 비즈니스 문제

### 2.1 0→1 팀의 본질적 병목

* 사람이 적을수록 "결정의 속도"가 곧 "실험의 속도"이고, 실험 속도가 곧 성장 속도다.
* 하지만 0→1 조직은 다음이 반복된다:

  * 결정이 구두/채팅으로 흩어짐
  * 근거가 사라져 동일 논쟁 반복
  * 실험 결과가 정량화되지 않아 다음 베팅이 감으로 돌아감
  * LLM은 요약/아이디어 도구로만 사용되고 "워크플로 전체"에 붙지 못함

### 2.2 우리가 택한 해법의 원리

* "데이터/결정/행동"이 **하나의 공유 세계(shared world)**를 갖지 못하면, AI 성능이 올라가도 조직 레버리지는 제한된다.
* 그래서 LOOP Vault는 **공유 세계를 '엔티티/스키마/윈도우/증거'로 고정**하고, AI는 그 위에서 점진적으로 자동화 범위를 넓힌다.

---

## 3) 제품 개요 (Palantir식 서술)

### 3.1 What it is (무엇인가)

LOOP Vault는 다음 4개 레이어로 구성된다.

1. **Strategy Layer**: NorthStar → MetaHypothesis → Condition(3Y) → Track(12M)
2. **Execution Layer**: Project → Task
3. **Evidence & Scoring Layer**: Evidence → A(Expected) / B(Realized) → Rollup(Track/Condition)
4. **Automation & Governance-lite**: n8n 오케스트레이션 + FastAPI 추론/검증 엔진 + 승인 로그(append-only)

### 3.2 Why it wins (왜 강한가)

* **SSOT + Derived**: 한 곳에만 저장하고(SSOT), 나머지는 계산(Derived) → 드리프트 방지
* **A/B 점수화**: "베팅(A)"과 "결과(B)"를 분리 → 학습이 누적되는 구조
* **윈도우 기반 평가**: Project(월간) → Track(분기) → Condition(반기)로 롤업 → 비교/집계 가능
* **승인 기반 트랜잭션**: AI는 제안, 인간은 승인 → 책임/감사 가능성 확보
* **LLM 모델 진화에 안전**: 점수 계산은 서버 함수, LLM은 값/관측치 제안 → 모델 바뀌어도 의미 유지

---

## 4) 핵심 설계 원칙

### 4.1 SSOT + Derived (드리프트 방지)

* **SSOT(문서 frontmatter)**: 사람이 최종적으로 "책임지고 입력/승인"하는 값
* **Derived(_build/*.json)**: 언제든 재생성 가능한 값(문서에 저장 금지)

예시:

* Hypothesis.validated_by는 저장하지 않고 Project.validates에서 역인덱스로 계산
* Track/Condition의 realized_sum은 저장하지 않고 Project B를 롤업해 계산

### 4.2 "계산은 코드가, 판단은 사람이"

* LLM은 "필드 후보/근거"를 제안할 수 있지만,
* A/B 점수는 **서버의 고정 로직**으로 계산되어야 재현/검증 가능하다.

---

## 5) 데이터 모델 (Ontology/Entity Model)

### 5.1 회사 운영 온톨로지(Work-Ontology)

* **NorthStar / MetaHypothesis / Condition / Track**: 전략적 좌표
* **Project**: 유일한 판정 단위(베팅 A와 결과 B의 대상)
* **Task**: 단순 행동 기록(전략 의미/점수 금지)
* **Hypothesis / Experiment**: 검증 구조(가설은 Track 소속, 프로젝트는 여러 가설을 검증 가능)
* **Evidence**: 결과와 학습을 구조화한 근거 객체(B의 입력)

### 5.2 Evidence와 A/B의 관계

* **A(Expected)**: tier × magnitude × confidence 기반의 베팅 가치(결정 시점)
* **B(Realized)**: Evidence의 관측치(예: normalized_delta, strength, attribution)를 합산해 산출(사후 결과)

---

## 6) 시스템 구성 요소 (Foundry-style "Platform Components")

### 6.1 Vault (문서 기반 SSOT)

* 사람의 판단/맥락/결정이 "파일로 남는" 구조
* 로컬 우선, 추후에도 이식 가능한 중립 포맷

### 6.2 FastAPI (Inference + Guard + Scoring Engine)

* "LLM 호출"이 아니라 **Impact Inference Engine**:

  * Schema Guard: enum/금지 필드/가중치합/구조 검증 + repair
  * Prompt Pack: 템플릿/버전 관리
  * LLM Runner: 엄격 JSON 출력 + 재시도/폴백
  * Scoring Engine: A/B는 서버 계산
  * Audit Writer: run_id 기반 실행 기록 저장
  * Pending Writer: 승인/거부용 제안 객체 생성

### 6.3 n8n (오케스트레이션)

* 정기 실행, 분기, 필터, 루프, 실패 확인(UI), 재실행
* "AI/스키마/점수 계산"을 서버로 올릴수록 n8n은 단순하고 강해진다.

### 6.4 Derived Build Artifacts (_build)

* impact.json 등 계산 결과 캐시
* 상위 롤업(Track/Condition) 및 대시보드가 의존하는 단일 산출물

---

## 7) 운영 프로세스 (End-to-End Workflow)

### 7.1 Project 시작 (A 생성)

1. Project 생성(문서 SSOT)
2. A(Expected) 관련 필드 LLM 제안 → 서버 검증/점수 계산 → Pending 생성
3. 사람 승인(승인 로그 기록)

### 7.2 Project 종료/회고 (Evidence 생성 → B 계산)

1. 회고 입력(또는 자동 수집)
2. Evidence 생성(구조화된 필드 + window)
3. B(Realized) 계산(서버 함수) + Project realized_impact 업데이트 제안(Pending)
4. 사람 승인(승인 로그 기록)
5. build_impact 실행 → Track/Condition 롤업 갱신

---

## 8) "Evidence 품질 메타 → 승인 로그"가 왜 최우선인가

### 8.1 Evidence 품질 메타(신뢰 구조)

B는 숫자지만, **숫자의 신뢰 구조**가 없으면 "그럴듯한 점수"로 끝난다.
따라서 Evidence에는 최소한 아래 품질 메타가 필요하다:

* provenance(auto/human/mixed)
* source_refs(쿼리/링크/샘플)
* sample_size
* measurement_quality
* counterfactual(none/before_after/controlled)
* confounders

### 8.2 승인 로그(append-only)

AI가 점점 더 많은 작업을 하게 될수록, "누가 무엇을 승인했는지"는 제품·조직의 안전장치가 된다.

* decision_log.jsonl(append-only)
* audit/run 로그(재현 가능한 디버깅)

---

## 9) Palantir와의 관계 (오해 방지)

LOOP Vault는 "Palantir 대체"가 아니라, **0→1 단계에 맞춘 Palantir-lite 구조**다.

* Palantir/Foundry가 강한 영역: 엔터프라이즈 거버넌스/권한/라인리지/대규모 통합/규제
* LOOP Vault가 강한 영역: 소수 정예에서 "결정–증거–학습" 루프를 가장 싸고 빠르게 구축

즉, 현재 단계에서 ROI가 가장 높은 것은 "대규모 플랫폼 도입"이 아니라 **우리 방식으로 핵심 원리를 선제 구현하는 것**이다.

---

## 10) 확장 로드맵 (Scale-up Readiness)

### Stage 0 (현재): Vault + n8n + FastAPI (최적)

* 소수 팀, 빠른 실험, 비용 최소

### Stage 1: 데이터 소스 확장(코치/앱/매출 로그) + Evidence 자동 생성 강화

* 회고/증거 생산 병목을 더 줄임

### Stage 2: Governance-lite 강화(권한/감사 범위 확대)

* 파트너/기관 협업을 대비

### Stage 3: 엔터프라이즈 플랫폼 검토(필요 시)

* 외부 감사/컴플라이언스/다기관 데이터 통합이 "계약 조건"이 되는 시점에만

---

## 11) 성공 지표 (이 시스템이 '최선'인지 판정하는 KPI)

* 결정 리드타임(Decision Cycle Time): 아이디어 → 승인된 베팅(A)까지
* Evidence 생산 비용: 회고→Evidence까지 평균 시간
* 승인률(Pending Accept Rate): AI 제안이 실제 승인되는 비율
* 재현성: 3개월 뒤에도 같은 결정을 같은 근거로 설명 가능한지
* 롤업 품질: Track/Condition 점수가 전략 회의에서 실제로 쓰이는지

---

## 12) 결론

LOOP Vault는 0→1 단계에서 "AI 인프라를 먼저 깔아 LLM 발전을 조직 의사결정 속도로 레버리지"하기 위한 구조로 설계되었고, **현 시점에서 가장 높은 ROI를 내는 방향**은 다음 두 가지를 우선 구현하는 것이다.

1. **Evidence 품질 메타 표준화 + 자동 채움**
2. **승인 로그(append-only) + audit(run) 로그로 재현/책임 구조 확보**

---

**Last Updated**: 2025-12-28
