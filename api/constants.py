"""
LOOP API Constants

모든 상수를 한 곳에서 관리
- Task/Project 상태, 우선순위 등
- Frontend에서 /api/constants로 조회 가능
"""

# ============================================
# Task
# ============================================
TASK_STATUS = ["todo", "doing", "done", "blocked"]
TASK_STATUS_DEFAULT = "todo"

TASK_STATUS_LABELS = {
    "todo": "To Do",
    "doing": "Doing",
    "done": "Done",
    "blocked": "Blocked"
}

TASK_STATUS_COLORS = {
    "todo": "#6b7280",      # gray
    "doing": "#3b82f6",     # blue
    "done": "#10b981",      # green
    "blocked": "#ef4444"    # red
}

# ============================================
# Priority
# ============================================
PRIORITY = ["critical", "high", "medium", "low"]
PRIORITY_DEFAULT = "medium"

PRIORITY_LABELS = {
    "critical": "Critical",
    "high": "High",
    "medium": "Medium",
    "low": "Low"
}

PRIORITY_COLORS = {
    "critical": "#dc2626",  # red-600
    "high": "#f97316",      # orange-500
    "medium": "#eab308",    # yellow-500
    "low": "#22c55e"        # green-500
}

# ============================================
# Project
# ============================================
PROJECT_STATUS = ["planning", "active", "paused", "done", "cancelled"]
PROJECT_STATUS_DEFAULT = "planning"

PROJECT_STATUS_LABELS = {
    "planning": "Planning",
    "active": "Active",
    "paused": "Paused",
    "done": "Done",
    "cancelled": "Cancelled"
}

# ============================================
# Entity Types
# ============================================
ENTITY_TYPES = [
    "NorthStar",
    "MetaHypothesis",
    "Condition",
    "Track",
    "Project",
    "Task",
    "Hypothesis",
    "Experiment"
]

# ============================================
# Risk Level
# ============================================
RISK_LEVEL = ["low", "medium", "high", "critical"]
RISK_LEVEL_DEFAULT = "medium"

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
            "status_colors": TASK_STATUS_COLORS
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
            "status_labels": PROJECT_STATUS_LABELS
        },
        "entity_types": ENTITY_TYPES,
        "risk_level": {
            "values": RISK_LEVEL,
            "default": RISK_LEVEL_DEFAULT
        }
    }
