"""
OAuth 2.0 Routes for LOOP MCP

Endpoints:
- GET  /.well-known/oauth-authorization-server - RFC 8414 Discovery
- GET  /.well-known/jwks.json                  - JWKS public key
- POST /register                                - RFC 7591 Dynamic Client Registration
- GET  /authorize                               - Authorization (requires login)
- POST /oauth/login                             - Login form handler
- POST /token                                   - Token exchange (PKCE)
- GET  /oauth/logout                            - Logout
"""

import os
import secrets
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Request, Form, HTTPException, Depends, Cookie
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session as SQLSession

from .models import get_db, create_tables, User
from .jwks import get_jwks, create_jwt, init_keys, OAUTH_ISSUER
from .security import (
    authenticate_user,
    create_user,
    get_user_by_email,
    create_session,
    validate_session,
    delete_session,
    save_auth_code,
    consume_auth_code,
    verify_pkce,
    register_client,
    check_rate_limit,
    validate_redirect_uri,
    validate_client_redirect_uri,
    log_oauth_access,
    cleanup_expired
)

# Router
router = APIRouter(tags=["OAuth"])

# Templates
from pathlib import Path
TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

# Session cookie name
SESSION_COOKIE = "loop_session"


def get_client_ip(request: Request) -> str:
    """Get client IP from request"""
    return request.headers.get("x-forwarded-for", request.client.host or "unknown")


# ============================================
# OAuth Discovery
# ============================================

def _get_discovery_doc():
    """공통 Discovery 문서"""
    return {
        "issuer": OAUTH_ISSUER,
        "authorization_endpoint": f"{OAUTH_ISSUER}/authorize",
        "token_endpoint": f"{OAUTH_ISSUER}/token",
        "registration_endpoint": f"{OAUTH_ISSUER}/register",
        "jwks_uri": f"{OAUTH_ISSUER}/.well-known/jwks.json",
        "response_types_supported": ["code"],
        "grant_types_supported": ["authorization_code"],
        "code_challenge_methods_supported": ["S256"],
        "token_endpoint_auth_methods_supported": ["none"],
        "scopes_supported": ["mcp:read", "mcp:write", "mcp:admin"],
        # OpenID Connect specific
        "subject_types_supported": ["public"],
        "id_token_signing_alg_values_supported": ["RS256"]
    }


@router.get("/.well-known/oauth-authorization-server")
def oauth_discovery():
    """OAuth Authorization Server Metadata (RFC 8414)"""
    return _get_discovery_doc()


@router.get("/.well-known/openid-configuration")
def openid_discovery():
    """OpenID Connect Discovery (ChatGPT 호환)"""
    return _get_discovery_doc()


@router.get("/.well-known/jwks.json")
def jwks_endpoint():
    """JWKS (JSON Web Key Set) - Public key for JWT verification"""
    return get_jwks()


# ============================================
# Dynamic Client Registration (RFC 7591)
# ============================================

@router.post("/register")
async def oauth_register(request: Request, db: SQLSession = Depends(get_db)):
    """Dynamic Client Registration with rate limiting and URI validation"""
    client_ip = get_client_ip(request)

    # Rate limiting
    if not check_rate_limit(client_ip, "register"):
        log_oauth_access("register", client_ip, success=False, details="rate_limited")
        raise HTTPException(429, {"error": "too_many_requests", "error_description": "Rate limit exceeded"})

    try:
        data = await request.json()
    except:
        data = {}

    # Validate redirect_uris
    redirect_uris = data.get("redirect_uris", [])
    valid_uris = [uri for uri in redirect_uris if validate_redirect_uri(uri)]

    if redirect_uris and not valid_uris:
        log_oauth_access("register", client_ip, success=False, details="invalid_redirect_uri")
        raise HTTPException(400, {
            "error": "invalid_redirect_uri",
            "error_description": "No valid redirect URIs provided"
        })

    # Register client
    client_info = register_client(
        db,
        client_name=data.get("client_name", "ChatGPT MCP Client"),
        redirect_uris=valid_uris
    )

    log_oauth_access("register", client_ip, client_id=client_info["client_id"], success=True)

    return client_info


# ============================================
# Authorization Endpoint
# ============================================

@router.get("/authorize", response_class=HTMLResponse)
async def oauth_authorize(
    request: Request,
    response_type: str,
    client_id: str,
    redirect_uri: str,
    state: str,
    code_challenge: Optional[str] = None,
    code_challenge_method: Optional[str] = None,
    scope: Optional[str] = "mcp:read",
    session: Optional[str] = Cookie(None, alias=SESSION_COOKIE),
    db: SQLSession = Depends(get_db)
):
    """Authorization Endpoint - Requires login session"""
    client_ip = get_client_ip(request)

    # Validate response_type
    if response_type != "code":
        raise HTTPException(400, {"error": "unsupported_response_type"})

    # Validate redirect_uri (global allowlist + client binding)
    if not validate_client_redirect_uri(db, client_id, redirect_uri):
        log_oauth_access("authorize", client_ip, client_id=client_id, success=False, details="invalid_redirect_uri")
        raise HTTPException(400, {"error": "invalid_redirect_uri"})

    # Check login session
    user_info = validate_session(db, session) if session else None

    if not user_info:
        # No session - show login page with CSRF token
        log_oauth_access("authorize", client_ip, client_id=client_id, success=False, details="no_session")

        return templates.TemplateResponse("login.html", {
            "request": request,
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": response_type,
            "scope": scope,
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": code_challenge_method,
            "error": None,
            "csrf_token": secrets.token_urlsafe(32)
        })

    # User is logged in - generate authorization code
    code = secrets.token_urlsafe(32)

    save_auth_code(
        db,
        code=code,
        client_id=client_id,
        redirect_uri=redirect_uri,
        user_id=user_info["user_id"],
        scope=scope,
        code_challenge=code_challenge,
        code_challenge_method=code_challenge_method,
        state=state
    )

    log_oauth_access("authorize", client_ip, client_id=client_id, user_id=user_info["user_id"], success=True)

    # Redirect back with code
    redirect_url = f"{redirect_uri}?code={code}&state={state}"
    return RedirectResponse(url=redirect_url, status_code=302)


# ============================================
# Login Handler
# ============================================

@router.post("/oauth/login", response_class=HTMLResponse)
async def oauth_login(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    csrf_token: str = Form(""),
    client_id: str = Form(""),
    redirect_uri: str = Form(""),
    response_type: str = Form("code"),
    scope: str = Form("mcp:read"),
    state: str = Form(""),
    code_challenge: str = Form(""),
    code_challenge_method: str = Form(""),
    db: SQLSession = Depends(get_db)
):
    """Handle login form submission with rate limiting and CSRF protection"""
    client_ip = get_client_ip(request)

    # Rate limiting for login (prevent brute force)
    if not check_rate_limit(client_ip, "login"):
        log_oauth_access("login", client_ip, success=False, details="rate_limited")
        return templates.TemplateResponse("login.html", {
            "request": request,
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": response_type,
            "scope": scope,
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": code_challenge_method,
            "error": "Too many login attempts. Please wait a moment.",
            "csrf_token": secrets.token_urlsafe(32)
        })

    # Authenticate user
    user = authenticate_user(db, email, password)

    if not user:
        # Log without email (prevent info leak)
        log_oauth_access("login", client_ip, success=False, details="invalid_credentials")

        return templates.TemplateResponse("login.html", {
            "request": request,
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": response_type,
            "scope": scope,
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": code_challenge_method,
            "error": "Invalid email or password",
            "csrf_token": secrets.token_urlsafe(32)
        })

    # Create session
    session_id = create_session(db, user_id=str(user.id), user_email=user.email)

    log_oauth_access("login", client_ip, user_id=str(user.id), success=True)

    # Build authorize URL
    authorize_url = f"/authorize?response_type={response_type}&client_id={client_id}&redirect_uri={redirect_uri}&state={state}&scope={scope}"
    if code_challenge:
        authorize_url += f"&code_challenge={code_challenge}&code_challenge_method={code_challenge_method}"

    # Redirect to authorize with session cookie
    response = RedirectResponse(url=authorize_url, status_code=302)
    response.set_cookie(
        key=SESSION_COOKIE,
        value=session_id,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=86400  # 24 hours
    )

    return response


# ============================================
# Token Endpoint
# ============================================

@router.post("/token")
async def oauth_token(
    request: Request,
    grant_type: str = Form(...),
    code: Optional[str] = Form(None),
    redirect_uri: Optional[str] = Form(None),
    client_id: Optional[str] = Form(None),
    code_verifier: Optional[str] = Form(None),
    db: SQLSession = Depends(get_db)
):
    """Token Endpoint - Exchange code for JWT (with PKCE verification)"""
    client_ip = get_client_ip(request)

    if grant_type != "authorization_code":
        raise HTTPException(400, {"error": "unsupported_grant_type"})

    if not code:
        raise HTTPException(400, {"error": "invalid_request", "error_description": "code required"})

    # Consume auth code (single-use - deleted immediately, returns dict)
    auth_code = consume_auth_code(db, code, client_id, redirect_uri)

    if not auth_code:
        log_oauth_access("token", client_ip, client_id=client_id, success=False, details="invalid_code")
        raise HTTPException(400, {"error": "invalid_grant", "error_description": "Invalid or expired code"})

    # PKCE verification (required if code_challenge was provided)
    if auth_code.get("code_challenge"):
        if not code_verifier:
            log_oauth_access("token", client_ip, client_id=client_id, success=False, details="missing_verifier")
            raise HTTPException(400, {"error": "invalid_request", "error_description": "code_verifier required"})

        method = auth_code.get("code_challenge_method") or "S256"
        if method != "S256":
            log_oauth_access("token", client_ip, client_id=client_id, success=False, details="unsupported_method")
            raise HTTPException(400, {"error": "invalid_request", "error_description": "Only S256 is supported"})

        if not verify_pkce(code_verifier, auth_code["code_challenge"], method):
            log_oauth_access("token", client_ip, client_id=client_id, success=False, details="pkce_failed")
            raise HTTPException(400, {"error": "invalid_grant", "error_description": "PKCE verification failed"})

    # Get user role for RBAC
    user = db.query(User).filter(User.id == int(auth_code["user_id"])).first()
    user_role = getattr(user, 'role', 'member') or 'member' if user else 'member'

    # Determine scope based on role
    base_scope = auth_code.get("scope") or "mcp:read"
    if user_role in ("exec", "admin"):
        # Add exec scope for privileged users
        final_scope = f"{base_scope} mcp:exec" if "mcp:exec" not in base_scope else base_scope
    else:
        final_scope = base_scope

    # Generate JWT with role and email
    access_token = create_jwt(
        sub=auth_code["user_id"],
        scope=final_scope,
        additional_claims={"role": user_role, "email": user.email if user else None}
    )

    log_oauth_access("token", client_ip, client_id=client_id, user_id=auth_code["user_id"], success=True)

    return {
        "access_token": access_token,
        "token_type": "Bearer",
        "expires_in": 3600,  # 1 hour
        "scope": final_scope
    }


# ============================================
# Dashboard Login (Direct JWT)
# ============================================

@router.post("/oauth/dashboard-login")
async def dashboard_login(
    request: Request,
    db: SQLSession = Depends(get_db)
):
    """
    Dashboard용 직접 로그인 - JWT 토큰 즉시 반환
    MCP OAuth 플로우와 별개로, 대시보드에서 직접 사용
    """
    client_ip = get_client_ip(request)

    # Rate limiting
    if not check_rate_limit(client_ip, "login"):
        log_oauth_access("dashboard_login", client_ip, success=False, details="rate_limited")
        raise HTTPException(429, {"error": "too_many_requests", "error_description": "Rate limit exceeded"})

    # Parse JSON body
    try:
        data = await request.json()
        email = data.get("email", "").strip()
        password = data.get("password", "")
    except:
        raise HTTPException(400, {"error": "invalid_request", "error_description": "Invalid JSON body"})

    if not email or not password:
        raise HTTPException(400, {"error": "invalid_request", "error_description": "Email and password required"})

    # Authenticate user
    user = authenticate_user(db, email, password)

    if not user:
        log_oauth_access("dashboard_login", client_ip, success=False, details="invalid_credentials")
        raise HTTPException(401, {"error": "invalid_credentials", "error_description": "Invalid email or password"})

    # Get user role
    user_role = getattr(user, 'role', 'member') or 'member'

    # Determine scope based on role
    base_scope = "mcp:read"
    if user_role in ("exec", "admin"):
        final_scope = f"{base_scope} mcp:exec"
    else:
        final_scope = base_scope

    # Generate JWT
    access_token = create_jwt(
        sub=str(user.id),
        scope=final_scope,
        additional_claims={"role": user_role, "email": user.email}
    )

    log_oauth_access("dashboard_login", client_ip, user_id=str(user.id), success=True)

    return {
        "access_token": access_token,
        "token_type": "Bearer",
        "expires_in": 3600,
        "scope": final_scope,
        "role": user_role
    }


# ============================================
# Logout
# ============================================

@router.get("/oauth/logout")
async def oauth_logout(
    request: Request,
    session: Optional[str] = Cookie(None, alias=SESSION_COOKIE),
    db: SQLSession = Depends(get_db)
):
    """Logout - Delete session"""
    if session:
        delete_session(db, session)

    response = RedirectResponse(url="/", status_code=302)
    response.delete_cookie(SESSION_COOKIE)

    return response


# ============================================
# Startup
# ============================================

def init_oauth():
    """Initialize OAuth module (call on app startup)"""
    create_tables()
    init_keys()
    print("OAuth module initialized")
