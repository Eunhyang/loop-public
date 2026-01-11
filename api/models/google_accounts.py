"""
SQLAlchemy Models for Google OAuth Account Connection

Tables:
- GoogleAccount: Stores connected Google accounts with encrypted tokens
- GoogleOAuthState: Temporary OAuth state storage for CSRF protection
"""

import os
from datetime import datetime
from pathlib import Path
from typing import Generator

from sqlalchemy import (
    create_engine, Column, Integer, String, DateTime, Text, Index
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session as SQLSession

# Database path (separate from main OAuth DB)
GOOGLE_OAUTH_DIR = Path(__file__).parent.parent / "oauth"
GOOGLE_DB_PATH = os.environ.get("GOOGLE_OAUTH_DB_PATH", str(GOOGLE_OAUTH_DIR / "google_oauth.db"))

# Ensure directory exists before creating engine
GOOGLE_OAUTH_DIR.mkdir(parents=True, exist_ok=True)

# SQLAlchemy setup
google_engine = create_engine(
    f"sqlite:///{GOOGLE_DB_PATH}",
    connect_args={
        "check_same_thread": False,
        "timeout": 30,  # SQLite busy_timeout 30초
    },
    echo=False
)
GoogleSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=google_engine)
GoogleBase = declarative_base()


class GoogleAccount(GoogleBase):
    """Connected Google Account with encrypted tokens

    Stores Google OAuth tokens for Calendar, Drive, Docs integration.
    Tokens are encrypted using AES-256-GCM with format: iv:ciphertext:tag (base64)
    """
    __tablename__ = "google_accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # User association (nullable for single-user/admin mode)
    user_id = Column(Integer, nullable=True)  # FK to oauth.users if multi-user

    # Google account info
    google_email = Column(String(256), nullable=False)
    google_id = Column(String(64), nullable=True)  # Google's unique user ID
    label = Column(String(64), default="default")  # User-defined label (개인, 업무 등)

    # Encrypted tokens (format: base64(iv):base64(ciphertext):base64(tag))
    access_token_enc = Column(Text, nullable=False)
    refresh_token_enc = Column(Text, nullable=True)  # Nullable: Google may not return refresh token

    # Token metadata
    token_expires_at = Column(DateTime, nullable=False)
    scopes = Column(Text, nullable=False)  # JSON array of granted scopes

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Indexes
    __table_args__ = (
        Index("idx_google_account_email", "google_email"),
        Index("idx_google_account_user", "user_id"),
    )


class GoogleOAuthState(GoogleBase):
    """Temporary OAuth State for CSRF Protection

    Stores state parameter during OAuth flow to prevent CSRF attacks.
    Single-use, expires after 10 minutes.
    """
    __tablename__ = "google_oauth_states"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # State token (random string)
    state = Column(String(64), unique=True, nullable=False, index=True)

    # PKCE support
    code_verifier = Column(String(128), nullable=True)

    # Where to redirect after successful auth
    redirect_after = Column(String(512), nullable=True)

    # User info (if authenticated when starting flow)
    user_id = Column(Integer, nullable=True)

    # Expiration
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_google_state_expires", "expires_at"),
    )


def create_google_tables():
    """Create all Google OAuth tables (idempotent)"""
    GoogleBase.metadata.create_all(bind=google_engine)
    print(f"Google OAuth DB initialized: {GOOGLE_DB_PATH}")


def get_google_db() -> Generator[SQLSession, None, None]:
    """Dependency for FastAPI routes"""
    db = GoogleSessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_google_db_session() -> SQLSession:
    """Get a new database session (manual management)"""
    return GoogleSessionLocal()
