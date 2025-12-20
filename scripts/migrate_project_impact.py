#!/usr/bin/env python3
"""
Project expected_impact 마이그레이션 스크립트

모든 Project 파일에 expected_impact 필드가 없으면 빈 템플릿을 추가합니다.
"""

import os
import re
import sys
from pathlib import Path

IMPACT_TEMPLATE = """expected_impact:
  statement: ""  # TODO: "이 프로젝트가 성공하면 X가 증명된다"
  metric: ""     # TODO: 측정 지표
  target: ""     # TODO: 목표값
realized_impact:
  outcome: null  # supported | rejected | inconclusive
  evidence: null
  updated: null"""


def migrate_file(filepath: Path) -> bool:
    """단일 파일 마이그레이션"""
    content = filepath.read_text(encoding="utf-8")

    # expected_impact가 이미 있는지 확인
    if "expected_impact:" in content:
        print(f"  SKIP: {filepath.name} (already has expected_impact)")
        return False

    # frontmatter 찾기
    match = re.match(r'^(---\s*\n)(.*?)(\n---)', content, re.DOTALL)
    if not match:
        print(f"  SKIP: {filepath.name} (no frontmatter)")
        return False

    prefix, frontmatter, suffix = match.groups()

    # hypothesis_text 뒤에 expected_impact 추가
    if "hypothesis_text:" in frontmatter:
        # hypothesis_text 줄 찾아서 그 뒤에 추가
        lines = frontmatter.split('\n')
        new_lines = []
        for line in lines:
            new_lines.append(line)
            if line.startswith("hypothesis_text:"):
                new_lines.append(IMPACT_TEMPLATE)
        frontmatter = '\n'.join(new_lines)
    else:
        # experiments: 앞에 추가
        if "experiments:" in frontmatter:
            frontmatter = frontmatter.replace("experiments:", IMPACT_TEMPLATE + "\nexperiments:")
        else:
            # 맨 끝에 추가
            frontmatter = frontmatter.rstrip() + "\n" + IMPACT_TEMPLATE

    # 파일 다시 작성
    new_content = prefix + frontmatter + suffix + content[match.end():]
    filepath.write_text(new_content, encoding="utf-8")
    print(f"  MIGRATED: {filepath.name}")
    return True


def main(vault_path: str):
    vault_root = Path(vault_path).resolve()
    projects_dir = vault_root / "50_Projects"

    if not projects_dir.exists():
        print(f"Error: Projects directory not found: {projects_dir}")
        return 1

    migrated = 0
    skipped = 0

    print("=== Project expected_impact Migration ===\n")

    for filepath in projects_dir.rglob("Project_정의.md"):
        if migrate_file(filepath):
            migrated += 1
        else:
            skipped += 1

    print(f"\n=== Migration Complete ===")
    print(f"Migrated: {migrated}")
    print(f"Skipped: {skipped}")

    return 0


if __name__ == "__main__":
    vault_path = sys.argv[1] if len(sys.argv) > 1 else "."
    sys.exit(main(vault_path))
