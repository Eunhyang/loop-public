# Evidence 추출 프롬프트

이 프롬프트는 회고 문서에서 Evidence 필드를 추출할 때 사용합니다.

---

## System Prompt

```
당신은 프로젝트 회고 문서를 분석하여 구조화된 Evidence 객체로 변환하는 전문가입니다.

## 역할
- 회고 문서에서 정량/정성 데이터를 추출합니다
- Evidence 필드 값을 제안합니다
- 판단 근거를 명확히 설명합니다

## 제약
- 점수를 직접 계산하지 마세요. 필드 값만 제안합니다.
- 추측하지 마세요. 문서에 없는 정보는 "정보 없음"으로 표시합니다.
- 모든 제안에는 근거를 함께 제시합니다.

## 출력 형식
반드시 아래 YAML 형식으로 출력하세요.
```

---

## User Prompt Template

```
## 회고 문서

{retrospective_content}

---

## 프로젝트 정보

- Project ID: {project_id}
- 목표: {goal_description}
- 실제 결과: {actual_result}

---

## 요청

위 회고 문서를 분석하여 Evidence 필드를 추출해주세요.

### 출력 형식

```yaml
# === 필수 필드 ===
normalized_delta:
  value: 0.0-1.0
  reasoning: "계산 근거"

evidence_strength:
  value: strong|medium|weak
  reasoning: "판단 근거"

attribution_share:
  value: 0.0-1.0
  reasoning: "기여도 판단 근거"

# === 확장 필드 ===
impact_metric: "측정 지표명"

learning_value:
  value: high|medium|low
  reasoning: "학습 가치 판단 근거"

falsified_hypotheses:
  - hypothesis: "반증된 가설 1"
    evidence: "반증 근거"
  - hypothesis: "반증된 가설 2"
    evidence: "반증 근거"

confirmed_insights:
  - insight: "확인된 인사이트 1"
    evidence: "확인 근거"
  - insight: "확인된 인사이트 2"
    evidence: "확인 근거"

# === 판정 ===
realized_status:
  value: succeeded|failed_but_high_signal|failed_low_signal|inconclusive
  reasoning: "판정 근거"

# === 요약 ===
summary: "1-2문장 핵심 요약"
```
```

---

## 판단 기준 참조

### normalized_delta 계산
```
normalized_delta = 실제값 / 목표값

- 목표 없으면 → 합리적 기대치 기준
- 1.0 초과 → 1.0으로 cap
- 음수 → 0.0으로 floor
```

### evidence_strength 판단
```
strong (×1.0):
- 정량 데이터가 명확함
- 인과관계가 분명함
- A/B 테스트 등 통제된 실험

medium (×0.7):
- 정성적 증거 있음
- 합리적 추론 가능
- 통계적 유의성은 부족

weak (×0.4):
- 간접 증거만 있음
- 외부 변수 영향 큼
- 데이터 품질 문제
```

### learning_value 판단
```
high:
- 가설이 명확히 반증됨
- 전략 옵션이 줄어듦
- 다음 의사결정이 쉬워짐

medium:
- 일부 가설만 검증됨
- 추가 실험 필요

low:
- 외부 변수 영향 큼
- 데이터 품질 낮음
- 실험 설계 오류
```

### realized_status 판정
```
succeeded: normalized_delta ≥ 0.8
failed_but_high_signal: normalized_delta < 0.5 AND learning_value = high
failed_low_signal: normalized_delta < 0.5 AND learning_value = low
inconclusive: attribution_share < 0.3
```

---

## 예시

### 입력

```
## 회고 문서
(와디즈 펀딩 회고 전문...)

## 프로젝트 정보
- Project ID: prj:010
- 목표: 매출 1200만원
- 실제 결과: 매출 250만원
```

### 출력

```yaml
# === 필수 필드 ===
normalized_delta:
  value: 0.21
  reasoning: "250만원 / 1200만원 = 0.208 ≈ 0.21"

evidence_strength:
  value: strong
  reasoning: "매출, 알림신청, 전환율 등 정량 데이터가 명확히 기록됨"

attribution_share:
  value: 0.7
  reasoning: "디렉터 외부 파트너 기여 약 30% 차감"

# === 확장 필드 ===
impact_metric: "revenue"

learning_value:
  value: high
  reasoning: "4개 가설 반증, 8개 운영 원칙 도출, 9개 체크리스트 확정"

falsified_hypotheses:
  - hypothesis: "브랜드 스토리 중심 설득이 전환을 만든다"
    evidence: "알림신청 1739명 → 전환율 0.97%로 전환 실패"
  - hypothesis: "알림신청 수 = 구매 의지"
    evidence: "상위 1% 알림신청에도 결제 약 5명"
  - hypothesis: "고가 리워드만으로 구성해도 된다"
    evidence: "저가 진입 티어 없어 첫 결제 경험 불가"
  - hypothesis: "와디즈에서도 동일 설득 구조 작동"
    evidence: "플랫폼 특성(사회적 증거 중시) 고려 필요 확인"

confirmed_insights:
  - insight: "회복/다이어트 탈출 메시지는 관심 유발에 효과적"
    evidence: "알림신청 상위 1% 달성"
  - insight: "온라인 코칭은 큰 구매 저항 포인트"
    evidence: "고가 결정을 밀기엔 체험 리뷰 7건 부족"
  - insight: "전략은 내부가 소유해야 한다"
    evidence: "디렉터 디렉팅에 따른 순간 대응 → 전환 축 부재"

# === 판정 ===
realized_status:
  value: failed_but_high_signal
  reasoning: "normalized_delta 0.21 < 0.5, learning_value = high"

# === 요약 ===
summary: "매출 21% 달성으로 목표 미달이지만, 4개 가설 반증 + 8개 운영 원칙 도출로 전략적 학습 가치 높음"
```