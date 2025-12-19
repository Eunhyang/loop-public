#!/usr/bin/env python3
"""
Add entity_id to aliases field in all entity files for Obsidian linking
"""

import os
import re
import sys
from pathlib import Path

def add_entity_id_to_aliases(file_path):
    """Add entity_id to aliases array if not already present"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract entity_id from frontmatter
        entity_id_match = re.search(r'^entity_id:\s*"([^"]+)"', content, re.MULTILINE)
        if not entity_id_match:
            return False

        entity_id = entity_id_match.group(1)

        # Check current aliases
        aliases_match = re.search(r'^aliases:\s*\[(.*?)\]', content, re.MULTILINE)
        if not aliases_match:
            return False

        aliases_content = aliases_match.group(1).strip()

        # Check if entity_id already in aliases
        if entity_id in aliases_content:
            return False

        # Prepare new aliases
        if aliases_content:
            # Already has some aliases, add entity_id
            new_aliases = f'aliases: [{aliases_content}, "{entity_id}"]'
        else:
            # Empty aliases, just add entity_id
            new_aliases = f'aliases: ["{entity_id}"]'

        # Replace aliases line
        new_content = re.sub(
            r'^aliases:\s*\[.*?\]',
            new_aliases,
            content,
            count=1,
            flags=re.MULTILINE
        )

        # Write back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)

        return True

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 add_entity_id_aliases.py <vault_path>")
        sys.exit(1)

    vault_path = Path(sys.argv[1])

    # Scan these directories
    scan_dirs = [
        "01_North_Star",
        "20_Strategy",
        "50_Projects",
        "60_Hypotheses",
        "70_Experiments"
    ]

    modified_count = 0

    for scan_dir in scan_dirs:
        dir_path = vault_path / scan_dir
        if not dir_path.exists():
            continue

        # Find all .md files
        md_files = list(dir_path.rglob("*.md"))

        for md_file in md_files:
            # Skip templates
            if "_TEMPLATES" in str(md_file):
                continue

            if add_entity_id_to_aliases(md_file):
                print(f"✓ Added alias: {md_file.relative_to(vault_path)}")
                modified_count += 1

    print(f"\n✅ Total files modified: {modified_count}")

if __name__ == "__main__":
    main()