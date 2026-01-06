# API Development Workflow

> LOOP Dashboard API development command

---

## ⚠️ Pre-work Checklist

**Must output:**
- [ ] Mention using codex-claude-loop skill
- [ ] No code changes before OK
- [ ] Mention doc update after completion

---

## 0. New Project Start (use doc-init skill)

⚠️ **When starting a new API project, always use `doc-init` skill:**

```
New project start
    ↓
1️⃣ Call doc-init skill → auto-create doc/{project}/ folder
    ├─ techspec.md (tech spec template)
    └─ todo.md (task list template)
    ↓
2️⃣ Write techspec.md → project goals, architecture, API design
    ↓
3️⃣ Write todo.md → define task list
    ↓
4️⃣ Start work (follow workflow below)
```

**How to call doc-init skill:**
```
/doc-init {project-name}
```

---

## 0-1. Auto-execute on /todo_api

⚠️ **This command auto-checks in order:**

```
/todo_api execution
    ↓
1️⃣ Read doc/{project}/todo.md → check current tasks
    ↓
2️⃣ Check doc/{project}/techspec.md → reference tech spec
    ↓
3️⃣ Ready to work → understand rules below, start work
```

---

## 1. Check TODO File

Must read before starting work:
- `doc/{project}/todo.md` - current and upcoming tasks
- `doc/{project}/techspec.md` - tech spec and architecture

**Task tracking method:**
- API dev tasks recorded in `doc/{project}/todo.md`
- Overall vault tasks use `50_Projects/` Task entities

**Record on task start:**
- Before starting task, record **work plan** details in `doc/{project}/todo.md`
- Add indented details under task item

**Must record after completion:**
- After any skill, Agent, code change, update `doc/{project}/todo.md` required
- Change completed tasks `[ ]` → `[x]`
- Add newly discovered tasks
- **Record work details thoroughly** (what, how, which files modified)

**Task detail format:**
```markdown
- [x] **TASK-XXX** Task title
  - Modified files: `filepath1`, `filepath2`
  - Work content: actual work description
  - Changes: specific changes made
  - Completed: 2025-12-19
```

**Example:**
```markdown
- [x] **API-001** Add Hypothesis CRUD endpoints
  - Modified files: `api/routers/hypotheses.py`, `api/models/entities.py`, `api/main.py`
  - Work content: Implement Hypothesis create/read/update/delete API
  - Changes:
    - Add HypothesisCreate, HypothesisResponse models
    - POST /api/hypotheses endpoint
    - GET /api/hypotheses endpoint
  - Completed: 2025-12-19
```

---

## 2. Workflow (codex-claude-loop based)

⚠️ **All important code work uses `codex-claude-loop` skill**

```
/todo_api execution
    ↓
1️⃣ Read doc/{project}/todo.md → select task
    ↓
2️⃣ Write detailed task plan (record in todo.md)
    ↓
3️⃣ Call codex-claude-loop skill
    ├─ Claude: plan
    ├─ Codex: validate plan (read-only)
    ├─ Claude: implement (write API code)
    ├─ Codex: code review
    └─ Repeat → pass quality
    ↓
4️⃣ Test (Swagger UI, curl)
    ↓
5️⃣ Update doc/{project}/todo.md ([ ] → [x], record actual work)
    ↓
6️⃣ Update docs (api/README.md, techspec.md)
    ↓
7️⃣ Git commit
```

**Work request flow:**
1. **Receive work request**
2. **Explain work and ask for confirmation** ← Must get OK here
3. **After "OK", start codex-claude-loop**

⚠️ **Important**: Request → I explain → Get OK → Execute codex-claude-loop

---

## 3. Code Writing Principles

### General Principles
1. **Never write hastily** - thorough analysis required
2. **Prioritize existing code reuse** - no duplicate code
3. **Understand all related code** - thorough code review before work
4. **Read relevant feature/docs before code update**

### Python/FastAPI Principles
1. **Type Hints required**: type hints on all functions
2. **Pydantic Models**: use Pydantic models for all requests/responses
3. **Router separation**: separate router files per entity
4. **Error Handling**: consistent error responses with HTTPException
5. **Logging**: use logging module, not print

---

## 4. Development Guide

### API Development Checklist

**When adding new endpoint:**
1. [ ] Write Pydantic model (`api/models/entities.py`)
2. [ ] Write Router function (`api/routers/*.py`)
3. [ ] Vault file handling logic (`api/utils/vault_utils.py`)
4. [ ] Register router in main.py
5. [ ] Test in Swagger UI
6. [ ] Test with curl
7. [ ] Check file in Obsidian
8. [ ] Update api/README.md (endpoint list)
9. [ ] Update techspec.md (if needed)

**When modifying code:**
1. Don't change important items without asking first
2. Approach in small steps, get approval before next step
3. On error, restore and debug, don't modify elsewhere
4. For large features, list small units and proceed with approval

---

## 5. Dangerous Operations Warning

⚠️ These operations require prior confirmation:
- Code deletion (especially api/ folder)
- pyproject.toml changes (dependency changes)
- YAML frontmatter schema changes
- CORS config changes
- File I/O logic changes (Vault file corruption risk)

---

## 6. Testing

### Run API Server

```bash
cd /Volumes/LOOP_CORE/vault/LOOP

# Start server
poetry run uvicorn api.main:app --reload --host 0.0.0.0 --port 8081

# Or use script
./scripts/start_api_server.sh
```

### Test Methods

**1. Swagger UI** (recommended)
```
http://localhost:8081/docs
```

**2. curl**
```bash
# Create Task
curl -X POST http://localhost:8081/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "entity_name": "Test Task",
    "project_id": "prj-001",
    "assignee": "eunhyang",
    "priority": "high",
    "status": "todo"
  }'

# List Tasks
curl http://localhost:8081/api/tasks
```

**3. Check in Obsidian**
- Verify file creation in `50_Projects/2025/P{N}_{ProjectName}/Tasks/`

---

## 7. Task Completion Required Process

⚠️ **Must execute in order on each task completion:**

```
codex-claude-loop complete (Codex review passed)
    ↓
1️⃣ Test (Swagger UI / curl)
    ↓
2️⃣ Update doc/{project}/todo.md
    - [ ] → [x]
    - Record detailed work content
    ↓
3️⃣ Update docs
    - api/README.md (endpoint list)
    - techspec.md (on architecture change)
    ↓
4️⃣ Git commit
```

---

## 7-1. Archive on Project Completion (move to doc/done/)

⚠️ **Archive when all tasks in project complete:**

**Completion conditions:**
- All tasks in todo.md are `[x]` status
- No additional work planned
- Documentation complete

**Archive process:**
```
Confirm todo.md 100% complete
    ↓
1️⃣ Final document cleanup
    - Final techspec.md update
    - Record results and achievements
    ↓
2️⃣ Move project folder
    doc/{project}/ → doc/done/{project}/
    ↓
3️⃣ Git commit (archive complete)
```

**Move command:**
```bash
mv doc/{project} doc/done/
```

**doc/done/ folder structure:**
```
doc/
├── {in-progress project}/     # Currently working
│   ├── techspec.md
│   └── todo.md
└── done/                      # Completed project archive
    └── {completed project}/
        ├── techspec.md
        └── todo.md
```

---

## 8. codex-claude-loop Skill

**Core loop:**
```
Claude plan → Codex validate → Claude implement → Codex review → Repeat
```

**Work performed:**
- Claude: plan, implement code, fix issues
- Codex: validate plan, code review, bug/security/performance check

**Pass conditions:**
- ✅ Codex plan validation passed
- ✅ Codex code review passed
- ✅ No security/performance issues

---

## 9. Document Update Rules

### Documents Needing Update

| Change | Update Document |
|--------|----------------|
| New endpoint added | `api/README.md`, `techspec.md` |
| Data model change | `techspec.md` (data model section) |
| Architecture change | `techspec.md` (add ADR section) |
| Deployment method change | `START_API_SERVER.md` |
| Dependency added | `techspec.md` (dependency section) |

---

## 10. Quick Reference

### Frequently Used Commands

```bash
# Start API server
poetry run uvicorn api.main:app --reload --port 8081

# Or
./scripts/start_api_server.sh

# Reinstall dependencies
poetry install --extras api

# Swagger UI
open http://localhost:8081/docs

# Health check
curl http://localhost:8081/health
```

### Frequently Referenced Docs

- **Architecture**: `doc/api/architecture.md` ⭐ (entity hierarchy, cache, filtering design)
- **Task list**: `doc/api/todo.md`
- **Tech spec**: `doc/api/techspec.md`
- **API docs**: `api/README.md`
- **Quick Start**: `START_API_SERVER.md`
- **Vault schema**: `00_Meta/schema_registry.md`

---

## 11. Project Structure

```
api/
├── main.py              # FastAPI app entrypoint
├── routers/             # API routers
│   ├── tasks.py         # Task CRUD
│   └── projects.py      # Project CRUD
├── models/              # Pydantic models
│   └── entities.py      # Request/response schemas
└── utils/               # Utilities
    └── vault_utils.py   # Vault file handling

doc/
├── {in-progress project}/    # Currently working project
│   ├── techspec.md           # Tech spec
│   └── todo.md               # Task list
└── done/                     # Completed project archive
    └── {completed project}/
        ├── techspec.md
        └── todo.md
```

---

**Version**: 1.1.0
**Last Updated**: 2025-12-21

**Changes (v1.1.0):**
- Section 0 added: Use `doc-init` skill when starting new project
- Section 7-1 added: `doc/done/` archive process on project completion
