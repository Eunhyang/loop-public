#!/usr/bin/env python3
"""
Add entity_name to aliases field for better Obsidian linking
(since entity_id with colon can be treated as URL protocol)
"""

import os
import re
import sys
from pathlib import Path

def add_entity_name_to_aliases(file_path):
    """Add entity_name to aliases array if not already present"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract entity_id and entity_name from frontmatter
        entity_id_match = re.search(r'^entity_id:\s*"([^"]+)"', content, re.MULTILINE)
        entity_name_match = re.search(r'^entity_name:\s*"([^"]+)"', content, re.MULTILINE)

        if not entity_id_match or not entity_name_match:
            return False

        entity_id = entity_id_match.group(1)
        entity_name = entity_name_match.group(1)

        # Check current aliases
        aliases_match = re.search(r'^aliases:\s*\[(.*?)\]', content, re.MULTILINE)
        if not aliases_match:
            return False

        aliases_content = aliases_match.group(1).strip()

        # Check if entity_name already in aliases
        if f'"{entity_name}"' in aliases_content:
            return False

        # Prepare new aliases with both entity_id and entity_name
        if aliases_content:
            # Parse existing aliases
            existing_aliases = [a.strip() for a in aliases_content.split(',')]
            # Add entity_name if not present
            if f'"{entity_name}"' not in existing_aliases:
                new_aliases = f'aliases: [{aliases_content}, "{entity_name}"]'
            else:
                return False
        else:
            # Empty aliases, add both
            new_aliases = f'aliases: ["{entity_id}", "{entity_name}"]'

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
        print("Usage: python3 add_entity_name_to_aliases.py <vault_path>")
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

            if add_entity_name_to_aliases(md_file):
                print(f"✓ Added entity_name to aliases: {md_file.relative_to(vault_path)}")
                modified_count += 1

    print(f"\n✅ Total files modified: {modified_count}")

if __name__ == "__main__":
    main()
