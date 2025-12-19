# Entity Patterns

ID patterns and file placement rules for LOOP vault entities.

## ID Patterns

### Task ID Pattern

**Format**: `tsk:NNN-NN`

**Structure**:
- Prefix: `tsk:`
- Main number: `NNN` (001-999)
- Separator: `-`
- Sub number: `NN` (01-99)

**Examples**:
- `tsk:001-01` - First task
- `tsk:003-15` - 15th task in main group 3
- `tsk:042-03` - 3rd task in main group 42

**Auto-generation logic**:
1. Scan all existing Task files
2. Extract highest ID (e.g., `tsk:015-07`)
3. Convert to combined number: 15 * 100 + 7 = 1507
4. Increment: 1507 + 1 = 1508
5. Convert back: 1508 → 15 main, 08 sub → `tsk:015-08`

### Project ID Pattern

**Format**: `prj:NNN`

**Structure**:
- Prefix: `prj:`
- Number: `NNN` (001-999)

**Examples**:
- `prj:001` - First project
- `prj:015` - 15th project
- `prj:042` - 42nd project

**Auto-generation logic**:
1. Scan all existing Project files
2. Extract highest number (e.g., 15 from `prj:015`)
3. Increment: 15 + 1 = 16
4. Format: `prj:016`

## File Placement Rules

### Task Files

**Location pattern**:
```
50_Projects/{project_name}/Tasks/{entity_name}.md
```

**Example**:
```
Task: "CoachOS 인터페이스 설계"
Project: "P003_CoachOS_Phase1"
→ File: 50_Projects/P003_CoachOS_Phase1/Tasks/CoachOS_인터페이스_설계.md
```

**How to determine project_name**:
1. User provides `project_id` (e.g., "prj:003")
2. Use Grep to find file with `entity_id: prj:003`
3. Read project file to get project folder name (e.g., "P003_CoachOS_Phase1")
4. Construct task path using that folder name

### Project Files

**Location pattern**:
```
50_Projects/P{project_num}_{entity_name}/Project_정의.md
```

**Project directory structure**:
```
50_Projects/P{project_num}_{entity_name}/
├── Project_정의.md         # Main project document
├── Tasks/                  # Task files go here
└── Results/                # Project results
```

**Example**:
```
Project: "Ontology_v0.2"
ID: prj:008
→ Folder: 50_Projects/P008_Ontology_v0.2/
→ File: 50_Projects/P008_Ontology_v0.2/Project_정의.md
```

**How to extract project_num**:
- From `prj:008` → extract `008`
- Use as folder prefix: `P008_`

## Template Placeholders

### Task Template Placeholders

Templates use `{{PLACEHOLDER}}` format. Replace with actual values:

| Placeholder | Source | Example |
|-------------|--------|---------|
| `{{entity_id}}` | Auto-generated | "tsk:005-03" |
| `{{entity_name}}` | User input | "코치OS 프로토타입 개발" |
| `{{project_id}}` | User input | "prj:003" |
| `{{assignee}}` | User input | "김코치" |
| `{{parent_id}}` | User input (optional) | "tsk:002-01" or "" |
| `{{priority_flag}}` | User input (optional) | "high" or "medium" |
| `{{DATE}}` | Current date | "2025-12-18" |

### Project Template Placeholders

| Placeholder | Source | Example |
|-------------|--------|---------|
| `{{entity_id}}` | Auto-generated | "prj:008" |
| `{{entity_name}}` | User input | "Ontology_v0.2" |
| `{{owner}}` | User input | "김개발" |
| `{{parent_id}}` | User input | "trk:2" or "hyp:005" |
| `{{priority_flag}}` | User input (optional) | "critical" |
| `{{project_num}}` | Extracted from entity_id | "008" |
| `{{DATE}}` | Current date | "2025-12-18" |

## Frontmatter Structure

### Task Frontmatter Example

```yaml
---
entity_type: Task
entity_id: tsk:005-03
entity_name: CoachOS_프로토타입_개발
created: 2025-12-18
updated: 2025-12-18
status: planning

# Hierarchy
parent_id: null
project_id: prj:003

# Assignment
assignee: 김코치

# Classification
tags: [task, coachos]
priority_flag: high
---
```

### Project Frontmatter Example

```yaml
---
entity_type: Project
entity_id: prj:008
entity_name: Ontology_v0.2
created: 2025-12-18
updated: 2025-12-18
status: planning

# Hierarchy
parent_id: trk:2

# Assignment
owner: 김개발

# Classification
tags: [project, ontology]
priority_flag: critical
---
```

## Schema Validation Rules

The validation script (`scripts/validate_schema.py`) checks:

1. **Required fields present**: All required fields exist in frontmatter
2. **ID format valid**: Matches the pattern for entity type
3. **Status valid**: One of the allowed status values
4. **Date format valid**: YYYY-MM-DD format

The orphan check script (`scripts/check_orphans.py`) checks:

1. **parent_id exists**: Referenced parent entity file exists
2. **project_id exists**: Referenced project entity file exists
3. **Link symmetry**: If A references B, B should acknowledge A