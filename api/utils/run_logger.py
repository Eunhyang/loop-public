"""
Run Logger - LLM 실행 기록

LOOP_PHILOSOPHY 8.2:
"audit/run 로그 (재현 가능한 디버깅)"

이 모듈은 LLM 호출을 _build/run_log/{run_id}.json에 기록합니다.
- 재현 가능: 같은 입력으로 같은 출력을 검증 가능
- 디버깅: LLM 응답 문제 발생 시 원인 추적
- 감사: 어떤 프롬프트로 어떤 결과가 나왔는지 추적

Usage:
    from api.utils.run_logger import create_run_log, get_run_log, generate_run_id

    # LLM 호출 전 run_id 생성
    run_id = generate_run_id()

    # LLM 호출 후 기록
    log_path = create_run_log(
        run_id=run_id,
        prompt="...",
        system_prompt="...",
        response={"content": {...}},
        provider="anthropic",
        model="claude-sonnet-4-20250514",
        entity_context={"entity_id": "prj-001", "entity_type": "Project"}
    )

    # 조회
    log = get_run_log(run_id)
"""

import json
import random
import string
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List

from .vault_utils import get_vault_dir

# 로그 디렉토리 경로
VAULT_DIR = get_vault_dir()
RUN_LOG_DIR = VAULT_DIR / "_build" / "run_log"


def generate_run_id() -> str:
    """
    고유 실행 ID 생성

    Format: run-YYYYMMDD-HHMMSS-xxxxxx
    """
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"run-{timestamp}-{suffix}"


def create_run_log(
    run_id: str,
    prompt: str,
    system_prompt: str,
    response: Dict[str, Any],
    provider: str,
    model: str,
    entity_context: Optional[Dict[str, Any]] = None,
    token_usage: Optional[Dict[str, int]] = None,
    duration_ms: Optional[int] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Path:
    """
    LLM 실행 기록 저장

    Args:
        run_id: 고유 실행 ID (generate_run_id()로 생성)
        prompt: 사용자 프롬프트
        system_prompt: 시스템 프롬프트
        response: LLM 응답 (전체 또는 요약)
        provider: LLM 제공자 (예: "anthropic", "openai")
        model: 모델명 (예: "claude-sonnet-4-20250514")
        entity_context: 관련 엔티티 정보 (예: {"entity_id": "prj-001", "entity_type": "Project"})
        token_usage: 토큰 사용량 (예: {"input": 500, "output": 200})
        duration_ms: 실행 시간 (밀리초)
        metadata: 추가 메타데이터

    Returns:
        생성된 로그 파일 경로
    """
    # 디렉토리 생성
    RUN_LOG_DIR.mkdir(parents=True, exist_ok=True)

    log_entry = {
        "run_id": run_id,
        "timestamp": datetime.now().isoformat(),
        "provider": provider,
        "model": model,
        "prompt": prompt,
        "system_prompt": system_prompt,
        "response": response,
    }

    # 선택적 필드
    if entity_context:
        log_entry["entity_context"] = entity_context
    if token_usage:
        log_entry["token_usage"] = token_usage
    if duration_ms is not None:
        log_entry["duration_ms"] = duration_ms
    if metadata:
        log_entry["metadata"] = metadata

    # 파일 저장
    log_file = RUN_LOG_DIR / f"{run_id}.json"
    with open(log_file, "w", encoding="utf-8") as f:
        json.dump(log_entry, f, ensure_ascii=False, indent=2)

    return log_file


def get_run_log(run_id: str) -> Optional[Dict[str, Any]]:
    """
    특정 run_id의 실행 기록 조회

    Args:
        run_id: 실행 ID

    Returns:
        실행 기록 또는 None
    """
    log_file = RUN_LOG_DIR / f"{run_id}.json"

    if not log_file.exists():
        return None

    with open(log_file, "r", encoding="utf-8") as f:
        return json.load(f)


def list_run_logs(
    limit: int = 50,
    entity_id: Optional[str] = None,
    provider: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    실행 기록 목록 조회

    Args:
        limit: 최대 반환 개수
        entity_id: 특정 엔티티 필터
        provider: 특정 provider 필터

    Returns:
        실행 기록 요약 리스트 (최신순)
    """
    if not RUN_LOG_DIR.exists():
        return []

    logs = []
    for log_file in RUN_LOG_DIR.glob("*.json"):
        try:
            with open(log_file, "r", encoding="utf-8") as f:
                entry = json.load(f)

            # 필터링
            if entity_id:
                ctx = entry.get("entity_context", {})
                if ctx.get("entity_id") != entity_id:
                    continue
            if provider and entry.get("provider") != provider:
                continue

            # 요약만 반환 (전체 프롬프트/응답 제외)
            logs.append({
                "run_id": entry.get("run_id"),
                "timestamp": entry.get("timestamp"),
                "provider": entry.get("provider"),
                "model": entry.get("model"),
                "entity_context": entry.get("entity_context"),
                "token_usage": entry.get("token_usage"),
                "duration_ms": entry.get("duration_ms"),
            })
        except (json.JSONDecodeError, IOError):
            continue

    # 최신순 정렬
    logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

    return logs[:limit]


def delete_old_run_logs(days: int = 30) -> int:
    """
    오래된 실행 기록 삭제

    Args:
        days: 보관 기간 (일)

    Returns:
        삭제된 파일 수
    """
    if not RUN_LOG_DIR.exists():
        return 0

    from datetime import timedelta
    cutoff = datetime.now() - timedelta(days=days)
    deleted = 0

    for log_file in RUN_LOG_DIR.glob("*.json"):
        try:
            with open(log_file, "r", encoding="utf-8") as f:
                entry = json.load(f)

            timestamp_str = entry.get("timestamp", "")
            if timestamp_str:
                # ISO format 파싱
                timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
                if timestamp.replace(tzinfo=None) < cutoff:
                    log_file.unlink()
                    deleted += 1
        except (json.JSONDecodeError, IOError, ValueError):
            continue

    return deleted
