"""
Security Utilities for OAuth 2.0

- Password hashing (bcrypt)
- Session management
- PKCE verification
- Rate limiting
- Path allowlist for MCP
- Access logging
- Cleanup utilities
"""

import os
import secrets
import hashlib
import base64
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from collections import defaultdict

import bcrypt as bcrypt_lib
from sqlalchemy.orm import Session as SQLSession

from .models import AuthCode, User, Session, OAuthClient, get_db_session

# Logging
logger = logging.getLogger("oauth.security")
logging.basicConfig(level=logging.INFO)

# ============================================
# Rate Limiting (in-memory, per-IP)
# ============================================
_rate_limit_store: Dict[str, List[datetime]] = defaultdict(list)
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 5  # /register: 5 requests per minute per IP


def check_rate_limit(ip: str, action: str = "register") -> bool:
    """Check rate limit for IP

    Returns:
        True if allowed, False if rate limited
    """
    now = datetime.utcnow()
    key = f"{action}:{ip}"
    window_start = now - timedelta(seconds=RATE_LIMIT_WINDOW_SECONDS)

    # Clean old entries
    _rate_limit_store[key] = [t for t in _rate_limit_store[key] if t > window_start]

    # Check limit
    if len(_rate_limit_store[key]) >= RATE_LIMIT_MAX_REQUESTS:
        logger.warning(f"Rate limit exceeded: {key}")
        return False

    # Record this request
    _rate_limit_store[key].append(now)
    return True


# ============================================
# Redirect URI Allowlist
# ============================================
ALLOWED_REDIRECT_URI_PATTERNS = [
    "https://chatgpt.com/",
    "https://chat.openai.com/",
    "https://platform.openai.com/",
]


def validate_redirect_uri(uri: str) -> bool:
    """Validate redirect_uri against allowlist

    Returns:
        True if allowed, False otherwise
    """
    if not uri:
        return False

    for pattern in ALLOWED_REDIRECT_URI_PATTERNS:
        if uri.startswith(pattern):
            return True

    logger.warning(f"Blocked redirect_uri: {uri}")
    return False


# ============================================
# MCP Path Allowlist (Sensitive folders blocked)
# ============================================
BLOCKED_PATHS = [
    "00_Meta/members.yaml",  # Team member info
    "Private & Shared",       # Private data
]

ALLOWED_PATH_PREFIXES = [
    "50_Projects",
    "60_Hypotheses",
    "70_Experiments",
    "_dashboard",
]

# Exec vault path prefix (requires exec role)
EXEC_PATH_PREFIX = "exec/"


def check_path_access(path: str, scope: str = "mcp:read", role: str = "member") -> bool:
    """Check if path is allowed for MCP access

    Args:
        path: Requested file path
        scope: OAuth scope
        role: User role (member, exec, admin)

    Returns:
        True if allowed, False if blocked
    """
    # Normalize path
    path = path.lstrip("/").lstrip("./")

    # Block sensitive paths
    for blocked in BLOCKED_PATHS:
        if blocked in path:
            logger.warning(f"Blocked sensitive path access: {path}")
            return False

    # RBAC: exec/ path requires exec or admin role
    if path.startswith(EXEC_PATH_PREFIX):
        if role not in ("exec", "admin"):
            logger.warning(f"Blocked exec path access: role={role}, path={path}")
            return False
        if "mcp:exec" not in scope:
            logger.warning(f"Blocked exec path access: scope missing mcp:exec, path={path}")
            return False
        # exec path access granted - skip allowlist check
        return True

    # For mcp:read, check allowlist
    if "mcp:admin" not in scope:
        # Check if path is in allowed prefixes
        allowed = any(path.startswith(prefix) for prefix in ALLOWED_PATH_PREFIXES)
        if not allowed:
            logger.warning(f"Path not in allowlist: {path}")
            return False

    return True


# ============================================
# Access Logging
# ============================================
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
        action: "authorize", "token", "register", "mcp"
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

# Password hashing
BCRYPT_ROUNDS = int(os.environ.get("BCRYPT_ROUNDS", "12"))

# Session settings
SESSION_EXPIRE_HOURS = int(os.environ.get("SESSION_EXPIRE_HOURS", "24"))


# ============================================
# Password Hashing (using bcrypt directly)
# ============================================

def hash_password(plain: str) -> str:
    """Hash password with bcrypt"""
    salt = bcrypt_lib.gensalt(rounds=BCRYPT_ROUNDS)
    return bcrypt_lib.hashpw(plain.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    """Verify password against hash"""
    try:
        return bcrypt_lib.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


# ============================================
# User Management
# ============================================

def get_user_by_email(db: SQLSession, email: str) -> Optional[User]:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()


def create_user(db: SQLSession, email: str, password: str) -> User:
    """Create new user"""
    user = User(
        email=email,
        password_hash=hash_password(password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: SQLSession, email: str, password: str) -> Optional[User]:
    """Authenticate user by email and password"""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


# ============================================
# Session Management
# ============================================

def create_session(db: SQLSession, user_id: str, user_email: Optional[str] = None) -> str:
    """Create login session

    Returns:
        session_id (high-entropy token for cookie)
    """
    session_id = secrets.token_urlsafe(32)  # 256-bit entropy

    session = Session(
        session_id=session_id,
        user_id=user_id,
        user_email=user_email,
        expires_at=datetime.utcnow() + timedelta(hours=SESSION_EXPIRE_HOURS)
    )
    db.add(session)
    db.commit()

    return session_id


def validate_session(db: SQLSession, session_id: str) -> Optional[dict]:
    """Validate session and return user info

    Returns:
        {"user_id": str, "user_email": str} or None
    """
    if not session_id:
        return None

    session = db.query(Session).filter(Session.session_id == session_id).first()

    if not session:
        return None

    # Check expiry
    if datetime.utcnow() > session.expires_at:
        # Delete expired session
        db.delete(session)
        db.commit()
        return None

    return {
        "user_id": session.user_id,
        "user_email": session.user_email
    }


def delete_session(db: SQLSession, session_id: str) -> bool:
    """Delete session (logout)"""
    session = db.query(Session).filter(Session.session_id == session_id).first()
    if session:
        db.delete(session)
        db.commit()
        return True
    return False


# ============================================
# Authorization Code Management
# ============================================

def save_auth_code(
    db: SQLSession,
    code: str,
    client_id: str,
    redirect_uri: str,
    user_id: str,
    scope: str = "mcp:read",
    code_challenge: Optional[str] = None,
    code_challenge_method: Optional[str] = None,
    state: Optional[str] = None
) -> AuthCode:
    """Save authorization code (10-min TTL)"""
    auth_code = AuthCode(
        code=code,
        client_id=client_id,
        redirect_uri=redirect_uri,
        user_id=user_id,
        scope=scope,
        code_challenge=code_challenge,
        code_challenge_method=code_challenge_method,
        state=state,
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.add(auth_code)
    db.commit()
    db.refresh(auth_code)
    return auth_code


def consume_auth_code(
    db: SQLSession,
    code: str,
    client_id: str,
    redirect_uri: str
) -> Optional[dict]:
    """Consume authorization code (single-use, atomic)

    Uses SELECT FOR UPDATE + atomic delete to prevent race conditions.
    Returns code data only if successfully consumed (no double-spend).

    Returns:
        dict with code data if valid and consumed, None otherwise
    """
    try:
        # Atomic: SELECT with lock + all conditions in single query
        auth_code = db.query(AuthCode).filter(
            AuthCode.code == code,
            AuthCode.client_id == client_id,
            AuthCode.redirect_uri == redirect_uri,
            AuthCode.expires_at > datetime.utcnow()
        ).with_for_update().first()  # Row lock (works on PostgreSQL, ignored on SQLite)

        if not auth_code:
            # Check if code exists but failed validation (for logging)
            exists = db.query(AuthCode).filter(AuthCode.code == code).first()
            if exists:
                logger.warning(f"Auth code validation failed: client_id or redirect_uri mismatch")
            return None

        # Copy data BEFORE delete
        code_data = {
            "code": auth_code.code,
            "code_challenge": auth_code.code_challenge,
            "code_challenge_method": auth_code.code_challenge_method,
            "client_id": auth_code.client_id,
            "redirect_uri": auth_code.redirect_uri,
            "user_id": auth_code.user_id,
            "scope": auth_code.scope,
            "state": auth_code.state,
            "expires_at": auth_code.expires_at
        }

        # DELETE immediately (single-use) - within same transaction
        db.delete(auth_code)
        db.commit()

        logger.info(f"Auth code consumed: user={code_data['user_id']}")
        return code_data

    except Exception as e:
        db.rollback()
        logger.error(f"consume_auth_code error: {e}")
        return None


# ============================================
# PKCE Verification
# ============================================

def verify_pkce(code_verifier: str, code_challenge: str, method: str = "S256") -> bool:
    """Verify PKCE code_verifier against code_challenge

    Args:
        code_verifier: Plain text verifier from client
        code_challenge: Stored challenge from /authorize
        method: Challenge method (only S256 supported)

    Returns:
        True if valid, False otherwise
    """
    if method != "S256":
        return False

    if not code_verifier or not code_challenge:
        return False

    try:
        # S256: BASE64URL(SHA256(code_verifier)) == code_challenge
        verifier_hash = hashlib.sha256(code_verifier.encode('ascii')).digest()
        computed_challenge = base64.urlsafe_b64encode(verifier_hash).rstrip(b'=').decode('ascii')

        return computed_challenge == code_challenge
    except Exception:
        return False


# ============================================
# OAuth Client Management
# ============================================

def register_client(
    db: SQLSession,
    client_name: str = "ChatGPT MCP Client",
    redirect_uris: Optional[list] = None
) -> dict:
    """Register new OAuth client (RFC 7591)

    Returns:
        {"client_id": str, "client_secret": str, ...}
    """
    import json

    client_id = secrets.token_urlsafe(16)
    client_secret = secrets.token_urlsafe(32)

    client = OAuthClient(
        client_id=client_id,
        client_secret=client_secret,
        client_name=client_name,
        redirect_uris=json.dumps(redirect_uris or []),
        grant_types="authorization_code",
        response_types="code",
        token_endpoint_auth_method="none"
    )
    db.add(client)
    db.commit()

    return {
        "client_id": client_id,
        "client_secret": client_secret,
        "client_name": client_name,
        "redirect_uris": redirect_uris or [],
        "grant_types": ["authorization_code"],
        "response_types": ["code"],
        "token_endpoint_auth_method": "none"
    }


def get_client(db: SQLSession, client_id: str) -> Optional[OAuthClient]:
    """Get OAuth client by ID"""
    return db.query(OAuthClient).filter(OAuthClient.client_id == client_id).first()


def validate_client_redirect_uri(db: SQLSession, client_id: str, redirect_uri: str) -> bool:
    """Validate redirect_uri against client's registered URIs

    Returns:
        True if redirect_uri is registered for this client, False otherwise
    """
    import json

    # First check global allowlist
    if not validate_redirect_uri(redirect_uri):
        return False

    # Get client
    client = get_client(db, client_id)
    if not client:
        logger.warning(f"Unknown client_id: {client_id}")
        return False

    # Parse client's registered redirect_uris
    try:
        registered_uris = json.loads(client.redirect_uris) if client.redirect_uris else []
    except json.JSONDecodeError:
        registered_uris = []

    # If no URIs registered, allow any from global allowlist (backwards compatible)
    if not registered_uris:
        return True

    # Exact match required against registered URIs
    if redirect_uri not in registered_uris:
        logger.warning(f"redirect_uri not registered for client: {redirect_uri}")
        return False

    return True


# ============================================
# Cleanup Utilities
# ============================================

def cleanup_expired(db: SQLSession) -> dict:
    """Clean up expired sessions and auth codes

    Returns:
        {"sessions_deleted": int, "codes_deleted": int}
    """
    now = datetime.utcnow()

    # Delete expired sessions
    sessions_deleted = db.query(Session).filter(Session.expires_at < now).delete()

    # Delete expired auth codes
    codes_deleted = db.query(AuthCode).filter(AuthCode.expires_at < now).delete()

    db.commit()

    return {
        "sessions_deleted": sessions_deleted,
        "codes_deleted": codes_deleted
    }


def cleanup_expired_standalone():
    """Standalone cleanup (creates its own session)"""
    db = get_db_session()
    try:
        result = cleanup_expired(db)
        print(f"Cleanup: {result}")
        return result
    finally:
        db.close()
