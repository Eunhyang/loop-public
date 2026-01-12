"""
SQLAlchemy Models for OAuth 2.0

Tables:
- AuthCode: Authorization codes (single-use, 10-min TTL)
- User: Registered users
- Session: Login sessions (24-hour TTL)
- OAuthClient: Dynamic Client Registration (RFC 7591)
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

# Database path (relative to api/oauth/)
OAUTH_DIR = Path(__file__).parent
DB_PATH = os.environ.get("OAUTH_DB_PATH", str(OAUTH_DIR / "oauth.db"))

# Note: Directory creation moved to ensure_db_dir() for lazy initialization
# This prevents permission errors when module is imported before volume is ready

# SQLAlchemy setup
engine = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={
        "check_same_thread": False,
        "timeout": 30,  # SQLite busy_timeout 30초
    },
    echo=False
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class AuthCode(Base):
    """Authorization Code (single-use, 10-min TTL)"""
    __tablename__ = "auth_codes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(128), unique=True, nullable=False, index=True)
    code_challenge = Column(String(128), nullable=True)  # PKCE S256
    code_challenge_method = Column(String(16), nullable=True)  # "S256"
    client_id = Column(String(64), nullable=False)
    redirect_uri = Column(String(512), nullable=False)
    user_id = Column(String(128), nullable=False)
    scope = Column(String(256), default="mcp:read")
    state = Column(String(256), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Index for fast lookup
    __table_args__ = (
        Index("idx_auth_code_expires", "expires_at"),
    )


class User(Base):
    """Registered User"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(256), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(32), default="member")  # "member" | "exec" | "admin"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Session(Base):
    """Login Session (24-hour TTL)"""
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(String(128), nullable=False)
    user_email = Column(String(256), nullable=True)  # Cached for convenience
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Index for cleanup
    __table_args__ = (
        Index("idx_session_expires", "expires_at"),
    )


class OAuthClient(Base):
    """Dynamic Client Registration (RFC 7591)"""
    __tablename__ = "oauth_clients"

    id = Column(Integer, primary_key=True, autoincrement=True)
    client_id = Column(String(64), unique=True, nullable=False, index=True)
    client_secret = Column(String(128), nullable=True)  # Optional for public clients
    client_name = Column(String(256), default="ChatGPT MCP Client")
    redirect_uris = Column(Text, nullable=True)  # JSON array as string
    grant_types = Column(String(256), default="authorization_code")
    response_types = Column(String(256), default="code")
    token_endpoint_auth_method = Column(String(64), default="none")
    created_at = Column(DateTime, default=datetime.utcnow)


class ServiceAccount(Base):
    """Service Account for machine-to-machine authentication (n8n, scripts)

    Provides long-lived tokens with revocation support.
    Unlike User accounts, these don't require password-based login.
    """
    __tablename__ = "service_accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(64), unique=True, nullable=False, index=True)  # svc_public, svc_admin
    jti = Column(String(64), unique=True, nullable=False, index=True)   # JWT ID for revocation
    role = Column(String(32), default="member")  # member | exec | admin
    scope = Column(String(256), default="api:read api:write")  # Space-separated scopes
    description = Column(String(512), nullable=True)  # Human-readable description
    revoked = Column(Integer, default=0)  # 0=active, 1=revoked (SQLite no boolean)
    expires_at = Column(DateTime, nullable=True)  # null = never expires
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)  # Track usage

    # Index for revocation check (middleware lookup)
    __table_args__ = (
        Index("idx_service_account_jti_revoked", "jti", "revoked"),
    )


def ensure_db_dir():
    """Ensure DB directory exists (lazy initialization)"""
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)


def create_tables():
    """Create all tables (idempotent)"""
    ensure_db_dir()  # Ensure directory exists before DB creation
    Base.metadata.create_all(bind=engine)
    print(f"OAuth DB initialized: {DB_PATH}")


def get_db() -> Generator[SQLSession, None, None]:
    """Dependency for FastAPI routes"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_session() -> SQLSession:
    """Get a new database session (manual management)"""
    return SessionLocal()
