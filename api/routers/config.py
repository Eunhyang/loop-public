"""
Config API Router

설정 파일 조회 엔드포인트
- Impact Model Config (SSOT)
"""

from typing import Dict, Any
from fastapi import APIRouter

from ..utils.impact_calculator import load_impact_config

router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("/impact-model")
def get_impact_model_config() -> Dict[str, Any]:
    """
    Impact Model Config 조회 (SSOT)

    Returns:
        impact_model_config.yml 전체 내용

    Usage:
        - LLM 프롬프트에서 판단 기준 동적 로드
        - n8n 워크플로우에서 fetch하여 사용
        - 외부 클라이언트 참조용
    """
    return load_impact_config()
