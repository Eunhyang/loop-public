"""
OAuth Verification Utilities

JWT 검증 및 접근 로깅을 위한 공통 함수들.
api/oauth/jwks.py의 verify_jwt를 래핑하여 shared 모듈에서 사용.

Usage:
    from shared.auth.oauth_verify import verify_jwt, log_oauth_access
"""

import logging
from typing import Optional, Callable, Dict, Any

# Logging
logger = logging.getLogger("shared.auth")
logging.basicConfig(level=logging.INFO)


def log_oauth_access(
    action: str,
    client_ip: str,
    client_id: Optional[str] = None,
    user_id: Optional[str] = None,
    success: bool = True,
    details: Optional[str] = None
):
    """Log OAuth access for audit

    Args:
        action: "authorize", "token", "register", "api", "mcp", "kpi"
        client_ip: Client IP address
        client_id: OAuth client ID
        user_id: User ID (if authenticated)
        success: Whether the action succeeded
        details: Additional details
    """
    status = "SUCCESS" if success else "FAILED"
    msg = f"[{action.upper()}] {status} | IP:{client_ip}"

    if client_id:
        msg += f" | client:{client_id}"
    if user_id:
        msg += f" | user:{user_id}"
    if details:
        msg += f" | {details}"

    if success:
        logger.info(msg)
    else:
        logger.warning(msg)


# JWT verification function reference
# This will be set by the API that imports this module
_verify_jwt_func: Optional[Callable[[str], Optional[Dict[str, Any]]]] = None


def set_verify_jwt_func(func: Callable[[str], Optional[Dict[str, Any]]]):
    """Set the JWT verification function from the API module

    This allows the shared module to remain decoupled from the specific
    OAuth implementation while still supporting JWT verification.

    Args:
        func: A function that takes a JWT string and returns the payload or None
    """
    global _verify_jwt_func
    _verify_jwt_func = func


def verify_jwt(token: str) -> Optional[Dict[str, Any]]:
    """Verify JWT token

    Returns:
        Decoded payload if valid, None otherwise
    """
    if _verify_jwt_func is None:
        logger.warning("JWT verification function not set")
        return None
    return _verify_jwt_func(token)
