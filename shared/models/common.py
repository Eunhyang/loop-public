"""
Common Pydantic Models

API 응답에 사용되는 공통 모델들.

Usage:
    from shared.models.common import HealthResponse, ErrorResponse
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Health check response model"""
    status: str
    services: Optional[Dict[str, str]] = None
    timestamp: Optional[str] = None
    cache: Optional[Dict[str, Any]] = None
    vault_exists: Optional[bool] = None


class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = False
    detail: str
    error_type: Optional[str] = None
    path: Optional[str] = None
    hint: Optional[str] = None


class SuccessResponse(BaseModel):
    """Generic success response"""
    success: bool = True
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class PaginatedResponse(BaseModel):
    """Paginated response model"""
    items: list
    total: int
    page: int
    page_size: int
    has_more: bool
