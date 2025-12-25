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

# SQLAlchemy setup
engine = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={"check_same_thread": False},  # SQLite in multi-thread
    echo=False  # Set True for SQL debugging
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


def create_tables():
    """Create all tables (idempotent)"""
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
