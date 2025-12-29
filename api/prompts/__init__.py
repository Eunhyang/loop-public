"""
LLM Prompts for Autofill API

이 모듈은 API에서 사용하는 LLM 프롬프트를 정의합니다.
기존 스킬(.claude/skills/)의 프롬프트를 API용으로 이전.

v5 추가: task_schema, project_schema (n8n Phase 1/2 통합)
"""

from .expected_impact import (
    EXPECTED_IMPACT_SYSTEM_PROMPT,
    build_expected_impact_prompt
)
from .realized_impact import (
    REALIZED_IMPACT_SYSTEM_PROMPT,
    build_realized_impact_prompt
)
from .task_schema import (
    TASK_SCHEMA_SYSTEM_PROMPT,
    build_task_schema_prompt,
    build_simple_task_schema_prompt
)
from .project_schema import (
    PROJECT_SCHEMA_SYSTEM_PROMPT,
    build_project_schema_prompt,
    build_simple_project_schema_prompt
)

__all__ = [
    "EXPECTED_IMPACT_SYSTEM_PROMPT",
    "build_expected_impact_prompt",
    "REALIZED_IMPACT_SYSTEM_PROMPT",
    "build_realized_impact_prompt",
    "TASK_SCHEMA_SYSTEM_PROMPT",
    "build_task_schema_prompt",
    "build_simple_task_schema_prompt",
    "PROJECT_SCHEMA_SYSTEM_PROMPT",
    "build_project_schema_prompt",
    "build_simple_project_schema_prompt",
]
