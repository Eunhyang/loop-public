#!/usr/bin/env python3
"""
archive_task.py - 단일 태스크를 90_Archive로 이동

Usage:
    python3 scripts/archive_task.py path/to/task.md
    python3 scripts/archive_task.py --task-id tsk-003-01
    python3 scripts/archive_task.py path/to/task.md --dry-run
    python3 scripts/archive_task.py path/to/task.md --no-stub

See: 00_Meta/archive_policy.md for full specification
"""

import argparse
import os
import re
import subprocess
import sys
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


def write_frontmatter(file_path: Path, frontmatter: dict, body: str):
    """Write YAML frontmatter and body to markdown file."""
    yaml_str = yaml.dump(frontmatter, allow_unicode=True, default_flow_style=False, sort_keys=False)
    content = f"---\n{yaml_str}---\n\n{body}"
    file_path.write_text(content, encoding='utf-8')


def get_git_last_commit_date(file_path: Path) -> str | None:
    """Get the last commit date for a file."""
    try:
        result = subprocess.run(
            ['git', 'log', '-1', '--format=%cs', '--', str(file_path)],
            capture_output=True,
            text=True,
            cwd=file_path.parent
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except Exception:
        pass
    return None


def find_task_by_id(vault_path: Path, task_id: str) -> Path | None:
    """Find a task file by task_id in the hot folders."""
    for task_file in vault_path.glob('50_Projects/**/Tasks/*.md'):
        fm, _ = parse_frontmatter(task_file)
        if fm.get('task_id') == task_id or fm.get('entity_id') == task_id:
            return task_file
    return None


def find_project(vault_path: Path, project_id: str) -> tuple[Path | None, dict]:
    """
    Find a project file by project_id.

    Returns: (file_path, frontmatter) or (None, {})
    """
    # Search patterns for project files
    patterns = [
        f'50_Projects/**/{project_id}*/_PROJECT.md',
        f'50_Projects/**/{project_id}*/Project_정의.md',
        f'50_Projects/**/P*_{project_id}*/_PROJECT.md',
        f'50_Projects/**/P*_{project_id}*/Project_정의.md',
        f'50_Projects/**/*{project_id}*/_PROJECT.md',
    ]

    for pattern in patterns:
        for project_file in vault_path.glob(pattern):
            fm, _ = parse_frontmatter(project_file)
            pid = fm.get('project_id') or fm.get('entity_id')
            if pid == project_id:
                return project_file, fm

    # Fallback: search all markdown files in project folders
    for project_file in vault_path.glob('50_Projects/**/*.md'):
        if '/Tasks/' in str(project_file):
            continue
        fm, _ = parse_frontmatter(project_file)
        if fm.get('entity_type') == 'Project':
            pid = fm.get('project_id') or fm.get('entity_id')
            if pid == project_id:
                return project_file, fm

    return None, {}


def check_duplicate_in_archive(vault_path: Path, task_id: str) -> bool:
    """Check if task_id already exists in archive."""
    archive_path = vault_path / '90_Archive' / 'tasks'
    if not archive_path.exists():
        return False

    for task_file in archive_path.glob('**/*.md'):
        fm, _ = parse_frontmatter(task_file)
        if fm.get('task_id') == task_id or fm.get('entity_id') == task_id:
            return True
    return False


def determine_closed_date(frontmatter: dict, file_path: Path) -> tuple[str, str | None]:
    """
    Determine closed date based on priority:
    1. Existing closed field
    2. updated field
    3. git last commit date
    4. today

    Returns: (closed_date, closed_inferred)
    """
    today = datetime.now().strftime('%Y-%m-%d')

    # Priority 1: Already has closed
    if frontmatter.get('closed'):
        closed = frontmatter['closed']
        if isinstance(closed, datetime):
            closed = closed.strftime('%Y-%m-%d')
        return str(closed), None

    # Priority 2: Use updated
    if frontmatter.get('updated'):
        updated = frontmatter['updated']
        if isinstance(updated, datetime):
            updated = updated.strftime('%Y-%m-%d')
        return str(updated), 'updated'

    # Priority 3: Git last commit date
    git_date = get_git_last_commit_date(file_path)
    if git_date:
        return git_date, 'git_commit_date'

    # Priority 4: Today
    return today, 'today'


def extract_title_from_body(body: str) -> str:
    """Extract title from markdown body (first # heading)."""
    for line in body.split('\n'):
        if line.startswith('# '):
            return line[2:].strip()
    return "Untitled"


def create_stub(
    stub_path: Path,
    frontmatter: dict,
    archive_path: str,
    title: str,
    summary: str = ""
):
    """Create a stub file pointing to the archived task."""
    stub_fm = {
        'task_id': frontmatter.get('task_id') or frontmatter.get('entity_id'),
        'project_id': frontmatter.get('project_id'),
        'status': frontmatter.get('status'),
        'closed': frontmatter.get('closed'),
        'archived_at': frontmatter.get('archived_at'),
        'archive_path': archive_path,
    }

    stub_body = f"""# {stub_fm['task_id']}: {title}

{summary if summary else '(archived)'}

## Links
- [[{archive_path}|원문 보기]]
"""

    stub_path.parent.mkdir(parents=True, exist_ok=True)
    write_frontmatter(stub_path, stub_fm, stub_body)


def archive_task(
    file_path: Path,
    vault_path: Path,
    dry_run: bool = False,
    no_stub: bool = False
) -> bool:
    """
    Archive a single task file.

    Returns True on success, False on failure.
    """
    print(f"Processing: {file_path}")

    # Parse frontmatter
    frontmatter, body = parse_frontmatter(file_path)

    # Validation
    task_id = frontmatter.get('task_id') or frontmatter.get('entity_id')
    project_id = frontmatter.get('project_id')
    status = frontmatter.get('status')

    if not task_id:
        print(f"  ERROR: task_id (or entity_id) is required")
        return False

    if not project_id:
        print(f"  ERROR: project_id is required")
        return False

    if status not in ('done', 'failed', 'learning'):
        print(f"  ERROR: status must be done, failed, or learning (got: {status})")
        return False

    # Check project status (archive eligibility)
    project_file, project_fm = find_project(vault_path, project_id)
    if not project_file:
        print(f"  WARNING: Could not find project {project_id}, proceeding anyway")
    else:
        project_status = project_fm.get('status')
        has_program_id = bool(project_fm.get('program_id'))

        print(f"  Project: {project_id} (status: {project_status}, program_id: {has_program_id})")

        if has_program_id:
            # Program-Round project: can archive regardless of project status
            print(f"  → Program-Round project: archive allowed")
        else:
            # Regular project: must be done to archive tasks
            if project_status != 'done':
                print(f"  ERROR: Cannot archive task - project {project_id} is not done (status: {project_status})")
                print(f"         Regular projects must be completed before archiving tasks.")
                print(f"         (Program-Round projects with program_id can archive anytime)")
                return False
            print(f"  → Regular project (done): archive allowed")

    # Check for duplicates in archive
    if check_duplicate_in_archive(vault_path, task_id):
        print(f"  ERROR: {task_id} already exists in archive")
        return False

    # Determine closed date
    closed_date, closed_inferred = determine_closed_date(frontmatter, file_path)
    print(f"  closed: {closed_date}" + (f" (inferred: {closed_inferred})" if closed_inferred else ""))

    # Update frontmatter
    frontmatter['closed'] = closed_date
    frontmatter['archived_at'] = datetime.now().strftime('%Y-%m-%d')
    if closed_inferred:
        frontmatter['closed_inferred'] = closed_inferred

    # Calculate destination path
    year, month = closed_date[:4], closed_date[5:7]
    dest_dir = vault_path / '90_Archive' / 'tasks' / project_id / year / month
    dest_file = dest_dir / f"{task_id}.md"

    print(f"  Destination: {dest_file.relative_to(vault_path)}")

    if dry_run:
        print("  [DRY RUN] Would move file and create stub")
        return True

    # Create destination directory
    dest_dir.mkdir(parents=True, exist_ok=True)

    # Update the file with new frontmatter before moving
    write_frontmatter(file_path, frontmatter, body)

    # Git mv
    try:
        subprocess.run(
            ['git', 'mv', str(file_path), str(dest_file)],
            check=True,
            cwd=vault_path
        )
        print(f"  Moved: {file_path.name} -> {dest_file.relative_to(vault_path)}")
    except subprocess.CalledProcessError as e:
        print(f"  ERROR: git mv failed: {e}")
        return False

    # Create stub
    if not no_stub:
        # Find project folder for stub location
        # Pattern: 50_Projects/{year}/{prj-folder}/_task_stubs/{task_id}.md
        project_folders = list(vault_path.glob(f'50_Projects/**/{project_id}*'))
        if not project_folders:
            project_folders = list(vault_path.glob(f'50_Projects/**/P*_{project_id}*'))

        if project_folders:
            # Use the first matching project folder
            project_folder = project_folders[0]
            stub_path = project_folder / '_task_stubs' / f"{task_id}.md"
        else:
            # Fallback: create in a generic location
            stub_path = vault_path / '50_Projects' / '_task_stubs' / f"{task_id}.md"

        title = extract_title_from_body(body)
        archive_rel_path = str(dest_file.relative_to(vault_path))

        create_stub(stub_path, frontmatter, archive_rel_path, title)
        print(f"  Stub created: {stub_path.relative_to(vault_path)}")

    return True


def main():
    parser = argparse.ArgumentParser(
        description='Archive a task to 90_Archive',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument(
        'file_path',
        nargs='?',
        help='Path to the task markdown file'
    )
    parser.add_argument(
        '--task-id',
        help='Find and archive task by task_id'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be done without making changes'
    )
    parser.add_argument(
        '--no-stub',
        action='store_true',
        help='Do not create stub file'
    )
    parser.add_argument(
        '--vault',
        default='.',
        help='Path to vault root (default: current directory)'
    )

    args = parser.parse_args()

    vault_path = Path(args.vault).resolve()

    # Find the task file
    if args.task_id:
        file_path = find_task_by_id(vault_path, args.task_id)
        if not file_path:
            print(f"ERROR: Could not find task with id: {args.task_id}")
            sys.exit(1)
    elif args.file_path:
        file_path = Path(args.file_path)
        if not file_path.is_absolute():
            file_path = vault_path / file_path
        if not file_path.exists():
            print(f"ERROR: File not found: {file_path}")
            sys.exit(1)
    else:
        parser.print_help()
        sys.exit(1)

    # Archive the task
    success = archive_task(
        file_path=file_path,
        vault_path=vault_path,
        dry_run=args.dry_run,
        no_stub=args.no_stub
    )

    if success:
        print("\nDone! Run build_archive_catalog.py to update indexes.")
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == '__main__':
    main()
