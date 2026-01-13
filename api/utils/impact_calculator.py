"""
Impact Calculator

A/B Score 계산 로직 (LLM 불필요, 공식 기반)
SSOT: impact_model_config.yml

Usage:
    from api.utils.impact_calculator import (
        calculate_expected_score,
        calculate_realized_score,
        calculate_window_fields,
        validate_contributes_weights
    )
"""

import yaml
from pathlib import Path
from datetime import datetime, date
from typing import Dict, List, Tuple, Optional, Any
from functools import lru_cache


@lru_cache(maxsize=1)
def load_impact_config() -> Dict[str, Any]:
    """Impact Model Config 로드 (캐싱)"""
    config_path = Path(__file__).parent.parent.parent / "impact_model_config.yml"
    if not config_path.exists():
        raise FileNotFoundError(f"impact_model_config.yml not found at {config_path}")

    with open(config_path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)


def calculate_expected_score_with_breakdown(
    tier: str,
    magnitude: str,
    confidence: float
) -> Dict[str, Any]:
    """
    Expected Score (A) 계산 with complete breakdown

    공식: ExpectedScore = magnitude_points[tier][magnitude] × confidence

    Args:
        tier: "strategic" | "enabling" | "operational"
        magnitude: "high" | "mid" | "low"
        confidence: 0.0 ~ 1.0

    Returns:
        Dict with keys:
            - score: float (final score)
            - tier_points: float (base points for tier/magnitude)
            - confidence: float (applied confidence)
            - tier: str (echoed input)
            - magnitude: str (echoed input)
            - formula: str (calculation formula)
            - max_score_by_tier: float (max possible for this tier)
            - normalized_10: float (score normalized to 0-10 scale)

    Raises:
        ValueError: 잘못된 tier 또는 magnitude
    """
    config = load_impact_config()
    magnitude_points = config.get("magnitude_points", {})

    if tier not in magnitude_points:
        raise ValueError(f"Invalid tier: {tier}. Valid: {list(magnitude_points.keys())}")

    if magnitude not in magnitude_points[tier]:
        raise ValueError(f"Invalid magnitude: {magnitude}. Valid: high, mid, low")

    # confidence 범위 검증
    confidence = max(0.0, min(1.0, confidence))

    tier_points = magnitude_points[tier][magnitude]
    score = tier_points * confidence

    # Calculate max possible for this tier
    max_score_by_tier = max(magnitude_points[tier].values())

    # Normalize to 0-10 scale
    normalized_10 = (score / max_score_by_tier) * 10 if max_score_by_tier > 0 else 0.0

    return {
        "score": score,
        "tier_points": tier_points,
        "confidence": confidence,
        "tier": tier,
        "magnitude": magnitude,
        "formula": f"{tier_points} × {confidence}",
        "max_score_by_tier": max_score_by_tier,
        "normalized_10": round(normalized_10, 2)
    }


def calculate_expected_score(
    tier: str,
    magnitude: str,
    confidence: float
) -> float:
    """
    Expected Score (A) 계산 - Legacy wrapper for backward compatibility

    DEPRECATED: Use calculate_expected_score_with_breakdown() for full details.
    This function is maintained for existing callers in projects.py, autofill.py, ai.py.

    공식: ExpectedScore = magnitude_points[tier][magnitude] × confidence

    Args:
        tier: "strategic" | "enabling" | "operational"
        magnitude: "high" | "mid" | "low"
        confidence: 0.0 ~ 1.0

    Returns:
        Expected Score (float)

    Raises:
        ValueError: 잘못된 tier 또는 magnitude
    """
    result = calculate_expected_score_with_breakdown(tier, magnitude, confidence)
    return result["score"]


def calculate_realized_score(
    normalized_delta: float,
    evidence_strength: str,
    attribution_share: float = 1.0
) -> float:
    """
    Realized Score (B) 계산

    공식: RealizedScore = normalized_delta × strength_mult × attribution_share

    Args:
        normalized_delta: 0.0 ~ 1.0 (목표 대비 달성률)
        evidence_strength: "strong" | "medium" | "weak"
        attribution_share: 0.0 ~ 1.0 (기여 비율)

    Returns:
        Realized Score (float)

    Raises:
        ValueError: 잘못된 evidence_strength
    """
    config = load_impact_config()
    strength_multipliers = config.get("strength_multipliers", {})

    if evidence_strength not in strength_multipliers:
        raise ValueError(
            f"Invalid evidence_strength: {evidence_strength}. "
            f"Valid: {list(strength_multipliers.keys())}"
        )

    # 범위 검증
    normalized_delta = max(0.0, min(1.0, normalized_delta))
    attribution_share = max(0.0, min(1.0, attribution_share))

    strength_mult = strength_multipliers[evidence_strength]
    return normalized_delta * strength_mult * attribution_share


def calculate_window_fields(
    decided_date: Optional[str] = None,
    entity_type: str = "project"
) -> Dict[str, str]:
    """
    Evaluation Window 필드 자동 계산

    Args:
        decided_date: "YYYY-MM-DD" 형식 또는 None (today 사용)
        entity_type: "project" | "track" | "condition"

    Returns:
        {
            "window_id": "2025-12" | "2025-Q4" | "2025-H2",
            "time_range": "2025-12-01..2025-12-31"
        }
    """
    config = load_impact_config()
    windows_config = config.get("evaluation_windows", {}).get("defaults", {})

    # 기준 날짜 결정
    if decided_date:
        try:
            base_date = datetime.strptime(decided_date, "%Y-%m-%d").date()
        except ValueError:
            base_date = date.today()
    else:
        base_date = date.today()

    year = base_date.year
    month = base_date.month

    # entity_type별 period 결정
    entity_config = windows_config.get(entity_type, windows_config.get("project", {}))
    period = entity_config.get("period", "month")

    if period == "month":
        window_id = f"{year}-{month:02d}"
        # 월의 마지막 날 계산
        if month == 12:
            last_day = 31
        else:
            next_month = date(year, month + 1, 1)
            last_day = (next_month - date(year, month, 1)).days
        time_range = f"{year}-{month:02d}-01..{year}-{month:02d}-{last_day:02d}"

    elif period == "quarter":
        quarter = (month - 1) // 3 + 1
        window_id = f"{year}-Q{quarter}"
        quarter_starts = {1: (1, 1), 2: (4, 1), 3: (7, 1), 4: (10, 1)}
        quarter_ends = {1: (3, 31), 2: (6, 30), 3: (9, 30), 4: (12, 31)}
        start = quarter_starts[quarter]
        end = quarter_ends[quarter]
        time_range = f"{year}-{start[0]:02d}-{start[1]:02d}..{year}-{end[0]:02d}-{end[1]:02d}"

    elif period == "half":
        half = 1 if month <= 6 else 2
        window_id = f"{year}-H{half}"
        if half == 1:
            time_range = f"{year}-01-01..{year}-06-30"
        else:
            time_range = f"{year}-07-01..{year}-12-31"

    else:
        # fallback to month
        window_id = f"{year}-{month:02d}"
        time_range = f"{year}-{month:02d}-01..{year}-{month:02d}-28"

    return {
        "window_id": window_id,
        "time_range": time_range
    }


def validate_contributes_weights(
    contributes: List[Dict[str, Any]]
) -> Tuple[bool, List[Dict[str, Any]], List[str]]:
    """
    contributes 배열의 weight 합계 검증 및 자동 정규화

    Args:
        contributes: [{"condition_id": "cond-a", "weight": 0.5}, ...]

    Returns:
        (is_valid, normalized_contributes, warnings)
        - is_valid: True if weights are valid
        - normalized_contributes: 정규화된 배열 (합계 > 1.0이면 조정)
        - warnings: 경고 메시지 목록
    """
    config = load_impact_config()
    weight_sum_max = config.get("validation", {}).get("project", {}).get(
        "contributes_rules", {}
    ).get("weight_sum_max", 1.0)

    warnings = []

    if not contributes:
        return True, [], []

    # weight 합계 계산
    total_weight = sum(c.get("weight", 0.0) for c in contributes)

    if total_weight <= weight_sum_max:
        return True, contributes, []

    # 정규화 필요
    warnings.append(
        f"contributes weight 합계({total_weight:.2f})가 {weight_sum_max}를 초과하여 "
        f"자동 정규화되었습니다."
    )

    normalized = []
    for c in contributes:
        new_c = c.copy()
        new_c["weight"] = round(c.get("weight", 0.0) / total_weight * weight_sum_max, 3)
        normalized.append(new_c)

    return False, normalized, warnings


def map_realized_status_to_verdict(realized_status: str) -> Dict[str, Optional[str]]:
    """
    realized_status를 verdict/outcome으로 변환

    Args:
        realized_status: "succeeded" | "failed_but_high_signal" | etc.

    Returns:
        {"verdict": "go"|"no-go"|"pivot"|"pending", "outcome": "supported"|...}
    """
    config = load_impact_config()
    status_mapping = config.get("status_mapping", {})

    if realized_status not in status_mapping:
        return {"verdict": None, "outcome": None}

    mapping = status_mapping[realized_status]
    return {
        "verdict": mapping.get("verdict"),
        "outcome": mapping.get("outcome")
    }


def get_strength_multiplier(evidence_strength: str) -> float:
    """evidence_strength의 multiplier 반환"""
    config = load_impact_config()
    return config.get("strength_multipliers", {}).get(evidence_strength, 0.7)


def get_magnitude_points(tier: str, magnitude: str) -> float:
    """tier/magnitude의 base points 반환"""
    config = load_impact_config()
    return config.get("magnitude_points", {}).get(tier, {}).get(magnitude, 0.0)
