---
entity_type: SchemaRegistry
entity_id: meta:schema
entity_name: LOOP Vault Schema Registry v3.3
created: 2025-12-18
updated: 2025-12-20
version: "3.3"
tags: ["meta", "schema", "registry"]
---

# LOOP Vault Schema Registry v3.3

> LLM + GraphRAG 최적화된 Obsidian Vault 스키마 정의

---

## 1. ID 형식 규칙

### 표준 형식
```
{entity_type}:{number}
```

### 엔티티별 ID 패턴
| Entity Type | ID Pattern | Example | Range |
|-------------|------------|---------|-------|
| NorthStar | `ns-{number}` | ns-001 | 001 (고정) |
| MetaHypothesis | `mh-{number}` | mh-1 | 1-4 |
| Condition | `cond-{letter}` | cond-a | a-e |
| Track | `trk-{number}` | trk-2 | 1-6 |
| Project | `prj-{number}` | prj-001 | 001-999 |
| Task | `tsk-{prj}-{seq}` | tsk-001-01 | 01-99 per project |
| Hypothesis | `hyp-{trk}-{seq}` | hyp-1-01 | {trk}:1-6, {seq}:01-99 |
| Experiment | `exp-{number}` | exp-001 | 001-999 |
| ProductLine | `pl-{number}` | pl-1 | 1-9 |
| PartnershipStage | `ps-{number}` | ps-1 | 1-9 |
| Result | `res:{prj}-{seq}` | res:001-01 | 01-99 per project |

### 파일명 규칙
```
{entity_id}_{snake_case_name}.md
```
예시: `prj-001_ontology_v0.1.md`, `hyp-001_loop_modeling.md`

---

## 2. 공통 스키마 (모든 엔티티)

```yaml
---
# === 필수 필드 ===
entity_type: string              # NorthStar | MetaHypothesis | Condition | Track | Project | Task | Hypothesis | Experiment
entity_id: string                # 형식: {type}:{number}
entity_name: string              # 표시 이름
created: date                    # YYYY-MM-DD
updated: date                    # YYYY-MM-DD
status: string                   # planning | active | blocked | done | failed | learning

# === 계층 관계 ===
parent_id: string | null         # 상위 엔티티 ID
# children_ids: 빌드 시 자동 파생, 수동 관리 X

# === 마이그레이션 ===
aliases: [string]                # 기존 ID/이름 호환용

# === 관계 (outgoing만 수동 관리) ===
outgoing_relations: []           # 아래 relation_types.md 참조

# === 가설 연결 (대칭 형식) ===
validates: [string]              # 이 엔티티가 검증하는 가설 ID들
validated_by: [string]           # 이 엔티티를 검증하는 엔티티 ID들

# === 분류 ===
tags: [string]                   # 순수 문자열만
priority_flag: string            # low | medium | high | critical
---
```

---

## 3. 엔티티별 확장 스키마

### NorthStar (ns-*)
```yaml
# 추가 필드 없음 - 공통 스키마만 사용
# status는 항상 "fixed"
```

### MetaHypothesis (mh-*)
```yaml
if_broken: string                # 깨지면 어떤 결정이 트리거되는지
evidence_status: string          # assumed | validating | validated | falsified
confidence: number               # 0.0 ~ 1.0
```

### Condition (cond-*)
```yaml
unlock: string                   # 충족 시 무엇이 unlock 되는지
if_broken: string                # 깨지면 어떤 결정이 트리거되는지
metrics:                         # 측정 지표
  - name: string
    threshold: string
    current: string | number
    status: string               # on_track | at_risk | failed
```

### Track (trk-*)
```yaml
horizon: string                  # "12month" | "6month" | "3month"
hypothesis: string               # 이 트랙의 핵심 가설 (텍스트)
focus: [string]                  # 집중 영역
owner: string                    # 담당자
objectives:                      # 목표 지표
  - metric: string
    target: string
    current: string | number
    status: string
```

### Project (prj-*)
```yaml
owner: string                    # 담당자
budget: number | null            # 예산 (원)
deadline: date | null            # 마감일

# === Impact 판정 (프로젝트 = 유일한 판정 단위) ===
expected_impact:                 # 사전 선언 (A) - 필수
  statement: string              # "이 프로젝트가 성공하면 X가 증명된다"
  metric: string                 # 측정 지표
  target: string                 # 목표값

realized_impact:                 # 결과 기록 (A') - 완료 시 필수
  outcome: string | null         # supported | rejected | inconclusive
  evidence: string | null        # 실제 결과/근거
  updated: date | null           # 기록일

# === 가설 연결 ===
hypothesis_id: string | null     # 검증 대상 가설 ID (hyp-xxx)
experiments: [string]            # 연결된 실험 ID들 (참조만)

# === 레거시 (deprecated) ===
hypothesis_text: string | null   # → expected_impact.statement으로 대체
```

### Task (tsk-*)
```yaml
project_id: string               # 소속 프로젝트 ID (필수)
assignee: string                 # 담당자
start_date: date | null          # 시작일 (Calendar 뷰용)
due: date | null                 # 마감일 (종료일)
priority: string                 # low | medium | high
estimated_hours: number | null   # 예상 시간
actual_hours: number | null      # 실제 시간
```

### Hypothesis (hyp-*)
```yaml
# === 가설 정의 (필수 4요소) ===
hypothesis_question: string      # 질문 형태 ("?"로 끝나야 함)
success_criteria: string         # 성공 판정 기준 (숫자/기간/표본 포함)
failure_criteria: string         # 실패 판정 기준 (피벗/중단 가능한 기준)
measurement: string              # 어디서/무엇을/어떻게 측정

# === 시간 범위 ===
horizon: string                  # 검증 목표 연도 (예: "2026")
deadline: date | null            # 판정 마감일 (success_criteria에서 추출)

# === 상태 ===
evidence_status: string          # planning | validating | validated | falsified | learning
confidence: number               # 0.0 ~ 1.0

# === 분류 ===
loop_layer: [string]             # emotional | eating | habit | reward | autonomic

# === 레거시 (deprecated, 마이그레이션 후 제거) ===
hypothesis_text: string | null   # → hypothesis_question으로 대체
```

### Experiment (exp-*)
```yaml
hypothesis_id: string            # 검증 대상 가설 ID (필수)
protocol: string                 # 실험 프로토콜
metrics: [string]                # 측정 지표
start_date: date | null
end_date: date | null
result_summary: string | null    # 결과 요약
outcome: string | null           # positive | negative | inconclusive | null
```

---

## 4. 검증 규칙

### NorthStar
- `entity_id`: required, unique, pattern `ns-\d{3}`
- `status`: must be "fixed"

### MetaHypothesis
- `entity_id`: required, pattern `mh-[1-4]`
- `parent_id`: required, must reference existing NorthStar
- `if_broken`: required

### Condition
- `entity_id`: required, pattern `cond-[a-e]`
- `parent_id`: required, must reference existing MetaHypothesis
- `if_broken`: required
- `metrics`: at least 1 item

### Track
- `entity_id`: required, pattern `trk-[1-6]`
- `parent_id`: required, must reference existing Condition
- `owner`: required
- `horizon`: required

### Project
- `entity_id`: required, pattern `prj-\d{3}`
- `parent_id`: required, must reference existing Track
- `owner`: required
- `expected_impact`: required (statement, metric, target)
- `realized_impact`: required when status = done | failed
- `validates`: ❌ **Task는 validates 관계를 가질 수 없음** (Project만 가능)

### Task
- `entity_id`: required, pattern `tsk-\d{3}-\d{2}`
- `parent_id`: required, must reference existing Project
- `project_id`: required, must match parent Project
- `assignee`: required
- `validates`: ❌ **금지** - Task는 전략 판단에 개입하지 않음

### Hypothesis
- `entity_id`: required, pattern `hyp-[1-6]-\d{2}` (Track번호-순번)
- `hypothesis_question`: required, must end with "?"
- `success_criteria`: required, must include numbers/dates/samples
- `failure_criteria`: required, must enable pivot/stop decision
- `measurement`: required, must specify where/what/how
- `parent_id`: required, must reference existing Track
- `horizon`: required (예: "2026")
- `hypothesis_text`: deprecated (마이그레이션 기간만 허용)

### Experiment
- `entity_id`: required, pattern `exp-\d{3}`
- `hypothesis_id`: required, must reference existing Hypothesis
- `metrics`: required, at least 1 item

---

## 5. 파일 위치 규칙

| Entity Type | Canonical Location |
|-------------|-------------------|
| NorthStar | `01_North_Star/ns-{id}_{name}.md` |
| MetaHypothesis | `01_North_Star/mh-{id}_{name}.md` |
| Condition | `20_Strategy/3Y_Conditions_{period}/cond-{id}_{name}.md` |
| Track | `20_Strategy/12M_Tracks/{year}/trk-{id}_{name}.md` |
| Project | `50_Projects/{year}/prj-{id}_{name}/_PROJECT.md` |
| Task | `50_Projects/{year}/prj-{id}_{name}/Tasks/tsk-{id}_{name}.md` |
| Hypothesis | `60_Hypotheses/{year}/hyp-{trk}-{seq}_{name}.md` |
| Experiment | `70_Experiments/exp-{id}_{name}.md` |

---

## 6. 마이그레이션 규칙

### Phase 1: Alias 추가
기존 파일에 `aliases` 필드 추가하여 기존 링크 유지

```yaml
aliases:
  - PRJ-001                     # 기존 ID
  - P3_Ontology_v0.1            # 기존 폴더명
  - Ontology_v0.1               # 기존 표시명
```

### Phase 2: 링크 점진적 변환
새 문서는 새 ID 형식 사용, 기존 문서는 점진적 변환

### Phase 3: Alias 제거
3개월 후 aliases 제거 (모든 링크 변환 완료 후)

---

## 7. 역할 분리 규칙 (계층별 책임)

> "레이어가 부족한 게 아니라 레이어의 책임이 흐려지는 것이 문제다"

### Hypothesis (가설)
| 허용 | 금지 |
|------|------|
| 질문 형태 ("?"로 끝남) | 슬로건/선언문 형태 |
| 검증 가능한 기준 명시 | 모호한 목표 |
| success/failure criteria | 기준 없는 희망사항 |

### Project (실험 단위)
| 허용 | 금지 |
|------|------|
| Expected Impact 선언 (A) | Impact 없는 작업 목록 |
| Realized Impact 기록 (A') | 결과 없는 완료 처리 |
| 가설 검증 (validates) | 가설 없는 프로젝트 |
| **유일한 판정 단위** | - |

### Task (실행 로그)
| 허용 | 금지 |
|------|------|
| 단순 행동 기록 | 전략적 의미 기술 |
| 완료/미완료 상태 | 점수/판정 기록 |
| 담당자/마감일 | validates 관계 설정 |

### 위험 신호 (이런 증상이 나타나면 역할이 섞인 것)
- ❌ Task에 "이 작업이 중요한 이유"를 쓰기 시작
- ❌ Task에 validates 관계 설정
- ❌ Project에 가설/Impact 없이 작업만 나열
- ❌ Hypothesis가 질문이 아니라 슬로건

---

## 참고 문서

- [[relation_types]] - 관계 타입 정의
- [[build_config]] - 자동화 설정
- [[_ENTRY_POINT]] - LLM 진입점

---

**Version**: 3.4
**Last Updated**: 2025-12-20
**Validated by**: Codex (gpt-5-codex, high reasoning)

**Changes (v3.4)**:
- Hypothesis: ID 패턴 변경 `hyp-{trk}-{seq}` (Track 기반)
- Hypothesis: `measurement`, `horizon`, `deadline` 필드 추가
- Hypothesis: 파일 위치 `60_Hypotheses/{year}/` (연도별 서브폴더)
- Hypothesis: `parent_id` 필수화 (Track 연결)

**Changes (v3.3)**:
- Hypothesis: `hypothesis_question`, `success_criteria`, `failure_criteria` 필드 추가
- Project: `expected_impact`, `realized_impact` 필드 추가
- Task: `validates` 관계 금지 규칙 추가
- 역할 분리 규칙 섹션 추가 (Section 7)
