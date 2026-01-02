"""
LOOP OAuth Server (Standalone)

OAuth 2.0 인증 전용 서버.
loop-api와 분리되어 API rebuild 시에도 인증 세션 유지.

Usage:
    uvicorn api.main_auth:app --host 0.0.0.0 --port 8083

Endpoints:
    GET  /.well-known/oauth-authorization-server - RFC 8414 Discovery
    GET  /.well-known/openid-configuration       - OpenID Connect Discovery
    GET  /.well-known/jwks.json                  - JWKS public key
    POST /register                                - Dynamic Client Registration
    GET  /authorize                               - Authorization (requires login)
    POST /oauth/login                             - Login form handler
    POST /token                                   - Token exchange (PKCE)
    GET  /oauth/logout                            - Logout
    GET  /health                                  - Health check
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from datetime import datetime
from pathlib import Path

from .oauth.routes import router as oauth_router, init_oauth

# ============================================
# FastAPI App
# ============================================
app = FastAPI(
    title="LOOP OAuth Server",
    version="1.0.0",
    description="OAuth 2.0 Authorization Server for LOOP MCP",
    servers=[
        {"url": "https://mcp.sosilab.synology.me", "description": "Production (NAS)"},
    ]
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth Router
app.include_router(oauth_router)

# Templates directory (for login page)
TEMPLATES_DIR = Path(__file__).parent / "templates"


# ============================================
# Root Endpoints
# ============================================
@app.get("/")
def root():
    """OAuth Server info"""
    return {
        "name": "LOOP OAuth Server",
        "version": "1.0.0",
        "endpoints": {
            "discovery": "/.well-known/oauth-authorization-server",
            "openid_config": "/.well-known/openid-configuration",
            "jwks": "/.well-known/jwks.json",
            "authorize": "/authorize",
            "token": "/token",
            "register": "/register",
            "health": "/health"
        }
    }


@app.get("/health")
def health_check():
    """Health check"""
    return {
        "status": "healthy",
        "service": "loop-auth",
        "timestamp": datetime.now().isoformat()
    }


# ============================================
# Startup Event
# ============================================
@app.on_event("startup")
async def startup_event():
    """Initialize OAuth module on startup"""
    init_oauth()
    print("LOOP OAuth Server started (standalone)")
