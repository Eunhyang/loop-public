# New Project

> Create a new project.

---

## Behavior on Execution

This command runs `loop-entity-creator` skill in **Project creation mode**.

**Workflow position**: [[TEAM_WORKFLOW]] Step 1 (Work initiation)

---

## Steps Performed

1. **Information Collection**
   - Project name (entity_name)
   - Owner (owner) - select from members.yaml
   - Parent Track ID (parent_id) - **required**
   - Contributing Conditions (conditions_3y) - **required** (e.g., ["cond-a", "cond-b"])
   - Validating hypothesis (hypothesis_id) - optional
   - Priority (priority_flag) - optional
   - Program ID (program_id) - if under a Program
   - Cycle (cycle) - if under Program (e.g., "W33", "2026Q1")

   > **CRITICAL**: Projects under Program must also connect to Track and Condition.
   > Without connection, becomes orphan project in strategic hierarchy.

2. **Expected Impact Setup** (integrated)
   - **Auto-fill** → LLM suggests tier/magnitude/confidence
   - **Set to None** → operational project not needing Impact calculation
   - **Fill later** → create with null for now

3. **Auto Processing**
   - Auto-generate next Project ID (prj-NNN)
   - Create project folder structure
   - Create project.md file (includes expected_impact)
   - Run Schema validation
   - Update Graph index

4. **Verify Results**
   - Display created file path
   - Display validation results

---

## Usage Examples

```
User: I'm starting a Wadiz crowdfunding project. Target is 12M KRW revenue,
      first crowdfunding test for coaching service.

/new-project
```

Or:

```
/new-project Pattern Discovery v2 project
```

---

## Next Steps

After project creation:
1. `/new-task` to add detailed tasks
2. (Optional) If Impact set to "later" → run `/auto-fill-project-impact`

---

## References

- [[TEAM_GUIDE_Task_Project_생성#Project 만들기]] - Detailed guide
- `loop-entity-creator` skill - Actual execution logic
