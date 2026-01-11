"""
LOOP API Constants

Single Source of Truth: 00_Meta/schema_constants.yaml
이 파일은 YAML에서 상수를 로드합니다.
"""

import os
from pathlib import Path
import yaml

# ============================================
# Load from YAML (Single Source of Truth)
# ============================================
# Docker: VAULT_DIR=/vault, Local: fallback to parent directory
_VAULT_DIR = os.getenv("VAULT_DIR", str(Path(__file__).parent.parent))
_YAML_PATH = Path(_VAULT_DIR) / "00_Meta" / "schema_constants.yaml"

def _load_constants():
    """YAML 파일에서 상수 로드"""
    if _YAML_PATH.exists():
        with open(_YAML_PATH, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    # Fallback if YAML not found (shouldn't happen)
    return {}

_constants = _load_constants()

# ============================================
# Task
# ============================================
_task = _constants.get("task", {})
TASK_STATUS = _task.get("status", ["todo", "doing", "hold", "done", "blocked"])
TASK_STATUS_DEFAULT = _task.get("status_default", "todo")
TASK_STATUS_LABELS = _task.get("status_labels", {})
TASK_STATUS_COLORS = _task.get("status_colors", {})

# ============================================
# Priority
# ============================================
_priority = _constants.get("priority", {})
PRIORITY = _priority.get("values", ["critical", "high", "medium", "low"])
TASK_PRIORITY = PRIORITY  # Alias for consistency with TASK_STATUS
PRIORITY_DEFAULT = _priority.get("default", "medium")
PRIORITY_LABELS = _priority.get("labels", {})
PRIORITY_COLORS = _priority.get("colors", {})

# ============================================
# Project
# ============================================
_project = _constants.get("project", {})
PROJECT_STATUS = _project.get("status", ["planning", "active", "paused", "done", "cancelled"])
PROJECT_STATUS_DEFAULT = _project.get("status_default", "planning")
PROJECT_STATUS_LABELS = _project.get("status_labels", {})

# ============================================
# Entity Types & Order
# ============================================
ENTITY_TYPES = _constants.get("entity_types", [
    "NorthStar",
    "MetaHypothesis",
    "Condition",
    "Track",
    "Program",
    "Project",
    "Task",
    "Hypothesis",
    "Experiment"
])
ENTITY_ORDER = _constants.get("entity_order", ENTITY_TYPES)

# ============================================
# Condition IDs
# ============================================
CONDITION_IDS = _constants.get("condition_ids", ["cond-a", "cond-b", "cond-c", "cond-d", "cond-e"])

# ============================================
# Program Types
# ============================================
PROGRAM_TYPES = _constants.get("program_types", ["hiring", "fundraising", "grants", "launch", "experiments", "infrastructure"])

# ============================================
# Hypothesis
# ============================================
_hypothesis = _constants.get("hypothesis", {})
HYPOTHESIS_EVIDENCE_STATUS = _hypothesis.get("evidence_status", ["assumed", "validating", "validated", "falsified", "learning"])

# ============================================
# Task Types & Target Projects
# ============================================
TASK_TYPES = _task.get("types", ["dev", "strategy", "research", "ops"])
TASK_TARGET_PROJECTS = _task.get("target_projects", ["sosi", "kkokkkok", "loop-api", "loop"])

# ============================================
# Impact
# ============================================
_impact = _constants.get("impact", {})
IMPACT_TIERS = _impact.get("tiers", ["strategic", "enabling", "operational", "none"])
IMPACT_MAGNITUDES = _impact.get("magnitudes", ["high", "mid", "low"])

# ============================================
# Risk Level
# ============================================
_risk = _constants.get("risk_level", {})
RISK_LEVEL = _risk.get("values", ["low", "medium", "high", "critical"])
RISK_LEVEL_DEFAULT = _risk.get("default", "medium")

# ============================================
# Status Mapping (Dashboard용)
# ============================================
STATUS_MAPPING = _constants.get("status_mapping", {})

# ============================================
# ID Patterns (엔티티별 ID 정규식)
# ============================================
ID_PATTERNS = _constants.get("id_patterns", {})

# ============================================
# Paths (검증/인덱싱 대상 경로)
# ============================================
_paths = _constants.get("paths", {})
PATHS_INCLUDE = _paths.get("include", [])
PATHS_EXCLUDE = _paths.get("exclude", [])
PATHS_EXCLUDE_FILES = _paths.get("exclude_files", [])

# ============================================
# Required Fields (엔티티별 필수 필드)
# ============================================
REQUIRED_FIELDS = _constants.get("required_fields", {})

# ============================================
# Known Fields (freshness check용)
# ============================================
KNOWN_FIELDS = _constants.get("known_fields", {})

# ============================================
# NorthStar
# ============================================
_northstar = _constants.get("northstar", {})
NORTHSTAR_STATUS = _northstar.get("status", ["fixed"])

# ============================================
# Project Colors
# ============================================
PROJECT_STATUS_COLORS = _project.get("status_colors", {})

# ============================================
# Helper function to get all constants as dict
# ============================================
def get_all_constants():
    """모든 상수를 dict로 반환 (API 응답용)"""
    return {
        "task": {
            "status": TASK_STATUS,
            "status_default": TASK_STATUS_DEFAULT,
            "status_labels": TASK_STATUS_LABELS,
            "status_colors": TASK_STATUS_COLORS,
            "types": TASK_TYPES,
            "target_projects": TASK_TARGET_PROJECTS
        },
        "priority": {
            "values": PRIORITY,
            "default": PRIORITY_DEFAULT,
            "labels": PRIORITY_LABELS,
            "colors": PRIORITY_COLORS
        },
        "project": {
            "status": PROJECT_STATUS,
            "status_default": PROJECT_STATUS_DEFAULT,
            "status_labels": PROJECT_STATUS_LABELS,
            "status_colors": PROJECT_STATUS_COLORS
        },
        "entity_types": ENTITY_TYPES,
        "entity_order": ENTITY_ORDER,
        "condition_ids": CONDITION_IDS,
        "program_types": PROGRAM_TYPES,
        "hypothesis": {
            "evidence_status": HYPOTHESIS_EVIDENCE_STATUS
        },
        "impact": {
            "tiers": IMPACT_TIERS,
            "magnitudes": IMPACT_MAGNITUDES
        },
        "risk_level": {
            "values": RISK_LEVEL,
            "default": RISK_LEVEL_DEFAULT
        },
        "status_mapping": STATUS_MAPPING,
        "id_patterns": ID_PATTERNS,
        "paths": {
            "include": PATHS_INCLUDE,
            "exclude": PATHS_EXCLUDE,
            "exclude_files": PATHS_EXCLUDE_FILES
        },
        "required_fields": REQUIRED_FIELDS,
        "known_fields": KNOWN_FIELDS,
        "northstar": {
            "status": NORTHSTAR_STATUS
        }
    }
