"""
Impact Expected Index Adapter

Adapter for cache entity lookups (fixes Codex Issue #1).
Converts cache List[Dict] to indexed dict for O(1) validation.

Created: 2026-01-13
Task: tsk-000gpt-1768293098555
"""

from typing import Dict
from ..cache import get_cache


def get_entity_index() -> Dict[str, Dict[str, bool]]:
    """
    Adapter for cache entity lookups.

    Converts cache List[Dict] responses to indexed dicts for fast validation.

    Returns:
        {
            "hypotheses": {"hyp-001": True, "hyp-3-01": True, ...},
            "conditions": {"cond-a": True, "cond-e": True, ...},
            "tracks": {"trk-2": True, "trk-6": True, ...}
        }

    Edge cases:
        - Empty cache list → returns {}
        - Missing entity_id → skips that item
    """
    cache = get_cache()

    # Cache returns List[Dict], convert to entity_id index
    hypotheses_index = {}
    for h in cache.get_all_hypotheses():
        if 'entity_id' in h:
            hypotheses_index[h['entity_id']] = True

    conditions_index = {}
    for c in cache.get_all_conditions():
        if 'entity_id' in c:
            conditions_index[c['entity_id']] = True

    tracks_index = {}
    for t in cache.get_all_tracks():
        if 'entity_id' in t:
            tracks_index[t['entity_id']] = True

    return {
        'hypotheses': hypotheses_index,
        'conditions': conditions_index,
        'tracks': tracks_index
    }
