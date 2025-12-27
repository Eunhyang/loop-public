#!/usr/bin/env python3
"""
LOOP Vault Impact Score Builder v1.0

Project별 Expected/Realized Impact 점수를 계산합니다.
출력: _build/impact.json

계산 공식:
- ExpectedScore = magnitude_points[tier][magnitude] × confidence
- RealizedScore = Σ(normalized_delta × strength_mult × attribution_share)

Usage:
    python3 scripts/build_impact.py .
"""

import os
import re
import sys
import json
import yaml
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime
from collections import defaultdict

# === 기본 설정 (impact_model_config.yml 없을 경우) ===
DEFAULT_MAGNITUDE_POINTS = {
    "strategic": {"high": 10, "mid": 6, "low": 3},
    "enabling": {"high": 5, "mid": 3, "low": 1.5},
    "operational": {"high": 2, "mid": 1, "low": 0.5},
}

DEFAULT_STRENGTH_MULTIPLIERS = {
    "strong": 1.0,
    "medium": 0.7,
    "weak": 0.4,
}

# Impact 모델 버전 (점수 변경 추적용)
IMPACT_MODEL_VERSION = "IM-2025-01"

# Tier별 계산 정책
TIER_POLICY = {
    "strategic": {
        "calculate_expected": True,
        "calculate_realized": True,
        "include_in_rollup": True,
    },
    "enabling": {
        "calculate_expected": True,
        "calculate_realized": True,  # light realized (evidence 선택적)
        "include_in_rollup": True,
    },
    "operational": {
        "calculate_expected": False,  # Impact 계산 제외
        "calculate_realized": False,
        "include_in_rollup": False,
    },
}

# 스캔 경로
INCLUDE_PATHS = ["50_Projects"]


def load_config(vault_root: Path) -> Dict:
    """impact_model_config.yml 로드"""
    config_path = vault_root / "impact_model_config.yml"

    if config_path.exists():
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                config = yaml.safe_load(f)
                return config
        except Exception as e:
            print(f"Warning: Failed to load config: {e}")

    # 기본값 반환
    return {
        "magnitude_points": DEFAULT_MAGNITUDE_POINTS,
        "strength_multipliers": DEFAULT_STRENGTH_MULTIPLIERS,
    }


def extract_frontmatter(content: str) -> Optional[Dict]:
    """마크다운에서 YAML frontmatter 추출"""
    match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if match:
        try:
            return yaml.safe_load(match.group(1))
        except yaml.YAMLError:
            return None
    return None


def collect_projects(vault_root: Path) -> Dict[str, Dict]:
    """모든 Project 엔티티 수집"""
    projects = {}

    for filepath in vault_root.rglob("*.md"):
        relative = str(filepath.relative_to(vault_root))

        # 포함 경로 체크
        should_include = any(relative.startswith(inc) for inc in INCLUDE_PATHS)
        if not should_include:
            continue

        # 템플릿 제외
        if "_TEMPLATES" in relative:
            continue

        try:
            content = filepath.read_text(encoding="utf-8")
        except Exception:
            continue

        frontmatter = extract_frontmatter(content)
        if frontmatter and frontmatter.get("entity_type") == "Project":
            entity_id = frontmatter.get("entity_id")
            if entity_id:
                projects[entity_id] = {
                    "filepath": filepath,
                    "relative_path": relative,
                    "frontmatter": frontmatter,
                }

    return projects


def collect_evidence(vault_root: Path) -> Dict[str, List[Dict]]:
    """Project별 Evidence 수집"""
    evidence_map = defaultdict(list)

    for filepath in vault_root.rglob("*.md"):
        relative = str(filepath.relative_to(vault_root))

        # 포함 경로 체크
        should_include = any(relative.startswith(inc) for inc in INCLUDE_PATHS)
        if not should_include:
            continue

        try:
            content = filepath.read_text(encoding="utf-8")
        except Exception:
            continue

        frontmatter = extract_frontmatter(content)
        if frontmatter and frontmatter.get("entity_type") == "Evidence":
            project_id = frontmatter.get("project")
            if project_id:
                evidence_map[project_id].append({
                    "id": frontmatter.get("entity_id", ""),
                    "summary": frontmatter.get("summary", ""),
                    "normalized_delta": frontmatter.get("normalized_delta", 0),
                    "evidence_strength": frontmatter.get("evidence_strength", "medium"),
                    "attribution_share": frontmatter.get("attribution_share", 1.0),
                    "created": frontmatter.get("created", ""),
                })

    return dict(evidence_map)


def calculate_expected_score(
    tier: str,
    magnitude: str,
    confidence: float,
    magnitude_points: Dict,
) -> float:
    """Expected Score (A) 계산

    ExpectedScore = magnitude_points[tier][magnitude] × confidence
    """
    # tier 기본값
    if tier not in magnitude_points:
        tier = "enabling"

    tier_points = magnitude_points.get(tier, {})

    # magnitude 기본값
    if magnitude not in tier_points:
        magnitude = "mid"

    points = tier_points.get(magnitude, 3)
    score = points * confidence

    return round(score, 2)


def calculate_realized_score(
    evidence_list: List[Dict],
    strength_multipliers: Dict,
) -> tuple[float, int]:
    """Realized Score (B) 계산

    RealizedScore = Σ(normalized_delta × strength_mult × attribution_share)
    """
    if not evidence_list:
        return 0.0, 0

    total_score = 0.0

    for ev in evidence_list:
        delta = ev.get("normalized_delta", 0)
        strength = ev.get("evidence_strength", "medium")
        attribution = ev.get("attribution_share", 1.0)

        strength_mult = strength_multipliers.get(strength, 0.7)
        score = delta * strength_mult * attribution
        total_score += score

    return round(total_score, 2), len(evidence_list)


def build_project_impact(
    project_id: str,
    project_data: Dict,
    evidence_list: List[Dict],
    config: Dict,
) -> Dict:
    """단일 Project의 Impact 레코드 생성"""
    fm = project_data["frontmatter"]

    # 필드 추출
    tier = fm.get("tier", "enabling")
    magnitude = fm.get("impact_magnitude", "mid")
    confidence = fm.get("confidence", 0.7)

    # v5.1: condition_contributes 사용 (기존 contributes 호환)
    condition_contributes = fm.get("condition_contributes", [])
    if not condition_contributes:
        # 기존 contributes 필드에서 condition만 추출 (마이그레이션 호환)
        old_contributes = fm.get("contributes", [])
        condition_contributes = [c for c in old_contributes if isinstance(c, dict) and c.get("type") == "condition"]
        # type 없으면 모두 condition으로 간주
        if not condition_contributes:
            condition_contributes = [c for c in old_contributes if isinstance(c, dict)]

    track_contributes = fm.get("track_contributes", [])
    parent_id = fm.get("parent_id", "")  # Primary Track
    realized_status = fm.get("realized_status", "planned")

    # Tier 정책 조회
    policy = TIER_POLICY.get(tier, TIER_POLICY["enabling"])

    # 점수 계산 (Tier 정책에 따라)
    magnitude_points = config.get("magnitude_points", DEFAULT_MAGNITUDE_POINTS)
    strength_multipliers = config.get("strength_multipliers", DEFAULT_STRENGTH_MULTIPLIERS)

    if policy["calculate_expected"]:
        expected_score = calculate_expected_score(
            tier, magnitude, confidence, magnitude_points
        )
    else:
        expected_score = 0.0  # operational tier는 Impact 계산 제외

    if policy["calculate_realized"]:
        realized_score, evidence_count = calculate_realized_score(
            evidence_list, strength_multipliers
        )
    else:
        realized_score = 0.0
        evidence_count = len(evidence_list)  # 개수는 기록

    # Impact 레코드
    record = {
        "id": project_id,
        "name": fm.get("entity_name", ""),
        "path": project_data["relative_path"],

        # Impact 입력값
        "tier": tier,
        "impact_magnitude": magnitude,
        "confidence": confidence,

        # Condition 기여 (v5.1: contributes → condition_contributes)
        "condition_contributes": condition_contributes,

        # Track 기여 (v5.1: 신규)
        "primary_track": parent_id,  # 암묵적 weight 1.0
        "track_contributes": track_contributes,  # Secondary Track 기여

        # 계산된 점수
        "expected_score": expected_score,
        "realized_score": realized_score,
        "realized_status": realized_status,

        # Tier 정책
        "impact_excluded": not policy["calculate_expected"],

        # Evidence 통계
        "evidence_count": evidence_count,

        # 추가 메타데이터
        "owner": fm.get("owner", ""),
        "status": fm.get("status", ""),
    }

    return record


def calculate_condition_rollup(
    project_records: List[Dict],
) -> Dict[str, Dict]:
    """Condition별 롤업 계산 (Tier 정책 적용)

    v5.1: contributes → condition_contributes
    """
    rollup = defaultdict(lambda: {
        "expected_sum": 0.0,
        "realized_sum": 0.0,
        "project_count": 0,
        "projects": [],
        "excluded_projects": [],  # operational tier 등 제외된 프로젝트
        "tier_distribution": {"strategic": 0, "enabling": 0, "operational": 0},
    })

    for project in project_records:
        # v5.1: condition_contributes 사용
        condition_contributes = project.get("condition_contributes", [])
        tier = project.get("tier", "enabling")
        policy = TIER_POLICY.get(tier, TIER_POLICY["enabling"])

        for c in condition_contributes:
            if not isinstance(c, dict):
                continue

            cond_id = c.get("to", "")
            weight = c.get("weight", 0)

            if not cond_id:
                continue

            # Tier 분포 (모든 프로젝트 카운트)
            if tier in rollup[cond_id]["tier_distribution"]:
                rollup[cond_id]["tier_distribution"][tier] += 1

            # Rollup 포함 여부 체크
            if not policy["include_in_rollup"]:
                rollup[cond_id]["excluded_projects"].append({
                    "id": project["id"],
                    "name": project["name"],
                    "tier": tier,
                    "reason": "operational tier excluded from rollup",
                })
                continue

            # 가중 점수 합산 (strategic, enabling만)
            rollup[cond_id]["expected_sum"] += project["expected_score"] * weight
            rollup[cond_id]["realized_sum"] += project["realized_score"] * weight
            rollup[cond_id]["project_count"] += 1
            rollup[cond_id]["projects"].append({
                "id": project["id"],
                "name": project["name"],
                "tier": tier,
                "weight": weight,
                "expected": project["expected_score"],
                "realized": project["realized_score"],
            })

    # 반올림
    for cond_id in rollup:
        rollup[cond_id]["expected_sum"] = round(rollup[cond_id]["expected_sum"], 2)
        rollup[cond_id]["realized_sum"] = round(rollup[cond_id]["realized_sum"], 2)

    return dict(rollup)


def calculate_track_rollup(
    project_records: List[Dict],
) -> Dict[str, Dict]:
    """Track별 롤업 계산 (v5.1 신규)

    Primary Track: parent_id (암묵적 weight 1.0)
    Secondary Track: track_contributes 필드
    """
    rollup = defaultdict(lambda: {
        "expected_sum": 0.0,
        "realized_sum": 0.0,
        "primary_projects": [],    # 이 Track이 Primary인 프로젝트
        "secondary_projects": [],  # 이 Track에 Secondary 기여하는 프로젝트
        "tier_distribution": {"strategic": 0, "enabling": 0, "operational": 0},
    })

    for project in project_records:
        primary_track = project.get("primary_track", "")
        track_contributes = project.get("track_contributes", [])
        tier = project.get("tier", "enabling")
        policy = TIER_POLICY.get(tier, TIER_POLICY["enabling"])

        # Primary Track 처리 (암묵적 weight 1.0)
        if primary_track:
            if tier in rollup[primary_track]["tier_distribution"]:
                rollup[primary_track]["tier_distribution"][tier] += 1

            if policy["include_in_rollup"]:
                # Primary Track은 weight 1.0으로 전체 점수 기여
                rollup[primary_track]["expected_sum"] += project["expected_score"]
                rollup[primary_track]["realized_sum"] += project["realized_score"]
                rollup[primary_track]["primary_projects"].append({
                    "id": project["id"],
                    "name": project["name"],
                    "tier": tier,
                    "weight": 1.0,  # 암묵적
                    "expected": project["expected_score"],
                    "realized": project["realized_score"],
                })

        # Secondary Track 처리
        for tc in track_contributes:
            if not isinstance(tc, dict):
                continue

            track_id = tc.get("to", "")
            weight = tc.get("weight", 0)

            if not track_id:
                continue

            if policy["include_in_rollup"]:
                rollup[track_id]["expected_sum"] += project["expected_score"] * weight
                rollup[track_id]["realized_sum"] += project["realized_score"] * weight
                rollup[track_id]["secondary_projects"].append({
                    "id": project["id"],
                    "name": project["name"],
                    "tier": tier,
                    "weight": weight,
                    "expected": project["expected_score"],
                    "realized": project["realized_score"],
                })

    # 반올림
    for track_id in rollup:
        rollup[track_id]["expected_sum"] = round(rollup[track_id]["expected_sum"], 2)
        rollup[track_id]["realized_sum"] = round(rollup[track_id]["realized_sum"], 2)

    return dict(rollup)


def main(vault_path: str) -> int:
    """메인 함수"""
    vault_root = Path(vault_path).resolve()

    if not vault_root.exists():
        print(f"Error: Vault path does not exist: {vault_root}")
        return 1

    print("Loading config...")
    config = load_config(vault_root)

    print("Collecting projects...")
    projects = collect_projects(vault_root)
    print(f"Found {len(projects)} projects")

    print("Collecting evidence...")
    evidence_map = collect_evidence(vault_root)
    print(f"Found evidence for {len(evidence_map)} projects")

    print("Calculating impact scores...")
    project_records = []

    for project_id, project_data in projects.items():
        evidence_list = evidence_map.get(project_id, [])
        record = build_project_impact(project_id, project_data, evidence_list, config)
        project_records.append(record)

    # 정렬 (expected_score 내림차순)
    project_records.sort(key=lambda x: x["expected_score"], reverse=True)

    print("Calculating condition rollup...")
    condition_rollup = calculate_condition_rollup(project_records)

    print("Calculating track rollup...")
    track_rollup = calculate_track_rollup(project_records)

    # 통계
    total_expected = sum(p["expected_score"] for p in project_records)
    total_realized = sum(p["realized_score"] for p in project_records)
    with_impact = len([p for p in project_records if p.get("condition_contributes")])

    # operational 제외 통계
    excluded_count = len([p for p in project_records if p.get("impact_excluded")])

    # 최종 결과
    impact_data = {
        "model_version": IMPACT_MODEL_VERSION,  # Impact 모델 버전 (점수 변경 추적용)
        "generated": datetime.now().isoformat(),
        "script_version": "1.2.0",  # v5.1: condition_contributes + track_contributes

        # 전체 통계
        "summary": {
            "total_projects": len(project_records),
            "projects_with_impact": with_impact,
            "projects_excluded": excluded_count,  # operational tier 등 제외된 수
            "total_expected": round(total_expected, 2),
            "total_realized": round(total_realized, 2),
            "total_evidence": sum(p["evidence_count"] for p in project_records),
        },

        # Project별 Impact
        "projects": project_records,

        # Condition별 롤업
        "conditions": condition_rollup,

        # Track별 롤업 (v5.1 신규)
        "tracks": track_rollup,

        # 사용된 설정
        "config": {
            "magnitude_points": config.get("magnitude_points", DEFAULT_MAGNITUDE_POINTS),
            "strength_multipliers": config.get("strength_multipliers", DEFAULT_STRENGTH_MULTIPLIERS),
        },
    }

    # 저장
    build_dir = vault_root / "_build"
    build_dir.mkdir(exist_ok=True)

    impact_path = build_dir / "impact.json"
    with open(impact_path, "w", encoding="utf-8") as f:
        json.dump(impact_data, f, indent=2, ensure_ascii=False)
    print(f"Saved: {impact_path}")

    # 결과 출력
    print(f"\n=== Impact Summary ===")
    print(f"Total Projects: {len(project_records)}")
    print(f"Projects with Impact: {with_impact}")
    print(f"Total Expected Score: {total_expected:.2f}")
    print(f"Total Realized Score: {total_realized:.2f}")
    print(f"Conditions with rollup: {len(condition_rollup)}")
    print(f"Tracks with rollup: {len(track_rollup)}")

    if project_records:
        print(f"\n=== Top 5 Projects by Expected Score ===")
        for p in project_records[:5]:
            print(f"  {p['id']}: {p['name'][:30]} - Expected: {p['expected_score']}")

    return 0


if __name__ == "__main__":
    vault_path = sys.argv[1] if len(sys.argv) > 1 else "."
    sys.exit(main(vault_path))
