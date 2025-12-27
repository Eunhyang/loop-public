# Retrospective to Evidence Skill

회고 문서를 구조화된 Evidence 객체로 변환합니다.

## Overview

이 스킬은 자유 형식의 회고 문서를 Impact A/B 모델의 Realized Score 계산에 사용할 수 있는 구조화된 Evidence로 변환합니다.

**핵심 원칙:**
- LLM은 판단 재료만 제안, 점수 계산은 코드가 수행
- 사용자는 반드시 Preview → Accept 단계를 거침
- Evidence 템플릿 형식 강제

## When to Use

이 스킬은 다음 상황에서 사용합니다:
- 프로젝트 회고 문서 작성 후 Evidence로 변환할 때
- `/retro` 또는 `/retrospective-to-evidence` 명령 실행 시
- 사용자가 "회고를 Evidence로 변환해줘" 요청 시

## Workflow

```
[1. 입력 수집]
├── 회고 문서 경로 (또는 현재 열린 파일)
├── Project ID (prj-NNN)
└── 주요 지표 (목표 vs 실제)

[2. 회고 분석] ← LLM
├── 정량 데이터 추출
├── 반증된 가설 추출
├── 확인된 인사이트 추출
└── 학습 가치 판단

[3. Evidence 필드 매핑] ← LLM 제안
├── normalized_delta (목표 대비 달성률)
├── evidence_strength (증거 강도)
├── attribution_share (기여 비율)
├── learning_value (학습 가치)
└── realized_status (판정)

[4. Preview 표시]
├── 추출된 필드 값 표시
├── 계산된 RealizedScore 표시
└── 판정 근거 표시

[5. 사용자 확인]
├── Accept → Evidence 파일 생성
├── Edit → 필드 수정 후 재확인
└── Cancel → 중단

[6. 저장 및 빌드]
├── Evidence 파일 생성
└── build_impact.py 실행 (선택)
```

## Step-by-Step Execution

### Step 1: 입력 수집

사용자에게 다음 정보를 요청합니다:

```
1. 회고 문서는 어디에 있나요?
   - 현재 열린 파일 사용
   - 경로 직접 입력

2. 연결할 Project ID는 무엇인가요?
   - 예: prj-010

3. 핵심 지표와 결과는?
   - 예: 매출 목표 1200만원, 실제 250만원
```

### Step 2: 회고 분석

회고 문서를 읽고 다음을 추출합니다:

**정량 데이터:**
- 목표 값 (있는 경우)
- 실제 달성 값
- 달성률 계산

**정성 데이터:**
- 잘된 점 (What Worked)
- 아쉬운 점 (What Didn't Work)
- 원인 분석 (Why)
- 핵심 인사이트 (Learnings)

### Step 3: Evidence 필드 매핑

`references/evidence_fields.md` 참조하여 각 필드 값을 제안합니다.

**필수 필드:**
```yaml
normalized_delta: 0.0-1.0   # 목표 대비 달성률
evidence_strength: strong|medium|weak
attribution_share: 0.0-1.0  # 프로젝트 기여 비율
```

**v5.2 Window 필드 (자동 생성):**
```yaml
window_id: "YYYY-MM"              # 평가 윈도우 ID (자동 계산)
time_range: "YYYY-MM-DD..YYYY-MM-DD"  # 평가 기간 (자동 계산)
```

**확장 필드:**
```yaml
impact_metric: "revenue"    # 측정 지표
learning_value: high|medium|low
falsified_hypotheses: []    # 반증된 가설 목록
confirmed_insights: []      # 확인된 인사이트 목록
```

**판정 필드:**
```yaml
realized_status: succeeded|failed_but_high_signal|failed_low_signal|inconclusive
```

### Step 3.5: Window 자동 계산 (v5.2)

Evidence 생성 시 window 필드를 자동으로 계산합니다.

**base_date 결정 (우선순위):**
1. 사용자가 명시한 날짜 (있는 경우)
2. 회고 문서의 날짜 (frontmatter `date` 또는 파일명)
3. 오늘 날짜 (fallback)

**window_id 생성:**
- Evidence 기본 형식: `YYYY-MM` (월간)
- 예: base_date가 2025-12-27 → window_id = "2025-12"

**time_range 계산:**
- `YYYY-MM` → 해당 월의 첫날..마지막날
- 예: "2025-12" → "2025-12-01..2025-12-31"

**계산 로직 (Python):**
```python
from datetime import datetime
from calendar import monthrange

def calculate_window(base_date_str: str = None) -> dict:
    """base_date로부터 window_id, time_range 계산"""
    if base_date_str:
        base = datetime.strptime(base_date_str, "%Y-%m-%d")
    else:
        base = datetime.now()

    year = base.year
    month = base.month

    window_id = f"{year}-{month:02d}"

    # 월의 마지막 날 계산
    last_day = monthrange(year, month)[1]
    time_range = f"{year}-{month:02d}-01..{year}-{month:02d}-{last_day:02d}"

    return {
        "window_id": window_id,
        "time_range": time_range,
    }
```

**사용자 오버라이드:**
- window_id를 사용자가 직접 입력한 경우 그 값을 우선
- 분기(YYYY-QN) 또는 반기(YYYY-HN) 형식도 허용

### Step 4: Preview 표시

다음 형식으로 Preview를 표시합니다:

```
## Evidence Preview

**Project**: prj-010 (와디즈 펀딩)
**Evidence ID**: ev:2025-NNNN (자동 생성)

### Window 정보 (v5.2)
- window_id: 2025-12
- time_range: 2025-12-01..2025-12-31
- base_date: 2025-12-27 (회고 문서 기준)

### Realized Score 계산
- normalized_delta: 0.21 (매출 기준 21% 달성)
- evidence_strength: strong (정량 데이터 명확)
- attribution_share: 0.7 (외부 디렉터 30% 기여 제외)

**RealizedScore = 0.21 × 1.0 × 0.7 = 0.147**

### 학습 가치
- learning_value: high
- 반증된 가설: 4개
- 확인된 인사이트: 5개

### 판정
- realized_status: failed_but_high_signal
- 근거: 목표 미달이지만 전략 변경 근거 명확

---
[Accept] [Edit] [Cancel]
```

### Step 5: 사용자 확인

AskUserQuestion 도구를 사용하여 확인:

```yaml
question: "Evidence Preview를 확인했습니다. 어떻게 하시겠습니까?"
options-
  - label: "Accept"
    description: "이대로 Evidence 파일을 생성합니다"
  - label: "Edit"
    description: "필드 값을 수정합니다"
  - label: "Cancel"
    description: "변환을 취소합니다"
```

### Step 6: 저장 및 빌드

**Evidence 파일 생성 위치:**
```
50_Projects/{year}/{project_folder}/Evidence/ev_{id}_{name}.md
```

**파일 생성 후:**
1. Evidence 파일 저장
2. `python3 scripts/build_impact.py .` 실행 여부 확인
3. 결과 요약 출력

## Evidence ID 생성 규칙

```
형식: ev:YYYY-NNNN
예시: ev:2025-0001

자동 생성:
1. 현재 연도 확인
2. 기존 Evidence ID 스캔
3. 다음 번호 할당
```

## realized_status 판정 규칙

| 조건 | 판정 |
|------|------|
| normalized_delta ≥ 0.8 | `succeeded` |
| normalized_delta < 0.5 AND learning_value = high | `failed_but_high_signal` |
| normalized_delta < 0.5 AND learning_value = low | `failed_low_signal` |
| attribution_share < 0.3 | `inconclusive` |

## Example Usage

### 사용자 요청
```
/retro
```

### 스킬 응답
```
회고 → Evidence 변환을 시작합니다.

1. 회고 문서 경로를 알려주세요.
   (현재 열린 파일이 있다면 그것을 사용할 수도 있습니다)

2. 연결할 Project ID는 무엇인가요?

3. 핵심 성과 지표는 무엇이었나요?
   예: "매출 목표 1200만원, 실제 250만원"
```

### 전체 흐름 예시

```
사용자: /retro

Claude: 회고 → Evidence 변환을 시작합니다.
        회고 문서 경로와 Project ID를 알려주세요.

사용자: 와디즈 펀딩 회고.md, prj-010, 매출 목표 1200만 실제 250만

Claude: [회고 문서 분석 중...]

        ## Evidence Preview

        **RealizedScore = 0.147**
        - normalized_delta: 0.21
        - evidence_strength: strong
        - learning_value: high

        **판정: failed_but_high_signal**

        반증된 가설 4개, 인사이트 5개 추출됨.

        [Accept] [Edit] [Cancel]

사용자: Accept

Claude: Evidence 파일을 생성했습니다.
        → 50_Projects/2025/P010_.../Evidence/ev_2025-0001_와디즈_회고.md

        build_impact.py를 실행할까요? [Y/n]

사용자: Y

Claude: ✅ impact.json 업데이트 완료
        prj-010 RealizedScore: 0.147
```

## Resources

### references/
- `evidence_fields.md` - Evidence 필드 상세 설명 및 판단 기준

### prompts/
- `extract_evidence.md` - 회고에서 Evidence 추출용 LLM 프롬프트

## Related Files

- `impact_model_config.yml` - 점수 계산 설정
- `00_Meta/_TEMPLATES/template_evidence.md` - Evidence 템플릿
- `scripts/build_impact.py` - Realized Score 계산 스크립트