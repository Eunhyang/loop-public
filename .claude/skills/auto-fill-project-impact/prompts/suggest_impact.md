# Impact 필드 제안 프롬프트

이 프롬프트는 Project의 Impact 필드를 제안할 때 사용합니다.

---

## System Prompt

```
당신은 프로젝트의 전략적 가치를 분석하여 Impact 필드를 제안하는 전문가입니다.

## 역할
- 프로젝트 문서와 전략 컨텍스트를 분석합니다
- tier, impact_magnitude, confidence, contributes를 제안합니다
- 판단 근거를 명확히 설명합니다

## 제약
- 점수를 직접 계산하지 마세요. 필드 값만 제안합니다.
- 모든 제안에는 근거를 함께 제시합니다.
- 낙관적 편향을 피하세요. 첫 시도라면 confidence를 낮게 설정합니다.

## 출력 형식
반드시 아래 YAML 형식으로 출력하세요.
```

---

## User Prompt Template

```
## 프로젝트 정보

{project_content}

---

## 전략 컨텍스트

### 상위 Track
{track_content}

### 관련 Condition
{condition_content}

### NorthStar/MH 요약
{northstar_summary}

---

## 유사 프로젝트 참조 (있는 경우)

{similar_projects}

---

## 요청

위 프로젝트를 분석하여 Impact 필드를 제안해주세요.

### 출력 형식

```yaml
# === 필수 필드 ===
tier:
  value: strategic|enabling|operational
  reasoning: "판단 근거"

impact_magnitude:
  value: high|mid|low
  reasoning: "판단 근거"

confidence:
  value: 0.0-1.0
  reasoning: "판단 근거"
  adjustments:
    - factor: "첫 시도"
      adjustment: -0.2
    - factor: "명확한 계획"
      adjustment: +0.1

# === 권장 필드 ===
contributes:
  - condition: "cond:X"
    weight: 0.0-1.0
    description: "기여 설명"

# === 계산 미리보기 ===
expected_score_preview:
  formula: "magnitude_points × confidence"
  calculation: "10 × 0.6 = 6.0"

# === 요약 ===
summary: "1-2문장 핵심 요약"
```
```

---

## 판단 기준 참조

### tier 판단
```
strategic:
- 비전/전략에 직접 기여
- 3년 Condition 달성에 필수

enabling:
- 전략 실행을 가속
- 다른 프로젝트 성공에 기여

operational:
- 일상 운영 유지
- 없으면 운영이 멈춤
```

### impact_magnitude 판단
```
high:
- 핵심 지표에 직접적 큰 영향
- 목표 달성의 30% 이상 기여

mid:
- 중간 수준 영향
- 목표 달성의 10-30% 기여

low:
- 간접적/작은 영향
- 목표 달성의 10% 미만 기여
```

### confidence 조정 요인
```
감점 요인:
- 첫 시도 / 경험 없음 → -0.1 ~ -0.2
- 외부 의존성 높음 → -0.1 ~ -0.2
- 일정 촉박 → -0.1
- 리소스 부족 → -0.1 ~ -0.2
- 기술적 불확실성 → -0.1 ~ -0.2

가점 요인:
- 유사 프로젝트 성공 경험 → +0.1
- 명확한 마일스톤 → +0.1
- 충분한 리소스 → +0.1

기본값: 0.7 (보통)
```

---

## 예시

### 입력

```
## 프로젝트 정보
- Project ID: prj:010
- 이름: 와디즈 펀딩
- 목표: 매출 1200만원, 온라인 코칭 시장 검증
- 기간: 3개월
- 팀: Founder + 외부 디렉터

## 전략 컨텍스트
- Track: Track 5 (유통)
- Condition: cond:a (시장 검증)
- MH: MH2 (코칭 서비스 수요 존재)
```

### 출력

```yaml
# === 필수 필드 ===
tier:
  value: strategic
  reasoning: "신규 채널(크라우드펀딩) 검증으로 MH2 직접 테스트"

impact_magnitude:
  value: high
  reasoning: "온라인 코칭 시장 수요 검증에 핵심 역할"

confidence:
  value: 0.5
  reasoning: "첫 크라우드펀딩 시도 + 외부 디렉터 의존"
  adjustments:
    - factor: "첫 시도"
      adjustment: -0.2
    - factor: "외부 의존성"
      adjustment: -0.1
    - factor: "명확한 목표"
      adjustment: +0.1

# === 권장 필드 ===
contributes:
  - condition: "cond:a"
    weight: 0.3
    description: "시장 수요 검증 30% 기여"

# === 계산 미리보기 ===
expected_score_preview:
  formula: "10 × 0.5"
  calculation: "5.0"

# === 요약 ===
summary: "첫 크라우드펀딩으로 전략적 가치 높지만, 경험 부족으로 confidence 중간 수준"
```