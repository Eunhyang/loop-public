"""
Google Calendar Service

Handles:
- Creating Google Meet links with Calendar events
- Managing calendar events
- Fetching calendar lists
- Fetching calendar events

Uses Google Calendar API with conferenceData to automatically generate Meet links.
"""

import uuid
import logging
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple, List
from functools import lru_cache
import time

import requests
from sqlalchemy.orm import Session as SQLSession

from ..models.google_accounts import GoogleAccount
from .google_oauth import get_valid_access_token

# Logging
logger = logging.getLogger("google_calendar")

# Google Calendar API endpoints
CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3"


def create_meet_event(
    db: SQLSession,
    account_id: int,
    title: str,
    start_time: Optional[str] = None,
    duration_minutes: int = 60,
    description: Optional[str] = None,
    create_calendar_event: bool = True
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """Create a Google Meet link (optionally with Calendar event)

    If create_calendar_event is False, creates a quick meeting without a calendar event.

    Args:
        db: Database session
        account_id: ID of connected Google account
        title: Meeting title
        start_time: Start time in ISO 8601 format (e.g., "2026-01-10T14:00:00")
                   If None, uses current time
        duration_minutes: Duration in minutes (default: 60)
        description: Optional meeting description
        create_calendar_event: If True, creates calendar event with Meet link

    Returns:
        (result_data, error_message)
        result_data: {
            'meet_link': 'https://meet.google.com/xxx-xxxx-xxx',
            'calendar_event_id': 'xxx' (if create_calendar_event=True),
            'calendar_link': 'https://calendar.google.com/calendar/event?eid=xxx'
        }
    """
    # Get account
    account = db.query(GoogleAccount).filter(GoogleAccount.id == account_id).first()
    if not account:
        return None, f"Google account not found: {account_id}"

    # Get valid access token (refreshes if needed)
    access_token, error = get_valid_access_token(db, account)
    if error:
        return None, error

    # Parse or generate start/end times
    if start_time:
        try:
            start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        except ValueError:
            return None, f"Invalid start_time format: {start_time}. Use ISO 8601."
    else:
        start_dt = datetime.now()

    end_dt = start_dt + timedelta(minutes=duration_minutes)

    # Format for Google Calendar API (ISO 8601)
    start_iso = start_dt.isoformat()
    end_iso = end_dt.isoformat()

    # Create calendar event with conferenceData
    event_body = {
        "summary": title,
        "description": description or f"Meeting created from LOOP Dashboard",
        "start": {
            "dateTime": start_iso,
            "timeZone": "Asia/Seoul"
        },
        "end": {
            "dateTime": end_iso,
            "timeZone": "Asia/Seoul"
        },
        "conferenceData": {
            "createRequest": {
                "requestId": f"loop-{uuid.uuid4().hex[:16]}",
                "conferenceSolutionKey": {
                    "type": "hangoutsMeet"
                }
            }
        }
    }

    # Call Calendar API
    try:
        # conferenceDataVersion=1 is required to create Meet link
        response = requests.post(
            f"{CALENDAR_API_BASE}/calendars/primary/events",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            },
            params={
                "conferenceDataVersion": "1"
            },
            json=event_body,
            timeout=30
        )

        if response.status_code not in (200, 201):
            error_detail = response.text
            logger.error(f"Calendar API error: {response.status_code} - {error_detail}")
            return None, f"Calendar API error: {response.status_code}"

        event_data = response.json()

    except requests.Timeout:
        logger.error("Calendar API request timed out")
        return None, "Calendar API request timed out"
    except requests.RequestException as e:
        logger.error(f"Calendar API request failed: {e}")
        return None, str(e)

    # Extract Meet link
    conference_data = event_data.get("conferenceData", {})
    entry_points = conference_data.get("entryPoints", [])

    meet_link = None
    for entry in entry_points:
        if entry.get("entryPointType") == "video":
            meet_link = entry.get("uri")
            break

    if not meet_link:
        # Fallback: try hangoutLink field
        meet_link = event_data.get("hangoutLink")

    if not meet_link:
        logger.warning("Event created but no Meet link found")
        return None, "Event created but Meet link generation failed"

    # Build result
    result = {
        "meet_link": meet_link,
        "google_email": account.google_email
    }

    if create_calendar_event:
        result["calendar_event_id"] = event_data.get("id")
        result["calendar_link"] = event_data.get("htmlLink")
        result["start_time"] = start_iso
        result["end_time"] = end_iso

    logger.info(f"Created Meet link: {meet_link} for account: {account.google_email}")

    return result, None


def delete_calendar_event(
    db: SQLSession,
    account_id: int,
    event_id: str
) -> Tuple[bool, Optional[str]]:
    """Delete a Google Calendar event

    Args:
        db: Database session
        account_id: ID of connected Google account
        event_id: Calendar event ID to delete

    Returns:
        (success, error_message)
    """
    # Get account
    account = db.query(GoogleAccount).filter(GoogleAccount.id == account_id).first()
    if not account:
        return False, f"Google account not found: {account_id}"

    # Get valid access token
    access_token, error = get_valid_access_token(db, account)
    if error:
        return False, error

    # Delete event
    try:
        response = requests.delete(
            f"{CALENDAR_API_BASE}/calendars/primary/events/{event_id}",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=15
        )

        if response.status_code == 204:
            logger.info(f"Deleted calendar event: {event_id}")
            return True, None
        elif response.status_code == 404:
            return False, "Calendar event not found"
        else:
            return False, f"Delete failed: {response.status_code}"

    except requests.Timeout:
        return False, "Request timed out"
    except requests.RequestException as e:
        return False, str(e)


# ============================================
# Calendar List & Events Cache
# ============================================

# In-memory cache with TTL
# Key format: "{user_id}:{cache_type}:{params_hash}"
# Value format: (data, timestamp)
_calendar_cache: Dict[str, Tuple[Any, float]] = {}

CALENDAR_LIST_TTL = 3600  # 1 hour
EVENTS_TTL = 300  # 5 minutes
MAX_EVENTS_PER_REQUEST = 500


def _get_cache_key(user_id: Optional[int], cache_type: str, params: str = "") -> str:
    """Generate cache key scoped by user"""
    params_hash = hashlib.md5(params.encode()).hexdigest()[:8] if params else ""
    return f"{user_id or 'anon'}:{cache_type}:{params_hash}"


def _get_cached(key: str, ttl: int) -> Optional[Any]:
    """Get cached data if not expired"""
    if key in _calendar_cache:
        data, timestamp = _calendar_cache[key]
        if time.time() - timestamp < ttl:
            return data
        else:
            del _calendar_cache[key]
    return None


def _set_cache(key: str, data: Any):
    """Set cache with current timestamp"""
    _calendar_cache[key] = (data, time.time())

    # Periodic cache cleanup: prune expired entries when cache grows
    if len(_calendar_cache) > 1000:
        _prune_expired_cache()


def _prune_expired_cache():
    """Remove all expired cache entries to prevent memory leaks"""
    now = time.time()
    max_ttl = max(CALENDAR_LIST_TTL, EVENTS_TTL)

    keys_to_delete = []
    for key, (data, timestamp) in _calendar_cache.items():
        if now - timestamp > max_ttl:
            keys_to_delete.append(key)

    for key in keys_to_delete:
        del _calendar_cache[key]

    if keys_to_delete:
        logger.debug(f"Pruned {len(keys_to_delete)} expired cache entries")


def invalidate_calendar_cache(user_id: Optional[int] = None, account_id: Optional[int] = None):
    """Invalidate calendar cache for user or account

    Called when account is deleted or tokens are revoked.
    """
    keys_to_delete = []
    prefix = f"{user_id or 'anon'}:" if user_id else None

    for key in _calendar_cache:
        if prefix and key.startswith(prefix):
            keys_to_delete.append(key)
        # Also check for account-specific keys (if we add them later)

    for key in keys_to_delete:
        del _calendar_cache[key]

    if keys_to_delete:
        logger.info(f"Invalidated {len(keys_to_delete)} cache entries for user={user_id}")


# ============================================
# Calendar List API
# ============================================

def get_calendar_list(
    db: SQLSession,
    account: GoogleAccount,
    user_id: Optional[int] = None
) -> Tuple[Optional[List[Dict[str, Any]]], Optional[str]]:
    """Get list of calendars for a Google account

    Args:
        db: Database session
        account: GoogleAccount to fetch calendars for
        user_id: User ID for cache scoping

    Returns:
        (calendars, error_message)
        calendars: List of {id, summary, color, primary, account_id, account_email}
    """
    # Check cache
    cache_key = _get_cache_key(user_id, "calendar_list", str(account.id))
    cached = _get_cached(cache_key, CALENDAR_LIST_TTL)
    if cached is not None:
        logger.debug(f"Cache hit for calendar list: account={account.id}")
        return cached, None

    # Get valid access token
    access_token, error = get_valid_access_token(db, account)
    if error:
        return None, error

    # Fetch calendar list from Google
    try:
        response = requests.get(
            f"{CALENDAR_API_BASE}/users/me/calendarList",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"maxResults": 100},  # Google's max is 250
            timeout=15
        )

        if response.status_code != 200:
            error_detail = response.text
            logger.error(f"CalendarList API error: {response.status_code} - {error_detail}")
            return None, f"CalendarList API error: {response.status_code}"

        data = response.json()

    except requests.Timeout:
        logger.error("CalendarList API request timed out")
        return None, "CalendarList API request timed out"
    except requests.RequestException as e:
        logger.error(f"CalendarList API request failed: {e}")
        return None, str(e)

    # Process calendar list
    calendars = []
    for cal in data.get("items", []):
        # Skip hidden calendars
        if not cal.get("selected", True):
            continue

        calendars.append({
            "id": cal.get("id"),
            "summary": cal.get("summary", "Untitled"),
            "color": cal.get("backgroundColor", "#4285F4"),
            "primary": cal.get("primary", False),
            "account_id": account.id,
            "account_email": account.google_email,
            "access_role": cal.get("accessRole", "reader")
        })

    # Cache result
    _set_cache(cache_key, calendars)
    logger.info(f"Fetched {len(calendars)} calendars for account: {account.google_email}")

    return calendars, None


def get_all_calendars(
    db: SQLSession,
    accounts: List[GoogleAccount],
    user_id: Optional[int] = None
) -> Tuple[List[Dict[str, Any]], List[Dict[str, str]]]:
    """Get all calendars from multiple Google accounts

    Args:
        db: Database session
        accounts: List of GoogleAccounts to fetch
        user_id: User ID for cache scoping

    Returns:
        (calendars, errors)
        calendars: Combined list from all accounts
        errors: List of {account_email, error} for failed accounts
    """
    all_calendars = []
    errors = []

    for account in accounts:
        calendars, error = get_calendar_list(db, account, user_id)

        if error:
            errors.append({
                "account_id": account.id,
                "account_email": account.google_email,
                "error": error
            })
        elif calendars:
            all_calendars.extend(calendars)

    return all_calendars, errors


# ============================================
# Calendar Events API
# ============================================

def get_calendar_events(
    db: SQLSession,
    account: GoogleAccount,
    calendar_id: str,
    start: str,
    end: str,
    user_id: Optional[int] = None
) -> Tuple[Optional[List[Dict[str, Any]]], Optional[str]]:
    """Get events from a specific calendar

    Args:
        db: Database session
        account: GoogleAccount that owns the calendar
        calendar_id: Calendar ID to fetch events from
        start: Start date in YYYY-MM-DD format
        end: End date in YYYY-MM-DD format
        user_id: User ID for cache scoping

    Returns:
        (events, error_message)
        events: List of FullCalendar-compatible event objects
    """
    # Check cache
    cache_params = f"{account.id}:{calendar_id}:{start}:{end}"
    cache_key = _get_cache_key(user_id, "events", cache_params)
    cached = _get_cached(cache_key, EVENTS_TTL)
    if cached is not None:
        logger.debug(f"Cache hit for events: calendar={calendar_id}")
        return cached, None

    # Get valid access token
    access_token, error = get_valid_access_token(db, account)
    if error:
        return None, error

    # Convert dates to RFC3339 format
    # Support both YYYY-MM-DD and ISO 8601 formats (e.g., 2025-12-28T00:00:00+09:00)
    try:
        # Extract YYYY-MM-DD from ISO format if needed
        start_date = start.split('T')[0] if 'T' in start else start
        end_date = end.split('T')[0] if 'T' in end else end

        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        # Add time to get full day range
        time_min = start_dt.strftime("%Y-%m-%dT00:00:00Z")
        time_max = end_dt.strftime("%Y-%m-%dT23:59:59Z")
    except ValueError as e:
        return None, f"Invalid date format: {e}. Use YYYY-MM-DD or ISO 8601."

    # Fetch events from Google
    try:
        response = requests.get(
            f"{CALENDAR_API_BASE}/calendars/{calendar_id}/events",
            headers={"Authorization": f"Bearer {access_token}"},
            params={
                "timeMin": time_min,
                "timeMax": time_max,
                "singleEvents": "true",  # Expand recurring events
                "orderBy": "startTime",
                "maxResults": MAX_EVENTS_PER_REQUEST
            },
            timeout=30
        )

        if response.status_code == 404:
            return None, f"Calendar not found: {calendar_id}"
        elif response.status_code != 200:
            error_detail = response.text
            logger.error(f"Events API error: {response.status_code} - {error_detail}")
            return None, f"Events API error: {response.status_code}"

        data = response.json()

    except requests.Timeout:
        logger.error("Events API request timed out")
        return None, "Events API request timed out"
    except requests.RequestException as e:
        logger.error(f"Events API request failed: {e}")
        return None, str(e)

    # Get calendar color from account's calendar list (cached)
    calendars, _ = get_calendar_list(db, account, user_id)
    calendar_info = next(
        (c for c in (calendars or []) if c["id"] == calendar_id),
        {"color": "#4285F4", "summary": "Calendar"}
    )

    # Process events into FullCalendar format
    events = []
    for event in data.get("items", []):
        # Skip cancelled events
        if event.get("status") == "cancelled":
            continue

        # Get start/end times
        start_info = event.get("start", {})
        end_info = event.get("end", {})

        # Handle all-day vs timed events
        if "date" in start_info:
            # All-day event
            event_start = start_info["date"]
            event_end = end_info.get("date", event_start)
            all_day = True
        else:
            # Timed event
            event_start = start_info.get("dateTime", "")
            event_end = end_info.get("dateTime", event_start)
            all_day = False

        events.append({
            # Unique ID combining calendar and event
            "id": f"gcal_{account.id}_{event.get('id', '')}",
            "title": event.get("summary", "(No title)"),
            "start": event_start,
            "end": event_end,
            "allDay": all_day,
            "backgroundColor": calendar_info["color"],
            "borderColor": calendar_info["color"],
            "textColor": "#ffffff",
            "editable": False,  # Read-only
            "classNames": ["google-event"],
            "extendedProps": {
                "source": "google",
                "account_id": account.id,
                "account_email": account.google_email,
                "calendar_id": calendar_id,
                "calendar_name": calendar_info.get("summary", "Calendar"),
                "google_event_id": event.get("id"),
                "description": event.get("description", ""),
                "location": event.get("location", ""),
                "html_link": event.get("htmlLink", "")
            }
        })

    # Cache result
    _set_cache(cache_key, events)
    logger.info(f"Fetched {len(events)} events from calendar: {calendar_id}")

    return events, None


def get_all_events(
    db: SQLSession,
    accounts: List[GoogleAccount],
    calendar_ids: List[str],
    start: str,
    end: str,
    user_id: Optional[int] = None
) -> Tuple[List[Dict[str, Any]], List[Dict[str, str]]]:
    """Get events from multiple calendars across multiple accounts

    Args:
        db: Database session
        accounts: List of GoogleAccounts
        calendar_ids: List of calendar IDs to fetch (format: "{account_id}__{calendar_id}" with double underscore)
        start: Start date YYYY-MM-DD
        end: End date YYYY-MM-DD
        user_id: User ID for cache scoping

    Note: Uses double underscore (__) as separator instead of colon (:) to avoid
    URL parsing issues with reverse proxies (Synology NAS). Backward compatible with colon format.

    Returns:
        (events, errors)
        events: Combined list from all calendars
        errors: List of {calendar_id, error} for failed fetches
    """
    all_events = []
    errors = []

    # Build account lookup
    account_map = {acc.id: acc for acc in accounts}

    # Process each calendar
    import re
    for cal_spec in calendar_ids:
        # Parse "account_id__calendar_id" format (double underscore preferred)
        # Also supports legacy "account_id:calendar_id" format for backward compatibility
        # Check new format first: must start with digits followed by __
        if re.match(r'^\d+__', cal_spec):
            separator = "__"
        elif re.match(r'^\d+:', cal_spec):
            separator = ":"
        else:
            separator = None

        if separator:
            try:
                acc_id_str, cal_id = cal_spec.split(separator, 1)
                acc_id = int(acc_id_str)
            except ValueError:
                errors.append({"calendar_id": cal_spec, "error": "Invalid format"})
                continue
        else:
            # Legacy format: just calendar_id, try all accounts
            cal_id = cal_spec
            acc_id = None

        # Find account
        if acc_id:
            account = account_map.get(acc_id)
            if not account:
                errors.append({"calendar_id": cal_spec, "error": "Account not found"})
                continue
            accounts_to_try = [account]
        else:
            accounts_to_try = list(accounts)

        # Try fetching from account(s)
        success = False
        for account in accounts_to_try:
            events, error = get_calendar_events(db, account, cal_id, start, end, user_id)
            if events is not None:
                all_events.extend(events)
                success = True
                break

        if not success and not errors:
            errors.append({"calendar_id": cal_spec, "error": error or "Unknown error"})

    return all_events, errors
