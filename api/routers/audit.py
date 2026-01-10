"""
Audit Log Router

LOOP_PHILOSOPHY 8.2:
- Entity 생성/수정/삭제 감사 로그 (audit.log + audit_log.jsonl)
- 승인/거부 결정 로그 (decision_log.jsonl)
- LLM 실행 기록 (run_log/)

SSOT_CONTRACT v1.2 (tsk-019-14):
- Rule C: Audit log schema expansion with run_id, actor, source, diff
- Dual-write: Old format (audit.log) + New format (audit_log.jsonl)
"""

import json
import uuid
from datetime import datetime, timezone
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
from ..services.notification_service import send_entity_created_notification

router = APIRouter(prefix="/api/audit", tags=["audit"])

# 감사 로그 파일 경로
VAULT_DIR = get_vault_dir()
AUDIT_LOG_FILE = VAULT_DIR / "_build" / "audit.log"  # Legacy format
AUDIT_LOG_JSONL = VAULT_DIR / "_build" / "audit_log.jsonl"  # New format (SSOT Rule C)


def log_entity_action(
    action: str,
    entity_type: str,
    entity_id: str,
    entity_name: str = "",
    details: Optional[Dict[str, Any]] = None,
    user: str = "api",
    # SSOT Rule C: New fields (tsk-019-14)
    run_id: Optional[str] = None,
    actor: Optional[str] = None,
    source: str = "api",
    modified_fields: Optional[List[str]] = None,
    diff: Optional[Dict[str, Dict[str, Any]]] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> None:
    """
    Entity 액션 로깅 (dual-write for backward compatibility)

    Args:
        action: create | update | delete | autofill
        entity_type: Project | Task | Hypothesis
        entity_id: 엔티티 ID
        entity_name: 엔티티 이름
        details: (legacy) 추가 정보
        user: (legacy) 액션 수행자 - backward compat only
        run_id: (new) 실행 추적 ID (uuid-v4, auto-generated if None)
        actor: (new) 주체 (user:김은향 | api:n8n | script:validate)
        source: (new) 원천 (ui | api | script | cli)
        modified_fields: (new) 변경된 필드 목록
        diff: (new) {field: {old, new}}
        metadata: (new) 추가 메타데이터 (ip, user_agent 등)
    """
    AUDIT_LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

    # Generate run_id if not provided
    if not run_id:
        run_id = str(uuid.uuid4())

    # Use actor if provided, fallback to user (backward compat)
    if not actor:
        actor = f"api:{user}" if user != "api" else "api"

    # Legacy format (audit.log) - backward compatibility
    legacy_entry = {
        "timestamp": datetime.now().isoformat(),
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "entity_name": entity_name,
        "user": user,
        "details": details or {}
    }

    with open(AUDIT_LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(legacy_entry, ensure_ascii=False) + "\n")

    # New format (audit_log.jsonl) - SSOT Rule C
    new_entry = {
        "run_id": run_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),  # UTC ISO-8601
        "actor": actor,
        "source": source,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "entity_name": entity_name,
        "action": action,
        "modified_fields": modified_fields or [],
        "diff": diff or {},
        "metadata": metadata or {}
    }

    with open(AUDIT_LOG_JSONL, "a", encoding="utf-8") as f:
        f.write(json.dumps(new_entry, ensure_ascii=False) + "\n")

    # Discord 알림 (생성 시에만)
    if action == "create" and entity_type in ("Task", "Project", "Program", "Comment"):
        extra_fields = {}
        if details:
            if "status" in details:
                extra_fields["Status"] = details["status"]
            if "assignee" in details:
                extra_fields["Assignee"] = details["assignee"]
            if "owner" in details:
                extra_fields["Owner"] = details["owner"]
            # Comment용 target 정보 (tsk-023-1768030620896)
            if "target_type" in details:
                extra_fields["target_type"] = details["target_type"]
            if "target_entity" in details:
                extra_fields["target_entity"] = details["target_entity"]

        send_entity_created_notification(
            entity_type=entity_type,
            entity_id=entity_id,
            entity_name=entity_name,
            actor=actor,
            extra_fields=extra_fields if extra_fields else None
        )


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
    entity_type: Optional[str] = Query(None, description="엔티티 유형 필터 (Evidence, Project 등)"),
    decision: Optional[str] = Query(None, description="approve | reject | pending_created 필터"),
    user: Optional[str] = Query(None, description="특정 사용자 필터"),
    after: Optional[str] = Query(None, description="이 timestamp 이후의 결정만 조회 (ISO format, cursor 기반 polling용)"),
    limit: int = Query(100, le=1000, description="최대 반환 개수")
):
    """
    승인/거부 결정 로그 조회 (decision_log.jsonl)

    Query Parameters:
        entity_id: 특정 엔티티 필터
        entity_type: 엔티티 유형 필터 (tsk-n8n-12: Evidence approve 필터링용)
        decision: approve | reject | pending_created 필터
        user: 특정 사용자 필터
        after: ISO timestamp - 이 시간 이후의 결정만 반환 (cursor 기반 polling)
        limit: 최대 반환 개수 (최신순)

    Response:
        decisions: 결정 목록
        count: 반환된 결정 수
        latest_timestamp: 가장 최신 결정의 timestamp (다음 cursor로 사용)
        latest_decision_id: 가장 최신 결정의 ID (tie-breaker)

    tsk-n8n-12 Usage (n8n Workflow C):
        1. GET /api/audit/decisions?decision=approve&entity_type=Evidence&after={last_cursor}
        2. 새로운 Evidence approve가 있으면 POST /api/build/impact 호출
        3. latest_timestamp + latest_decision_id를 다음 cursor로 저장
    """
    decisions = get_decisions(
        entity_id=entity_id,
        entity_type=entity_type,
        decision=decision,
        user=user,
        after=after,
        limit=limit
    )

    # Codex 피드백: latest_timestamp + latest_decision_id 반환 (tie-breaker)
    latest_timestamp = None
    latest_decision_id = None
    if decisions:
        latest_timestamp = decisions[0].get("timestamp")
        latest_decision_id = decisions[0].get("decision_id")

    return {
        "decisions": decisions,
        "count": len(decisions),
        "latest_timestamp": latest_timestamp,
        "latest_decision_id": latest_decision_id
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
