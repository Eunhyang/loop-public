"""
Vault 검색 API

Endpoints:
    GET /api/search  - vault 전체 내용 검색 (grep 방식)
"""

import re
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel

from ..utils.vault_utils import get_vault_dir


router = APIRouter(prefix="/api/search", tags=["search"])


# ============================================
# Response Models
# ============================================
class SearchResult(BaseModel):
    path: str
    matches: int
    snippet: str


class SearchResponse(BaseModel):
    query: str
    count: int
    results: List[SearchResult]


# ============================================
# Configuration
# ============================================
# 검색 제외 패턴
EXCLUDE_PATTERNS = [
    ".obsidian",
    "90_Archive",
    ".git",
    "__pycache__",
    "node_modules",
    "_build",
]


# ============================================
# Endpoints
# ============================================
@router.get("/", response_model=SearchResponse)
async def search_vault(
    q: str = Query(..., min_length=2, description="검색어 (2자 이상)"),
    limit: int = Query(20, ge=1, le=100, description="최대 결과 수"),
    case_sensitive: bool = Query(False, description="대소문자 구분")
):
    """
    Vault 전체 내용 검색

    Examples:
        GET /api/search?q=ontology
        GET /api/search?q=MH3&limit=10
        GET /api/search?q=Event&case_sensitive=true
    """
    vault_dir = get_vault_dir()
    results: List[SearchResult] = []

    # 정규식 패턴 컴파일
    flags = 0 if case_sensitive else re.IGNORECASE
    try:
        pattern = re.compile(re.escape(q), flags)
    except re.error:
        pattern = re.compile(re.escape(q), flags)

    # .md 파일만 검색
    for md_file in vault_dir.rglob("*.md"):
        # 제외 패턴 체크
        file_str = str(md_file)
        if any(exclude in file_str for exclude in EXCLUDE_PATTERNS):
            continue

        try:
            content = md_file.read_text(encoding="utf-8")
            matches = list(pattern.finditer(content))

            if matches:
                # 첫 번째 매치 주변 컨텍스트 추출
                first_match = matches[0]
                start = max(0, first_match.start() - 60)
                end = min(len(content), first_match.end() + 60)
                snippet = content[start:end]

                # 줄바꿈 정리
                snippet = snippet.replace("\n", " ").strip()
                if start > 0:
                    snippet = "..." + snippet
                if end < len(content):
                    snippet = snippet + "..."

                results.append(SearchResult(
                    path=str(md_file.relative_to(vault_dir)),
                    matches=len(matches),
                    snippet=snippet
                ))

        except (UnicodeDecodeError, PermissionError):
            # 읽을 수 없는 파일 스킵
            continue

        # limit 도달 시 중단
        if len(results) >= limit:
            break

    # 매치 수 기준 정렬 (많은 순)
    results.sort(key=lambda x: x.matches, reverse=True)

    return SearchResponse(
        query=q,
        count=len(results),
        results=results[:limit]
    )
