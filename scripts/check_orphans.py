#!/usr/bin/env python3
"""
LOOP Vault Orphan Checker v3.2
고아 엔티티(끊어진 링크)를 검사합니다.
"""

import os
import re
import sys
import yaml
from pathlib import Path
from typing import Dict, List, Set, Optional
from collections import defaultdict

# === 설정 ===
INCLUDE_PATHS = [
    "01_North_Star",
    "20_Strategy",
    "50_Projects",
    "60_Hypotheses",
    "70_Experiments",
]


def extract_frontmatter(content: str) -> Optional[Dict]:
    """마크다운에서 YAML frontmatter 추출"""
    match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if match:
        try:
            return yaml.safe_load(match.group(1))
        except yaml.YAMLError:
            return None
    return None


def collect_entities(vault_root: Path) -> Dict[str, Dict]:
    """모든 엔티티 수집"""
    entities = {}

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
        if frontmatter and "entity_id" in frontmatter:
            entity_id = frontmatter["entity_id"]
            entities[entity_id] = {
                "filepath": filepath,
                "frontmatter": frontmatter
            }

    return entities


def check_orphans(entities: Dict[str, Dict]) -> List[str]:
    """고아 엔티티 검사"""
    warnings = []
    all_ids = set(entities.keys())

    for entity_id, data in entities.items():
        fm = data["frontmatter"]
        filepath = data["filepath"]

        # parent_id 검사
        parent_id = fm.get("parent_id")
        if parent_id and parent_id not in all_ids:
            warnings.append(f"{entity_id}: parent_id '{parent_id}' does not exist")

        # project_id 검사 (Task)
        project_id = fm.get("project_id")
        if project_id and project_id not in all_ids:
            warnings.append(f"{entity_id}: project_id '{project_id}' does not exist")

        # hypothesis_id 검사 (Experiment)
        hypothesis_id = fm.get("hypothesis_id")
        if hypothesis_id and hypothesis_id not in all_ids:
            warnings.append(f"{entity_id}: hypothesis_id '{hypothesis_id}' does not exist")

        # validates 검사
        validates = fm.get("validates", [])
        if isinstance(validates, list):
            for v in validates:
                if isinstance(v, str) and v not in all_ids:
                    warnings.append(f"{entity_id}: validates target '{v}' does not exist")

        # outgoing_relations 검사
        relations = fm.get("outgoing_relations", [])
        if isinstance(relations, list):
            for rel in relations:
                if isinstance(rel, dict):
                    target = rel.get("target_id")
                    if target and target not in all_ids:
                        # action: 같은 특수 타겟은 스킵
                        if not target.startswith("action:"):
                            warnings.append(f"{entity_id}: relation target '{target}' does not exist")

    return warnings


def check_symmetric_links(entities: Dict[str, Dict]) -> List[str]:
    """validates/validated_by 대칭성 검사"""
    warnings = []

    # validates 관계 수집
    validates_map = defaultdict(set)  # entity -> set of hypotheses it validates
    validated_by_map = defaultdict(set)  # hypothesis -> set of entities validating it

    for entity_id, data in entities.items():
        fm = data["frontmatter"]

        # validates 수집
        validates = fm.get("validates", [])
        if isinstance(validates, list):
            for v in validates:
                if isinstance(v, str):
                    validates_map[entity_id].add(v)

        # validated_by 수집
        validated_by = fm.get("validated_by", [])
        if isinstance(validated_by, list):
            for v in validated_by:
                if isinstance(v, str):
                    validated_by_map[entity_id].add(v)

    # 대칭성 검사: A.validates contains B -> B.validated_by should contain A
    for entity_id, targets in validates_map.items():
        for target in targets:
            if target in entities:
                if entity_id not in validated_by_map.get(target, set()):
                    warnings.append(
                        f"Asymmetric link: {entity_id} validates {target}, "
                        f"but {target}.validated_by doesn't include {entity_id}"
                    )

    return warnings


def main(vault_path: str) -> int:
    """메인 함수"""
    vault_root = Path(vault_path).resolve()

    if not vault_root.exists():
        print(f"Error: Vault path does not exist: {vault_root}")
        return 1

    print("Collecting entities...")
    entities = collect_entities(vault_root)
    print(f"Found {len(entities)} entities")

    print("\nChecking orphans...")
    orphan_warnings = check_orphans(entities)

    print("Checking symmetric links...")
    symmetric_warnings = check_symmetric_links(entities)

    # 결과 출력
    all_warnings = orphan_warnings + symmetric_warnings

    print(f"\n=== Orphan Check Report ===")
    print(f"Entities checked: {len(entities)}")
    print(f"Warnings: {len(all_warnings)}")

    if all_warnings:
        print(f"\n--- Warnings ---")
        for warning in all_warnings:
            print(f"  - {warning}")
        # 경고만 출력, 커밋 차단은 하지 않음 (원하면 return 1로 변경)
        return 0

    print("\nNo orphans found!")
    return 0


if __name__ == "__main__":
    vault_path = sys.argv[1] if len(sys.argv) > 1 else "."
    sys.exit(main(vault_path))
