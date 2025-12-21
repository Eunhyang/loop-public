#!/usr/bin/env python3
"""
Entity ID Format Migration Script

Converts entity IDs from colon format to hyphen format:
- prj-001 → prj-001
- tsk-001-01 → tsk-001-01
- hyp-1-01 → hyp-1-01
- trk-1 → trk-1
- cond-a → cond-a
- mh-1 → mh-1
- ns-001 → ns-001
- exp-001 → exp-001

Usage:
    python3 scripts/migrate_id_format.py .              # Dry run (preview)
    python3 scripts/migrate_id_format.py . --apply      # Apply changes
"""

import os
import re
import sys
from pathlib import Path

# ID prefixes to migrate
ID_PREFIXES = ['ns', 'mh', 'cond', 'trk', 'prj', 'tsk', 'hyp', 'exp', 'pl', 'ps']

# Fields that contain entity IDs (in frontmatter)
ID_FIELDS = [
    'entity_id',
    'parent_id',
    'project_id',
    'track_id',
    'hypothesis_id',
    'target_id',
]

# Array fields that may contain entity IDs
ARRAY_ID_FIELDS = [
    'validates',
    'validated_by',
    'conditions_3y',
    'aliases',
]

# Directories to scan
SCAN_DIRS = [
    "01_North_Star",
    "20_Strategy",
    "50_Projects",
    "60_Hypotheses",
    "70_Experiments",
]

def convert_id(id_str):
    """Convert single ID from colon to hyphen format"""
    if not id_str or not isinstance(id_str, str):
        return id_str

    # Pattern: prefix:rest → prefix-rest
    for prefix in ID_PREFIXES:
        pattern = f'^{prefix}:'
        if re.match(pattern, id_str):
            return re.sub(pattern, f'{prefix}-', id_str)

    return id_str

def process_content(content, file_path):
    """Process file content and convert all entity IDs"""
    changes = []
    new_content = content

    # 1. Convert entity_id field
    entity_id_pattern = r'^(entity_id:\s*["\']?)([^"\'"\n]+)(["\']?)$'
    for match in re.finditer(entity_id_pattern, content, re.MULTILINE):
        old_id = match.group(2)
        new_id = convert_id(old_id)
        if old_id != new_id:
            old_line = match.group(0)
            new_line = f'{match.group(1)}{new_id}{match.group(3)}'
            new_content = new_content.replace(old_line, new_line, 1)
            changes.append(f'  entity_id: {old_id} → {new_id}')

    # 2. Convert reference fields (parent_id, project_id, etc.)
    for field in ID_FIELDS:
        if field == 'entity_id':
            continue
        pattern = rf'^({field}:\s*["\']?)([^"\'"\n]+)(["\']?)$'
        for match in re.finditer(pattern, new_content, re.MULTILINE):
            old_id = match.group(2)
            new_id = convert_id(old_id)
            if old_id != new_id:
                old_line = match.group(0)
                new_line = f'{match.group(1)}{new_id}{match.group(3)}'
                new_content = new_content.replace(old_line, new_line, 1)
                changes.append(f'  {field}: {old_id} → {new_id}')

    # 3. Convert outgoing_relations target_id
    target_pattern = r'(target_id:\s*["\']?)([^"\'"\n]+)(["\']?)'
    for match in re.finditer(target_pattern, new_content):
        old_id = match.group(2)
        new_id = convert_id(old_id)
        if old_id != new_id:
            old_str = match.group(0)
            new_str = f'{match.group(1)}{new_id}{match.group(3)}'
            new_content = new_content.replace(old_str, new_str, 1)
            changes.append(f'  target_id: {old_id} → {new_id}')

    # 4. Convert array fields (validates, validated_by, conditions_3y)
    for field in ARRAY_ID_FIELDS:
        # Match YAML array format: - "id" or - id
        array_item_pattern = rf'({field}:\s*\n(?:\s*-\s*["\']?)([^"\'"\n]+)(["\']?\s*\n?)+)'

        # Simpler approach: find all quoted/unquoted IDs after field name
        field_section_pattern = rf'({field}:\s*\n)((?:\s*-\s*[^\n]+\n?)+)'
        field_match = re.search(field_section_pattern, new_content)
        if field_match:
            section = field_match.group(2)
            new_section = section
            for prefix in ID_PREFIXES:
                # Convert prefix:xxx to prefix-xxx in array items
                new_section = re.sub(
                    rf'(\s*-\s*["\']?)({prefix}):([^"\'"\n]+)(["\']?)',
                    rf'\1{prefix}-\3\4',
                    new_section
                )
            if section != new_section:
                new_content = new_content.replace(section, new_section)
                changes.append(f'  {field}: array items converted')

    # 5. Convert wikilinks in body: [[prj-001]] → [[prj-001]]
    for prefix in ID_PREFIXES:
        wikilink_pattern = rf'\[\[({prefix}):([^\]]+)\]\]'
        for match in re.finditer(wikilink_pattern, new_content):
            old_link = match.group(0)
            new_link = f'[[{prefix}-{match.group(2)}]]'
            new_content = new_content.replace(old_link, new_link)
            changes.append(f'  wikilink: {old_link} → {new_link}')

    # 6. Convert inline references like `prj-001` → `prj-001`
    for prefix in ID_PREFIXES:
        inline_pattern = rf'`({prefix}):([^`]+)`'
        for match in re.finditer(inline_pattern, new_content):
            old_ref = match.group(0)
            new_ref = f'`{prefix}-{match.group(2)}`'
            new_content = new_content.replace(old_ref, new_ref)
            changes.append(f'  inline: {old_ref} → {new_ref}')

    return new_content, changes

def process_file(file_path, apply=False):
    """Process a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if file has frontmatter
        if not content.startswith('---'):
            return None, []

        new_content, changes = process_content(content, file_path)

        if changes and apply:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)

        return new_content, changes

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return None, []

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 migrate_id_format.py <vault_path> [--apply]")
        print("       Without --apply: dry run (preview changes)")
        print("       With --apply: apply changes to files")
        sys.exit(1)

    vault_path = Path(sys.argv[1])
    apply = '--apply' in sys.argv

    if apply:
        print("🔧 APPLY MODE: Changes will be written to files\n")
    else:
        print("👀 DRY RUN MODE: Preview only (use --apply to write changes)\n")

    total_files = 0
    total_changes = 0

    for scan_dir in SCAN_DIRS:
        dir_path = vault_path / scan_dir
        if not dir_path.exists():
            continue

        md_files = list(dir_path.rglob("*.md"))

        for md_file in md_files:
            # Skip templates
            if "_TEMPLATES" in str(md_file):
                continue

            _, changes = process_file(md_file, apply=apply)

            if changes:
                total_files += 1
                total_changes += len(changes)
                rel_path = md_file.relative_to(vault_path)
                print(f"📄 {rel_path}")
                for change in changes:
                    print(change)
                print()

    print("=" * 50)
    if apply:
        print(f"✅ Applied changes to {total_files} files ({total_changes} changes)")
    else:
        print(f"📊 Would change {total_files} files ({total_changes} changes)")
        print("\nRun with --apply to apply changes:")
        print(f"  python3 scripts/migrate_id_format.py {vault_path} --apply")

if __name__ == "__main__":
    main()
