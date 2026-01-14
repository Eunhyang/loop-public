"""
Impact Expected Service Layer

Application logic for Expected Impact:
- Context building for LLM
- LLM output normalization
- Validation using domain rules
- Calculated fields via impact_calculator

Codex Review Improvements:
- Parent chain with cycle detection
- Dynamic impact model version from config
- Robust LLM output parsing (JSON + text)
- Schema version mismatch warnings
- Comprehensive error handling
"""

import json
import logging
from typing import Dict, List, Any, Optional, Union
from pathlib import Path

from ..models.impact_expected import (
    ImpactExpectedContext,
    ImpactExpectedOutput,
    ProjectContext,
    OutputContract,
    ScoringContext,
    ValidationError,
    ContributeItem
)
from ..domain import impact_expected_domain as domain
from ..cache import get_cache
from ..utils.impact_calculator import (
    load_impact_config,
    calculate_expected_score_with_breakdown
)

logger = logging.getLogger(__name__)


# ============================================
# Constants
# ============================================

SCHEMA_VERSION = "v2"
OUTPUT_SCHEMA_VERSION = "v5.3"


# ============================================
# Context Building
# ============================================

def get_impact_model_version() -> str:
    """Get impact model version from config (dynamic)"""
    try:
        config = load_impact_config()
        return config.get('version', '1.3.1')
    except Exception as e:
        logger.warning(f"Failed to load impact model version: {e}, using default 1.3.1")
        return "1.3.1"


def build_parent_chain(project: Dict[str, Any]) -> List[str]:
    """
    Build parent chain with cycle detection.

    Order: [track_id, ...conditions_3y]

    Args:
        project: Project data dict

    Returns:
        Parent chain list

    Raises:
        ValueError: If cycle detected
    """
    parent_chain = []
    visited = set()

    # Add track
    if project.get('track_id'):
        track_id = project['track_id']
        if track_id in visited:
            raise ValueError(f"Cycle detected in parent chain: {track_id}")
        parent_chain.append(track_id)
        visited.add(track_id)

    # Add conditions
    for cond_id in (project.get('conditions_3y') or []):
        if cond_id in visited:
            raise ValueError(f"Cycle detected in parent chain: {cond_id}")
        parent_chain.append(cond_id)
        visited.add(cond_id)

    return parent_chain


def build_expected_context(project_id: str) -> ImpactExpectedContext:
    """
    Build unified context for LLM inference (external or internal).

    Loads project from vault cache and constructs complete context
    including scoring rules, output requirements, and parent hierarchy.

    Args:
        project_id: Project entity ID

    Returns:
        ImpactExpectedContext for LLM

    Raises:
        ValueError: If project not found or invalid data
    """
    cache = get_cache()
    project = cache.get_project(project_id)

    if not project:
        raise ValueError(f"Project {project_id} not found in vault")

    # Build parent chain with cycle detection
    try:
        parent_chain = build_parent_chain(project)
    except ValueError as e:
        logger.error(f"Failed to build parent chain for {project_id}: {e}")
        raise

    # Load impact model config
    try:
        config = load_impact_config()
        tier_points = config.get('magnitude_points', {})
        # TODO: Load display_rules from config when available
        display_rules = {}
    except Exception as e:
        logger.error(f"Failed to load impact config: {e}")
        raise ValueError(f"Failed to load impact configuration: {e}")

    # Build context
    context = ImpactExpectedContext(
        schema_version=SCHEMA_VERSION,
        impact_model_version=get_impact_model_version(),
        project=ProjectContext(
            entity_id=project.get('entity_id', project_id),
            entity_name=project.get('entity_name', ''),
            description=project.get('description'),
            conditions_3y=project.get('conditions_3y', []),
            track_id=project.get('track_id'),
            parent_chain=parent_chain,
            existing_expected_impact=project.get('expected_impact')
        ),
        required_output_contract=OutputContract(
            must_set=["tier", "impact_magnitude", "confidence", "summary"],
            hypothesis_rules={
                "strategic_must_validate": True,
                "weight_sum_max": 1.0
            },
            contributes_rules={
                "max_weight_sum": 1.0
            }
        ),
        scoring_context=ScoringContext(
            tier_points=tier_points,
            display_rules=display_rules
        )
    )

    return context


# ============================================
# LLM Output Normalization
# ============================================

def normalize_llm_output(raw_input: Union[str, Dict[str, Any]]) -> ImpactExpectedOutput:
    """
    Parse and normalize LLM output with robust error handling.

    Handles:
    - JSON strings (parse first)
    - Dict objects (use directly)
    - Malformed JSON (raise clear error)
    - Schema version mismatches (warn but proceed)
    - Field name variations (tier vs impact_tier, etc.)

    Args:
        raw_input: Raw LLM output (JSON string or dict)

    Returns:
        Normalized ImpactExpectedOutput

    Raises:
        ValueError: If parsing or validation fails
    """
    # Parse JSON string if needed
    if isinstance(raw_input, str):
        try:
            raw_dict = json.loads(raw_input)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in LLM output: {e}")
    else:
        raw_dict = raw_input

    # Check schema version (warn if mismatch)
    schema_ver = raw_dict.get('schema_version')
    if schema_ver and schema_ver != OUTPUT_SCHEMA_VERSION:
        logger.warning(f"Schema version mismatch: got {schema_ver}, expected {OUTPUT_SCHEMA_VERSION}")

    # Normalize field names (handle variations)
    normalized = {
        'tier': raw_dict.get('tier') or raw_dict.get('impact_tier'),
        'impact_magnitude': raw_dict.get('impact_magnitude') or raw_dict.get('magnitude'),
        'confidence': raw_dict.get('confidence'),
        'summary': raw_dict.get('summary'),
        'validates': raw_dict.get('validates', []),
        'primary_hypothesis_id': raw_dict.get('primary_hypothesis_id'),
        'condition_contributes': [],
        'track_contributes': [],
        'assumptions': raw_dict.get('assumptions', []),
        'evidence_refs': raw_dict.get('evidence_refs', []),
        'linking_reason': raw_dict.get('linking_reason', '')
    }

    # Normalize contributes (handle both dict and ContributeItem formats)
    for item in raw_dict.get('condition_contributes', []):
        if isinstance(item, dict):
            normalized['condition_contributes'].append({
                'condition_id': item.get('condition_id'),
                'weight': item.get('weight', 0.0)
            })

    for item in raw_dict.get('track_contributes', []):
        if isinstance(item, dict):
            normalized['track_contributes'].append({
                'track_id': item.get('track_id'),
                'weight': item.get('weight', 0.0)
            })

    # Return Pydantic model (will raise ValidationError if fields invalid)
    try:
        return ImpactExpectedOutput(**normalized)
    except Exception as e:
        raise ValueError(f"LLM output validation failed: {e}")


# ============================================
# Validation
# ============================================

def validate_expected_output(
    output: ImpactExpectedOutput,
    project_id: str
) -> List[ValidationError]:
    """
    Validate Expected Impact output using domain rules.

    Runs all validation checks:
    - Required fields
    - Confidence range
    - Weight sum
    - Strategic hypotheses
    - Entity references

    Args:
        output: Normalized LLM output
        project_id: Project ID for context

    Returns:
        List of ValidationError (empty if all valid)
    """
    errors = []

    # 1. Required fields validation
    required_errors = domain.validate_required_fields(
        tier=output.tier,
        impact_magnitude=output.impact_magnitude,
        confidence=output.confidence,
        summary=output.summary,
        primary_hypothesis_id=output.primary_hypothesis_id
    )
    for err_msg in required_errors:
        errors.append(ValidationError(field="required_fields", error=err_msg))

    # 2. Confidence range validation
    conf_error = domain.validate_confidence_range(output.confidence)
    if conf_error:
        errors.append(ValidationError(field="confidence", error=conf_error))

    # 3. Weight sum validation
    condition_contributes = [
        {'condition_id': item.condition_id, 'weight': item.weight}
        for item in output.condition_contributes
    ]
    track_contributes = [
        {'track_id': item.track_id, 'weight': item.weight}
        for item in output.track_contributes
    ]

    weight_error = domain.validate_weight_sum(condition_contributes, track_contributes)
    if weight_error:
        errors.append(ValidationError(field="contributes_weight_sum", error=weight_error))

    # 4. Strategic hypotheses validation
    hyp_error = domain.validate_strategic_hypotheses(
        tier=output.tier,
        validates=output.validates,
        primary_hypothesis_id=output.primary_hypothesis_id
    )
    if hyp_error:
        errors.append(ValidationError(field="validates", error=hyp_error))

    # 5. Entity references validation
    cache = get_cache()
    vault_entities = {
        # get_all_hypotheses returns a list, not a dict
        'hypotheses': {h['entity_id']: True for h in cache.get_all_hypotheses()},
        'conditions': {c['entity_id']: True for c in cache.get_all_conditions()},
        'tracks': {t['entity_id']: True for t in cache.get_all_tracks()}
    }

    ref_errors = domain.validate_entity_refs(
        validates=output.validates,
        primary_hypothesis_id=output.primary_hypothesis_id,
        condition_contributes=condition_contributes,
        track_contributes=track_contributes,
        vault_entities=vault_entities
    )
    for err_msg in ref_errors:
        errors.append(ValidationError(field="entity_refs", error=err_msg))

    return errors


# ============================================
# Calculated Fields
# ============================================

def build_calculated_fields(output: ImpactExpectedOutput) -> Dict[str, Any]:
    """
    Calculate A score and derived fields using impact_calculator (SSOT).

    Args:
        output: Validated Expected Impact output

    Returns:
        Dict with calculated fields (score, tier_points, formula, etc.)

    Raises:
        ValueError: If calculation fails
    """
    try:
        breakdown = calculate_expected_score_with_breakdown(
            tier=output.tier,
            magnitude=output.impact_magnitude,
            confidence=output.confidence
        )
        return breakdown
    except Exception as e:
        logger.error(f"Failed to calculate expected score: {e}")
        raise ValueError(f"Score calculation failed: {e}")
