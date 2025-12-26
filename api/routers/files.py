"""
파일 읽기 및 디렉토리 탐색 API

Endpoints:
    GET /api/files              - 디렉토리 목록 조회
    GET /api/files/{file_path}  - 파일 내용 읽기
"""

from pathlib import Path
from typing import Optional, List, Tuple
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel

from ..utils.vault_utils import get_vault_dir
from ..oauth.security import check_path_access
from ..oauth.jwks import verify_jwt


def get_role_and_scope(request: Request) -> Tuple[str, str]:
    """
    request.state에서 role/scope 가져오거나, 없으면 Authorization 헤더에서 JWT 직접 확인.
    MCP 내부 호출이 미들웨어를 우회하는 경우를 위한 fallback.
    """
    # 1. 먼저 request.state 확인 (미들웨어가 설정한 경우)
    role = getattr(request.state, "role", None)
    scope = getattr(request.state, "scope", None)

    if role and scope:
        return role, scope

    # 2. Authorization 헤더에서 직접 JWT 확인 (MCP 내부 호출용)
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]
        payload = verify_jwt(token)
        if payload:
            return payload.get("role", "member"), payload.get("scope", "mcp:read")

    # 3. 기본값
    return "member", "mcp:read"


router = APIRouter(prefix="/api/files", tags=["files"])


# ============================================
# Response Models
# ============================================
class FileContent(BaseModel):
    path: str
    content: str
    size: int


class DirectoryItem(BaseModel):
    name: str
    type: str  # "file" or "dir"
    path: str


class DirectoryListing(BaseModel):
    path: str
    items: List[DirectoryItem]


# ============================================
# Endpoints
# ============================================
@router.get("/", response_model=DirectoryListing)
async def list_directory(
    request: Request,
    path: str = Query("", description="디렉토리 경로 (빈 문자열 = 루트)")
):
    """
    디렉토리 목록 조회

    Examples:
        GET /api/files/?path=50_Projects
        GET /api/files/?path=30_Ontology/Schema
    """
    # RBAC: role 기반 경로 접근 제어 (MCP 내부 호출도 지원)
    role, scope = get_role_and_scope(request)

    if path and not check_path_access(path, scope, role):
        raise HTTPException(status_code=403, detail=f"Access denied: insufficient permissions for path '{path}' (role={role})")

    vault_dir = get_vault_dir()
    target = vault_dir / path if path else vault_dir

    # 보안: vault 외부 접근 차단
    try:
        resolved = target.resolve()
        if not str(resolved).startswith(str(vault_dir.resolve())):
            raise HTTPException(status_code=403, detail="Access denied: path outside vault")
    except Exception:
        raise HTTPException(status_code=403, detail="Access denied: invalid path")

    if not target.exists():
        raise HTTPException(status_code=404, detail=f"Directory not found: {path}")

    if not target.is_dir():
        raise HTTPException(status_code=400, detail=f"Not a directory: {path}")

    items = []
    try:
        for item in sorted(target.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower())):
            # .obsidian, .git 등 숨김 폴더 제외
            if item.name.startswith("."):
                continue

            items.append(DirectoryItem(
                name=item.name,
                type="dir" if item.is_dir() else "file",
                path=str(item.relative_to(vault_dir))
            ))
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")

    return DirectoryListing(path=path or "/", items=items)


@router.get("/{file_path:path}", response_model=FileContent)
async def read_file(request: Request, file_path: str):
    """
    파일 내용 읽기

    Examples:
        GET /api/files/_Graph_Index.md
        GET /api/files/CLAUDE.md
        GET /api/files/50_Projects/2025/P001_Ontology/Project_정의.md
    """
    # RBAC: role 기반 경로 접근 제어 (MCP 내부 호출도 지원)
    role, scope = get_role_and_scope(request)

    if not check_path_access(file_path, scope, role):
        raise HTTPException(status_code=403, detail=f"Access denied: insufficient permissions for path '{file_path}' (role={role})")

    vault_dir = get_vault_dir()
    full_path = vault_dir / file_path

    # 보안: vault 외부 접근 차단
    try:
        resolved = full_path.resolve()
        if not str(resolved).startswith(str(vault_dir.resolve())):
            raise HTTPException(status_code=403, detail="Access denied: path outside vault")
    except Exception:
        raise HTTPException(status_code=403, detail="Access denied: invalid path")

    if not full_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

    if full_path.is_dir():
        raise HTTPException(
            status_code=400,
            detail=f"Path is a directory, not a file. Use GET /api/files/?path={file_path} instead"
        )

    try:
        content = full_path.read_text(encoding="utf-8")
        size = full_path.stat().st_size
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File is not a text file")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")

    return FileContent(path=file_path, content=content, size=size)
