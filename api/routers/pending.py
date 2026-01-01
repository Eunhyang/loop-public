"""
Pending Review API Router

n8n에서 생성한 pending review 관리 엔드포인트
- 스키마 불일치 엔티티의 제안값 저장
- Dashboard에서 승인/거부 처리
- 승인/거부 시 decision_log.jsonl에 기록 (LOOP_PHILOSOPHY 8.2)
"""

import json
import re
import yaml
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from ..utils.vault_utils import get_vault_dir
from ..services.decision_logger import log_decision

router = APIRouter(prefix="/api/pending", tags=["pending"])

# Vault 경로
VAULT_DIR = get_vault_dir()
PENDING_FILE = VAULT_DIR / "_build" / "pending_reviews.json"


# ============================================
# Pydantic Models
# ============================================

class PendingCreate(BaseModel):
    """n8n에서 새 pending 생성 시 요청 모델"""
    entity_id: str
    entity_type: str  # Task, Project
    entity_name: str
    suggested_fields: Dict[str, Any]
    reasoning: Dict[str, str]


class PendingApprove(BaseModel):
    """승인 시 요청 모델"""
    modified_fields: Optional[Dict[str, Any]] = None
    reason: Optional[str] = Field(None, description="승인 사유 (선택)")
    user: str = Field(default="dashboard", description="승인자")


class PendingReject(BaseModel):
    """거부 시 요청 모델"""
    reason: str = Field(..., description="거부 사유 (필수)")
    user: str = Field(default="dashboard", description="거부자")


# ============================================
# Helper Functions
# ============================================

def load_pending() -> Dict:
    """pending_reviews.json 로드 (에러 발생 시 빈 데이터 반환)"""
    default_data = {"reviews": [], "metadata": {"version": "1.0.0"}}

    if not PENDING_FILE.exists():
        return default_data

    try:
        with open(PENDING_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Validate structure
            if not isinstance(data, dict) or "reviews" not in data:
                return default_data
            return data
    except (json.JSONDecodeError, IOError) as e:
        # Log error but don't crash - return empty data
        print(f"Warning: Failed to load pending_reviews.json: {e}")
        return default_data


def save_pending(data: Dict):
    """pending_reviews.json 저장"""
    PENDING_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(PENDING_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def generate_review_id() -> str:
    """유니크 review ID 생성 (timestamp + random suffix for collision avoidance)"""
    import random
    import string
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return f"review-{timestamp}-{suffix}"


def find_entity_file(entity_id: str, entity_type: str) -> Optional[Path]:
    """엔티티 ID로 파일 경로 찾기 (파일명에 entity_id가 없을 수 있음)"""
    if entity_type == "Task":
        pattern = "50_Projects/**/Tasks/*.md"
    elif entity_type == "Project":
        pattern = "50_Projects/**/Project_정의.md"
    else:
        return None

    for path in VAULT_DIR.glob(pattern):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read(2000)  # frontmatter만 읽으면 충분
                if f"entity_id: {entity_id}" in content or f'entity_id: "{entity_id}"' in content:
                    return path
        except (IOError, UnicodeDecodeError):
            continue
    return None


def update_entity_frontmatter(file_path: Path, fields: Dict[str, Any]) -> bool:
    """엔티티 파일의 frontmatter 업데이트"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Frontmatter 파싱
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', content, re.DOTALL)
    if not match:
        return False

    frontmatter = yaml.safe_load(match.group(1))
    body = match.group(2)

    # 필드 업데이트
    for key, value in fields.items():
        frontmatter[key] = value

    # updated 필드 갱신
    frontmatter['updated'] = datetime.now().strftime("%Y-%m-%d")

    # 파일 저장
    new_content = "---\n" + yaml.dump(frontmatter, allow_unicode=True, default_flow_style=False, sort_keys=False) + "---\n" + body

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    return True


# ============================================
# API Endpoints
# ============================================

@router.get("")
def get_pending_reviews(status: Optional[str] = None):
    """
    Pending review 목록 조회

    Query Parameters:
        status: pending, approved, rejected 필터
    """
    data = load_pending()
    reviews = data.get("reviews", [])

    if status:
        reviews = [r for r in reviews if r.get("status") == status]

    return {"reviews": reviews, "count": len(reviews)}


@router.get("/{review_id}")
def get_pending_review(review_id: str):
    """개별 pending review 조회"""
    data = load_pending()

    for review in data.get("reviews", []):
        if review.get("id") == review_id:
            return {"review": review}

    raise HTTPException(status_code=404, detail=f"Review not found: {review_id}")


@router.post("")
def create_pending_review(pending: PendingCreate):
    """
    새 pending review 생성 (n8n에서 호출)

    동일 entity_id에 pending 상태가 있으면 업데이트
    """
    data = load_pending()
    reviews = data.get("reviews", [])

    # 중복 체크 (같은 entity_id + pending 상태)
    existing_idx = None
    for idx, r in enumerate(reviews):
        if r.get("entity_id") == pending.entity_id and r.get("status") == "pending":
            existing_idx = idx
            break

    new_review = {
        "id": generate_review_id(),
        "entity_id": pending.entity_id,
        "entity_type": pending.entity_type,
        "entity_name": pending.entity_name,
        "suggested_fields": pending.suggested_fields,
        "reasoning": pending.reasoning,
        "created_at": datetime.now().isoformat(),
        "status": "pending"
    }

    if existing_idx is not None:
        # 기존 pending 업데이트
        new_review["id"] = reviews[existing_idx]["id"]  # ID 유지
        reviews[existing_idx] = new_review
        action = "updated"
    else:
        # 새로 추가
        reviews.append(new_review)
        action = "created"

    data["reviews"] = reviews
    save_pending(data)

    return {"message": f"Review {action}", "review": new_review}


@router.post("/{review_id}/approve")
def approve_pending_review(review_id: str, approve: Optional[PendingApprove] = None):
    """
    Pending review 승인 → 엔티티 업데이트 + decision_log 기록

    Body (optional):
        modified_fields: 수정된 필드값 (없으면 suggested_fields 그대로 적용)
        reason: 승인 사유
        user: 승인자 (기본값: dashboard)
    """
    data = load_pending()
    reviews = data.get("reviews", [])

    review_idx = None
    review = None
    for idx, r in enumerate(reviews):
        if r.get("id") == review_id:
            review_idx = idx
            review = r
            break

    if review is None:
        raise HTTPException(status_code=404, detail=f"Review not found: {review_id}")

    if review.get("status") != "pending":
        raise HTTPException(status_code=400, detail=f"Review already processed: {review.get('status')}")

    # 적용할 필드 결정
    fields_to_apply = approve.modified_fields if approve and approve.modified_fields else review["suggested_fields"]
    user = approve.user if approve else "dashboard"
    reason = approve.reason if approve else None

    # 엔티티 파일 찾기
    entity_file = find_entity_file(review["entity_id"], review["entity_type"])
    if not entity_file:
        raise HTTPException(status_code=404, detail=f"Entity file not found: {review['entity_id']}")

    # 엔티티 업데이트
    success = update_entity_frontmatter(entity_file, fields_to_apply)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update entity file")

    # decision_log에 승인 기록 (LOOP_PHILOSOPHY 8.2)
    decision_id = log_decision(
        decision="approve",
        entity_id=review["entity_id"],
        entity_type=review["entity_type"],
        review_id=review_id,
        user=user,
        reason=reason,
        applied_fields=fields_to_apply
    )

    # Review 상태 업데이트
    reviews[review_idx]["status"] = "approved"
    reviews[review_idx]["approved_at"] = datetime.now().isoformat()
    reviews[review_idx]["applied_fields"] = fields_to_apply
    reviews[review_idx]["decision_id"] = decision_id  # decision_log 연결

    data["reviews"] = reviews
    save_pending(data)

    return {
        "message": "Review approved and entity updated",
        "entity_id": review["entity_id"],
        "applied_fields": fields_to_apply,
        "decision_id": decision_id
    }


@router.post("/{review_id}/reject")
def reject_pending_review(review_id: str, reject: PendingReject):
    """
    Pending review 거부 + decision_log 기록

    Body (required):
        reason: 거부 사유 (필수)
        user: 거부자 (기본값: dashboard)
    """
    data = load_pending()
    reviews = data.get("reviews", [])

    review_idx = None
    review = None
    for idx, r in enumerate(reviews):
        if r.get("id") == review_id:
            review_idx = idx
            review = r
            break

    if review_idx is None:
        raise HTTPException(status_code=404, detail=f"Review not found: {review_id}")

    if reviews[review_idx].get("status") != "pending":
        raise HTTPException(status_code=400, detail=f"Review already processed")

    # decision_log에 거부 기록 (LOOP_PHILOSOPHY 8.2)
    decision_id = log_decision(
        decision="reject",
        entity_id=review["entity_id"],
        entity_type=review["entity_type"],
        review_id=review_id,
        user=reject.user,
        reason=reject.reason  # 거부 시 사유 필수
    )

    # Review 상태 업데이트
    reviews[review_idx]["status"] = "rejected"
    reviews[review_idx]["rejected_at"] = datetime.now().isoformat()
    reviews[review_idx]["reject_reason"] = reject.reason
    reviews[review_idx]["decision_id"] = decision_id  # decision_log 연결

    data["reviews"] = reviews
    save_pending(data)

    return {
        "message": "Review rejected",
        "review_id": review_id,
        "reason": reject.reason,
        "decision_id": decision_id
    }


@router.delete("/{review_id}")
def delete_pending_review(review_id: str):
    """Pending review 삭제 (완전 제거)"""
    data = load_pending()
    reviews = data.get("reviews", [])

    new_reviews = [r for r in reviews if r.get("id") != review_id]

    if len(new_reviews) == len(reviews):
        raise HTTPException(status_code=404, detail=f"Review not found: {review_id}")

    data["reviews"] = new_reviews
    save_pending(data)

    return {"message": "Review deleted", "review_id": review_id}


# Note: Decision log 조회 엔드포인트는 /api/audit/decisions 에서 제공됨
# (LOOP_PHILOSOPHY 8.2)
