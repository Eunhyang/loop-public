#!/usr/bin/env python3
"""
LOOP Vault Schema Auto-Fixer v1.0
자동으로 수정 가능한 스키마 에러를 일괄 수정합니다.

수정 항목:
1. status: todo → planning, doing → active
2. closed: status=done인데 없으면 updated 날짜 사용
3. target_project: LOOP → loop
"""

import os
import re
import sys
from pathlib import Path
from datetime import date

# 스캔 대상 폴더
INCLUDE_PATHS = [
    "50_Projects",
    "60_Hypotheses",
    "70_Experiments",
]

def fix_file(filepath: Path) -> list:
    """파일 수정 및 변경 내역 반환"""
    changes = []

    try:
        content = filepath.read_text(encoding="utf-8")
    except Exception as e:
        return [f"Read error: {e}"]

    original = content

    # 1. status: todo → planning
    if re.search(r'^status:\s*todo\s*$', content, re.MULTILINE):
        content = re.sub(r'^(status:\s*)todo(\s*)$', r'\1planning\2', content, flags=re.MULTILINE)
        changes.append("status: todo → planning")

    # 2. status: doing → active
    if re.search(r'^status:\s*doing\s*$', content, re.MULTILINE):
        content = re.sub(r'^(status:\s*)doing(\s*)$', r'\1active\2', content, flags=re.MULTILINE)
        changes.append("status: doing → active")

    # 3. target_project: LOOP → loop
    if re.search(r'^target_project:\s*LOOP\s*$', content, re.MULTILINE):
        content = re.sub(r'^(target_project:\s*)LOOP(\s*)$', r'\1loop\2', content, flags=re.MULTILINE)
        changes.append("target_project: LOOP → loop")

    # 4. closed 필드 추가 (status=done인데 closed 없는 경우)
    # frontmatter에서 status와 updated 추출
    frontmatter_match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if frontmatter_match:
        fm = frontmatter_match.group(1)

        # status=done 체크
        status_match = re.search(r'^status:\s*(done|failed|learning)\s*$', fm, re.MULTILINE)
        if status_match:
            # closed 필드 없는지 체크
            if not re.search(r'^closed:', fm, re.MULTILINE):
                # updated 날짜 찾기
                updated_match = re.search(r"^updated:\s*['\"]?(\d{4}-\d{2}-\d{2})['\"]?\s*$", fm, re.MULTILINE)
                if updated_match:
                    updated_date = updated_match.group(1)
                    # status 줄 다음에 closed 추가
                    new_fm = re.sub(
                        r'^(status:\s*(?:done|failed|learning)\s*)$',
                        f'\\1\nclosed: {updated_date}',
                        fm,
                        flags=re.MULTILINE
                    )
                    content = content.replace(fm, new_fm, 1)
                    changes.append(f"closed: {updated_date} 추가 (updated 기준)")

    # 변경사항 있으면 저장
    if content != original:
        filepath.write_text(content, encoding="utf-8")

    return changes


def main(vault_path: str) -> int:
    vault_root = Path(vault_path).resolve()

    if not vault_root.exists():
        print(f"Error: Vault path does not exist: {vault_root}")
        return 1

    total_fixed = 0
    all_changes = []

    for include in INCLUDE_PATHS:
        search_path = vault_root / include
        if not search_path.exists():
            continue

        for filepath in search_path.rglob("*.md"):
            changes = fix_file(filepath)
            if changes:
                relative = filepath.relative_to(vault_root)
                all_changes.append((relative, changes))
                total_fixed += 1

    # 결과 출력
    print(f"\n=== Auto-Fix Report ===")
    print(f"Files modified: {total_fixed}")

    if all_changes:
        print(f"\n--- Changes ---")
        for filepath, changes in all_changes:
            print(f"\n{filepath}:")
            for change in changes:
                print(f"  - {change}")

    return 0


if __name__ == "__main__":
    vault_path = sys.argv[1] if len(sys.argv) > 1 else "."
    sys.exit(main(vault_path))
