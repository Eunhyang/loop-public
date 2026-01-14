"""
Impact Expected Internal Inference

Small wrapper around LLMService to build a prompt from unified context and
return a normalized ImpactExpectedOutput.

The goal is to keep /infer lean: context building and validation stay in
impact_expected_service, while this module only handles the LLM call +
output parsing.
"""

import json
from typing import Optional, Dict, Any, Tuple

from .llm_service import LLMService
from . import impact_expected_service as service
from ..models.impact_expected import ImpactExpectedContext, ImpactExpectedOutput


def _build_prompt(
    context: ImpactExpectedContext,
    previous_output: Optional[ImpactExpectedOutput],
    user_feedback: Optional[str]
) -> str:
    """Compose a compact prompt for the LLM."""
    parts = [
        "You are an impact evaluator. Return JSON only (no prose).",
        "Schema version must be v5.3 with fields:",
        "- tier (strategic|enabling|operational)",
        "- impact_magnitude (high|mid|low)",
        "- confidence (0.0-1.0)",
        "- summary (statement)",
        "- validates (list of hypothesis ids), primary_hypothesis_id",
        "- condition_contributes[{condition_id, weight}], track_contributes[{track_id, weight}]",
        "- assumptions[], evidence_refs[], linking_reason",
        "",
        "Project Context:",
        json.dumps(context.model_dump(), ensure_ascii=False),
    ]

    if previous_output:
        parts.append("\nPrevious Output:")
        parts.append(json.dumps(previous_output.model_dump(), ensure_ascii=False))

    if user_feedback:
        parts.append("\nUser Feedback:")
        parts.append(user_feedback)

    parts.append("\nRespond with JSON only.")
    return "\n".join(parts)


async def run_internal_inference(
    project_id: str,
    context: ImpactExpectedContext,
    provider: str = "openai",
    model: str = "gpt-5.1",
    previous_output: Optional[ImpactExpectedOutput] = None,
    user_feedback: Optional[str] = None,
    actor: str = "api"
) -> Tuple[ImpactExpectedOutput, Dict[str, Any]]:
    """
    Call LLM and return normalized ImpactExpectedOutput and metadata.

    Returns:
        (output, meta) where meta contains run_id/model/provider/raw_output
    Raises:
        ValueError on LLM or parsing failures
    """
    llm = LLMService()
    prompt = _build_prompt(context, previous_output, user_feedback)
    system_prompt = "You are a precise impact model. Output valid JSON that matches schema v5.3. No text."

    result = await llm.call_llm(
        prompt=prompt,
        system_prompt=system_prompt,
        provider=provider,
        model=model,
        response_format="json",
        entity_context={
            "entity_id": project_id,
            "entity_type": "Project",
            "action": "impact_expected_infer",
            "actor": actor
        }
    )

    if not result.get("success"):
        raise ValueError(result.get("error") or "LLM call failed")

    content = result.get("content")
    if isinstance(content, str):
        try:
            content = json.loads(content)
        except json.JSONDecodeError as e:
            raise ValueError(f"LLM output is not valid JSON: {e}") from e

    if not isinstance(content, dict):
        raise ValueError("LLM output must be a JSON object")

    # Ensure schema_version for downstream logging (best effort)
    content.setdefault("schema_version", "v5.3")

    output = service.normalize_llm_output(content)
    meta = {
        "run_id": result.get("run_id"),
        "model": result.get("model"),
        "provider": result.get("provider"),
        "raw": result.get("raw"),
    }
    return output, meta
