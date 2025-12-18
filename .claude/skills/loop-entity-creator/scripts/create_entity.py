#!/usr/bin/env python3
"""
LOOP Entity Creator
Creates entity markdown files with proper schema, validation, and graph index updates.
"""

import argparse
import os
import re
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
import subprocess

# Entity type configurations
ENTITY_CONFIGS = {
    "task": {
        "template": "template_task.md",
        "id_prefix": "tsk",
        "id_pattern": r"^tsk:\d{3}-\d{2}$",
        "location_pattern": "50_Projects/{project_name}/Tasks/{entity_name}.md",
        "required_fields": ["entity_name", "project_id", "assignee"],
        "optional_fields": ["parent_id", "priority_flag"],
    },
    "project": {
        "template": "template_project.md",
        "id_prefix": "prj",
        "id_pattern": r"^prj:\d{3}$",
        "location_pattern": "50_Projects/P{project_num}_{entity_name}/Project_정의.md",
        "required_fields": ["entity_name", "owner", "parent_id"],
        "optional_fields": ["priority_flag"],
    },
    "hypothesis": {
        "template": "template_hypothesis.md",
        "id_prefix": "hyp",
        "id_pattern": r"^hyp:\d{3}$",
        "location_pattern": "60_Hypotheses/H_{entity_name}.md",
        "required_fields": ["entity_name", "hypothesis_text"],
        "optional_fields": ["validated_by"],
    },
    "condition": {
        "template": "template_condition.md",
        "id_prefix": "cond",
        "id_pattern": r"^cond:[a-e]$",
        "location_pattern": "20_Strategy/3Y_Conditions/Condition_{letter}_{entity_name}.md",
        "required_fields": ["entity_name", "parent_id", "unlock", "if_broken"],
        "optional_fields": [],
    },
    "track": {
        "template": "template_track.md",
        "id_prefix": "trk",
        "id_pattern": r"^trk:[1-6]$",
        "location_pattern": "20_Strategy/12M_Tracks/Track_{number}_{entity_name}.md",
        "required_fields": ["entity_name", "owner"],
        "optional_fields": [],
    },
    "metahypothesis": {
        "template": "template_metahypothesis.md",
        "id_prefix": "mh",
        "id_pattern": r"^mh:[1-4]$",
        "location_pattern": "01_North_Star/MH{number}_{entity_name}.md",
        "required_fields": ["entity_name", "if_broken"],
        "optional_fields": ["validates"],
    },
}

def find_vault_root(start_path: Path) -> Optional[Path]:
    """Find LOOP vault root by looking for CLAUDE.md"""
    current = start_path.resolve()
    while current != current.parent:
        if (current / "CLAUDE.md").exists():
            return current
        current = current.parent
    return None

def get_next_id(vault_root: Path, entity_type: str) -> str:
    """Generate next available entity ID"""
    config = ENTITY_CONFIGS[entity_type]
    prefix = config["id_prefix"]

    # Special handling for letter-based and number-based IDs
    if prefix == "cond":
        # Condition: cond:a-e
        existing = find_existing_ids(vault_root, prefix)
        letters = [eid.split(":")[1] for eid in existing if ":" in eid]
        for letter in "abcde":
            if letter not in letters:
                return f"{prefix}:{letter}"
        return f"{prefix}:e"  # Default to last

    elif prefix == "trk":
        # Track: trk:1-6
        existing = find_existing_ids(vault_root, prefix)
        numbers = [int(eid.split(":")[1]) for eid in existing if ":" in eid]
        for num in range(1, 7):
            if num not in numbers:
                return f"{prefix}:{num}"
        return f"{prefix}:6"  # Default to last

    elif prefix == "mh":
        # MetaHypothesis: mh:1-4
        existing = find_existing_ids(vault_root, prefix)
        numbers = [int(eid.split(":")[1]) for eid in existing if ":" in eid]
        for num in range(1, 5):
            if num not in numbers:
                return f"{prefix}:{num}"
        return f"{prefix}:4"  # Default to last

    elif prefix == "tsk":
        # Task: tsk:NNN-NN
        existing = find_existing_ids(vault_root, prefix)
        max_id = 0
        for eid in existing:
            if ":" in eid:
                parts = eid.split(":")[1].split("-")
                if len(parts) == 2:
                    try:
                        main_num = int(parts[0])
                        sub_num = int(parts[1])
                        combined = main_num * 100 + sub_num
                        max_id = max(max_id, combined)
                    except ValueError:
                        continue
        max_id += 1
        main = max_id // 100
        sub = max_id % 100
        return f"{prefix}:{main:03d}-{sub:02d}"

    else:
        # Project, Hypothesis: prj:NNN, hyp:NNN
        existing = find_existing_ids(vault_root, prefix)
        max_num = 0
        for eid in existing:
            if ":" in eid:
                try:
                    num = int(eid.split(":")[1])
                    max_num = max(max_num, num)
                except ValueError:
                    continue
        return f"{prefix}:{max_num + 1:03d}"

def find_existing_ids(vault_root: Path, prefix: str) -> List[str]:
    """Find all existing entity IDs with given prefix"""
    ids = []
    for md_file in vault_root.rglob("*.md"):
        try:
            content = md_file.read_text(encoding="utf-8")
            # Extract entity_id from frontmatter
            match = re.search(r'^entity_id:\s*["\']?(\w+:\S+?)["\']?\s*$', content, re.MULTILINE)
            if match:
                entity_id = match.group(1).strip('"').strip("'")
                if entity_id.startswith(f"{prefix}:"):
                    ids.append(entity_id)
        except Exception:
            continue
    return ids

def collect_field_value(field_name: str, required: bool = True) -> str:
    """Collect field value from user input"""
    prompt = f"{field_name}"
    if required:
        prompt += " (required)"
    prompt += ": "

    while True:
        value = input(prompt).strip()
        if value or not required:
            return value
        print(f"  ⚠️  {field_name} is required. Please provide a value.")

def load_template(vault_root: Path, template_name: str) -> str:
    """Load template content"""
    template_path = vault_root / "00_Meta" / "_TEMPLATES" / template_name
    if not template_path.exists():
        raise FileNotFoundError(f"Template not found: {template_path}")
    return template_path.read_text(encoding="utf-8")

def replace_placeholders(content: str, replacements: Dict[str, str]) -> str:
    """Replace {{PLACEHOLDERS}} in template"""
    for key, value in replacements.items():
        placeholder = f"{{{{{key}}}}}"
        content = content.replace(placeholder, value)
    return content

def create_entity_file(
    vault_root: Path,
    entity_type: str,
    entity_data: Dict[str, str]
) -> Path:
    """Create entity markdown file"""
    config = ENTITY_CONFIGS[entity_type]

    # Load template
    template_content = load_template(vault_root, config["template"])

    # Prepare replacements
    replacements = {
        "DATE": datetime.now().strftime("%Y-%m-%d"),
        **entity_data
    }

    # Replace placeholders
    content = replace_placeholders(template_content, replacements)

    # Determine file path
    location_pattern = config["location_pattern"]
    file_path_str = location_pattern.format(**entity_data)
    file_path = vault_root / file_path_str

    # Create directory if needed
    file_path.parent.mkdir(parents=True, exist_ok=True)

    # Write file
    file_path.write_text(content, encoding="utf-8")

    return file_path

def run_validation(vault_root: Path):
    """Run schema validation"""
    validate_script = vault_root / "scripts" / "validate_schema.py"
    if validate_script.exists():
        print("\n🔍 Running schema validation...")
        result = subprocess.run(
            ["python3", str(validate_script), str(vault_root)],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            print("⚠️  Validation warnings:")
            print(result.stdout)
        else:
            print("✅ Schema validation passed")

def run_orphan_check(vault_root: Path):
    """Run orphan check"""
    orphan_script = vault_root / "scripts" / "check_orphans.py"
    if orphan_script.exists():
        print("\n🔍 Checking for orphaned links...")
        result = subprocess.run(
            ["python3", str(orphan_script), str(vault_root)],
            capture_output=True,
            text=True
        )
        if "Warnings:" in result.stdout:
            print("⚠️  Orphan warnings:")
            print(result.stdout)
        else:
            print("✅ No orphaned links")

def update_graph_index(vault_root: Path):
    """Update graph index"""
    graph_script = vault_root / "scripts" / "build_graph_index.py"
    if graph_script.exists():
        print("\n📊 Updating graph index...")
        result = subprocess.run(
            ["python3", str(graph_script), str(vault_root)],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print("✅ Graph index updated")
        else:
            print("⚠️  Graph index update failed:")
            print(result.stdout)

def create_entity(entity_type: str, vault_root: Path):
    """Main entity creation flow"""
    if entity_type not in ENTITY_CONFIGS:
        print(f"❌ Unknown entity type: {entity_type}")
        print(f"Valid types: {', '.join(ENTITY_CONFIGS.keys())}")
        sys.exit(1)

    config = ENTITY_CONFIGS[entity_type]

    print(f"\n🚀 Creating new {entity_type.title()}")
    print("=" * 50)

    # Generate entity ID
    entity_id = get_next_id(vault_root, entity_type)
    print(f"\n📝 Assigned ID: {entity_id}")

    # Collect required fields
    entity_data = {
        "entity_id": entity_id,
        "entity_type": entity_type.title(),
    }

    print("\n📋 Please provide the following information:")

    for field in config["required_fields"]:
        value = collect_field_value(field, required=True)
        entity_data[field] = value

    # Collect optional fields
    if config["optional_fields"]:
        print("\n📋 Optional fields (press Enter to skip):")
        for field in config["optional_fields"]:
            value = collect_field_value(field, required=False)
            if value:
                entity_data[field] = value

    # Add entity_id extracted components for file naming
    if entity_type == "task":
        entity_data["task_number"] = entity_id.split(":")[1]
    elif entity_type == "project":
        entity_data["project_num"] = entity_id.split(":")[1]
    elif entity_type == "condition":
        entity_data["letter"] = entity_id.split(":")[1].upper()
    elif entity_type == "track":
        entity_data["number"] = entity_id.split(":")[1]
    elif entity_type == "metahypothesis":
        entity_data["number"] = entity_id.split(":")[1]

    # Create file
    print(f"\n💾 Creating file...")
    file_path = create_entity_file(vault_root, entity_type, entity_data)
    print(f"✅ Created: {file_path.relative_to(vault_root)}")

    # Run validation and indexing
    run_validation(vault_root)
    run_orphan_check(vault_root)
    update_graph_index(vault_root)

    print(f"\n✨ {entity_type.title()} created successfully!")
    print(f"📄 File: {file_path.relative_to(vault_root)}")
    print(f"🆔 ID: {entity_id}")

def main():
    parser = argparse.ArgumentParser(
        description="Create LOOP vault entity with schema validation"
    )
    parser.add_argument(
        "--type",
        required=True,
        choices=list(ENTITY_CONFIGS.keys()),
        help="Entity type to create"
    )

    args = parser.parse_args()

    # Find vault root
    vault_root = find_vault_root(Path.cwd())
    if not vault_root:
        print("❌ Could not find LOOP vault root (CLAUDE.md not found)")
        sys.exit(1)

    print(f"📁 Vault root: {vault_root}")

    # Create entity
    create_entity(args.type, vault_root)

if __name__ == "__main__":
    main()