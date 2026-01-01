"""
Build Router - Impact 스코어 빌드 API

tsk-n8n-12: Evidence 승인 후 Impact 점수 자동 갱신

Endpoints:
- POST /api/build/impact: build_impact.py 스크립트 실행

Codex 피드백 반영:
- BackgroundTasks 사용하여 비동기 실행 (HTTP 타임아웃 방지)
- Auth는 기존 미들웨어가 /api/* 경로에 자동 적용
- Single-flight lock으로 동시 빌드 방지
- 빌드 상태를 파일에 영속화
"""

import json
import uuid
import subprocess
import threading
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field

from ..utils.vault_utils import get_vault_dir

router = APIRouter(prefix="/api/build", tags=["build"])

# Vault 경로
VAULT_DIR = get_vault_dir()
IMPACT_PATH = VAULT_DIR / "_build" / "impact.json"
BUILD_LOG_DIR = VAULT_DIR / "_build" / "build_logs"

# Codex 피드백: Single-flight lock으로 동시 빌드 방지
_build_lock = threading.Lock()
_current_build_id: Optional[str] = None


# ============================================
# Pydantic Models
# ============================================

class BuildImpactRequest(BaseModel):
    """Impact 빌드 요청"""
    async_mode: bool = Field(default=True, description="비동기 실행 여부 (기본 True)")
    force: bool = Field(default=False, description="강제 재빌드")


class BuildImpactResponse(BaseModel):
    """Impact 빌드 응답"""
    ok: bool
    build_id: str
    started_at: str
    ended_at: Optional[str] = None
    impact_path: str = ""
    summary: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None
    status: str = Field(default="completed", description="completed | running | failed")


# ============================================
# Build State (In-Memory)
# ============================================

# 현재 진행 중인 빌드 상태 (간단한 in-memory 저장)
_build_status: Dict[str, Dict[str, Any]] = {}


def _run_build_impact(build_id: str, vault_path: Path) -> None:
    """
    build_impact.py 스크립트 실행 (백그라운드)

    Args:
        build_id: 빌드 고유 ID
        vault_path: Vault 루트 경로

    Codex 피드백 반영:
    - Single-flight lock으로 동시 빌드 방지
    - 빌드 완료 후 lock 해제
    """
    global _build_status, _current_build_id

    _build_status[build_id]["status"] = "running"

    try:
        # subprocess로 build_impact.py 실행
        result = subprocess.run(
            ["python3", str(vault_path / "scripts" / "build_impact.py"), str(vault_path)],
            capture_output=True,
            text=True,
            timeout=300,  # 5분 타임아웃
            cwd=str(vault_path)
        )

        ended_at = datetime.now().isoformat()

        if result.returncode == 0:
            # 성공: impact.json에서 summary 읽기
            summary = {}
            if IMPACT_PATH.exists():
                try:
                    with open(IMPACT_PATH, "r", encoding="utf-8") as f:
                        impact_data = json.load(f)
                        summary = impact_data.get("summary", {})
                except Exception:
                    pass

            _build_status[build_id].update({
                "status": "completed",
                "ended_at": ended_at,
                "ok": True,
                "summary": summary,
                "impact_path": "_build/impact.json"
            })
        else:
            # 실패
            _build_status[build_id].update({
                "status": "failed",
                "ended_at": ended_at,
                "ok": False,
                "error": result.stderr or "Build failed with no error message"
            })

    except subprocess.TimeoutExpired:
        _build_status[build_id].update({
            "status": "failed",
            "ended_at": datetime.now().isoformat(),
            "ok": False,
            "error": "Build timed out after 5 minutes"
        })
    except Exception as e:
        _build_status[build_id].update({
            "status": "failed",
            "ended_at": datetime.now().isoformat(),
            "ok": False,
            "error": str(e)
        })
    finally:
        # Codex 피드백: 빌드 완료 후 lock 해제
        global _current_build_id
        with _build_lock:
            _current_build_id = None

    # 빌드 로그 저장
    _save_build_log(build_id)


def _save_build_log(build_id: str) -> None:
    """빌드 로그를 파일로 저장"""
    if build_id not in _build_status:
        return

    BUILD_LOG_DIR.mkdir(parents=True, exist_ok=True)

    log_file = BUILD_LOG_DIR / f"{build_id}.json"
    with open(log_file, "w", encoding="utf-8") as f:
        json.dump(_build_status[build_id], f, ensure_ascii=False, indent=2)


# ============================================
# Endpoints
# ============================================

@router.post("/impact", response_model=BuildImpactResponse)
async def build_impact(
    request: BuildImpactRequest,
    background_tasks: BackgroundTasks
):
    """
    Impact 점수 빌드 실행

    n8n 워크플로우에서 Evidence 승인 후 호출하여
    build_impact.py 스크립트를 실행합니다.

    Modes:
    - async_mode=True (기본): 백그라운드 실행, 즉시 build_id 반환
    - async_mode=False: 동기 실행, 완료 후 결과 반환 (타임아웃 주의)

    Auth:
    - 기존 API 인증 미들웨어가 /api/* 경로에 자동 적용
    - Bearer token 필요

    Codex 피드백 반영:
    - Single-flight lock: 이미 빌드 진행 중이면 409 반환
    """
    global _current_build_id

    # Codex 피드백: Single-flight lock 체크
    with _build_lock:
        if _current_build_id is not None:
            # 이미 빌드 진행 중
            return BuildImpactResponse(
                ok=False,
                build_id=_current_build_id,
                started_at=_build_status.get(_current_build_id, {}).get("started_at", ""),
                status="running",
                error=f"Build already in progress: {_current_build_id}"
            )

        build_id = f"build-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:6]}"
        started_at = datetime.now().isoformat()
        _current_build_id = build_id

    # 빌드 상태 초기화
    _build_status[build_id] = {
        "build_id": build_id,
        "started_at": started_at,
        "status": "pending",
        "ok": None,
        "impact_path": "",
        "summary": {},
        "error": None
    }

    if request.async_mode:
        # 비동기 모드: 백그라운드에서 실행
        background_tasks.add_task(_run_build_impact, build_id, VAULT_DIR)

        return BuildImpactResponse(
            ok=True,
            build_id=build_id,
            started_at=started_at,
            status="running",
            impact_path=""
        )
    else:
        # 동기 모드: 직접 실행 (타임아웃 위험)
        _run_build_impact(build_id, VAULT_DIR)

        status = _build_status.get(build_id, {})
        return BuildImpactResponse(
            ok=status.get("ok", False),
            build_id=build_id,
            started_at=started_at,
            ended_at=status.get("ended_at"),
            status=status.get("status", "unknown"),
            impact_path=status.get("impact_path", ""),
            summary=status.get("summary", {}),
            error=status.get("error")
        )


@router.get("/impact/status/{build_id}")
def get_build_status(build_id: str):
    """
    빌드 상태 조회

    비동기 모드로 시작된 빌드의 진행 상황을 확인합니다.
    """
    # 먼저 메모리에서 찾기
    if build_id in _build_status:
        return _build_status[build_id]

    # 파일에서 찾기
    log_file = BUILD_LOG_DIR / f"{build_id}.json"
    if log_file.exists():
        with open(log_file, "r", encoding="utf-8") as f:
            return json.load(f)

    return {"error": f"Build not found: {build_id}"}


@router.get("/impact/latest")
def get_latest_impact():
    """
    최신 Impact 데이터 조회

    _build/impact.json의 내용을 반환합니다.
    """
    if not IMPACT_PATH.exists():
        return {"error": "impact.json not found. Run POST /api/build/impact first."}

    try:
        with open(IMPACT_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return {
                "ok": True,
                "generated": data.get("generated"),
                "model_version": data.get("model_version"),
                "summary": data.get("summary", {}),
                "project_count": len(data.get("projects", [])),
                "condition_count": len(data.get("conditions", {})),
                "track_count": len(data.get("tracks", {}))
            }
    except Exception as e:
        return {"error": f"Failed to read impact.json: {str(e)}"}
