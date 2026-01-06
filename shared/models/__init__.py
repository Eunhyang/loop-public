"""
Shared Pydantic Models

공통 응답 모델들.
"""

from .common import HealthResponse, ErrorResponse

__all__ = [
    "HealthResponse",
    "ErrorResponse",
]
