---
description: "New Task"
---

# New Task

> Create a new task.

## Behavior on Execution

This command runs `loop-entity-creator` skill in **Task creation mode**.

**Workflow position**: [[TEAM_WORKFLOW]] Step 3 (Execution phase)

---

## Steps Performed

1. **Information Collection**
   - Task name (entity_name)
   - Project ID (project_id) - required
   - Assignee (assignee) - select from members.yaml
   - Parent task ID (parent_id) - optional
   - Priority (priority_flag) - optional

2. **Auto Processing**
   - Auto-generate next Task ID (tsk-NNN-NN)
   - Create Task file
   - Run Schema validation
   - Update Graph index

3. **Verify Results**
   - Display created file path
   - Display validation results

---

## Usage Examples

```
User: Create a task for detail page creation

/new-task
```

Or:

```
/new-task Add ad creative task to prj-010
```

---

## Task Characteristics

- Strategic judgment ❌ (Project only)
- Impact fields ❌ (Project only)
- Execution records only ⭕

> Tasks can be many, and however trivial is fine.

---

## References

- [[TEAM_GUIDE_Task_Project_생성#Task 만들기]] - Detailed guide
- `loop-entity-creator` skill - Actual execution logic
