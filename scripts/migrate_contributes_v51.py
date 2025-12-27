#!/usr/bin/env python3
"""
LOOP Vault Schema Migration: contributes → condition_contributes + track_contributes
스키마 버전: v5.0 → v5.1

변경 사항:
- contributes → condition_contributes (Condition 기여)
- track_contributes 필드 추가 (Secondary Track 기여, 기본값 [])

Usage:
    python3 scripts/migrate_contributes_v51.py .              # Dry run (기본)
    python3 scripts/migrate_contributes_v51.py . --apply      # 실제 적용
    python3 scripts/migrate_contributes_v51.py . --verbose    # 상세 출력
"""

import os
import re
import sys
import yaml
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# 스캔 경로
INCLUDE_PATHS = ["50_Projects"]


def extract_frontmatter(content: str) -> Tuple[Optional[Dict], str, str]:
    """마크다운에서 YAML frontmatter 추출

    Returns:
        (frontmatter_dict, frontmatter_raw, body)
    """
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n?(.*)', content, re.DOTALL)
    if match:
        try:
            fm_raw = match.group(1)
            fm_dict = yaml.safe_load(fm_raw)
            body = match.group(2)
            return fm_dict, fm_raw, body
        except yaml.YAMLError:
            return None, "", content
    return None, "", content


def needs_migration(frontmatter: Dict) -> bool:
    """마이그레이션 필요 여부 체크"""
    if frontmatter.get("entity_type") != "Project":
        return False

    # 이미 condition_contributes가 있으면 스킵
    if "condition_contributes" in frontmatter:
        return False

    # contributes 필드가 있으면 마이그레이션 필요
    if "contributes" in frontmatter:
        return True

    return False


def migrate_frontmatter(fm_raw: str, frontmatter: Dict, verbose: bool = False) -> str:
    """Frontmatter 마이그레이션

    contributes → condition_contributes
    + track_contributes: [] 추가
    """
    new_fm = fm_raw

    # 1. contributes → condition_contributes 변환
    # YAML 구조 유지하면서 키 이름만 변경
    contributes = frontmatter.get("contributes", [])

    if contributes:
        # contributes: 를 condition_contributes: 로 변경
        new_fm = re.sub(
            r'^contributes:',
            'condition_contributes:',
            new_fm,
            flags=re.MULTILINE
        )

        if verbose:
            print(f"  - contributes → condition_contributes ({len(contributes)} items)")

    # 2. track_contributes 추가 (condition_contributes 블록 끝 다음에)
    # condition_contributes 블록 끝을 찾아서 그 다음에 추가

    # expected_impact 앞에 track_contributes 추가
    if "expected_impact:" in new_fm:
        new_fm = re.sub(
            r'\n(expected_impact:)',
            '\ntrack_contributes: []\n\n\\1',
            new_fm
        )
        if verbose:
            print(f"  - track_contributes: [] 추가")
    elif "realized_impact:" in new_fm:
        # expected_impact 없으면 realized_impact 앞에
        new_fm = re.sub(
            r'\n(realized_impact:)',
            '\ntrack_contributes: []\n\n\\1',
            new_fm
        )
        if verbose:
            print(f"  - track_contributes: [] 추가")

    return new_fm


def collect_project_files(vault_root: Path) -> List[Path]:
    """마이그레이션 대상 Project 파일 수집"""
    files = []

    for filepath in vault_root.rglob("*.md"):
        relative = str(filepath.relative_to(vault_root))

        # 포함 경로 체크
        should_include = any(relative.startswith(inc) for inc in INCLUDE_PATHS)
        if not should_include:
            continue

        # 템플릿 제외
        if "_TEMPLATES" in relative:
            continue

        files.append(filepath)

    return files


def migrate_file(filepath: Path, apply: bool = False, verbose: bool = False) -> bool:
    """단일 파일 마이그레이션

    Returns:
        True if migrated, False if skipped
    """
    try:
        content = filepath.read_text(encoding="utf-8")
    except Exception as e:
        print(f"  ⚠️ 읽기 실패: {e}")
        return False

    frontmatter, fm_raw, body = extract_frontmatter(content)

    if not frontmatter:
        return False

    if not needs_migration(frontmatter):
        return False

    # 마이그레이션 수행
    new_fm = migrate_frontmatter(fm_raw, frontmatter, verbose)

    # 새 콘텐츠 조합
    new_content = f"---\n{new_fm}\n---\n{body}"

    if apply:
        filepath.write_text(new_content, encoding="utf-8")
        return True
    else:
        return True  # Dry run에서도 True 반환 (마이그레이션 대상)


def main(vault_path: str, apply: bool = False, verbose: bool = False) -> int:
    """메인 함수"""
    vault_root = Path(vault_path).resolve()

    if not vault_root.exists():
        print(f"Error: Vault path does not exist: {vault_root}")
        return 1

    print(f"=== Schema Migration: v5.0 → v5.1 ===")
    print(f"Vault: {vault_root}")
    print(f"Mode: {'APPLY (실제 변경)' if apply else 'DRY RUN (미리보기)'}")
    print()

    # 파일 수집
    files = collect_project_files(vault_root)
    print(f"스캔 대상: {len(files)} 파일")
    print()

    # 마이그레이션
    migrated = []
    skipped = []

    for filepath in files:
        relative = str(filepath.relative_to(vault_root))

        # frontmatter 로드해서 체크
        try:
            content = filepath.read_text(encoding="utf-8")
        except:
            continue

        fm, _, _ = extract_frontmatter(content)
        if not fm or fm.get("entity_type") != "Project":
            continue

        if not needs_migration(fm):
            skipped.append(relative)
            continue

        print(f"📄 {relative}")
        result = migrate_file(filepath, apply=apply, verbose=verbose)

        if result:
            migrated.append(relative)
            status = "✅ 마이그레이션됨" if apply else "🔍 마이그레이션 필요"
            print(f"  {status}")
        print()

    # 결과 요약
    print("=" * 50)
    print(f"=== 마이그레이션 결과 ===")
    print(f"대상 파일: {len(migrated)}")
    print(f"스킵 (이미 v5.1): {len(skipped)}")

    if migrated:
        print()
        print("마이그레이션 대상:")
        for f in migrated:
            print(f"  - {f}")

    if not apply and migrated:
        print()
        print("💡 실제 적용하려면: python3 scripts/migrate_contributes_v51.py . --apply")

    return 0


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Schema v5.1 Migration")
    parser.add_argument("vault_path", help="Vault root path")
    parser.add_argument("--apply", action="store_true", help="실제 변경 적용")
    parser.add_argument("--verbose", "-v", action="store_true", help="상세 출력")

    args = parser.parse_args()
    sys.exit(main(args.vault_path, apply=args.apply, verbose=args.verbose))
