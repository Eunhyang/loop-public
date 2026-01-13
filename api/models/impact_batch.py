"""
Pydantic Models for Expected Impact Batch Fill API

Batch processing models for generating worklists, LLM suggestions,
preview, and atomic batch updates of Expected Impact fields.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator


# ============================================
# New Models for v2 API (Phase 3)
# ============================================

class OutputContract(BaseModel):
    """Required fields specification for LLM output"""
    must_set: List[str] = Field(
        description="Fields that must be filled (tier, impact_magnitude, confidence, etc.)"
    )
    contributes_rules: Dict[str, Any] = Field(
        description="Rules for condition_contributes and track_contributes"
    )
    hypothesis_rules: Dict[str, Any] = Field(
        description="Rules for hypothesis linking (validates, primary_hypothesis_id)"
    )


class ScoringContext(BaseModel):
    """Impact model context for LLM"""
    impact_model_version: str = Field(
        description="Version of impact_model_config.yml"
    )
    tier_points: Dict[str, Dict[str, float]] = Field(
        description="magnitude_points table from config"
    )
    display_rules: Dict[str, Any] = Field(
        description="Display formatting rules"
    )


class ContributeItem(BaseModel):
    """Single contribution item (condition or track)"""
    condition_id: Optional[str] = None
    track_id: Optional[str] = None
    weight: float = Field(ge=0.0, le=1.0, description="Contribution weight (0.0-1.0)")


class ApplyPatch(BaseModel):
    """SSOT-ready patch format (v5.3 schema compliant)"""
    expected_impact: Dict[str, Any] = Field(
        description="Impact statement, metric, target (NO contributes inside)"
    )
    condition_contributes: List[ContributeItem] = Field(
        default_factory=list,
        description="TOP-LEVEL field: condition contributions"
    )
    track_contributes: List[ContributeItem] = Field(
        default_factory=list,
        description="TOP-LEVEL field: track contributions"
    )
    validates: List[str] = Field(
        default_factory=list,
        description="Hypothesis IDs this project validates"
    )
    primary_hypothesis_id: Optional[str] = Field(
        default=None,
        description="Primary hypothesis being tested"
    )
    assumptions: List[str] = Field(
        default_factory=list,
        description="Key assumptions"
    )
    evidence_refs: List[str] = Field(
        default_factory=list,
        description="Supporting evidence references"
    )
    linking_reason: Optional[str] = Field(
        default=None,
        description="Why this project links to hypotheses/conditions/tracks"
    )


class StructuredReasoning(BaseModel):
    """Audit-ready reasoning breakdown"""
    tier_reason: str = Field(description="Why this tier was chosen")
    magnitude_reason: str = Field(description="Why this magnitude")
    confidence_reason: str = Field(description="Factors affecting confidence")
    assumptions: List[str] = Field(
        default_factory=list,
        description="Key assumptions"
    )
    evidence_refs: List[str] = Field(
        default_factory=list,
        description="Supporting evidence"
    )
    linking_reason: Optional[str] = Field(
        default=None,
        description="Why this links to hypotheses/conditions/tracks"
    )
    rollup_reason: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Reasoning for condition/track weight allocation"
    )


class CalculatedFields(BaseModel):
    """Complete score calculation results"""
    magnitude_points: float = Field(description="Base points for tier/magnitude")
    expected_score_raw: float = Field(description="Raw calculated score")
    max_score_by_tier: float = Field(description="Max possible score for this tier")
    normalized_score_10: float = Field(description="Normalized to 0-10 scale")
    display_star_5: Optional[float] = Field(default=None, description="5-star display rating")
    calculation: str = Field(description="Calculation formula string")


class FieldValidationError(BaseModel):
    """Structured field-level error (NEW - Codex Finding #5)"""
    field_path: str = Field(
        description="e.g., 'expected_impact.statement', 'condition_contributes[0].weight'"
    )
    error_type: str = Field(
        description="missing_required | invalid_type | invalid_value | constraint_violation"
    )
    message: str
    expected: Optional[Any] = Field(default=None, description="Expected value/type")
    actual: Optional[Any] = Field(default=None, description="Actual value received")
    constraint: Optional[str] = Field(default=None, description="Constraint rule violated")


class EnhancedPreviewRequest(BaseModel):
    """Complete preview request schema (NEW - Codex Finding #5)"""
    project_id: str
    apply_patch: ApplyPatch  # Use new ApplyPatch model
    parent_chain: Optional[List[str]] = Field(
        default=None,
        description="For hierarchy validation"
    )
    existing_contributes: Optional[Dict] = Field(
        default=None,
        description="Current state for diff"
    )
    validate_weights: bool = Field(default=True, description="Enable weight sum check")
    validate_hypothesis_links: bool = Field(
        default=True,
        description="Enable strategic tier check"
    )


class EnhancedPreviewResponse(BaseModel):
    """Complete response with validation results (NEW - Codex Finding #5)"""
    project_id: str
    status: str = Field(description="valid | warnings | errors")
    validation_passed: bool
    warnings: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Structured warnings (non-blocking)"
    )
    errors: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Structured errors (blocking)"
    )
    apply_patch_preview: ApplyPatch
    impact_preview: CalculatedFields
    changes_summary: Dict[str, Any] = Field(
        default_factory=dict,
        description="{'added': [...], 'removed': [...], 'modified': [...]}"
    )


# ============================================
# Worklist Models
# ============================================

class WorklistFilters(BaseModel):
    """Filters for generating project worklist"""
    missing_expected_impact: bool = Field(
        default=True,
        description="Only projects with missing or incomplete expected_impact"
    )
    project_status_in: Optional[List[str]] = Field(
        default=None,
        description="Filter by project status (doing, todo, backlog, etc.)"
    )
    limit: int = Field(
        default=50,
        ge=1,
        le=100,
        description="Maximum number of projects to return (1-100)"
    )


class WorklistInclude(BaseModel):
    """Context flags for worklist items"""
    project_body: bool = Field(default=False, description="Include project body content")
    parent_chain: bool = Field(default=True, description="Include parent chain (track→condition→mh→ns)")
    track_context: bool = Field(default=True, description="Include track details")
    condition_context: bool = Field(default=True, description="Include condition details")
    candidate_hypotheses: bool = Field(default=True, description="Include candidate hypotheses for track")


class WorklistRequest(BaseModel):
    """Request for generating Expected Impact worklist"""
    filters: WorklistFilters = Field(default_factory=WorklistFilters)
    include: WorklistInclude = Field(default_factory=WorklistInclude)


class WorklistItem(BaseModel):
    """Single project in worklist with context"""
    project_id: str
    project_name: str
    status: str
    parent_id: Optional[str] = None
    context: Dict[str, Any] = Field(
        default_factory=dict,
        description="Project context (parent_chain, track, conditions, hypotheses)"
    )


class WorklistResponse(BaseModel):
    """Response with list of projects needing Expected Impact"""
    run_id: str = Field(description="Server-generated run ID (run-YYYYMMDD-HHMMSS-{random})")
    total_matched: int
    items: List[WorklistItem]
    required_output_contract: Optional[OutputContract] = Field(
        default=None,
        description="Required fields specification for LLM"
    )
    scoring_context: Optional[ScoringContext] = Field(
        default=None,
        description="Impact model context"
    )


# ============================================
# Suggest Batch Models
# ============================================

class SuggestBatchItem(BaseModel):
    """Single project for batch suggestion"""
    project_id: str


class SuggestBatchRequest(BaseModel):
    """Request for batch LLM suggestions"""
    run_id: Optional[str] = Field(
        default=None,
        description="Optional run_id from worklist (server generates if not provided)"
    )
    items: List[SuggestBatchItem] = Field(
        description="List of projects to process"
    )
    mode: str = Field(
        default="preview",
        description="preview (no save) | pending (save to pending_reviews) | execute (immediate apply)"
    )
    provider: str = Field(
        default="openai",
        description="LLM provider (openai | anthropic)"
    )
    constraints: Dict[str, Any] = Field(
        default_factory=dict,
        description="Optional constraints (e.g., force_tier, max_confidence)"
    )

    @field_validator('mode')
    @classmethod
    def validate_mode(cls, v):
        allowed = ['preview', 'pending', 'execute']
        if v not in allowed:
            raise ValueError(f"mode must be one of {allowed}")
        return v


class SuggestBatchSuggestion(BaseModel):
    """LLM suggestion for single project"""
    project_id: str
    status: str = Field(description="success | error")
    apply_patch: Optional[ApplyPatch] = Field(
        default=None,
        description="v5.3 schema compliant patch (new format)"
    )
    suggested_fields: Dict[str, Any] = Field(
        default_factory=dict,
        description="LLM suggested fields (DEPRECATED - use apply_patch)"
    )
    calculated_fields: Optional[CalculatedFields] = Field(
        default=None,
        description="Server calculated fields with complete breakdown"
    )
    reasoning: Optional[StructuredReasoning] = Field(
        default=None,
        description="Structured reasoning breakdown"
    )
    warnings: List[str] = Field(
        default_factory=list,
        description="Validation warnings"
    )
    error: Optional[str] = None


class SuggestBatchResponse(BaseModel):
    """Response with batch suggestions"""
    run_id: str
    mode: str
    schema_version: str = Field(default="v2", description="API schema version")
    impact_model_version: Optional[str] = Field(
        default=None,
        description="Version from impact_model_config.yml"
    )
    suggestions: List[SuggestBatchSuggestion]
    summary: Dict[str, int] = Field(
        description="Summary stats (total, success, failed)"
    )


# ============================================
# Preview Models
# ============================================

class PreviewRequest(BaseModel):
    """Request to preview Expected Impact scores before applying"""
    project_id: str
    draft: Dict[str, Any] = Field(
        description="Draft expected_impact fields (tier, impact_magnitude, confidence, contributes)"
    )


class PreviewDiff(BaseModel):
    """Before/after diff for single field"""
    before: Any
    after: Any


class PreviewResponse(BaseModel):
    """Response with calculated scores and diff"""
    project_id: str
    calculated: Dict[str, Any] = Field(
        description="Calculated scores for draft (expected_score)"
    )
    diff: Dict[str, PreviewDiff] = Field(
        description="Field-by-field diff (before vs after)"
    )
    warnings: List[str] = Field(
        default_factory=list,
        description="Validation warnings (tier/condition mismatch, etc.)"
    )


# ============================================
# Apply Batch Models
# ============================================

class ApplyBatchUpdate(BaseModel):
    """Single project update in batch"""
    project_id: str
    patch: Dict[str, Any] = Field(
        description="Fields to update (nested expected_impact dict)"
    )

    @field_validator('patch')
    @classmethod
    def validate_no_derived_fields(cls, v):
        """Block writes to derived fields"""
        DERIVED_FIELDS = {'validated_by', 'realized_sum'}

        # Check top-level keys
        if any(key in DERIVED_FIELDS for key in v.keys()):
            raise ValueError(f"Cannot write to derived fields: {DERIVED_FIELDS}")

        # Check nested expected_impact keys
        if 'expected_impact' in v and isinstance(v['expected_impact'], dict):
            if any(key in DERIVED_FIELDS for key in v['expected_impact'].keys()):
                raise ValueError(f"Cannot write to derived fields: {DERIVED_FIELDS}")

        return v


class ApplyBatchRequest(BaseModel):
    """Request to apply batch updates"""
    run_id: Optional[str] = Field(
        default=None,
        description="Optional run_id (server generates if not provided)"
    )
    mode: str = Field(
        default="execute",
        description="execute (apply immediately)"
    )
    commit_message: Optional[str] = Field(
        default=None,
        description="Optional commit message for audit log"
    )
    updates: List[ApplyBatchUpdate] = Field(
        description="List of project updates to apply"
    )

    @field_validator('mode')
    @classmethod
    def validate_mode(cls, v):
        if v != 'execute':
            raise ValueError("Only mode='execute' is supported for apply-batch")
        return v


class ApplyBatchResult(BaseModel):
    """Result for single project update"""
    project_id: str
    status: str = Field(description="success | validation_error | write_error | skipped")
    updated_at: Optional[str] = None
    applied_fields: List[str] = Field(
        default_factory=list,
        description="List of fields successfully applied"
    )
    applied_patch: Optional[ApplyPatch] = Field(
        default=None,
        description="The patch that was applied"
    )
    file_path: Optional[str] = None
    validation_errors: List[FieldValidationError] = Field(
        default_factory=list,
        description="Field-level validation errors (NEW - Codex Finding #5)"
    )
    error: Optional[str] = None


class ApplyBatchAudit(BaseModel):
    """Audit trail for batch operation"""
    decision_log_path: str = Field(
        description="Path to decision log file"
    )
    logged: bool = Field(
        description="Whether audit was successfully logged"
    )
    user_id: Optional[str] = None


class ApplyBatchValidation(BaseModel):
    """Validation summary for batch operation"""
    total_updates: int
    validated: int
    blocked_by_derived_fields: int = 0
    schema_errors: int = 0


class ApplyBatchResponse(BaseModel):
    """Response for batch apply operation"""
    run_id: str
    mode: str
    results: List[ApplyBatchResult]
    audit: ApplyBatchAudit
    validation: ApplyBatchValidation
    summary: Dict[str, int] = Field(
        description="Summary stats (total, success, failed, skipped)"
    )
