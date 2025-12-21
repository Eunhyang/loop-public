"""
Strategy API Router

NorthStar, MetaHypothesis, ProductLine, PartnershipStage 조회 엔드포인트 (캐시 기반)
"""

from fastapi import APIRouter

from ..cache import get_cache

router = APIRouter(prefix="/api/strategy", tags=["strategy"])


@router.get("/northstar")
def get_northstar():
    """NorthStar (10년 비전) 조회 (캐시 기반)"""
    cache = get_cache()
    northstars = cache.get_all_northstars()
    return {"northstars": northstars}


@router.get("/metahypotheses")
def get_metahypotheses():
    """MetaHypothesis (MH1-4) 목록 조회 (캐시 기반)"""
    cache = get_cache()
    metahypotheses = cache.get_all_metahypotheses()
    return {"metahypotheses": metahypotheses}


@router.get("/productlines")
def get_productlines():
    """ProductLine (PL1-5) 목록 조회 (캐시 기반)"""
    cache = get_cache()
    productlines = cache.get_all_productlines()
    return {"productlines": productlines}


@router.get("/partnershipstages")
def get_partnershipstages():
    """PartnershipStage (Stage 1-4) 목록 조회 (캐시 기반)"""
    cache = get_cache()
    stages = cache.get_all_partnershipstages()
    return {"partnershipstages": stages}
