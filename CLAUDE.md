# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference: Common Commands

This is an **Obsidian vault** for knowledge management - there is no code compilation or testing.

### Validation Commands
```bash
# Validate all frontmatter schemas
python3 scripts/validate_schema.py .

# Check for broken entity references
python3 scripts/check_orphans.py .

# Regenerate graph index (auto-runs on commit)
python3 scripts/build_graph_index.py .

# Build dashboard (optional, creates HTML visualization)
python3 scripts/build_dashboard.py .

# Import tasks from CSV (e.g., from Notion export)
python3 scripts/csv_to_loop_entities.py <csv_file>
```

**Requirements**: Python 3.9+ with PyYAML (`pip install pyyaml` or use `poetry install`)

**Note**: All Python scripts are located in `scripts/` directory. See individual script files for detailed usage and options.

### Key Entry Points
- `_HOME.md` - Main navigation hub
- `_Graph_Index.md` - Auto-generated entity index (do not edit manually)
- `01_North_Star/` - 10-year vision and meta-hypotheses
- `20_Strategy/` - Strategic layer (Conditions, Tracks)
- `30_Ontology/` - Ontology schema development
- `00_Meta/_TEMPLATES/` - Templates for all entity types

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
- Reproducible patterns: 10 ← **Ontology required**
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
├── 90_Archive/                         # Archive
└── scripts/                            # Python automation scripts
```

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

### Strategy Layer
```yaml
entity_type: NorthStar          # 10-year vision     | ID: ns:001
entity_type: MetaHypothesis     # MH1-4             | ID: mh:1-4
entity_type: Condition          # 3-year (A-E)      | ID: cond:a-e
entity_type: Track              # 12-month (1-6)    | ID: trk:1-6
entity_type: Project            # Experiment unit   | ID: prj:001-999
entity_type: Task               # Execution unit    | ID: tsk:001-01
entity_type: Hypothesis         # Validation target | ID: hyp:001-999
entity_type: Experiment         # Validation test   | ID: exp:001-999
```

### Ontology Layer
```yaml
entity_type: CoreEntity         # Event, Episode, etc. (v0.1 frozen)
entity_type: Relation           # Relationship definitions
entity_type: Rule               # Constraints
entity_type: Community          # GraphRAG communities
```

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
entity_id: "cond:b"
entity_name: Condition_B_Loop_Dataset
created: 2024-12-18
updated: 2024-12-18
status: in_progress

# Hierarchy
parent_id: "mh:3"
aliases: []

# Relationships
outgoing_relations:
  - type: triggers_shutdown
    target_id: "action:shutdown_data_strategy"
    description: "Data strategy shutdown"
validates: []
validated_by: ["trk:2"]

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
relations:
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

## Using the loop-entity-creator Skill

The `loop-entity-creator` skill is a managed skill that automates Task and Project creation with proper ID generation, schema validation, and graph index updates.

### When to Use This Skill

Use this skill when:
- User asks to "create a new task" or "create a new project"
- User wants to add a task to an existing project
- User needs to edit or delete Tasks/Projects
- You need to ensure proper ID generation and schema compliance

### How It Works

**For Tasks:**
1. Collects required info (project_id, assignee, priority)
2. Auto-generates next Task ID (e.g., `tsk:003-02`)
3. Creates file in correct location (`50_Projects/{project}/Tasks/`)
4. Runs validation and updates graph index

**For Projects:**
1. Collects required info (owner, parent_id)
2. Auto-generates next Project ID (e.g., `prj:008`)
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
3. Analyze gaps:
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

## Validation & Automation

### Python Scripts

**Requirements**: Python 3.9+ with PyYAML

**Installation options**:
```bash
# Option 1: Direct install
pip install pyyaml

# Option 2: Using Poetry (recommended)
poetry install
```

**Project configuration**: See `pyproject.toml` for exact dependency versions.

#### ID Format Reference
| Prefix | Pattern | Example | Entity Type |
|--------|---------|---------|-------------|
| `ns:` | `ns:NNN` | `ns:001` | NorthStar |
| `mh:` | `mh:1-4` | `mh:3` | MetaHypothesis |
| `cond:` | `cond:a-e` | `cond:b` | Condition |
| `trk:` | `trk:1-6` | `trk:2` | Track |
| `prj:` | `prj:NNN` | `prj:003` | Project |
| `tsk:` | `tsk:NNN-NN` | `tsk:003-01` | Task |
| `hyp:` | `hyp:NNN` | `hyp:001` | Hypothesis |
| `exp:` | `exp:NNN` | `exp:001` | Experiment |

#### 1. Validate Schema
```bash
python3 scripts/validate_schema.py .
```
- Checks required fields for each entity type
- Validates ID format patterns
- Verifies status values
- Ensures parent_id references are valid

**Scans**: `01_North_Star/`, `20_Strategy/`, `50_Projects/`, `60_Hypotheses/`, `70_Experiments/`
**Excludes**: `00_Meta/_TEMPLATES/`, `10_Study/`, `30_Ontology/`, `40_LOOP_OS/`, `90_Archive/`

#### 2. Check Orphans
```bash
python3 scripts/check_orphans.py .
```
- Finds parent_id references to non-existent entities
- Checks project_id and hypothesis_id validity
- Verifies validates/validated_by symmetry
- Reports broken outgoing_relations

**Note**: Currently reports warnings but doesn't block commits

#### 3. Build Graph Index
```bash
python3 scripts/build_graph_index.py .
```
- Scans all entities with frontmatter
- Derives children_ids from parent_id
- Derives incoming_relations from outgoing_relations
- Creates summary tables and relationship maps
- Flags critical entities

**Auto-runs**: On every commit via pre-commit hook

### Setting Up Pre-commit Hook

**Note**: The pre-commit hook is already installed in this repository. If you need to reinstall it:

```bash
# Create the hook file
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "🔍 Running schema validation..."
python3 scripts/validate_schema.py . || {
  echo "❌ Schema validation failed. Commit blocked."
  exit 1
}

echo "🔗 Checking for orphans..."
python3 scripts/check_orphans.py . || {
  echo "⚠️  Orphan check warnings (not blocking)"
}

echo "📊 Rebuilding graph index..."
python3 scripts/build_graph_index.py . || {
  echo "❌ Graph index build failed. Commit blocked."
  exit 1
}

# Stage the updated index if it changed
if [ -f "_Graph_Index.md" ]; then
  git add _Graph_Index.md
  echo "✅ _Graph_Index.md updated and staged"
fi

echo "✅ All pre-commit checks passed!"
EOF

# Make it executable
chmod +x .git/hooks/pre-commit
```

**What the hook does**:
- ✅ **Validates schema** (blocks commit on error)
- ⚠️ **Checks orphans** (warns only, doesn't block)
- ✅ **Rebuilds graph index** (blocks commit on error, auto-stages `_Graph_Index.md`)

#### 4. Import Tasks from CSV
```bash
python3 scripts/csv_to_loop_entities.py <csv_file>
```
- Converts CSV task exports (e.g., from Notion) to Project/Task entities
- Automatically creates Project and Task frontmatter
- Maps priority levels (high/medium/low)
- Sanitizes file names
- Creates folder structure under `50_Projects/`

**Input CSV format**: Should include columns for project name, task name, status, priority, assignee

#### 5. Build Dashboard (Optional)
```bash
python3 scripts/build_dashboard.py .
```
- Generates an HTML dashboard at `_dashboard/index.html`
- Provides visual overview of Projects and Tasks
- Shows status distribution, priority breakdown, and progress tracking
- Useful for project management and team coordination

**Output location**: `_dashboard/index.html` (can be opened in any browser)

**Complete architecture**: See `NAS_DASHBOARD_ARCHITECTURE.md` for detailed component breakdown, deployment flow, and troubleshooting

#### 6. Deploy to Synology NAS (Production)
```bash
# On NAS (via SSH)
/volume1/scripts/deploy-kanban.sh
```
- Detects file changes (since last build)
- Validates schema
- Rebuilds dashboard
- Deploys to Web Station (http://nas-ip:8080)
- Logs to `/volume1/logs/kanban-deploy.log`

**Automated**: Runs every 15 minutes via Task Scheduler

**Note**: No git pull needed - vault is already on NAS and synced in real-time

For complete NAS deployment guide, see: `NAS_DEPLOYMENT_SIMPLE.md`

---

## NAS Dashboard Deployment

This vault includes a complete automated deployment system for Synology NAS.

**📖 완전한 아키텍처 문서**: `NAS_DASHBOARD_ARCHITECTURE.md` - 전체 시스템 구조, 컴포넌트, 트러블슈팅 포함

### Quick Start (NAS Admin)

**Prerequisites**: Synology NAS with Web Station and Python 3.9 installed

**Setup** (one-time):
1. Clone vault to NAS: `/volume1/vault/LOOP`
2. Install PyYAML: `python3 -m pip install pyyaml`
3. Copy deploy script to NAS: `scripts/deploy_to_nas.sh` → `/volume1/scripts/deploy-kanban.sh`
4. Create web directory: `/volume1/web/kanban`
5. Configure Web Station virtual host (port 8080)
6. Set up Task Scheduler to run script every 15 minutes

**Result**: Team dashboard auto-updates at `http://nas-ip:8080` whenever vault is pushed to GitHub

### Deployment Flow

```
Developer (MacBook Obsidian)
    ↓ SMB/NFS mount (real-time sync)
Synology NAS (/volume1/vault/LOOP)
    ↓ detect changes (every 15min)
    ↓ build_dashboard.py
Dashboard HTML (/volume1/web/kanban/)
    ↓ Web Station
Team Members (Browser: http://nas-ip:8080)
```

**Key Point**: Vault is already on NAS - MacBook mounts it via SMB/NFS. Files sync in real-time, no git pull needed!

### Monitoring

```bash
# Check deployment logs
tail -50 /volume1/logs/kanban-deploy.log

# Manual deployment (if urgent)
ssh admin@nas-ip
sudo /volume1/scripts/deploy-kanban.sh

# Verify web access
curl http://nas-ip:8080
```

### Documentation

**완전한 아키텍처**: `NAS_DASHBOARD_ARCHITECTURE.md` ⭐ (전체 시스템 구조, 스크립트 상세, 트러블슈팅)

**빠른 시작**: `NAS_DEPLOYMENT_SIMPLE.md` (10분 설정, 실시간 동기화 아키텍처)

**Advanced features**: `NAS_DEPLOYMENT_GUIDE.md` (Slack 알림, HTTPS, 다중 대시보드)

**Architecture comparison**: `nas-setup-comparison.md` (Vault on NAS vs Local+Clone vs Hybrid)

**Alternative solutions**: `nas-kanban-setup.md` (MkDocs, Next.js, Focalboard 옵션)

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

### Obsidian Vault Characteristics
- **No code execution**: This is a knowledge management vault, not a software project
- **No build commands**: No `npm`, `cargo`, `go build`, etc.
- **No tests**: No unit tests or integration tests
- **Markdown-centric**: All work focuses on creating, editing, and structuring `.md` files
- **NAS-mounted**: Vault is on Synology NAS, mounted via SMB at `/Volumes/LOOP_CORE/vault/LOOP`

### Git on Network Mount
Due to SMB mount, direct git commands may fail with lock errors. Use `/safe-commit` command or let the NAS daemon handle commits (every 15 minutes).

### Real Implementation Projects
This vault manages strategy and ontology **specifications**. Actual implementations:
- **SoSi**: `/Users/gim-eunhyang/dev/flutter/sosi`
- **KkokKkokFit**: `/Users/gim-eunhyang/dev/flutter/kkokkkokfit_web`

**When to reference implementations:**
- Ontology-implementation gap analysis
- Validating that ontology entities map to real data structures
- Checking if v0.1 spec constraints match actual usage
- Gathering evidence for hypothesis validation (e.g., MH3)

**Important**: Do NOT make changes to implementation code from this vault. This vault is for specification and strategy only.

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
| `/todo_api` | API development workflow with Codex-Claude loop |
| `/new-project` | Create new Project entity with proper ID/schema |
| `/new-task` | Create new Task entity with proper ID/schema |
| `/auto-fill-project-impact` | AI-assisted expected_impact field filling |
| `/build-impact` | Build and analyze project impact |
| `/retro` | Convert retrospective notes to Evidence entities |

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
| `doc-init` | Initialize documentation structure |

---

## Utility Scripts (One-time Migrations)

Located in `scripts/`, these are typically used once for data migrations:

| Script | Purpose |
|--------|---------|
| `backfill_conditions_3y.py` | Add `conditions_3y` field to entities |
| `fix_project_parent_ids.py` | Fix malformed parent_id references |
| `add_entity_id_aliases.py` | Add entity_id to aliases for Obsidian linking |
| `csv_to_loop_entities.py` | Import tasks from Notion CSV exports |

---

**Last updated**: 2025-12-21
**Document version**: 4.7
**Author**: Claude Code

**Changes** (v4.7):
- Removed nonexistent API module documentation (api/ doesn't exist)
- Added Claude Code Commands section (7 slash commands in .claude/commands/)
- Added Claude Code Skills section (5 skills in .claude/skills/)
- Simplified to reference existing documentation instead of duplicating

**Changes** (v4.6):
- Fixed API server command (was `scripts.api_server:app`, now `api.main:app`)

**Changes** (v4.5):
- Added Interactive Dashboard & API Server section
- Added Utility Scripts reference table