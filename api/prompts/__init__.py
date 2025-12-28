"""
LLM Prompts for Autofill API

이 모듈은 API에서 사용하는 LLM 프롬프트를 정의합니다.
기존 스킬(.claude/skills/)의 프롬프트를 API용으로 이전.
"""

from .expected_impact import (
    EXPECTED_IMPACT_SYSTEM_PROMPT,
    build_expected_impact_prompt
)
from .realized_impact import (
    REALIZED_IMPACT_SYSTEM_PROMPT,
    build_realized_impact_prompt
)

__all__ = [
    "EXPECTED_IMPACT_SYSTEM_PROMPT",
    "build_expected_impact_prompt",
    "REALIZED_IMPACT_SYSTEM_PROMPT",
    "build_realized_impact_prompt",
]
