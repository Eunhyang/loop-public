#!/usr/bin/env python3
"""
LOOP Vault Frontmatter-Body Sync Validator v1.0

본문의 메타라인이 frontmatter와 일치하는지 검증합니다.
이 스크립트는 SSOT(Single Source of Truth) 원칙을 강제합니다.

검사 대상 패턴:
  Project: > Project ID: `{id}` | Track: `{parent_id}` | Status: {status}
  Task: > Task ID: `{id}` | Project: `{project_id}` | Status: {status}

Usage:
    python3 check_frontmatter_body_sync.py [vault_path]
    python3 check_frontmatter_body_sync.py [vault_path] --file <path>
"""

import re
import sys
import yaml
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# 본문 메타라인 패턴 (정규식)
BODY_META_PATTERNS = {
    'Project': re.compile(r'>\s*Project ID:\s*`([^`]+)`\s*\|\s*(?:Track|Program):\s*`([^`]+)`\s*\|\s*Status:\s*(\w+)'),
    'Task': re.compile(r'>\s*Task ID:\s*`([^`]+)`\s*\|\s*Project:\s*`([^`]+)`\s*\|\s*Status:\s*(\w+)'),
}

# 검증 대상 경로 (validate_schema.py와 동일)
INCLUDE_PATHS = ["01_North_Star", "20_Strategy", "50_Projects", "60_Hypotheses", "70_Experiments"]
EXCLUDE_PATHS = ["00_Meta/_TEMPLATES", "10_Study", "30_Ontology", "40_LOOP_OS", "90_Archive", "00_Inbox"]
EXCLUDE_FILES = ["_INDEX.md", "_ENTRY_POINT.md", "CLAUDE.md", "README.md", "_HOME.md", "_Graph_Index.md"]


def extract_frontmatter(content: str) -> Optional[Dict]:
    """마크다운에서 YAML frontmatter 추출"""
    match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if match:
        try:
            return yaml.safe_load(match.group(1))
        except yaml.YAMLError:
            return None
    return None


def check_file(file_path: Path) -> List[str]:
    """
    단일 파일의 frontmatter와 본문 메타라인 동기화 검사.

    Returns:
        오류 메시지 목록 (비어있으면 통과)
    """
    errors = []

    try:
        content = file_path.read_text(encoding='utf-8')
    except Exception as e:
        return [f"Read error: {e}"]

    # frontmatter 파싱
    fm = extract_frontmatter(content)
    if not fm:
        return []  # frontmatter 없으면 스킵

    entity_type = fm.get('entity_type')
    if entity_type not in BODY_META_PATTERNS:
        return []  # 검사 대상 엔티티가 아님

    # 본문 메타라인 파싱
    pattern = BODY_META_PATTERNS[entity_type]
    body_match = pattern.search(content)

    if not body_match:
        return []  # 메타라인 없으면 스킵 (필수가 아님)

    # 값 추출
    if entity_type == 'Project':
        body_id, body_parent, body_status = body_match.groups()
        fm_parent = fm.get('parent_id') or fm.get('program_id')
        parent_field = 'parent_id/program_id'
    elif entity_type == 'Task':
        body_id, body_parent, body_status = body_match.groups()
        fm_parent = fm.get('project_id')
        parent_field = 'project_id'
    else:
        return []

    # entity_id 일치 검사
    fm_id = fm.get('entity_id')
    if body_id != fm_id:
        errors.append(f"ID mismatch: frontmatter.entity_id='{fm_id}', body='{body_id}'")

    # parent/project 일치 검사
    if body_parent != fm_parent:
        errors.append(f"Parent mismatch: frontmatter.{parent_field}='{fm_parent}', body='{body_parent}'")

    # status 일치 검사
    fm_status = fm.get('status')
    if body_status != fm_status:
        errors.append(f"Status mismatch: frontmatter.status='{fm_status}', body='{body_status}'")

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


def validate_single_file(filepath: Path) -> int:
    """단일 파일 검증 모드"""
    if not filepath.exists():
        print(f"Error: File does not exist: {filepath}")
        return 1

    errors = check_file(filepath)

    print(f"\n=== Frontmatter-Body Sync Check ===")
    print(f"File: {filepath}")

    if errors:
        print(f"\n❌ Sync errors ({len(errors)}):")
        for error in errors:
            print(f"  - {error}")
        return 1

    print("\n✅ Sync check passed!")
    return 0


def main(vault_path: str, single_file: Optional[str] = None) -> int:
    """메인 검증 함수"""
    vault_root = Path(vault_path).resolve()

    if not vault_root.exists():
        print(f"Error: Vault path does not exist: {vault_root}")
        return 1

    # 단일 파일 검증 모드
    if single_file:
        file_path = Path(single_file)
        if not file_path.is_absolute():
            file_path = vault_root / file_path
        return validate_single_file(file_path)

    # 전체 검증
    errors_found: List[Tuple[Path, List[str]]] = []
    files_checked = 0

    for filepath in vault_root.rglob("*.md"):
        if not should_validate(filepath, vault_root):
            continue

        files_checked += 1
        errors = check_file(filepath)

        if errors:
            errors_found.append((filepath, errors))

    # 결과 출력
    print(f"\n=== Frontmatter-Body Sync Report ===")
    print(f"Files checked: {files_checked}")
    print(f"Files with sync errors: {len(errors_found)}")

    if errors_found:
        print(f"\n--- Sync Errors ---")
        for filepath, errors in errors_found:
            print(f"\n{filepath.relative_to(vault_root)}:")
            for error in errors:
                print(f"  - {error}")
        return 1

    print("\n✅ All files passed sync check!")
    return 0


def print_usage():
    """사용법 출력"""
    print("""
LOOP Vault Frontmatter-Body Sync Validator v1.0

Usage:
    python3 check_frontmatter_body_sync.py [vault_path]
    python3 check_frontmatter_body_sync.py [vault_path] --file <path>
    python3 check_frontmatter_body_sync.py --help

Options:
    --file <path>     Validate a single file only
    --help            Show this help message

Examples:
    python3 check_frontmatter_body_sync.py .
    python3 check_frontmatter_body_sync.py . --file 50_Projects/P001/project.md
""")


if __name__ == "__main__":
    args = sys.argv[1:]

    # Help
    if "--help" in args or "-h" in args:
        print_usage()
        sys.exit(0)

    # Parse arguments
    vault_path = "."
    single_file = None

    i = 0
    while i < len(args):
        if args[i] == "--file" and i + 1 < len(args):
            single_file = args[i + 1]
            i += 2
        elif not args[i].startswith("-"):
            vault_path = args[i]
            i += 1
        else:
            print(f"Unknown option: {args[i]}")
            print_usage()
            sys.exit(1)

    sys.exit(main(vault_path, single_file))
