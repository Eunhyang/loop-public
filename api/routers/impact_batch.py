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
from ..utils.impact_calculator import calculate_expected_score
from .pending import find_entity_file, update_entity_frontmatter

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

    return WorklistResponse(
        run_id=run_id,
        total_matched=len(filtered),
        items=items
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

            # Parse LLM response
            suggested_fields = {}
            reasoning = {}
            warnings = []

            # tier
            if "tier" in content:
                tier_data = content["tier"]
                if isinstance(tier_data, dict):
                    suggested_fields["tier"] = tier_data.get("value", "operational")
                    reasoning["tier"] = tier_data.get("reasoning", "")
                else:
                    suggested_fields["tier"] = tier_data

            # impact_magnitude
            if "impact_magnitude" in content:
                mag_data = content["impact_magnitude"]
                if isinstance(mag_data, dict):
                    suggested_fields["impact_magnitude"] = mag_data.get("value", "mid")
                    reasoning["impact_magnitude"] = mag_data.get("reasoning", "")
                else:
                    suggested_fields["impact_magnitude"] = mag_data

            # confidence
            if "confidence" in content:
                conf_data = content["confidence"]
                if isinstance(conf_data, dict):
                    suggested_fields["confidence"] = conf_data.get("value", 0.7)
                    reasoning["confidence"] = conf_data.get("reasoning", "")
                else:
                    suggested_fields["confidence"] = conf_data

            # contributes
            if "contributes" in content:
                contrib_data = content["contributes"]
                if isinstance(contrib_data, dict):
                    suggested_fields["contributes"] = contrib_data.get("value", [])
                    reasoning["contributes"] = contrib_data.get("reasoning", "")
                else:
                    suggested_fields["contributes"] = contrib_data

            # Calculate expected score
            calculated_fields = {}
            if all(k in suggested_fields for k in ["tier", "impact_magnitude", "confidence"]):
                try:
                    score_result = calculate_expected_score(
                        tier=suggested_fields["tier"],
                        magnitude=suggested_fields["impact_magnitude"],
                        confidence=suggested_fields["confidence"],
                        contributes=suggested_fields.get("contributes", [])
                    )
                    calculated_fields["expected_score"] = score_result["score"]
                    calculated_fields["score_components"] = score_result
                except Exception as e:
                    warnings.append(f"Score calculation failed: {str(e)}")

            suggestions.append(SuggestBatchSuggestion(
                project_id=project_id,
                status="success",
                suggested_fields=suggested_fields,
                calculated_fields=calculated_fields,
                reasoning=reasoning,
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

    return SuggestBatchResponse(
        run_id=run_id,
        mode=request.mode,
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

    if all(k in draft for k in ["tier", "impact_magnitude", "confidence"]):
        try:
            score_result = calculate_expected_score(
                tier=draft["tier"],
                magnitude=draft["impact_magnitude"],
                confidence=draft["confidence"],
                contributes=draft.get("contributes", [])
            )
            calculated["expected_score"] = score_result["score"]
            calculated["score_components"] = score_result
        except Exception as e:
            warnings.append(f"Score calculation failed: {str(e)}")

    # Build diff
    diff = {}
    for key in ["tier", "impact_magnitude", "confidence", "contributes"]:
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

    # Validate tier/condition alignment
    draft_tier = draft.get("tier")
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

    # Process updates
    results = []
    success_count = 0
    failed_count = 0
    skipped_count = 0

    for update in request.updates:
        project_id = update.project_id
        patch = update.patch

        try:
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
                    applied_fields=list(patch.keys())
                ))
                success_count += 1
            else:
                results.append(ApplyBatchResult(
                    project_id=project_id,
                    status="failed",
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
            validated=len(request.updates),
            blocked_by_derived_fields=0,
            schema_errors=0
        ),
        summary={
            "total": len(request.updates),
            "success": success_count,
            "failed": failed_count,
            "skipped": skipped_count
        }
    )
