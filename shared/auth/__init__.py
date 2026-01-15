"""
Authentication Module

- middleware.py: ASGI AuthMiddleware (SSE 호환)
- oauth_verify.py: JWT 검증, 접근 로그
- scope_checker.py: OAuth scope 기반 접근 제어
"""

from .middleware import AuthMiddleware
from .oauth_verify import verify_jwt, log_oauth_access
from .scope_checker import check_scope, ScopeChecker

__all__ = [
    "AuthMiddleware",
    "verify_jwt",
    "log_oauth_access",
    "check_scope",
    "ScopeChecker",
]
