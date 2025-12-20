# Evidence 필드 상세 가이드

이 문서는 회고 → Evidence 변환 시 각 필드의 판단 기준을 정의합니다.

---

## 필수 필드

### 1. normalized_delta (0.0 ~ 1.0)

**정의**: 목표 대비 실제 달성 비율

**계산 방법**:
```
normalized_delta = 실제값 / 목표값
```

**판단 기준**:

| 값 | 의미 | 예시 |
|----|------|------|
| 1.0 | 목표 100% 달성 또는 초과 | 목표 100명, 실제 120명 |
| 0.8 | 목표 80% 달성 | 목표 100명, 실제 80명 |
| 0.5 | 목표 50% 달성 | 목표 100명, 실제 50명 |
| 0.2 | 목표 20% 달성 | 목표 1200만, 실제 250만 |
| 0.0 | 완전 미달 | 목표 있었으나 달성 0 |

**목표가 없었던 경우**:
- 사후적으로 합리적 기대치 설정
- 예: "와디즈 평균 전환율 30% 기준으로 계산"

---

### 2. evidence_strength (strong | medium | weak)

**정의**: 증거의 신뢰도 및 인과관계 명확성

**판단 기준**:

| 값 | 승수 | 조건 |
|----|------|------|
| **strong** | ×1.0 | 정량 데이터가 명확하고, 인과관계가 분명함 |
| **medium** | ×0.7 | 정성적 증거가 있고, 합리적 추론이 가능함 |
| **weak** | ×0.4 | 간접 증거만 있고, 연관성이 약함 |

**strong 예시**:
- 매출 데이터가 정확히 기록됨
- A/B 테스트 결과가 있음
- 전환율이 명확히 측정됨

**medium 예시**:
- 사용자 피드백 기반 추론
- 정성 인터뷰 결과
- 패턴은 보이지만 통계적 유의성 부족

**weak 예시**:
- 외부 요인 영향이 큼 (코로나, 경쟁사 이슈 등)
- 데이터 수집 오류 가능성
- 단기간 관찰로 노이즈 많음

---

### 3. attribution_share (0.0 ~ 1.0)

**정의**: 결과에 대한 해당 프로젝트의 기여 비율

**판단 기준**:

| 값 | 의미 |
|----|------|
| 1.0 | 결과가 100% 이 프로젝트에 기인 |
| 0.7 | 외부 요인 30% 존재 (파트너, 시장 등) |
| 0.5 | 다른 프로젝트와 공동 기여 |
| 0.3 | 이 프로젝트 기여가 작음 |

**감점 요인**:
- 외부 디렉터/파트너 기여 → -10~30%
- 시장 환경 변화 영향 → -10~20%
- 다른 프로젝트와 시너지 → 분할 계산

**와디즈 예시**:
```
전체 결과 = 소식연구소(70%) + 디렉터(30%)
→ attribution_share = 0.7
```

---

## 확장 필드

### 4. impact_metric

**정의**: 측정 기준이 된 핵심 지표

**일반적 값**:
- `revenue` - 매출
- `conversion_rate` - 전환율
- `user_count` - 사용자 수
- `pattern_count` - 패턴 발견 수
- `retention` - 리텐션
- `nps` - 순추천지수

---

### 5. learning_value (high | medium | low)

**정의**: 실패해도 배운 것이 있는가? (정보 엔트로피 감소량)

**판단 기준**:

| 값 | 조건 | 질문 |
|----|------|------|
| **high** | 전략 변경 근거 명확 | "다음에 뭘 하면 안 되는지 알게 됐나?" |
| **medium** | 일부 가설만 검증 | "추가 실험이 필요한가?" |
| **low** | 노이즈가 많음 | "왜 이런 결과인지 설명 가능한가?" |

**high 판정 조건** (하나 이상 충족):
- [ ] 주요 가설이 명확히 반증됨
- [ ] 전략 옵션이 줄어듦
- [ ] 다음 의사결정이 쉬워짐
- [ ] 구체적인 운영 원칙이 도출됨

**와디즈 예시**:
```
- 반증된 가설 4개 ✓
- 운영 원칙 8개 도출 ✓
- 다음 펀딩 체크리스트 9개 ✓
→ learning_value = high
```

---

### 6. falsified_hypotheses (목록)

**정의**: 이 프로젝트로 반증된 가설들

**추출 방법**:
1. 회고의 "아쉬운 점" 섹션에서 추출
2. "~할 줄 알았는데 아니었다" 형식으로 변환
3. 명확한 반증만 포함 (추측 제외)

**형식**:
```yaml
falsified_hypotheses:
  - "가설 1: 원래 믿었던 것 → 실제로는 아니었음"
  - "가설 2: ..."
```

---

### 7. confirmed_insights (목록)

**정의**: 이 프로젝트로 확인된 인사이트들

**추출 방법**:
1. 회고의 "핵심 인사이트" 섹션에서 추출
2. 다음 액션에 영향을 주는 것만 포함
3. 일반론 제외, 구체적 학습만 포함

**형식**:
```yaml
confirmed_insights:
  - "인사이트 1: 구체적 학습 내용"
  - "인사이트 2: ..."
```

---

## 판정 필드

### 8. realized_status

**정의**: 프로젝트 결과의 최종 판정

**판정 로직**:

```python
def determine_status(normalized_delta, learning_value, attribution_share):
    if attribution_share < 0.3:
        return "inconclusive"  # 기여도 너무 낮음

    if normalized_delta >= 0.8:
        return "succeeded"  # 목표 달성

    if normalized_delta < 0.5:
        if learning_value == "high":
            return "failed_but_high_signal"  # 실패했지만 학습 성공
        else:
            return "failed_low_signal"  # 실패 + 학습도 부족

    return "completed"  # 중간 달성
```

**상태별 의미**:

| 상태 | outcome_type | 의미 |
|------|-------------|------|
| `succeeded` | success | 목표 달성 + 가설 검증 |
| `failed_but_high_signal` | learning_success | 목표 미달 + 전략 학습 |
| `failed_low_signal` | failure | 목표 미달 + 학습도 부족 |
| `inconclusive` | null | 판단 불가 |

---

## RealizedScore 계산

```
RealizedScore = normalized_delta × strength_mult × attribution_share
```

**예시 (와디즈)**:
```
= 0.21 × 1.0 × 0.7
= 0.147
```

**해석**:
- 점수 자체는 낮음 (0.147)
- 하지만 `learning_value: high` + `realized_status: failed_but_high_signal`
- → "전략적 가치가 있는 실패"로 기록됨