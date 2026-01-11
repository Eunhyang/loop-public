# LOOP Hypotheses 유지 전략 (46개 유지 전제) — 수정 필수 + 신규 가설 제안
작성일: 2026-01-11

> 목적: **기존 46개 Hypothesis를 삭제하지 않고 그대로 “운영 가능한 수준”으로 만들기**  
> 결과물: (1) 46개 전수 “수정 필수 항목” (2) 사업계획서/실행 프로젝트 기준 “추가로 생성해야 할 가설” 목록

---

## 0) 결론 요약

### A. 46개를 그대로 유지한다면 “무조건 고쳐야 하는 것” (Top 6)
1. **금지어 제거 + 숫자화**  
   - “내부 기준/유의미/차이 없음/충분/기준 이상” → 전부 **수치+기간+베이스라인**으로 치환
2. **Primary Metric 1개 고정(1+2 룰)**  
   - Primary 1개 + Guardrail 최대 2개. 그 외는 참고지표로만.
3. **Baseline을 ‘값’이 아니라 ‘정의+쿼리’로 고정**  
   - 당장 숫자가 없어도 “어디서 어떤 쿼리로 산출”이 SSOT면 운영 가능.
4. **Deadline(또는 Window 종료 조건) 추가**  
   - deadline이 없으면 영원히 ‘todo’로 남아 부채가 됨.
5. **사업계획서 KPI와 목표치 불일치 정렬**  
   - 예: “완주율 70%” 류 → 사업계획서가 요구하는 레벨(예: 85%)과 정렬 필요.
6. **중복 가설 정리(merge 기준 정의)**  
   - 동일 효과(리포트→전환, 증거→전환 등)가 Track 1/6에 중복.  
   - “실험은 하나, 해석은 여러 가설에 Evidence로 참조”로 운영.

---

## 1) 전역 수정 규칙 (46개 공통 적용)

### 1.1 HOS 필수 필드 체크리스트
각 Hypothesis는 아래가 **문서에 명시**되어야 운영 가능:
- If/Then 한 문장
- Primary Metric 1개(정의/분모/분자/단위 포함)
- Baseline(“측정 방식/쿼리/기간”)
- Target(숫자)
- Window(기간 또는 표본수)
- Failure line(숫자)
- Decision(Validated/Falsified 시 액션)

### 1.2 상태 머신 권장
- `todo` 상태라도 내부적으로는 **planned / running / validated / falsified / deprecated** 중 하나로 관리 권장  
- planned가 30일 넘으면 **deprecated 후보**로 간주(운영에서 안 돌릴 거면 묻어야 함)

### 1.3 사업계획서 KPI 정렬(“앵커 KPI”)
46개는 유지하되, 아래 KPI는 **상위 앵커**로 계속 참조되게 만든다.
- Trial-to-Paid (목표 15% 수준)
- Recovery Latency p50 단축
- D30 Retention 25% 수준
- Monthly Net Revenue (예: 0.6 → 1.2)
- Coaching Completion (목표 85% 수준)
- Coach Efficiency (예: 90분/주/인)
- AI 대체율 (예: 40%)
- Instrumentation/Join Coverage (측정 잠금)

---

## 2) 46개 “수정 필수” 목록 (가설별 패치 가이드)

> 표의 **Fix**는 “최소 수정” 기준이다. (새 가설로 대체하지 않고, 기존 hyp-*를 살린다는 전제)

### Track 1 — Product (hyp-1-01 ~ hyp-1-11)

| ID | 핵심 문제 | Fix (필수 수정) |
|---|---|---|
| hyp-1-01 | 좋음(숫자 존재) / 다만 Baseline 정의가 약함 | Baseline=도입 전 14일 p50(식사시간) 명시 + 샘플 n 기준 추가 |
| hyp-1-02 | “내부 기준” 금지어 + Primary 불명확 | Primary=4주 유지율(정의: W4에 핵심행동 1회)로 고정 + Target 수치 명시 |
| hyp-1-03 | 1.5배는 좋지만 cohort/세그먼트 정의 없음 | “개선군” 정의(행동지표 Δ 임계치) + Window(30일) + Failure 수치 |
| hyp-1-04 | Failure가 ‘차이 없음’(금지어) | Failure=+5% 미만 같은 수치로 변경 + Guardrail(환불/CS) 추가 |
| hyp-1-05 | 성공 기준이 “2개 지표 이상 우세” → 판정 흐림 | Primary 1개(예: W4 Retention 또는 행동지표)로 고정, 나머지는 guardrail로 |
| hyp-1-06 | “유의미” 금지어 | Target=세그먼트 효과크기 ratio(예: 1.3x) + Failure=1.1x 미만 |
| hyp-1-07 | 좋음(수치 존재) / Baseline 정의 추가 필요 | Baseline=직전 14일 코호트 D1 rate 평균으로 고정 |
| hyp-1-08 | 상관/인과 혼재 | 설계를 “선행관계”로 바꾸기(사용 → 이탈 예측) 또는 A/B(노출)로 전환 |
| hyp-1-09 | “매주 안정”이 수치 없음 | Primary=누락률/오류율(%)로 정량화 + Target(≤5%) 명시 |
| hyp-1-10 | “기준 이상” 금지어 | 가치 이해도 문항을 0-10 점수화, Target(≥7) 등 수치로 |
| hyp-1-11 | “반복 우세” 기준이 불명확 | 승자 정의: 2회 실험 연속 우세 + 효과크기(≥+20%) 명시 |

### Track 2 — Data (hyp-2-01 ~ hyp-2-10)

| ID | 핵심 문제 | Fix (필수 수정) |
|---|---|---|
| hyp-2-01 | 좋음(주당 1건) / 데이터 소스만 구체화하면 됨 | “표현 불가 티켓/로그”의 입력 채널/포맷을 SSOT로 고정 |
| hyp-2-02 | breaking change 0 좋음 / 기간(12주) 명시됨 | “breaking change” 정의(필드 삭제/의미 변경 등) 추가 |
| hyp-2-03 | 좋음(≤5%) / Failure(≥15%) 존재 | 누락률 산출 쿼리(분모/분자) 고정(문서에 명시) |
| hyp-2-04 | 좋음(기한 존재) / “자동 산출” 정의 필요 | 자동 산출의 산출물(리포트/테이블/대시보드)을 명시 |
| hyp-2-05 | 좋음(70%/50%) / 샘플링 규칙 필요 | 더블 라벨링 샘플링 룰(주 10~20건, 랜덤) 고정 |
| hyp-2-06 | 좋음(10개/70%) | “패턴”의 최소 정의(트리거+행동+결과) 문서화(링크) |
| hyp-2-07 | “자동/수동 비율”이 Primary로 애매 | Primary=월 1회 리포트 자동 생성 성공 여부(%) 또는 작업시간(분) |
| hyp-2-08 | “유용성/일관성 기준 통과”가 루브릭 미정 | 루브릭(5점 척도, 합격선) 표준 문서 링크 추가 |
| hyp-2-09 | “연속 개선”이 수치 없음 | 누락률/이상치 감소율 목표(예: -30%) + window(8주) |
| hyp-2-10 | 외부 설득 ‘평가’가 주관적 | 피드백을 체크리스트 점수화(예: 10항목 중 ≥7 통과) |

### Track 3 — Content (hyp-3-01)

| ID | 핵심 문제 | Fix (필수 수정) |
|---|---|---|
| hyp-3-01 | 전반적으로 좋음 | Draft→Approved 타임스탬프 수집이 실제로 존재하는지(데이터 소스) 확정 |

### Track 4 — Coaching (hyp-4-01 ~ hyp-4-10)

| ID | 핵심 문제 | Fix (필수 수정) |
|---|---|---|
| hyp-4-01 | 좋음(2회 연속 + 숫자 필요) | “목표 인원”을 수치로 고정(N명) + window(2회) 명시 |
| hyp-4-02 | 동일 | 동일 |
| hyp-4-03 | 완주율 70%는 사업계획서 목표(85%)와 불일치 가능 | Target을 사업계획서 KPI와 정렬(예: ≥85% 또는 단계 목표) |
| hyp-4-04 | NPS 기준이 없음 | Target NPS(예: ≥30) 또는 만족도(≥4.3/5)로 수치화 |
| hyp-4-05 | 좋음(25% 또는 60%) | 개선 지표 정의(폭식/야식/식사속도) 중 Primary 1개만 고정 |
| hyp-4-06 | 좋음(표준화) | “동일 케이스 대응 점수/라벨” 루브릭을 SSOT로 확정 |
| hyp-4-07 | 코치 시간/단가 “내부 기준 이하”가 불명확 | 사업계획서의 목표(예: 90분/주/인)로 수치 고정 |
| hyp-4-08 | 리포트 제공 A/B 좋음 | Primary=업셀율 또는 재구매율 중 1개 고정 |
| hyp-4-09 | “매핑 성공률 90%” 좋음 | 매핑 성공 정의(필수 필드 충족률) 구체화 |
| hyp-4-10 | “수렴” 기준이 애매 | 메시지/포지셔닝 승자 정의(2회 연속 우세 + 효과크기) |

### Track 6 — Revenue (hyp-6-01 ~ hyp-6-14)

| ID | 핵심 문제 | Fix (필수 수정) |
|---|---|---|
| hyp-6-01 | 좋음(+30%, 2개월) | “순매출” 정의(환불 차감) 명시 |
| hyp-6-02 | Target 3%/5%가 사업계획서 Trial-to-Paid 15%와 KPI 체계 충돌 가능 | 이 가설의 scope을 “무료→유료”가 아니라 “유입→체험” 또는 “랜딩 전환”으로 재정의하거나 Target 상향 정렬 |
| hyp-6-03 | 좋음(≤7%, 기대불일치 -30%) | CS 태깅 기준(사유 taxonomy) 고정 |
| hyp-6-04 | 좋음(2회 우세) | Primary=순매출 기준으로 고정(전환율 단독 금지) |
| hyp-6-05 | 좋음(이탈 ≤10%) | Cohort 정의(월 구독 cohort) 명시 |
| hyp-6-06 | 번들 전환 +30% 좋음 | “번들” 정의(구성 요소) 고정 |
| hyp-6-07 | 업셀 25%는 강함(좋음) | 매칭(코칭 CRM ↔ 결제) Join Coverage 조건 추가 |
| hyp-6-08 | 업셀 3%/채널 2개 재현 좋음 | 채널 정의(앱 내/이메일/카톡 등) 명시 |
| hyp-6-09 | CAC 기준이 내부 기준일 가능성 | CAC 회수기간/목표(예: 1개월 회수) 수치 고정 |
| hyp-6-10 | 리포트 노출 +20% 좋음 | hyp-1-04와 중복 → “실험 1개”로 합치고 Evidence를 양쪽에 참조 |
| hyp-6-11 | “매출 증가율 > 비용 증가율” 좋음 | 비용 정의(고정/변동) + 산식 명시 |
| hyp-6-12 | 목표 구간 좋음 | “순매출” 정의(환불 차감) 반복 명시 |
| hyp-6-13 | “완비/상승”이 수치 없음 | 체크리스트 점수화(예: 10개 중 ≥8 충족) + 미팅 전환율 목표 |
| hyp-6-14 | 클로징 OK / 조건(금액/조건 내부 기준) 불명확 | 클로징 최소 기준(금액/밸류/조건) 숫자로 고정(내부용) |

---

## 3) “46개를 그대로 쓸 때” 새로 생성해야 하는 가설 (추천 6~8개)

> 기존 46개는 대부분 **기능/개별 실험**이고, 사업계획서/투자 심사는 **상위 KPI 패키지(증거 묶음)** 를 요구한다.  
> 아래 신규 가설은 “앵커 KPI/측정 잠금/운영 확장성”을 보완한다.

### 신규 가설 1) BP 앵커: Trial-to-Paid 15% (상위 KPI)
- **ID 제안**: hyp-bp-01
- **Primary**: Trial-to-Paid (%)
- **Baseline**: 직전 2주 코호트 평균(정의/쿼리 SSOT)
- **Target**: 15% + 2개 코호트 연속 재현
- **Window**: 12주
- **Failure**: <10% 또는 환불 ≥12% 지속
- **Decision**: 승자 paywall 고정 / 오퍼·메시지 재설계

### 신규 가설 2) BP 앵커: Recovery Latency p50 단축 (상위 KPI)
- **ID 제안**: hyp-bp-02
- **Primary**: Recovery Latency p50 (problem_event→recovery_start)
- **Baseline**: W1~W2 p50
- **Target**: -10~20%
- **Window**: 12주
- **Failure**: -5% 미만
- **Decision**: 개인화 확대 / UX 재설계

### 신규 가설 3) BP 앵커: D30 25% (상위 KPI)
- **ID 제안**: hyp-bp-03
- **Primary**: D30 Retention (%)
- **Baseline**: 현재(예: 20.5%로 제시된 값) + 산출 정의
- **Target**: 25%
- **Window**: 6개월(단, 12주 leading indicator 병행)
- **Failure**: 3개월 연속 정체
- **Decision**: 코어 플로우 고정 / 온보딩·회복루프 재설계

### 신규 가설 4) Measurement Lock: 결제/환불/이벤트 Join Coverage ≥95%
- **ID 제안**: hyp-bp-04
- **Primary**: Join Coverage (%)
- **Baseline**: 현재 join율
- **Target**: ≥95%
- **Window**: 4주
- **Failure**: <90% 지속
- **Decision**: 측정 파이프라인 고친 후에만 A/B 계속

### 신규 가설 5) Coach Efficiency 90분/주/인 (사업계획서 직접 KPI)
- **ID 제안**: hyp-bp-05
- **Primary**: Coach minutes / active user / week
- **Baseline**: 현재(예: 150분)
- **Target**: ≤90분 4주 연속
- **Window**: 4~8주
- **Failure**: ≥120분 4주 지속
- **Decision**: 표준화/자동화 강화 또는 오퍼 구조 축소

### 신규 가설 6) AI 대체율 40% (사업계획서 직접 KPI)
- **ID 제안**: hyp-bp-06
- **Primary**: AI Substitution Rate (%)
- **Baseline**: 현재 분류(0~) 확정
- **Target**: ≥40%
- **Window**: 12주
- **Failure**: <20% 정체 또는 품질 문제로 CS 증가
- **Decision**: 반복 업무 범위 확대 / 고정 포맷부터 단계적 전환

### 신규 가설 7) “리포트/증거”는 하나로 통합한 상위 실험 가설(중복 제거)
- **ID 제안**: hyp-bp-07
- **Primary**: Net revenue per visitor (또는 Trial-to-Paid) 중 택1
- **Baseline/Target/Window**: 기존 hyp-1-04 + hyp-6-10을 “실험 1개”로 합치고, Evidence 양쪽 참조
- **Decision**: 승자 리포트 포맷 고정

### 신규 가설 8) Content/YouTube → Trial funnel 연결 KPI (사업계획서 narrative 강화)
- **ID 제안**: hyp-bp-08
- **Primary**: Content→Trial Start Rate (%) 또는 CAC 회수기간(일)
- **Baseline**: 현재 유입/체험 전환
- **Target**: +30% 개선 또는 CAC 회수 ≤ 30일
- **Window**: 8~12주
- **Decision**: 채널 확대/콘텐츠 포맷 고정

---

## 4) 실행 순서 (가장 빠르게 “운영 가능한 상태”로 만들기)
1. **측정 잠금부터(hyp-bp-04)**: Join Coverage ≥95%  
2. **Trial-to-Paid(hyp-bp-01)** + 환불(hyp-6-03) 같이 돌리기  
3. Recovery Latency(hyp-bp-02)로 “효능” 확보  
4. Coach Efficiency(hyp-bp-05) + AI 대체율(hyp-bp-06)로 “스케일 가능성” 확보  
5. D30(hyp-bp-03)는 12주 leading indicator를 병행하면서 장기 추적

---

## 5) 부록: “46개 유지” 운영 원칙 (짧게)
- 기존 hyp-*는 **삭제하지 않되**, 위 신규 hyp-bp-*를 **앵커**로 두고 모두 귀속/정렬한다.
- 운영상 “running”은 **최대 2~3개**만 유지한다.
- 나머지는 planned로 두고, 30일 넘기면 deprecated 후보로 관리한다.
