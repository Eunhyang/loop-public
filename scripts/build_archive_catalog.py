#!/usr/bin/env python3
"""
build_archive_catalog.py - 90_Archive 카탈로그/인덱스 전체 재생성

Usage:
    python3 scripts/build_archive_catalog.py .
    python3 scripts/build_archive_catalog.py /path/to/vault

Generates:
    - 90_Archive/00_Catalog/catalog.jsonl
    - 90_Archive/00_Catalog/by_project/{prj-id}.md
    - 90_Archive/00_Catalog/by_time/{YYYY-MM}.md

See: 00_Meta/archive_policy.md for full specification
"""

import json
import os
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

import yaml


def parse_frontmatter(file_path: Path) -> tuple[dict, str]:
    """Parse YAML frontmatter from markdown file."""
    content = file_path.read_text(encoding='utf-8')

    if not content.startswith('---'):
        return {}, content

    parts = content.split('---', 2)
    if len(parts) < 3:
        return {}, content

    try:
        frontmatter = yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError:
        frontmatter = {}

    body = '---'.join(parts[2:]).lstrip('\n')
    return frontmatter, body


def extract_title(frontmatter: dict, body: str) -> str:
    """Extract title from frontmatter or body."""
    if frontmatter.get('entity_name'):
        return frontmatter['entity_name']

    for line in body.split('\n'):
        if line.startswith('# '):
            return line[2:].strip()

    return "Untitled"


def extract_summary(body: str, max_length: int = 100) -> str:
    """Extract first non-heading paragraph as summary."""
    lines = body.split('\n')
    for line in lines:
        line = line.strip()
        if line and not line.startswith('#') and not line.startswith('---'):
            if len(line) > max_length:
                return line[:max_length] + "..."
            return line
    return ""


def format_date(date_val) -> str:
    """Format date value to string."""
    if isinstance(date_val, datetime):
        return date_val.strftime('%Y-%m-%d')
    return str(date_val) if date_val else ""


def scan_archive(vault_path: Path) -> list[dict]:
    """Scan all archived tasks and return metadata list."""
    archive_tasks_path = vault_path / '90_Archive' / 'tasks'

    if not archive_tasks_path.exists():
        return []

    entries = []

    for task_file in archive_tasks_path.glob('**/*.md'):
        frontmatter, body = parse_frontmatter(task_file)

        if not frontmatter:
            continue

        task_id = frontmatter.get('task_id') or frontmatter.get('entity_id')
        if not task_id:
            continue

        entry = {
            'vault': 'loop_obsidian',
            'entity_type': frontmatter.get('entity_type', 'task'),
            'task_id': task_id,
            'project_id': frontmatter.get('project_id', ''),
            'created': format_date(frontmatter.get('created')),
            'closed': format_date(frontmatter.get('closed')),
            'status': frontmatter.get('status', ''),
            'title': extract_title(frontmatter, body),
            'summary': extract_summary(body),
            'path': str(task_file.relative_to(vault_path)),
            'tags': frontmatter.get('tags', []),
        }

        entries.append(entry)

    return entries


def write_catalog_jsonl(entries: list[dict], output_path: Path):
    """Write catalog.jsonl with sorted entries."""
    # Sort: closed DESC, task_id ASC
    sorted_entries = sorted(
        entries,
        key=lambda x: (x['closed'] or '0000-00-00', x['task_id']),
        reverse=True
    )
    # Re-sort to get task_id ASC within same closed date
    sorted_entries = sorted(
        sorted_entries,
        key=lambda x: (-(int(x['closed'].replace('-', '')) if x['closed'] else 0), x['task_id'])
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        for entry in sorted_entries:
            f.write(json.dumps(entry, ensure_ascii=False) + '\n')

    print(f"  Written: {output_path} ({len(entries)} entries)")


def write_by_project_index(entries: list[dict], output_dir: Path, vault_path: Path):
    """Write by_project/{prj-id}.md index files."""
    output_dir.mkdir(parents=True, exist_ok=True)

    # Group by project_id
    by_project = defaultdict(list)
    for entry in entries:
        prj_id = entry.get('project_id')
        if prj_id:
            by_project[prj_id].append(entry)

    # Remove old index files
    for old_file in output_dir.glob('*.md'):
        if old_file.name != '_INDEX_TEMPLATE.md':
            old_file.unlink()

    today = datetime.now().strftime('%Y-%m-%d')

    for prj_id, tasks in by_project.items():
        # Sort: closed DESC
        tasks_sorted = sorted(
            tasks,
            key=lambda x: x['closed'] or '0000-00-00',
            reverse=True
        )

        # Calculate stats
        total = len(tasks_sorted)
        dates = [t['closed'] for t in tasks_sorted if t['closed']]
        date_range = f"{min(dates)} ~ {max(dates)}" if dates else "-"

        # Build markdown
        lines = [
            f"# Project Archive Index: {prj_id}",
            "",
            f"> {prj_id} 프로젝트의 아카이브된 태스크 인덱스",
            "",
            "## Quick Stats",
            "",
            "| Metric | Value |",
            "|--------|-------|",
            f"| Total Archived | {total} |",
            f"| Date Range | {date_range} |",
            f"| Last Updated | {today} |",
            "",
            "---",
            "",
            "## Archived Tasks",
            "",
            "| ID | Title | Closed | Summary |",
            "|----|-------|--------|---------|",
        ]

        for task in tasks_sorted:
            task_id = task['task_id']
            title = task['title'][:40] + "..." if len(task['title']) > 40 else task['title']
            closed = task['closed']
            summary = task['summary'][:50] + "..." if len(task['summary']) > 50 else task['summary']
            lines.append(f"| `{task_id}` | {title} | {closed} | {summary} |")

        output_file = output_dir / f"{prj_id}.md"
        output_file.write_text('\n'.join(lines), encoding='utf-8')

    print(f"  Written: {output_dir}/ ({len(by_project)} project indexes)")


def write_by_time_index(entries: list[dict], output_dir: Path, vault_path: Path):
    """Write by_time/{YYYY-MM}.md index files."""
    output_dir.mkdir(parents=True, exist_ok=True)

    # Group by YYYY-MM
    by_month = defaultdict(list)
    for entry in entries:
        closed = entry.get('closed')
        if closed and len(closed) >= 7:
            month_key = closed[:7]  # YYYY-MM
            by_month[month_key].append(entry)

    # Remove old index files
    for old_file in output_dir.glob('*.md'):
        if old_file.name != '_INDEX_TEMPLATE.md':
            old_file.unlink()

    today = datetime.now().strftime('%Y-%m-%d')

    for month_key, tasks in by_month.items():
        # Sort: task_id ASC
        tasks_sorted = sorted(tasks, key=lambda x: x['task_id'])

        # Calculate stats
        total = len(tasks_sorted)
        projects = sorted(set(t['project_id'] for t in tasks_sorted if t['project_id']))

        # Build markdown
        lines = [
            f"# Monthly Archive Index: {month_key}",
            "",
            f"> {month_key}월에 종료된 태스크 인덱스",
            "",
            "## Quick Stats",
            "",
            "| Metric | Value |",
            "|--------|-------|",
            f"| Total Archived | {total} |",
            f"| Projects | {', '.join(projects)} |",
            f"| Last Updated | {today} |",
            "",
            "---",
            "",
            "## Archived This Month",
            "",
            "| ID | Project | Title | Closed |",
            "|----|---------|-------|--------|",
        ]

        for task in tasks_sorted:
            task_id = task['task_id']
            project_id = task['project_id']
            title = task['title'][:35] + "..." if len(task['title']) > 35 else task['title']
            closed = task['closed']
            lines.append(f"| `{task_id}` | {project_id} | {title} | {closed} |")

        output_file = output_dir / f"{month_key}.md"
        output_file.write_text('\n'.join(lines), encoding='utf-8')

    print(f"  Written: {output_dir}/ ({len(by_month)} monthly indexes)")


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/build_archive_catalog.py <vault_path>")
        sys.exit(1)

    vault_path = Path(sys.argv[1]).resolve()

    if not vault_path.exists():
        print(f"ERROR: Vault path not found: {vault_path}")
        sys.exit(1)

    print(f"Building archive catalog for: {vault_path}")

    # Scan archive
    entries = scan_archive(vault_path)
    print(f"  Found {len(entries)} archived tasks")

    if not entries:
        print("  No archived tasks found. Creating empty catalog.")

    # Output paths
    catalog_dir = vault_path / '90_Archive' / '00_Catalog'

    # Write catalog.jsonl
    write_catalog_jsonl(entries, catalog_dir / 'catalog.jsonl')

    # Write by_project indexes
    write_by_project_index(entries, catalog_dir / 'by_project', vault_path)

    # Write by_time indexes
    write_by_time_index(entries, catalog_dir / 'by_time', vault_path)

    print("\nDone!")


if __name__ == '__main__':
    main()
