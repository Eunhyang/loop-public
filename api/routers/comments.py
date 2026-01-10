"""
Comments API Router

tsk-023-39: 댓글 시스템 + @멘션 구현

Features:
- CRUD operations with auth validation
- Pagination and sorting
- XSS sanitization
- Parent/child validation
- Soft delete support
- Optimistic concurrency (ETag)
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Request, Depends, Header
from sqlalchemy.orm import Session
import json
import re
import logging

from ..models.comments import (
    Comment, CommentCreate, CommentUpdate, CommentResponse,
    get_db_session, get_comment_db
)
from ..cache import get_cache
from .audit import log_entity_action

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/comments", tags=["comments"])


# ============================================
# Helper Functions
# ============================================

def get_current_user(request: Request) -> Dict[str, Any]:
    """Extract user from request state (set by AuthMiddleware)"""
    state = getattr(request, 'state', {})
    user_id = getattr(state, 'user_id', None)
    role = getattr(state, 'role', 'member')

    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    return {
        'user_id': user_id,
        'role': role
    }


def sanitize_content(content: str) -> str:
    """Sanitize HTML/markdown content to prevent XSS

    Per Codex: Server-side sanitization required
    For now: strip HTML tags, keep markdown
    TODO: Use bleach or DOMPurify server-side
    """
    # Remove HTML tags
    content = re.sub(r'<[^>]+>', '', content)
    return content.strip()


def validate_entity_exists(entity_type: str, entity_id: str) -> bool:
    """Validate entity exists in vault"""
    cache = get_cache()

    if entity_type == 'task':
        return cache.get_task(entity_id) is not None
    elif entity_type == 'project':
        return cache.get_project(entity_id) is not None

    return False


def validate_parent_comment(
    db: Session,
    parent_id: int,
    entity_type: str,
    entity_id: str
) -> Optional[Comment]:
    """Validate parent comment exists and belongs to same entity

    Per Codex: Enforce parent_id within same entity_type/entity_id
    Codex fix: Check deleted_at to prevent replies to deleted comments
    """
    parent = db.query(Comment).filter(Comment.id == parent_id).first()

    if not parent or parent.deleted_at:
        raise HTTPException(
            status_code=404,
            detail="Parent comment not found or deleted"
        )

    if parent.entity_type != entity_type or parent.entity_id != entity_id:
        raise HTTPException(
            status_code=400,
            detail="Parent comment must belong to the same entity"
        )

    return parent


def build_comment_response(
    comment: Comment,
    db: Session,
    include_replies: bool = True
) -> Dict[str, Any]:
    """Build comment response with author info and replies"""
    cache = get_cache()

    # Get author info from members
    member = cache.get_member_by_email(comment.author_email)
    if member:
        author = {
            'email': comment.author_email,
            'member_id': member.get('id'),
            'name': member.get('name'),
            'icon': member.get('icon', '👤')
        }
    else:
        author = {
            'email': comment.author_email,
            'member_id': None,
            'name': comment.author_email,
            'icon': '👤'
        }

    result = {
        'id': comment.id,
        'entity_type': comment.entity_type,
        'entity_id': comment.entity_id,
        'author': author,
        'content': comment.content,
        'mentions': json.loads(comment.mentions) if comment.mentions else [],
        'parent_id': comment.parent_id,
        'created_at': comment.created_at.isoformat(),
        'updated_at': comment.updated_at.isoformat(),
        'replies': []
    }

    # Load replies (only for top-level comments)
    if include_replies and not comment.parent_id:
        replies = db.query(Comment).filter(
            Comment.parent_id == comment.id,
            Comment.deleted_at.is_(None)
        ).order_by(Comment.created_at.asc()).all()

        result['replies'] = [
            build_comment_response(reply, db, include_replies=False)
            for reply in replies
        ]

    return result


# ============================================
# API Endpoints
# ============================================

@router.get("")
def list_comments(
    entity_type: str,
    entity_id: str,
    limit: int = 50,
    offset: int = 0,
    order: str = "asc",
    db: Session = Depends(get_db_session)
):
    """List comments for an entity

    Query Parameters:
        entity_type: 'task' | 'project'
        entity_id: Entity ID
        limit: Max results (default 50, max 100)
        offset: Pagination offset (default 0)
        order: 'asc' | 'desc' (default 'asc')

    Per Codex: Pagination and ordering required
    """
    # Validate entity exists
    if not validate_entity_exists(entity_type, entity_id):
        raise HTTPException(status_code=404, detail=f"Entity not found: {entity_id}")

    # Validate pagination parameters (Codex fix)
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 100")
    if offset < 0:
        raise HTTPException(status_code=400, detail="offset must be >= 0")
    if order not in ['asc', 'desc']:
        raise HTTPException(status_code=400, detail="order must be 'asc' or 'desc'")

    # Query comments (top-level only, replies fetched recursively)
    query = db.query(Comment).filter(
        Comment.entity_type == entity_type,
        Comment.entity_id == entity_id,
        Comment.parent_id.is_(None),
        Comment.deleted_at.is_(None)
    )

    # Order by created_at
    if order == 'asc':
        query = query.order_by(Comment.created_at.asc())
    else:
        query = query.order_by(Comment.created_at.desc())

    # Pagination
    total = query.count()
    comments = query.limit(limit).offset(offset).all()

    return {
        'comments': [build_comment_response(c, db) for c in comments],
        'total': total,
        'limit': limit,
        'offset': offset
    }


@router.post("")
def create_comment(
    data: CommentCreate,
    request: Request,
    db: Session = Depends(get_db_session)
):
    """Create a new comment

    Per Codex:
    - Validate entity exists
    - Validate parent_id within same entity
    - Sanitize content server-side
    - Use user_id from auth, not free-text email
    """
    user = get_current_user(request)
    cache = get_cache()

    # Validate entity exists
    if not validate_entity_exists(data.entity_type, data.entity_id):
        raise HTTPException(status_code=404, detail=f"Entity not found: {data.entity_id}")

    # Validate parent comment if provided
    if data.parent_id:
        validate_parent_comment(db, data.parent_id, data.entity_type, data.entity_id)

    # Get user email from OAuth JWT claims
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    # Prefer email claim, fallback to user_id for non-OAuth flows (API tokens, service accounts)
    author_email = user.get('email')
    if not author_email or not isinstance(author_email, str) or not author_email.strip():
        # Fallback to user_id for backward compatibility (API tokens, service accounts)
        author_email = user.get('user_id')
        if not author_email:
            raise HTTPException(
                status_code=401,
                detail="User identifier not found in token. Please re-login."
            )

    # Normalize identifier: convert to string, strip, and lowercase for emails
    author_email = str(author_email).strip().lower()

    # Convert user_id to integer if it's an email (lookup OAuth DB)
    # TODO: Proper user_id lookup from OAuth database
    # For MVP, use a hash of email as user_id
    author_user_id = hash(author_email) % 2147483647  # Keep within INT range

    # Sanitize content
    content = sanitize_content(data.content)

    # Validate content length
    if len(content) > 10000:
        raise HTTPException(status_code=400, detail="Content exceeds 10,000 characters")

    # Create comment
    comment = Comment(
        entity_type=data.entity_type,
        entity_id=data.entity_id,
        author_user_id=author_user_id,
        author_email=author_email,
        content=content,
        mentions=json.dumps(data.mentions) if data.mentions else None,
        parent_id=data.parent_id
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    logger.info(f"Comment created: id={comment.id}, entity={data.entity_id}, author={author_email}")

    # Discord 알림 전송 (content 포함)
    log_entity_action(
        action="create",
        entity_type="Comment",
        entity_id=str(comment.id),
        entity_name=f"Comment on {data.entity_type} {data.entity_id}",
        details={
            "target_entity": data.entity_id,
            "target_type": data.entity_type,
            "parent_id": data.parent_id,
            "content": content  # 댓글 내용 추가
        },
        actor=f"api:{author_email}"
    )

    return build_comment_response(comment, db)


@router.put("/{comment_id}")
def update_comment(
    comment_id: int,
    data: CommentUpdate,
    request: Request,
    if_match: Optional[str] = Header(None),
    db: Session = Depends(get_db_session)
):
    """Update a comment

    Per Codex:
    - Author-only edit (or admin override)
    - Optimistic concurrency via ETag (If-Match header)
    - Sanitize content
    """
    user = get_current_user(request)

    # Get comment
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment or comment.deleted_at:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Check permission: author only (or admin override)
    is_author = comment.author_email == user['user_id']
    is_admin = user['role'] == 'admin'

    if not (is_author or is_admin):
        raise HTTPException(status_code=403, detail="Only comment author can edit")

    # Optimistic concurrency check (ETag)
    if if_match:
        current_etag = comment.updated_at.isoformat()
        if if_match != current_etag:
            raise HTTPException(
                status_code=412,
                detail="Comment was modified by another user (ETag mismatch)"
            )

    # Sanitize and validate content
    content = sanitize_content(data.content)
    if len(content) > 10000:
        raise HTTPException(status_code=400, detail="Content exceeds 10,000 characters")

    # Update comment
    comment.content = content
    comment.mentions = json.dumps(data.mentions) if data.mentions else None
    comment.updated_at = datetime.utcnow()  # Explicit update (onupdate should handle this)

    db.commit()
    db.refresh(comment)

    logger.info(f"Comment updated: id={comment_id}, author={user['user_id']}")

    return build_comment_response(comment, db)


@router.delete("/{comment_id}")
def delete_comment(
    comment_id: int,
    request: Request,
    hard: bool = False,
    db: Session = Depends(get_db_session)
):
    """Delete a comment (soft delete by default)

    Per Codex:
    - Author-only delete (or admin override)
    - Soft delete by default (set deleted_at)
    - Hard delete with ?hard=true (admin only, cascades to children)
    """
    user = get_current_user(request)

    # Get comment
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Check permission
    is_author = comment.author_email == user['user_id']
    is_admin = user['role'] == 'admin'

    if not (is_author or is_admin):
        raise HTTPException(status_code=403, detail="Only comment author can delete")

    if hard:
        # Hard delete (admin only, cascades)
        if not is_admin:
            raise HTTPException(status_code=403, detail="Hard delete requires admin role")

        # Recursively delete all descendants (Codex fix)
        def delete_recursive(parent_id: int):
            children = db.query(Comment).filter(Comment.parent_id == parent_id).all()
            for child in children:
                delete_recursive(child.id)
                db.delete(child)

        delete_recursive(comment_id)
        db.delete(comment)
        logger.info(f"Comment hard deleted (recursive): id={comment_id}, author={user['user_id']}")
    else:
        # Soft delete
        comment.deleted_at = datetime.utcnow()
        logger.info(f"Comment soft deleted: id={comment_id}, author={user['user_id']}")

    db.commit()

    return {"message": "Comment deleted", "comment_id": comment_id, "hard": hard}
