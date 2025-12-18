---
name: loop-entity-creator
description: Create LOOP vault entities (Task, Project, Hypothesis, Condition, Track, MetaHypothesis) while maintaining GraphRAG pattern integrity. Use when the user wants to create any new entity markdown file in the LOOP vault. CRITICAL - NEVER create entity markdown files manually; always use this skill to ensure schema compliance, proper entity linking, automatic ID generation, and graph index updates.
---

# LOOP Entity Creator

Create structured entity documents that maintain GraphRAG patterns and ontology-strategy relationships.

## Overview

This skill ensures all LOOP vault entities follow strict schema requirements, maintain proper parent-child relationships, and keep the graph index updated. It prevents orphaned entities and broken links by enforcing template usage and automatic validation.

## Workflow

All entity creation follows this process:

1. **Identify entity type** - Determine which entity to create (Task/Project/Hypothesis/Condition/Track/MetaHypothesis)
2. **Collect required information** - Gather mandatory fields through interactive dialogue
3. **Generate entity** - Create file with proper schema and auto-generated ID
4. **Validate and index** - Run schema validation, orphan check, and update graph index

## Creating Entities

### Step 1: Run Creation Script

Execute the creation script with the desired entity type:

```bash
python3 scripts/create_entity.py --type <entity-type>
```

Valid entity types:
- `task` - Execution unit (Task)
- `project` - Experiment unit (Project)
- `hypothesis` - Validation hypothesis (Hypothesis)
- `condition` - 3-year condition (Condition)
- `track` - 12-month track (Track)
- `metahypothesis` - Meta hypothesis (MetaHypothesis)

### Step 2: Provide Required Information

The script will interactively prompt for:

**Common fields (all entities):**
- `entity_name` - Human-readable name
- `status` - Current status (planning/active/done/etc.)

**Entity-specific fields:**
- See `references/field_requirements.md` for complete field list per entity type

**Auto-generated fields:**
- `entity_id` - Automatically assigned (e.g., `tsk:001-01`, `prj:003`)
- `created` / `updated` - Current timestamp
- File path - Based on entity type and parent relationships

### Step 3: Automatic Validation

After creation, the script automatically:

1. **Validates schema** - Runs `validate_schema.py` to check frontmatter
2. **Checks orphans** - Runs `check_orphans.py` to verify all links exist
3. **Updates graph** - Runs `build_graph_index.py` to regenerate `_Graph_Index.md`

If validation fails, the file is created but warnings are displayed. Fix the issues manually or re-run creation.

## Key Features

### Template-Based Generation

All entities use templates from `00_Meta/_TEMPLATES/`:
- `template_task.md`
- `template_project.md`
- `template_hypothesis.md`
- `template_condition.md`
- `template_track.md`
- `template_metahypothesis.md`

Templates include `{{PLACEHOLDERS}}` that are automatically replaced with collected values.

### Automatic ID Assignment

The script scans existing entities and assigns the next available ID:

| Entity Type | ID Pattern | Example |
|-------------|-----------|---------|
| Task | `tsk:NNN-NN` | `tsk:003-01` |
| Project | `prj:NNN` | `prj:005` |
| Hypothesis | `hyp:NNN` | `hyp:012` |
| Condition | `cond:a-e` | `cond:b` |
| Track | `trk:1-6` | `trk:2` |
| MetaHypothesis | `mh:1-4` | `mh:3` |

### File Placement Rules

Entities are saved to appropriate locations:

| Entity Type | Location Pattern |
|-------------|------------------|
| Task | `50_Projects/{ProjectName}/Tasks/{task_name}.md` |
| Project | `50_Projects/P{N}_{ProjectName}/Project_정의.md` |
| Hypothesis | `60_Hypotheses/H_{hypothesis_name}.md` |
| Condition | `20_Strategy/3Y_Conditions/Condition_{letter}_{name}.md` |
| Track | `20_Strategy/12M_Tracks/Track_{number}_{name}.md` |
| MetaHypothesis | `01_North_Star/MH{number}_{name}.md` |

### GraphRAG Pattern Enforcement

The skill enforces critical GraphRAG patterns:

1. **Parent-child linking** - All entities must link to parent (except NorthStar)
2. **Relation types** - Uses standard relation types from `00_Meta/relation_types.md`
3. **Schema compliance** - Follows `00_Meta/schema_registry.md` requirements
4. **Graph indexing** - Updates `_Graph_Index.md` for LLM navigation

## Error Handling

**If validation fails:**
1. File is created but flagged
2. Error messages show which fields are invalid
3. Fix manually or delete and re-create

**If orphan check warns:**
1. File is created but warning displayed
2. Linked parent/project/hypothesis may not exist
3. Create missing entities or update links

**If ID conflict occurs:**
1. Script detects existing ID
2. Automatically increments to next available
3. No user action needed

## Quick Reference

**Create a Task:**
```bash
python3 scripts/create_entity.py --type task
```

**Create a Project:**
```bash
python3 scripts/create_entity.py --type project
```

**Validate existing entities:**
```bash
python3 scripts/validate_and_index.py
```

**Get next available ID:**
```bash
python3 scripts/get_next_id.py --type task
```

## Resources

This skill includes:

### scripts/
- `create_entity.py` - Main entity creation script
- `validate_and_index.py` - Run validation and indexing
- `get_next_id.py` - Get next available entity ID

### references/
- `field_requirements.md` - Required fields per entity type
- `template_mapping.md` - Template selection guide

No assets needed for this skill.