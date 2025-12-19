#!/usr/bin/env python3
"""
Remove 'migrated' and 'notion' tags from all Task and Project files
"""

import os
import re
import sys
from pathlib import Path

def remove_migration_tags(file_path):
    """Remove 'migrated' and 'notion' from tags array in frontmatter"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Pattern to match tags line with migrated/notion
        # Match: tags: ["migrated", "notion"]
        # Also match variations like: tags: ["notion", "migrated"]
        # Also match with single tag: tags: ["migrated"] or tags: ["notion"]

        original_content = content

        # Replace tags line containing migrated and/or notion
        # Pattern 1: Both migrated and notion
        content = re.sub(
            r'tags:\s*\["migrated",\s*"notion"\]',
            'tags: []',
            content
        )
        content = re.sub(
            r'tags:\s*\["notion",\s*"migrated"\]',
            'tags: []',
            content
        )

        # Pattern 2: Only migrated
        content = re.sub(
            r'tags:\s*\["migrated"\]',
            'tags: []',
            content
        )

        # Pattern 3: Only notion
        content = re.sub(
            r'tags:\s*\["notion"\]',
            'tags: []',
            content
        )

        # Check if content changed
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True

        return False

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 remove_migration_tags.py <vault_path>")
        sys.exit(1)

    vault_path = Path(sys.argv[1])
    projects_path = vault_path / "50_Projects"

    if not projects_path.exists():
        print(f"Error: {projects_path} does not exist")
        sys.exit(1)

    # Find all .md files in 50_Projects
    md_files = list(projects_path.rglob("*.md"))

    modified_count = 0

    for md_file in md_files:
        if remove_migration_tags(md_file):
            print(f"✓ Cleaned: {md_file.relative_to(vault_path)}")
            modified_count += 1

    print(f"\n✅ Total files modified: {modified_count}")

if __name__ == "__main__":
    main()