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

from .routers import tasks, projects, programs, tracks, hypotheses, conditions, strategy, search, pending, mcp_composite, autofill, audit, ai, build
from .utils.vault_utils import load_members, get_vault_dir
from .constants import get_all_constants
from .cache import get_cache

# OAuth 2.0 Module (키/DB는 볼륨에 영구 저장)
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
    # OAuth endpoints
    "/.well-known/oauth-authorization-server", "/.well-known/jwks.json",
    "/authorize", "/token", "/register", "/oauth/login", "/oauth/logout"
]
PUBLIC_PREFIXES = ["/css", "/js"]  # 정적 파일만 공개

# SSE 스트리밍 경로 (BaseHTTPMiddleware와 SSE 호환성 문제로 별도 처리)
SSE_PREFIXES = ["/mcp"]

# Admin 전용 경로 (role=admin 필수)
ADMIN_PREFIXES = ["/admin"]

# MCP 내부 호출 허용 IP (Docker 컨테이너 내부 루프백)
MCP_TRUSTED_IPS = ["127.0.0.1", "localhost", "::1"]


# ============================================
# Pure ASGI Middleware (SSE 호환)
# ============================================
# @app.middleware("http")는 BaseHTTPMiddleware를 사용하여 SSE와 충돌
# 순수 ASGI 미들웨어로 구현하여 스트리밍 응답을 버퍼링하지 않음
class AuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope["path"]
        headers = dict(scope.get("headers", []))

        # SSE 경로 (MCP) - Bearer 토큰 인증 필요
        for prefix in SSE_PREFIXES:
            if path.startswith(prefix):
                auth_header = headers.get(b"authorization", b"").decode()
                if auth_header.startswith("Bearer "):
                    bearer_token = auth_header[7:]
                    if bearer_token == API_TOKEN or verify_jwt(bearer_token):
                        await self.app(scope, receive, send)
                        return
                # 인증 실패
                await self._send_401(send, "Use Bearer token")
                return

        # IP 확인
        client_ip = headers.get(b"x-forwarded-for", b"").decode()
        if not client_ip and scope.get("client"):
            client_ip = scope["client"][0]
        print(f"CLIENT_IP: {client_ip} | PATH: {path}")

        # MCP 내부 호출 우회
        if client_ip in MCP_TRUSTED_IPS:
            await self.app(scope, receive, send)
            return

        # 공개 경로 우회
        if path in PUBLIC_PATHS:
            await self.app(scope, receive, send)
            return

        for prefix in PUBLIC_PREFIXES:
            if path.startswith(prefix):
                await self.app(scope, receive, send)
                return

        # /api/* 또는 /admin/* 경로는 토큰 검증
        if path.startswith("/api") or path.startswith("/admin"):
            auth_header = headers.get(b"authorization", b"").decode()
            x_api_token = headers.get(b"x-api-token", b"").decode()

            # Admin 경로 체크 플래그
            is_admin_path = any(path.startswith(prefix) for prefix in ADMIN_PREFIXES)

            if auth_header.startswith("Bearer "):
                bearer_token = auth_header[7:]

                # 1. 정적 API 토큰 확인 (admin 권한 부여)
                if bearer_token == API_TOKEN:
                    log_oauth_access("api", client_ip, success=True, details="static_token")
                    # RBAC: 정적 토큰은 admin 권한 (exec vault 접근 가능)
                    scope["state"] = {
                        "role": "admin",
                        "scope": "mcp:read mcp:write mcp:exec mcp:admin admin:read admin:write",
                        "user_id": "static_token",
                    }
                    await self.app(scope, receive, send)
                    return

                # 2. OAuth Bearer 토큰 확인 (RS256 JWT)
                jwt_payload = verify_jwt(bearer_token)
                if jwt_payload:
                    user_role = jwt_payload.get("role", "member")
                    user_scope = jwt_payload.get("scope", "mcp:read")

                    # Admin 경로 접근 시 role=admin 필수
                    if is_admin_path and user_role != "admin":
                        log_oauth_access(
                            "admin",
                            client_ip,
                            user_id=jwt_payload.get("sub"),
                            success=False,
                            details=f"path={path}, role={user_role} (admin required)"
                        )
                        await self._send_403(send, "Admin role required for /admin/* paths")
                        return

                    log_oauth_access(
                        "api",
                        client_ip,
                        user_id=jwt_payload.get("sub"),
                        success=True,
                        details=f"scope={user_scope}, role={user_role}"
                    )
                    # RBAC: scope에 role/scope 저장 (files.py 등에서 접근)
                    scope["state"] = {
                        "role": user_role,
                        "scope": user_scope,
                        "user_id": jwt_payload.get("sub"),
                    }
                    await self.app(scope, receive, send)
                    return

            # 3. x-api-token 헤더 확인 (대시보드용 - admin 경로는 허용 안함)
            if x_api_token == API_TOKEN and not is_admin_path:
                await self.app(scope, receive, send)
                return

            # Admin 경로에서 인증 실패
            if is_admin_path:
                log_oauth_access("admin", client_ip, success=False, details=f"path={path}")
                await self._send_403(send, "Admin role required. Use service account with role=admin")
                return

            # 일반 API 경로에서 인증 실패
            log_oauth_access("api", client_ip, success=False, details=f"path={path}")
            await self._send_401(send, "Use Bearer token or x-api-token header")
            return

        # 기타 경로는 통과
        await self.app(scope, receive, send)

    async def _send_401(self, send, hint: str):
        """401 Unauthorized 응답 전송"""
        import json
        body = json.dumps({"detail": "Unauthorized", "hint": hint}).encode()
        await send({
            "type": "http.response.start",
            "status": 401,
            "headers": [
                (b"content-type", b"application/json"),
                (b"content-length", str(len(body)).encode()),
            ],
        })
        await send({
            "type": "http.response.body",
            "body": body,
        })

    async def _send_403(self, send, hint: str):
        """403 Forbidden 응답 전송"""
        import json
        body = json.dumps({"detail": "Forbidden", "hint": hint}).encode()
        await send({
            "type": "http.response.start",
            "status": 403,
            "headers": [
                (b"content-type", b"application/json"),
                (b"content-length", str(len(body)).encode()),
            ],
        })
        await send({
            "type": "http.response.body",
            "body": body,
        })


# ASGI 미들웨어 등록 (CORS 다음에 추가)
app.add_middleware(AuthMiddleware)

# Routers 등록
app.include_router(tasks.router)
app.include_router(projects.router)
app.include_router(programs.router)
app.include_router(tracks.router)
app.include_router(hypotheses.router)
app.include_router(conditions.router)
app.include_router(strategy.router)
app.include_router(search.router)
app.include_router(pending.router)
app.include_router(mcp_composite.router)
app.include_router(autofill.router)
app.include_router(audit.router)
app.include_router(ai.router)
app.include_router(build.router)  # tsk-n8n-12: Impact 빌드 API

# OAuth 2.0 Router (키는 loop-auth와 공유됨)
app.include_router(oauth_router)

# ============================================
# MCP Server (ChatGPT Developer Mode 연동용)
# ============================================
if MCP_AVAILABLE:
    # 복합 API만 MCP 도구로 노출 (개별 API 숨김 → 권한 팝업 최소화)
    MCP_ALLOWED_OPERATIONS = [
        "get_vault_context_api_mcp_vault_context_get",
        "search_and_read_api_mcp_search_and_read_get",
        "file_read_api_mcp_file_read_get",  # 파일 직접 읽기 (경로 지정)
        "vault_full_scan_api_mcp_vault_full_scan_get",  # 슈퍼 복합 API (1회 allow로 전체 구조 파악)
        "get_project_context_api_mcp_project__project_id__context_get",
        "get_track_context_api_mcp_track__track_id__context_get",
        "get_dashboard_api_mcp_dashboard_get",
        "get_entity_graph_api_mcp_entity__entity_id__graph_get",
        "get_strategy_overview_api_mcp_strategy_get",
        "get_schema_info_api_mcp_schema_get",
        # Exec Vault (loop_exec) - RBAC protected
        "get_exec_context_api_mcp_exec_context_get",
        "exec_read_api_mcp_exec_read_get",
        "exec_search_api_mcp_exec_search_get",
    ]
    mcp = FastApiMCP(
        app,
        name="LOOP Vault MCP",
        include_operations=MCP_ALLOWED_OPERATIONS,
        description="""LOOP Obsidian Vault - 0→1 소수 정예를 위한 AI 의사결정 인프라 (Palantir-lite)

## 핵심 철학 (상세: 00_Meta/LOOP_PHILOSOPHY.md)
결정–증거–정량화(A/B)–승인–학습 루프를 SSOT + Derived로 구현한 0→1 운영 OS
1. SSOT + Derived: 한 곳에만 저장, 나머지는 계산 (드리프트 방지)
2. 계산은 코드가, 판단은 사람이: LLM은 제안, 점수는 서버, 승인은 인간
3. A/B 점수화: 베팅(A)과 결과(B) 분리 → 학습이 누적되는 구조
4. 윈도우 평가: Project(월간) → Track(분기) → Condition(반기) 롤업

## Entity Hierarchy
NorthStar (10Y Vision) → MetaHypothesis (MH1-4) → Condition (cond-a~e) → Track (trk-1~6) → Project → Task
Hypothesis: Project가 validates로 검증

## ID Patterns
- Project: prj-NNN (예: prj-001)
- Task: tsk-NNN-NN (예: tsk-001-01)
- Hypothesis: hyp-N-NN (예: hyp-2-01)
- Track: trk-N (예: trk-1~6)
- Condition: cond-X (예: cond-a~e)

## Dual Vault Contract
- **LOOP Vault** = Shareable Truth (상태/정책/원칙/실행가이드)
- **Exec Vault** = Private Truth (금액/개인/계약/계좌 등 민감 정보)
- **출력 규칙**: exec → LOOP로는 "숫자 없는 상태/결론"만 반영 가능

### Exec Vault 의사결정 파이프라인
exec/의 폴더 구조 = 경영판단 라우팅 OS:
```
Runway(상태) → Cashflow(근거) → Pipeline(확률) → People(결정) → Contingency(강제실행)
```
- 10_Runway: 상태 머신 (Green/Yellow/Red)
- 20_Cashflow: 상태를 계산하는 원장 (근거 데이터)
- 30_Pipeline: 미래 현금 유입의 확률 테이블
- 40_People: 상태에 종속되는 가장 비싼 결정 (채용/유지/역할)
- 60_Contingency: Red일 때 자동 실행되는 프로토콜

### 라우팅 규칙
- "상태/정책/원칙?" → LOOP 우선
- "금액/잔고/개인계약/급여?" → exec만, LOOP로 숫자/개인정보 절대 노출 금지
- "결정(채용/예산/피봇)?" → exec 트리거 확인 → LOOP에는 결론만 반영

## 12가지 복합 API 도구

### LOOP Vault (9개)
1. vault-context - Vault 철학 + 구조 + 현황 (⭐ 첫 호출 필수)
2. search-and-read - 검색+읽기 통합 (q=키워드)
3. file-read - 파일 직접 읽기 (paths=경로, 쉼표 구분) ⭐NEW
4. project-context - 프로젝트+Tasks+Hypotheses (include_body=true로 본문 포함)
5. track-context - Track+하위 Projects
6. dashboard - 전체 현황 요약
7. entity-graph - 엔티티 관계 그래프
8. strategy - 전략 계층 (NorthStar→Track)
9. schema - 스키마/상수 정보

### Exec Vault (3개, role=admin/exec 전용)
10. exec-context - Exec Vault 구조 + 현황 (⭐ exec 첫 호출 필수)
11. exec-read - Exec Vault 파일 읽기 (paths=경로)
12. exec-search - Exec Vault 검색 (q=키워드)

## 사용 가이드
1. 첫 연결 시: vault-context 호출 → 전체 구조 파악
2. 검색 필요: search-and-read(q="키워드") → 파일까지 한 번에
3. 특정 파일 읽기: file-read(paths="50_Projects/.../file.md") → 직접 경로로 읽기
4. 프로젝트 상세: project-context(id, include_body=true) → 본문 포함
5. 현황 파악: dashboard → 긴급/지연 항목 확인
6. exec 탐색: exec-context → _ENTRY_POINT → 각 폴더 _INDEX → 핵심 문서 순"""
    )
    mcp.mount()  # /mcp 엔드포인트 자동 생성
    print("✅ MCP Server mounted at /mcp (복합 API만 노출)")
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
    """Initialize OAuth module on startup (keys/DB stored in volume)"""
    init_oauth()
    print("LOOP Dashboard API started with OAuth 2.0")
