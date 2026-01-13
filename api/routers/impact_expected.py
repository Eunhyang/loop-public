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
from ..cache import get_cache
from ..utils.vault_utils import get_vault_dir
from .pending import update_entity_frontmatter, find_entity_file

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
    Does NOT apply changes - use /apply-batch for that.

    Args:
        request: Project ID and raw LLM output

    Returns:
        Validated inference result with calculated fields
    """
    project_id = request.project_id

    try:
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

        return InferenceResult(
            project_id=project_id,
            output=output,
            validation_errors=validation_errors,
            calculated_fields=calculated_fields,
            success=len(validation_errors) == 0
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
        # Build context
        context = service.build_expected_context(project_id)

        # Call LLM
        # TODO: Integrate with llm_service to call API
        # For now, return error as this needs LLM integration
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Internal LLM inference not yet implemented - use /suggest with external LLM"
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
            project_file = find_entity_file(vault_dir, project_id)
            if not project_file:
                failed[project_id] = "Project file not found"
                continue

            # Build update patch
            output = update.output
            patch = {
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
