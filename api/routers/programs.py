"""
Program API Router

Program 조회 엔드포인트 (캐시 기반)
"""

from fastapi import APIRouter, HTTPException

from ..cache import get_cache

router = APIRouter(prefix="/api/programs", tags=["programs"])


@router.get("")
def get_programs():
    """Program 목록 조회 (캐시 기반)"""
    cache = get_cache()
    programs = cache.get_all_programs()
    return {"programs": programs}


@router.get("/{program_id}")
def get_program(program_id: str):
    """개별 Program 조회"""
    cache = get_cache()
    program = cache.get_program(program_id)

    if not program:
        raise HTTPException(status_code=404, detail=f"Program not found: {program_id}")

    return {"program": program}
