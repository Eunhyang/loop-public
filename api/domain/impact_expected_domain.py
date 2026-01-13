"""
Impact Expected Domain Layer - Pure Validation Rules

Pure business logic for Expected Impact validation.
No dependencies on infrastructure (API, database, vault, etc.).

Codex Review Improvements:
- Combined weight validation for condition + track contributes
- Per-item weight range checks [0.0, 1.0]
- Strategic tier validation includes primary_hypothesis_id checks
- Entity reference validation covers all contribute lists
- Duplicate detection in validates/contributes
- Confidence range validation [0.0, 1.0]
- Required field validation includes primary_hypothesis_id for strategic tier
"""

from typing import List, Dict, Optional, Any


def validate_confidence_range(confidence: float) -> Optional[str]:
    """
    Validate confidence is in [0.0, 1.0] range.

    Args:
        confidence: Confidence value to validate

    Returns:
        Error message if invalid, None if valid
    """
    if not (0.0 <= confidence <= 1.0):
        return f"Confidence {confidence} out of range [0.0, 1.0]"
    return None


def validate_weight_sum(
    condition_contributes: List[Dict[str, Any]],
    track_contributes: List[Dict[str, Any]]
) -> Optional[str]:
    """
    Validate combined weight sum <= 1.0 for both contribute lists.
    Also validates each individual weight is in [0.0, 1.0].

    Args:
        condition_contributes: List of condition contribution items
        track_contributes: List of track contribution items

    Returns:
        Error message if invalid, None if valid
    """
    all_weights = []

    # Validate condition_contributes
    for item in condition_contributes:
        weight = item.get('weight', 0.0)
        if not (0.0 <= weight <= 1.0):
            cond_id = item.get('condition_id', 'unknown')
            return f"Invalid weight {weight} for condition '{cond_id}' - must be in [0.0, 1.0]"
        all_weights.append(weight)

    # Validate track_contributes
    for item in track_contributes:
        weight = item.get('weight', 0.0)
        if not (0.0 <= weight <= 1.0):
            track_id = item.get('track_id', 'unknown')
            return f"Invalid weight {weight} for track '{track_id}' - must be in [0.0, 1.0]"
        all_weights.append(weight)

    # Validate total sum
    total = sum(all_weights)
    if total > 1.0:
        cond_sum = sum(c.get('weight', 0.0) for c in condition_contributes)
        track_sum = sum(t.get('weight', 0.0) for t in track_contributes)
        return f"Total weight sum {total:.2f} exceeds 1.0 (condition: {cond_sum:.2f}, track: {track_sum:.2f})"

    return None


def validate_strategic_hypotheses(
    tier: str,
    validates: Optional[List[str]],
    primary_hypothesis_id: Optional[str]
) -> Optional[str]:
    """
    Validate strategic tier requirements for hypothesis linking.

    For strategic tier:
    - validates must be a non-None, non-empty list
    - primary_hypothesis_id must exist
    - primary_hypothesis_id must be in validates list

    Args:
        tier: Impact tier (strategic, enabling, operational)
        validates: List of hypothesis IDs being validated
        primary_hypothesis_id: Primary hypothesis being tested

    Returns:
        Error message if invalid, None if valid
    """
    if tier != "strategic":
        return None

    # Check validates is not None and is a list
    if validates is None or not isinstance(validates, list):
        return "Strategic tier requires 'validates' to be a non-empty list"

    # Check validates has at least 1 item
    if len(validates) == 0:
        return "Strategic tier requires at least 1 hypothesis in 'validates'"

    # Check primary_hypothesis_id exists
    if not primary_hypothesis_id:
        return "Strategic tier requires 'primary_hypothesis_id'"

    # Check primary is in validates
    if primary_hypothesis_id not in validates:
        return f"primary_hypothesis_id '{primary_hypothesis_id}' must be in validates list"

    return None


def validate_entity_refs(
    validates: Optional[List[str]],
    primary_hypothesis_id: Optional[str],
    condition_contributes: List[Dict[str, Any]],
    track_contributes: List[Dict[str, Any]],
    vault_entities: Dict[str, Dict[str, Any]]
) -> List[str]:
    """
    Validate all entity references exist in vault.
    Checks for duplicates and validates against vault cache.

    Validates:
    - Hypothesis IDs in validates list
    - Primary hypothesis ID
    - Condition IDs in condition_contributes
    - Track IDs in track_contributes

    Args:
        validates: List of hypothesis IDs
        primary_hypothesis_id: Primary hypothesis ID
        condition_contributes: Condition contribution items
        track_contributes: Track contribution items
        vault_entities: Dict with 'hypotheses', 'conditions', 'tracks' keys

    Returns:
        List of error messages (empty if all valid)
    """
    errors = []

    # Get available entities by type
    hypotheses = vault_entities.get('hypotheses', {})
    conditions = vault_entities.get('conditions', {})
    tracks = vault_entities.get('tracks', {})

    # Validate hypothesis IDs in validates
    if validates:
        seen_hyps = set()
        for hyp_id in validates:
            if hyp_id in seen_hyps:
                errors.append(f"Duplicate hypothesis ID in validates: {hyp_id}")
            seen_hyps.add(hyp_id)

            if hyp_id not in hypotheses:
                errors.append(f"Hypothesis '{hyp_id}' not found in vault")

    # Validate primary_hypothesis_id
    if primary_hypothesis_id:
        if primary_hypothesis_id not in hypotheses:
            errors.append(f"Primary hypothesis '{primary_hypothesis_id}' not found in vault")

    # Validate condition IDs
    seen_conds = set()
    for item in condition_contributes:
        cond_id = item.get('condition_id')
        if not cond_id:
            continue

        if cond_id in seen_conds:
            errors.append(f"Duplicate condition ID in contributes: {cond_id}")
        seen_conds.add(cond_id)

        if cond_id not in conditions:
            errors.append(f"Condition '{cond_id}' not found in vault")

    # Validate track IDs
    seen_tracks = set()
    for item in track_contributes:
        track_id = item.get('track_id')
        if not track_id:
            continue

        if track_id in seen_tracks:
            errors.append(f"Duplicate track ID in contributes: {track_id}")
        seen_tracks.add(track_id)

        if track_id not in tracks:
            errors.append(f"Track '{track_id}' not found in vault")

    return errors


def validate_required_fields(
    tier: Optional[str],
    impact_magnitude: Optional[str],
    confidence: Optional[float],
    summary: Optional[str],
    primary_hypothesis_id: Optional[str]
) -> List[str]:
    """
    Validate required fields are present and not None/empty.

    Required for all tiers:
    - tier
    - impact_magnitude
    - confidence
    - summary (must not be empty string)

    Required for strategic tier:
    - primary_hypothesis_id

    Args:
        tier: Impact tier
        impact_magnitude: Impact magnitude
        confidence: Confidence value
        summary: Impact summary
        primary_hypothesis_id: Primary hypothesis ID

    Returns:
        List of error messages (empty if all valid)
    """
    errors = []

    if not tier:
        errors.append("Missing required field: tier")

    if not impact_magnitude:
        errors.append("Missing required field: impact_magnitude")

    if confidence is None:
        errors.append("Missing required field: confidence")

    if not summary or (isinstance(summary, str) and summary.strip() == ""):
        errors.append("Missing or empty required field: summary")

    # Strategic tier requires primary_hypothesis_id
    if tier == "strategic" and not primary_hypothesis_id:
        errors.append("Strategic tier requires primary_hypothesis_id")

    return errors
