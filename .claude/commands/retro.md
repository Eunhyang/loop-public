---
description: "Retrospective to Evidence"
---

# Retrospective to Evidence

> Convert retrospective document to structured Evidence.

## Behavior on Execution

This command runs `retrospective-to-evidence` skill.

**Workflow position**: [[TEAM_WORKFLOW]] Step 5 (Key transition point)

> **This step is the heart of the entire system.**

---

## Steps Performed

1. **Collect Input**
   - Retrospective document path (or auto-detect from context above)
   - Project ID (prj-NNN)
   - Key metrics (target vs actual)

2. **Analyze Retrospective** (LLM)
   - Extract quantitative data
   - Extract falsified hypotheses
   - Extract confirmed insights
   - Judge learning value

3. **Map Evidence Fields** (LLM suggestion)
   - normalized_delta (achievement rate vs target)
   - evidence_strength (evidence strength)
   - attribution_share (contribution ratio)
   - learning_value (learning value)
   - realized_status (judgment)

4. **Show Preview**
   - Display extracted field values
   - Display calculated RealizedScore
   - Display judgment rationale

5. **User Confirmation**
   - Accept → Create Evidence file
   - Edit → Modify fields and reconfirm
   - Cancel → Abort

6. **Save and Build**
   - Create Evidence file
   - Auto-run build_impact.py

---

## Usage Example

```
## Wadiz Funding Retrospective

### Results
- Target: 12M KRW revenue
- Actual: 2.5M KRW revenue

### What went well
- Achieved top 1% in pre-order signups

### What didn't go well
- Conversion rate 0.97%, lower than expected

### What we learned
- Brand story-focused persuasion doesn't work on Wadiz

/retro
```

---

## LLM's Role

- **What LLM does**: Suggest judgment materials (field values + rationale)
- **What LLM doesn't do**: Calculate scores directly

> "Calculations by code, judgments by humans"

---

## realized_status Judgment Criteria

| Status | Condition |
|------|------|
| `succeeded` | normalized_delta >= 0.8 |
| `failed_but_high_signal` | delta < 0.5 AND learning_value = high |
| `failed_low_signal` | delta < 0.5 AND learning_value = low |
| `inconclusive` | attribution_share < 0.3 |

---

## References

- `retrospective-to-evidence` skill - Actual execution logic
- [[template_evidence]] - Evidence template
- [[impact_model_config]] - Score calculation settings
