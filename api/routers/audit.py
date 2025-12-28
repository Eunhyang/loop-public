"""
Audit Log Router

LOOP_PHILOSOPHY 8.2:
- Entity 생성/수정/삭제 감사 로그 (audit.log)
- 승인/거부 결정 로그 (decision_log.jsonl)
- LLM 실행 기록 (run_log/)
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Query

from ..utils.vault_utils import get_vault_dir
from ..utils.run_logger import get_run_log, list_run_logs, delete_old_run_logs
from ..services.decision_logger import (
    get_decisions,
    get_decision_by_id,
    get_entity_decision_history
)

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


# ============================================
# Decision Log Endpoints (LOOP_PHILOSOPHY 8.2)
# ============================================

@router.get("/decisions")
def list_decisions(
    entity_id: Optional[str] = Query(None, description="특정 엔티티 필터"),
    decision: Optional[str] = Query(None, description="approve | reject 필터"),
    user: Optional[str] = Query(None, description="특정 사용자 필터"),
    limit: int = Query(100, le=1000, description="최대 반환 개수")
):
    """
    승인/거부 결정 로그 조회 (decision_log.jsonl)

    Query Parameters:
        entity_id: 특정 엔티티 필터
        decision: approve | reject 필터
        user: 특정 사용자 필터
        limit: 최대 반환 개수 (최신순)
    """
    decisions = get_decisions(
        entity_id=entity_id,
        decision=decision,
        user=user,
        limit=limit
    )

    return {
        "decisions": decisions,
        "count": len(decisions)
    }


@router.get("/decisions/{decision_id}")
def get_decision(decision_id: str):
    """특정 결정 조회"""
    decision = get_decision_by_id(decision_id)
    if not decision:
        return {"error": f"Decision not found: {decision_id}"}
    return {"decision": decision}


@router.get("/decisions/entity/{entity_id}")
def get_entity_decisions(entity_id: str):
    """
    특정 엔티티의 결정 히스토리 요약

    Returns:
        entity_id, total_decisions, approved_count, rejected_count, decisions
    """
    return get_entity_decision_history(entity_id)


# ============================================
# Run Log Endpoints (LOOP_PHILOSOPHY 8.2)
# ============================================

@router.get("/runs")
def list_runs(
    entity_id: Optional[str] = Query(None, description="특정 엔티티 필터"),
    provider: Optional[str] = Query(None, description="anthropic | openai 필터"),
    limit: int = Query(50, le=500, description="최대 반환 개수")
):
    """
    LLM 실행 기록 목록 조회 (run_log/)

    Query Parameters:
        entity_id: 특정 엔티티 필터
        provider: LLM provider 필터
        limit: 최대 반환 개수 (최신순)
    """
    runs = list_run_logs(
        limit=limit,
        entity_id=entity_id,
        provider=provider
    )

    return {
        "runs": runs,
        "count": len(runs)
    }


@router.get("/runs/{run_id}")
def get_run(run_id: str):
    """
    특정 LLM 실행 기록 상세 조회

    전체 프롬프트, 응답, 토큰 사용량 등 포함
    """
    run = get_run_log(run_id)
    if not run:
        return {"error": f"Run not found: {run_id}"}
    return {"run": run}


@router.delete("/runs/cleanup")
def cleanup_old_runs(
    days: int = Query(30, ge=1, le=365, description="보관 기간 (일)")
):
    """
    오래된 LLM 실행 기록 삭제

    Args:
        days: 보관 기간 (기본 30일)

    Returns:
        삭제된 파일 수
    """
    deleted = delete_old_run_logs(days=days)
    return {
        "message": f"Deleted {deleted} old run logs",
        "deleted_count": deleted,
        "retention_days": days
    }
