#!/usr/bin/env python3
"""
Fix broken aliases by using multiline YAML format
"""

import os
import re
import sys
from pathlib import Path

def fix_broken_aliases(file_path):
    """Fix aliases by converting to multiline format"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract entity_id and entity_name
        entity_id_match = re.search(r'^entity_id:\s*"([^"]+)"', content, re.MULTILINE)
        entity_name_match = re.search(r'^entity_name:\s*"([^"]+)"', content, re.MULTILINE)

        if not entity_id_match or not entity_name_match:
            return False

        entity_id = entity_id_match.group(1)
        entity_name = entity_name_match.group(1)

        # Create hyphenated version if has colon
        aliases_lines = [f'  - "{entity_id}"', f'  - "{entity_name}"']
        if ':' in entity_id:
            hyphen_id = entity_id.replace(':', '-')
            aliases_lines.append(f'  - "{hyphen_id}"')

        # Create multiline YAML
        multiline_aliases = "aliases:\n" + "\n".join(aliases_lines)

        # Replace broken aliases line (any form)
        new_content = re.sub(
            r'^aliases:.*$',
            multiline_aliases,
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
        print("Usage: python3 fix_broken_aliases.py <file_path>")
        sys.exit(1)

    file_path = Path(sys.argv[1])

    if not file_path.exists():
        print(f"Error: {file_path} does not exist")
        sys.exit(1)

    if fix_broken_aliases(file_path):
        print(f"✅ Fixed: {file_path}")
    else:
        print(f"❌ Failed: {file_path}")

if __name__ == "__main__":
    main()
