# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Context: Dual-Vault System

> **This is the Shared Vault (LOOP)**. Sensitive C-level data (runway, cashflow, salaries) lives in **loop_exec** vault.

| Question Type | Vault | Entry Point |
|--------------|-------|-------------|
| Projects, Tasks, Strategy, Ontology | LOOP | This vault |
| Runway, Budget, Hiring, Cashflow | loop_exec | `/Volumes/LOOP_CLevel/vault/loop_exec` |

**First Action**: Check `00_Meta/_VAULT_REGISTRY.md` for cross-vault routing rules.

---

## Quick Reference

**This is an Obsidian vault** for knowledge management with Python validation scripts and FastAPI server.

### Essential Commands
```bash
# Validation (pre-commit hook runs these automatically)
python3 scripts/validate_schema.py .      # Schema validation (blocks commit)
python3 scripts/check_orphans.py .        # Orphan check (warnings only)
python3 scripts/build_graph_index.py .    # Rebuild _Graph_Index.md (auto-staged)

# Archive management
python3 scripts/archive_task.py <task_id> # Archive completed tasks
python3 scripts/build_archive_catalog.py  # Rebuild archive catalog

# API Server (for dashboard)
poetry run uvicorn api.main:app --reload --host 0.0.0.0 --port 8081
# Dashboard: open _dashboard/index.html in browser (requires API server)
```

### Installation
```bash
pip install pyyaml                    # Basic (validation only)
poetry install --extras api           # Full (includes API server)
```

### Key Entry Points
| Purpose | Location |
|---------|----------|
| Schema definitions | `00_Meta/schema_registry.md` **(authoritative source for all entity schemas)** |
| Vault ecosystem | `00_Meta/_VAULT_REGISTRY.md` **(cross-vault routing)** |
| Archive access | `90_Archive/00_Catalog/_ARCHIVE_ENTRY.md` **(mandatory before archive access)** |
| Navigation hub | `_HOME.md` |
| Entity graph | `_Graph_Index.md` (auto-generated, do not edit) |
| Templates | `00_Meta/_TEMPLATES/` |
| API docs | `api/README.md` |

### Git on Network Mount
Due to SMB mount, direct git commands may fail with lock errors. Use `/safe-commit` command or let the NAS daemon handle commits (every 15 minutes).

---

## What This Vault Is

This Obsidian vault manages the **Inner Loop OS (ILOS)** strategy, ontology schema, and project execution as an integrated knowledge system.

**Inner Loop OS** is a behavioral OS that treats human emotion-eating-habit-reward-nervous system loops as a unified system.

**Core Philosophy**: "An organization that kills hypotheses quickly to find what survives"

### This Vault Contains
1. **10-year vision**: Human Inner Loop OS as global standard
2. **Strategic hypotheses**: Meta Hypotheses (MH1-4), Conditions (A-E), Tracks (1-6)
3. **Ontology schema**: Data models (Event, Episode, ActionExecution, etc.)
4. **Project execution**: Track-based Projects and Tasks
5. **Hypothesis validation**: Logs of hypotheses being tested
6. **Real implementations**: Links to SoSi and KkokKkokFit projects

---

## Strategic Hierarchy (Critical Concept)

```
10-year Vision (North Star) - Immutable
 └─ Meta Hypotheses (MH1-4) - If ANY breaks → reconsider company
     └─ 3-year Conditions (A-E) - When met → unlock; when broken → specific pivot/shutdown
         └─ 12-month Tracks (1-6) - Investment direction hypotheses
             └─ Projects - Experiment units
                 └─ Tasks - Execution units
```

### Core Principles
1. **Vision is fixed, strategy is conditional**
2. **Metrics ≠ goals**, metrics = shutdown signals
3. **Bad results ≠ failure**, bad results = hypothesis generation opportunities
4. **Condition broken → clear pivot/shutdown decision**

**Examples**:
- Condition B (10 reproducible patterns) broken → Data strategy shutdown
- MH3 (data modeling possible) false → Reconsider company's reason to exist

---

## Architecture: Ontology-Strategy Relationship (CRITICAL)

### Ontology's 3 Roles

#### 1. Validates MH3
**MH3**: "Loops can be modeled as data"

**How ontology validates**:
- Can Loop data be represented with 5 core entities?
- Does Event-Action-Result causal structure work?
- Can reproducible patterns be stored as data?

**Current status**: 70% validated (positive)
**If MH3 false** → Reconsider company existence

#### 2. Enables Condition B
**Condition B**: "10 reproducible patterns"

**How ontology enables**:
- Converts patterns to Event-Episode-Action-Outcome data
- Makes pattern reproduction testing possible
- Makes pattern counting possible

**If Condition B breaks** → Data strategy shutdown, cannot enter 3-year strategy
**Without ontology** → Cannot measure Condition B

#### 3. Core Component of Track 2
**Track 2 (Data)**: "Coach + log data can be patterned"

**Ontology = Focus 3 of Track 2** (Schema stabilization)

**Track 2 success conditions**:
- High-density users: 50 ✅
- Reproducible patterns- 10 ← **Ontology required**
- Schema stability: 3 months ← **Ontology required**

---

## Folder Structure (GraphRAG Optimized)

```
LOOP/
├── _HOME.md                            # Main navigation hub
├── _Graph_Index.md                     # Auto-generated graph index ⭐
├── README.md / CLAUDE.md
│
├── 00_Meta/_TEMPLATES/                 # Entity templates
├── 01_North_Star/                      # 10-year vision + MH1-4
├── 10_Study/                           # Ontology learning materials
├── 20_Strategy/                        # Conditions + Tracks
│   ├── 3Y_Conditions_2026-2028/        # A-E conditions (3년 주기)
│   └── 12M_Tracks/2026/                # 1-6 tracks (연도별)
├── 30_Ontology/                        # Schema development
│   ├── Schema/v0.1/
│   ├── Entities/
│   └── _Strategy_Link.md               # ⭐ Ontology-strategy connection
├── 40_LOOP_OS/                         # System definitions
├── 50_Projects/                        # Experiment units
├── 60_Hypotheses/                      # Hypothesis validation logs
├── 70_Experiments/                     # Experiments and validation
├── 90_Archive/                         # Archive (catalog-gated access)
└── scripts/                            # Python automation scripts
```

### 90_Archive Access Rules (CRITICAL for LLM)

> **기본 동작**: 90_Archive는 접근하지 않음. Hot 영역만 탐색.

**When to Access Archive** (다음 경우에**만** 접근):
- 사용자가 **명시적으로 과거 근거/원문**을 요청할 때
- **특정 ID**(task_id, project_id)가 주어질 때
- **특정 기간**(예: "2025년 9월")이 명시될 때

**Access Sequence (MANDATORY)**:
```
Step 1: 90_Archive/00_Catalog/catalog.jsonl 검색 (필수 선행)
        → task_id, project_id, 키워드로 경로 확정

Step 2: 확정된 원문 파일 1~2개만 Read
        → 절대로 tasks/ 전체 스캔 금지

Step 3: 추가 필요 시 by_project/ 또는 by_time/ 인덱스 참조
        → 관련 파일 1~2개 추가 확인
```

**Prohibited Actions**:
- `90_Archive/tasks/` 전체 glob/grep 스캔
- catalog 없이 원문 직접 접근
- 10개 이상 파일 동시 열기

**Entry Point**: `90_Archive/00_Catalog/_ARCHIVE_ENTRY.md` - 상세 규칙 및 스키마

### Key Documents (Quick Reference)

**Strategy**:
- `01_North_Star/10년 비전.md` - Immutable coordinates
- `01_North_Star/MH3_데이터_모델링_가능.md` - ⭐ Validated by ontology
- `20_Strategy/3Y_Conditions_2026-2028/Condition_B_Loop_Dataset.md` - ⭐ Enabled by ontology
- `20_Strategy/12M_Tracks/2026/Track_2_Data.md` - ⭐ Ontology belongs here

**Ontology**:
- `30_Ontology/Schema/v0.1/Ontology-lite v0.1.md` - 5 core entities + 4 rules
- `30_Ontology/_Strategy_Link.md` - ⭐ Ontology-strategy connection
- `30_Ontology/Entities/Event (GraphRAG 최적화 예시).md` - GraphRAG optimization

**Real Implementations** (outside this vault):
- SoSi: `/Users/gim-eunhyang/dev/flutter/sosi`
- KkokKkokFit: `/Users/gim-eunhyang/dev/flutter/kkokkkokfit_web`

---

## Entity Types & ID Formats

> **Authoritative source**: `00_Meta/schema_registry.md` (v3.7)

### Strategy Layer
| Entity Type | ID Pattern | Example | Notes |
|-------------|------------|---------|-------|
| NorthStar | `ns-NNN` | ns-001 | Fixed (1 only) |
| MetaHypothesis | `mh-N` | mh-3 | 1-4 |
| Condition | `cond-X` | cond-b | a-e |
| Track | `trk-N` | trk-2 | 1-6 |
| Program | `pgm-name` | pgm-hiring | Always active (never closed) |
| Project | `prj-NNN` | prj-003 | 001-999, can link to Program via `program_id` |
| Task | `tsk-NNN-NN` | tsk-003-01 | Per project |
| Hypothesis | `hyp-N-NN` | hyp-2-01 | Track-based: `{trk}-{seq}` |
| Experiment | `exp-NNN` | exp-001 | 001-999 |

### Ontology Layer
| Entity Type | Description |
|-------------|-------------|
| CoreEntity | Event, Episode, LoopStateWindow, ActionExecution, OutcomeMeasurement (v0.1 frozen) |
| Relation | Relationship definitions |
| Rule | Constraints (Rule A-D) |
| Community | GraphRAG communities |

### Key Relationships
```yaml
# Strategy relationships
validates          # Ontology v0.1 validates MH3
enables            # Ontology v0.1 enables Condition B
part_of            # Ontology v0.1 part_of Track 2
unlocks            # Condition B unlocks 3-year strategy
triggersShutdown   # Condition broken → shutdown
implements         # Project implements Hypothesis

# Ontology relationships
contains           # Episode contains Event
evaluatedBy        # ActionExecution evaluatedBy OutcomeMeasurement
precedes           # Event precedes Event
triggers           # Event triggers ActionExecution
```

---

## YAML Frontmatter Standards

### Strategy Document Example (Condition)
```yaml
---
entity_type: Condition
entity_id: "cond-b"
entity_name: Condition_B_Loop_Dataset
created: 2024-12-18
updated: 2024-12-18
status: in_progress

# Hierarchy
parent_id: "mh-3"
aliases: []

# Relationships
outgoing_relations:
  - type: triggers_shutdown
    target_id: "action:shutdown_data_strategy"
    description: "Data strategy shutdown"
validates: []
validated_by: ["trk-2"]

# Condition-specific
unlock: "Enter 3-year strategy"
if_broken: "Data strategy shutdown"
metrics:
  - name: "Reproducible patterns"
    threshold: "10+"
    current: 3
    status: "at_risk"

# Status
risk_level: medium
priority_flag: critical
tags: ["condition", "3year", "critical"]
---
```

### Ontology Document Example (Entity)
```yaml
---
entity_type: CoreEntity
entity_name: Event
entity_id: "entity:event:v0.1"
version: "0.1"

# Ontology metadata
parent: [LoopInstance]
relations-
  - type: contains
    source: Episode
    direction: incoming
    cardinality: "0..1:N"

# ⭐ Strategy connection (REQUIRED)
strategy_link:
  validates: [MH3]
  part_of: [Project:Ontology_v0.1]
  enables: [Condition_B]
  supports: [Track_2_Data]

# Hypothesis contribution
hypothesis_contribution:
  - hypothesis: "Loops are modelable"
    evidence: "Event can express meal/emotion/urge/binge"

# GraphRAG
community: [C1_Core_Entities, C3_Causality]
importance: critical
centrality: 0.95

# Multi-level summaries
summaries:
  executive: "Atomic fact recording entity"
  technical: "Observation-based minimal data unit"
  detailed: "..."

tags: [ontology/entity, version/v0-1, core]
---
```

---

## Immutable Rules (v0.1 Frozen Specification)

### NEVER CHANGE (v0.1)
- ❌ 5 core entities (Event, Episode, LoopStateWindow, ActionExecution, OutcomeMeasurement) - no deletion/semantic changes
- ❌ ID field names (eventId, episodeId, stateWindowId, actionExecutionId, outcomeId)
- ❌ Reference structure (episodeId, actionExecutionId references)
- ❌ Common fields (id, userId, createdAt, updatedAt, source, specVersion)
- ❌ 4-condition rules (Rule A-D)

### Allowed Changes
- ✅ Add new entities (doesn't violate Rule A)
- ✅ Add new fields (preserve existing field semantics)
- ✅ Expand payload internal structure

### Strategy Document Principles
- ❌ Never set metrics as goals (they are shutdown signals only)
- ❌ Never use "success/failure" terms (use "hypothesis validation/falsification")
- ✅ Always specify clear response when Condition breaks
- ✅ Always include if_broken field

---

## Entity Creation Rules (MANDATORY)

> **Task/Project 생성 시 반드시 `loop-entity-creator` 스킬 사용**

### 금지 사항 (NEVER DO)
- ❌ Write tool로 Task/Project 파일 직접 생성
- ❌ 템플릿 없이 frontmatter 수동 작성
- ❌ entity_id 수동 지정
- ❌ Naming convention 무시 (`[Category] - [Detail]` 형식 필수)

### 필수 사항 (ALWAYS DO)
- ✅ `/new-task` 또는 `/new-project` 명령 사용
- ✅ 또는 `loop-entity-creator` 스킬 직접 호출
- ✅ Naming convention 준수: `Hiring - 주니어 개발자`, `API - 캐시 구현` 등
- ✅ 생성 후 validation 스크립트 실행

### Valid Project Status
`planning` | `active` | `paused` | `done` | `cancelled`
- ❌ `in_progress` 사용 금지

---

## Using the loop-entity-creator Skill

The `loop-entity-creator` skill is a managed skill that automates Task and Project creation with proper ID generation, schema validation, and graph index updates.

### When to Use This Skill

**MANDATORY** - Always use this skill when:
- User asks to "create a new task" or "create a new project"
- User wants to add a task to an existing project
- User needs to edit or delete Tasks/Projects
- You need to ensure proper ID generation and schema compliance

### How It Works

**For Tasks:**
1. Collects required info (project_id, assignee, priority)
2. Auto-generates next Task ID (e.g., `tsk-003-02`)
3. Creates file in correct location (`50_Projects/{project}/Tasks/`)
4. Runs validation and updates graph index

**For Projects:**
1. Collects required info (owner, parent_id)
2. Auto-generates next Project ID (e.g., `prj-008`)
3. Creates project directory structure with `Tasks/` and `Results/` subfolders
4. Creates `Project_정의.md` file
5. Runs validation and updates graph index

### Example Usage

Instead of manually creating files:
```bash
# DON'T do this manually:
Write file to 50_Projects/P008_NewProject/Tasks/task.md
```

Use the skill:
```bash
# DO this instead:
Invoke the loop-entity-creator skill
Let it collect info and auto-generate IDs
```

For more details, see:
- `00_Meta/TEAM_GUIDE_Task_Project_생성.md` - User guide for the skill
- `.claude/skills/loop-entity-creator/SKILL.md` - Technical documentation

---

## Common Workflows

### Create New Strategy Hypothesis
1. Determine hypothesis type (MetaHypothesis, Condition, Track, Hypothesis)
2. Copy template from `00_Meta/_TEMPLATES/template_*.md`
3. Create document in appropriate folder (`01_North_Star/`, `20_Strategy/`)
4. Replace `{{PLACEHOLDERS}}` with actual values
5. Write YAML frontmatter (entity_type, if_broken, validates/enables)
6. Specify relationships (parent/child hypotheses, ontology connections)
7. Regenerate `_Graph_Index.md`: `python3 scripts/build_graph_index.py .`
8. Update related MOC files

### Create New Ontology Entity
1. Create document in `30_Ontology/Entities/`
2. YAML frontmatter must include **strategy_link** section
3. Write **hypothesis_contribution** (which hypothesis does this validate?)
4. Write 3-level summary (executive/technical/detailed)
5. Add relations section (table format)
6. Include JSON examples
7. Update `_MOC 온톨로지 개발.md`
8. Update `_Graph_Index.md`

### Ontology-Strategy Gap Analysis
1. Write ontology spec
2. Check actual implementations (SoSi/KkokKkokFit)
3. Analyze gaps-
   - In ontology only → Implementation plan
   - In implementation only → Extend ontology
4. Reconcile:
   - Ontology better → Propose implementation change (migration)
   - Implementation more realistic → Adjust ontology (must not violate v0.1 rules)
5. Document results in `70_Experiments/Use-cases/`

### Update Condition Status
1. Open Condition document (`20_Strategy/3Y_Conditions_2026-2028/`)
2. Update metrics current value
3. Reassess risk_level
4. Check break_triggers (make shutdown decision if met)
5. Check related Track/Project status
6. Update `_Graph_Index.md`

---

## Validation & Pre-commit Hook

**Pre-commit hook is installed** and runs automatically on every commit:
- **Validates schema** (blocks commit on error)
- **Checks orphans** (warns only)
- **Rebuilds graph index** (auto-stages `_Graph_Index.md`)

**Validation script scan locations**:
- Scans: `01_North_Star/`, `20_Strategy/`, `50_Projects/`, `60_Hypotheses/`, `70_Experiments/`
- Excludes: `00_Meta/_TEMPLATES/`, `10_Study/`, `30_Ontology/`, `40_LOOP_OS/`, `90_Archive/`

---

## Dashboard + API Architecture

> **Production Dashboard**: https://kanban.sosilab.synology.me/ (항상 여기서 확인)
> **API Server**: https://mcp.sosilab.synology.me/ (Dashboard/MCP 통합 엔드포인트)

**Dashboard** (`_dashboard/index.html`): SPA with Kanban, Calendar, Strategy Graph views
**API Server**: FastAPI via Docker with in-memory cache (see `api/README.md`)

```
Developer (MacBook Obsidian)
    ↓ SMB/NFS mount (real-time sync)
Synology NAS (/volume1/vault/LOOP)
    ↓ API server (uvicorn, port 8081)
    ↓ _dashboard/ → Web Station (port 8080)
Team Members (Browser: http://nas-ip:8080)
```

### API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tasks` | GET/POST | Task 목록/생성 |
| `/api/tasks/{id}` | PUT/DELETE | Task 수정/삭제 |
| `/api/projects` | GET/POST | Project 목록/생성 |
| `/api/projects/{id}` | GET | Project 상세 |
| `/api/programs` | GET | Program 목록 |
| `/api/tracks` | GET | Track 목록 |
| `/api/hypotheses` | GET | Hypothesis 목록 |
| `/api/conditions` | GET | Condition 목록 |
| `/api/strategy/northstar` | GET | North Star 정보 |
| `/api/strategy/metahypotheses` | GET | Meta Hypotheses 목록 |
| `/api/files/` | GET | 디렉토리 목록 |
| `/api/files/{path}` | GET | 파일 내용 읽기 |
| `/api/search?q=` | GET | Vault 전체 검색 |
| `/api/members` | GET | 멤버 목록 |
| `/api/cache/stats` | GET | 캐시 통계 |
| `/api/cache/reload` | POST | 캐시 강제 갱신 |
| `/health` | GET | Health check |

**Key API design patterns**:
- `VaultCache` singleton with O(1) lookups, TTL-based change detection
- File-First Pattern: CRUD writes to markdown files first, then updates cache

**Docs**: `api/README.md` (endpoints), `NAS_DASHBOARD_ARCHITECTURE.md` (deployment)

---

## MCP Server (ChatGPT Integration)

> **MCP URL**: `https://mcp.sosilab.synology.me/mcp`

LOOP API는 Docker 컨테이너(Python 3.11)로 MCP(Model Context Protocol)를 지원합니다.
ChatGPT Developer Mode에서 Vault 데이터에 직접 접근 가능합니다.

### 아키텍처

```
ChatGPT (Developer Mode)
    ↓ SSE/HTTP
https://mcp.sosilab.synology.me/mcp
    ↓ Docker (loop-api:latest, port 8082)
Synology NAS (/volume1/LOOP_CORE/vault/LOOP)
```

### 주요 파일

| 파일 | 설명 |
|-----|------|
| `Dockerfile` | Python 3.11 + FastAPI + fastapi-mcp |
| `docker-compose.yml` | 컨테이너 구성 (참고용) |
| `api/main.py` | MCP 마운트 (`FastApiMCP`) + OAuth endpoints |
| `api/oauth/` | OAuth 2.0 models (Dynamic Client Registration) |

### 관리 명령어

```bash
# 상태 확인
/mcp-server status

# 코드 변경 후 재빌드
/mcp-server rebuild

# 재시작
/mcp-server restart

# 로그 확인
/mcp-server logs
```

### ChatGPT 연결 방법

1. **Settings → Connectors → Advanced → Developer mode** 켜기
2. **Add MCP server** → URL: `https://mcp.sosilab.synology.me/mcp`
3. 새 채팅에서 LOOP Vault MCP 선택

---

## GraphRAG Questions This Vault Should Answer

**Global questions** (overall context):
- "What is this company's 10-year goal?" → Inner Loop OS global standard
- "Why build ontology?" → Validate MH3 + Enable Condition B + Execute Track 2
- "If MH3 is false?" → Reconsider company's reason to exist

**Conditional questions** (If-Then):
- "If Condition B breaks?" → Data strategy shutdown → Abandon 3-year strategy
- "If ontology fails?" → MH3 at risk → Company review OR redesign v0.2
- "If patterns don't reach 10?" → Condition B unmet → Data strategy shutdown

**Relationship questions** (connections):
- "Which hypothesis does Event entity validate?" → MH3 (data modeling possible)
- "What's the relationship between Track 2 and ontology?" → Ontology is Focus 3 of Track 2
- "What unlocks when ontology succeeds?" → Condition B → 3-year strategy → Medical entry

**Timeline questions** (time series):
- "Success conditions after 12 months?" → Condition A,B clarified + Condition D secured
- "3-year strategy entry conditions?" → Condition A,B,D,E met
- "What triggers ontology v0.1 → v0.2?" → 3 months stability + 10 patterns + new requirements

---

## Important Notes

### Vault Characteristics
- **Markdown-centric**: This is an Obsidian knowledge vault, not a software project
- **No code execution**: No `npm`, `cargo`, `go build`, etc.
- **NAS-mounted**: Mounted via SMB (use `/safe-commit` for git operations)

### Real Implementation Projects
This vault manages strategy and ontology **specifications**. Do NOT modify implementation code from here.
- **SoSi**: `/Users/gim-eunhyang/dev/flutter/sosi`
- **KkokKkokFit**: `/Users/gim-eunhyang/dev/flutter/kkokkkokfit_web`

---

## File Creation Rules (CRITICAL)

| Content Type | Location | Example | Status |
|--------------|----------|---------|--------|
| 10-year vision/Meta Hypotheses | `01_North_Star/` | MH3 document | Partial |
| 3-year Conditions | `20_Strategy/3Y_Conditions_2026-2028/` | Condition B | Partial |
| 12-month Tracks | `20_Strategy/12M_Tracks/2026/` | Track 2 | Complete |
| Ontology entities | `30_Ontology/Entities/` | Event definition | Partial |
| Ontology relations | `30_Ontology/Relations/` | contains relation | Planned |
| Ontology rules | `30_Ontology/Rules/` | Rule A | Planned |
| Ontology-strategy link | `30_Ontology/_Strategy_Link.md` | Strategy link | Planned |
| Projects | `50_Projects/P{N}_{Name}/` | Ontology v0.1 | Planned |
| Hypothesis validation | `60_Hypotheses/` | Loop modeling | Planned |
| Experiment results | `70_Experiments/Use-cases/` | Validation results | Folder exists |
| Templates | `00_Meta/_TEMPLATES/` | Strategy/ontology templates | Exists |

### When Creating Strategy Documents
1. Clearly specify **entity_type** (NorthStar, MetaHypothesis, Condition, Track, Project, Task)
2. Specify **if_broken** condition (what gets triggered?)
3. Specify **enables/validated_by** relationships
4. Emphasize **metrics are shutdown signals, not goals**

### When Creating Ontology Documents
1. **strategy_link** section required (validates, enables, supports)
2. Add **hypothesis_contribution** section
3. Specify **community** membership
4. Write **multi-level summaries** (executive/technical/detailed)
5. **Include examples** (JSON, scenarios)

### Document Relationships
- Strategy → Ontology: `validates`, `enables`, `supports`
- Within ontology: `contains`, `evaluatedBy`, `precedes`, `triggers`
- Within strategy: `unlocks`, `triggersShutdown`, `implements`

## Key Metadata Files

These files define the vault's schema and automation rules:

**Schema and Validation**:
- `00_Meta/schema_registry.md` - Authoritative schema definitions for all entity types
- `00_Meta/build_config.md` - Automation script configuration and Git hook settings
- `00_Meta/relation_types.md` - Relationship type definitions
- `00_Meta/members.yaml` - Team member registry

**Templates**:
- `00_Meta/_TEMPLATES/` - Template files for all entity types
- Each template has `{{PLACEHOLDERS}}` to be replaced with actual values

**Skill Documentation**:
- `.claude/skills/loop-entity-creator/SKILL.md` - Task/Project creation skill
- `.claude/skills/loop-entity-creator/references/` - Field requirements and entity patterns

**Entry Points**:
- `_HOME.md` - Main navigation hub for users
- `_ENTRY_POINT.md` - LLM-specific entry point (if exists)
- `_Graph_Index.md` - Auto-generated entity relationship map (do NOT edit manually)

**Python Configuration**:
- `pyproject.toml` - Project dependencies and Poetry configuration (Python 3.9+, PyYAML 6.0.3+)

---

## Claude Code Commands (Slash Commands)

Available commands in `.claude/commands/`:

| Command | Description |
|---------|-------------|
| `/safe-commit` | SSH-based commit to NAS (avoids SMB git conflicts) |
| `/commit` | Standard commit process |
| `/deploy` | Deployment process |
| `/todo` | Check tasks before starting work |
| `/todo_api` | API development workflow with Codex-Claude loop |
| `/new-project` | Create new Project entity with proper ID/schema |
| `/new-task` | Create new Task entity with proper ID/schema |
| `/new` | What's New version changelog with emoji |
| `/auto-fill-project-impact` | AI-assisted expected_impact field filling |
| `/build-impact` | Build and analyze project impact |
| `/retro` | Convert retrospective notes to Evidence entities |
| `/ontology` | Explore Product Ontology (ILOS) schema |
| `/mcp-server` | Docker MCP 서버 관리 (rebuild/restart/logs/status) |

**Usage**: Type `/command-name` in Claude Code to invoke.

---

## Claude Code Skills

Available skills in `.claude/skills/`:

| Skill | Description |
|-------|-------------|
| `loop-entity-creator` | Automated Task/Project creation with ID generation |
| `llm-vault-optimizer` | Optimize vault structure for LLM navigation |
| `auto-fill-project-impact` | Fill expected_impact via AI analysis |
| `retrospective-to-evidence` | Convert retro notes to structured Evidence |
| `doc-init` | 범용 프로젝트 문서 초기화 (doc/{프로젝트}/todo.md, techspec.md) |

---

## Utility Scripts (One-time Migrations)

Located in `scripts/`, these are typically used once for data migrations-

| Script | Purpose |
|--------|---------|
| `backfill_conditions_3y.py` | Add `conditions_3y` field to entities |
| `fix_project_parent_ids.py` | Fix malformed parent_id references |
| `add_entity_id_aliases.py` | Add entity_id to aliases for Obsidian linking |
| `csv_to_loop_entities.py` | Import tasks from Notion CSV exports |

---

**Last updated**: 2025-12-25
**Document version**: 5.6
**Author**: Claude Code

**Changes (v5.6)**:
- Added API Endpoints Reference table with all REST endpoints
- Added `/api/files` and `/api/search` endpoints documentation
- Noted OAuth directory (`api/oauth/`) for ChatGPT MCP integration

**Changes (v5.5)**:
- Added MCP Server (ChatGPT Integration) section
- Added `/mcp-server` command for Docker container management
- MCP endpoint: `https://mcp.sosilab.synology.me/mcp`

**Changes (v5.4)**:
- Updated slash commands table with missing commands (/commit, /deploy, /todo, /new, /ontology)
- Synced with schema_registry.md v3.7

**Changes (v5.3)**:
- Consolidated duplicate sections (Git on Network Mount, Validation, Dashboard)
- Moved Git warning to Quick Reference section
- Reduced document length by ~100 lines while preserving all key information
- Fixed section numbering inconsistencies