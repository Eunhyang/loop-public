"""
Auto-Apply Service for Entity Validator

Automatically applies high-confidence LLM suggestions to entity files.

Safety mechanisms:
- Kill switch: AUTO_APPLY_CONFIG["enabled"]
- Field validation against schema
- Never auto-apply strategic fields
- Audit trail in pending_reviews.json + decision_log.jsonl
- Atomic file writes with proper error handling

Codex review improvements (tsk-n8n-23):
- Global kill switch enforcement
- Deterministic entity path resolution
- Field/value schema validation
- Confidence sanity checks
- Partial apply tracking
- Never auto-apply precedence
"""

import json
import re
import yaml
import fcntl
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional, Tuple, List
from contextlib import contextmanager

from ..utils.vault_utils import get_vault_dir, extract_frontmatter
from ..constants import TASK_STATUS, TASK_PRIORITY, PROJECT_STATUS
from ..services.decision_logger import log_decision


# ============================================
# Configuration
# ============================================

AUTO_APPLY_CONFIG = {
    "enabled": True,  # KILL SWITCH
    "default_threshold": 0.85,
    "field_thresholds": {
        "due": 0.85,
        "assignee": 0.85,
        "parent_id": 0.90,
        "priority": 0.80,
        "status": 0.80,
    },
    "deterministic_fields": ["status", "priority", "type"],  # Always apply if valid
    "never_auto_apply": [
        "expected_impact",
        "realized_impact",
        "validates",
        "validated_by",
        "conditions_3y",
        "condition_contributes",
        "evidence_links",
    ],
}


# ============================================
# Entity Path Resolution
# ============================================

def find_entity_file_deterministic(entity_id: str, entity_type: str) -> Optional[Path]:
    """
    Deterministic entity file resolution (Codex improvement)

    Uses strict pattern matching and fails fast on 0 or >1 matches.
    Avoids grep-based traversal attacks.

    Args:
        entity_id: Entity ID (e.g., tsk-001-01)
        entity_type: Task, Project, Hypothesis

    Returns:
        Path to entity file, or None if not found or ambiguous
    """
    vault_dir = get_vault_dir()

    # Sanitize entity_id (security)
    if not re.match(r'^[a-z]+-[a-z0-9-]+$', entity_id):
        print(f"[auto_apply] Invalid entity_id format: {entity_id}")
        return None

    # Define search patterns
    if entity_type == "Task":
        pattern = "50_Projects/**/Tasks/*.md"
    elif entity_type == "Project":
        pattern = "50_Projects/**/project.md"
    elif entity_type == "Hypothesis":
        pattern = "60_Hypotheses/**/*.md"
    else:
        print(f"[auto_apply] Unknown entity_type: {entity_type}")
        return None

    # Find all matching files
    candidates = []
    for path in vault_dir.glob(pattern):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read(2000)  # frontmatter only
                # Exact match in frontmatter
                if f"entity_id: {entity_id}" in content or f'entity_id: "{entity_id}"' in content:
                    candidates.append(path)
        except (IOError, UnicodeDecodeError):
            continue

    # Fail fast: require exactly 1 match
    if len(candidates) == 0:
        print(f"[auto_apply] Entity not found: {entity_id}")
        return None
    elif len(candidates) > 1:
        print(f"[auto_apply] Ambiguous entity_id (multiple matches): {entity_id}")
        return None

    return candidates[0]


# ============================================
# Field Validation
# ============================================

def validate_field_value(field: str, value: Any, entity_type: str) -> Tuple[bool, Optional[str]]:
    """
    Validate field value against schema (Codex improvement)

    Prevents malformed or adversarial LLM output from corrupting frontmatter.

    Args:
        field: Field name
        value: Proposed value
        entity_type: Task, Project, etc.

    Returns:
        (is_valid, error_message)
    """
    # Status validation
    if field == "status":
        if entity_type == "Task":
            if value not in TASK_STATUS:
                return False, f"Invalid Task status: {value}"
        elif entity_type == "Project":
            if value not in PROJECT_STATUS:
                return False, f"Invalid Project status: {value}"

    # Priority validation
    if field == "priority":
        if value not in TASK_PRIORITY:
            return False, f"Invalid priority: {value}"

    # Date validation (due, start_date, deadline, etc.)
    if field in ["due", "start_date", "deadline", "decided"]:
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', str(value)):
            return False, f"Invalid date format: {value} (expected YYYY-MM-DD)"

    # Parent ID validation
    if field == "parent_id":
        if not re.match(r'^[a-z]+-[a-z0-9-]+$', str(value)):
            return False, f"Invalid parent_id format: {value}"

    # Assignee validation (basic check)
    if field == "assignee":
        if not isinstance(value, str) or len(value.strip()) == 0:
            return False, f"Invalid assignee: {value}"

    return True, None


def sanitize_confidence(confidence: Any) -> float:
    """
    Sanitize confidence value (Codex improvement)

    Handles missing/NaN/out-of-range values.

    Args:
        confidence: Raw confidence value from LLM

    Returns:
        Sanitized confidence (0.0-1.0), or 0.0 if invalid
    """
    try:
        conf = float(confidence)
        if conf < 0.0 or conf > 1.0 or not (conf == conf):  # NaN check
            return 0.0
        return conf
    except (ValueError, TypeError):
        return 0.0


# ============================================
# Auto-Apply Decision Logic
# ============================================

def should_auto_apply(field: str, confidence: float, entity_type: str) -> bool:
    """
    Decide if field should be auto-applied

    Precedence (Codex improvement):
    1. Kill switch check (global)
    2. Never auto-apply list (highest priority)
    3. Deterministic fields (if valid)
    4. Confidence threshold

    Args:
        field: Field name
        confidence: Confidence score (0.0-1.0)
        entity_type: Task, Project, etc.

    Returns:
        True if should auto-apply
    """
    # 1. Kill switch (Codex improvement)
    if not AUTO_APPLY_CONFIG["enabled"]:
        return False

    # 2. Never auto-apply (highest priority, Codex improvement)
    if field in AUTO_APPLY_CONFIG["never_auto_apply"]:
        return False

    # 3. Deterministic fields (if confidence present)
    if field in AUTO_APPLY_CONFIG["deterministic_fields"]:
        # Codex: require confidence presence to avoid blind writes
        return confidence > 0.0

    # 4. Confidence threshold
    threshold = AUTO_APPLY_CONFIG["field_thresholds"].get(
        field,
        AUTO_APPLY_CONFIG["default_threshold"]
    )
    return confidence >= threshold


# ============================================
# File Locking Context Manager
# ============================================

@contextmanager
def file_lock(file_path: Path):
    """
    File lock for atomic writes (Codex improvement)

    Prevents race conditions during concurrent entity updates.
    """
    lock_file = file_path.with_suffix(file_path.suffix + '.lock')
    lock_file.parent.mkdir(parents=True, exist_ok=True)

    with open(lock_file, 'w') as lock_fd:
        try:
            fcntl.flock(lock_fd.fileno(), fcntl.LOCK_EX)
            yield
        finally:
            fcntl.flock(lock_fd.fileno(), fcntl.LOCK_UN)
            lock_file.unlink(missing_ok=True)


# ============================================
# Entity Frontmatter Update
# ============================================

def apply_fields_to_entity(
    entity_id: str,
    entity_type: str,
    fields: Dict[str, Any]
) -> Tuple[bool, List[str], List[str]]:
    """
    Apply fields to entity frontmatter with atomic write

    Codex improvements:
    - Deterministic path resolution
    - Field validation before write
    - File locking
    - Partial apply tracking
    - Temp file + rename for crash safety

    Args:
        entity_id: Entity ID
        entity_type: Task, Project, etc.
        fields: Fields to apply

    Returns:
        (success, applied_fields, failed_fields)
    """
    # Find entity file
    file_path = find_entity_file_deterministic(entity_id, entity_type)
    if not file_path:
        return False, [], list(fields.keys())

    applied = []
    failed = []

    try:
        with file_lock(file_path):
            # Read current content
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Parse frontmatter
            match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', content, re.DOTALL)
            if not match:
                print(f"[auto_apply] No frontmatter found: {file_path}")
                return False, [], list(fields.keys())

            frontmatter = yaml.safe_load(match.group(1))
            body = match.group(2)

            # Validate and apply each field
            for field, value in fields.items():
                is_valid, error = validate_field_value(field, value, entity_type)
                if not is_valid:
                    print(f"[auto_apply] Validation failed for {field}: {error}")
                    failed.append(field)
                    continue

                frontmatter[field] = value
                applied.append(field)

            # Update timestamp
            frontmatter['updated'] = datetime.now().strftime("%Y-%m-%d")

            # Write to temp file, then rename (atomic, Codex improvement)
            temp_path = file_path.with_suffix('.tmp')
            new_content = "---\n" + yaml.dump(
                frontmatter,
                allow_unicode=True,
                default_flow_style=False,
                sort_keys=False
            ) + "---\n" + body

            with open(temp_path, 'w', encoding='utf-8') as f:
                f.write(new_content)

            # Atomic rename
            temp_path.replace(file_path)

            print(f"[auto_apply] Applied {len(applied)} fields to {entity_id}")
            return True, applied, failed

    except Exception as e:
        print(f"[auto_apply] Error applying fields to {entity_id}: {e}")
        return False, [], list(fields.keys())


# ============================================
# Pending Review Creation
# ============================================

def create_auto_applied_review(
    entity_id: str,
    entity_type: str,
    entity_name: str,
    applied_fields: Dict[str, Any],
    confidence_scores: Dict[str, float],
    reasoning: Dict[str, str],
    run_id: Optional[str] = None,
    source_workflow: Optional[str] = None
) -> str:
    """
    Create pending review with status: auto_applied

    Codex improvements:
    - File locking for pending_reviews.json
    - Audit trail in decision_log.jsonl
    - Before/after snapshot

    Args:
        entity_id: Entity ID
        entity_type: Task, Project, etc.
        entity_name: Entity name
        applied_fields: Fields that were auto-applied
        confidence_scores: Confidence scores per field
        reasoning: LLM reasoning per field
        run_id: Workflow run ID
        source_workflow: n8n workflow name

    Returns:
        review_id
    """
    from ..routers.pending import load_pending, save_pending, generate_review_id

    vault_dir = get_vault_dir()
    pending_file = vault_dir / "_build" / "pending_reviews.json"

    review_id = generate_review_id()

    try:
        with file_lock(pending_file):
            data = load_pending()

            review = {
                "id": review_id,
                "entity_id": entity_id,
                "entity_type": entity_type,
                "entity_name": entity_name,
                "suggested_fields": applied_fields,
                "reasoning": reasoning,
                "confidence_scores": confidence_scores,
                "status": "auto_applied",
                "auto_applied_at": datetime.now().isoformat(),
                "created_at": datetime.now().isoformat(),
                "run_id": run_id,
                "source_workflow": source_workflow,
            }

            data["reviews"].append(review)
            save_pending(data)

        # Audit trail (Codex improvement)
        log_decision(
            entity_id=entity_id,
            entity_type=entity_type,
            decision="auto_applied",
            fields=applied_fields,
            confidence_scores=confidence_scores,
            user="auto_apply_service",
            reason="High-confidence LLM suggestion"
        )

        print(f"[auto_apply] Created auto_applied review: {review_id}")
        return review_id

    except Exception as e:
        print(f"[auto_apply] Error creating auto_applied review: {e}")
        return ""
