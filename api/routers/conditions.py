"""
Condition API Router

3-Year Conditions 조회 엔드포인트 (캐시 기반)
"""

from typing import Optional
from fastapi import APIRouter, HTTPException

from ..cache import get_cache

router = APIRouter(prefix="/api/conditions", tags=["conditions"])


@router.get("")
def get_conditions():
    """Condition 목록 조회 (캐시 기반)"""
    cache = get_cache()
    conditions = cache.get_all_conditions()
    return {"conditions": conditions}


@router.get("/{condition_id}")
def get_condition(condition_id: str):
    """개별 Condition 조회"""
    cache = get_cache()
    condition = cache.get_condition(condition_id)

    if not condition:
        raise HTTPException(status_code=404, detail=f"Condition not found: {condition_id}")

    return {"condition": condition}
