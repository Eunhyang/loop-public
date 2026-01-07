#!/usr/bin/env python3
"""
Task Filename Pattern Analysis Script

Analyzes Task filename patterns in both LOOP public and exec vaults
Supports: tsk-022-24 (SSOT - Task 파일명 규칙 강제 구현)

Usage:
    python3 scripts/analyze_task_filenames.py

Output:
    - Statistics printed to stdout
    - Detailed report with examples
"""

import re
from pathlib import Path
from collections import Counter
from datetime import datetime
from typing import Dict, List, Tuple


def analyze_task_filenames(vault_path: Path, vault_name: str) -> Dict[str, any]:
    """Analyze Task filename patterns in a vault

    Args:
        vault_path: Path to vault root
        vault_name: "public" or "exec"

    Returns:
        Dict with pattern counts and examples
    """
    patterns = {
        'tsk_id_only': re.compile(r'^tsk-[\w-]+\.md$'),  # tsk-022-24.md
        'tsk_id_desc': re.compile(r'^tsk-[\w-]+_.+\.md$'),  # tsk-022-24_Description.md
    }

    results = Counter()
    examples: Dict[str, List[str]] = {
        'tsk_id_only': [],
        'tsk_id_desc': [],
        'content_based': []
    }

    # Search for Task files in Projects
    task_files = list(vault_path.rglob('50_Projects/**/Tasks/*.md'))

    for file_path in task_files:
        filename = file_path.name

        if patterns['tsk_id_only'].match(filename):
            results['tsk_id_only'] += 1
            if len(examples['tsk_id_only']) < 5:
                examples['tsk_id_only'].append(filename)
        elif patterns['tsk_id_desc'].match(filename):
            results['tsk_id_desc'] += 1
            if len(examples['tsk_id_desc']) < 5:
                examples['tsk_id_desc'].append(filename)
        else:
            results['content_based'] += 1
            if len(examples['content_based']) < 5:
                examples['content_based'].append(filename)

    total = sum(results.values())

    return {
        'vault_name': vault_name,
        'total': total,
        'counts': dict(results),
        'percentages': {
            k: (v / total * 100) if total > 0 else 0
            for k, v in results.items()
        },
        'examples': examples
    }


def print_report(results: List[Dict[str, any]]):
    """Print formatted analysis report"""
    print("\n" + "="*80)
    print("TASK FILENAME PATTERN ANALYSIS")
    print("="*80)
    print(f"\nAnalysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Script: {Path(__file__).name}")
    print("\n" + "-"*80)

    # Combined statistics
    total_all = sum(r['total'] for r in results)
    combined_counts = Counter()
    for r in results:
        for pattern, count in r['counts'].items():
            combined_counts[pattern] += count

    print("\nOVERALL STATISTICS (Both Vaults)")
    print("-"*80)
    print(f"Total Tasks: {total_all}")

    for pattern in ['tsk_id_only', 'tsk_id_desc', 'content_based']:
        count = combined_counts.get(pattern, 0)
        pct = (count / total_all * 100) if total_all > 0 else 0
        print(f"  {pattern:20s}: {count:5d} ({pct:5.1f}%)")

    # Per-vault breakdown
    for result in results:
        vault = result['vault_name']
        total = result['total']
        counts = result['counts']
        percentages = result['percentages']
        examples = result['examples']

        print(f"\n{vault.upper()} VAULT")
        print("-"*80)
        print(f"Total Tasks: {total}")

        if total == 0:
            print("  No tasks found")
            continue

        for pattern in ['tsk_id_only', 'tsk_id_desc', 'content_based']:
            count = counts.get(pattern, 0)
            pct = percentages.get(pattern, 0)
            print(f"  {pattern:20s}: {count:5d} ({pct:5.1f}%)")

            # Show examples
            if examples[pattern]:
                print(f"    Examples:")
                for ex in examples[pattern]:
                    print(f"      - {ex}")

    # Target state
    print("\n" + "-"*80)
    print("TARGET STATE")
    print("-"*80)
    print("Goal: 100% tsk_id_only (tsk-{id}.md)")
    print("Current: {:.1f}% tsk_id_only".format(
        (combined_counts.get('tsk_id_only', 0) / total_all * 100) if total_all > 0 else 0
    ))
    print("Remaining: {} files to migrate".format(
        combined_counts.get('tsk_id_desc', 0) + combined_counts.get('content_based', 0)
    ))

    print("\n" + "="*80)


def main():
    """Main entry point"""
    # Determine vault paths
    script_path = Path(__file__).resolve()
    public_vault = script_path.parent.parent  # scripts/ -> public/

    # Check for exec vault (may not exist in all environments)
    exec_vault = public_vault.parent / "exec"

    results = []

    # Analyze public vault
    print(f"Analyzing public vault: {public_vault}")
    public_result = analyze_task_filenames(public_vault, "public")
    results.append(public_result)

    # Analyze exec vault if it exists
    if exec_vault.exists() and exec_vault.is_dir():
        print(f"Analyzing exec vault: {exec_vault}")
        exec_result = analyze_task_filenames(exec_vault, "exec")
        results.append(exec_result)
    else:
        print(f"Exec vault not found: {exec_vault} (skipping)")

    # Print combined report
    print_report(results)


if __name__ == "__main__":
    main()
