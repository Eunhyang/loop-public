---
name: loop-entity-creator
description: Create Task, Project, Hypothesis via LOOP API. API validates schema, generates ID, creates file on NAS. Supports public/exec vaults.
---

# LOOP Entity Creator

Create entities via API. API handles validation, ID generation, and file creation.

## Prerequisites

```bash
[ -z "$LOOP_API_TOKEN" ] && source ~/dev/loop/.envrc
API_URL="${LOOP_API_URL:-https://mcp.sosilab.synology.me}"
```

## Vault Selection

> **Reference**: `_shared/vault-routing.md`

| Default | Sensitive info | Task |
|---------|---------------|------|
| public | exec | Follows parent Project |

---

## Creating a Task

### Step 1: Collect Info

**Required:**
- `entity_name` - Format: `주제 - 내용` (e.g., "CoachOS - 버그 수정")
- `project_id` - Parent project
- `assignee` - From `00_Meta/members.yaml`

**Name validation**: Must contain ` - ` (space-hyphen-space). Reject if missing.

### Step 2: Call API (MANDATORY - No Local Fallback)

```bash
RESPONSE=$(curl -fsS -X POST "$API_URL/api/tasks" \
    -H "Authorization: Bearer $LOOP_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "entity_name": "{name}",
        "project_id": "{project_id}",
        "assignee": "{assignee}",
        "status": "todo",
        "type": "{type}",
        "target_project": "{target_project}"
    }')

TASK_ID=$(echo "$RESPONSE" | jq -r '.task_id')
echo "Task created: $TASK_ID"
```

### Step 3: Sync Local

```bash
# Use nas-git skill for bidirectional sync
Skill(skill: "nas-git", args: "local-sync")
```

**Verify:**
```bash
grep "entity_id: $TASK_ID" ~/dev/loop/public/50_Projects/*/Tasks/*.md
```

---

## Creating a Project

### Step 1: Collect Info

**Required:**
- `entity_name` - Format: `주제 - 내용`
- `owner` - From `00_Meta/members.yaml`
- `parent_id` - Track ID (e.g., "trk-2")
- `conditions_3y` - Array (e.g., ["cond-a"])

**Optional:** `program_id`, `cycle`, `priority`, `autofill_expected_impact`

### Step 2: Call API

```bash
RESPONSE=$(curl -fsS -X POST "$API_URL/api/projects" \
    -H "Authorization: Bearer $LOOP_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "entity_name": "{name}",
        "owner": "{owner}",
        "parent_id": "{parent_id}",
        "conditions_3y": ["cond-a"],
        "autofill_expected_impact": true
    }')

PROJECT_ID=$(echo "$RESPONSE" | jq -r '.project_id')
```

### Step 3: Sync Local

```bash
Skill(skill: "nas-git", args: "local-sync")
```

---

## Creating a Hypothesis

### Step 1: Collect Info

**Required:**
- `entity_name` - Hypothesis name
- `parent_id` - Track ID (e.g., "trk-3")
- `hypothesis_question` - Must end with `?`
- `success_criteria`, `failure_criteria`, `measurement`

### Step 2: Call API

```bash
curl -fsS -X POST "$API_URL/api/hypotheses" \
    -H "Authorization: Bearer $LOOP_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "entity_name": "{name}",
        "parent_id": "trk-3",
        "hypothesis_question": "...인가?",
        "success_criteria": "...",
        "failure_criteria": "...",
        "measurement": "...",
        "auto_validate": true
    }'
```

---

## Exec Vault Entities

> **Reference**: `_shared/vault-routing.md`

Exec vault = local file creation only (no API).

**ID Patterns:**
- Standalone: `prj-exec-NNN`, `tsk-exec-NNN`
- Program round: `prj-{program}-{round}`, `tsk-{keyword}-NN`

**Location:** `exec/50_Projects/`

### Exec Project

```bash
mkdir -p "exec/50_Projects/P{num}_{name}/Tasks"
# Create _INDEX.md with vault: exec field
```

### Exec Task

```bash
# Create in exec/50_Projects/{project}/Tasks/
# Include vault: exec in frontmatter
```

---

## Editing Entities

1. Find entity: `grep -rl "entity_id: {id}" ~/dev/loop/`
2. Read current values
3. Use Edit tool to update frontmatter
4. Update `updated` field to today

---

## Deleting Entities

1. Find entity and check dependencies
2. Confirm with user
3. Delete file/directory
4. Rebuild graph index: `python3 scripts/build_graph_index.py .`

---

## Error Handling

| HTTP Code | Meaning | Action |
|-----------|---------|--------|
| 200/201 | Success | Extract ID from response |
| 400 | Validation error | Show error, fix input |
| 401 | Auth failed | Check LOOP_API_TOKEN |
| 5xx | Server error | Retry or report |

**Never create files locally when API fails.** Report error and ask user to fix.

---

## Quick Reference

| Entity | API Endpoint | ID Format |
|--------|--------------|-----------|
| Task | POST /api/tasks | `tsk-{hash6}-{epoch13}` |
| Project | POST /api/projects | `prj-{hash6}` |
| Hypothesis | POST /api/hypotheses | `hyp-{track}-{seq}` |

**Schema docs:** `00_Meta/schema_registry.md`
**Constants:** `00_Meta/schema_constants.yaml`
