#!/usr/bin/env python3
"""
LOOP Vault conditions_3y Backfill Script v1.0
기존 Task/Project/Track에 conditions_3y 필드를 추가합니다.

매핑 로직:
- parent Track에서 conditions_3y를 파생
- Track이 없으면 기본 매핑 사용

Track → Condition 기본 매핑:
- trk:1 (Product) → cond:a
- trk:2 (Data) → cond:b
- trk:3 (Content) → cond:a
- trk:4 (Coaching) → cond:b, cond:d
- trk:5 (Partnership) → cond:c, cond:d
- trk:6 (Revenue) → cond:e
"""

import os
import re
import sys
import yaml
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Track → Conditions 기본 매핑
TRACK_TO_CONDITIONS = {
    "trk:1": ["cond:a"],
    "trk:2": ["cond:b"],
    "trk:3": ["cond:a"],
    "trk:4": ["cond:b", "cond:d"],
    "trk:5": ["cond:c", "cond:d"],
    "trk:6": ["cond:e"],
}

# 기본값 (Track을 찾을 수 없을 때)
DEFAULT_CONDITIONS = ["cond:b"]

INCLUDE_PATHS = [
    "20_Strategy",
    "50_Projects",
]


def extract_frontmatter(content: str) -> Tuple[Optional[Dict], str, str]:
    """마크다운에서 YAML frontmatter 추출, 원본 섹션 반환"""
    match = re.match(r'^(---\s*\n)(.*?)(\n---)', content, re.DOTALL)
    if match:
        try:
            fm = yaml.safe_load(match.group(2))
            return fm, match.group(0), match.group(2)
        except yaml.YAMLError:
            return None, "", ""
    return None, "", ""


def collect_entities(vault_root: Path) -> Dict[str, Dict]:
    """모든 엔티티 수집"""
    entities = {}

    for filepath in vault_root.rglob("*.md"):
        relative = str(filepath.relative_to(vault_root))

        should_include = any(relative.startswith(inc) for inc in INCLUDE_PATHS)
        if not should_include:
            continue

        # _INDEX.md 스킵
        if filepath.name == "_INDEX.md":
            continue

        try:
            content = filepath.read_text(encoding="utf-8")
        except Exception:
            continue

        fm, fm_section, fm_raw = extract_frontmatter(content)
        if fm and "entity_id" in fm:
            entity_id = fm["entity_id"]
            entities[entity_id] = {
                "filepath": filepath,
                "content": content,
                "frontmatter": fm,
                "fm_section": fm_section,
                "fm_raw": fm_raw,
            }

    return entities


def find_track_for_entity(entity_id: str, entities: Dict[str, Dict]) -> Optional[str]:
    """엔티티의 상위 Track ID 찾기"""
    if entity_id not in entities:
        return None

    data = entities[entity_id]
    fm = data["frontmatter"]
    entity_type = fm.get("entity_type")

    # Track인 경우 자기 자신 반환
    if entity_type == "Track":
        return entity_id

    # parent_id를 따라 올라가서 Track 찾기
    parent_id = fm.get("parent_id")
    if parent_id:
        return find_track_for_entity(parent_id, entities)

    # project_id로도 시도 (Task의 경우)
    project_id = fm.get("project_id")
    if project_id:
        return find_track_for_entity(project_id, entities)

    return None


def get_conditions_for_entity(entity_id: str, entities: Dict[str, Dict]) -> List[str]:
    """엔티티에 적합한 conditions_3y 값 결정"""
    track_id = find_track_for_entity(entity_id, entities)

    if track_id and track_id in TRACK_TO_CONDITIONS:
        return TRACK_TO_CONDITIONS[track_id]

    return DEFAULT_CONDITIONS


def add_conditions_3y_to_frontmatter(fm_raw: str, conditions: List[str]) -> str:
    """frontmatter YAML에 conditions_3y 필드 추가"""
    # 이미 있으면 스킵
    if "conditions_3y:" in fm_raw:
        return fm_raw

    # YAML 형식으로 추가
    conditions_yaml = f'conditions_3y: {conditions}'

    # 적절한 위치에 삽입 (tags: 앞에)
    if "tags:" in fm_raw:
        fm_raw = fm_raw.replace("tags:", f"{conditions_yaml}\ntags:")
    elif "priority_flag:" in fm_raw:
        fm_raw = fm_raw.replace("priority_flag:", f"{conditions_yaml}\npriority_flag:")
    else:
        # 끝에 추가
        fm_raw = fm_raw.rstrip() + f"\n{conditions_yaml}"

    return fm_raw


def backfill_entity(entity_id: str, entities: Dict[str, Dict], dry_run: bool = True) -> bool:
    """단일 엔티티에 conditions_3y 백필"""
    data = entities[entity_id]
    fm = data["frontmatter"]
    entity_type = fm.get("entity_type")

    # Task, Project, Track만 대상
    if entity_type not in ["Task", "Project", "Track"]:
        return False

    # 이미 있으면 스킵
    if "conditions_3y" in fm and fm["conditions_3y"]:
        return False

    # 적절한 conditions 결정
    conditions = get_conditions_for_entity(entity_id, entities)

    if dry_run:
        print(f"  [DRY-RUN] {entity_id} → {conditions}")
        return True

    # 파일 수정
    filepath = data["filepath"]
    content = data["content"]
    fm_raw = data["fm_raw"]

    new_fm_raw = add_conditions_3y_to_frontmatter(fm_raw, conditions)

    if new_fm_raw == fm_raw:
        return False

    new_content = content.replace(f"---\n{fm_raw}\n---", f"---\n{new_fm_raw}\n---", 1)

    filepath.write_text(new_content, encoding="utf-8")
    print(f"  [UPDATED] {entity_id} → {conditions}")
    return True


def main(vault_path: str, dry_run: bool = True) -> int:
    """메인 함수"""
    vault_root = Path(vault_path).resolve()

    if not vault_root.exists():
        print(f"Error: Vault path does not exist: {vault_root}")
        return 1

    print("=== conditions_3y Backfill Script ===\n")
    print(f"Mode: {'DRY-RUN' if dry_run else 'LIVE'}")
    print(f"Vault: {vault_root}\n")

    print("Collecting entities...")
    entities = collect_entities(vault_root)
    print(f"Found {len(entities)} entities\n")

    print("Track → Conditions Mapping:")
    for track_id, conditions in TRACK_TO_CONDITIONS.items():
        print(f"  {track_id} → {conditions}")
    print(f"  (default) → {DEFAULT_CONDITIONS}\n")

    # 타입별로 분류
    by_type = {"Track": [], "Project": [], "Task": []}
    for entity_id, data in entities.items():
        entity_type = data["frontmatter"].get("entity_type")
        if entity_type in by_type:
            by_type[entity_type].append(entity_id)

    updated_count = 0

    for entity_type in ["Track", "Project", "Task"]:
        type_entities = by_type[entity_type]
        print(f"\n--- {entity_type} ({len(type_entities)}개) ---")

        for entity_id in sorted(type_entities):
            if backfill_entity(entity_id, entities, dry_run):
                updated_count += 1

    print(f"\n=== Summary ===")
    print(f"Total entities: {len(entities)}")
    print(f"{'Would update' if dry_run else 'Updated'}: {updated_count}")

    if dry_run:
        print("\nRun with --apply to actually modify files.")

    return 0


if __name__ == "__main__":
    vault_path = sys.argv[1] if len(sys.argv) > 1 else "."
    dry_run = "--apply" not in sys.argv
    sys.exit(main(vault_path, dry_run))
