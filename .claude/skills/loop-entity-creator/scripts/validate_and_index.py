#!/usr/bin/env python3
"""
LOOP Validation and Indexing
Runs all validation scripts and updates graph index.
"""

import sys
import subprocess
from pathlib import Path
from typing import Optional

def find_vault_root(start_path: Path) -> Optional[Path]:
    """Find LOOP vault root by looking for CLAUDE.md"""
    current = start_path.resolve()
    while current != current.parent:
        if (current / "CLAUDE.md").exists():
            return current
        current = current.parent
    return None

def run_script(script_path: Path, vault_root: Path, description: str):
    """Run a Python script and display results"""
    if not script_path.exists():
        print(f"⚠️  {description}: Script not found at {script_path}")
        return False

    print(f"\n🔍 {description}...")
    result = subprocess.run(
        ["python3", str(script_path), str(vault_root)],
        capture_output=True,
        text=True
    )

    if result.returncode == 0:
        print(f"✅ {description}: PASSED")
        if result.stdout.strip():
            print(result.stdout)
        return True
    else:
        print(f"⚠️  {description}: WARNINGS/ERRORS")
        print(result.stdout)
        if result.stderr:
            print(result.stderr)
        return False

def main():
    # Find vault root
    vault_root = find_vault_root(Path.cwd())
    if not vault_root:
        print("❌ Could not find LOOP vault root (CLAUDE.md not found)")
        sys.exit(1)

    print("=" * 60)
    print("🚀 LOOP Vault Validation and Indexing")
    print("=" * 60)
    print(f"📁 Vault: {vault_root}")

    # Run validation scripts
    validate_schema = vault_root / "scripts" / "validate_schema.py"
    check_orphans = vault_root / "scripts" / "check_orphans.py"
    build_graph = vault_root / "scripts" / "build_graph_index.py"

    results = []

    # 1. Schema Validation
    results.append(run_script(
        validate_schema,
        vault_root,
        "Schema Validation"
    ))

    # 2. Orphan Check
    results.append(run_script(
        check_orphans,
        vault_root,
        "Orphan Link Check"
    ))

    # 3. Graph Index Build
    results.append(run_script(
        build_graph,
        vault_root,
        "Graph Index Build"
    ))

    # Summary
    print("\n" + "=" * 60)
    print("📊 Validation Summary")
    print("=" * 60)

    if all(results):
        print("✅ All checks passed successfully!")
        print("\n💡 Your LOOP vault is healthy and ready for use.")
    else:
        print("⚠️  Some checks reported warnings or errors.")
        print("\n💡 Please review the output above and fix any issues.")
        print("   The vault will still function, but GraphRAG patterns")
        print("   may not be optimal until issues are resolved.")

if __name__ == "__main__":
    main()
