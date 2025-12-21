# Impact 필드 상세 가이드

이 문서는 Project Impact 필드의 판단 기준을 정의합니다.

---

## 필수 필드

### 1. tier (strategic | enabling | operational)

**정의**: 프로젝트가 전략에서 차지하는 위치

**판단 기준:**

| 값 | 조건 | 예시 |
|----|------|------|
| **strategic** | 비전/전략에 직접 기여 | 신규 시장 진출, 핵심 제품 출시, 전략적 파트너십 |
| **enabling** | 전략 실행을 가속 | 인프라 구축, 팀 채용, 프로세스 개선 |
| **operational** | 일상 운영 유지 | 유지보수, 정기 업데이트, 운영 지원 |

**판단 질문:**
1. "이 프로젝트가 성공하면 3년 Condition이 달성되는가?" → strategic
2. "이 프로젝트가 성공하면 다른 프로젝트가 빨라지는가?" → enabling
3. "이 프로젝트가 없으면 운영이 멈추는가?" → operational

**Tier 정책:**
- `strategic`, `enabling`: Impact 계산에 포함
- `operational`: Impact 계산에서 제외 (일상 운영이므로)

---

### 2. impact_magnitude (high | mid | low)

**정의**: 프로젝트가 핵심 지표에 미치는 영향 크기

**magnitude_points 테이블:**

| tier | high | mid | low |
|------|------|-----|-----|
| strategic | 10 | 6 | 3 |
| enabling | 5 | 3 | 1.5 |
| operational | 2 | 1 | 0.5 |

**판단 기준:**

| 값 | 조건 | 임계값 |
|----|------|--------|
| **high** | 핵심 지표에 직접적이고 큰 영향 | 목표 달성의 30% 이상 기여 |
| **mid** | 지표에 중간 수준의 영향 | 목표 달성의 10-30% 기여 |
| **low** | 지표에 간접적이거나 작은 영향 | 목표 달성의 10% 미만 기여 |

**판단 질문:**
1. "이 프로젝트가 Condition 달성에 얼마나 기여하는가?"
2. "이 프로젝트 없이도 Condition이 달성 가능한가?"

---

### 3. confidence (0.0 ~ 1.0)

**정의**: 프로젝트가 예상대로 실행될 가능성

**판단 기준:**

| 범위 | 의미 | 조건 |
|------|------|------|
| 0.8 - 1.0 | 높음 | 실행 계획이 명확하고 리스크가 낮음 |
| 0.5 - 0.7 | 보통 | 불확실성이 있지만 관리 가능 |
| 0.3 - 0.5 | 낮음 | 리스크가 높거나 실험적 |
| 0.0 - 0.3 | 매우 낮음 | 성공 가능성이 불확실함 |

**confidence 감점 요인:**
- 첫 시도 / 경험 없음 → -0.1 ~ -0.2
- 외부 의존성 높음 → -0.1 ~ -0.2
- 일정이 촉박함 → -0.1
- 팀 리소스 부족 → -0.1 ~ -0.2
- 기술적 불확실성 → -0.1 ~ -0.2

**confidence 가점 요인:**
- 유사 프로젝트 성공 경험 → +0.1
- 명확한 마일스톤 → +0.1
- 충분한 리소스 → +0.1

---

## 권장 필드

### 4. contributes (배열)

**정의**: 이 프로젝트가 기여하는 Condition 목록

**형식:**
```yaml
contributes:
  - condition: "cond-a"
    weight: 0.3
    description: "패턴 10개 발견 중 3개 기여 예상"
  - condition: "cond-b"
    weight: 0.2
    description: "데이터셋 구축 일부 기여"
```

**규칙:**
- `weight` 합계는 최대 1.0
- 1개 이상, 5개 이하 권장
- `description`은 구체적 기여 내용 명시

**Condition 목록:**
- `cond-a` - Condition A
- `cond-b` - Condition B (Loop Dataset)
- `cond-c` - Condition C
- `cond-d` - Condition D
- `cond-e` - Condition E

---

## ExpectedScore 계산

```
ExpectedScore = magnitude_points[tier][magnitude] × confidence
```

### 계산 예시

**예시 1: 고신뢰 전략 프로젝트**
```
tier: strategic
magnitude: high → 10점
confidence: 0.8

ExpectedScore = 10 × 0.8 = 8.0
```

**예시 2: 실험적 전략 프로젝트**
```
tier: strategic
magnitude: high → 10점
confidence: 0.5

ExpectedScore = 10 × 0.5 = 5.0
```

**예시 3: 인프라 프로젝트**
```
tier: enabling
magnitude: mid → 3점
confidence: 0.7

ExpectedScore = 3 × 0.7 = 2.1
```

---

## 유사 프로젝트 참조

과거 프로젝트의 Impact 설정을 참조하면 일관성 유지에 도움됩니다.

**참조 방법:**
1. 같은 Track의 이전 프로젝트 확인
2. 비슷한 규모/목표의 프로젝트 확인
3. 성공/실패 프로젝트의 초기 confidence 비교

---

## 주의사항

### ❌ 하지 말 것
1. **모든 프로젝트를 strategic으로 설정** → tier 구분이 무의미해짐
2. **confidence를 항상 높게 설정** → 낙관적 편향
3. **contributes 없이 설정** → 전략 연결이 불명확

### ✅ 권장 사항
1. **솔직한 confidence 설정** → 첫 시도면 0.5 이하
2. **구체적 contributes 작성** → 기여 내용 명시
3. **Realized 결과와 비교** → 예측 정확도 개선