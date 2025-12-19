#!/usr/bin/env python3
"""
Properly fix aliases using YAML parsing
Ensures each entity has: [entity_id, entity_name, hyphen-id]
"""

import os
import re
import sys
from pathlib import Path
import yaml

def fix_aliases_properly(file_path):
    """Fix aliases with proper YAML parsing"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Split frontmatter and body
        parts = content.split('---', 2)
        if len(parts) < 3:
            return False

        frontmatter_text = parts[1]
        body = parts[2]

        # Parse frontmatter
        try:
            frontmatter = yaml.safe_load(frontmatter_text)
        except yaml.YAMLError as e:
            print(f"YAML error in {file_path}: {e}")
            return False

        if not frontmatter:
            return False

        # Get entity_id and entity_name
        entity_id = frontmatter.get('entity_id')
        entity_name = frontmatter.get('entity_name')

        if not entity_id or not entity_name:
            return False

        # Create proper aliases list
        new_aliases = [entity_id, entity_name]

        # Add hyphenated version if entity_id has colon
        if ':' in entity_id:
            hyphen_id = entity_id.replace(':', '-')
            new_aliases.append(hyphen_id)

        # Update frontmatter
        frontmatter['aliases'] = new_aliases

        # Convert back to YAML
        new_frontmatter = yaml.dump(frontmatter,
                                    allow_unicode=True,
                                    sort_keys=False,
                                    default_flow_style=False)

        # Reconstruct file
        new_content = f"---\n{new_frontmatter}---{body}"

        # Write back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)

        return True

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 fix_aliases_properly.py <vault_path>")
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

            if fix_aliases_properly(md_file):
                print(f"✓ Fixed: {md_file.relative_to(vault_path)}")
                modified_count += 1

    print(f"\n✅ Total files modified: {modified_count}")

if __name__ == "__main__":
    main()
