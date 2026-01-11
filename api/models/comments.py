"""
Comments Database Models

tsk-023-39: 댓글 시스템 + @멘션 구현

Database Schema (SQLite):
- Comment model with SQLAlchemy
- Proper indexes for performance
- Text storage for mentions (JSON array)
- Parent/child comment support
- Soft delete support
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    create_engine, Column, Integer, String, Text, DateTime,
    ForeignKey, Index, event
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, Field, validator
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

Base = declarative_base()


# ============================================
# SQLAlchemy Models
# ============================================

class Comment(Base):
    """Comment model with proper schema per Codex recommendations

    Changes from initial plan:
    - author_user_id instead of author_email (auth validation)
    - mentions as TEXT (SQLite has no native JSON)
    - Proper indexes for performance
    - updated_at auto-update via SQLAlchemy onupdate
    - Soft delete support (deleted_at)
    """
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_type = Column(String(32), nullable=False)  # 'task' | 'project'
    entity_id = Column(String(64), nullable=False)
    author_user_id = Column(Integer, nullable=False)  # OAuth user.id
    author_email = Column(String(256), nullable=False)  # Denormalized for display
    content = Column(Text, nullable=False)
    mentions = Column(Text, nullable=True)  # JSON array as TEXT: '["tsk-023-01", "prj-023"]'
    parent_id = Column(Integer, ForeignKey('comments.id'), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete

    # Indexes per Codex recommendations
    __table_args__ = (
        Index('idx_comments_entity', 'entity_type', 'entity_id'),
        Index('idx_comments_entity_created', 'entity_type', 'entity_id', 'created_at'),
        Index('idx_comments_author', 'author_user_id'),
        Index('idx_comments_parent', 'parent_id'),
    )

    def to_dict(self, include_deleted: bool = False) -> Optional[Dict[str, Any]]:
        """Convert to dictionary

        Args:
            include_deleted: If False, return None for deleted comments
        """
        if not include_deleted and self.deleted_at:
            return None

        return {
            'id': self.id,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'author_user_id': self.author_user_id,
            'author_email': self.author_email,
            'content': self.content,
            'mentions': json.loads(self.mentions) if self.mentions else [],
            'parent_id': self.parent_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'deleted_at': self.deleted_at.isoformat() if self.deleted_at else None,
        }


# ============================================
# Pydantic Schemas (API Request/Response)
# ============================================

class CommentCreate(BaseModel):
    """Comment creation request"""
    entity_type: str = Field(..., pattern='^(task|project)$')
    entity_id: str = Field(..., min_length=1, max_length=64)
    content: str = Field(..., min_length=1, max_length=10000)
    mentions: List[str] = Field(default_factory=list)
    parent_id: Optional[int] = None

    @validator('content')
    def validate_content(cls, v):
        """Ensure content is not empty/whitespace only"""
        if not v or not v.strip():
            raise ValueError('Content cannot be empty or whitespace only')
        return v.strip()

    @validator('mentions')
    def validate_mentions(cls, v):
        """Validate mention format"""
        for mention in v:
            if not mention or not isinstance(mention, str):
                raise ValueError(f'Invalid mention: {mention}')
        return v


class CommentUpdate(BaseModel):
    """Comment update request"""
    content: str = Field(..., min_length=1, max_length=10000)
    mentions: List[str] = Field(default_factory=list)

    @validator('content')
    def validate_content(cls, v):
        if not v or not v.strip():
            raise ValueError('Content cannot be empty or whitespace only')
        return v.strip()


class CommentResponse(BaseModel):
    """Comment API response"""
    id: int
    entity_type: str
    entity_id: str
    author: Dict[str, Any]  # {email, member_id, name, icon}
    content: str
    mentions: List[str]
    parent_id: Optional[int]
    replies: List['CommentResponse'] = Field(default_factory=list)
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True


# Enable forward reference for recursive type
CommentResponse.update_forward_refs()


# ============================================
# Database Connection
# ============================================

class CommentDatabase:
    """Comments database manager"""

    def __init__(self, db_path: Optional[Path] = None):
        """Initialize database

        Args:
            db_path: Database file path (default: api/oauth/comments.db)
        """
        if db_path is None:
            # Use same directory as OAuth db
            from pathlib import Path
            api_dir = Path(__file__).parent.parent
            db_path = api_dir / "oauth" / "comments.db"

        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

        self.engine = create_engine(
            f"sqlite:///{self.db_path}",
            connect_args={
                "check_same_thread": False,
                "timeout": 30,  # SQLite busy_timeout 30초
            }
        )

        # Enable foreign key constraints (off by default in SQLite)
        @event.listens_for(self.engine, "connect")
        def set_sqlite_pragma(dbapi_conn, connection_record):
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

        self.SessionLocal = sessionmaker(bind=self.engine)
        self._create_tables()

        logger.info(f"Comments DB initialized: {self.db_path}")

    def _create_tables(self):
        """Create tables if not exist"""
        Base.metadata.create_all(bind=self.engine)

    def get_session(self) -> Session:
        """Get database session"""
        return self.SessionLocal()

    def close(self):
        """Close database connection"""
        self.engine.dispose()


# ============================================
# Global Instance
# ============================================

_db_instance: Optional[CommentDatabase] = None


def get_comment_db() -> CommentDatabase:
    """Get global CommentDatabase instance"""
    global _db_instance
    if _db_instance is None:
        _db_instance = CommentDatabase()
    return _db_instance


def get_db_session() -> Session:
    """Get database session (for dependency injection)"""
    db = get_comment_db()
    session = db.get_session()
    try:
        yield session
    finally:
        session.close()
