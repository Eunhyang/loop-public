---
name: loop-dev-task
description: Dev Task workflow for LOOP Vault or external projects (sosi, kkokkkok). Creates new Task or starts development with existing Task. If task_id provided, uses existing Task; otherwise creates new Task.
---

# Loop Dev Task

Dev Task workflow skill. Unified management for new Task creation or development with existing Task.

---

## How to Call

| Command | Description | Example |
|---------|-------------|---------|
| `/new-dev-task [name]` | Create new Task + PRD (STOPS before implementation) | `/new-dev-task Login bug fix` |
| `/start-dev-task [task_id]` | Start implementation with existing Task | `/start-dev-task tsk-dashboard-ux-v1-02` |

---

## Step 0: Mode Detection (FIRST - Always run first)

> **CRITICAL: Determine mode first, then branch to appropriate Step.**

```
┌─────────────────────────────────────────────────────────────┐
│  MODE DETECTION                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  task_id provided? ─────────────────┐                       │
│       │                             │                       │
│       ▼ NO                          ▼ YES                   │
│  ┌──────────────┐         ┌──────────────────┐              │
│  │ New Task Mode │         │ Existing Task Mode│             │
│  │ Start Step 1  │         │ Start Step 0-1   │              │
│  └──────────────┘         └──────────────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Workflow by Mode

**`/new-dev-task` (PRD Preparation - STOP before implementation):**
```
Step 1 → Step 2 → [Step 2-1] → Step 3 (Git Branch) → Step 4 (Task + Sync + Merge)
     → Step 5 (Read Project + PRD + Tech Spec) → Step 5.5 (Codex Feedback) → Step 5.6 (PRD Update)
     → STOP 🛑 → Suggest "/start-dev-task"
```

**`/start-dev-task` (Implementation):**
```
Step 6 (codex-claude-loop) → Step 7 (Validation)
```

**Existing Task Mode (task_id provided to /start-dev-task):**
```
Step 0-1 → Step 0-2 → Step 3 (conditional) → Step 4 (conditional) → Step 5 (conditional) → Step 6 → Step 7
```

> **🛑 CRITICAL: `/new-dev-task` MUST STOP after Step 5.6. Never proceed to Step 6.**
> **🚨 Implementation (Step 6-7) only starts via `/start-dev-task` command.**

### Checklist Pattern (Copy and track progress)

**For `/new-dev-task`:**
```
PRD Preparation Progress:
- [ ] Step 1: Environment detection
- [ ] Step 2: Collect Task info
- [ ] Step 3: Create Git branch
- [ ] Step 4: Create Task + Sync + Merge
- [ ] Step 5-1: Read parent Project file (architecture rules)
- [ ] Step 5-2: Write Tech Spec (following Project rules)
- [ ] Step 5-3: Write Todo
- [ ] Step 5.5: Get Codex PRD feedback
- [ ] Step 5.6: Update PRD with feedback
- [ ] STOP and suggest /start-dev-task
```

**For `/start-dev-task`:**
```
Implementation Progress:
- [ ] Step 6: codex-claude-loop (implementation)
- [ ] Step 7: Validation
```

---

## Existing Task Mode Steps

### Step 0-1: Verify Task Exists + Load

```bash
# Find Task file
grep -rl "entity_id: \"$task_id\"" /Volumes/LOOP_CORE/vault/LOOP/50_Projects/

# Or search by ID pattern
find /Volumes/LOOP_CORE/vault/LOOP/50_Projects -name "*.md" -exec grep -l "$task_id" {} \;
```

**Check:**
- Task file exists
- Task's project_id
- Task's target_project
- Task's type (must be "dev")

**If Task not found:**
```
Task not found: {task_id}
Please verify the Task ID is correct.
```

### Step 0-2: Check Current State

Read Task file and check:

| Check Item | If Exists | If Missing |
|------------|-----------|------------|
| Notes > Tech Spec | Skip Step 5 | Run Step 5 |
| Notes > Todo | Skip Step 5 | Run Step 5 |
| Git branch | Skip Step 3 | Run Step 3 |

> **Note**: In Existing Task Mode, Step 4-1 (Task creation) is always skipped since Task already exists.
> Step 4-2, 4-3 (Sync + Merge) only needed if Step 3 created new branch.

```bash
# Check if Git branch exists
git branch -a | grep "$task_id"
```

**Output:**
```
Task state check complete

Task: {task_id}
Project: {project_id}
Target: {target_project}

Current state:
- Tech Spec: {exists/missing}
- Todo: {exists/missing}
- Git branch: {exists/missing/N/A}
```

---

## New Task Mode Steps

### Step 1: Project Environment Detection

Determine project type by current directory's Git remote:

```bash
# Detect LOOP Vault by path
pwd | grep -q "LOOP_CORE/vault/LOOP" && echo "loop"

# Detect external project by Git remote
git remote get-url origin 2>/dev/null
```

| Remote URL / Path Pattern | target_project | Git Branch |
|---------------------------|----------------|------------|
| `LOOP_CORE/vault/LOOP` | loop | Skip |
| Contains `sosi` | sosi | Create |
| Contains `kkokkkok` | kkokkkok | Create |
| Contains `loop-api` | loop-api | Create |
| Other | Ask user | (Optional) |

### Step 2: Collect Task Info

**Collect via AskUserQuestion:**
- `entity_name` - Task name (skip if provided as argument)
- `project_id` - Project to link (select existing or create new)

**project_id collection by target:**

| target_project | How to collect project_id |
|----------------|---------------------------|
| `loop` (Vault) | Select from `50_Projects/Vault_System/Rounds/` **or create new Project** |
| `sosi` | User input or select recent Project **or create new Project** |
| `kkokkkok` | User input or select recent Project **or create new Project** |

**Project selection options (AskUserQuestion):**
```
Select Project to link:
1. [Existing Project list...]
2. ➕ Create new Project
```

### Step 2-1: Create New Project (If Selected)

> **Only run if user selects "Create new Project"**

**Create Project via loop-entity-creator:**
```yaml
entity_type: Project
entity_name: {user input}
owner: "김은향"        # default
parent_id: "trk-2"    # Default for Dev Task (Track 2: Data)
conditions_3y: ["cond-b"]  # Default (Condition B: Loop Dataset)
```

**Confirm with user:**
```
Creating new Project:
- Name: {entered name}
- Track: trk-2 (Data) - specify if different Track
- Condition: cond-b - specify if different Condition
```

**After creation:**
- Use generated `project_id` for Task creation
- Proceed to Step 3 (Git Branch Creation)

**Auto-set (no questions):**
- `type` = "dev" (fixed)
- `target_project` = detected in Step 1
- `assignee` = "김은향" (fixed)

### Step 3: Git Branch Creation (LOOP Vault + External Projects)

> **CRITICAL: Create branches BEFORE Task creation**
> **LOOP Vault (public, exec) always creates branches**
> **External projects also create branches when applicable**
> **Purpose: Prevent conflicts with `/nas-git local-sync` in parallel sessions**

#### Step 3-1: LOOP Vault Branch Creation (always)

```bash
# PUBLIC Vault branch
cd ~/dev/loop/public
git stash --include-untracked -m "auto-stash before branch: {task_id}"
git checkout main
git pull origin main
git checkout -b {task_id}
git stash pop 2>/dev/null || true

# EXEC Vault branch
cd ~/dev/loop/exec
git stash --include-untracked -m "auto-stash before branch: {task_id}"
git checkout main
git pull origin main
git checkout -b {task_id}
git stash pop 2>/dev/null || true
```

#### Step 3-2: External Project Branch Creation (when applicable)

> **Only for target_project: sosi, kkokkkok, loop-api**

```bash
cd {project_full_path}

# Update dev/main branch
git checkout dev 2>/dev/null || git checkout main
git pull origin dev 2>/dev/null || git pull origin main

# Create Task branch
git checkout -b {task_id}
```

**Project Path Mapping:**
```yaml
sosi: /Users/gim-eunhyang/dev/flutter/sosi
kkokkkok: /Users/gim-eunhyang/dev/flutter/kkokkkokfit_web
loop-api: /Volumes/LOOP_CORE/vault/LOOP
```

**Output:**
```
Git branches created:
- public vault: {task_id}
- exec vault: {task_id}
- {target_project}: {task_id} (if applicable)
```

---

## Common Steps (Both Modes)

### Step 4: Task File Creation + Worktree Sync

> **MUST: Task creation via `loop-entity-creator` skill**
> **CRITICAL: After Task API creates file on NAS main, sync and merge to worktree**

#### Step 4-1: Create Task (loop-entity-creator)

**Pass to loop-entity-creator:**
```yaml
entity_type: Task
entity_name: {collected name}
project_id: {collected project_id}
assignee: "김은향"      # fixed
type: "dev"            # fixed
target_project: {detected value}
```

#### Step 4-2: NAS Sync

> **CRITICAL: Task API creates file on NAS main branch. Must sync before editing.**

```bash
# Sync NAS → GitHub → Local main
/nas-git local-sync

# Wait for sync completion (approx 10-15 seconds)
```

#### Step 4-3: Merge main into worktree branches

> **CRITICAL: Bring Task file from main into worktree branches**

```bash
# Merge main into public vault branch
cd ~/dev/loop/public
git merge main --no-edit

# Merge main into exec vault branch
cd ~/dev/loop/exec
git merge main --no-edit

# For external projects (if applicable)
cd {project_full_path}
git merge main --no-edit 2>/dev/null || git merge dev --no-edit 2>/dev/null || true
```

**Output:**
```
Task file synced to worktree:
- Task ID: {task_id}
- Task file now available in branch for editing
```

### Step 5: PRD Writing (MANDATORY - Tech Spec Required)

> **🚨 CRITICAL: Must read parent Project file BEFORE writing Tech Spec**
> **🚨 MANDATORY: Tech Spec must follow parent Project's architecture rules**
> **Skip conditions: In Existing Task Mode, skip if Notes already filled**

#### Step 5-1: Read Parent Project File (MANDATORY FIRST)

> **NEVER skip this step. Architecture rules in Project file are SSOT.**

```bash
# Find and read the parent Project file
cat {project_path}/project.md
```

**Extract from Project file:**
- Clean Architecture structure/rules
- Coding conventions
- File naming patterns
- State management approach
- Required dependencies

**Output before proceeding:**
```
Project Architecture Rules:
- Architecture: [Clean Architecture / MVVM / etc.]
- File structure: [pattern from project.md]
- State management: [Riverpod / Bloc / etc.]
- Conventions: [naming, imports, etc.]
```

#### Step 5-2: Write Tech Spec (Following Project Rules)

> **MANDATORY: Tech Spec must align with parent Project's architecture**

Edit Task file Notes section:

```markdown
## Notes

### Tech Spec

**Architecture Compliance:**
- Parent Project: {project_id}
- Architecture Pattern: [from Project - Clean Architecture, MVVM, etc.]

**File Structure (following Project pattern):**
\`\`\`
lib/
├─ presentation/
│   └─ {feature}/
│       ├─ screens/
│       ├─ widgets/
│       └─ providers/
├─ domain/
│   ├─ entities/
│   └─ usecases/
└─ data/
    ├─ models/
    ├─ repositories/
    └─ datasources/
\`\`\`

**Implementation Details:**
- **API Endpoints**: [specific endpoints to use/create]
- **Data Models**: [entity names, fields, relationships]
- **State Management**: [specific providers/blocs]
- **Dependencies**: [packages to add]
- **Key Classes/Functions**: [main implementations]

**Edge Cases & Error Handling:**
- [case 1]
- [case 2]
```

#### Step 5-3: Write Todo

```markdown
### Todo
- [ ] [Specific implementation task 1]
- [ ] [Specific implementation task 2]
- [ ] [Specific implementation task 3]
- [ ] [Specific implementation task 4]
- [ ] Write tests
- [ ] Verify build

### Work Log
<!-- Auto-logged by workthrough skill -->
```

---

### Step 5.5: Codex PRD Feedback (MANDATORY)

> **🚨 MANDATORY: Get Codex review before proceeding**
> **Purpose: Validate PRD quality, catch issues early, save tokens in implementation**

```bash
codex -a full-auto --full-stdout -q "Review this PRD and Tech Spec. Check for:
1. Architecture alignment with parent Project
2. Missing edge cases
3. Unclear requirements
4. Implementation risks
5. Suggest improvements

Task file: {task_file_path}
Parent Project: {project_file_path}

Provide specific, actionable feedback."
```

**Wait for Codex response and note all feedback items.**

---

### Step 5.6: Update PRD with Codex Feedback (MANDATORY)

> **🚨 MANDATORY: Apply Codex feedback to Task.md**

1. Review each Codex feedback item
2. Update Tech Spec in Task.md accordingly
3. Add any missing edge cases
4. Clarify ambiguous requirements
5. Update Todo if needed

**After update, confirm:**
```
PRD Update Complete:
- [ ] Codex feedback item 1: Applied
- [ ] Codex feedback item 2: Applied
- [ ] Codex feedback item 3: Applied
- Tech Spec updated: Yes
- Todo updated: Yes/No
```

---

## 🛑 STOP POINT FOR /new-dev-task

> **🛑 CRITICAL: /new-dev-task workflow STOPS HERE**
> **NEVER proceed to Step 6 in /new-dev-task**
> **Step 6-7 are ONLY for /start-dev-task command**

**Completion message for /new-dev-task:**
```
PRD Preparation Complete!

Task ID: {task_id}
Task: {task_name}
Project: {project_id}
Worktree: {worktree_path}

PRD Status:
- Tech Spec: Written (following {project_id} architecture)
- Todo: Written
- Codex Review: Completed
- PRD Updated: Yes

---
To start implementation, run:
/start-dev-task {task_id} {worktree_path}
```

---

## /start-dev-task Only Steps

### Step 6: codex-claude-loop (MANDATORY - Cannot Skip)

> **🚨 MANDATORY: This step cannot be skipped**
> **🚨 CRITICAL: All code implementation must go through this skill**
> **🚨 NEVER: Direct code writing without codex-claude-loop is forbidden**

#### How to Call (MUST USE)

```
Use Skill tool to call codex-claude-loop:

Skill tool call:
  skill: "codex-claude-loop"
  args: "{task_id}"
```

#### Pre-call Checklist

- [ ] Git branch created or skipped (Step 3)
- [ ] Task file created + synced to worktree (Step 4)
- [ ] Parent Project file read (Step 5-1)
- [ ] Tech Spec written following Project rules (Step 5-2)
- [ ] Todo written (Step 5-3)
- [ ] Codex PRD feedback received (Step 5.5)
- [ ] PRD updated with feedback (Step 5.6)
- [ ] **Now call codex-claude-loop for implementation**

#### What codex-claude-loop Does

**Phase 1: Planning (Claude)**
- Implementation plan based on Tech Spec, Todo
- Step-by-step implementation order
- Document expected issues/risks

**Phase 2: Plan Validation (Codex)**
```bash
codex exec -m gpt-5-codex -s read-only -C /Users/gim-eunhyang/dev/loop/public -- <<'EOF'
Review this implementation plan and identify any issues:
[Claude's plan]

Check for:
- Logic errors
- Missing edge cases
- Architecture flaws
- Security concerns
EOF
```

**Phase 3: Implementation (Claude)**
- Write code according to validated plan
- Use Edit/Write/Read tools

**Phase 4: Code Review (Codex)**
- Bug detection
- Performance review
- Best practices validation

**Phase 5: Iteration**
- Fix based on Codex feedback
- Repeat until quality criteria met

#### Step 6 Completion Condition

> **Do NOT proceed to Step 7 until codex-claude-loop skill completes**

### Step 7: Validation

```bash
python3 scripts/validate_schema.py .
python3 scripts/build_graph_index.py .
```

---

## Completion Message Formats

### /new-dev-task Completion (STOP - Do NOT proceed to implementation)

```
PRD Preparation Complete!

Task ID: {task_id}
Task: {task_name}
Project: {project_id}
Type: dev
Target: {target_project}

File location: {task_file_path}
Worktree: {worktree_path}

{Git branch info - if external project}

PRD Status:
- Parent Project read: Yes
- Tech Spec: Written (following {project_id} architecture)
- Todo: Written
- Codex PRD Review: Completed
- PRD Updated: Yes

---
🛑 /new-dev-task workflow complete. Implementation NOT started.

To start implementation, run:
/start-dev-task {task_id} {worktree_path}
```

### /start-dev-task Completion

```
Implementation Complete!

Task ID: {task_id}
Task: {task_name}
Project: {project_id}
Type: {type}
Target: {target_project}

File location: {task_file_path}

Implementation:
- codex-claude-loop: Completed
- Validation: Passed

---
To finalize: /done-dev-task
```

---

## NEVER DO

- Skip steps (except conditional skips)
- Leave Notes empty without PRD writing
- **🚨 /new-dev-task proceeding to Step 6 (MOST CRITICAL)**
  - /new-dev-task MUST STOP after Step 5.6
  - Step 6-7 are ONLY for /start-dev-task
- **🚨 Direct code writing without codex-claude-loop**
  - Edit/Write tools for code without codex-claude-loop forbidden
  - Must call `codex-claude-loop` via Skill tool
  - Skipping codex-claude-loop = workflow failure
- Creating new Task in Existing Task Mode
- Proceeding without task_id validation
- Step 7 before Step 6 completion

## ALWAYS DO

- Determine mode at Step 0 first
- Confirm each step completion before proceeding
- Read parent Project file before writing Tech Spec
- Fill Notes section (Tech Spec following Project rules, Todo)
- Get Codex PRD feedback and update PRD
- **🛑 STOP after Step 5.6 in /new-dev-task and suggest /start-dev-task**
- **🚨 Call `codex-claude-loop` via Skill tool in Step 6 (/start-dev-task only)**
  - Direct implementation without skill call = workflow violation
  - Step 7 only after codex-claude-loop completion
- Output completion message

---

## Error Handling

| Situation | Action |
|-----------|--------|
| task_id not found | Show "Task not found" message |
| LOOP Vault not mounted | Show "LOOP Vault mount required" message |
| Project detection failed | AskUserQuestion for target_project |
| Git branch already exists | Checkout to that branch |
| codex command failed | Proceed with Claude only (user confirmation) |

---

## Project Mapping

```yaml
projects:
  loop:
    path_pattern: "/Volumes/LOOP_CORE/vault/LOOP"
    remote_pattern: null
    full_path: "/Volumes/LOOP_CORE/vault/LOOP"
    skip_git_branch: false  # LOOP Vault also creates branch (prevent parallel sync conflicts)

  sosi:
    path_pattern: "/sosi"
    remote_pattern: "sosi"
    full_path: "/Users/gim-eunhyang/dev/flutter/sosi"
    skip_git_branch: false

  kkokkkok:
    path_pattern: "/kkokkkokfit"
    remote_pattern: "kkokkkokfit"
    full_path: "/Users/gim-eunhyang/dev/flutter/kkokkkokfit_web"
    skip_git_branch: false

vault:
  path: "/Volumes/LOOP_CORE/vault/LOOP"
  template: "00_Meta/_TEMPLATES/template_task.md"
  projects_dir: "50_Projects"
```

---

## Related

- `/done-dev-task` - Complete Task and create PR
- `/new-task` - Create general Task (LOOP Vault only)
- `loop-entity-creator` - LOOP Vault entity creation skill
- `codex-claude-loop` - Dual AI implementation loop skill
