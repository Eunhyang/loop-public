# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dual-Vault System

> **This is the Shared Vault (LOOP)**. Sensitive C-level data lives in **loop_exec** vault.

| Question Type | Vault | Path |
|--------------|-------|------|
| Projects, Tasks, Strategy, Ontology | LOOP | This vault |
| Runway, Budget, Hiring, Cashflow | loop_exec | `/Volumes/LOOP_CLevel/vault/loop_exec` |

See `00_Meta/_VAULT_REGISTRY.md` for cross-vault routing rules.

---

## Quick Start

**This is an Obsidian vault** with Python validation scripts and FastAPI server (MCP-enabled).

### Requirements
- Python 3.9+ (validation), Python 3.10+ (API/MCP server)
- Poetry for dependency management
- Docker (optional, for NAS deployment)

### Installation & Commands
```bash
pip install pyyaml                                      # Basic (validation only)
poetry install --extras api                             # Full (includes API server)

# Validation
python3 scripts/validate_schema.py .                    # Full validation
python3 scripts/validate_schema.py . --file <path>      # Single file
python3 scripts/validate_schema.py . --check-freshness  # Schema freshness check
python3 scripts/auto_fix_schema.py <path>               # Auto-fix issues

# Orphan & Graph Index
python3 scripts/check_orphans.py .                      # Find orphaned entities
python3 scripts/build_graph_index.py .                  # Rebuild _Graph_Index.md

# API Server (local dev)
poetry run uvicorn api.main:app --reload --host 0.0.0.0 --port 8081

# MCP Server (Docker on NAS)
/mcp-server status|rebuild|restart|logs

# Docker (local dev)
docker compose up -d                                    # Start all services
docker compose logs -f loop-api                         # Watch API logs
docker compose down                                     # Stop all services
```

### Key Entry Points
| Purpose | Location |
|---------|----------|
| **Schema definitions** | `00_Meta/schema_registry.md` |
| **Constants (SSOT)** | `00_Meta/schema_constants.yaml` |
| Navigation hub | `_HOME.md` |
| Entity graph | `_Graph_Index.md` (auto-generated) |
| Templates | `00_Meta/_TEMPLATES/` |

### Git on Network Mount
SMB mount causes git lock errors:
- Use `/safe-commit` for immediate commits (SSH to NAS)
- Or let NAS daemon handle auto-commits (every 15 min)
- If lock error occurs: `rm -f .git/index.lock`

### Dashboard Access
- **Local**: `open _dashboard/index.html` (file://)
- **NAS**: `http://nas-ip:8080` (auto-deployed)

---

## Strategic Hierarchy

```
10-year Vision (North Star) - Immutable
 └─ Meta Hypotheses (MH1-4) - If ANY breaks → reconsider company
     └─ 3-year Conditions (A-E) - When met → unlock; when broken → pivot/shutdown
         └─ 12-month Tracks (1-6) - Investment direction hypotheses
             └─ Projects - Experiment units (유일한 판정 단위)
                 └─ Tasks - Execution units (validates 금지)
```

**Core Philosophy**: "An organization that kills hypotheses quickly to find what survives"
- Vision fixed, strategy conditional
- Metrics = shutdown signals, not goals
- Bad results = hypothesis generation opportunities

---

## Entity IDs & Folder Structure

> **Authoritative source**: `00_Meta/schema_constants.yaml`

| Entity | Pattern | Example | Location |
|--------|---------|---------|----------|
| NorthStar | `ns-NNN` | ns-001 | `01_North_Star/` |
| MetaHypothesis | `mh-N` | mh-3 | `01_North_Star/` |
| Condition | `cond-X` | cond-b | `20_Strategy/3Y_Conditions_*/` |
| Track | `trk-N` | trk-2 | `20_Strategy/12M_Tracks/` |
| Program | `pgm-name` | pgm-hiring | `50_Projects/{Name}/_PROGRAM.md` |
| Project | `prj-NNN` | prj-003 | `50_Projects/` |
| Task | `tsk-NNN-NN` | tsk-003-01 | `50_Projects/.../Tasks/` |
| Hypothesis | `hyp-N-NN` | hyp-2-01 | `60_Hypotheses/` |
| Experiment | `exp-NNN` | exp-001 | `70_Experiments/` |

### 90_Archive Access (CRITICAL)
> **Default**: Do NOT access. Search hot areas only.

**Access only when**:
- User explicitly requests past evidence
- Specific ID or time period provided

**Access sequence**: Catalog first (`90_Archive/00_Catalog/catalog.jsonl`) → Read 1-2 confirmed files only

---

## Entity Creation (MANDATORY)

> **Always use `loop-entity-creator` skill or `/new-task`, `/new-project` commands**

### NEVER DO
- Write tool로 Task/Project 파일 직접 생성
- 템플릿 없이 frontmatter 수동 작성
- entity_id 수동 지정

### Valid Status Values
All status, priority, type values defined in `00_Meta/schema_constants.yaml`. Changes require `/mcp-server rebuild`.

---

## Schema Constants SSOT (MANDATORY)

> **⚠️ 모든 상수는 `00_Meta/schema_constants.yaml`에서만 정의**

### 규칙
1. **절대 하드코딩 금지**: status, priority, entity_types 등 상수값을 코드/문서에 직접 나열하지 않음
2. **참조만 허용**: `"→ schema_constants.yaml 참조"` 또는 import로 참조
3. **변경은 YAML만**: 상수 추가/수정/삭제는 오직 schema_constants.yaml에서

### 참조 파일
| 파일 | 로드 방식 |
|------|----------|
| `api/constants.py` | YAML 직접 로드 |
| `scripts/validate_schema.py` | YAML 직접 로드 |
| `scripts/build_graph_index.py` | YAML 직접 로드 |
| `_dashboard/js/state.js` | API `/api/constants` 호출 |
| `00_Meta/schema_registry.md` | "→ schema_constants.yaml 참조" 명시 |

### 금지 예시
```python
# ❌ 하드코딩
valid_statuses = ['todo', 'doing', 'done', 'blocked']

# ✅ 상수 참조
from api.constants import TASK_STATUS
valid_statuses = TASK_STATUS
```

```markdown
# ❌ 문서에 값 나열
status: todo | doing | done | blocked

# ✅ YAML 참조
status: → schema_constants.yaml 참조
```

### 변경 시 필수 작업
```bash
/mcp-server rebuild   # API 서버 재시작 (Docker)
```

---

## Dev Task Workflow (CRITICAL)

> **⚠️ 모든 Step 필수 - 스킵 금지**

### `/new-dev-task` - 개발 작업 시작
| Step | Skill | Output | Confirmation |
|------|-------|--------|--------------|
| 1 | `loop-dev-task` | Task 파일 + Git 브랜치 | "✅ Task 생성됨" |
| 2 | `prompt-enhancer` | PRD + Tech Spec + Todo | "✅ PRD 작성됨" |
| 3 | `codex-claude-loop` | Plan → Validate → Implement → Review | "✅ 진행 중..." |

### `/done-dev-task` - 개발 작업 완료
| Step | Skill | Output | Confirmation |
|------|-------|--------|--------------|
| 1 | `workthrough` | 작업 로그 문서화 | "✅ 로그 작성됨" |
| 2 | `code-prompt-coach` | 세션 품질 분석 | "✅ 분석 완료" |
| 3 | Git | commit + PR 생성 | "✅ PR 생성됨" |

### `/start-dev-task {task_id}` - 기존 Task로 개발 시작
- Step 2, 3만 실행 (Task 이미 존재)

---

## Validation & Pre-commit

Pre-commit hook (`chmod +x .git/hooks/pre-commit`):
1. **Schema validation** (blocks on error)
2. **Orphan check** (warns only)
3. **Graph index rebuild** (auto-stages `_Graph_Index.md`)

**Scanned**: `01_North_Star/`, `20_Strategy/`, `50_Projects/`, `60_Hypotheses/`, `70_Experiments/`
**Excluded**: `00_Meta/_TEMPLATES/`, `10_Study/`, `30_Ontology/`, `40_LOOP_OS/`, `90_Archive/`

---

## API Architecture

> **Production**: https://mcp.sosilab.synology.me/
> **Local**: http://localhost:8081
> **MCP Endpoint**: `/mcp` (Model Context Protocol for LLM integrations)

```
api/
├── main.py              # FastAPI entry, auth middleware, MCP mount
├── constants.py         # Loads schema_constants.yaml (SSOT)
├── routers/             # REST: tasks, projects, hypotheses, tracks, search
├── models/entities.py   # Pydantic schemas
├── cache/vault_cache.py # In-memory cache (O(1) lookups)
└── oauth/               # OAuth 2.0 (RS256 + PKCE)
```

### Authentication
- **Static token**: `Authorization: Bearer $LOOP_API_TOKEN`
- **OAuth JWT**: RS256 signed tokens via `/authorize` flow
- **Public endpoints**: `/`, `/health`, `/docs`, `/constants`

### API Testing
```bash
# Health check
curl http://localhost:8081/health

# Get tasks (requires auth token)
curl -H "Authorization: Bearer $LOOP_API_TOKEN" http://localhost:8081/api/tasks

# Get constants (schema values - public)
curl http://localhost:8081/api/constants

# Cache management
curl -X POST -H "Authorization: Bearer $LOOP_API_TOKEN" http://localhost:8081/api/cache/reload
```

### Dashboard (Static Frontend)
```
_dashboard/
├── index.html           # Single-page with embedded Tailwind
├── js/state.js          # Loads schema_constants via API
├── js/components/       # Kanban, panels, sidebar, task-card
└── css/                 # Modular stylesheets
```
Fetches data from API endpoints; works offline via `file://` protocol.

---

## Commands & Skills

### Slash Commands
| Command | Purpose |
|---------|---------|
| `/safe-commit` | SSH commit to NAS (avoids SMB conflicts) |
| `/new-project`, `/new-task` | Create entity with proper schema |
| `/new-dev-task`, `/done-dev-task` | Dev workflow (full pipeline) |
| `/start-dev-task` | Start dev with existing Task |
| `/mcp-server` | Docker MCP management |
| `/validate` | Schema validation |
| `/code-review` | Git diff analysis |
| `/build-impact` | Build impact metrics |
| `/retro` | Retrospective to evidence |
| `/auto-fill-project-impact` | Auto-fill Project expected_impact |

### Skills
| Skill | Purpose |
|-------|---------|
| `loop-entity-creator` | Task/Project creation with ID generation |
| `loop-dev-task` | Dev Task + Git branch |
| `prompt-enhancer` | PRD/Tech Spec generation |
| `codex-claude-loop` | Plan-validate-implement-review |
| `workthrough` | Development documentation |
| `api-client` | LOOP API curl 조회 (LOOP_API_TOKEN) |
| `oauth-admin` | OAuth 2.0 token/client management |
| `llm-vault-optimizer` | Vault structure optimization for LLM navigation |

---

## Scripts

**Core** (pre-commit): `validate_schema.py`, `check_orphans.py`, `build_graph_index.py`, `auto_fix_schema.py`
**Utility**: `archive_task.py`, `build_archive_catalog.py`, `build_impact.py`
**Shell**: `deploy_to_nas.sh`, `start_api_server.sh`

---

## Important Rules

### Immutable (v0.1 Frozen)
- 5 core ontology entities, ID field names, common fields, 4-condition rules

### Strategy Document Principles
- Metrics = shutdown signals only (never goals)
- Use "validation/falsification" (never "success/failure")
- Always include `if_broken` field

### This Vault vs Implementation Projects
This vault manages **specifications only**. Real code lives in:
- **SoSi**: `~/dev/flutter/sosi`
- **KkokKkokFit**: `~/dev/flutter/kkokkkokfit_web`

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Git lock error on SMB | `rm -f .git/index.lock` |
| Schema validation fails | `python3 scripts/auto_fix_schema.py <file>` |
| API not loading constants | `/mcp-server rebuild` |
| Dashboard not updating | Check NAS daemon: `ps aux \| grep sync` |
| Orphan entity warnings | Create missing parent or update `parent_id` |
| Pre-commit hook not running | `chmod +x .git/hooks/pre-commit` |
| Poetry dependency issues | `poetry lock --no-update && poetry install` |

---

## Data Flow Overview

```
Obsidian (user edits)
    ↓
Pre-commit hook
    ├── validate_schema.py (blocks on error)
    ├── check_orphans.py (warns only)
    └── build_graph_index.py → _Graph_Index.md
    ↓
Git commit → NAS sync (15 min)
    ↓
API cache reload → Dashboard update
```

**_Graph_Index.md**: Auto-generated entity graph. Never edit manually.

---

**Last updated**: 2025-12-27 | **Version**: 7.3
