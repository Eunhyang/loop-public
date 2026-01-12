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
        tracks = cache.get_tracks() if hasattr(cache, 'get_tracks') else []
        track = next((t for t in tracks if t.get("entity_id") == parent_id), None)

        if track:
            # Condition (from track's parent_id)
            track_parent = track.get("parent_id")
            if track_parent:
                chain.append(track_parent)

                # Get condition to find metahypothesis
                conditions = cache.get_conditions() if hasattr(cache, 'get_conditions') else []
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
    hypotheses = cache.get_hypotheses() if hasattr(cache, 'get_hypotheses') else []

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
        tracks = cache.get_tracks() if hasattr(cache, 'get_tracks') else []
        track = next((t for t in tracks if t.get("entity_id") == parent_id), None)
        context["track"] = track  # None if not found (graceful)

    # Condition context
    if include_flags.get("condition_context", True):
        conditions_3y = project.get("conditions_3y", [])
        if conditions_3y:
            conditions = cache.get_conditions() if hasattr(cache, 'get_conditions') else []
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
    projects = cache.get_projects()

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
