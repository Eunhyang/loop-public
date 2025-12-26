---
entity_type: SchemaRegistry
entity_id: meta:schema
entity_name: LOOP Vault Schema Registry v4.1
created: 2025-12-18
updated: 2025-12-27
version: "4.1"
tags: ["meta", "schema", "registry"]
---

# LOOP Vault Schema Registry v4.1

> LLM + GraphRAG 최적화된 Obsidian Vault 스키마 정의

---

## 🔗 상수 정의 (Single Source of Truth)

> **모든 상수 값은 YAML 파일에서 관리됩니다:**
>
> **📄 `00_Meta/schema_constants.yaml`**
>
> 포함 내용:
> - Status/Priority 값 및 색상
> - ID 패턴 (정규식)
> - 필수/허용 필드 목록
> - 경로 설정 (include/exclude)
> - Entity 순서
> - Status 매핑 (Dashboard용)
>
> **변경 시 `/mcp-server rebuild` 필요**

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
| Program | `pgm-{name}` | pgm-hiring | 상시 운영 프로그램 |
| Project | `prj-{number}` | prj-001 | 001-999 |
| Project (Round) | `prj-{pgm}-{cycle}` | prj-yt-w33 | program abbr + cycle |
| Task | `tsk-{prj}-{seq}` | tsk-001-01 | 01-99 per project |
| Hypothesis | `hyp-{trk}-{seq}` | hyp-1-01 | {trk}:1-6, {seq}:01-99 |
| Experiment | `exp-{number}` | exp-001 | 001-999 |
| ProductLine | `pl-{number}` | pl-1 | 1-9 |
| PartnershipStage | `ps-{number}` | ps-1 | 1-9 |
| Result | `res:{prj}-{seq}` | res:001-01 | 01-99 per project |
| Candidate | `cand-{number}` | cand-001 | 001-999 (loop_exec only) |
| TaskExecDetail | `(source task id)` | tsk-015-05 | loop_exec only |
| Retrospective | `retro-{prj}-{seq}` | retro-015-01 | loop_exec only |

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
entity_type: string              # NorthStar | MetaHypothesis | Condition | Track | Program | Project | Task | Hypothesis | Experiment
entity_id: string                # 형식: {type}:{number}
entity_name: string              # 표시 이름
created: date                    # YYYY-MM-DD
updated: date                    # YYYY-MM-DD
status: string                   # → schema_constants.yaml 참조

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
priority_flag: string            # → schema_constants.yaml 참조
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
evidence_status: string          # → schema_constants.yaml hypothesis.evidence_status 참조
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

### Program (pgm-*)
```yaml
# === 상시 운영 프로그램 (닫지 않음) ===
program_type: string             # → schema_constants.yaml program_types 참조
owner: string                    # 담당자

# === 원칙/프로세스 ===
principles: [string]             # 운영 원칙
process_steps: [string]          # 프로세스 단계
templates: [string]              # 템플릿 링크 (JD, 평가 루브릭 등)

# === 운영 KPI ===
kpis:                            # 민감도 낮은 운영 지표
  - name: string
    description: string

# === Cross-Vault ===
exec_rounds_path: string | null  # loop_exec 라운드 폴더 경로 (예: "40_People/Hiring_Rounds/")
```

### Project (prj-*)
```yaml
owner: string                    # 담당자
budget: number | null            # 예산 (원)
deadline: date | null            # 마감일

# === Program-Round 연결 (옵션, 반복 운영 시) ===
program_id: string | null        # 소속 프로그램 ID (pgm-xxx)
cycle: string | null             # 사이클/라운드 (예: "2026Q1")
# Round 전용 추가 필드는 program_type에 따라 다름:
# - hiring: role, headcount_target
# - fundraising: round_type (seed, series-a), target_amount
# - grants: program_name, application_deadline

# === Impact 판정 (프로젝트 = 유일한 판정 단위) ===
expected_impact:                 # 사전 선언 (A) - 필수
  statement: string              # "이 프로젝트가 성공하면 X가 증명된다"
  metric: string                 # 측정 지표
  target: string                 # 목표값

realized_impact:                 # 결과 기록 (B) - 완료 시 필수
  verdict: string | null         # pending | go | no-go | pivot
  outcome: string | null         # supported | rejected | inconclusive
  evidence_links: [string]       # ["[[link1]]", "[[link2]]", ...]
  decided: date | null           # 결정일

# === 가설 연결 ===
hypothesis_id: string | null     # 검증 대상 가설 ID (hyp-xxx)
experiments: [string]            # 연결된 실험 ID들 (참조만)

# === 레거시 (deprecated) ===
hypothesis_text: string | null   # → expected_impact.statement으로 대체

# === 외부 링크 ===
links:                           # 외부 링크 목록 (Google Drive, Figma 등)
  - label: string               # 표시 이름 (예: "기획문서")
    url: string                 # 전체 URL (https:// 또는 http://)
```

### Task (tsk-*)
```yaml
project_id: string               # 소속 프로젝트 ID (필수)
assignee: string                 # 담당자
start_date: date | null          # 시작일 (Calendar 뷰용)
due: date | null                 # 마감 예정일
priority: string                 # → schema_constants.yaml 참조
estimated_hours: number | null   # 예상 시간
actual_hours: number | null      # 실제 시간

# === Task 유형 (dev Task 연동용) ===
type: string | null              # → schema_constants.yaml task.types 참조
target_project: string | null    # → schema_constants.yaml task.target_projects 참조 (type=dev일 때)

# === 채용 관련 (Hiring Task용) ===
candidate_id: string | null      # 관련 후보자 ID (cand-xxx, loop_exec)
has_exec_details: boolean        # loop_exec에 민감 세부정보 존재 여부

# === 완료/아카이브 관련 ===
closed: date | null              # 실제 완료/종료일 (status 변경 시 기록)
archived_at: date | null         # 아카이브 이동일 (스크립트 자동 기록)
closed_inferred: string | null   # closed 추정 출처 (updated | git_commit_date | today)

# === 외부 링크 ===
links:                           # 외부 링크 목록 (Google Drive, Figma 등)
  - label: string               # 표시 이름 (예: "기획문서")
    url: string                 # 전체 URL (https:// 또는 http://)
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
evidence_status: string          # → schema_constants.yaml hypothesis.evidence_status 참조
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

### Candidate (cand-*) — loop_exec 전용
```yaml
# === 기본 정보 ===
name: string                     # 후보자 이름/닉네임
github: string | null            # GitHub username
position: string | null          # 지원 포지션

# === 상태 ===
status: string                   # screening | pilot | offer | hired | rejected

# === 채용 프로세스 연결 ===
hiring_project: string           # 채용 프로젝트 ID (prj-xxx)
pilot_project: string | null     # 파일럿 프로젝트 ID (prj-xxx)

# === 관련 문서 ===
related_tasks: [string]          # 관련 Task ID 목록
retrospective: string | null     # 회고 문서 ID

# === 평가 ===
verdict: string | null           # filtering_success | hired | offer_declined
verdict_date: date | null        # 최종 판정일
```

### TaskExecDetail — loop_exec 전용
```yaml
# === 연결 정보 (필수) ===
source_task: string              # 원본 Task ID (LOOP vault)
source_project: string           # 원본 Project ID
source_vault: string             # "LOOP" (고정)

# === 민감 정보 ===
# (본문에 자유 형식으로 작성)
# - 후보자 정보, 평가 내용, 계약 조건 등
```

### Retrospective (retro-*) — loop_exec 전용
```yaml
# === 연결 정보 ===
source_project: string           # 관련 프로젝트 ID
candidate_id: string | null      # 관련 후보자 ID (cand-xxx)

# === 판정 ===
verdict: string                  # filtering_success | hired | failed
verdict_date: date | null        # 판정일

# === 학습 ===
signals: [string]                # 핵심 판별 신호
system_updates: [string]         # 시스템 개선 항목
```

---

## 4. 검증 규칙

### NorthStar
- `entity_id`: required, unique, pattern → `schema_constants.yaml id_patterns.ns`
- `status`: must be "fixed" → `schema_constants.yaml northstar.status`

### MetaHypothesis
- `entity_id`: required, pattern → `schema_constants.yaml id_patterns.mh`
- `parent_id`: required, must reference existing NorthStar
- `if_broken`: required

### Condition
- `entity_id`: required, pattern → `schema_constants.yaml id_patterns.cond`
- `parent_id`: required, must reference existing MetaHypothesis
- `if_broken`: required
- `metrics`: at least 1 item

### Track
- `entity_id`: required, pattern → `schema_constants.yaml id_patterns.trk`
- `parent_id`: required, must reference existing Condition
- `owner`: required
- `horizon`: required

### Program
- `entity_id`: required, pattern → `schema_constants.yaml id_patterns.pgm`
- `program_type`: required, one of → `schema_constants.yaml program_types`
- `owner`: required
- `status`: always "doing" (닫지 않음)
- `principles`: recommended, at least 1 item
- `process_steps`: recommended, at least 1 item

### Project
- `entity_id`: required, pattern → `schema_constants.yaml id_patterns.prj`
- `parent_id`: required, must reference existing Track
- `owner`: required
- `expected_impact`: required (statement, metric, target)
- `realized_impact`: required when status = done | failed
- `validates`: ❌ **Task는 validates 관계를 가질 수 없음** (Project만 가능)

### Task
- `entity_id`: required, pattern → `schema_constants.yaml id_patterns.tsk`
- `parent_id`: required, must reference existing Project
- `project_id`: required, must match parent Project
- `assignee`: required
- `validates`: ❌ **금지** - Task는 전략 판단에 개입하지 않음
- `type`: optional, one of → `schema_constants.yaml task.types`
- `target_project`: optional (type=dev 시 필수) → `schema_constants.yaml task.target_projects`
- `closed`: required when status = done → `schema_constants.yaml task.status`
- `archived_at`: 스크립트 자동 기록 (수동 편집 금지)
- `closed_inferred`: optional, 값 = `updated` | `git_commit_date` | `today`

### Hypothesis
- `entity_id`: required, pattern → `schema_constants.yaml id_patterns.hyp`
- `hypothesis_question`: required, must end with "?"
- `success_criteria`: required, must include numbers/dates/samples
- `failure_criteria`: required, must enable pivot/stop decision
- `measurement`: required, must specify where/what/how
- `parent_id`: required, must reference existing Track
- `horizon`: required (예: "2026")
- `hypothesis_text`: deprecated (마이그레이션 기간만 허용)
- `evidence_status`: optional → `schema_constants.yaml hypothesis.evidence_status`

### Experiment
- `entity_id`: required, pattern → `schema_constants.yaml id_patterns.exp`
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
| Program | `50_Projects/{ProgramName}/_PROGRAM.md` |
| Project | `50_Projects/{year}/prj-{id}_{name}/_PROJECT.md` |
| Project (Round) | `50_Projects/{ProgramName}/Rounds/prj-{pgm}-{cycle}/` |
| Task | `50_Projects/{...}/Tasks/tsk-{id}_{name}.md` |
| Hypothesis | `60_Hypotheses/{year}/hyp-{trk}-{seq}_{name}.md` |
| Experiment | `70_Experiments/exp-{id}_{name}.md` |

### Program-Round 구조 (50_Projects 내)

```
50_Projects/
├── Hiring/                              # Program 폴더
│   ├── _PROGRAM.md                      # 원칙/프로세스/템플릿 (상시)
│   └── Rounds/                          # 라운드들
│       └── prj-hiring-2026q1-junior-dev/
│           ├── _PROJECT.md              # Round 정의
│           ├── Tasks/
│           └── 00_Rollup.md
├── Fundraising/
│   ├── _PROGRAM.md
│   └── Rounds/
├── 2026/                                # 일반 프로젝트 (기존)
│   └── prj-001_xxx/
```

### Cross-Vault 위치 (민감정보 분리)

| Content | Location | Vault |
|---------|----------|-------|
| Program (원칙/프로세스) | `50_Projects/{Name}/_PROGRAM.md` | LOOP (Shared) |
| Round Stub (요약만) | `50_Projects/{Name}/Rounds/{id}/` | LOOP (Shared) |
| Round Detail (민감정보) | `{folder}/Rounds/prj-{pgm}-{cycle}/` | loop_exec |

예시:
- Program: `50_Projects/Hiring/_PROGRAM.md` (LOOP)
- Round (공개): `50_Projects/Hiring/Rounds/prj-hiring-2026q1-junior-dev/` (LOOP)
- Round (민감): `40_People/Hiring_Rounds/prj-hiring-2026q1-junior-dev/` (loop_exec)

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

**Version**: 4.1
**Last Updated**: 2025-12-27
**Validated by**: Claude Opus 4.5

**Changes (v4.1)**:
- 검증 규칙 섹션 (Section 4) 완전 정리: 모든 ID 패턴 YAML 참조 확인
- 버전 정보 일관성 수정 (frontmatter와 footer 동기화)

**Changes (v4.0)**:
- 상수 값 하드코딩 제거 → `schema_constants.yaml` 참조로 통일
- status, priority, type, target_project, program_type, evidence_status 등
- ID 패턴도 YAML 참조로 변경 (검증 규칙 섹션)

**Changes (v3.9)**:
- Candidate (cand-*): 새 엔티티 추가 (loop_exec 전용, 채용 후보자)
- TaskExecDetail: 새 엔티티 추가 (loop_exec 전용, Task 민감 정보)
- Retrospective (retro-*): 새 엔티티 추가 (loop_exec 전용, 채용 회고)
- Task: `candidate_id`, `has_exec_details` 필드 추가 (Hiring Task용)
- Dual-Vault 연결: LOOP Task ↔ loop_exec Candidate/TaskExecDetail 연결 구조

**Changes (v3.8)**:
- Task: `type` 필드 추가 (dev | strategy | research | ops)
- Task: `target_project` 필드 추가 (sosi | kkokkkok | loop-api)
- Dev Task 연동: 외부 Flutter 프로젝트 Git 브랜치와 LOOP Task 연결 지원

**Changes (v3.7)**:
- Program (pgm-*): 새 entity_type 추가 (상시 운영 프로그램)
- Program: program_type, principles, process_steps, templates, kpis, exec_rounds_path 필드
- Project: program_id, cycle 필드 추가 (Round 연결용)
- Cross-Vault 위치 규칙 추가 (Program-Round 분리)

**Changes (v3.6)**:
- Project: `realized_impact` 확장 (verdict, evidence_links 배열, decided 필드 추가)
- Project: 본문 `## 🏁 Project Rollup` 섹션 추가 (template_project.md)
- Rollup = 종료 시 필수 (Conclusion/Evidence/Metric Delta/Decision)

**Changes (v3.5)**:
- Task: `closed`, `archived_at`, `closed_inferred` 필드 추가
- Task: `closed` 검증 규칙 추가 (status done/failed/learning 시 필수)
- 참고: `00_Meta/archive_policy.md` - 아카이브 운영 규칙 상세

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
