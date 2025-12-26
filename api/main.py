"""
LOOP Dashboard API Server

Task/Project를 웹 UI에서 생성/수정/삭제할 수 있도록 REST API 제공
인메모리 캐시로 O(1) 조회 성능 제공

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
    GET  /api/cache/stats        - 캐시 통계
    POST /api/cache/reload       - 캐시 리로드
    GET  /api/info               - API 정보
    GET  /health                 - Health check
"""

from pathlib import Path
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from typing import Optional

from .routers import tasks, projects, programs, tracks, hypotheses, conditions, strategy, files, search, pending
from .utils.vault_utils import load_members, get_vault_dir
from .constants import get_all_constants
from .cache import get_cache

# OAuth 2.0 Module (Production)
from .oauth.routes import router as oauth_router, init_oauth
from .oauth.jwks import verify_jwt
from .oauth.security import log_oauth_access

# MCP (Model Context Protocol) 지원
try:
    from fastapi_mcp import FastApiMCP
    MCP_AVAILABLE = True
except ImportError:
    MCP_AVAILABLE = False

# ============================================
# FastAPI App
# ============================================
app = FastAPI(
    title="LOOP Dashboard API",
    version="1.0.0",
    description="REST API for LOOP Obsidian Vault Task/Project Management",
    servers=[
        {"url": "https://kanban.sosilab.synology.me", "description": "Production (NAS)"},
    ]
)

# CORS 설정 (웹 브라우저에서 접근 가능하도록)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만 허용 권장
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Authentication
# ============================================
API_TOKEN = "loop_2024_kanban_secret"

# 인증 제외 경로
PUBLIC_PATHS = [
    "/", "/health", "/docs", "/openapi.json", "/redoc",
    # OAuth endpoints (handled by oauth router)
    "/.well-known/oauth-authorization-server", "/.well-known/jwks.json",
    "/authorize", "/token", "/register", "/oauth/login", "/oauth/logout"
]
PUBLIC_PREFIXES = ["/css", "/js"]  # 정적 파일만 공개

# SSE 스트리밍 경로 (BaseHTTPMiddleware와 SSE 호환성 문제로 별도 처리)
SSE_PREFIXES = ["/mcp"]

# MCP 내부 호출 허용 IP (Docker 컨테이너 내부 루프백)
MCP_TRUSTED_IPS = ["127.0.0.1", "localhost", "::1"]

@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    path = request.url.path

    # SSE 경로 (MCP) - Bearer 토큰 인증 후 우회
    for prefix in SSE_PREFIXES:
        if path.startswith(prefix):
            # MCP 경로도 Bearer 토큰 인증 필요 (Agent Builder 연동용)
            auth_header = request.headers.get("authorization")
            if auth_header and auth_header.startswith("Bearer "):
                bearer_token = auth_header[7:]
                # 1. 정적 API 토큰 확인
                if bearer_token == API_TOKEN:
                    return await call_next(request)
                # 2. JWT 토큰 확인
                jwt_payload = verify_jwt(bearer_token)
                if jwt_payload:
                    return await call_next(request)
            # 인증 없으면 차단
            return JSONResponse(
                status_code=401,
                content={"detail": "Unauthorized", "hint": "Use Bearer token with loop_2024_kanban_secret or JWT"}
            )

    # IP 확인 (X-Forwarded-For가 없으면 직접 연결 IP 사용)
    client_ip = request.headers.get("x-forwarded-for") or request.client.host
    print(f"CLIENT_IP: {client_ip} | PATH: {path}")

    # MCP 내부 호출은 인증 우회 (127.0.0.1에서 오는 요청)
    # Docker가 localhost에만 바인딩되어 있으므로 안전
    if client_ip in MCP_TRUSTED_IPS:
        return await call_next(request)

    # 공개 경로는 인증 제외
    if path in PUBLIC_PATHS:
        return await call_next(request)

    # 공개 prefix는 인증 제외
    for prefix in PUBLIC_PREFIXES:
        if path.startswith(prefix):
            return await call_next(request)

    # /api/* 경로는 토큰 검증
    if path.startswith("/api"):
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            bearer_token = auth_header[7:]  # "Bearer " 제거

            # 1. 정적 API 토큰 확인 (Agent Builder 연동용)
            if bearer_token == API_TOKEN:
                log_oauth_access("api", client_ip, success=True, details="static_token")
                return await call_next(request)

            # 2. OAuth Bearer 토큰 확인 (RS256 JWT)
            jwt_payload = verify_jwt(bearer_token)
            if jwt_payload:
                # JWT 유효 - request.state에 저장 (downstream에서 사용)
                request.state.user_id = jwt_payload.get("sub")
                request.state.role = jwt_payload.get("role", "member")
                request.state.scope = jwt_payload.get("scope", "mcp:read")

                # 로그 기록
                log_oauth_access(
                    "api",
                    client_ip,
                    user_id=jwt_payload.get("sub"),
                    success=True,
                    details=f"scope={jwt_payload.get('scope')}, role={jwt_payload.get('role')}"
                )
                return await call_next(request)

        # 3. x-api-token 헤더 확인 (대시보드용)
        api_token = request.headers.get("x-api-token")
        if api_token == API_TOKEN:
            return await call_next(request)

        # 인증 실패
        log_oauth_access("api", client_ip, success=False, details=f"path={path}")
        return JSONResponse(
            status_code=401,
            content={"detail": "Unauthorized", "hint": "Use Bearer token or x-api-token header"}
        )

    return await call_next(request)

# Routers 등록
app.include_router(tasks.router)
app.include_router(projects.router)
app.include_router(programs.router)
app.include_router(tracks.router)
app.include_router(hypotheses.router)
app.include_router(conditions.router)
app.include_router(strategy.router)
app.include_router(files.router)
app.include_router(search.router)
app.include_router(pending.router)

# OAuth 2.0 Router (Production - RS256 + PKCE + Login)
app.include_router(oauth_router)

# ============================================
# MCP Server (ChatGPT Developer Mode 연동용)
# ============================================
if MCP_AVAILABLE:
    mcp = FastApiMCP(
        app,
        name="LOOP Vault MCP",
        description="LOOP Obsidian Vault의 Task/Project/Strategy 데이터에 접근하는 MCP 서버"
    )
    mcp.mount()  # /mcp 엔드포인트 자동 생성
    print("✅ MCP Server mounted at /mcp")
else:
    print("⚠️ fastapi-mcp not installed. MCP endpoint disabled.")

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
    """헬스 체크 (캐시 기반)"""
    cache = get_cache()
    stats = cache.stats()

    return {
        "status": "healthy",
        "vault_exists": VAULT_DIR.exists(),
        "cache": {
            "tasks": stats["tasks"],
            "projects": stats["projects"],
            "load_time_seconds": stats["load_time_seconds"]
        },
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/cache/stats")
def cache_stats():
    """캐시 통계"""
    cache = get_cache()
    return cache.stats()


@app.post("/api/cache/reload")
def cache_reload():
    """캐시 리로드 (강제 갱신)"""
    cache = get_cache()
    cache.reload()
    stats = cache.stats()

    return {
        "success": True,
        "message": "Cache reloaded",
        "stats": stats
    }


@app.get("/openapi-lite.json", include_in_schema=False)
def openapi_lite():
    """ChatGPT용 축소 OpenAPI 스펙 (30 operations 이하)"""
    full_spec = app.openapi()

    # GET만 포함할 경로
    keep_paths = [
        '/api/files/',
        '/api/files/{file_path}',
        '/api/search/',
        '/api/tasks',
        '/api/tasks/{task_id}',
        '/api/projects',
        '/api/projects/{project_id}',
        '/api/hypotheses',
        '/api/tracks',
        '/api/conditions',
        '/api/strategy/northstar',
        '/api/strategy/metahypotheses',
        '/health',
    ]

    new_paths = {}
    for path in keep_paths:
        if path in full_spec['paths']:
            methods = full_spec['paths'][path]
            if 'get' in methods:
                new_paths[path] = {'get': methods['get']}

    lite_spec = {
        "openapi": full_spec.get("openapi", "3.1.0"),
        "info": full_spec.get("info", {}),
        "servers": [{"url": "https://kanban.sosilab.synology.me", "description": "Production"}],
        "paths": new_paths,
        "components": full_spec.get("components", {})
    }

    return lite_spec


# ============================================
# Startup Event
# ============================================
@app.on_event("startup")
async def startup_event():
    """Initialize OAuth module on startup"""
    init_oauth()
    print("LOOP Dashboard API started with Production OAuth 2.0")
