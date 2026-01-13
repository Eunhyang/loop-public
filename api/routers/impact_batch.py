"""
Expected Impact Batch Fill API Router

Batch processing endpoints for Expected Impact filling:
1. POST /api/mcp/impact/expected/worklist - Generate worklist of projects
2. POST /api/mcp/impact/expected/suggest-batch - Get LLM suggestions for batch
3. POST /api/mcp/impact/expected/preview - Preview scores before applying
4. POST /api/mcp/impact/expected/apply-batch - Apply batch updates with audit

Safety: Per-item validation, partial success pattern, audit logging
"""

from datetime import datetime
from typing import Dict, Any, Optional, List
import random
import string
from fastapi import APIRouter, HTTPException, Request
from pathlib import Path

from ..models.impact_batch import (
    WorklistRequest,
    WorklistResponse,
    WorklistItem,
    OutputContract,
    ScoringContext,
    ApplyPatch,
    StructuredReasoning,
    CalculatedFields,
    FieldValidationError,
    SuggestBatchRequest,
    SuggestBatchResponse,
    SuggestBatchSuggestion,
    PreviewRequest,
    PreviewResponse,
    PreviewDiff,
    ApplyBatchRequest,
    ApplyBatchResponse,
    ApplyBatchResult,
    ApplyBatchAudit,
    ApplyBatchValidation,
)
from ..cache import get_cache
from ..utils.vault_utils import get_vault_dir
from ..utils.impact_calculator import (
    calculate_expected_score_with_breakdown,
    calculate_expected_score,
    load_impact_config
)
from .pending import find_entity_file, update_entity_frontmatter
import yaml

router = APIRouter(prefix="/api/mcp/impact/expected", tags=["impact-batch"])


# ============================================
# Helper Functions
# ============================================

def generate_run_id() -> str:
    """Generate server-side run ID

    Format: run-YYYYMMDD-HHMMSS-{random}
    Server-generated to prevent client spoofing
    """
    now = datetime.now()
    timestamp = now.strftime("%Y%m%d-%H%M%S")
    random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"run-{timestamp}-{random_suffix}"


def validate_patch_fields(patch: Dict[str, Any], cache) -> List[FieldValidationError]:
    """
    Validate patch fields and return structured errors

    Phase 7: Field-level validation for apply-batch endpoint
    """
    errors = []

    # 1. Required field validation
    if "expected_impact" in patch:
        expected_impact = patch["expected_impact"]
        if isinstance(expected_impact, dict):
            statement = expected_impact.get("statement", "").strip()
            if not statement:
                errors.append(FieldValidationError(
                    field_path="expected_impact.statement",
                    error_type="missing_required",
                    message="Impact statement is required"
                ))

    # 2. Type validation for weights
    if "condition_contributes" in patch:
        contributes = patch["condition_contributes"]
        if isinstance(contributes, list):
            for idx, item in enumerate(contributes):
                if not isinstance(item, dict):
                    errors.append(FieldValidationError(
                        field_path=f"condition_contributes[{idx}]",
                        error_type="invalid_type",
                        message="Each contribute item must be a dict",
                        expected="dict",
                        actual=type(item).__name__
                    ))
                    continue

                weight = item.get("weight")
                if weight is not None:
                    if not isinstance(weight, (int, float)):
                        errors.append(FieldValidationError(
                            field_path=f"condition_contributes[{idx}].weight",
                            error_type="invalid_type",
                            message="Weight must be a number",
                            expected="float",
                            actual=type(weight).__name__
                        ))
                    elif not (0.0 <= weight <= 1.0):
                        errors.append(FieldValidationError(
                            field_path=f"condition_contributes[{idx}].weight",
                            error_type="invalid_value",
                            message="Weight must be between 0.0 and 1.0",
                            expected="0.0-1.0",
                            actual=weight
                        ))

    if "track_contributes" in patch:
        contributes = patch["track_contributes"]
        if isinstance(contributes, list):
            for idx, item in enumerate(contributes):
                if not isinstance(item, dict):
                    errors.append(FieldValidationError(
                        field_path=f"track_contributes[{idx}]",
                        error_type="invalid_type",
                        message="Each contribute item must be a dict",
                        expected="dict",
                        actual=type(item).__name__
                    ))
                    continue

                weight = item.get("weight")
                if weight is not None:
                    if not isinstance(weight, (int, float)):
                        errors.append(FieldValidationError(
                            field_path=f"track_contributes[{idx}].weight",
                            error_type="invalid_type",
                            message="Weight must be a number",
                            expected="float",
                            actual=type(weight).__name__
                        ))
                    elif not (0.0 <= weight <= 1.0):
                        errors.append(FieldValidationError(
                            field_path=f"track_contributes[{idx}].weight",
                            error_type="invalid_value",
                            message="Weight must be between 0.0 and 1.0",
                            expected="0.0-1.0",
                            actual=weight
                        ))

    # 3. Constraint validation - weight sum <= 1.0
    if "condition_contributes" in patch:
        contributes = patch["condition_contributes"]
        if isinstance(contributes, list):
            total_weight = sum(
                item.get("weight", 0.0)
                for item in contributes
                if isinstance(item, dict)
            )
            if total_weight > 1.0:
                errors.append(FieldValidationError(
                    field_path="condition_contributes",
                    error_type="constraint_violation",
                    message=f"Total weight {total_weight} exceeds maximum 1.0",
                    constraint="weight_sum_max_1.0",
                    actual=total_weight
                ))

    if "track_contributes" in patch:
        contributes = patch["track_contributes"]
        if isinstance(contributes, list):
            total_weight = sum(
                item.get("weight", 0.0)
                for item in contributes
                if isinstance(item, dict)
            )
            if total_weight > 1.0:
                errors.append(FieldValidationError(
                    field_path="track_contributes",
                    error_type="constraint_violation",
                    message=f"Total weight {total_weight} exceeds maximum 1.0",
                    constraint="weight_sum_max_1.0",
                    actual=total_weight
                ))

    # 4. Reference validation - hypothesis IDs must exist
    if "validates" in patch:
        validates = patch["validates"]
        if isinstance(validates, list):
            hypotheses = cache.get_all_hypotheses() if hasattr(cache, 'get_all_hypotheses') else []
            hyp_ids = {h.get("entity_id") for h in hypotheses}

            for idx, hyp_id in enumerate(validates):
                if hyp_id not in hyp_ids:
                    errors.append(FieldValidationError(
                        field_path=f"validates[{idx}]",
                        error_type="invalid_value",
                        message=f"Hypothesis {hyp_id} not found in vault",
                        actual=hyp_id
                    ))

    return errors


def build_parent_chain(project: Dict[str, Any], cache) -> List[str]:
    """Build parent chain: project → track → condition → metahypothesis → northstar

    Args:
        project: Project dict
        cache: VaultCache instance

    Returns:
        List of entity_ids in chain (graceful degradation on missing links)
    """
    chain = []

    # Start with project
    chain.append(project.get("entity_id"))

    # Track (from parent_id)
    parent_id = project.get("parent_id")
    if parent_id:
        chain.append(parent_id)

        # Get track to find condition
        tracks = cache.get_all_tracks() if hasattr(cache, 'get_all_tracks') else []
        track = next((t for t in tracks if t.get("entity_id") == parent_id), None)

        if track:
            # Condition (from track's parent_id)
            track_parent = track.get("parent_id")
            if track_parent:
                chain.append(track_parent)

                # Get condition to find metahypothesis
                conditions = cache.get_all_conditions() if hasattr(cache, 'get_all_conditions') else []
                condition = next((c for c in conditions if c.get("entity_id") == track_parent), None)

                if condition:
                    # MetaHypothesis (from condition's parent_id)
                    cond_parent = condition.get("parent_id")
                    if cond_parent:
                        chain.append(cond_parent)

                        # NorthStar would be MetaHypothesis's parent, but not loading for now

    return chain


def filter_candidate_hypotheses(track_id: str, cache) -> List[Dict[str, Any]]:
    """Filter hypotheses matching track

    Pattern: hyp-{track_num}-* where track_num is extracted from track_id
    E.g., track_id="trk-3" → matches "hyp-3-01", "hyp-3-02"

    Args:
        track_id: Track entity_id (e.g., "trk-3")
        cache: VaultCache instance

    Returns:
        List of matching hypothesis dicts (empty if track_num not found)
    """
    if not track_id:
        return []

    # Extract track number from track_id
    # Format: trk-{num} or track-{num}
    parts = track_id.split('-')
    if len(parts) < 2:
        return []

    try:
        track_num = int(parts[1])
    except (ValueError, IndexError):
        return []

    # Get all hypotheses
    hypotheses = cache.get_all_hypotheses() if hasattr(cache, 'get_all_hypotheses') else []

    # Filter by pattern hyp-{track_num}-*
    prefix = f"hyp-{track_num}-"
    return [h for h in hypotheses if h.get("entity_id", "").startswith(prefix)]


def gather_project_context(
    project: Dict[str, Any],
    include_flags: Dict[str, bool],
    cache
) -> Dict[str, Any]:
    """Gather context for single project based on include flags

    Args:
        project: Project dict
        include_flags: Dict with keys (project_body, parent_chain, track_context, etc.)
        cache: VaultCache instance

    Returns:
        Context dict with requested information
    """
    context = {}

    # Project body (if requested)
    if include_flags.get("project_body", False):
        # Body content would need to be read from file (not in cache)
        # For now, use description or goal from frontmatter
        context["body"] = project.get("description", project.get("goal", ""))

    # Parent chain
    if include_flags.get("parent_chain", True):
        context["parent_chain"] = build_parent_chain(project, cache)

    # Track context
    parent_id = project.get("parent_id")
    if include_flags.get("track_context", True) and parent_id:
        tracks = cache.get_all_tracks() if hasattr(cache, 'get_all_tracks') else []
        track = next((t for t in tracks if t.get("entity_id") == parent_id), None)
        context["track"] = track  # None if not found (graceful)

    # Condition context
    if include_flags.get("condition_context", True):
        conditions_3y = project.get("conditions_3y", [])
        if conditions_3y:
            conditions = cache.get_all_conditions() if hasattr(cache, 'get_all_conditions') else []
            context["conditions"] = [
                c for c in conditions if c.get("entity_id") in conditions_3y
            ]
        else:
            context["conditions"] = []

    # Candidate hypotheses
    if include_flags.get("candidate_hypotheses", True) and parent_id:
        context["candidate_hypotheses"] = filter_candidate_hypotheses(parent_id, cache)

    return context


# ============================================
# API Endpoints
# ============================================

@router.post("/worklist", response_model=WorklistResponse)
async def get_expected_impact_worklist(
    request: WorklistRequest,
    http_request: Request
):
    """
    Generate worklist of projects missing Expected Impact

    Filters projects by:
    - missing or incomplete expected_impact field
    - optional status filter
    - limit (1-100, default 50)

    Returns worklist with run_id and project context
    """
    cache = get_cache()
    projects = cache.get_all_projects()

    # Filter by missing expected_impact
    filtered = []
    for p in projects:
        # Check if expected_impact is missing or empty
        expected_impact = p.get("expected_impact")
        is_missing = (
            expected_impact is None
            or expected_impact == {}
            or (isinstance(expected_impact, dict) and not expected_impact.get("tier"))
        )

        if not is_missing:
            continue

        # Optional status filter
        if request.filters.project_status_in:
            if p.get("status") not in request.filters.project_status_in:
                continue

        filtered.append(p)

    # Apply limit
    limited = filtered[: request.filters.limit]

    # Build worklist items with context
    items = []
    for p in limited:
        context = gather_project_context(
            project=p,
            include_flags=request.include.model_dump(),
            cache=cache
        )

        items.append(WorklistItem(
            project_id=p.get("entity_id"),
            project_name=p.get("entity_name", ""),
            status=p.get("status", "unknown"),
            parent_id=p.get("parent_id"),
            context=context
        ))

    # Generate server-side run_id
    run_id = generate_run_id()

    # Load impact config for contract + context
    config = load_impact_config()

    # Build OutputContract
    output_contract = OutputContract(
        must_set=[
            "tier",
            "impact_magnitude",
            "confidence",
            "expected_impact.statement"
        ],
        contributes_rules=config.get("validation", {}).get("project", {}).get("contributes_rules", {}),
        hypothesis_rules=config.get("hypothesis_rules", {})
    )

    # Build ScoringContext
    scoring_context = ScoringContext(
        impact_model_version=config.get("version", "1.3.0"),
        tier_points=config.get("magnitude_points", {}),
        display_rules=config.get("display_rules", {})
    )

    return WorklistResponse(
        run_id=run_id,
        total_matched=len(filtered),
        items=items,
        required_output_contract=output_contract,
        scoring_context=scoring_context
    )


@router.post("/suggest-batch", response_model=SuggestBatchResponse)
async def suggest_batch(
    request: SuggestBatchRequest,
    http_request: Request
):
    """
    Generate LLM suggestions for batch of projects

    Calls LLM per project sequentially (not batch) for safer token management
    Continues processing even if individual projects fail (partial success pattern)
    """
    from ..services.llm_service import get_llm_service
    from ..prompts.expected_impact import (
        EXPECTED_IMPACT_SYSTEM_PROMPT,
        build_simple_expected_impact_prompt
    )

    # Generate run_id if not provided
    run_id = request.run_id or generate_run_id()

    cache = get_cache()
    llm = get_llm_service()

    suggestions = []
    success_count = 0
    failed_count = 0

    # Process each project sequentially
    for item in request.items:
        project_id = item.project_id

        # Get project from cache
        projects = cache.get_all_projects()
        project = next((p for p in projects if p.get("entity_id") == project_id), None)

        if not project:
            suggestions.append(SuggestBatchSuggestion(
                project_id=project_id,
                status="error",
                error="Project not found"
            ))
            failed_count += 1
            continue

        try:
            # Build prompt
            prompt = build_simple_expected_impact_prompt(
                project_name=project.get("entity_name", ""),
                project_description=project.get("description", project.get("goal", "")),
                conditions_3y=project.get("conditions_3y", [])
            )

            # Call LLM
            result = await llm.call_llm(
                prompt=prompt,
                system_prompt=EXPECTED_IMPACT_SYSTEM_PROMPT,
                provider=request.provider,
                response_format="json"
            )

            if not result["success"]:
                suggestions.append(SuggestBatchSuggestion(
                    project_id=project_id,
                    status="error",
                    error=result.get("error", "LLM call failed")
                ))
                failed_count += 1
                continue

            content = result["content"]

            # Parse LLM response (v5.3 schema)
            suggested_fields = {}  # Keep for backward compatibility (deprecated)
            reasoning_dict = {}
            warnings = []

            # Extract tier
            tier_value = None
            tier_reason = ""
            if "tier" in content:
                tier_data = content["tier"]
                if isinstance(tier_data, dict):
                    tier_value = tier_data.get("value", "operational")
                    tier_reason = tier_data.get("reasoning", "")
                else:
                    tier_value = tier_data
                suggested_fields["tier"] = tier_value

            # Extract impact_magnitude
            magnitude_value = None
            magnitude_reason = ""
            if "impact_magnitude" in content:
                mag_data = content["impact_magnitude"]
                if isinstance(mag_data, dict):
                    magnitude_value = mag_data.get("value", "mid")
                    magnitude_reason = mag_data.get("reasoning", "")
                else:
                    magnitude_value = mag_data
                suggested_fields["impact_magnitude"] = magnitude_value

            # Extract confidence
            confidence_value = 0.7
            confidence_reason = ""
            if "confidence" in content:
                conf_data = content["confidence"]
                if isinstance(conf_data, dict):
                    confidence_value = conf_data.get("value", 0.7)
                    confidence_reason = conf_data.get("reasoning", "")
                else:
                    confidence_value = conf_data
                suggested_fields["confidence"] = confidence_value

            # Extract v5.3 schema fields
            validates = content.get("validates", [])
            primary_hypothesis_id = content.get("primary_hypothesis_id")
            condition_contributes = content.get("condition_contributes", [])
            track_contributes = content.get("track_contributes", [])
            assumptions = content.get("assumptions", [])
            evidence_refs = content.get("evidence_refs", [])
            linking_reason = content.get("linking_reason")
            summary = content.get("summary", "")

            # Build ApplyPatch (v5.3 compliant)
            apply_patch = ApplyPatch(
                expected_impact={
                    "statement": summary,
                    "metric": content.get("metric"),
                    "target": content.get("target")
                },
                condition_contributes=condition_contributes,
                track_contributes=track_contributes,
                validates=validates,
                primary_hypothesis_id=primary_hypothesis_id,
                assumptions=assumptions,
                evidence_refs=evidence_refs,
                linking_reason=linking_reason
            )

            # Build StructuredReasoning
            structured_reasoning = StructuredReasoning(
                tier_reason=tier_reason,
                magnitude_reason=magnitude_reason,
                confidence_reason=confidence_reason,
                assumptions=assumptions,
                evidence_refs=evidence_refs,
                linking_reason=linking_reason,
                rollup_reason={
                    "condition_contributes": f"Allocated {len(condition_contributes)} conditions",
                    "track_contributes": f"Allocated {len(track_contributes)} tracks"
                }
            )

            # Calculate expected score (FIXED: use _with_breakdown, no contributes param)
            calculated_fields_obj = None
            if tier_value and magnitude_value and confidence_value is not None:
                try:
                    # Load config to get display rules
                    config = load_impact_config()
                    display_rules = config.get("display_rules", {})
                    star_thresholds = display_rules.get("star_thresholds", {})

                    score_result = calculate_expected_score_with_breakdown(
                        tier=tier_value,
                        magnitude=magnitude_value,
                        confidence=confidence_value
                    )

                    # Calculate star rating
                    normalized = score_result["normalized_10"]
                    display_star = 1
                    for stars, (min_score, max_score) in star_thresholds.items():
                        if min_score <= normalized < max_score:
                            display_star = int(stars)
                            break

                    calculated_fields_obj = CalculatedFields(
                        magnitude_points=score_result["tier_points"],
                        expected_score_raw=score_result["score"],
                        max_score_by_tier=score_result["max_score_by_tier"],
                        normalized_score_10=score_result["normalized_10"],
                        display_star_5=float(display_star),
                        calculation=score_result["formula"]
                    )

                    # Also populate legacy calculated_fields dict for backward compat
                    suggested_fields["expected_score"] = score_result["score"]
                except Exception as e:
                    warnings.append(f"Score calculation failed: {str(e)}")

            suggestions.append(SuggestBatchSuggestion(
                project_id=project_id,
                status="success",
                apply_patch=apply_patch,
                suggested_fields=suggested_fields,  # Deprecated but kept for compatibility
                calculated_fields=calculated_fields_obj,
                reasoning=structured_reasoning,
                warnings=warnings
            ))
            success_count += 1

        except Exception as e:
            suggestions.append(SuggestBatchSuggestion(
                project_id=project_id,
                status="error",
                error=f"Unexpected error: {str(e)}"
            ))
            failed_count += 1

    # Load config for version info
    config = load_impact_config()

    return SuggestBatchResponse(
        run_id=run_id,
        mode=request.mode,
        schema_version="v2",
        impact_model_version=config.get("version", "1.3.0"),
        suggestions=suggestions,
        summary={
            "total": len(request.items),
            "success": success_count,
            "failed": failed_count
        }
    )


@router.post("/preview", response_model=PreviewResponse)
async def preview_expected_impact(
    request: PreviewRequest,
    http_request: Request
):
    """
    Preview Expected Impact scores before applying

    Calculates scores for draft fields and compares with current values
    Validates tier/condition alignment

    NOTE: This is the legacy simple preview endpoint.
    For enhanced validation, see the implementation below with additional checks.
    """
    cache = get_cache()

    # Get project from cache
    projects = cache.get_all_projects()
    project = next((p for p in projects if p.get("entity_id") == request.project_id), None)

    if not project:
        raise HTTPException(status_code=404, detail=f"Project not found: {request.project_id}")

    # Current expected_impact
    current_impact = project.get("expected_impact", {})

    # Calculate scores for draft
    draft = request.draft
    calculated = {}
    warnings = []
    errors = []

    if all(k in draft for k in ["tier", "impact_magnitude", "confidence"]):
        try:
            # Use new breakdown function
            score_result = calculate_expected_score_with_breakdown(
                tier=draft["tier"],
                magnitude=draft["impact_magnitude"],
                confidence=draft["confidence"]
            )
            calculated["expected_score"] = score_result["score"]
            calculated["score_components"] = score_result
        except Exception as e:
            errors.append({"field": "score_calculation", "message": str(e)})

    # Enhanced validation (Phase 6)

    # 1. Weight sum validation
    if "condition_contributes" in draft:
        condition_contributes = draft["condition_contributes"]
        if isinstance(condition_contributes, list):
            total_weight = sum(item.get("weight", 0.0) for item in condition_contributes)
            if total_weight > 1.0:
                warnings.append({
                    "field": "condition_contributes",
                    "issue": "weight_sum_exceeded",
                    "current": total_weight,
                    "max": 1.0
                })

    if "track_contributes" in draft:
        track_contributes = draft["track_contributes"]
        if isinstance(track_contributes, list):
            total_weight = sum(item.get("weight", 0.0) for item in track_contributes)
            if total_weight > 1.0:
                warnings.append({
                    "field": "track_contributes",
                    "issue": "weight_sum_exceeded",
                    "current": total_weight,
                    "max": 1.0
                })

    # 2. Strategic tier hypothesis validation
    draft_tier = draft.get("tier")
    validates = draft.get("validates", [])
    if draft_tier == "strategic" and len(validates) == 0:
        warnings.append({
            "field": "validates",
            "issue": "strategic_requires_hypothesis",
            "tier": "strategic"
        })

    # 3. Parent chain alignment (if parent_chain provided)
    if hasattr(request, 'parent_chain') and request.parent_chain:
        # Check if condition_contributes align with parent conditions
        if "condition_contributes" in draft:
            for item in draft["condition_contributes"]:
                cond_id = item.get("condition_id")
                if cond_id and cond_id not in request.parent_chain:
                    warnings.append({
                        "field": "condition_contributes",
                        "issue": "condition_not_in_parent_chain",
                        "condition_id": cond_id
                    })

    # 4. Hypothesis existence check (if validates provided)
    if validates:
        hypotheses = cache.get_all_hypotheses() if hasattr(cache, 'get_all_hypotheses') else []
        hyp_ids = {h.get("entity_id") for h in hypotheses}
        for hyp_id in validates:
            if hyp_id not in hyp_ids:
                warnings.append({
                    "field": "validates",
                    "issue": "hypothesis_not_found",
                    "hypothesis_id": hyp_id
                })

    # Build diff
    diff = {}
    for key in ["tier", "impact_magnitude", "confidence", "condition_contributes", "track_contributes", "validates"]:
        if key in draft:
            before = current_impact.get(key)
            after = draft[key]
            if before != after:
                diff[key] = PreviewDiff(before=before, after=after)

    # Add calculated score to diff
    if "expected_score" in calculated:
        before_score = current_impact.get("expected_score")
        after_score = calculated["expected_score"]
        if before_score != after_score:
            diff["expected_score"] = PreviewDiff(before=before_score, after=after_score)

    # Legacy tier/condition alignment check
    conditions_3y = project.get("conditions_3y", [])
    if draft_tier == "strategic" and not conditions_3y:
        warnings.append("Strategic tier requires conditions_3y to be set")
    elif draft_tier != "strategic" and conditions_3y:
        warnings.append(f"Tier '{draft_tier}' with conditions_3y set - may want strategic tier")

    return PreviewResponse(
        project_id=request.project_id,
        calculated=calculated,
        diff=diff,
        warnings=warnings
    )


@router.post("/apply-batch", response_model=ApplyBatchResponse)
async def apply_batch(
    request: ApplyBatchRequest,
    http_request: Request
):
    """
    Apply batch updates to Expected Impact fields

    Safety features:
    - Validates DERIVED_FIELDS block (validated_by, realized_sum)
    - Partial success pattern (continues on individual failures)
    - Audit logging with run_id
    - Atomic file writes via update_entity_frontmatter
    """
    # Generate run_id if not provided
    run_id = request.run_id or generate_run_id()

    # DERIVED_FIELDS validation (already in Pydantic model, but double-check)
    DERIVED_FIELDS = {'validated_by', 'realized_sum'}

    # Check all updates for derived fields
    for update in request.updates:
        patch = update.patch
        if any(key in DERIVED_FIELDS for key in patch.keys()):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot write to derived fields: {DERIVED_FIELDS}"
            )
        if 'expected_impact' in patch and isinstance(patch['expected_impact'], dict):
            if any(key in DERIVED_FIELDS for key in patch['expected_impact'].keys()):
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot write to derived fields in expected_impact: {DERIVED_FIELDS}"
                )

    # Get cache for validation
    cache = get_cache()

    # Process updates
    results = []
    success_count = 0
    failed_count = 0
    skipped_count = 0
    validation_error_count = 0

    for update in request.updates:
        project_id = update.project_id
        patch = update.patch

        try:
            # Phase 7: Field-level validation
            validation_errors = validate_patch_fields(patch, cache)

            if validation_errors:
                results.append(ApplyBatchResult(
                    project_id=project_id,
                    status="validation_error",
                    validation_errors=validation_errors,
                    error=f"Field validation failed with {len(validation_errors)} errors"
                ))
                validation_error_count += 1
                failed_count += 1
                continue

            # Find entity file
            entity_file = find_entity_file(project_id, "Project")
            if not entity_file:
                results.append(ApplyBatchResult(
                    project_id=project_id,
                    status="failed",
                    error="Project file not found"
                ))
                failed_count += 1
                continue

            # Apply update
            success = update_entity_frontmatter(entity_file, patch)

            if success:
                results.append(ApplyBatchResult(
                    project_id=project_id,
                    status="success",
                    updated_at=datetime.now().isoformat(),
                    applied_fields=list(patch.keys()),
                    file_path=str(entity_file)
                ))
                success_count += 1
            else:
                results.append(ApplyBatchResult(
                    project_id=project_id,
                    status="write_error",
                    error="Failed to update frontmatter"
                ))
                failed_count += 1

        except Exception as e:
            results.append(ApplyBatchResult(
                project_id=project_id,
                status="failed",
                error=f"Unexpected error: {str(e)}"
            ))
            failed_count += 1

    # Audit logging
    audit_logged = False
    decision_log_path = get_vault_dir() / "_build" / "decision_log.jsonl"

    try:
        # Simple append-only logging
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "run_id": run_id,
            "decision": "batch_apply",
            "mode": request.mode,
            "commit_message": request.commit_message,
            "total_updates": len(request.updates),
            "success": success_count,
            "failed": failed_count,
            "results": [
                {
                    "project_id": r.project_id,
                    "status": r.status,
                    "applied_fields": r.applied_fields
                }
                for r in results if r.status == "success"
            ]
        }

        import json
        decision_log_path.parent.mkdir(parents=True, exist_ok=True)
        with open(decision_log_path, "a") as f:
            f.write(json.dumps(log_entry) + "\n")

        audit_logged = True
    except Exception as e:
        print(f"Warning: Failed to write audit log: {e}")

    return ApplyBatchResponse(
        run_id=run_id,
        mode=request.mode,
        results=results,
        audit=ApplyBatchAudit(
            decision_log_path=str(decision_log_path),
            logged=audit_logged,
            user_id=getattr(http_request.state, 'user_id', None) if hasattr(http_request, 'state') else None
        ),
        validation=ApplyBatchValidation(
            total_updates=len(request.updates),
            validated=len(request.updates) - validation_error_count,
            blocked_by_derived_fields=0,  # Already blocked before loop
            schema_errors=validation_error_count
        ),
        summary={
            "total": len(request.updates),
            "success": success_count,
            "failed": failed_count,
            "skipped": skipped_count
        }
    )
