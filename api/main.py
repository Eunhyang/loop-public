"""
LOOP Dashboard API Server

Task/Project를 웹 UI에서 생성/수정/삭제할 수 있도록 REST API 제공
루트 경로(/)에서 칸반 보드 UI 제공

Usage:
    # Development
    uvicorn api.main:app --reload --host 0.0.0.0 --port 8081

    # Production
    uvicorn api.main:app --host 0.0.0.0 --port 8081 --workers 2

Endpoints:
    GET  /                       - 칸반 보드 UI
    GET  /api/tasks              - Task 목록
    POST /api/tasks              - Task 생성
    PUT  /api/tasks/{task_id}    - Task 수정
    DELETE /api/tasks/{task_id}  - Task 삭제

    GET  /api/projects           - Project 목록
    POST /api/projects           - Project 생성

    GET  /api/members            - 멤버 목록
    GET  /api/info               - API 정보
    GET  /health                 - Health check
"""

from pathlib import Path
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .routers import tasks, projects, tracks, hypotheses, conditions
from .utils.vault_utils import load_members, get_vault_dir
from .constants import get_all_constants

# ============================================
# FastAPI App
# ============================================
app = FastAPI(
    title="LOOP Dashboard API",
    version="1.0.0",
    description="REST API for LOOP Obsidian Vault Task/Project Management"
)

# CORS 설정 (웹 브라우저에서 접근 가능하도록)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만 허용 권장
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers 등록
app.include_router(tasks.router)
app.include_router(projects.router)
app.include_router(tracks.router)
app.include_router(hypotheses.router)
app.include_router(conditions.router)

# Vault 경로 (환경에 따라 자동 감지)
VAULT_DIR = get_vault_dir()
DASHBOARD_DIR = VAULT_DIR / "_dashboard"

# 정적 파일 서빙 (CSS, JS)
if DASHBOARD_DIR.exists():
    app.mount("/css", StaticFiles(directory=DASHBOARD_DIR / "css"), name="css")
    app.mount("/js", StaticFiles(directory=DASHBOARD_DIR / "js"), name="js")


# ============================================
# Root Endpoints
# ============================================
@app.get("/")
def root():
    """칸반 보드 UI 반환"""
    dashboard_path = VAULT_DIR / "_dashboard" / "index.html"
    if dashboard_path.exists():
        return FileResponse(dashboard_path, media_type="text/html")
    # 대시보드 파일이 없으면 에러 메시지
    return {"error": "Dashboard not found", "hint": "Run build_dashboard.py first"}


@app.get("/api/info")
def api_info():
    """API 정보"""
    return {
        "name": "LOOP Dashboard API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "dashboard": "/",
            "tasks": "/api/tasks",
            "projects": "/api/projects",
            "members": "/api/members",
            "health": "/health"
        }
    }


@app.get("/api/members")
def get_members():
    """멤버 목록 조회"""
    return {"members": load_members(VAULT_DIR)}


@app.get("/api/constants")
def get_constants():
    """상수 목록 조회 (Task 상태, Priority 등)"""
    return get_all_constants()


@app.get("/health")
def health_check():
    """헬스 체크"""
    return {
        "status": "healthy",
        "vault_exists": VAULT_DIR.exists(),
        "projects_count": len(list((VAULT_DIR / "50_Projects/2025").glob("P*"))),
        "timestamp": datetime.now().isoformat()
    }
