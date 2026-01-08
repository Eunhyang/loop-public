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

2. **Local ID Conflict Check (MANDATORY)**

   > **CRITICAL: This step is MANDATORY and cannot be skipped.**
   > API cache may be out of sync with local files. Always check local state first.

   **Before generating Task ID, you MUST:**

   1. Read the Project file to get current `tasks[]` array
   2. Parse all existing task IDs from the array
   3. Determine local max ID (e.g., if tasks[] contains `tsk-023-05`, local max = 5)
   4. Query API for next available ID
   5. Use `max(local_max_id, api_id) + 1` as the new Task ID

   **Example:**
   ```
   Project tasks[]: ["tsk-023-01", "tsk-023-02", "tsk-023-03"]
   Local max ID: 3
   API returns: tsk-023-02 (stale cache)

   Correct ID: tsk-023-04 (max(3, 2) + 1)
   ```

   **FORBIDDEN:**
   - ❌ Using API-returned ID without local check
   - ❌ Skipping this step for any reason
   - ❌ Assuming API cache is always current

3. **Auto Processing**
   - Generate Task ID using conflict-safe logic from Step 2
   - Create Task file
   - Run Schema validation
   - Update Graph index

4. **Verify Results**
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
