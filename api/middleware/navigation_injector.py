"""
Navigation Injector Middleware

MCP API 호출 시 vault-navigation을 호출하지 않은 클라이언트에게
자동으로 navigation 데이터를 주입하는 미들웨어.

동작 방식:
1. /api/mcp/* 경로 요청 감지
2. 클라이언트 식별 (JWT sub 또는 IP)
3. navigation 호출 이력 확인 (TTL 1시간)
4. 미호출 시 응답에 _auto_navigation 필드 자동 주입

Usage:
    app.add_middleware(NavigationInjectorMiddleware)
"""

import json
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
from starlette.types import ASGIApp, Receive, Send, Scope, Message
from starlette.datastructures import MutableHeaders

from ..cache import get_cache
from ..constants import get_all_constants


# ============================================
# Navigation 호출 추적 캐시
# ============================================

# 클라이언트별 navigation 호출 시간 추적
_navigation_cache: Dict[str, datetime] = {}

# Navigation 캐시 TTL (1시간)
NAVIGATION_TTL = timedelta(hours=1)

# Navigation 데이터 캐시 (서버 시작 시 1회 생성, 5분마다 갱신)
_navigation_data_cache: Optional[Dict[str, Any]] = None
_navigation_data_timestamp: Optional[datetime] = None
NAVIGATION_DATA_TTL = timedelta(minutes=5)


def get_client_id(scope: Scope) -> str:
    """
    ASGI scope에서 클라이언트 식별자 추출

    우선순위:
    1. JWT의 user_id (AuthMiddleware가 설정)
    2. 클라이언트 IP
    """
    # 1. ASGI scope["state"]에서 user_id 확인 (AuthMiddleware가 설정)
    state = scope.get("state", {})
    if isinstance(state, dict):
        user_id = state.get("user_id")
        if user_id:
            return f"user:{user_id}"

    # 2. X-Forwarded-For 헤더에서 IP 확인
    headers = dict(scope.get("headers", []))
    forwarded_for = headers.get(b"x-forwarded-for", b"").decode()
    if forwarded_for:
        # 첫 번째 IP 사용 (프록시 체인의 원본 클라이언트)
        client_ip = forwarded_for.split(",")[0].strip()
        return f"ip:{client_ip}"

    # 3. 직접 연결 클라이언트 IP
    client = scope.get("client")
    if client:
        return f"ip:{client[0]}"

    return "unknown"


def mark_navigation_called(client_id: str) -> None:
    """Navigation 호출 기록"""
    _navigation_cache[client_id] = datetime.now()

    # 오래된 캐시 정리 (메모리 관리)
    _cleanup_expired_cache()


def needs_navigation(client_id: str) -> bool:
    """
    해당 클라이언트가 navigation 데이터가 필요한지 확인

    Returns:
        True: navigation을 호출한 적 없거나 TTL 만료
        False: 최근에 navigation 호출함
    """
    if client_id not in _navigation_cache:
        return True

    last_call = _navigation_cache[client_id]
    return datetime.now() - last_call > NAVIGATION_TTL


def _cleanup_expired_cache() -> None:
    """만료된 캐시 항목 정리"""
    now = datetime.now()
    expired_keys = [
        key for key, timestamp in _navigation_cache.items()
        if now - timestamp > NAVIGATION_TTL
    ]
    for key in expired_keys:
        del _navigation_cache[key]


# ============================================
# Navigation 데이터 생성 (Compact 버전)
# ============================================

def _get_navigation_data_compact() -> Dict[str, Any]:
    """
    Navigation 데이터 생성 (컴팩트 버전)

    자동 주입 시 응답 크기를 줄이기 위해 핵심 정보만 포함.
    전체 데이터는 /api/mcp/vault-navigation 직접 호출로 획득.
    """
    global _navigation_data_cache, _navigation_data_timestamp

    # 캐시 유효성 확인
    now = datetime.now()
    if (_navigation_data_cache is not None and
        _navigation_data_timestamp is not None and
        now - _navigation_data_timestamp < NAVIGATION_DATA_TTL):
        return _navigation_data_cache

    # 캐시 갱신
    cache = get_cache()

    navigation_data = {
        "hint": "Auto-injected navigation. Call /api/mcp/vault-navigation for full details.",
        "vault_structure": {
            "hierarchy": "NorthStar → MetaHypothesis → Condition → Track → Project → Task",
            "dual_vault": {
                "public": "Projects, Tasks, Strategy, Ontology (team accessible)",
                "exec": "Runway, Budget, People (C-Level only, requires mcp:exec scope)"
            }
        },
        "entity_stats": {
            "Project": len(cache.get_all_projects()),
            "Task": len(cache.get_all_tasks()),
            "Hypothesis": len(cache.get_all_hypotheses()),
            "Track": len(cache.get_all_tracks()),
        },
        "quick_start": {
            "search": "/api/mcp/search-and-read?q={keyword}",
            "file_read": "/api/mcp/file-read?paths={path}",
            "project": "/api/mcp/project/{id}/context",
            "full_navigation": "/api/mcp/vault-navigation"
        },
        "routing_hints": [
            {"question": "프로젝트/태스크?", "api": "/api/mcp/search-and-read?q=..."},
            {"question": "전략/Track?", "api": "/api/mcp/strategy"},
            {"question": "런웨이/예산?", "api": "/api/mcp/exec-context (requires auth)"},
        ]
    }

    _navigation_data_cache = navigation_data
    _navigation_data_timestamp = now

    return navigation_data


# ============================================
# Navigation Injector Middleware
# ============================================

class NavigationInjectorMiddleware:
    """
    MCP API 응답에 Navigation 데이터를 자동 주입하는 미들웨어

    동작:
    1. /api/mcp/* 경로 요청 감지
    2. /api/mcp/vault-navigation 호출 시 클라이언트 기록
    3. 다른 MCP API 호출 시 navigation 미호출 클라이언트에게 자동 주입
    """

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope["path"]

        # MCP 경로가 아니면 그냥 통과
        if not path.startswith("/api/mcp/"):
            await self.app(scope, receive, send)
            return

        client_id = get_client_id(scope)

        # vault-navigation 호출 시 클라이언트 기록
        if path == "/api/mcp/vault-navigation":
            mark_navigation_called(client_id)
            await self.app(scope, receive, send)
            return

        # Navigation이 필요 없으면 그냥 통과
        if not needs_navigation(client_id):
            await self.app(scope, receive, send)
            return

        # Navigation 주입이 필요한 경우 응답 가로채기
        await self._inject_navigation(scope, receive, send, client_id)

    async def _inject_navigation(
        self,
        scope: Scope,
        receive: Receive,
        send: Send,
        client_id: str
    ) -> None:
        """응답에 navigation 데이터 주입"""

        response_body_chunks = []
        response_started = False
        initial_message = None

        async def send_wrapper(message: Message) -> None:
            nonlocal response_started, initial_message, response_body_chunks

            if message["type"] == "http.response.start":
                response_started = True
                initial_message = message
                # 아직 send하지 않음 (body 수정 후 content-length 재계산 필요)
                return

            if message["type"] == "http.response.body":
                body = message.get("body", b"")
                more_body = message.get("more_body", False)

                response_body_chunks.append(body)

                # 마지막 청크가 아니면 계속 수집
                if more_body:
                    return

                # 모든 body 수집 완료 - 이제 처리
                full_body = b"".join(response_body_chunks)

                # JSON 응답인지 확인하고 navigation 주입 시도
                modified_body = self._try_inject_navigation(
                    initial_message, full_body, client_id
                )

                # Content-Length 재계산
                if initial_message:
                    headers = MutableHeaders(raw=list(initial_message.get("headers", [])))
                    headers["content-length"] = str(len(modified_body))

                    # 수정된 헤더로 start 전송
                    await send({
                        "type": "http.response.start",
                        "status": initial_message.get("status", 200),
                        "headers": headers.raw,
                    })

                # 수정된 body 전송
                await send({
                    "type": "http.response.body",
                    "body": modified_body,
                    "more_body": False,
                })
                return

            # 다른 메시지는 그냥 통과
            await send(message)

        await self.app(scope, receive, send_wrapper)

    def _try_inject_navigation(
        self,
        start_message: Optional[Message],
        body: bytes,
        client_id: str
    ) -> bytes:
        """
        JSON 응답에 navigation 데이터 주입 시도

        Returns:
            수정된 body (주입 실패 시 원본 반환)
        """
        if not start_message:
            return body

        # Content-Type 확인
        headers = dict(start_message.get("headers", []))
        content_type = headers.get(b"content-type", b"").decode()

        if "application/json" not in content_type:
            return body

        # JSON 파싱 시도
        try:
            data = json.loads(body.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return body

        # dict가 아니면 주입 불가
        if not isinstance(data, dict):
            return body

        # Navigation 데이터 주입
        navigation_data = _get_navigation_data_compact()
        data["_auto_navigation"] = navigation_data
        data["_navigation_hint"] = (
            "Navigation data auto-injected because you haven't called "
            "/api/mcp/vault-navigation yet. Call it to mark as initialized."
        )

        # 이 클라이언트가 응답을 받았으므로 navigation 호출로 간주
        # (다음 호출부터는 주입하지 않음)
        mark_navigation_called(client_id)

        return json.dumps(data, ensure_ascii=False).encode("utf-8")
