---
name: auto-fill-project-impact
description: Project의 Expected Impact (A) 필드를 LLM이 제안하고 사용자와 대화하며 합의합니다. 프로젝트 시작 시 전략적 베팅을 선언하는 단계입니다.
---

# Auto-fill Project Impact

Project의 Expected Impact 필드를 LLM이 제안하고, **사용자와 대화형으로 협상**하여 최종 값을 결정합니다.

## Overview

이 스킬은 프로젝트를 "시작하기로 결정"했을 때 실행합니다. LLM이 프로젝트 내용과 연결된 전략 컨텍스트를 분석하여 Impact 필드 값을 제안하고, **사용자가 납득할 때까지 대화를 통해 값을 조정**합니다.

**핵심 원칙:**
- LLM은 **상세한 판단 근거**와 함께 값을 제안 (한 줄 요약 금지)
- 사용자가 납득하지 못하면 **대화를 통해 값을 협상** (반복 가능)
- 사용자가 최종 "OK"할 때까지 **절대 저장하지 않음**
- OK되는 순간, 이 Project는 "전략적 베팅"이 됨

---

## API Integration (SSOT)

> **CRITICAL: API 우선 + Fallback 패턴**
>
> 이 스킬은 LOOP MCP API (`POST /api/autofill/expected-impact`)를 호출합니다.
> API 서버가 사용 가능할 때 API 호출, 불가능할 때만 로컬 LLM 호출.

### API Endpoint

```
POST /api/autofill/expected-impact
```

**Request Body:**
```json
{
    "project_id": "prj-NNN",
    "mode": "preview",
    "provider": "openai"
}
```

**mode 파라미터:**
| mode | 설명 |
|------|------|
| `preview` | LLM 제안값만 반환 (저장 안 함) - 사용자와 협상용 |
| `pending` | pending_reviews.json에 저장 (Dashboard 승인 대기) |
| `execute` | 엔티티에 바로 적용 |

**Response:**
```json
{
    "success": true,
    "entity_id": "prj-010",
    "mode": "preview",
    "suggested_fields": {
        "tier": "strategic",
        "impact_magnitude": "high",
        "confidence": 0.55,
        "contributes": [{"condition": "cond-d", "weight": 0.6}]
    },
    "calculated_fields": {
        "expected_score": 5.5
    },
    "reasoning": {
        "tier": "Track 연결 분석...",
        "impact_magnitude": "Condition 기여도...",
        "confidence": "불확실성 요인..."
    },
    "validation_warnings": []
}
```

### API-First Pattern

```bash
# 환경 변수 (NAS URL 기본값)
API_URL="${LOOP_API_URL:-https://mcp.sosilab.synology.me}"
: "${LOOP_API_TOKEN:?LOOP_API_TOKEN is required}"

# Health check (pipefail로 curl 실패 감지)
set -o pipefail
if curl -fsS --max-time 5 "$API_URL/health" 2>/dev/null | jq -e '.status == "healthy"' > /dev/null; then
    # API 호출 (preview 모드)
    RESPONSE=$(curl -fsS -X POST "$API_URL/api/autofill/expected-impact" \
        -H "Authorization: Bearer $LOOP_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"project_id": "prj-010", "mode": "preview", "provider": "openai"}')

    if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
        # 제안값 추출하여 사용자에게 표시
        TIER=$(echo "$RESPONSE" | jq -r '.suggested_fields.tier')
        SCORE=$(echo "$RESPONSE" | jq -r '.calculated_fields.expected_score')
        REASONING=$(echo "$RESPONSE" | jq -r '.reasoning')
        # → Step 4 협상 루프 진행
    fi
else
    # Fallback: 로컬 LLM 호출 (기존 방식)
    echo "⚠️ API unavailable, using local LLM"
fi
set +o pipefail
```

---

## When to Use

이 스킬은 다음 상황에서 사용합니다:
- 새로 생성한 Project를 실제로 시작하기로 결정했을 때
- `/auto-fill-project-impact` 명령 실행 시
- 사용자가 "이 프로젝트 Impact 채워줘" 요청 시

**워크플로우 위치**: [[TEAM_WORKFLOW]] 2단계 (전략 베팅 선언)

## Workflow

```
[1. 프로젝트 확인]
├── Project 문서 읽기 (frontmatter + 본문)
├── 이미 Impact 필드가 있는지 확인
└── 없거나 덮어쓰기 확인

[2. 컨텍스트 수집]
├── 연결된 Track/Hypothesis 읽기 (parent_id)
├── 관련 Condition 읽기
└── NorthStar/MH 요약

[3. Impact 필드 제안 + 상세 근거] ← LLM
├── tier 판단 + 상세 근거
├── impact_magnitude 제안 + 상세 근거
├── confidence 제안 + 상세 근거
└── contributes 구조 제안 + 상세 근거

[4. 대화형 협상 루프] ← 핵심 변경
│
│   ┌─────────────────────────────────────────┐
│   │  LLM: 필드별 상세 근거 제시             │
│   │       (Track/Condition/비전 연결)        │
│   │       (왜 다른 값이 아닌지 설명)         │
│   └─────────────────────────────────────────┘
│                      ↓
│   ┌─────────────────────────────────────────┐
│   │  사용자 반응:                           │
│   │  - "OK" → Step 5로 이동                 │
│   │  - "왜 X인가?" → LLM 재설명             │
│   │  - "Y로 바꿔" → 값 수정 + 근거 재설명   │
│   │  - "취소" → 중단                        │
│   └─────────────────────────────────────────┘
│                      ↓
│            (납득할 때까지 반복)
│
└── 사용자 최종 "OK" 시에만 다음 단계로

[5. 저장] ← 사용자 OK 후에만 실행
├── Project 파일 업데이트
└── build_impact.py 실행 (선택)
```

## Step-by-Step Execution

### Step 1: 프로젝트 확인

**1.1 Project 찾기**

사용자가 Project를 지정하지 않은 경우:
- 컨텍스트에서 Project 내용 확인
- 최근 생성된 Project 목록 제시

```
1. 어떤 프로젝트의 Impact를 채울까요?
   - prj-010 (와디즈 펀딩)
   - prj-011 (CoachOS Phase2)
   - 직접 입력
```

**1.2 Project 문서 읽기**

- `50_Projects/P{num}_{name}/Project_정의.md` 읽기
- Frontmatter에서 기존 Impact 필드 확인
- 본문에서 프로젝트 목표/범위 파악

**1.3 기존 필드 확인**

이미 Impact 필드가 있는 경우:
```
이 프로젝트에는 이미 Impact 필드가 있습니다:
- tier: strategic
- impact_magnitude: high
- confidence: 0.7

덮어쓸까요? [Y/n]
```

### Step 2: 컨텍스트 수집

**2.1 상위 연결 읽기**

1. Project의 `parent_id`에서 Track/Hypothesis 확인
2. Track 문서 읽기 (`20_Strategy/12M_Tracks/`)
3. Track이 연결된 Condition 확인

**2.2 전략 컨텍스트 요약**

수집할 정보:
- Track 목표 및 성공 조건
- Condition의 핵심 지표
- 관련 MH (Meta Hypothesis)

### Step 3: Impact 필드 제안 (API 우선)

> **API 호출 우선, 실패 시 로컬 LLM 호출**

**Step 3a: API 호출**
```bash
API_URL="${LOOP_API_URL:-http://localhost:8081}"

# API 사용 가능 여부 확인
if curl -s --max-time 5 "$API_URL/health" | jq -e '.status == "healthy"' > /dev/null 2>&1; then
    # preview 모드로 제안값만 가져오기
    RESPONSE=$(curl -s -X POST "$API_URL/api/autofill/expected-impact" \
        -H "Authorization: Bearer $LOOP_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"project_id\": \"$PROJECT_ID\", \"mode\": \"preview\", \"provider\": \"openai\"}")

    if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
        # API 응답에서 제안값 추출
        SUGGESTED=$(echo "$RESPONSE" | jq '.suggested_fields')
        CALCULATED=$(echo "$RESPONSE" | jq '.calculated_fields')
        REASONING=$(echo "$RESPONSE" | jq '.reasoning')
        # → Step 4 협상 루프로 진행
    else
        ERROR=$(echo "$RESPONSE" | jq -r '.error')
        echo "⚠️ API error: $ERROR, falling back to local LLM"
        # → Step 3b로 이동
    fi
else
    echo "⚠️ API unavailable, using local LLM"
    # → Step 3b로 이동
fi
```

**Step 3b: Fallback - 로컬 LLM 호출**

API 사용 불가 시 기존 방식으로 로컬 LLM 프롬프트 실행:

`prompts/suggest_impact.md` 프롬프트를 사용하여:

**입력:**
- Project 문서 전문
- Track/Condition 요약
- 유사 프로젝트 예시 (있는 경우)

**출력 (상세 근거 필수):**

```markdown
## tier: `strategic`

### 왜 strategic인가?

**1. Track 연결 분석**
- 이 프로젝트는 trk-4 (Product)에 속함
- Track 4의 목표: "코칭 상품의 시장성 검증"
- 본 프로젝트는 Track 목표에 **직접 기여** (상품 출시 및 판매)

**2. Condition 기여도**
- **cond-d (런웨이 확보)**: 펀딩 성공 시 자금 유입 → 직접 기여
- **cond-b (데이터 수집)**: 코칭 참여자 데이터 확보 가능 → 간접 기여

**3. 비전 연결**
- 10년 비전: "Inner Loop OS가 글로벌 표준이 되는 것"
- 본 프로젝트: B2C 채널(와디즈)을 통한 첫 시장 검증
- 비전 실현의 **필수 전제조건** 검증

**왜 다른 값이 아닌가?**
- `tactical`이 아닌 이유: 기존 검증된 채널 확장이 아니라 **신규 채널 개척**
- `operational`이 아닌 이유: 단순 운영/유지가 아니라 **전략적 실험**

---

## impact_magnitude: `high`

### 왜 high인가?

**1. Condition 직접 영향도**
- cond-d: 목표 펀딩액 달성 시 런웨이 N개월 확보 (직접적 큰 영향)
- cond-b: 참여자 50명 시 데이터 밀도 기준 충족 가능

**2. 실패 시 영향**
- 펀딩 실패 시: 와디즈 채널 유효성 falsify → 전략 재검토 필요
- 성공/실패 모두 **중요한 전략적 신호**

**왜 다른 값이 아닌가?**
- `mid`가 아닌 이유: Condition에 간접 기여가 아니라 **직접 기여**
- `low`가 아닌 이유: 작은 영향이 아니라 **전략 방향 결정에 영향**

---

## confidence: `0.55`

### 왜 0.55인가?

**1. 긍정 요인 (+)**
- 와디즈 플랫폼 자체는 검증된 채널
- 습관/건강 카테고리 펀딩 성공 사례 다수 존재
- 팀 내 콘텐츠 제작 역량 보유

**2. 불확실성 요인 (-)**
- 첫 펀딩 시도 (학습 곡선 존재)
- 12주 코칭 상품의 가격대 검증 필요
- 경쟁 상품 대비 차별점 커뮤니케이션 미검증

**3. 종합 판단**
- 0.5 (반반) 보다는 약간 높음: 기본 역량은 있음
- 0.7 이상은 아님: 첫 시도의 불확실성 존재

---

## contributes

| Condition | Weight | 근거 |
|-----------|--------|------|
| cond-d | 0.6 | 펀딩 성공 시 런웨이 직접 확보 |
| cond-b | 0.3 | 코칭 참여자 데이터 수집 가능 |
```

### Step 4: 대화형 협상 루프

**중요: 사용자가 "OK"라고 명시적으로 말할 때까지 저장하지 않음**

**4.1 초기 제안 표시**

위 Step 3의 상세 근거를 **전체 출력**합니다. 요약하지 않습니다.

```
## Impact 제안

**Project**: prj-010 (와디즈 펀딩)

[Step 3의 상세 근거 전체 출력]

---

### 계산될 ExpectedScore

| 항목 | 값 | 점수 |
|------|-----|------|
| tier | strategic | base 10 |
| impact_magnitude | high | ×1.0 |
| confidence | 0.55 | ×0.55 |
| **ExpectedScore** | | **5.5** |

---

위 값들에 대해 질문이나 수정 요청이 있으시면 말씀해주세요.
납득하셨다면 "OK"라고 입력해주세요.
```

**4.2 사용자 반응 처리**

| 사용자 입력 | LLM 행동 |
|-------------|----------|
| "OK" / "확인" / "저장해" | → Step 5로 이동 (저장) |
| "왜 tier가 strategic이야?" | → tier 근거 재설명 (더 상세하게) |
| "confidence 0.4로 바꿔" | → 값 수정 + 수정된 이유 설명 + 새 ExpectedScore 표시 |
| "cond-b 기여도가 너무 높은 것 같아" | → contributes 수정 + 근거 재설명 |
| "취소" / "그만" | → 저장 없이 종료 |

**4.3 값 수정 시 재확인**

사용자가 값 수정을 요청하면:

```
## confidence 수정: 0.55 → 0.4

### 수정 반영

**변경 이유 (사용자 요청):**
- 첫 펀딩 시도의 불확실성을 더 크게 반영

**수정된 ExpectedScore:**
- 이전: 10 × 0.55 = 5.5
- 변경: 10 × 0.4 = **4.0**

---

다른 수정 사항이 있으시면 말씀해주세요.
납득하셨다면 "OK"라고 입력해주세요.
```

**4.4 협상 원칙**

- LLM은 사용자 의견을 존중하되, 전략적 일관성이 깨지면 **정중하게 재고 요청**
- 예: "confidence를 0.9로 올리면 첫 시도 리스크가 반영되지 않는데, 0.7 정도는 어떨까요?"
- 최종 결정권은 항상 사용자에게 있음

### Step 5: 저장 (사용자 OK 후에만)

> **API 호출 우선, 실패 시 로컬 파일 수정**

**5.1 최종 확인 메시지**

```
사용자가 "OK"를 입력했습니다. 저장을 진행합니다.
```

**5.2a API로 저장 (execute 모드)**

```bash
API_URL="${LOOP_API_URL:-http://localhost:8081}"

if curl -s --max-time 5 "$API_URL/health" | jq -e '.status == "healthy"' > /dev/null 2>&1; then
    # execute 모드로 바로 적용
    RESPONSE=$(curl -s -X POST "$API_URL/api/autofill/expected-impact" \
        -H "Authorization: Bearer $LOOP_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"project_id\": \"$PROJECT_ID\",
            \"mode\": \"execute\",
            \"provider\": \"openai\"
        }")

    if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
        SCORE=$(echo "$RESPONSE" | jq -r '.calculated_fields.expected_score')
        echo "✅ Expected Impact saved via API"
        echo "📊 Expected Score: $SCORE"
        # → 완료
    else
        echo "⚠️ API save failed, falling back to local"
        # → Step 5.2b로 이동
    fi
else
    # → Step 5.2b로 이동
fi
```

**5.2b Fallback - 로컬 파일 수정**

API 사용 불가 시 Edit 도구를 사용하여 frontmatter에 필드 추가:

```yaml
# 기존 frontmatter에 추가
tier: strategic
impact_magnitude: high
confidence: 0.55
contributes:
  - to: "cond-d"
    weight: 0.6
    description: "펀딩 성공 시 런웨이 직접 확보"
  - to: "cond-b"
    weight: 0.3
    description: "코칭 참여자 데이터 수집 가능"
```

**5.3 저장 완료 메시지**

```
## 저장 완료

**Project**: prj-010 (와디즈 펀딩)
**파일**: 50_Projects/P010_Wadiz_Funding/Project_정의.md

### 최종 Impact 값
| 필드 | 값 |
|------|-----|
| tier | strategic |
| impact_magnitude | high |
| confidence | 0.55 |
| **ExpectedScore** | **5.5** |

이 프로젝트는 이제 "전략적 베팅"으로 기록되었습니다.
```

## Impact 필드 정의

### tier (필수)

| 값 | 설명 | 예시 |
|----|------|------|
| `strategic` | 비전/전략에 직접 기여 | 신규 시장 진출, 핵심 제품 출시 |
| `enabling` | 전략 실행 가속 | 인프라 구축, 팀 채용 |
| `operational` | 일상 운영 유지 | 유지보수, 정기 업데이트 |

### impact_magnitude (필수)

| 값 | magnitude_points | 설명 |
|----|------------------|------|
| `high` | strategic:10, enabling:5, operational:2 | 핵심 지표에 직접적 큰 영향 |
| `mid` | strategic:6, enabling:3, operational:1 | 중간 수준 영향 |
| `low` | strategic:3, enabling:1.5, operational:0.5 | 간접적/작은 영향 |

### confidence (필수)

| 범위 | 설명 |
|------|------|
| 0.8-1.0 | 실행 계획 명확, 리스크 낮음 |
| 0.5-0.7 | 불확실성 있지만 관리 가능 |
| 0.3-0.5 | 리스크 높거나 실험적 |

### contributes (권장)

```yaml
contributes:
  - condition: "cond-a"    # 연결된 Condition ID
    weight: 0.3            # 기여 비율 (0.0-1.0)
    description: "..."     # 기여 설명
```

## ExpectedScore 계산 공식

```
ExpectedScore = magnitude_points[tier][magnitude] × confidence
```

**예시:**
```
tier: strategic, magnitude: high, confidence: 0.6
= 10 × 0.6 = 6.0
```

## Example Usage

### 사용자 요청
```
/auto-fill-project-impact
```

### 전체 흐름 예시 (대화형 협상)

```
사용자: 와디즈 펀딩 프로젝트 Impact 채워줘

Claude: 프로젝트를 확인했습니다.
        → prj-010 (와디즈 펀딩)
        → parent: trk-6 (Track 6: 조직/재무)

        [컨텍스트 수집 중...]

        ---

        ## tier: `strategic`

        ### 왜 strategic인가?

        **1. Track 연결 분석**
        - 이 프로젝트는 trk-6 (조직/재무)에 속함
        - Track 6의 목표: "지속 가능한 재무 구조 확보"
        - 본 프로젝트는 Track 목표에 직접 기여 (자금 조달)

        **2. Condition 기여도**
        - cond-e (런웨이 확보): 펀딩 성공 시 자금 유입 → 직접 기여

        **3. 비전 연결**
        - 펀딩을 통한 시장 검증 + 자금 확보
        - B2C 채널 개척의 첫 실험

        **왜 다른 값이 아닌가?**
        - tactical이 아닌 이유: 검증된 채널 확장이 아닌 신규 채널
        - operational이 아닌 이유: 단순 운영이 아닌 전략적 실험

        ---

        ## impact_magnitude: `high`
        [상세 근거...]

        ---

        ## confidence: `0.55`
        [상세 근거...]

        ---

        ### 계산될 ExpectedScore
        | 항목 | 값 |
        |------|-----|
        | tier | strategic (base 10) |
        | impact_magnitude | high (×1.0) |
        | confidence | 0.55 |
        | **ExpectedScore** | **5.5** |

        위 값들에 대해 질문이나 수정 요청이 있으시면 말씀해주세요.
        납득하셨다면 "OK"라고 입력해주세요.

---

사용자: 왜 confidence가 0.55야? 좀 높은 것 같은데

Claude: confidence 0.55 판단 근거를 다시 설명드리겠습니다.

        **긍정 요인 (+):**
        - 와디즈 플랫폼 자체는 검증된 크라우드펀딩 채널
        - 건강/습관 카테고리 펀딩 성공 사례 다수
        - 팀 내 콘텐츠 제작 역량 존재

        **불확실성 요인 (-):**
        - 첫 펀딩 시도 (학습 곡선)
        - 12주 코칭 상품 가격대 미검증
        - 경쟁 상품 대비 차별점 커뮤니케이션 미검증

        만약 0.4~0.45 정도로 낮추시겠다면, "첫 시도 리스크를 더 크게 반영"하는
        것으로 이해하겠습니다. 어떤 값이 적절할까요?

---

사용자: 0.4로 바꿔

Claude: ## confidence 수정: 0.55 → 0.4

        **변경 이유:**
        - 첫 펀딩 시도의 불확실성을 더 크게 반영

        **수정된 ExpectedScore:**
        - 이전: 10 × 0.55 = 5.5
        - 변경: 10 × 0.4 = **4.0**

        ---

        다른 수정 사항이 있으시면 말씀해주세요.
        납득하셨다면 "OK"라고 입력해주세요.

---

사용자: OK

Claude: 저장을 진행합니다.

        ## 저장 완료

        **Project**: prj-010 (와디즈 펀딩)
        **파일**: 50_Projects/P010_.../Project_정의.md

        ### 최종 Impact 값
        | 필드 | 값 |
        |------|-----|
        | tier | strategic |
        | impact_magnitude | high |
        | confidence | 0.4 |
        | **ExpectedScore** | **4.0** |

        이 프로젝트는 이제 "전략적 베팅"으로 기록되었습니다.
```

## Resources

### references/
- `impact_fields.md` - Impact 필드 상세 설명 및 판단 기준

### prompts/
- `suggest_impact.md` - Impact 필드 제안용 LLM 프롬프트

## Related Files

- `impact_model_config.yml` - 점수 계산 설정
- `00_Meta/_TEMPLATES/template_project.md` - Project 템플릿
- `scripts/build_impact.py` - Expected Score 계산 스크립트