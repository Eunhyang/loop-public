"""
Audit Log Router

Entity 생성/수정/삭제 감사 로그
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
from fastapi import APIRouter

from ..utils.vault_utils import get_vault_dir

router = APIRouter(prefix="/api/audit", tags=["audit"])

# 감사 로그 파일 경로
VAULT_DIR = get_vault_dir()
AUDIT_LOG_FILE = VAULT_DIR / "_build" / "audit.log"


def log_entity_action(
    action: str,
    entity_type: str,
    entity_id: str,
    entity_name: str,
    details: Optional[Dict[str, Any]] = None,
    user: str = "api"
) -> None:
    """
    Entity 액션 로깅

    Args:
        action: create | update | delete | autofill
        entity_type: Project | Task | Hypothesis
        entity_id: 엔티티 ID
        entity_name: 엔티티 이름
        details: 추가 정보 (변경된 필드, LLM 제안 등)
        user: 액션 수행자 (api, skill, n8n, dashboard)
    """
    AUDIT_LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "entity_name": entity_name,
        "user": user,
        "details": details or {}
    }

    with open(AUDIT_LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")


@router.get("")
def get_audit_logs(
    entity_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 100
):
    """
    감사 로그 조회

    Args:
        entity_id: 특정 엔티티 로그만 조회
        action: 특정 액션만 조회 (create, update, delete, autofill)
        limit: 최대 반환 개수 (최신순)
    """
    if not AUDIT_LOG_FILE.exists():
        return {"logs": [], "total": 0}

    logs = []
    with open(AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)

                # 필터링
                if entity_id and entry.get("entity_id") != entity_id:
                    continue
                if action and entry.get("action") != action:
                    continue

                logs.append(entry)
            except json.JSONDecodeError:
                continue

    # 최신순 정렬
    logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

    return {
        "logs": logs[:limit],
        "total": len(logs)
    }


@router.get("/entity/{entity_id}")
def get_entity_history(entity_id: str):
    """특정 엔티티의 전체 히스토리"""
    result = get_audit_logs(entity_id=entity_id, limit=1000)
    return {
        "entity_id": entity_id,
        "history": result["logs"],
        "total_actions": result["total"]
    }
