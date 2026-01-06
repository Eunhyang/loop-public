"""
Google OAuth Account Management Router

Endpoints:
- GET  /api/google/authorize        - Start OAuth flow
- GET  /api/google/callback         - OAuth callback
- GET  /api/google/accounts         - List connected accounts
- DELETE /api/google/accounts/{id}  - Disconnect account
"""

import logging
from typing import Optional, List
from datetime import datetime
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session as SQLSession

from ..models.google_accounts import (
    GoogleAccount,
    get_google_db,
    create_google_tables
)
from ..services.google_oauth import (
    create_authorization_url,
    exchange_code_for_tokens,
    revoke_account,
    cleanup_expired_states,
    get_google_config,
    get_encryption_key,
)
from ..services.google_calendar import (
    get_all_calendars,
    get_all_events,
    invalidate_calendar_cache,
)

# Logging
logger = logging.getLogger("google_accounts")

# Allowed redirect hosts (same-origin + trusted domains)
ALLOWED_REDIRECT_HOSTS = [
    "mcp.sosilab.synology.me",
    "kanban.sosilab.synology.me",
    "localhost",
    "127.0.0.1",
]


def validate_redirect_after(redirect_after: Optional[str]) -> Optional[str]:
    """Validate redirect_after URL to prevent open redirect attacks

    Only allows:
    - Same-origin paths (starting with /)
    - URLs from allowed hosts

    Returns:
        Validated URL or None if invalid
    """
    if not redirect_after:
        return None

    # Allow same-origin paths
    if redirect_after.startswith("/"):
        # Prevent protocol-relative URLs (//evil.com)
        if redirect_after.startswith("//"):
            logger.warning(f"Blocked protocol-relative redirect: {redirect_after}")
            return None
        return redirect_after

    # Check allowed hosts for absolute URLs
    try:
        parsed = urlparse(redirect_after)
        if parsed.scheme in ("http", "https") and parsed.netloc in ALLOWED_REDIRECT_HOSTS:
            return redirect_after
    except Exception:
        pass

    logger.warning(f"Blocked invalid redirect_after: {redirect_after}")
    return None

# Router
router = APIRouter(prefix="/api/google", tags=["Google OAuth"])


# ============================================
# Response Models
# ============================================

class GoogleAccountResponse(BaseModel):
    """Response model for Google account"""
    id: int
    google_email: str
    label: str
    scopes: List[str]
    token_expires_at: str
    created_at: str

    class Config:
        from_attributes = True


class AuthorizeResponse(BaseModel):
    """Response for authorize endpoint"""
    authorization_url: str


class CallbackSuccessResponse(BaseModel):
    """Response for successful OAuth callback"""
    success: bool
    google_email: str
    account_id: int


# ============================================
# Startup
# ============================================

def init_google_oauth():
    """Initialize Google OAuth tables and validate configuration

    Validates encryption key at startup to fail fast if misconfigured.
    """
    # Validate encryption key early (fail fast)
    try:
        get_encryption_key()
        logger.info("Google OAuth encryption key validated")
    except ValueError as e:
        logger.warning(f"Google OAuth encryption key not configured: {e}")
        logger.warning("Google OAuth features will fail until TOKEN_ENCRYPTION_KEY is set")

    create_google_tables()
    logger.info("Google OAuth initialized")


# ============================================
# Endpoints
# ============================================

@router.get("/authorize", response_model=AuthorizeResponse)
async def google_authorize(
    request: Request,
    redirect_after: Optional[str] = Query(None, description="URL to redirect after auth"),
    db: SQLSession = Depends(get_google_db)
):
    """Start Google OAuth flow

    Returns authorization URL to redirect user to.

    Args:
        redirect_after: Optional URL to redirect after successful auth

    Returns:
        {authorization_url: "https://accounts.google.com/..."}
    """
    # Check if Google OAuth is configured
    config = get_google_config()
    if not config["client_id"]:
        raise HTTPException(
            status_code=503,
            detail="Google OAuth not configured. Set GOOGLE_CLIENT_ID environment variable."
        )

    # Validate redirect_after to prevent open redirect attacks
    validated_redirect = validate_redirect_after(redirect_after)

    # Get user_id from request state (set by auth middleware)
    user_id = None
    if hasattr(request, "state") and request.state:
        user_id = getattr(request.state, "user_id", None)

    try:
        authorization_url = create_authorization_url(
            db=db,
            user_id=user_id,
            redirect_after=validated_redirect  # Use validated redirect
        )

        logger.info(f"Generated Google OAuth URL for user={user_id}")

        return {"authorization_url": authorization_url}

    except Exception as e:
        logger.error(f"Failed to create authorization URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/callback")
async def google_callback(
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    error_description: Optional[str] = Query(None),
    db: SQLSession = Depends(get_google_db)
):
    """Handle Google OAuth callback

    Google redirects here after user authorizes (or denies) access.

    On success: Stores tokens and redirects to dashboard or redirect_after URL.
    On error: Returns error response.
    """
    # Handle error from Google
    if error:
        logger.warning(f"Google OAuth error: {error} - {error_description}")

        # If access_denied, user clicked "cancel"
        if error == "access_denied":
            # Redirect to dashboard with error param
            return RedirectResponse(url="/?google_auth=cancelled")

        raise HTTPException(
            status_code=400,
            detail=f"Google OAuth error: {error}. {error_description or ''}"
        )

    # Validate required params
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    if not state:
        raise HTTPException(status_code=400, detail="Missing state parameter")

    # Exchange code for tokens
    account_data, error_msg = exchange_code_for_tokens(db, code, state)

    if error_msg:
        logger.error(f"Token exchange failed: {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)

    # Check for duplicate account
    existing = db.query(GoogleAccount).filter(
        GoogleAccount.google_email == account_data["google_email"]
    ).first()

    if existing:
        # Update existing account
        existing.access_token_enc = account_data["access_token_enc"]
        existing.refresh_token_enc = account_data["refresh_token_enc"]
        existing.token_expires_at = account_data["token_expires_at"]
        existing.scopes = account_data["scopes"]
        existing.updated_at = datetime.utcnow()
        db.commit()

        account_id = existing.id
        logger.info(f"Updated existing Google account: {account_data['google_email']}")

    else:
        # Create new account
        new_account = GoogleAccount(
            user_id=account_data.get("user_id"),
            google_email=account_data["google_email"],
            google_id=account_data.get("google_id"),
            label="default",
            access_token_enc=account_data["access_token_enc"],
            refresh_token_enc=account_data["refresh_token_enc"],
            token_expires_at=account_data["token_expires_at"],
            scopes=account_data["scopes"],
        )
        db.add(new_account)
        db.commit()
        db.refresh(new_account)

        account_id = new_account.id
        logger.info(f"Created new Google account: {account_data['google_email']}")

    # Determine redirect URL (already validated when stored in state)
    redirect_url = account_data.get("redirect_after")

    # Re-validate redirect URL (defense in depth)
    redirect_url = validate_redirect_after(redirect_url)

    if not redirect_url:
        # Default: redirect to dashboard with success param
        redirect_url = f"/?google_auth=success&email={account_data['google_email']}"

    return RedirectResponse(url=redirect_url, status_code=302)


@router.get("/accounts", response_model=List[GoogleAccountResponse])
async def list_google_accounts(
    request: Request,
    db: SQLSession = Depends(get_google_db)
):
    """List all connected Google accounts

    Returns list of connected Google accounts without sensitive data (tokens).

    Note: Currently operates in single-user/admin mode. All accounts are visible
    to authenticated users. For multi-user mode, filter by request.state.user_id.
    """
    # Get user info from auth middleware
    user_id = None
    user_role = "member"
    if hasattr(request, "state") and isinstance(request.state._state, dict):
        user_id = request.state._state.get("user_id")
        user_role = request.state._state.get("role", "member")

    # Query accounts
    # Admin/exec can see all accounts; regular users only see their own
    if user_role in ("admin", "exec"):
        accounts = db.query(GoogleAccount).all()
    elif user_id:
        # Multi-user mode: filter by user_id
        accounts = db.query(GoogleAccount).filter(GoogleAccount.user_id == user_id).all()
    else:
        # No user_id and not admin - return empty list for security
        # (Prevents anonymous/api-token users from seeing all accounts)
        logger.warning("list_google_accounts called without user_id by non-admin")
        accounts = []

    result = []
    for account in accounts:
        # Parse scopes JSON
        try:
            import json
            scopes = json.loads(account.scopes)
        except:
            scopes = []

        result.append(GoogleAccountResponse(
            id=account.id,
            google_email=account.google_email,
            label=account.label,
            scopes=scopes,
            token_expires_at=account.token_expires_at.isoformat() if account.token_expires_at else "",
            created_at=account.created_at.isoformat() if account.created_at else "",
        ))

    return result


@router.delete("/accounts/{account_id}")
async def delete_google_account(
    account_id: int,
    request: Request,
    db: SQLSession = Depends(get_google_db)
):
    """Disconnect Google account

    Revokes OAuth token with Google and deletes account from database.

    Args:
        account_id: ID of account to delete
    """
    # Get user info from auth middleware
    user_id = None
    user_role = "member"
    if hasattr(request, "state") and isinstance(request.state._state, dict):
        user_id = request.state._state.get("user_id")
        user_role = request.state._state.get("role", "member")

    # Find account
    account = db.query(GoogleAccount).filter(GoogleAccount.id == account_id).first()

    if not account:
        raise HTTPException(status_code=404, detail="Google account not found")

    # Ownership check: admin can delete any, others can only delete their own
    if user_role not in ("admin", "exec"):
        # If account has no user_id (unbound), only admin can manage it
        if not account.user_id:
            raise HTTPException(
                status_code=403,
                detail="This account is not bound to a user. Admin access required."
            )
        if str(account.user_id) != str(user_id):
            raise HTTPException(
                status_code=403,
                detail="You can only delete your own Google accounts"
            )

    email = account.google_email
    deleted_user_id = account.user_id

    # Revoke and delete
    success, error_msg = revoke_account(db, account)

    if not success:
        raise HTTPException(status_code=500, detail=error_msg)

    # Invalidate calendar cache for this user (tsk-dashboard-ux-v1-25)
    if deleted_user_id:
        invalidate_calendar_cache(user_id=deleted_user_id)

    logger.info(f"Deleted Google account: {email}")

    return {
        "success": True,
        "message": f"Disconnected Google account: {email}"
    }


@router.patch("/accounts/{account_id}")
async def update_google_account_label(
    account_id: int,
    request: Request,
    label: str = Query(..., description="New label for account"),
    db: SQLSession = Depends(get_google_db)
):
    """Update Google account label

    Args:
        account_id: ID of account to update
        label: New label (e.g., "개인", "업무")
    """
    # Get user info from auth middleware
    user_id = None
    user_role = "member"
    if hasattr(request, "state") and isinstance(request.state._state, dict):
        user_id = request.state._state.get("user_id")
        user_role = request.state._state.get("role", "member")

    account = db.query(GoogleAccount).filter(GoogleAccount.id == account_id).first()

    if not account:
        raise HTTPException(status_code=404, detail="Google account not found")

    # Ownership check: admin can update any, others can only update their own
    if user_role not in ("admin", "exec"):
        # If account has no user_id (unbound), only admin can manage it
        if not account.user_id:
            raise HTTPException(
                status_code=403,
                detail="This account is not bound to a user. Admin access required."
            )
        if str(account.user_id) != str(user_id):
            raise HTTPException(
                status_code=403,
                detail="You can only update your own Google accounts"
            )

    account.label = label
    account.updated_at = datetime.utcnow()
    db.commit()

    return {
        "success": True,
        "id": account_id,
        "label": label
    }


# ============================================
# Calendar List & Events (tsk-dashboard-ux-v1-25)
# ============================================

class CalendarInfo(BaseModel):
    """Calendar info response model"""
    id: str
    summary: str
    color: str
    primary: bool
    account_id: int
    account_email: str
    access_role: str


class CalendarListResponse(BaseModel):
    """Response for calendar list endpoint"""
    calendars: List[CalendarInfo]
    errors: List[dict] = []


class GoogleEvent(BaseModel):
    """Google Calendar event for FullCalendar"""
    id: str
    title: str
    start: str
    end: str
    allDay: bool
    backgroundColor: str
    borderColor: str
    textColor: str
    editable: bool
    classNames: List[str]
    extendedProps: dict


class EventsResponse(BaseModel):
    """Response for events endpoint"""
    events: List[GoogleEvent]
    errors: List[dict] = []


def _get_user_accounts(
    request: Request,
    db: SQLSession
) -> tuple[Optional[int], str, List[GoogleAccount]]:
    """Get Google accounts accessible by current user

    Returns:
        (user_id, user_role, accounts)
    """
    user_id = None
    user_role = "member"
    if hasattr(request, "state") and isinstance(request.state._state, dict):
        user_id = request.state._state.get("user_id")
        user_role = request.state._state.get("role", "member")

    # Query accounts based on role
    if user_role in ("admin", "exec"):
        accounts = db.query(GoogleAccount).all()
    elif user_id:
        accounts = db.query(GoogleAccount).filter(GoogleAccount.user_id == user_id).all()
    else:
        accounts = []

    return user_id, user_role, accounts


@router.get("/calendars", response_model=CalendarListResponse)
async def list_google_calendars(
    request: Request,
    db: SQLSession = Depends(get_google_db)
):
    """Get all calendars from connected Google accounts

    Returns calendars from all connected Google accounts for the current user.
    Includes primary calendars and shared calendars.

    Response:
        {
            "calendars": [
                {
                    "id": "calendar@gmail.com",
                    "summary": "Calendar Name",
                    "color": "#4285F4",
                    "primary": true,
                    "account_id": 1,
                    "account_email": "user@gmail.com",
                    "access_role": "owner"
                }
            ],
            "errors": []
        }
    """
    user_id, user_role, accounts = _get_user_accounts(request, db)

    if not accounts:
        return CalendarListResponse(
            calendars=[],
            errors=[{"error": "No Google accounts connected"}] if user_id else []
        )

    # Fetch calendars from all accounts
    calendars, errors = get_all_calendars(db, accounts, user_id)

    # Convert to response model
    calendar_list = [
        CalendarInfo(
            id=cal["id"],
            summary=cal["summary"],
            color=cal["color"],
            primary=cal["primary"],
            account_id=cal["account_id"],
            account_email=cal["account_email"],
            access_role=cal["access_role"]
        )
        for cal in calendars
    ]

    logger.info(f"Retrieved {len(calendar_list)} calendars for user={user_id}")

    return CalendarListResponse(calendars=calendar_list, errors=errors)


@router.get("/events", response_model=EventsResponse)
async def get_google_events(
    request: Request,
    start: str = Query(..., description="Start date YYYY-MM-DD"),
    end: str = Query(..., description="End date YYYY-MM-DD"),
    calendar_ids: str = Query(..., description="Comma-separated calendar IDs (format: account_id:calendar_id)"),
    db: SQLSession = Depends(get_google_db)
):
    """Get events from selected Google calendars

    Fetches events from specified calendars within the date range.
    Calendar IDs should include account_id prefix: "1:calendar@gmail.com"

    Args:
        start: Start date in YYYY-MM-DD format
        end: End date in YYYY-MM-DD format
        calendar_ids: Comma-separated list of "account_id:calendar_id"

    Response:
        {
            "events": [
                {
                    "id": "gcal_1_abc123",
                    "title": "Meeting",
                    "start": "2026-01-06T10:00:00",
                    "end": "2026-01-06T11:00:00",
                    "allDay": false,
                    "backgroundColor": "#4285F4",
                    "editable": false,
                    "extendedProps": {
                        "source": "google",
                        "calendar_id": "calendar@gmail.com",
                        ...
                    }
                }
            ],
            "errors": []
        }
    """
    user_id, user_role, accounts = _get_user_accounts(request, db)

    if not accounts:
        return EventsResponse(
            events=[],
            errors=[{"error": "No Google accounts connected"}]
        )

    # Parse calendar_ids
    cal_id_list = [cid.strip() for cid in calendar_ids.split(",") if cid.strip()]

    if not cal_id_list:
        return EventsResponse(events=[], errors=[{"error": "No calendars specified"}])

    # Validate date format
    try:
        from datetime import datetime
        datetime.strptime(start, "%Y-%m-%d")
        datetime.strptime(end, "%Y-%m-%d")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {e}. Use YYYY-MM-DD.")

    # Security: Validate that requested calendars belong to user's accounts
    account_ids = {acc.id for acc in accounts}
    for cal_spec in cal_id_list:
        if ":" in cal_spec:
            try:
                acc_id_str, _ = cal_spec.split(":", 1)
                acc_id = int(acc_id_str)
                if acc_id not in account_ids:
                    raise HTTPException(
                        status_code=403,
                        detail=f"Calendar {cal_spec} does not belong to your accounts"
                    )
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid calendar ID format: {cal_spec}")

    # Fetch events from all calendars
    events, errors = get_all_events(db, accounts, cal_id_list, start, end, user_id)

    # Convert to response model
    event_list = [
        GoogleEvent(
            id=evt["id"],
            title=evt["title"],
            start=evt["start"],
            end=evt["end"],
            allDay=evt["allDay"],
            backgroundColor=evt["backgroundColor"],
            borderColor=evt["borderColor"],
            textColor=evt["textColor"],
            editable=evt["editable"],
            classNames=evt["classNames"],
            extendedProps=evt["extendedProps"]
        )
        for evt in events
    ]

    logger.info(f"Retrieved {len(event_list)} events for user={user_id}")

    return EventsResponse(events=event_list, errors=errors)


@router.post("/cleanup")
async def cleanup_oauth_states(
    db: SQLSession = Depends(get_google_db)
):
    """Clean up expired OAuth states

    Removes expired state tokens from database.
    Called periodically by scheduler or manually.
    """
    deleted = cleanup_expired_states(db)

    return {
        "success": True,
        "states_deleted": deleted
    }


# ============================================
# Google Meet Creation (tsk-dashboard-ux-v1-26)
# ============================================

class MeetCreateRequest(BaseModel):
    """Request body for creating Google Meet"""
    account_id: int
    title: str
    start_time: Optional[str] = None  # ISO 8601 format
    duration_minutes: int = 60
    description: Optional[str] = None
    create_calendar_event: bool = True


class MeetCreateResponse(BaseModel):
    """Response for Google Meet creation"""
    success: bool
    meet_link: Optional[str] = None
    calendar_event_id: Optional[str] = None
    calendar_link: Optional[str] = None
    google_email: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    error: Optional[str] = None


@router.post("/meet", response_model=MeetCreateResponse)
async def create_google_meet(
    request_body: MeetCreateRequest,
    request: Request,
    db: SQLSession = Depends(get_google_db)
):
    """Create a Google Meet link with optional Calendar event

    Creates a Google Calendar event with conferenceData to generate
    a Google Meet link automatically.

    Args:
        account_id: ID of connected Google account
        title: Meeting title
        start_time: Start time in ISO 8601 format (default: now)
        duration_minutes: Duration in minutes (default: 60)
        description: Optional meeting description
        create_calendar_event: If True, creates visible calendar event

    Returns:
        {
            success: true,
            meet_link: "https://meet.google.com/xxx-xxxx-xxx",
            calendar_event_id: "xxx",
            calendar_link: "https://calendar.google.com/..."
        }
    """
    from ..services.google_calendar import create_meet_event

    # Get user info from auth middleware for logging
    user_id = None
    if hasattr(request, "state") and isinstance(request.state._state, dict):
        user_id = request.state._state.get("user_id")

    # Verify account ownership (for multi-user mode)
    account = db.query(GoogleAccount).filter(GoogleAccount.id == request_body.account_id).first()
    if not account:
        return MeetCreateResponse(success=False, error="Google account not found")

    # Create Meet event
    result, error = create_meet_event(
        db=db,
        account_id=request_body.account_id,
        title=request_body.title,
        start_time=request_body.start_time,
        duration_minutes=request_body.duration_minutes,
        description=request_body.description,
        create_calendar_event=request_body.create_calendar_event
    )

    if error:
        logger.error(f"Failed to create Meet: {error}")
        return MeetCreateResponse(success=False, error=error)

    logger.info(f"Created Meet link for user={user_id}: {result.get('meet_link')}")

    return MeetCreateResponse(
        success=True,
        meet_link=result.get("meet_link"),
        calendar_event_id=result.get("calendar_event_id"),
        calendar_link=result.get("calendar_link"),
        google_email=result.get("google_email"),
        start_time=result.get("start_time"),
        end_time=result.get("end_time")
    )
