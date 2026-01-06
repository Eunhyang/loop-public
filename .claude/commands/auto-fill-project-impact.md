# Auto-fill Project Impact

> LLM suggests Expected Impact (A) fields for Project.

---

## Behavior on Execution

This command runs `auto-fill-project-impact` skill.

**Workflow position**: [[TEAM_WORKFLOW]] Step 2 (Strategic bet declaration)

> The moment you Accept, this Project becomes **"a strategic bet we decided to take"**.

---

## Steps Performed

1. **Check Project**
   - Read Project document
   - Check existing Impact fields

2. **Collect Context**
   - Read connected Track/Hypothesis
   - Check related Conditions
   - NorthStar/MH summary

3. **Suggest Impact Fields** (LLM)
   - `tier` judgment (strategic/enabling/operational)
   - `impact_magnitude` suggestion (high/mid/low)
   - `confidence` suggestion (0.0-1.0)
   - `contributes` structure suggestion

4. **Show Preview**
   - Display suggested field values
   - Display calculated ExpectedScore
   - Display judgment rationale

5. **User Confirmation**
   - Accept → Update Project frontmatter
   - Edit → Modify fields and reconfirm
   - Cancel → Abort

6. **Save and Build**
   - Update Project file
   - Run build_impact.py (optional)

---

## Usage Examples

**Method 1: With context**
```
I'm starting a Wadiz crowdfunding project.
Target is 12M KRW revenue, validating online coaching market.

/auto-fill-project-impact
```

**Method 2: Specify Project ID**
```
/auto-fill-project-impact prj-010
```

---

## Impact Fields Summary

| Field | Description | Example |
|------|------|------|
| `tier` | Strategic position | strategic, enabling, operational |
| `impact_magnitude` | Impact size | high, mid, low |
| `confidence` | Execution feasibility | 0.0 ~ 1.0 |
| `contributes` | Contributing Conditions | cond-a, cond-b, ... |

---

## ExpectedScore Calculation

```
ExpectedScore = magnitude_points[tier][magnitude] × confidence
```

**Example:**
```
tier: strategic, magnitude: high → 10 points
confidence: 0.6

ExpectedScore = 10 × 0.6 = 6.0
```

---

## Next Steps

After Impact fill complete:
1. `/new-task` to add detailed tasks
2. Execute project
3. After completion `/retro` for retrospective → Evidence conversion

---

## References

- `auto-fill-project-impact` skill - Actual execution logic
- [[impact_model_config]] - Score calculation settings
- [[TEAM_WORKFLOW]] - Full workflow
