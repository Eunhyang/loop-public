---
description: "Build Impact"
---

# Build Impact

> Calculate Impact scores and update impact.json.

## Behavior on Execution

Runs `scripts/build_impact.py` script.

**Workflow position**: [[TEAM_WORKFLOW]] Step 6 (Auto calculation & judgment)

---

## Steps Performed

1. **Run Script**
   ```bash
   python3 scripts/build_impact.py .
   ```

2. **Auto Processing**
   - Calculate Expected Score (A) for all Projects
   - Calculate Realized Score (B) for all Evidence
   - Apply Tier policy (exclude operational)
   - Create/update impact.json file

3. **Verify Results**
   - Number of Projects processed
   - Score summary
   - Excluded Projects list (operational tier)

---

## Usage Example

```
/build-impact
```

---

## Output File

**`_build/impact.json`**

```json
{
  "model_version": "IM-2025-01",
  "generated_at": "2025-12-20T12:00:00",
  "projects": {
    "prj-010": {
      "name": "Wadiz Funding",
      "tier": "strategic",
      "expected_score": 7.0,
      "realized_score": 0.147,
      "realized_status": "failed_but_high_signal"
    }
  },
  "projects_excluded": ["prj-015"]
}
```

---

## Auto Execution Timing

Usually no need to run this command directly:

- Auto-called after `/retro` execution
- Can run via pre-commit hook on git commit

---

## Manual Execution Needed When

- After directly modifying Project frontmatter
- After directly modifying Evidence files
- When score recalculation is needed

---

## References

- [[impact_model_config]] - Score calculation settings
- `scripts/build_impact.py` - Actual script
