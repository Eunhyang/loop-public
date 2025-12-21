---
name: llm-vault-optimizer
description: Optimize LOOP vault structure for LLM navigation. Use when (1) improving vault discoverability for LLMs, (2) creating index files or query recipes, (3) adding strategic link fields like conditions_3y, (4) strengthening validation rules for merge gates. This skill ensures LLMs can trace any query in O(1)-O(2) steps.
---

# LLM Vault Optimizer

Optimize LOOP vault for LLM-first navigation and query resolution.

## Overview

This skill implements a systematic approach to make the vault optimally navigable by LLMs. The goal: any LLM entering this vault should resolve any query in 1-2 file reads, not 8-15.

## Core Principle

**LLM friction comes from "where to start", not "what information exists".**

Solution: Fixed entry points + Query recipes + Redundant link paths.

## Implementation Plan

See `references/implementation_plan.md` for the complete P0/P1/P2 roadmap.

## Workflows

### 1. Upgrade _ENTRY_POINT.md (P0)

Transform from informational document to **LLM boot protocol**.

Required 6 sections-
1. **Vault Goal** (1 sentence)
2. **Entity Types + Canonical Locations** (table)
3. **Mandatory Link Rules** (Task must link to Project/Condition)
4. **Global Map Link** (`_Graph_Index.md`)
5. **Schema/Relation Links** (`00_Meta/schema_registry.md`, `00_Meta/relation_types.md`)
6. **Query Recipes** (question → file reading order)

### 2. Create Strategy Index (P0)

Create `20_Strategy/3Y_Conditions_{period}/_INDEX.md`:
- List all Conditions by ID (cond-a through cond-e)
- Link to each Condition document
- Show inter-Condition relationships

### 3. Create Query Recipes (P0)

Create `00_Meta/query_recipes.md`:

Example recipe:
```
Q: "3년 전략 전부 요약"
1. _ENTRY_POINT.md
2. 20_Strategy/3Y_Conditions/_INDEX.md
3. Each Condition_*.md
4. 50_Projects/_INDEX.md (filter by conditions_3y)
5. Matching Project Tasks only
```

### 4. Add conditions_3y Field (P1)

Add to templates:
- `00_Meta/_TEMPLATES/template_task.md`
- `00_Meta/_TEMPLATES/template_project.md`
- `00_Meta/_TEMPLATES/template_hypothesis.md`

Field spec:
```yaml
conditions_3y: ["cond-a", "cond-b"]  # Required, min 1 item
```

### 5. Update Validation Scripts (P1)

Modify `scripts/validate_schema.py`:
- Add `conditions_3y` to required fields for Task/Project/Track
- Validate that referenced Condition IDs exist

Modify `scripts/check_orphans.py`:
- Change from warning-only to blocking mode
- Check conditions_3y references

### 6. Generate graph.json (P2)

Modify `scripts/build_graph_index.py`:
- Output `_Graph_Index.md` (human-readable)
- Output `_build/graph.json` (LLM-optimized)

JSON structure:
```json
{
  "nodes": [...],
  "edges": [...],
  "conditions_3y_index": {...}
}
```

## Validation Checklist

After implementation, verify:

- [ ] LLM can answer "3년 전략 전부" in 2-3 file reads
- [ ] All Tasks have conditions_3y field
- [ ] Orphan check blocks commits with broken links
- [ ] Query recipes cover top 5 common questions
- [ ] _ENTRY_POINT.md has all 6 required sections

## References

- `references/implementation_plan.md` - Detailed P0/P1/P2 roadmap with file paths