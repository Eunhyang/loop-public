"""
파일 읽기 및 디렉토리 탐색 API

Endpoints:
    GET /api/files              - 디렉토리 목록 조회
    GET /api/files/tree         - 재귀 트리 구조 조회 (MCP 최적화)
    GET /api/files/batch        - 여러 파일 한 번에 읽기 (MCP 최적화)
    GET /api/files/{file_path}  - 파일 내용 읽기
"""

from pathlib import Path
from typing import Optional, List, Tuple, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel
import fnmatch

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


class TreeNode(BaseModel):
    """재귀 트리 노드 (MCP 스키마 호환을 위해 children은 Any 타입)"""
    name: str
    type: str  # "file" or "dir"
    path: str
    children: Optional[List[Any]] = None  # Self-reference 대신 Any 사용 (MCP 호환)


class TreeResponse(BaseModel):
    """트리 API 응답"""
    path: str
    tree: List[Any]  # TreeNode list, MCP 호환을 위해 Any
    total_files: int
    total_dirs: int


class BatchFileContent(BaseModel):
    """Batch API 응답 항목"""
    path: str
    content: Optional[str] = None
    size: Optional[int] = None
    error: Optional[str] = None


class BatchResponse(BaseModel):
    """Batch API 응답"""
    files: List[BatchFileContent]
    success_count: int
    error_count: int


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


# ============================================
# Tree API (MCP 최적화)
# ============================================
def build_tree(
    directory: Path,
    vault_dir: Path,
    exclude_patterns: List[str],
    max_depth: int,
    current_depth: int = 0
) -> Tuple[List[TreeNode], int, int]:
    """재귀적으로 디렉토리 트리 구조 생성"""
    nodes = []
    total_files = 0
    total_dirs = 0

    if current_depth >= max_depth:
        return nodes, total_files, total_dirs

    try:
        items = sorted(directory.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))
    except PermissionError:
        return nodes, total_files, total_dirs

    for item in items:
        # 숨김 파일/폴더 제외
        if item.name.startswith("."):
            continue

        # exclude 패턴 체크
        skip = False
        for pattern in exclude_patterns:
            if fnmatch.fnmatch(item.name, pattern):
                skip = True
                break
        if skip:
            continue

        rel_path = str(item.relative_to(vault_dir))

        if item.is_dir():
            total_dirs += 1
            children, child_files, child_dirs = build_tree(
                item, vault_dir, exclude_patterns, max_depth, current_depth + 1
            )
            total_files += child_files
            total_dirs += child_dirs
            nodes.append(TreeNode(
                name=item.name,
                type="dir",
                path=rel_path,
                children=children if children else None
            ))
        else:
            total_files += 1
            nodes.append(TreeNode(
                name=item.name,
                type="file",
                path=rel_path,
                children=None
            ))

    return nodes, total_files, total_dirs


@router.get("/tree", response_model=TreeResponse)
async def get_tree(
    request: Request,
    path: str = Query("", description="시작 디렉토리 경로 (빈 문자열 = 루트)"),
    exclude: str = Query(".git,__pycache__,node_modules,.obsidian,@eaDir", description="제외할 패턴 (쉼표 구분)"),
    max_depth: int = Query(10, ge=1, le=20, description="최대 탐색 깊이")
):
    """
    재귀 트리 구조 조회 (MCP 최적화)

    한 번의 호출로 전체 폴더 구조를 반환합니다.
    ChatGPT MCP 연동 시 함수 호출 횟수를 최소화합니다.

    Examples:
        GET /api/files/tree?path=50_Projects
        GET /api/files/tree?path=exec&exclude=.git,__pycache__&max_depth=3
    """
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

    exclude_patterns = [p.strip() for p in exclude.split(",") if p.strip()]
    tree, total_files, total_dirs = build_tree(target, vault_dir, exclude_patterns, max_depth)

    return TreeResponse(
        path=path or "/",
        tree=tree,
        total_files=total_files,
        total_dirs=total_dirs
    )


# ============================================
# Batch Read API (MCP 최적화)
# ============================================
@router.get("/batch", response_model=BatchResponse)
async def get_files_batch(
    request: Request,
    paths: str = Query(..., description="파일 경로 목록 (쉼표 구분)")
):
    """
    여러 파일 한 번에 읽기 (MCP 최적화)

    한 번의 호출로 여러 파일 내용을 반환합니다.
    ChatGPT MCP 연동 시 함수 호출 횟수를 최소화합니다.

    Examples:
        GET /api/files/batch?paths=CLAUDE.md,README.md
        GET /api/files/batch?paths=50_Projects/P001/Project_정의.md,50_Projects/P002/Project_정의.md
    """
    role, scope = get_role_and_scope(request)
    vault_dir = get_vault_dir()

    path_list = [p.strip() for p in paths.split(",") if p.strip()]

    if not path_list:
        raise HTTPException(status_code=400, detail="No paths provided")

    if len(path_list) > 50:
        raise HTTPException(status_code=400, detail="Too many files requested (max 50)")

    results = []
    success_count = 0
    error_count = 0

    for file_path in path_list:
        # RBAC 체크
        if not check_path_access(file_path, scope, role):
            results.append(BatchFileContent(
                path=file_path,
                error=f"Access denied (role={role})"
            ))
            error_count += 1
            continue

        full_path = vault_dir / file_path

        # 보안: vault 외부 접근 차단
        try:
            resolved = full_path.resolve()
            if not str(resolved).startswith(str(vault_dir.resolve())):
                results.append(BatchFileContent(path=file_path, error="Access denied: path outside vault"))
                error_count += 1
                continue
        except Exception:
            results.append(BatchFileContent(path=file_path, error="Invalid path"))
            error_count += 1
            continue

        if not full_path.exists():
            results.append(BatchFileContent(path=file_path, error="File not found"))
            error_count += 1
            continue

        if full_path.is_dir():
            results.append(BatchFileContent(path=file_path, error="Path is a directory"))
            error_count += 1
            continue

        try:
            content = full_path.read_text(encoding="utf-8")
            size = full_path.stat().st_size
            results.append(BatchFileContent(
                path=file_path,
                content=content,
                size=size
            ))
            success_count += 1
        except UnicodeDecodeError:
            results.append(BatchFileContent(path=file_path, error="Not a text file"))
            error_count += 1
        except PermissionError:
            results.append(BatchFileContent(path=file_path, error="Permission denied"))
            error_count += 1

    return BatchResponse(
        files=results,
        success_count=success_count,
        error_count=error_count
    )


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
