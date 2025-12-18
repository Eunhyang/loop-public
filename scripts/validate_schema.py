#!/usr/bin/env python3
"""
LOOP Vault Schema Validator v3.2
모든 마크다운 파일의 frontmatter를 검증합니다.
"""

import os
import re
import sys
import yaml
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# === 설정 ===
INCLUDE_PATHS = [
    "01_North_Star",
    "20_Strategy",
    "50_Projects",
    "60_Hypotheses",
    "70_Experiments",
]

EXCLUDE_PATHS = [
    "00_Meta/_TEMPLATES",
    "10_Study",
    "30_Ontology",
    "40_LOOP_OS",
    "90_Archive",
    "00_Inbox",
]

EXCLUDE_FILES = [
    "_INDEX.md",
    "_ENTRY_POINT.md",
    "CLAUDE.md",
    "README.md",
    "_HOME.md",
    "_Graph_Index.md",
]

# === ID 패턴 ===
ID_PATTERNS = {
    "ns": r"^ns:\d{3}$",
    "mh": r"^mh:[1-4]$",
    "cond": r"^cond:[a-e]$",
    "trk": r"^trk:[1-6]$",
    "prj": r"^prj:\d{3}$",
    "tsk": r"^tsk:\d{3}-\d{2}$",
    "hyp": r"^hyp:\d{3}$",
    "exp": r"^exp:\d{3}$",
}

# === 필수 필드 ===
REQUIRED_FIELDS = {
    "all": ["entity_type", "entity_id", "entity_name", "created", "updated", "status"],
    "NorthStar": [],
    "MetaHypothesis": ["if_broken"],
    "Condition": ["if_broken"],
    "Track": ["owner", "horizon"],
    "Project": ["owner", "parent_id"],
    "Task": ["assignee", "project_id", "parent_id"],
    "Hypothesis": ["hypothesis_text"],
    "Experiment": ["hypothesis_id", "metrics"],
}

# === 유효한 상태값 ===
VALID_STATUSES = ["planning", "active", "blocked", "done", "failed", "learning", "fixed", "assumed", "validating", "validated", "falsified", "in_progress"]


def extract_frontmatter(content: str) -> Optional[Dict]:
    """마크다운에서 YAML frontmatter 추출"""
    match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if match:
        try:
            return yaml.safe_load(match.group(1))
        except yaml.YAMLError as e:
            return {"_parse_error": str(e)}
    return None


def validate_id_format(entity_id: str) -> Tuple[bool, str]:
    """ID 형식 검증"""
    if not entity_id or ":" not in entity_id:
        return False, "ID must be in format {type}:{number}"

    prefix = entity_id.split(":")[0]
    pattern = ID_PATTERNS.get(prefix)

    if not pattern:
        return False, f"Unknown ID prefix: {prefix}"

    if not re.match(pattern, entity_id):
        return False, f"ID '{entity_id}' doesn't match pattern '{pattern}'"

    return True, ""


def validate_file(filepath: Path, frontmatter: Dict) -> List[str]:
    """단일 파일 검증"""
    errors = []

    # 파싱 오류 체크
    if "_parse_error" in frontmatter:
        errors.append(f"YAML parse error: {frontmatter['_parse_error']}")
        return errors

    # 필수 필드 체크 (공통)
    for field in REQUIRED_FIELDS["all"]:
        if field not in frontmatter:
            errors.append(f"Missing required field: {field}")

    # entity_type 체크
    entity_type = frontmatter.get("entity_type")
    if not entity_type:
        errors.append("Missing entity_type")
        return errors

    # 엔티티별 필수 필드 체크
    type_required = REQUIRED_FIELDS.get(entity_type, [])
    for field in type_required:
        if field not in frontmatter or frontmatter[field] is None:
            errors.append(f"Missing required field for {entity_type}: {field}")

    # ID 형식 체크
    entity_id = frontmatter.get("entity_id")
    if entity_id:
        valid, msg = validate_id_format(entity_id)
        if not valid:
            errors.append(msg)

    # status 값 체크
    status = frontmatter.get("status")
    if status and status not in VALID_STATUSES:
        errors.append(f"Invalid status: {status}")

    # parent_id 형식 체크 (있는 경우)
    parent_id = frontmatter.get("parent_id")
    if parent_id:
        valid, msg = validate_id_format(parent_id)
        if not valid:
            errors.append(f"Invalid parent_id: {msg}")

    # validates/validated_by 형식 체크
    for field in ["validates", "validated_by"]:
        values = frontmatter.get(field, [])
        if values:
            if not isinstance(values, list):
                errors.append(f"{field} must be a list")
            else:
                for v in values:
                    if not isinstance(v, str):
                        errors.append(f"{field} must contain only strings, got: {type(v)}")

    return errors


def should_validate(filepath: Path, vault_root: Path) -> bool:
    """파일을 검증해야 하는지 확인"""
    relative = filepath.relative_to(vault_root)

    # 제외 파일 체크
    if filepath.name in EXCLUDE_FILES:
        return False

    # 제외 경로 체크
    for exclude in EXCLUDE_PATHS:
        if str(relative).startswith(exclude):
            return False

    # 포함 경로 체크
    for include in INCLUDE_PATHS:
        if str(relative).startswith(include):
            return True

    return False


def main(vault_path: str) -> int:
    """메인 검증 함수"""
    vault_root = Path(vault_path).resolve()

    if not vault_root.exists():
        print(f"Error: Vault path does not exist: {vault_root}")
        return 1

    errors_found = []
    files_checked = 0

    for filepath in vault_root.rglob("*.md"):
        if not should_validate(filepath, vault_root):
            continue

        files_checked += 1

        try:
            content = filepath.read_text(encoding="utf-8")
        except Exception as e:
            errors_found.append((filepath, [f"Read error: {e}"]))
            continue

        frontmatter = extract_frontmatter(content)
        if frontmatter is None:
            # frontmatter 없는 파일은 스킵
            continue

        errors = validate_file(filepath, frontmatter)
        if errors:
            errors_found.append((filepath, errors))

    # 결과 출력
    print(f"\n=== Schema Validation Report ===")
    print(f"Files checked: {files_checked}")
    print(f"Files with errors: {len(errors_found)}")

    if errors_found:
        print(f"\n--- Errors ---")
        for filepath, errors in errors_found:
            print(f"\n{filepath.relative_to(vault_root)}:")
            for error in errors:
                print(f"  - {error}")
        return 1

    print("\nAll files passed validation!")
    return 0


if __name__ == "__main__":
    vault_path = sys.argv[1] if len(sys.argv) > 1 else "."
    sys.exit(main(vault_path))
