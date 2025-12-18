---
entity_type: SchemaRegistry
entity_id: meta:schema
entity_name: LOOP Vault Schema Registry v3.2
created: 2025-12-18
updated: 2025-12-18
version: "3.2"
tags: ["meta", "schema", "registry"]
---

# LOOP Vault Schema Registry v3.2

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
| NorthStar | `ns:{number}` | ns:001 | 001 (고정) |
| MetaHypothesis | `mh:{number}` | mh:1 | 1-4 |
| Condition | `cond:{letter}` | cond:a | a-e |
| Track | `trk:{number}` | trk:2 | 1-6 |
| Project | `prj:{number}` | prj:001 | 001-999 |
| Task | `tsk:{prj}-{seq}` | tsk:001-01 | 01-99 per project |
| Hypothesis | `hyp:{number}` | hyp:001 | 001-999 |
| Experiment | `exp:{number}` | exp:001 | 001-999 |
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

### NorthStar (ns:*)
```yaml
# 추가 필드 없음 - 공통 스키마만 사용
# status는 항상 "fixed"
```

### MetaHypothesis (mh:*)
```yaml
if_broken: string                # 깨지면 어떤 결정이 트리거되는지
evidence_status: string          # assumed | validating | validated | falsified
confidence: number               # 0.0 ~ 1.0
```

### Condition (cond:*)
```yaml
unlock: string                   # 충족 시 무엇이 unlock 되는지
if_broken: string                # 깨지면 어떤 결정이 트리거되는지
metrics:                         # 측정 지표
  - name: string
    threshold: string
    current: string | number
    status: string               # on_track | at_risk | failed
```

### Track (trk:*)
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

### Project (prj:*)
```yaml
owner: string                    # 담당자
budget: number | null            # 예산 (원)
deadline: date | null            # 마감일
hypothesis_text: string          # 프로젝트 가설 (텍스트)
experiments: [string]            # 연결된 실험 ID들 (참조만)
```

### Task (tsk:*)
```yaml
project_id: string               # 소속 프로젝트 ID (필수)
assignee: string                 # 담당자
due: date | null                 # 마감일
priority: string                 # low | medium | high
estimated_hours: number | null   # 예상 시간
actual_hours: number | null      # 실제 시간
```

### Hypothesis (hyp:*)
```yaml
hypothesis_text: string          # 가설 전문
evidence_status: string          # planning | validating | validated | falsified | learning
confidence: number               # 0.0 ~ 1.0
loop_layer: [string]             # emotional | eating | habit | reward | autonomic
```

### Experiment (exp:*)
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
- `entity_id`: required, unique, pattern `ns:\d{3}`
- `status`: must be "fixed"

### MetaHypothesis
- `entity_id`: required, pattern `mh:[1-4]`
- `parent_id`: required, must reference existing NorthStar
- `if_broken`: required

### Condition
- `entity_id`: required, pattern `cond:[a-e]`
- `parent_id`: required, must reference existing MetaHypothesis
- `if_broken`: required
- `metrics`: at least 1 item

### Track
- `entity_id`: required, pattern `trk:[1-6]`
- `parent_id`: required, must reference existing Condition
- `owner`: required
- `horizon`: required

### Project
- `entity_id`: required, pattern `prj:\d{3}`
- `parent_id`: required, must reference existing Track
- `owner`: required

### Task
- `entity_id`: required, pattern `tsk:\d{3}-\d{2}`
- `parent_id`: required, must reference existing Project
- `project_id`: required, must match parent Project
- `assignee`: required

### Hypothesis
- `entity_id`: required, pattern `hyp:\d{3}`
- `hypothesis_text`: required
- `parent_id`: optional (can be orphan initially)

### Experiment
- `entity_id`: required, pattern `exp:\d{3}`
- `hypothesis_id`: required, must reference existing Hypothesis
- `metrics`: required, at least 1 item

---

## 5. 파일 위치 규칙

| Entity Type | Canonical Location |
|-------------|-------------------|
| NorthStar | `01_North_Star/ns-{id}_{name}.md` |
| MetaHypothesis | `01_North_Star/mh-{id}_{name}.md` |
| Condition | `20_Strategy/3Y_Conditions/cond-{id}_{name}.md` |
| Track | `20_Strategy/12M_Tracks/trk-{id}_{name}.md` |
| Project | `50_Projects/{year}/prj-{id}_{name}/_PROJECT.md` |
| Task | `50_Projects/{year}/prj-{id}_{name}/Tasks/tsk-{id}_{name}.md` |
| Hypothesis | `60_Hypotheses/hyp-{id}_{name}.md` |
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

## 참고 문서

- [[relation_types]] - 관계 타입 정의
- [[build_config]] - 자동화 설정
- [[_ENTRY_POINT]] - LLM 진입점

---

**Version**: 3.2
**Last Updated**: 2025-12-18
**Validated by**: Codex (gpt-5-codex, high reasoning)
