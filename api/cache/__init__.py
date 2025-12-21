"""
Vault Cache Module

싱글톤 패턴으로 VaultCache 인스턴스 제공.
서버 시작 시 한 번만 초기화되고, 이후 동일 인스턴스 재사용.

Usage:
    from api.cache import get_cache

    cache = get_cache()
    task = cache.get_task("tsk-001-01")
    tasks = cache.get_all_tasks(status="doing")
"""

from typing import Optional
from pathlib import Path

from .vault_cache import VaultCache, CacheEntry

# 싱글톤 인스턴스
_cache_instance: Optional[VaultCache] = None


def get_cache() -> VaultCache:
    """
    VaultCache 싱글톤 인스턴스 반환

    첫 호출 시 초기화, 이후 동일 인스턴스 반환.
    """
    global _cache_instance

    if _cache_instance is None:
        # 늦은 import로 순환 참조 방지
        from ..utils.vault_utils import get_vault_dir
        vault_path = get_vault_dir()
        _cache_instance = VaultCache(vault_path)

    return _cache_instance


def init_cache(vault_path: Optional[Path] = None) -> VaultCache:
    """
    캐시 명시적 초기화 (테스트용)

    Args:
        vault_path: Vault 경로 (None이면 자동 감지)
    """
    global _cache_instance

    if vault_path is None:
        from ..utils.vault_utils import get_vault_dir
        vault_path = get_vault_dir()

    _cache_instance = VaultCache(vault_path)
    return _cache_instance


def reset_cache() -> None:
    """캐시 리셋 (테스트용)"""
    global _cache_instance
    _cache_instance = None


__all__ = [
    'VaultCache',
    'CacheEntry',
    'get_cache',
    'init_cache',
    'reset_cache'
]
