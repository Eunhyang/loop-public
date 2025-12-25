"""
OAuth 2.0 Module for LOOP MCP

Production-grade OAuth implementation with:
- PKCE (S256)
- RS256 + JWKS
- SQLite session storage
- bcrypt password hashing
"""

from .models import create_tables, get_db, AuthCode, User, Session, OAuthClient
from .jwks import get_jwks, create_jwt, verify_jwt
from .security import (
    hash_password,
    verify_password,
    create_session,
    validate_session,
    verify_pkce,
    cleanup_expired,
    # Security utilities
    check_rate_limit,
    validate_redirect_uri,
    validate_client_redirect_uri,
    check_path_access,
    log_oauth_access
)

__all__ = [
    # models
    "create_tables", "get_db", "AuthCode", "User", "Session", "OAuthClient",
    # jwks
    "get_jwks", "create_jwt", "verify_jwt",
    # security
    "hash_password", "verify_password", "create_session", "validate_session",
    "verify_pkce", "cleanup_expired",
    # security utilities
    "check_rate_limit", "validate_redirect_uri", "validate_client_redirect_uri",
    "check_path_access", "log_oauth_access"
]
