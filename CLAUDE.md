# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Version 8.4** | Last updated: 2025-12-29
> Schema v5.3 | Impact Model v1.3.0

---

## 필수 선행 문서 (MUST READ FIRST)

> **`00_Meta/LOOP_PHILOSOPHY.md`** - LOOP Vault의 설계 철학과 핵심 원리
>
> 이 vault를 처음 접근하는 LLM은 반드시 위 문서를 먼저 읽어야 한다.
> - **핵심 원리**: 결정(Decision)–증거(Evidence)–정량화(A/B)–승인(Approval)–학습(Loop)
> - **SSOT + Derived**: 한 곳에만 저장, 나머지는 계산
> - **"계산은 코드가, 판단은 사람이"**: LLM은 제안, 점수 계산은 서버, 승인은 인간

---

## Quick Reference

```bash
# Initial Setup
poetry install                                          # Core dependencies only
poetry install --with api                               # Include FastAPI server

# Validation
python3 scripts/validate_schema.py .                    # Full validation
python3 scripts/validate_schema.py . --file <path>      # Single file
python3 scripts/validate_schema.py . --check-freshness  # Check schema staleness
python3 scripts/auto_fix_schema.py <path>               # Auto-fix issues

# Build
python3 scripts/build_graph_index.py .                  # Rebuild _Graph_Index.md
python3 scripts/build_impact.py .                       # Build impact.json
python3 scripts/check_orphans.py .                      # Find orphaned entities

# API Server (local)
poetry run uvicorn api.main:app --reload --host 0.0.0.0 --port 8081

# Docker (NAS) - Note: 8082 → 8081 mapping
docker compose up -d && docker compose logs -f loop-api

# Required env vars for n8n (create .env file)
# N8N_USER, N8N_PASSWORD, N8N_ENCRYPTION_KEY
```

**Key files**: `00_Meta/schema_constants.yaml` (SSOT), `impact_model_config.yml`, `_Graph_Index.md`

### Entity Naming Convention (MANDATORY)
> **All Task/Project names MUST follow: `주제 - 내용` format**

- Pattern: `/^.+ - .+$/` (space-hyphen-space separator)
- Examples: `"CoachOS - 프로토타입 개발"`, `"Dashboard - UX 개선"`
- Invalid: `"프로토타입개발"`, `"CoachOS-개발"` (missing proper separator)

---

## Dual-Vault System

| Question Type | Vault | Path |
|--------------|-------|------|
| Projects, Tasks, Strategy, Ontology | **LOOP** (this vault) | `/Volumes/LOOP_CORE/vault/LOOP` |
| Runway, Budget, Hiring, Cashflow | **loop_exec** | `/Volumes/LOOP_CLevel/vault/loop_exec` |

See `00_Meta/_VAULT_REGISTRY.md` for cross-vault routing rules.

---

## Architecture

### Strategic Hierarchy
```
NorthStar (10-year Vision) - Immutable
 └─ MetaHypothesis (MH1-4) - If ANY breaks → reconsider company
     └─ Condition (cond-a~e) - When met → unlock; when broken → pivot/shutdown
         └─ Track (trk-1~6) - 12-month investment direction hypotheses
             └─ Project - Experiment units (유일한 판정 단위)
                 └─ Task - Execution units (validates 금지)
```

**Core Philosophy**: "Kill hypotheses quickly to find what survives"
- Metrics = shutdown signals, not goals
- Use "validation/falsification" not "success/failure"

### Entity IDs (Authoritative: `00_Meta/schema_constants.yaml`)
| Entity | Pattern | Location |
|--------|---------|----------|
| NorthStar | `ns-NNN` | `01_North_Star/` |
| MetaHypothesis | `mh-N` | `01_North_Star/` |
| Condition | `cond-X` | `20_Strategy/3Y_Conditions_*/` |
| Track | `trk-N` | `20_Strategy/12M_Tracks/` |
| Program | `pgm-name` | `50_Projects/{Name}/_PROGRAM.md` |
| Project | `prj-NNN` | `50_Projects/` |
| Task | `tsk-NNN-NN` | `50_Projects/.../Tasks/` |
| Hypothesis | `hyp-N-NN` | `60_Hypotheses/` |
| Experiment | `exp-NNN` | `70_Experiments/` |

### API Architecture
```
api/
├── main.py              # FastAPI entry, ASGI auth middleware, MCP mount
├── constants.py         # Loads schema_constants.yaml (SSOT)
├── routers/             # REST endpoints
│   ├── tasks.py         # CRUD /api/tasks
│   ├── projects.py      # CRUD /api/projects
│   ├── hypotheses.py    # /api/hypotheses
│   ├── tracks.py        # /api/tracks
│   ├── conditions.py    # /api/conditions
│   ├── search.py        # /api/search
│   ├── pending.py       # /api/pending (pending reviews)
│   ├── mcp_composite.py # /api/mcp/* (LLM-optimized compound endpoints)
│   ├── autofill.py      # /api/autofill (LLM-powered field suggestions)
│   └── audit.py         # /api/audit (run logs, decision logs)
├── services/
│   └── llm_service.py   # LLM integration (Claude API)
├── prompts/             # LLM prompt templates
│   ├── expected_impact.py
│   └── realized_impact.py
├── utils/
│   ├── entity_generator.py
│   └── impact_calculator.py
├── models/entities.py   # Pydantic schemas
├── cache/vault_cache.py # In-memory cache (O(1) lookups)
└── oauth/               # OAuth 2.0 (RS256 + PKCE)
```

**Endpoints** (IMPORTANT):
- API: `https://mcp.sosilab.synology.me`
- n8n: `https://n8n.sosilab.synology.me`
- Auth via `.envrc`: `LOOP_API_URL`, `LOOP_API_TOKEN`
- **API 접근**: `api-client` 스킬 사용
- **서버 배포/관리**: `/mcp-server` 명령어 사용

**Auth**: `Authorization: Bearer $LOOP_API_TOKEN` or OAuth JWT (RS256 + PKCE)
**Public**: `/`, `/health`, `/docs`, `/api/constants`, OAuth endpoints

**MCP Composite Endpoints** (LLM-optimized, single-call):
- `/api/mcp/vault-context` - Vault structure + current status (recommended first call)
- `/api/mcp/search-and-read?q=keyword` - Search + read in one call
- `/api/mcp/file-read?paths=path1,path2` - Direct file read by path (NEW)
- `/api/mcp/project/{id}/context` - Project + Tasks + Hypotheses
- `/api/mcp/project/{id}/context?include_body=true` - With body content (NEW)
- `/api/mcp/dashboard` - Full status dashboard

---

## Critical Rules

### LOOP API Access (MANDATORY)
> **모든 LOOP API 호출 시 반드시 Authorization 헤더 포함**

```bash
# ✅ 올바른 API 호출 (항상 이 패턴 사용)
curl -s -H "Authorization: Bearer $LOOP_API_TOKEN" \
  "$LOOP_API_URL/api/tasks"

# ❌ 절대 금지 (401 Unauthorized 발생)
curl -s https://mcp.sosilab.synology.me/api/tasks
```

**Public 엔드포인트 (인증 불필요)**: `/`, `/health`, `/docs`, `/api/constants`
**나머지 모든 `/api/*` 엔드포인트**: `Authorization: Bearer $LOOP_API_TOKEN` 필수

환경변수는 `.envrc`에 정의됨 (direnv 자동 로드)

### Schema Constants SSOT (MANDATORY)
> **All constants defined ONLY in `00_Meta/schema_constants.yaml`**

```python
# ❌ Never hardcode
valid_statuses = ['todo', 'doing', 'done']

# ✅ Always reference
from api.constants import TASK_STATUS
```

After schema changes: `/mcp-server rebuild`

### Entity Creation (MANDATORY)
> **Always use `loop-entity-creator` skill or `/new-task`, `/new-project` commands**

**NEVER**:
- Create Task/Project files directly with Write tool
- Manually write frontmatter without templates
- Manually assign entity_id

### SSOT + Derived Principle
- **SSOT**: Data stored in one place (e.g., `Project.validates = [hyp-...]`)
- **Derived**: Calculated at build time (e.g., `Hypothesis.validated_by`, `Track.realized_sum`)
- **Never store** derived fields directly in entities

### 90_Archive Access
> **Default: Do NOT access.** Search hot areas only.

Access only when user explicitly requests past evidence with specific ID/time period.
Sequence: `90_Archive/00_Catalog/catalog.jsonl` first → Read 1-2 confirmed files only.

---

## Dev Workflow

### `/new-dev-task` - Start development
1. `loop-dev-task` → Task file + Git branch
2. `prompt-enhancer` → PRD + Tech Spec
3. `codex-claude-loop` → Plan → Validate → Implement → Review

### `/done-dev-task` - Complete development
1. `workthrough` → Work log documentation
2. `code-prompt-coach` → Session quality analysis
3. Git → commit + PR creation

### `/start-dev-task {task_id}` - Resume existing Task
Steps 2, 3 only (Task already exists)

---

## Validation & Pre-commit

Pre-commit hook (`.git/hooks/pre-commit`) runs:
1. **Hardcode detection** - Warns if schema constants are hardcoded in `.py`/`.js` files
2. `validate_schema.py` (blocks on error)
3. `check_orphans.py` (warns only)
4. `build_graph_index.py` (auto-stages `_Graph_Index.md`)

**Scanned**: `01_North_Star/`, `20_Strategy/`, `50_Projects/`, `60_Hypotheses/`, `70_Experiments/`
**Excluded**: `00_Meta/_TEMPLATES/`, `10_Study/`, `30_Ontology/`, `40_LOOP_OS/`, `90_Archive/`, `00_Inbox/`

---

## Commands & Skills

### Key Slash Commands
| Command | Purpose |
|---------|---------|
| `/new-task`, `/new-project` | Create entity with proper schema |
| `/new-dev-task`, `/done-dev-task` | Full dev workflow pipeline |
| `/safe-commit` | SSH commit to NAS (avoids SMB conflicts) |
| `/mcp-server` | Docker MCP management |
| `/validate` | Schema validation |

### Key Skills
| Skill | Purpose |
|-------|---------|
| `loop-entity-creator` | Task/Project creation with ID generation (enforces naming convention) |
| `loop-dev-task` | Create dev Task + Git branch for external projects |
| `prompt-enhancer` | PRD/Tech Spec generation |
| `api-client` | LOOP API curl queries |
| `workthrough` | Document development work after completion |

---

## Impact Score System

- **A Score (Expected)**: `magnitude_points[tier][magnitude] × confidence`
- **B Score (Realized)**: `normalized_delta × strength_mult × attribution_share`
- **Windows**: monthly (Project), quarterly (Track), half-yearly (Condition)

Config: `impact_model_config.yml` | Output: `_build/impact.json`

### LLM Autofill
Uses Claude API to suggest Impact fields. Config in `impact_model_config.yml`:
- Model: `claude-sonnet-4-20250514`
- Temperature: 0.3
- Endpoints: `/api/autofill/expected-impact`, `/api/autofill/realized-impact`
- Prompts: `api/prompts/expected_impact.py`, `api/prompts/realized_impact.py`

### Evidence Quality Meta (v5.3)
Required for trustworthy B scores:
- `provenance`: auto | human | mixed
- `measurement_quality`: low | medium | high
- `counterfactual`: none | before_after | controlled
- Optional: `source_refs`, `sample_size`, `confounders`, `query_version`

---

## Infrastructure

### Docker Services (NAS)
| Service | Port | Purpose |
|---------|------|---------|
| `loop-api` | 8082 → 8081 | FastAPI + MCP server |
| `n8n` | 5678 | Workflow automation |

**Volume mounts**: LOOP Vault (rw), loop_exec (ro - sensitive data protection)

### Git on Network Mount
SMB mount causes git lock errors:
- Use `/safe-commit` for SSH commit to NAS
- Or let NAS daemon auto-commit (every 15 min)
- Lock error fix: `rm -f .git/index.lock`

### Data Flow
```
Obsidian edits → Pre-commit hook → Git → NAS sync (15 min) → API cache → Dashboard
                                                          ↓
                                              n8n workflows (validation, LLM autofill)
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Git lock error on SMB | `rm -f .git/index.lock` |
| Schema validation fails | `python3 scripts/auto_fix_schema.py <file>` |
| API not loading constants | `/mcp-server rebuild` |
| Orphan entity warnings | Create missing parent or update `parent_id` |
| Pre-commit hook not running | `chmod +x .git/hooks/pre-commit` |
| Poetry issues | `poetry lock --no-update && poetry install` |

---

## This Vault vs Implementation

This vault manages **specifications only**. Real code repositories:
- **SoSi**: `~/dev/flutter/sosi`
- **KkokKkokFit**: `~/dev/flutter/kkokkkokfit_web`

---

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `validate_schema.py` | Validate frontmatter against schema_constants.yaml |
| `build_graph_index.py` | Regenerate `_Graph_Index.md` with entity relationships |
| `build_impact.py` | Calculate A/B scores, output to `_build/impact.json` |
| `check_orphans.py` | Find entities with missing parent references |
| `auto_fix_schema.py` | Auto-fix common schema issues (dates, missing fields) |
| `archive_task.py` | Move completed Tasks to `90_Archive/` |
| `build_archive_catalog.py` | Generate `90_Archive/00_Catalog/catalog.jsonl` |
| `backfill_conditions_3y.py` | Backfill conditions_3y field from parent hierarchy |
| `migrate_*.py` | One-time migration scripts (check before running) |

---

## Audit & Decision Logging

Append-only logs for reproducibility and governance:
- `_build/decision_log.jsonl` - All approval/rejection decisions
- `_build/audit.log` - Run execution logs with `run_id`
- Endpoints: `/api/audit/runs`, `/api/audit/decisions`
