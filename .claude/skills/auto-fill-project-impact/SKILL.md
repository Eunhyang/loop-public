---
name: auto-fill-project-impact
description: Project의 Expected Impact (A) 필드를 LLM이 제안하고 사용자 확인 후 채웁니다. 프로젝트 시작 시 전략적 베팅을 선언하는 단계입니다.
---

# Auto-fill Project Impact

Project의 Expected Impact 필드를 LLM이 제안합니다.

## Overview

이 스킬은 프로젝트를 "시작하기로 결정"했을 때 실행합니다. LLM이 프로젝트 내용과 연결된 전략 컨텍스트를 분석하여 Impact 필드 값을 제안하고, 사용자가 확인 후 수락하면 Project frontmatter를 업데이트합니다.

**핵심 원칙:**
- LLM은 판단 재료만 제안, 점수 계산은 코드가 수행
- 사용자는 반드시 Preview → Accept 단계를 거침
- Accept되는 순간, 이 Project는 "전략적 베팅"이 됨

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

[3. Impact 필드 제안] ← LLM
├── tier 판단 (strategic/enabling/operational)
├── impact_magnitude 제안 (high/mid/low)
├── confidence 제안 (0.0-1.0)
└── contributes 구조 제안

[4. Preview 표시]
├── 제안된 필드 값 표시
├── 계산될 ExpectedScore 표시
└── 판단 근거 표시

[5. 사용자 확인]
├── Accept → Project frontmatter 업데이트
├── Edit → 필드 수정 후 재확인
└── Cancel → 중단

[6. 저장 및 빌드]
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
   - prj:010 (와디즈 펀딩)
   - prj:011 (CoachOS Phase2)
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

### Step 3: Impact 필드 제안

**LLM 프롬프트 실행**

`prompts/suggest_impact.md` 프롬프트를 사용하여:

**입력:**
- Project 문서 전문
- Track/Condition 요약
- 유사 프로젝트 예시 (있는 경우)

**출력:**
```yaml
tier:
  value: strategic
  reasoning: "신규 시장 검증으로 비전에 직접 기여"

impact_magnitude:
  value: high
  reasoning: "Condition B 검증에 핵심 역할"

confidence:
  value: 0.6
  reasoning: "첫 펀딩 시도로 불확실성 존재"

contributes:
  - condition: "cond:b"
    weight: 0.4
    description: "패턴 발견 기여"
```

### Step 4: Preview 표시

```
## Impact Preview

**Project**: prj:010 (와디즈 펀딩)

### Expected Score 계산
- tier: strategic (magnitude_points: 10/6/3)
- impact_magnitude: high (10점)
- confidence: 0.6

**ExpectedScore = 10 × 0.6 = 6.0**

### 전략 연결
contributes:
  - cond:b (Loop Dataset) - 40%

### 판단 근거
- tier: 신규 시장 검증으로 비전에 직접 기여
- magnitude: Condition B 검증에 핵심 역할
- confidence: 첫 펀딩 시도로 불확실성 존재

---
[Accept] [Edit] [Cancel]
```

### Step 5: 사용자 확인

AskUserQuestion 도구를 사용하여 확인:

```yaml
question: "Impact Preview를 확인했습니다. 어떻게 하시겠습니까?"
options:
  - label: "Accept"
    description: "이대로 Project frontmatter를 업데이트합니다"
  - label: "Edit"
    description: "필드 값을 수정합니다"
  - label: "Cancel"
    description: "채우기를 취소합니다"
```

**Edit 선택 시:**
```yaml
question: "어떤 필드를 수정할까요?"
options:
  - label: "tier"
    description: "현재: strategic"
  - label: "impact_magnitude"
    description: "현재: high"
  - label: "confidence"
    description: "현재: 0.6"
  - label: "contributes"
    description: "연결된 Condition 수정"
```

### Step 6: 저장 및 빌드

**6.1 Project Frontmatter 업데이트**

Edit 도구를 사용하여 frontmatter에 필드 추가:

```yaml
# 기존 frontmatter에 추가
tier: strategic
impact_magnitude: high
confidence: 0.6
contributes:
  - condition: "cond:b"
    weight: 0.4
    description: "패턴 발견 기여"
```

**6.2 build_impact.py 실행 여부 확인**

```
Impact 필드를 업데이트했습니다.
→ 50_Projects/P010_Wadiz_Funding/Project_정의.md

build_impact.py를 실행할까요? [Y/n]
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
  - condition: "cond:a"    # 연결된 Condition ID
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

### 전체 흐름 예시

```
사용자: 와디즈 펀딩 프로젝트 Impact 채워줘

Claude: 프로젝트를 확인했습니다.
        → prj:010 (와디즈 펀딩)
        → parent: trk:5 (Track 5: 유통)

        [컨텍스트 수집 중...]

        ## Impact Preview

        **ExpectedScore = 6.0**
        - tier: strategic
        - impact_magnitude: high
        - confidence: 0.6

        **판단 근거:**
        - 신규 채널 검증으로 전략적 가치 높음
        - 첫 펀딩 시도로 불확실성 존재

        [Accept] [Edit] [Cancel]

사용자: confidence를 0.5로 낮춰줘

Claude: confidence를 0.5로 수정했습니다.
        **ExpectedScore = 5.0** (10 × 0.5)

        [Accept] [Edit] [Cancel]

사용자: Accept

Claude: Project frontmatter를 업데이트했습니다.
        → 50_Projects/P010_Wadiz_Funding/Project_정의.md

        **ExpectedScore: 5.0**

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