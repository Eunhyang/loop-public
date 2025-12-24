"""
파일 읽기 및 디렉토리 탐색 API

Endpoints:
    GET /api/files              - 디렉토리 목록 조회
    GET /api/files/{file_path}  - 파일 내용 읽기
"""

from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from ..utils.vault_utils import get_vault_dir


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
async def list_directory(path: str = Query("", description="디렉토리 경로 (빈 문자열 = 루트)")):
    """
    디렉토리 목록 조회

    Examples:
        GET /api/files/?path=50_Projects
        GET /api/files/?path=30_Ontology/Schema
    """
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
async def read_file(file_path: str):
    """
    파일 내용 읽기

    Examples:
        GET /api/files/_Graph_Index.md
        GET /api/files/CLAUDE.md
        GET /api/files/50_Projects/2025/P001_Ontology/Project_정의.md
    """
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
