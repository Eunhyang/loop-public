"""
OAuth Scope-based Access Control

스코프 기반 접근 제어 유틸리티.

Scopes:
- mcp:read - LOOP Vault (public) 읽기
- mcp:write - LOOP Vault 쓰기
- mcp:exec - Exec Vault 접근
- mcp:admin - 관리자 권한
- kpi:read - KPI Analytics 읽기

Usage:
    from shared.auth.scope_checker import check_scope, ScopeChecker

    # Simple check
    if check_scope("mcp:exec", user_scope):
        # Allow exec vault access

    # Decorator style (FastAPI)
    checker = ScopeChecker()

    @router.get("/kpi/overview")
    @checker.require("kpi:read")
    async def get_overview(request: Request):
        ...
"""

import logging
from typing import Optional, List, Callable, Any
from functools import wraps

logger = logging.getLogger("shared.auth.scope")


# Available scopes
SCOPES = {
    "mcp:read": "LOOP Vault (public) read access",
    "mcp:write": "LOOP Vault write access",
    "mcp:exec": "Exec Vault (executive) access",
    "mcp:admin": "Full admin access",
    "kpi:read": "KPI Analytics read access",
    "admin:read": "Admin panel read access",
    "admin:write": "Admin panel write access",
}


def parse_scope(scope_string: str) -> List[str]:
    """Parse space-separated scope string to list

    Args:
        scope_string: Space-separated scopes (e.g., "mcp:read mcp:exec")

    Returns:
        List of individual scopes
    """
    if not scope_string:
        return []
    return scope_string.strip().split()


def check_scope(required: str, user_scope: str) -> bool:
    """Check if user has required scope

    Args:
        required: Required scope (e.g., "mcp:exec")
        user_scope: User's scope string (space-separated)

    Returns:
        True if user has the required scope
    """
    user_scopes = parse_scope(user_scope)

    # Admin has all permissions
    if "mcp:admin" in user_scopes:
        return True

    return required in user_scopes


def check_any_scope(required: List[str], user_scope: str) -> bool:
    """Check if user has any of the required scopes

    Args:
        required: List of scopes (user needs at least one)
        user_scope: User's scope string

    Returns:
        True if user has at least one required scope
    """
    user_scopes = parse_scope(user_scope)

    # Admin has all permissions
    if "mcp:admin" in user_scopes:
        return True

    return any(s in user_scopes for s in required)


def check_all_scopes(required: List[str], user_scope: str) -> bool:
    """Check if user has all required scopes

    Args:
        required: List of scopes (user needs all)
        user_scope: User's scope string

    Returns:
        True if user has all required scopes
    """
    user_scopes = parse_scope(user_scope)

    # Admin has all permissions
    if "mcp:admin" in user_scopes:
        return True

    return all(s in user_scopes for s in required)


class ScopeChecker:
    """Scope-based access control for FastAPI routes

    Usage:
        checker = ScopeChecker()

        @router.get("/protected")
        async def protected_route(request: Request):
            # Manual check
            if not checker.has_scope(request, "mcp:exec"):
                raise HTTPException(status_code=403, detail="Insufficient scope")
            ...
    """

    def has_scope(self, request: Any, required: str) -> bool:
        """Check if request has required scope

        Args:
            request: FastAPI Request object
            required: Required scope

        Returns:
            True if request has the required scope
        """
        # Get scope from request state (set by AuthMiddleware)
        state = getattr(request, "state", None)
        if state is None:
            return False

        user_scope = getattr(state, "scope", "")
        if not user_scope:
            # Try dict-style access for ASGI scope
            if hasattr(request, "scope") and isinstance(request.scope, dict):
                state_dict = request.scope.get("state", {})
                user_scope = state_dict.get("scope", "")

        return check_scope(required, user_scope)

    def get_scope(self, request: Any) -> str:
        """Get scope string from request

        Args:
            request: FastAPI Request object

        Returns:
            Scope string or empty string
        """
        state = getattr(request, "state", None)
        if state is None:
            return ""

        user_scope = getattr(state, "scope", "")
        if not user_scope:
            if hasattr(request, "scope") and isinstance(request.scope, dict):
                state_dict = request.scope.get("state", {})
                user_scope = state_dict.get("scope", "")

        return user_scope

    def get_role(self, request: Any) -> str:
        """Get role from request

        Args:
            request: FastAPI Request object

        Returns:
            Role string or "member"
        """
        state = getattr(request, "state", None)
        if state is None:
            return "member"

        role = getattr(state, "role", "member")
        if not role:
            if hasattr(request, "scope") and isinstance(request.scope, dict):
                state_dict = request.scope.get("state", {})
                role = state_dict.get("role", "member")

        return role

    def get_user_id(self, request: Any) -> Optional[str]:
        """Get user ID from request

        Args:
            request: FastAPI Request object

        Returns:
            User ID or None
        """
        state = getattr(request, "state", None)
        if state is None:
            return None

        user_id = getattr(state, "user_id", None)
        if not user_id:
            if hasattr(request, "scope") and isinstance(request.scope, dict):
                state_dict = request.scope.get("state", {})
                user_id = state_dict.get("user_id")

        return user_id
