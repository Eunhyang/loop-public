"""
Track API Router

Track 조회 엔드포인트 (캐시 기반)
"""

from typing import Optional
from fastapi import APIRouter, HTTPException

from ..cache import get_cache

router = APIRouter(prefix="/api/tracks", tags=["tracks"])


@router.get("")
def get_tracks():
    """Track 목록 조회 (캐시 기반)"""
    cache = get_cache()
    tracks = cache.get_all_tracks()
    return {"tracks": tracks}


@router.get("/{track_id}")
def get_track(track_id: str):
    """개별 Track 조회"""
    cache = get_cache()
    track = cache.get_track(track_id)

    if not track:
        raise HTTPException(status_code=404, detail=f"Track not found: {track_id}")

    return {"track": track}
