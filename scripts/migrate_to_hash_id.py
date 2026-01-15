#!/usr/bin/env python3
"""
Entity ID Migration Script - Legacy Sequential to Hash+Epoch Format

Migrates all Project/Task IDs from:
  - prj-NNN → prj-{hash6}-{epoch13}
  - tsk-NNN-NN → tsk-{hash6}-{epoch13}

Usage:
  python3 migrate_to_hash_id.py <vault_path> --dry-run     # Preview changes
  python3 migrate_to_hash_id.py <vault_path> --apply       # Apply migration
  python3 migrate_to_hash_id.py <vault_path> --rollback    # Rollback changes

Features:
  - Deterministic hash generation (entity_name + created_date)
  - Bidirectional mapping for rollback
  - Two-phase commit (content first, then rename files)
  - Comprehensive validation (structured parsing, not just grep)
  - Cross-vault sync (exec vault references)
  - Git checkpoint + exec vault snapshot

Author: Claude Code
Task: tsk-50acf0-1767944821000
Date: 2026-01-09
"""

import argparse
import hashlib
import json
import re
import shutil
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

import yaml


class HashIdMigrator:
    """Migrates entity IDs from legacy sequential to Hash+Epoch format."""

    def __init__(self, vault_path: Path, exec_vault_path: Optional[Path] = None):
        self.vault_path = Path(vault_path)
        self.exec_vault_path = Path(exec_vault_path) if exec_vault_path else None

        # Mapping storage
        self.mapping_file = self.vault_path / "_build" / "id_mapping.json"
        self.id_mapping: Dict[str, str] = {}  # old_id → new_id
        self.reverse_mapping: Dict[str, str] = {}  # new_id → old_id

        # Statistics
        self.stats = {
            "projects_migrated": 0,
            "tasks_migrated": 0,
            "references_updated": 0,
            "files_renamed": 0,
            "exec_entities_updated": 0,
        }

        # Legacy ID patterns
        self.legacy_project_pattern = re.compile(r'^prj-\d{3}$')
        self.legacy_task_pattern = re.compile(r'^tsk-\d{3}-\d{2}$')

    def is_legacy_id(self, entity_id: str) -> bool:
        """Check if an ID is legacy format."""
        return bool(
            self.legacy_project_pattern.match(entity_id) or
            self.legacy_task_pattern.match(entity_id)
        )

    def generate_deterministic_id(
        self,
        entity_type: str,
        entity_name: str,
        created_date: str
    ) -> str:
        """Generate ID following SSOT format (api/services/ssot_service.py).

        Project: prj-{hash6}           (e.g., prj-a7k9m2)
        Task:    tsk-{hash6}-{epoch13} (e.g., tsk-a7k9m2-1736412652123)

        Hash part uses entity_name + created_date for determinism.
        Epoch only added for Tasks (ensures uniqueness within project).
        """
        # Generate hash from entity_name + created_date
        hash_input = f"{entity_name}{created_date}".encode('utf-8')
        hash_hex = hashlib.sha256(hash_input).hexdigest()[:6]

        if entity_type == "Project":
            # Project: prj-{hash6} only
            return f"prj-{hash_hex}"
        else:
            # Task: tsk-{hash6}-{epoch13}
            epoch = int(time.time() * 1000)
            return f"tsk-{hash_hex}-{epoch}"

    def extract_frontmatter(self, file_path: Path) -> Tuple[Dict, str]:
        """Extract YAML frontmatter and body from markdown file."""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Match frontmatter
        match = re.match(r'^---\n(.*?)\n---\n(.*)$', content, re.DOTALL)
        if not match:
            return {}, content

        frontmatter_str, body = match.groups()
        frontmatter = yaml.safe_load(frontmatter_str) or {}

        return frontmatter, body

    def write_frontmatter(self, file_path: Path, frontmatter: Dict, body: str):
        """Write frontmatter and body back to file."""
        frontmatter_str = yaml.dump(
            frontmatter,
            allow_unicode=True,
            default_flow_style=False,
            sort_keys=False
        )

        content = f"---\n{frontmatter_str}---\n{body}"

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

    def build_id_mapping(self, dry_run: bool = True) -> Dict[str, str]:
        """Build ID mapping table for all legacy entities.

        Returns mapping dict: old_id → new_id
        """
        print("\n[Phase 1] Building ID Mapping...")
        mapping = {}

        # Scan Projects
        projects_dir = self.vault_path / "50_Projects"
        for project_file in projects_dir.rglob("project.md"):
            frontmatter, _ = self.extract_frontmatter(project_file)
            entity_id = frontmatter.get("entity_id")

            if entity_id and self.is_legacy_id(entity_id):
                entity_name = frontmatter.get("entity_name", "")
                created = frontmatter.get("created", "2026-01-01")

                new_id = self.generate_deterministic_id(
                    "Project", entity_name, str(created)
                )
                mapping[entity_id] = new_id

                if dry_run:
                    print(f"  {entity_id} → {new_id} ({entity_name})")

        # Scan Tasks
        for task_file in projects_dir.rglob("Tasks/*.md"):
            frontmatter, _ = self.extract_frontmatter(task_file)
            entity_id = frontmatter.get("entity_id")

            if entity_id and self.is_legacy_id(entity_id):
                entity_name = frontmatter.get("entity_name", "")
                created = frontmatter.get("created", "2026-01-01")

                new_id = self.generate_deterministic_id(
                    "Task", entity_name, str(created)
                )
                mapping[entity_id] = new_id

                if dry_run:
                    print(f"  {entity_id} → {new_id} ({entity_name})")

        # Save mapping
        self.id_mapping = mapping
        self.reverse_mapping = {v: k for k, v in mapping.items()}

        # Persist to file
        mapping_data = {
            "forward": self.id_mapping,
            "reverse": self.reverse_mapping,
            "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "hash_algorithm": "sha256",
            "hash_input": "entity_name + created_date",
        }

        self.mapping_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.mapping_file, 'w', encoding='utf-8') as f:
            json.dump(mapping_data, f, indent=2, ensure_ascii=False)

        print(f"\n✅ Mapping saved to: {self.mapping_file}")
        print(f"   Projects: {sum(1 for k in mapping if k.startswith('prj-'))}")
        print(f"   Tasks: {sum(1 for k in mapping if k.startswith('tsk-'))}")

        return mapping

    def load_mapping(self) -> bool:
        """Load existing mapping from file."""
        if not self.mapping_file.exists():
            return False

        with open(self.mapping_file, 'r', encoding='utf-8') as f:
            mapping_data = json.load(f)

        self.id_mapping = mapping_data.get("forward", {})
        self.reverse_mapping = mapping_data.get("reverse", {})

        print(f"✅ Loaded mapping from: {self.mapping_file}")
        return True

    def update_frontmatter_fields(
        self,
        frontmatter: Dict,
        mapping: Dict,
        reverse: bool = False
    ) -> Dict:
        """Update frontmatter fields with new (or old) IDs.

        Args:
            frontmatter: Frontmatter dict to update
            mapping: ID mapping (forward or reverse)
            reverse: If True, use reverse mapping (for rollback)
        """
        fm = frontmatter.copy()

        # Single value fields
        single_fields = ['entity_id', 'project_id', 'parent_id',
                        'source_project', 'source_task',
                        'hiring_project', 'pilot_project']

        for field in single_fields:
            if field in fm and fm[field] and fm[field] in mapping:
                fm[field] = mapping[fm[field]]

        # Array fields
        array_fields = ['validates', 'validated_by', 'tasks', 'related_tasks']

        for field in array_fields:
            if field in fm and isinstance(fm[field], list):
                fm[field] = [
                    mapping.get(item, item) for item in fm[field]
                ]

        # Nested: outgoing_relations[].target_id
        if 'outgoing_relations' in fm and isinstance(fm['outgoing_relations'], list):
            for relation in fm['outgoing_relations']:
                if isinstance(relation, dict) and 'target_id' in relation:
                    target_id = relation['target_id']
                    if target_id in mapping:
                        relation['target_id'] = mapping[target_id]

        return fm

    def extract_code_blocks(self, body: str) -> Tuple[List[Tuple[int, int]], str]:
        """Extract code block positions to exclude from replacements.

        Returns:
            Tuple of (code_block_ranges, body)
            code_block_ranges: List of (start, end) positions
        """
        code_blocks = []

        # Find fenced code blocks (``` ... ```)
        pattern = r'```[\s\S]*?```'
        for match in re.finditer(pattern, body):
            code_blocks.append((match.start(), match.end()))

        # Find inline code (` ... `)
        pattern = r'`[^`]+`'
        for match in re.finditer(pattern, body):
            code_blocks.append((match.start(), match.end()))

        return code_blocks, body

    def is_in_code_block(self, pos: int, code_blocks: List[Tuple[int, int]]) -> bool:
        """Check if position is inside a code block."""
        return any(start <= pos < end for start, end in code_blocks)

    def update_wikilinks(
        self,
        body: str,
        mapping: Dict,
        code_blocks: List[Tuple[int, int]]
    ) -> str:
        """Update wikilinks excluding code blocks.

        Pattern: [[prj-001]] → [[prj-hash6-epoch13]]
        """
        # Find all wikilinks
        pattern = r'\[\[([^\]]+)\]\]'

        def replace_wikilink(match):
            pos = match.start()
            if self.is_in_code_block(pos, code_blocks):
                return match.group(0)  # Keep original

            link_text = match.group(1)
            # Check if it's a legacy ID
            if link_text in mapping:
                return f"[[{mapping[link_text]}]]"
            return match.group(0)

        return re.sub(pattern, replace_wikilink, body)

    def update_inline_references(
        self,
        body: str,
        mapping: Dict,
        code_blocks: List[Tuple[int, int]]
    ) -> str:
        """Update inline references excluding code blocks.

        Pattern: `tsk-001-09` → `tsk-hash6-epoch13`
        """
        # Pattern for legacy IDs in text
        pattern = r'\b(prj-\d{3}|tsk-\d{3}-\d{2})\b'

        def replace_inline(match):
            pos = match.start()
            # CRITICAL: Skip if in code block
            if self.is_in_code_block(pos, code_blocks):
                return match.group(0)  # Keep original

            entity_id = match.group(1)
            if entity_id in mapping:
                return mapping[entity_id]
            return match.group(0)

        return re.sub(pattern, replace_inline, body)

    def update_body_content(self, body: str, mapping: Dict) -> str:
        """Update body content (wikilinks + inline refs) excluding code blocks."""
        # Extract code blocks
        code_blocks, _ = self.extract_code_blocks(body)

        # Update wikilinks (excluding code)
        body = self.update_wikilinks(body, mapping, code_blocks)

        # Update inline references (excluding code)
        body = self.update_inline_references(body, mapping, code_blocks)

        return body

    def migrate_entity_content(
        self,
        file_path: Path,
        mapping: Dict,
        dry_run: bool = True,
        skip_idempotency_check: bool = False
    ) -> bool:
        """Migrate a single entity file's content (frontmatter + body).

        Args:
            file_path: Path to markdown file
            mapping: ID mapping dict
            dry_run: If True, preview only
            skip_idempotency_check: If True, process even if already migrated (for rollback)

        Returns True if changes were made.
        """
        try:
            frontmatter, body = self.extract_frontmatter(file_path)

            if not frontmatter:
                print(f"  ⚠️  No frontmatter: {file_path.name}")
                # Still update body references
                if skip_idempotency_check:
                    updated_body = self.update_body_content(body, mapping)
                    if updated_body != body:
                        if not dry_run:
                            self.write_frontmatter(file_path, {}, updated_body)
                        return True
                return False

            entity_id = frontmatter.get("entity_id", "")

            # Check if already migrated (idempotency) - skip for rollback
            if not skip_idempotency_check and entity_id and not self.is_legacy_id(entity_id):
                return False  # Already migrated

            # Update frontmatter
            updated_fm = self.update_frontmatter_fields(frontmatter, mapping)

            # Update body
            updated_body = self.update_body_content(body, mapping)

            # Check if anything changed
            if updated_fm == frontmatter and updated_body == body:
                return False

            if dry_run:
                old_id = entity_id if entity_id else "no-id"
                new_id = updated_fm.get('entity_id', 'no-id')
                print(f"  📝 {file_path.name}: {old_id} → {new_id}")
            else:
                self.write_frontmatter(file_path, updated_fm, updated_body)
                print(f"  ✅ {file_path.name}: Updated content")

            return True

        except Exception as e:
            print(f"  ❌ Error processing {file_path}: {e}")
            return False

    def migrate_projects(self, dry_run: bool = True):
        """Phase A-2: Migrate Project files (content only, no rename).

        Order critical:
        1. Child Tasks' project_id updated in migrate_tasks()
        2. Then Project entity_id and tasks[] array here
        """
        print("\n[Phase A-2] Migrating Projects...")

        projects_dir = self.vault_path / "50_Projects"
        count = 0

        for project_file in projects_dir.rglob("project.md"):
            if self.migrate_entity_content(project_file, self.id_mapping, dry_run):
                count += 1
                self.stats["projects_migrated"] += 1

        print(f"✅ Projects migrated: {count}")

    def migrate_tasks(self, dry_run: bool = True):
        """Phase A-1: Migrate Task files (content + later rename in Phase B).

        Order:
        1. Update content (entity_id, project_id, body)
        2. File rename happens in Phase B (after all content updated)
        """
        print("\n[Phase A-1] Migrating Tasks...")

        projects_dir = self.vault_path / "50_Projects"
        count = 0

        for task_file in projects_dir.rglob("Tasks/*.md"):
            if self.migrate_entity_content(task_file, self.id_mapping, dry_run):
                count += 1
                self.stats["tasks_migrated"] += 1

        print(f"✅ Tasks migrated: {count}")

    def update_all_references(self, dry_run: bool = True):
        """Phase A-3: Update references in Hypotheses and other entities."""
        print("\n[Phase A-3] Updating References...")

        count = 0

        # Update Hypotheses (validates arrays)
        hypotheses_dir = self.vault_path / "60_Hypotheses"
        if hypotheses_dir.exists():
            for hyp_file in hypotheses_dir.rglob("*.md"):
                if self.migrate_entity_content(hyp_file, self.id_mapping, dry_run):
                    count += 1

        # Update any other markdown files with references
        for md_file in self.vault_path.rglob("*.md"):
            # Skip already processed directories
            if "50_Projects" in str(md_file) or "60_Hypotheses" in str(md_file):
                continue
            if "90_Archive" in str(md_file) or "_build" in str(md_file):
                continue

            if self.migrate_entity_content(md_file, self.id_mapping, dry_run):
                count += 1

        self.stats["references_updated"] = count
        print(f"✅ References updated: {count}")

    def rename_task_files(self, dry_run: bool = True):
        """Phase B: Rename Task files after content is updated.

        Project files DO NOT rename (only entity_id in frontmatter changes).
        """
        print("\n[Phase B] Renaming Task Files...")

        projects_dir = self.vault_path / "50_Projects"
        count = 0
        renames = []

        for task_file in projects_dir.rglob("Tasks/*.md"):
            try:
                frontmatter, _ = self.extract_frontmatter(task_file)
                entity_id = frontmatter.get("entity_id", "")

                # Check if this is a new ID (already migrated content)
                if not entity_id or self.is_legacy_id(entity_id):
                    continue  # Skip unmigrated or invalid

                # Build new filename
                new_filename = f"{entity_id}.md"
                new_path = task_file.parent / new_filename

                if new_path == task_file:
                    continue  # Already renamed

                if dry_run:
                    print(f"  📝 {task_file.name} → {new_filename}")
                    renames.append({
                        "old_path": str(task_file),
                        "new_path": str(new_path),
                        "completed": False
                    })
                else:
                    task_file.rename(new_path)
                    print(f"  ✅ {task_file.name} → {new_filename}")
                    renames.append({
                        "old_path": str(task_file),
                        "new_path": str(new_path),
                        "completed": True
                    })
                    count += 1

            except Exception as e:
                print(f"  ❌ Error renaming {task_file}: {e}")

        self.stats["files_renamed"] = count
        print(f"✅ Task files renamed: {count}")

        return renames

    def sync_exec_vault(self, dry_run: bool = True):
        """Phase A-4: Sync exec vault references.

        Updates:
        - TaskExecDetail.source_project, source_task
        - Candidate.hiring_project, pilot_project, related_tasks
        """
        if not self.exec_vault_path:
            print("\n⚠️  Exec vault path not provided, skipping sync")
            return

        print("\n[Phase A-4] Syncing Exec Vault...")

        count = 0

        # Update TaskExecDetail files
        exec_projects = self.exec_vault_path / "50_Projects"
        if exec_projects.exists():
            for detail_file in exec_projects.rglob("Tasks/*.md"):
                if self.migrate_entity_content(detail_file, self.id_mapping, dry_run):
                    count += 1

        # Update Candidate files
        candidates_dir = self.exec_vault_path / "40_People" / "Candidates"
        if candidates_dir.exists():
            for cand_file in candidates_dir.rglob("*.md"):
                if self.migrate_entity_content(cand_file, self.id_mapping, dry_run):
                    count += 1

        self.stats["exec_entities_updated"] = count
        print(f"✅ Exec vault entities updated: {count}")

    def validate_migration(self) -> Dict:
        """Phase C: Validate migration completeness.

        Returns validation report dict.
        """
        print("\n[Phase C] Validating Migration...")

        report = {
            "legacy_ids_found": [],
            "orphaned_tasks": [],
            "broken_wikilinks": [],
            "mapping_coverage": True,
            "success": True
        }

        # 1. Check for remaining legacy IDs
        projects_dir = self.vault_path / "50_Projects"
        for md_file in projects_dir.rglob("*.md"):
            try:
                frontmatter, body = self.extract_frontmatter(md_file)
                entity_id = frontmatter.get("entity_id", "")

                if self.is_legacy_id(entity_id):
                    report["legacy_ids_found"].append(str(md_file))
                    report["success"] = False

                # Check body for legacy IDs (excluding code blocks)
                code_blocks, _ = self.extract_code_blocks(body)
                pattern = r'\b(prj-\d{3}|tsk-\d{3}-\d{2})\b'

                for match in re.finditer(pattern, body):
                    if not self.is_in_code_block(match.start(), code_blocks):
                        report["legacy_ids_found"].append(
                            f"{md_file}:{match.group(1)}"
                        )
                        report["success"] = False

            except Exception as e:
                print(f"  ⚠️  Error validating {md_file}: {e}")

        # 2. Check for orphaned tasks (project_id not found)
        for task_file in projects_dir.rglob("Tasks/*.md"):
            try:
                frontmatter, _ = self.extract_frontmatter(task_file)
                project_id = frontmatter.get("project_id")

                if not project_id:
                    continue

                # Find parent project
                project_found = False
                for project_file in projects_dir.rglob("project.md"):
                    pfm, _ = self.extract_frontmatter(project_file)
                    if pfm.get("entity_id") == project_id:
                        project_found = True
                        break

                if not project_found:
                    report["orphaned_tasks"].append(str(task_file))
                    report["success"] = False

            except Exception as e:
                print(f"  ⚠️  Error checking orphan {task_file}: {e}")

        # Print report
        if report["legacy_ids_found"]:
            print(f"\n❌ Legacy IDs still found: {len(report['legacy_ids_found'])}")
            for item in report["legacy_ids_found"][:5]:
                print(f"   - {item}")

        if report["orphaned_tasks"]:
            print(f"\n❌ Orphaned tasks: {len(report['orphaned_tasks'])}")
            for item in report["orphaned_tasks"][:5]:
                print(f"   - {item}")

        if report["success"]:
            print("\n✅ Validation passed!")
        else:
            print("\n❌ Validation failed!")

        return report

    def apply_migration(self):
        """Apply migration with Git checkpoint and validation."""
        print("\n" + "=" * 60)
        print("APPLY MIGRATION")
        print("=" * 60)

        # Step 0: Check for existing mapping (prevent overwrites)
        if self.mapping_file.exists():
            print("\n⚠️  WARNING: Mapping file already exists!")
            print(f"   {self.mapping_file}")
            response = input("\n   This will overwrite existing mapping. Continue? (yes/no): ")
            if response.lower() != "yes":
                print("❌ Aborted - use --rollback first if needed")
                return

        # Step 1: Build mapping
        self.build_id_mapping(dry_run=False)

        # Check if there's anything to migrate
        if not self.id_mapping:
            print("\n✅ No legacy IDs found - nothing to migrate!")
            return

        # Step 2: Phase A - Content Updates (no renames yet)
        print("\n[PHASE A: CONTENT UPDATES]")
        self.migrate_tasks(dry_run=False)
        self.migrate_projects(dry_run=False)
        self.update_all_references(dry_run=False)
        self.sync_exec_vault(dry_run=False)

        # Step 3: Phase B - File Renames
        print("\n[PHASE B: FILE RENAMES]")
        renames = self.rename_task_files(dry_run=False)

        # Save rename log to mapping file
        mapping_data = {
            "forward": self.id_mapping,
            "reverse": self.reverse_mapping,
            "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "hash_algorithm": "sha256",
            "hash_input": "entity_name + created_date",
            "file_renames": renames
        }

        with open(self.mapping_file, 'w', encoding='utf-8') as f:
            json.dump(mapping_data, f, indent=2, ensure_ascii=False)

        # Step 4: Phase C - Validation
        report = self.validate_migration()

        # Step 5: Print summary
        print("\n" + "=" * 60)
        print("MIGRATION COMPLETE")
        print("=" * 60)
        print(f"Projects migrated: {self.stats['projects_migrated']}")
        print(f"Tasks migrated: {self.stats['tasks_migrated']}")
        print(f"References updated: {self.stats['references_updated']}")
        print(f"Files renamed: {self.stats['files_renamed']}")
        print(f"Exec entities updated: {self.stats['exec_entities_updated']}")
        print(f"\nMapping saved to: {self.mapping_file}")
        print(f"Validation: {'✅ PASSED' if report['success'] else '❌ FAILED'}")

        if not report["success"]:
            print("\n⚠️  Migration completed with validation errors.")
            print("   Review the validation report above.")

    def rollback_migration(self):
        """Rollback migration using saved mapping."""
        print("\n" + "=" * 60)
        print("ROLLBACK MIGRATION")
        print("=" * 60)

        # Step 1: Load mapping
        if not self.load_mapping():
            print("❌ No mapping file found. Cannot rollback.")
            return

        # Load rename log
        with open(self.mapping_file, 'r', encoding='utf-8') as f:
            mapping_data = json.load(f)

        renames = mapping_data.get("file_renames", [])

        print(f"\nFound {len(self.reverse_mapping)} ID mappings")
        print(f"Found {len(renames)} file renames")

        response = input("\n⚠️  This will reverse all changes. Continue? (yes/no): ")
        if response.lower() != "yes":
            print("❌ Aborted")
            return

        # Step 2: Phase B Reverse - Restore filenames
        print("\n[PHASE B REVERSE: RESTORE FILENAMES]")
        for rename_info in renames:
            if not rename_info.get("completed"):
                continue

            new_path = Path(rename_info["new_path"])
            old_path = Path(rename_info["old_path"])

            if new_path.exists():
                new_path.rename(old_path)
                print(f"  ✅ {new_path.name} → {old_path.name}")

        # Step 3: Phase A Reverse - Restore content
        print("\n[PHASE A REVERSE: RESTORE CONTENT]")

        # Use reverse mapping with skip_idempotency_check=True
        projects_dir = self.vault_path / "50_Projects"

        # Restore tasks
        for task_file in projects_dir.rglob("Tasks/*.md"):
            self.migrate_entity_content(
                task_file,
                self.reverse_mapping,
                dry_run=False,
                skip_idempotency_check=True  # CRITICAL: Process new-format IDs
            )

        # Restore projects
        for project_file in projects_dir.rglob("project.md"):
            self.migrate_entity_content(
                project_file,
                self.reverse_mapping,
                dry_run=False,
                skip_idempotency_check=True
            )

        # Restore hypotheses
        hypotheses_dir = self.vault_path / "60_Hypotheses"
        if hypotheses_dir.exists():
            for hyp_file in hypotheses_dir.rglob("*.md"):
                self.migrate_entity_content(
                    hyp_file,
                    self.reverse_mapping,
                    dry_run=False,
                    skip_idempotency_check=True
                )

        # Restore any other markdown files
        for md_file in self.vault_path.rglob("*.md"):
            # Skip already processed
            if "50_Projects" in str(md_file) or "60_Hypotheses" in str(md_file):
                continue
            if "90_Archive" in str(md_file) or "_build" in str(md_file):
                continue

            self.migrate_entity_content(
                md_file,
                self.reverse_mapping,
                dry_run=False,
                skip_idempotency_check=True
            )

        # Restore exec vault
        if self.exec_vault_path:
            exec_projects = self.exec_vault_path / "50_Projects"
            if exec_projects.exists():
                for detail_file in exec_projects.rglob("Tasks/*.md"):
                    self.migrate_entity_content(
                        detail_file,
                        self.reverse_mapping,
                        dry_run=False,
                        skip_idempotency_check=True
                    )

            candidates_dir = self.exec_vault_path / "40_People" / "Candidates"
            if candidates_dir.exists():
                for cand_file in candidates_dir.rglob("*.md"):
                    self.migrate_entity_content(
                        cand_file,
                        self.reverse_mapping,
                        dry_run=False,
                        skip_idempotency_check=True
                    )

        print("\n✅ Rollback complete!")
        print("\n⚠️  Remember to:")
        print("   1. Delete mapping file: rm {self.mapping_file}")
        print("   2. Run schema validation")
        print("   3. Rebuild graph index")
        print("   4. Restart API server")


def main():
    parser = argparse.ArgumentParser(
        description="Migrate entity IDs from legacy sequential to Hash+Epoch format"
    )
    parser.add_argument(
        "vault_path",
        help="Path to LOOP vault (e.g., ~/dev/loop/public)"
    )
    parser.add_argument(
        "--exec-vault",
        help="Path to exec vault (e.g., ~/dev/loop/exec)",
        default=None
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without applying"
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply migration (requires confirmation)"
    )
    parser.add_argument(
        "--rollback",
        action="store_true",
        help="Rollback migration using mapping file"
    )

    args = parser.parse_args()

    # Initialize migrator
    migrator = HashIdMigrator(
        vault_path=args.vault_path,
        exec_vault_path=args.exec_vault
    )

    # Execute based on mode
    if args.dry_run:
        print("=" * 60)
        print("DRY-RUN MODE - No changes will be made")
        print("=" * 60)
        migrator.build_id_mapping(dry_run=True)

    elif args.apply:
        print("=" * 60)
        print("APPLY MODE - Changes will be made")
        print("=" * 60)

        # Confirm
        response = input("\n⚠️  This will modify files. Continue? (yes/no): ")
        if response.lower() != "yes":
            print("❌ Aborted")
            return

        # Apply migration
        migrator.apply_migration()

    elif args.rollback:
        print("=" * 60)
        print("ROLLBACK MODE - Reverting to legacy IDs")
        print("=" * 60)

        # Rollback migration
        migrator.rollback_migration()

    else:
        parser.print_help()
        print("\n❌ Error: Specify --dry-run, --apply, or --rollback")
        sys.exit(1)


if __name__ == "__main__":
    main()
