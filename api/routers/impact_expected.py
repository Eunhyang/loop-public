"""
Impact Expected Router - Unified Endpoints

New endpoints for unified Expected Impact inference:
- POST /api/mcp/impact/expected/context - Get unified context
- POST /api/mcp/impact/expected/suggest - Submit external LLM output
- POST /api/mcp/impact/expected/infer - Run internal LLM
- POST /api/mcp/impact/expected/preview - Preview changes
- POST /api/mcp/impact/expected/apply-batch - Apply batch updates

All endpoints use the same validation logic and context schema.
"""

import logging
from typing import Dict, List, Any
from fastapi import APIRouter, HTTPException, status
from datetime import datetime
import random
import string

from ..models.impact_expected import (
    ContextRequest,
    ContextResponse,
    ImpactExpectedContext,
    SuggestRequest,
    InferRequest,
    InferenceResult,
    PreviewRequest,
    PreviewResponse,
    ApplyBatchRequest,
    ApplyBatchResponse,
    ValidationError
)
from ..services import impact_expected_service as service
from ..services import impact_expected_inference as inference
from ..cache import get_cache
from ..utils.vault_utils import get_vault_dir
from .pending import (
    update_entity_frontmatter,
    find_entity_file,
    load_pending,
    save_pending,
    generate_review_id,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mcp/impact/expected", tags=["impact-expected"])


# ============================================
# Helper Functions
# ============================================

def generate_run_id() -> str:
    """Generate server-side run ID for audit"""
    now = datetime.now()
    timestamp = now.strftime("%Y%m%d-%H%M%S")
    random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"run-{timestamp}-{random_suffix}"


def output_to_patch(output) -> Dict[str, Any]:
    """Map ImpactExpectedOutput -> frontmatter patch dict."""
    return {
        'expected_impact': {
            'tier': output.tier,
            'impact_magnitude': output.impact_magnitude,
            'confidence': output.confidence,
            'summary': output.summary
        },
        'validates': output.validates,
        'primary_hypothesis_id': output.primary_hypothesis_id,
        'condition_contributes': [
            {'condition_id': c.condition_id, 'weight': c.weight}
            for c in output.condition_contributes
        ],
        'track_contributes': [
            {'track_id': t.track_id, 'weight': t.weight}
            for t in output.track_contributes
        ],
        'assumptions': output.assumptions,
        'evidence_refs': output.evidence_refs,
        'linking_reason': output.linking_reason
    }


def build_diff(current: Dict[str, Any], patch: Dict[str, Any]) -> Dict[str, Any]:
    """Compute shallow diff between current project fields and proposed patch."""
    diff: Dict[str, Any] = {}
    for key, new_value in patch.items():
        old_value = current.get(key)
        if old_value != new_value:
            diff[key] = {"old": old_value, "new": new_value}
    return diff


def build_diff_summary(diff: Dict[str, Any]) -> str:
    """Human-friendly short summary of changed fields."""
    if not diff:
        return ""
    keys = list(diff.keys())
    return f"Changed: {', '.join(keys)}"


def create_pending_expected(
    project_id: str,
    project_name: str,
    output,
    calculated_fields: Dict[str, Any],
    current_project: Dict[str, Any],
    run_id: str,
    actor: str,
    source_workflow: str = None
) -> Dict[str, Any]:
    """Create or update pending review entry for Expected Impact."""
    data = load_pending()
    reviews = data.get("reviews", [])

    patch = output_to_patch(output)
    diff = build_diff(current_project or {}, patch)
    diff_summary = build_diff_summary(diff)

    review_id = None
    existing_idx = None
    for idx, r in enumerate(reviews):
        if r.get("entity_id") == project_id and r.get("status") == "pending":
            existing_idx = idx
            review_id = r.get("id")
            break

    if not review_id:
        review_id = generate_review_id()

    pending_record = {
        "id": review_id,
        "entity_id": project_id,
        "entity_type": "Project",
        "entity_name": project_name,
        "suggested_fields": {
            "expected_impact": patch.get("expected_impact"),
            "validates": patch.get("validates"),
            "primary_hypothesis_id": patch.get("primary_hypothesis_id"),
            "condition_contributes": patch.get("condition_contributes"),
            "track_contributes": patch.get("track_contributes"),
            "assumptions": patch.get("assumptions"),
            "evidence_refs": patch.get("evidence_refs"),
            "linking_reason": patch.get("linking_reason"),
            "calculated_fields": calculated_fields,
            "current_expected_impact": (current_project or {}).get("expected_impact"),
            "diff": diff,
            "diff_summary": diff_summary,
        },
        "reasoning": {},
        "created_at": datetime.now().isoformat(),
        "status": "pending",
        "source": "impact_expected_infer",
        "run_id": run_id,
        "actor": actor,
        "source_workflow": source_workflow,
    }

    if existing_idx is not None:
        pending_record["updated_at"] = datetime.now().isoformat()
        reviews[existing_idx] = pending_record
    else:
        reviews.append(pending_record)

    data["reviews"] = reviews
    save_pending(data)
    return pending_record


# ============================================
# Endpoints
# ============================================

@router.post("/context", response_model=ContextResponse)
async def get_unified_context(request: ContextRequest):
    """
    Get unified context for LLM inference (external or internal).

    Returns the same context schema for all LLMs, ensuring consistent input.

    Args:
        request: List of project IDs

    Returns:
        Map of project_id -> ImpactExpectedContext
    """
    contexts = {}
    errors = {}

    for project_id in request.project_ids:
        try:
            context = service.build_expected_context(project_id)
            contexts[project_id] = context
        except Exception as e:
            logger.error(f"Failed to build context for {project_id}: {e}")
            errors[project_id] = str(e)

    return ContextResponse(contexts=contexts, errors=errors)


@router.post("/suggest", response_model=InferenceResult)
async def suggest_from_external_llm(request: SuggestRequest):
    """
    Submit external LLM output (e.g., from ChatGPT) for validation.

    Normalizes the output, validates it, and calculates score.
    Supports preview | pending | apply modes. Server always revalidates.

    Args:
        request: Project ID and raw LLM output

    Returns:
        Validated inference result with calculated fields
    """
    project_id = request.project_id

    try:
        mode = request.mode or "preview"
        cache = get_cache()
        project = cache.get_project(project_id) or {}
        project_name = project.get("entity_name", project_id)
        run_id = generate_run_id()
        iteration = 1 + (1 if request.previous_output else 0)

        # Normalize LLM output
        output = service.normalize_llm_output(request.llm_output)

        # Validate output
        validation_errors = service.validate_expected_output(output, project_id)

        # Calculate fields if validation passed
        calculated_fields = None
        if not validation_errors:
            try:
                calculated_fields = service.build_calculated_fields(output)
            except Exception as e:
                logger.error(f"Failed to calculate fields for {project_id}: {e}")
                validation_errors.append(
                    ValidationError(field="calculated_fields", error=str(e))
                )

        # Build diff/patch for downstream use
        patch = output_to_patch(output)
        diff = build_diff(project, patch)
        diff_summary = build_diff_summary(diff)

        # Pending or apply handling (only when valid)
        if not validation_errors:
            if mode == "pending":
                create_pending_expected(
                    project_id=project_id,
                    project_name=project_name,
                    output=output,
                    calculated_fields=calculated_fields or {},
                    current_project=project,
                    run_id=run_id,
                    actor=request.actor or "api",
                    source_workflow=request.source_workflow
                )
            elif mode == "apply":
                # Server-side revalidation + apply
                revalidation = service.validate_expected_output(output, project_id)
                if revalidation:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Server-side validation failed: {len(revalidation)} errors"
                    )
                vault_dir = get_vault_dir()
                project_file = find_entity_file(project_id, "Project")
                if not project_file:
                    raise HTTPException(status_code=404, detail="Project file not found")
                update_entity_frontmatter(project_file, patch)

        return InferenceResult(
            project_id=project_id,
            output=output,
            validation_errors=validation_errors,
            calculated_fields=calculated_fields,
            success=len(validation_errors) == 0,
            run_id=run_id,
            iteration=iteration,
            diff=diff,
            diff_summary=diff_summary
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process LLM output: {e}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in suggest endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal error: {e}"
        )


@router.post("/infer", response_model=InferenceResult)
async def infer_with_internal_llm(request: InferRequest):
    """
    Run internal LLM inference for Expected Impact.

    Builds context, calls LLM, normalizes output, validates, and calculates score.

    Args:
        request: Project ID and provider

    Returns:
        Validated inference result with calculated fields
    """
    project_id = request.project_id

    try:
        mode = request.mode or "preview"
        context = service.build_expected_context(project_id)
        base_run_id = generate_run_id()
        iteration = 1 + (1 if request.previous_output else 0)

        # Call LLM
        output, meta = await inference.run_internal_inference(
            project_id=project_id,
            context=context,
            provider=request.provider or "anthropic",
            previous_output=request.previous_output,
            user_feedback=request.user_feedback,
            actor=request.actor or "api",
        )

        run_id = meta.get("run_id") or base_run_id

        # Validate output
        validation_errors = service.validate_expected_output(output, project_id)

        # Calculate fields if validation passed
        calculated_fields = None
        if not validation_errors:
            try:
                calculated_fields = service.build_calculated_fields(output)
            except Exception as e:
                logger.error(f"Failed to calculate fields for {project_id}: {e}")
                validation_errors.append(
                    ValidationError(field="calculated_fields", error=str(e))
                )

        # Build diff/patch for downstream use
        cache = get_cache()
        project = cache.get_project(project_id) or {}
        project_name = project.get("entity_name", project_id)
        patch = output_to_patch(output)
        diff = build_diff(project, patch)
        diff_summary = build_diff_summary(diff)

        # Pending / Apply flows
        if not validation_errors:
            if mode == "pending":
                create_pending_expected(
                    project_id=project_id,
                    project_name=project_name,
                    output=output,
                    calculated_fields=calculated_fields or {},
                    current_project=project,
                    run_id=run_id,
                    actor=request.actor or "api",
                    source_workflow=request.source_workflow
                )
            elif mode == "apply":
                revalidation = service.validate_expected_output(output, project_id)
                if revalidation:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Server-side validation failed: {len(revalidation)} errors"
                    )
                vault_dir = get_vault_dir()
                project_file = find_entity_file(project_id, "Project")
                if not project_file:
                    raise HTTPException(status_code=404, detail="Project file not found")
                update_entity_frontmatter(project_file, patch)

        return InferenceResult(
            project_id=project_id,
            output=output,
            validation_errors=validation_errors,
            calculated_fields=calculated_fields,
            success=len(validation_errors) == 0,
            run_id=run_id,
            iteration=iteration,
            diff=diff,
            diff_summary=diff_summary
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error in infer endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal error: {e}"
        )


@router.post("/preview", response_model=PreviewResponse)
async def preview_changes(request: PreviewRequest):
    """
    Preview Expected Impact changes before applying.

    Shows current vs proposed values and score change.

    Args:
        request: Project ID and proposed output

    Returns:
        Preview with current/proposed comparison
    """
    project_id = request.project_id
    output = request.output

    try:
        # Get current Expected Impact
        cache = get_cache()
        project = cache.get_project(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")

        current = project.get('expected_impact')

        # Validate proposed output
        validation_errors = service.validate_expected_output(output, project_id)

        # Calculate new score
        score_change = None
        if not validation_errors:
            try:
                new_score = service.build_calculated_fields(output)
                old_score = None
                if current:
                    # TODO: Calculate old score if exists
                    pass
                score_change = {
                    'old': old_score,
                    'new': new_score
                }
            except Exception as e:
                logger.error(f"Failed to calculate score for preview: {e}")
                validation_errors.append(
                    ValidationError(field="calculated_fields", error=str(e))
                )

        # Build proposed dict
        proposed = {
            'tier': output.tier,
            'impact_magnitude': output.impact_magnitude,
            'confidence': output.confidence,
            'summary': output.summary,
            'validates': output.validates,
            'primary_hypothesis_id': output.primary_hypothesis_id,
            'condition_contributes': [
                {'condition_id': c.condition_id, 'weight': c.weight}
                for c in output.condition_contributes
            ],
            'track_contributes': [
                {'track_id': t.track_id, 'weight': t.weight}
                for t in output.track_contributes
            ],
            'assumptions': output.assumptions,
            'evidence_refs': output.evidence_refs,
            'linking_reason': output.linking_reason
        }

        return PreviewResponse(
            project_id=project_id,
            current=current,
            proposed=proposed,
            score_change=score_change,
            validation_errors=validation_errors
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error in preview endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal error: {e}"
        )


@router.post("/apply-batch", response_model=ApplyBatchResponse)
async def apply_batch_updates(request: ApplyBatchRequest):
    """
    Apply batch Expected Impact updates to vault.

    Only applies updates that passed validation.
    Atomic per-project (all fields updated together).

    Args:
        request: List of validated updates and run_id

    Returns:
        Summary of applied/failed updates
    """
    run_id = request.run_id or generate_run_id()
    applied = []
    failed = {}

    vault_dir = get_vault_dir()

    for update in request.updates:
        project_id = update.project_id

        # Skip if output missing
        if not update.output:
            failed[project_id] = "Missing output"
            continue

        try:
            # Server-side revalidation (security: don't trust client success flag)
            revalidation_errors = service.validate_expected_output(update.output, project_id)
            if revalidation_errors:
                failed[project_id] = f"Server-side validation failed: {len(revalidation_errors)} errors"
                logger.warning(f"Server-side validation failed for {project_id}: {revalidation_errors}")
                continue

            # Find project file
            project_file = find_entity_file(project_id, "Project")
            if not project_file:
                failed[project_id] = "Project file not found"
                continue

            # Build update patch
            patch = output_to_patch(update.output)

            # Apply update
            update_entity_frontmatter(project_file, patch)

            applied.append(project_id)
            logger.info(f"Applied Expected Impact for {project_id} (run_id: {run_id})")

        except Exception as e:
            logger.error(f"Failed to apply update for {project_id}: {e}")
            failed[project_id] = str(e)

    return ApplyBatchResponse(
        run_id=run_id,
        applied=applied,
        failed=failed,
        total=len(request.updates)
    )
