"""
ASGI Authentication Middleware

SSE/스트리밍과 호환되는 순수 ASGI 미들웨어.
BaseHTTPMiddleware 대신 직접 ASGI 프로토콜 구현.

Usage:
    from shared.auth.middleware import AuthMiddleware

    app.add_middleware(AuthMiddleware, config=AuthConfig(...))
"""

import json
import logging
from dataclasses import dataclass, field
from typing import Optional, List, Callable, Dict, Any

logger = logging.getLogger("shared.auth.middleware")


@dataclass
class AuthConfig:
    """Authentication middleware configuration"""

    # Static API token (fallback)
    api_token: str = ""

    # JWT verification function (injected by API)
    verify_jwt: Optional[Callable[[str], Optional[Dict[str, Any]]]] = None

    # Public paths (no auth required)
    public_paths: List[str] = field(default_factory=list)

    # Public path prefixes (no auth required)
    public_prefixes: List[str] = field(default_factory=list)

    # SSE/streaming path prefixes (special handling)
    sse_prefixes: List[str] = field(default_factory=lambda: ["/mcp"])

    # Admin-only path prefixes
    admin_prefixes: List[str] = field(default_factory=lambda: ["/admin"])

    # Trusted IPs (bypass auth, e.g., localhost)
    trusted_ips: List[str] = field(default_factory=lambda: ["127.0.0.1", "localhost", "::1"])

    # Access logging function
    log_access: Optional[Callable] = None

    # Default scopes for static token
    static_token_scope: str = "mcp:read mcp:write mcp:exec mcp:admin admin:read admin:write"
    static_token_role: str = "admin"


class AuthMiddleware:
    """Pure ASGI Authentication Middleware

    SSE 스트리밍과 호환되도록 BaseHTTPMiddleware를 사용하지 않음.
    """

    def __init__(self, app, config: Optional[AuthConfig] = None):
        self.app = app
        self.config = config or AuthConfig()

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope["path"]
        headers = dict(scope.get("headers", []))

        # Get client IP
        client_ip = headers.get(b"x-forwarded-for", b"").decode()
        if not client_ip and scope.get("client"):
            client_ip = scope["client"][0]

        # SSE paths - require Bearer token
        for prefix in self.config.sse_prefixes:
            if path.startswith(prefix):
                auth_result = self._check_bearer_auth(headers, client_ip)
                if auth_result:
                    scope["state"] = auth_result
                    await self.app(scope, receive, send)
                    return
                await self._send_401(send, "Use Bearer token for SSE endpoints")
                return

        # Trusted IPs bypass
        if client_ip in self.config.trusted_ips:
            await self.app(scope, receive, send)
            return

        # Public paths bypass
        if path in self.config.public_paths:
            await self.app(scope, receive, send)
            return

        for prefix in self.config.public_prefixes:
            if path.startswith(prefix):
                await self.app(scope, receive, send)
                return

        # Protected paths (/api/*, /admin/*)
        if path.startswith("/api") or path.startswith("/admin"):
            is_admin_path = any(path.startswith(prefix) for prefix in self.config.admin_prefixes)

            # Check Bearer token
            auth_result = self._check_bearer_auth(headers, client_ip)
            if auth_result:
                # Admin path requires admin role
                if is_admin_path and auth_result.get("role") != "admin":
                    self._log_access("admin", client_ip, user_id=auth_result.get("user_id"),
                                     success=False, details=f"path={path}, role={auth_result.get('role')} (admin required)")
                    await self._send_403(send, "Admin role required for /admin/* paths")
                    return

                scope["state"] = auth_result
                await self.app(scope, receive, send)
                return

            # Check x-api-token header (non-admin only)
            x_api_token = headers.get(b"x-api-token", b"").decode()
            if x_api_token == self.config.api_token and not is_admin_path:
                await self.app(scope, receive, send)
                return

            # Auth failed
            if is_admin_path:
                self._log_access("admin", client_ip, success=False, details=f"path={path}")
                await self._send_403(send, "Admin role required. Use service account with role=admin")
                return

            self._log_access("api", client_ip, success=False, details=f"path={path}")
            await self._send_401(send, "Use Bearer token or x-api-token header")
            return

        # Other paths pass through
        await self.app(scope, receive, send)

    def _check_bearer_auth(self, headers: dict, client_ip: str) -> Optional[Dict[str, Any]]:
        """Check Bearer token authentication

        Returns:
            Auth state dict if valid, None otherwise
        """
        auth_header = headers.get(b"authorization", b"").decode()

        if not auth_header.startswith("Bearer "):
            return None

        bearer_token = auth_header[7:]

        # Static API token
        if bearer_token == self.config.api_token:
            self._log_access("api", client_ip, success=True, details="static_token")
            return {
                "role": self.config.static_token_role,
                "scope": self.config.static_token_scope,
                "user_id": "static_token",
            }

        # JWT verification
        if self.config.verify_jwt:
            jwt_payload = self.config.verify_jwt(bearer_token)
            if jwt_payload:
                user_role = jwt_payload.get("role", "member")
                user_scope = jwt_payload.get("scope", "mcp:read")

                self._log_access(
                    "api", client_ip,
                    user_id=jwt_payload.get("sub"),
                    success=True,
                    details=f"scope={user_scope}, role={user_role}"
                )

                return {
                    "role": user_role,
                    "scope": user_scope,
                    "user_id": jwt_payload.get("sub"),
                    "email": jwt_payload.get("email"),  # Extract email from JWT claims
                }

        return None

    def _log_access(self, action: str, client_ip: str, user_id: Optional[str] = None,
                    success: bool = True, details: Optional[str] = None):
        """Log access attempt"""
        if self.config.log_access:
            self.config.log_access(action, client_ip, user_id=user_id, success=success, details=details)
        else:
            status = "SUCCESS" if success else "FAILED"
            msg = f"[{action.upper()}] {status} | IP:{client_ip}"
            if user_id:
                msg += f" | user:{user_id}"
            if details:
                msg += f" | {details}"
            logger.info(msg) if success else logger.warning(msg)

    async def _send_401(self, send, hint: str):
        """Send 401 Unauthorized response"""
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
        """Send 403 Forbidden response"""
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
