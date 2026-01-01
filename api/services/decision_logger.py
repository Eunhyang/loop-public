"""
Decision Logger - Append-only 승인/거부 로그

LOOP_PHILOSOPHY 8.2:
"AI가 점점 더 많은 작업을 하게 될수록,
'누가 무엇을 승인했는지'는 제품·조직의 안전장치가 된다."

이 모듈은 decision_log.jsonl에 승인/거부 결정만 기록합니다.
- append-only: 기존 로그는 수정/삭제 불가
- 감사 가능: 누가 무엇을 언제 왜 승인/거부했는지 추적
- 재현 가능: 3개월 뒤에도 같은 결정을 같은 근거로 설명 가능

Usage:
    from api.services.decision_logger import log_decision, get_decisions

    # 승인 기록
    decision_id = log_decision(
        decision="approve",
        entity_id="prj-001",
        entity_type="Project",
        review_id="review-xxx",
        user="김은향",
        reason="Impact 수치 합리적",
        applied_fields={"expected_impact": {...}}
    )

    # 조회
    decisions = get_decisions(entity_id="prj-001")
"""

import json
import random
import string
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List

from ..utils.vault_utils import get_vault_dir

# 로그 파일 경로
VAULT_DIR = get_vault_dir()
DECISION_LOG_FILE = VAULT_DIR / "_build" / "decision_log.jsonl"


def generate_decision_id() -> str:
    """
    고유 결정 ID 생성

    Format: dec-YYYYMMDD-HHMMSS-xxxx
    """
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return f"dec-{timestamp}-{suffix}"


def log_decision(
    decision: str,
    entity_id: str,
    entity_type: str,
    review_id: str,
    user: str,
    reason: Optional[str] = None,
    applied_fields: Optional[Dict[str, Any]] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> str:
    """
    decision_log.jsonl에 결정 기록 (append-only)

    Args:
        decision: "approve" | "reject"
        entity_id: 대상 엔티티 ID (예: "prj-001")
        entity_type: 엔티티 유형 (예: "Project", "Task")
        review_id: pending review ID (예: "review-xxx")
        user: 결정자 (예: "김은향", "api", "n8n")
        reason: 결정 사유 (거부 시 필수, 승인 시 선택)
        applied_fields: 승인 시 적용된 필드값
        metadata: 추가 메타데이터

    Returns:
        decision_id: 생성된 고유 결정 ID

    Raises:
        ValueError: decision이 approve/reject가 아닐 때
    """
    if decision not in ("approve", "reject"):
        raise ValueError(f"Invalid decision: {decision}. Must be 'approve' or 'reject'")

    # 디렉토리 생성
    DECISION_LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

    decision_id = generate_decision_id()

    log_entry = {
        "decision_id": decision_id,
        "timestamp": datetime.now().isoformat(),
        "decision": decision,
        "entity_id": entity_id,
        "entity_type": entity_type,
        "review_id": review_id,
        "user": user,
        "reason": reason,
    }

    # 승인 시에만 applied_fields 포함
    if decision == "approve" and applied_fields:
        log_entry["applied_fields"] = applied_fields

    # 메타데이터 추가
    if metadata:
        log_entry["metadata"] = metadata

    # Append-only 쓰기
    with open(DECISION_LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")

    return decision_id


def log_pending_created(
    entity_id: str,
    entity_type: str,
    review_id: str,
    actor: str,
    run_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> str:
    """
    pending review 생성 이벤트를 decision_log.jsonl에 기록

    이 함수는 LLM이 pending review를 생성했을 때 호출됩니다.
    decision="pending_created"로 기록되며, 이후 approve/reject 시
    같은 review_id로 연결됩니다.

    Args:
        entity_id: 대상 엔티티 ID (예: "prj-001")
        entity_type: 엔티티 유형 (예: "Project", "Task")
        review_id: pending review ID (예: "review-xxx")
        actor: 생성자 (예: "n8n", "api", "claude")
        run_id: LLM 실행 ID (run_log 연결용)
        metadata: 추가 메타데이터

    Returns:
        decision_id: 생성된 고유 결정 ID
    """
    # 디렉토리 생성 (기존 log_decision과 동일한 패턴)
    DECISION_LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

    decision_id = generate_decision_id()

    log_entry = {
        "decision_id": decision_id,
        "timestamp": datetime.now().isoformat(),
        "decision": "pending_created",
        "entity_id": entity_id,
        "entity_type": entity_type,
        "review_id": review_id,
        "user": actor,  # 기존 user 필드 사용 (Codex 피드백 반영)
        "run_id": run_id,
    }

    # 메타데이터 추가
    if metadata:
        log_entry["metadata"] = metadata

    # Append-only 쓰기
    with open(DECISION_LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")

    return decision_id


def get_decisions(
    entity_id: Optional[str] = None,
    entity_type: Optional[str] = None,
    decision: Optional[str] = None,
    user: Optional[str] = None,
    after: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """
    결정 로그 조회

    Args:
        entity_id: 특정 엔티티 필터
        entity_type: 엔티티 유형 필터 (tsk-n8n-12: Evidence 필터링용)
        decision: "approve" | "reject" | "pending_created" 필터
        user: 특정 사용자 필터
        after: ISO timestamp - 이 시간 이후의 결정만 반환 (cursor 기반)
               Codex 피드백: >= 사용하여 동일 timestamp 포함
        limit: 최대 반환 개수
        offset: 건너뛸 개수

    Returns:
        결정 로그 리스트 (최신순)

    Note (tsk-n8n-12):
        n8n Workflow C에서 Evidence approve 폴링 시:
        GET /api/audit/decisions?decision=approve&entity_type=Evidence&after={cursor}
    """
    if not DECISION_LOG_FILE.exists():
        return []

    logs = []
    with open(DECISION_LOG_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)

                # 필터링
                if entity_id and entry.get("entity_id") != entity_id:
                    continue
                if entity_type and entry.get("entity_type") != entity_type:
                    continue
                if decision and entry.get("decision") != decision:
                    continue
                if user and entry.get("user") != user:
                    continue

                # after 필터 (cursor 기반 polling)
                # Codex 피드백: > 사용 (같은 timestamp의 중복 방지는 decision_id로)
                if after:
                    entry_timestamp = entry.get("timestamp", "")
                    if entry_timestamp <= after:
                        continue

                logs.append(entry)
            except json.JSONDecodeError:
                continue

    # 최신순 정렬
    logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

    # Pagination
    return logs[offset:offset + limit]


def get_decision_by_id(decision_id: str) -> Optional[Dict[str, Any]]:
    """
    특정 decision_id로 결정 조회

    Args:
        decision_id: 결정 ID (예: "dec-20251228-103000-xxxx")

    Returns:
        결정 로그 또는 None
    """
    if not DECISION_LOG_FILE.exists():
        return None

    with open(DECISION_LOG_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                if entry.get("decision_id") == decision_id:
                    return entry
            except json.JSONDecodeError:
                continue

    return None


def get_entity_decision_history(entity_id: str) -> Dict[str, Any]:
    """
    특정 엔티티의 결정 히스토리 요약

    Args:
        entity_id: 엔티티 ID

    Returns:
        {
            "entity_id": "prj-001",
            "total_decisions": 5,
            "approved_count": 3,
            "rejected_count": 2,
            "decisions": [...]
        }
    """
    decisions = get_decisions(entity_id=entity_id, limit=1000)

    approved = [d for d in decisions if d.get("decision") == "approve"]
    rejected = [d for d in decisions if d.get("decision") == "reject"]

    return {
        "entity_id": entity_id,
        "total_decisions": len(decisions),
        "approved_count": len(approved),
        "rejected_count": len(rejected),
        "decisions": decisions
    }
