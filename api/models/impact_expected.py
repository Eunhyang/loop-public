"""
Impact Expected Models - Unified Schema for LLM Inference

Pydantic v2 models for Impact Expected context and output.
Used by both external ChatGPT and internal API LLM.

Schema Version: v5.3
Impact Model Version: 1.3.1
"""

from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field, field_validator


# ============================================
# Context Models (Input to LLM)
# ============================================

class ProjectContext(BaseModel):
    """Project information for LLM context"""
    entity_id: str = Field(description="Project ID (e.g., prj-023)")
    entity_name: str = Field(description="Project name")
    description: Optional[str] = Field(default=None, description="Project description")
    conditions_3y: List[str] = Field(default_factory=list, description="3-year conditions this project targets")
    track_id: Optional[str] = Field(default=None, description="12-month track this project belongs to")
    parent_chain: List[str] = Field(default_factory=list, description="Parent hierarchy [track_id, ...condition_ids]")
    existing_expected_impact: Optional[Dict[str, Any]] = Field(default=None, description="Existing Expected Impact if any")


class OutputContract(BaseModel):
    """Required output fields specification for LLM"""
    must_set: List[str] = Field(
        description="Fields that must be filled (tier, impact_magnitude, confidence, summary)"
    )
    hypothesis_rules: Dict[str, Any] = Field(
        description="Rules for hypothesis linking (strategic_must_validate, etc.)"
    )
    contributes_rules: Dict[str, Any] = Field(
        description="Rules for condition_contributes and track_contributes (max_weight_sum)"
    )


class ScoringContext(BaseModel):
    """Impact model scoring context for LLM"""
    tier_points: Dict[str, Dict[str, float]] = Field(
        description="magnitude_points table from impact_model_config.yml"
    )
    display_rules: Dict[str, Any] = Field(
        description="Display formatting rules"
    )


class ImpactExpectedContext(BaseModel):
    """
    Unified context for LLM inference (external or internal).

    This is the single schema used by both:
    - External ChatGPT (via /context endpoint)
    - Internal API LLM (via /infer endpoint)
    """
    schema_version: str = Field(default="v2", description="Context schema version")
    impact_model_version: str = Field(description="Impact model version (from config)")
    project: ProjectContext = Field(description="Project information")
    required_output_contract: OutputContract = Field(description="Output requirements for LLM")
    scoring_context: ScoringContext = Field(description="Scoring rules and points")


# ============================================
# Output Models (LLM Response)
# ============================================

class ContributeItem(BaseModel):
    """Single contribution item for condition or track"""
    condition_id: Optional[str] = Field(default=None, description="Condition ID if this is a condition contribution")
    track_id: Optional[str] = Field(default=None, description="Track ID if this is a track contribution")
    weight: float = Field(ge=0.0, le=1.0, description="Contribution weight (0.0-1.0)")

    @field_validator('weight')
    @classmethod
    def validate_weight_range(cls, v: float) -> float:
        """Ensure weight is in valid range"""
        if not (0.0 <= v <= 1.0):
            raise ValueError(f"Weight {v} must be in range [0.0, 1.0]")
        return v


class ImpactExpectedOutput(BaseModel):
    """
    Expected Impact output from LLM (schema v5.3).

    This is the normalized output format used by both external and internal LLM.
    """
    tier: Literal["strategic", "enabling", "operational"] = Field(
        description="Impact tier"
    )
    impact_magnitude: Literal["high", "mid", "low"] = Field(
        description="Impact magnitude within the tier"
    )
    confidence: float = Field(
        ge=0.0, le=1.0,
        description="Confidence in this assessment (0.0-1.0)"
    )
    summary: str = Field(
        min_length=1,
        description="Impact statement summary"
    )
    validates: List[str] = Field(
        default_factory=list,
        description="Hypothesis IDs this project validates"
    )
    primary_hypothesis_id: Optional[str] = Field(
        default=None,
        description="Primary hypothesis being tested (required for strategic tier)"
    )
    condition_contributes: List[ContributeItem] = Field(
        default_factory=list,
        description="Condition contributions with weights"
    )
    track_contributes: List[ContributeItem] = Field(
        default_factory=list,
        description="Track contributions with weights"
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

    @field_validator('confidence')
    @classmethod
    def validate_confidence_range(cls, v: float) -> float:
        """Ensure confidence is in valid range"""
        if not (0.0 <= v <= 1.0):
            raise ValueError(f"Confidence {v} must be in range [0.0, 1.0]")
        return v

    @field_validator('summary')
    @classmethod
    def validate_summary_not_empty(cls, v: str) -> str:
        """Ensure summary is not empty or whitespace-only"""
        if not v or v.strip() == "":
            raise ValueError("Summary cannot be empty")
        return v


# ============================================
# API Request/Response Models
# ============================================

class ContextRequest(BaseModel):
    """Request to get unified context for LLM"""
    project_ids: List[str] = Field(
        description="List of project IDs to get context for"
    )


class ContextResponse(BaseModel):
    """Response with unified contexts"""
    contexts: Dict[str, ImpactExpectedContext] = Field(
        description="Map of project_id -> context"
    )
    errors: Dict[str, str] = Field(
        default_factory=dict,
        description="Map of project_id -> error message for failures"
    )


class SuggestRequest(BaseModel):
    """Request to submit external LLM output"""
    project_id: str = Field(description="Project ID")
    llm_output: Dict[str, Any] = Field(description="Raw LLM output (JSON)")
    mode: Literal["preview", "pending", "apply"] = Field(default="preview", description="preview | pending | apply")
    previous_output: Optional[ImpactExpectedOutput] = Field(default=None, description="Previous output for diff/iteration")
    user_feedback: Optional[str] = Field(default=None, description="User feedback to guide validation or re-run")
    actor: Optional[str] = Field(default="api", description="Caller identifier (api, dashboard, n8n, claude)")
    source_workflow: Optional[str] = Field(default=None, description="Workflow name (e.g., n8n flow)")


class InferRequest(BaseModel):
    """Request to run internal LLM inference"""
    project_id: str = Field(description="Project ID")
    provider: Optional[str] = Field(default="anthropic", description="LLM provider (anthropic, openai, etc.)")
    mode: Literal["preview", "pending", "apply"] = Field(default="preview", description="preview | pending | apply")
    previous_output: Optional[ImpactExpectedOutput] = Field(default=None, description="Previous output for diff/iteration")
    user_feedback: Optional[str] = Field(default=None, description="User feedback to guide re-generation")
    actor: Optional[str] = Field(default="api", description="Caller identifier (api, dashboard, n8n, claude)")
    source_workflow: Optional[str] = Field(default=None, description="Workflow name (e.g., n8n flow)")


class ValidationError(BaseModel):
    """Single validation error"""
    field: str = Field(description="Field path (e.g., 'validates', 'condition_contributes')")
    error: str = Field(description="Error message")


class InferenceResult(BaseModel):
    """Result of LLM inference with validation"""
    project_id: str
    output: Optional[ImpactExpectedOutput] = None
    validation_errors: List[ValidationError] = Field(default_factory=list)
    calculated_fields: Optional[Dict[str, Any]] = None
    success: bool = Field(description="True if validation passed")
    run_id: Optional[str] = Field(default=None, description="LLM/audit run id")
    iteration: Optional[int] = Field(default=None, description="Server-managed iteration number")
    diff: Optional[Dict[str, Any]] = Field(default=None, description="Diff between current and proposed")
    diff_summary: Optional[str] = Field(default=None, description="Short summary of proposed change")


class PreviewRequest(BaseModel):
    """Request to preview changes before applying"""
    project_id: str
    output: ImpactExpectedOutput


class PreviewResponse(BaseModel):
    """Preview of changes with score calculation"""
    project_id: str
    current: Optional[Dict[str, Any]] = Field(default=None, description="Current Expected Impact")
    proposed: Dict[str, Any] = Field(description="Proposed Expected Impact")
    score_change: Optional[Dict[str, Any]] = Field(default=None, description="A score change (old -> new)")
    validation_errors: List[ValidationError] = Field(default_factory=list)


class ApplyBatchRequest(BaseModel):
    """Request to apply batch updates"""
    updates: List[InferenceResult] = Field(description="List of validated updates to apply")
    run_id: Optional[str] = Field(default=None, description="Audit run ID")


class ApplyBatchResponse(BaseModel):
    """Response from batch apply operation"""
    run_id: str
    applied: List[str] = Field(default_factory=list, description="Successfully applied project IDs")
    failed: Dict[str, str] = Field(default_factory=dict, description="Failed project IDs with error messages")
    total: int = Field(description="Total number of updates attempted")
