---
name: loop-entity-creator
description: Create, edit, and delete LOOP vault entities (Task, Project) while maintaining GraphRAG pattern integrity. Use when user wants to (1) create a new Task or Project entity, (2) edit an existing entity's fields, (3) delete an entity and update graph index. CRITICAL - This skill enforces schema compliance, automatic ID generation, parent-child linking, and graph index updates to maintain vault integrity.
---

# LOOP Entity Creator

Manage LOOP vault entities with GraphRAG pattern enforcement.

## Overview

This skill ensures Task and Project entities follow strict schema requirements and maintain proper relationships. It prevents orphaned entities by enforcing validation and automatic graph index updates.

**Supported operations:**
- **Create** - Generate new Task or Project with auto-assigned ID
- **Edit** - Modify existing entity fields while preserving schema
- **Delete** - Remove entity and update all references

## Creating Entities

### Workflow Decision Tree

**What type of entity?**
- **Task** → Follow "Creating a Task" workflow below
- **Project** → Follow "Creating a Project" workflow below

### Creating a Task

**Step 1: Collect required information**

Use AskUserQuestion to collect:

Required fields:
- `entity_name` - Task name (e.g., "CoachOS 프로토타입 개발")
- `project_id` - Parent project ID (must exist, e.g., "prj:003")
- `assignee` - Person responsible

Optional fields:
- `parent_id` - Parent task ID if this is a subtask
- `priority_flag` - "critical", "high", "medium", or "low"

**Step 2: Generate next Task ID**

1. Use Glob to find all Task files:
   ```
   pattern: 50_Projects/**/Tasks/*.md
   ```

2. Use Read to scan each file's frontmatter for `entity_id: tsk:*`

3. Find the highest ID (e.g., `tsk:003-01`)

4. Increment by 1:
   - Extract main number and sub number (003-01 → 3, 1)
   - Combined = 3 * 100 + 1 = 301
   - Next = 301 + 1 = 302
   - Format = 302 → 3 main, 2 sub → `tsk:003-02`

5. If no existing Tasks found, start with `tsk:001-01`

**Step 3: Load and populate template**

1. Read template:
   ```
   path: 00_Meta/_TEMPLATES/template_task.md
   ```

2. Replace {{PLACEHOLDERS}}:
   - `{{entity_id}}` → generated ID (e.g., `tsk:003-02`)
   - `{{entity_name}}` → user-provided name
   - `{{project_id}}` → user-provided project ID
   - `{{assignee}}` → user-provided assignee
   - `{{parent_id}}` → user-provided parent ID (if any)
   - `{{priority_flag}}` → user-provided priority (if any)
   - `{{DATE}}` → current date (YYYY-MM-DD format)

**Step 4: Determine file path**

Get project name from project_id:
1. Use Grep to find project file with `entity_id: {project_id}`
2. Read the project file to get `entity_name`
3. Construct path:
   ```
   50_Projects/{project_name}/Tasks/{entity_name}.md
   ```

**Step 5: Create file**

Use Write to save the populated template to the determined path.

**Step 6: Validate and index**

Run validation (see "Validation Workflow" section below).

### Creating a Project

**Step 1: Collect required information**

Use AskUserQuestion to collect:

Required fields:
- `entity_name` - Project name (e.g., "Ontology_v0.2")
- `owner` - Project owner
- `parent_id` - Parent Track or Hypothesis ID (e.g., "trk:2" or "hyp:005")

Optional fields:
- `priority_flag` - "critical", "high", "medium", or "low"

**Step 2: Generate next Project ID**

1. Use Glob to find all Project files:
   ```
   pattern: 50_Projects/P**/Project_정의.md
   ```

2. Use Read to scan each file's frontmatter for `entity_id: prj:*`

3. Find the highest number (e.g., `prj:003`)

4. Increment by 1:
   - Extract number (003 → 3)
   - Next = 3 + 1 = 4
   - Format = `prj:004`

5. If no existing Projects found, start with `prj:001`

**Step 3: Load and populate template**

1. Read template:
   ```
   path: 00_Meta/_TEMPLATES/template_project.md
   ```

2. Replace {{PLACEHOLDERS}}:
   - `{{entity_id}}` → generated ID (e.g., `prj:004`)
   - `{{entity_name}}` → user-provided name
   - `{{owner}}` → user-provided owner
   - `{{parent_id}}` → user-provided parent ID
   - `{{priority_flag}}` → user-provided priority (if any)
   - `{{DATE}}` → current date
   - `{{project_num}}` → extracted from ID (004)

**Step 4: Create project directory structure**

1. Create folder:
   ```
   50_Projects/P{project_num}_{entity_name}/
   ```

2. Create subfolders:
   ```
   50_Projects/P{project_num}_{entity_name}/Tasks/
   50_Projects/P{project_num}_{entity_name}/Results/
   ```

3. Save Project_정의.md:
   ```
   50_Projects/P{project_num}_{entity_name}/Project_정의.md
   ```

**Step 5: Validate and index**

Run validation (see "Validation Workflow" section below).

## Editing Entities

**Step 1: Find the entity**

Ask user which entity to edit (name or ID).

Use Glob to find:
```
pattern: **/{entity_name}.md
or search by entity_id using Grep
```

**Step 2: Show current values**

Read the file and display current frontmatter fields.

**Step 3: Collect changes**

Use AskUserQuestion with current values as defaults:
- Show each field with current value
- User can press Enter to keep current value
- Or type new value to change

**Step 4: Update file**

Use Edit to update the frontmatter fields:
- Replace old values with new values
- Update `updated` field to current date

**Step 5: Validate and index**

Run validation (see "Validation Workflow" section below).

## Deleting Entities

**Step 1: Find the entity**

Ask user which entity to delete (name or ID).

Use Glob/Grep to find the file.

**Step 2: Check for dependencies**

1. Read the file to get `entity_id`

2. Use Grep to search for references to this ID:
   ```
   pattern: parent_id.*{entity_id}
   pattern: project_id.*{entity_id}
   ```

3. If dependencies found:
   - List all dependent entities
   - Warn user that deletion will create orphans
   - Ask for confirmation

**Step 3: Confirm deletion**

Use AskUserQuestion to confirm:
```
Are you sure you want to delete {entity_name} ({entity_id})?
This action cannot be undone.
```

**Step 4: Delete file**

Use Bash to remove the file:
```bash
rm "path/to/entity.md"
```

For Projects, also remove the entire directory:
```bash
rm -r "50_Projects/P{num}_{name}/"
```

**Step 5: Update graph index**

Run only the graph index update (skip validation):
```bash
python3 scripts/build_graph_index.py .
```

## Validation Workflow

After any create or edit operation, always run these three steps:

**Step 1: Schema validation**

```bash
python3 scripts/validate_schema.py .
```

If errors found:
- Display error messages
- File is still created/edited
- User can fix manually or re-run creation

**Step 2: Orphan check**

```bash
python3 scripts/check_orphans.py .
```

If warnings found:
- Display warnings about missing parent/project references
- File is still created/edited
- User should create missing entities or update links

**Step 3: Graph index update**

```bash
python3 scripts/build_graph_index.py .
```

This regenerates `_Graph_Index.md` with latest entity relationships.

## Field Requirements Reference

For detailed field requirements per entity type, see:
- `references/field_requirements.md` - Required/optional fields, descriptions, examples

## Entity Patterns Reference

For ID patterns and file placement rules, see:
- `references/entity_patterns.md` - ID format rules, file path patterns

## Quick Examples

**Create a Task:**
```
User: "코치OS 인터페이스 설계 태스크 만들어줘"
→ Collect: project_id, assignee
→ Generate: tsk:005-03
→ Create: 50_Projects/CoachOS_Phase1/Tasks/코치OS_인터페이스_설계.md
→ Validate and index
```

**Create a Project:**
```
User: "패턴 발견 v2 프로젝트 만들어줘"
→ Collect: owner, parent_id
→ Generate: prj:008
→ Create: 50_Projects/P008_Pattern_Discovery_v2/
→ Validate and index
```

**Edit a Task:**
```
User: "tsk:003-01 담당자를 김코치로 바꿔줘"
→ Find file
→ Read current values
→ Update assignee field
→ Validate and index
```

**Delete a Project:**
```
User: "prj:005 프로젝트 삭제해줘"
→ Find project
→ Check dependencies (any Tasks?)
→ Confirm with user
→ Delete directory
→ Update graph index
```