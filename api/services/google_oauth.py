"""
Google OAuth Service

Handles:
- Token encryption/decryption (AES-256-GCM)
- OAuth flow (authorization URL, token exchange)
- Token refresh
- Token revocation
"""

import os
import json
import secrets
import base64
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from urllib.parse import urlencode, parse_qs
import hashlib

import requests
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from sqlalchemy.orm import Session as SQLSession

from ..models.google_accounts import GoogleAccount, GoogleOAuthState

# Logging
logger = logging.getLogger("google_oauth")
logging.basicConfig(level=logging.INFO)


# ============================================
# Configuration (Environment Variables)
# ============================================

def get_google_config() -> Dict[str, str]:
    """Get Google OAuth configuration from environment"""
    return {
        "client_id": os.environ.get("GOOGLE_CLIENT_ID", ""),
        "client_secret": os.environ.get("GOOGLE_CLIENT_SECRET", ""),
        "redirect_uri": os.environ.get(
            "GOOGLE_REDIRECT_URI",
            "https://mcp.sosilab.synology.me/api/google/callback"
        ),
    }


def get_encryption_key() -> bytes:
    """Get 32-byte encryption key from environment

    TOKEN_ENCRYPTION_KEY should be a 32-byte hex string (64 chars)
    or base64-encoded 32 bytes.

    Raises:
        ValueError: If key is missing or invalid format
    """
    key_str = os.environ.get("TOKEN_ENCRYPTION_KEY", "")

    if not key_str:
        raise ValueError(
            "TOKEN_ENCRYPTION_KEY environment variable is required. "
            "Generate with: python -c \"import secrets; print(secrets.token_hex(32))\""
        )

    # Try hex first (64 chars = 32 bytes)
    try:
        key = bytes.fromhex(key_str)
        if len(key) == 32:
            return key
    except ValueError:
        pass

    # Try base64 (44 chars = 32 bytes)
    try:
        key = base64.b64decode(key_str)
        if len(key) == 32:
            return key
    except Exception:
        pass

    raise ValueError(
        "TOKEN_ENCRYPTION_KEY must be 64 hex chars or 44 base64 chars (32 bytes). "
        f"Got {len(key_str)} chars."
    )


# Google OAuth Endpoints
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke"

# Default scopes for Calendar, Drive, Docs
DEFAULT_SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/documents.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
]


# ============================================
# Token Encryption (AES-256-GCM)
# ============================================

def encrypt_token(plaintext: str) -> str:
    """Encrypt token using AES-256-GCM

    Returns:
        Format: base64(iv):base64(ciphertext):base64(tag)
    """
    key = get_encryption_key()
    aesgcm = AESGCM(key)

    # Generate random 12-byte IV
    iv = secrets.token_bytes(12)

    # Encrypt
    ciphertext = aesgcm.encrypt(iv, plaintext.encode('utf-8'), None)

    # Split ciphertext and tag (tag is last 16 bytes)
    ct, tag = ciphertext[:-16], ciphertext[-16:]

    # Encode to base64
    iv_b64 = base64.b64encode(iv).decode('ascii')
    ct_b64 = base64.b64encode(ct).decode('ascii')
    tag_b64 = base64.b64encode(tag).decode('ascii')

    return f"{iv_b64}:{ct_b64}:{tag_b64}"


def decrypt_token(encrypted: str) -> Optional[str]:
    """Decrypt token using AES-256-GCM

    Args:
        encrypted: Format iv:ciphertext:tag (base64)

    Returns:
        Decrypted plaintext or None if decryption fails
    """
    try:
        key = get_encryption_key()
        aesgcm = AESGCM(key)

        # Parse components
        parts = encrypted.split(':')
        if len(parts) != 3:
            logger.error("Invalid encrypted token format")
            return None

        iv = base64.b64decode(parts[0])
        ct = base64.b64decode(parts[1])
        tag = base64.b64decode(parts[2])

        # Reconstruct ciphertext with tag
        ciphertext = ct + tag

        # Decrypt
        plaintext = aesgcm.decrypt(iv, ciphertext, None)
        return plaintext.decode('utf-8')

    except Exception as e:
        logger.error(f"Token decryption failed: {e}")
        return None


# ============================================
# PKCE Support
# ============================================

def generate_pkce_pair() -> Tuple[str, str]:
    """Generate PKCE code_verifier and code_challenge

    Returns:
        (code_verifier, code_challenge)
    """
    # Generate random 32-byte verifier
    verifier = secrets.token_urlsafe(32)

    # SHA256 hash and base64url encode
    digest = hashlib.sha256(verifier.encode('ascii')).digest()
    challenge = base64.urlsafe_b64encode(digest).rstrip(b'=').decode('ascii')

    return verifier, challenge


# ============================================
# OAuth Flow
# ============================================

def create_authorization_url(
    db: SQLSession,
    user_id: Optional[int] = None,
    redirect_after: Optional[str] = None,
    scopes: Optional[list] = None
) -> str:
    """Create Google OAuth authorization URL

    Args:
        db: Database session
        user_id: Current user ID (for tracking)
        redirect_after: Where to redirect after auth
        scopes: OAuth scopes (default: calendar, drive, docs)

    Returns:
        Authorization URL to redirect user to
    """
    config = get_google_config()

    if not config["client_id"]:
        raise ValueError("GOOGLE_CLIENT_ID not configured")

    # Generate PKCE
    code_verifier, code_challenge = generate_pkce_pair()

    # Generate state token
    state = secrets.token_urlsafe(32)

    # Save state to DB
    state_obj = GoogleOAuthState(
        state=state,
        code_verifier=code_verifier,
        redirect_after=redirect_after,
        user_id=user_id,
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.add(state_obj)
    db.commit()

    # Build authorization URL
    params = {
        "client_id": config["client_id"],
        "redirect_uri": config["redirect_uri"],
        "response_type": "code",
        "scope": " ".join(scopes or DEFAULT_SCOPES),
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "access_type": "offline",  # Get refresh token
        "prompt": "consent",  # Force consent to get refresh token
    }

    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


def exchange_code_for_tokens(
    db: SQLSession,
    code: str,
    state: str
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """Exchange authorization code for tokens

    Args:
        db: Database session
        code: Authorization code from Google
        state: State parameter for CSRF verification

    Returns:
        (account_data, error_message)
        account_data: {google_email, google_id, access_token_enc, refresh_token_enc, ...}
    """
    config = get_google_config()

    # Verify state
    state_obj = db.query(GoogleOAuthState).filter(
        GoogleOAuthState.state == state,
        GoogleOAuthState.expires_at > datetime.utcnow()
    ).first()

    if not state_obj:
        return None, "Invalid or expired state parameter"

    code_verifier = state_obj.code_verifier
    redirect_after = state_obj.redirect_after
    user_id = state_obj.user_id

    # Delete state (single-use)
    db.delete(state_obj)
    db.commit()

    # Exchange code for tokens
    try:
        response = requests.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": config["client_id"],
                "client_secret": config["client_secret"],
                "code": code,
                "code_verifier": code_verifier,
                "grant_type": "authorization_code",
                "redirect_uri": config["redirect_uri"],
            },
            timeout=30  # 30 second timeout
        )

        if response.status_code != 200:
            logger.error(f"Token exchange failed: {response.text}")
            return None, f"Token exchange failed: {response.status_code}"

        token_data = response.json()

    except requests.Timeout:
        logger.error("Token exchange timed out")
        return None, "Token exchange timed out"
    except Exception as e:
        logger.error(f"Token exchange error: {e}")
        return None, str(e)

    # Extract tokens
    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in", 3600)
    scope = token_data.get("scope", "")

    if not access_token:
        return None, "No access token in response"

    if not refresh_token:
        logger.warning("No refresh token returned. User may have already authorized.")
        # Still proceed - can use access token until it expires

    # Get user info
    try:
        userinfo_response = requests.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=15  # 15 second timeout for user info
        )
        userinfo = userinfo_response.json()
        google_email = userinfo.get("email", "unknown@gmail.com")
        google_id = userinfo.get("id")
    except Exception as e:
        logger.error(f"Failed to get user info: {e}")
        google_email = "unknown@gmail.com"
        google_id = None

    # Encrypt tokens
    access_token_enc = encrypt_token(access_token)
    # Store None if no refresh token (column is nullable)
    refresh_token_enc = encrypt_token(refresh_token) if refresh_token else None

    # Calculate expiry
    token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

    return {
        "google_email": google_email,
        "google_id": google_id,
        "access_token_enc": access_token_enc,
        "refresh_token_enc": refresh_token_enc,
        "token_expires_at": token_expires_at,
        "scopes": json.dumps(scope.split()),
        "user_id": user_id,
        "redirect_after": redirect_after,
    }, None


def refresh_access_token(
    db: SQLSession,
    account: GoogleAccount
) -> Tuple[Optional[str], Optional[str]]:
    """Refresh access token using refresh token

    Args:
        db: Database session
        account: GoogleAccount to refresh

    Returns:
        (new_access_token, error_message)
    """
    config = get_google_config()

    # Check if refresh token exists
    if not account.refresh_token_enc:
        return None, "No refresh token available. User needs to re-authorize."

    # Decrypt refresh token
    refresh_token = decrypt_token(account.refresh_token_enc)
    if not refresh_token:
        return None, "Failed to decrypt refresh token"

    # Request new access token
    try:
        response = requests.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": config["client_id"],
                "client_secret": config["client_secret"],
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
            timeout=30  # 30 second timeout
        )

        if response.status_code != 200:
            logger.error(f"Token refresh failed: {response.text}")
            return None, f"Token refresh failed: {response.status_code}"

        token_data = response.json()

    except requests.Timeout:
        logger.error("Token refresh timed out")
        return None, "Token refresh timed out"
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        return None, str(e)

    # Extract new access token
    new_access_token = token_data.get("access_token")
    expires_in = token_data.get("expires_in", 3600)

    if not new_access_token:
        return None, "No access token in refresh response"

    # Update account with new token
    account.access_token_enc = encrypt_token(new_access_token)
    account.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
    account.updated_at = datetime.utcnow()

    # If new refresh token provided (rare), update it
    new_refresh_token = token_data.get("refresh_token")
    if new_refresh_token:
        account.refresh_token_enc = encrypt_token(new_refresh_token)

    db.commit()

    return new_access_token, None


def get_valid_access_token(
    db: SQLSession,
    account: GoogleAccount
) -> Tuple[Optional[str], Optional[str]]:
    """Get valid access token, refreshing if needed

    Automatically refreshes if token expires within 5 minutes.
    If no refresh token is available and token is expired, returns error.

    Args:
        db: Database session
        account: GoogleAccount

    Returns:
        (access_token, error_message)
    """
    # Check if token expires soon (5 min buffer)
    if account.token_expires_at < datetime.utcnow() + timedelta(minutes=5):
        # Check if we can refresh
        if not account.refresh_token_enc:
            # Token expired and no refresh token
            if account.token_expires_at < datetime.utcnow():
                return None, "Access token expired. User needs to re-authorize (no refresh token)."
            # Token expiring soon but still valid, use it
            logger.warning(f"Token expiring soon for {account.google_email}, no refresh token available")
        else:
            logger.info(f"Token expiring soon for {account.google_email}, refreshing...")
            return refresh_access_token(db, account)

    # Token still valid, decrypt and return
    access_token = decrypt_token(account.access_token_enc)
    if not access_token:
        return None, "Failed to decrypt access token"

    return access_token, None


def revoke_account(
    db: SQLSession,
    account: GoogleAccount
) -> Tuple[bool, Optional[str]]:
    """Revoke Google OAuth token and delete account

    Args:
        db: Database session
        account: GoogleAccount to revoke

    Returns:
        (success, error_message)
    """
    # Get access token to revoke
    access_token = decrypt_token(account.access_token_enc)

    if access_token:
        # Try to revoke token with Google
        try:
            response = requests.post(
                GOOGLE_REVOKE_URL,
                params={"token": access_token},
                timeout=15  # 15 second timeout
            )

            if response.status_code != 200:
                logger.warning(f"Token revoke returned {response.status_code}: {response.text}")
                # Continue anyway - delete from our DB

        except requests.Timeout:
            logger.warning("Token revoke timed out, continuing with deletion")
        except Exception as e:
            logger.warning(f"Token revoke error: {e}")
            # Continue anyway

    # Delete account from DB
    db.delete(account)
    db.commit()

    logger.info(f"Revoked and deleted Google account: {account.google_email}")
    return True, None


# ============================================
# Cleanup
# ============================================

def cleanup_expired_states(db: SQLSession) -> int:
    """Clean up expired OAuth states

    Returns:
        Number of states deleted
    """
    deleted = db.query(GoogleOAuthState).filter(
        GoogleOAuthState.expires_at < datetime.utcnow()
    ).delete()
    db.commit()
    return deleted
