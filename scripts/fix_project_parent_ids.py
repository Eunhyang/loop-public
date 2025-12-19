#!/usr/bin/env python3
"""
Project parent_id 일괄 수정 스크립트

프로젝트 → Track 매핑:
- prj:001 → trk:2 (Ontology - Data)
- prj:002 → trk:4 (와디즈 코칭 - Coaching)
- prj:003 → trk:2 (LoopOS 데이터 설계 - Data)
- prj:004 → trk:2 (placeholder - Data default)
- prj:005 → trk:2 (LoopOS 선제 학습 - Data)
- prj:006 → trk:4 (코치 구인/온보딩 - Coaching)
- prj:007 → trk:6 (외부 비서 - Revenue/Ops)
- prj:008 → trk:4 (파일럿 프로젝트 - Coaching)
- prj:009 → trk:6 (투자/TIPS - Revenue)
- prj:010 → trk:6 (펀딩/마케팅 - Revenue)
- prj:011 → trk:5 (리크루팅 사이트 - Partnership)
- prj:012 → trk:4 (CS/운영 - Coaching)
- prj:013 → trk:3 (YouTube - Content)
- prj:014 → trk:4 (1:1 코칭 - Coaching)
"""

import re
import sys
from pathlib import Path

# Project → Track 매핑
PROJECT_TO_TRACK = {
    "prj:001": "trk:2",  # Ontology - Data
    "prj:002": "trk:4",  # 와디즈 코칭 - Coaching
    "prj:003": "trk:2",  # LoopOS 데이터 설계 - Data
    "prj:004": "trk:2",  # placeholder - Data default
    "prj:005": "trk:2",  # LoopOS 선제 학습 - Data
    "prj:006": "trk:4",  # 코치 구인/온보딩 - Coaching
    "prj:007": "trk:6",  # 외부 비서 - Revenue/Ops
    "prj:008": "trk:4",  # 파일럿 프로젝트 - Coaching
    "prj:009": "trk:6",  # 투자/TIPS - Revenue
    "prj:010": "trk:6",  # 펀딩/마케팅 - Revenue
    "prj:011": "trk:5",  # 리크루팅 사이트 - Partnership
    "prj:012": "trk:4",  # CS/운영 - Coaching
    "prj:013": "trk:3",  # YouTube - Content
    "prj:014": "trk:4",  # 1:1 코칭 - Coaching
}


def fix_project_file(filepath: Path, project_id: str, new_track: str, dry_run: bool = True) -> bool:
    """프로젝트 파일의 parent_id 수정"""
    content = filepath.read_text(encoding="utf-8")

    # parent_id: trk:X 또는 parent_id: "trk:X" 패턴 찾기
    pattern = r'(parent_id:\s*)"?trk:\d+"?'
    match = re.search(pattern, content)

    if not match:
        print(f"  [SKIP] {project_id}: parent_id not found")
        return False

    old_value = match.group(0)

    # 따옴표 있는지 확인
    has_quotes = '"' in old_value
    new_value = f'parent_id: "{new_track}"' if has_quotes else f"parent_id: {new_track}"

    # 이미 올바른 값인지 확인
    if new_track in old_value:
        print(f"  [SKIP] {project_id}: already {new_track}")
        return False

    if dry_run:
        print(f"  [DRY-RUN] {project_id}: {old_value} → {new_value}")
        return True

    # 실제 수정
    new_content = re.sub(pattern, new_value, content)

    # track_id도 함께 수정 (있는 경우)
    track_pattern = r'(track_id:\s*)"?trk:\d+"?'
    track_match = re.search(track_pattern, new_content)
    if track_match:
        track_has_quotes = '"' in track_match.group(0)
        track_new_value = f'track_id: "{new_track}"' if track_has_quotes else f"track_id: {new_track}"
        new_content = re.sub(track_pattern, track_new_value, new_content)

    filepath.write_text(new_content, encoding="utf-8")
    print(f"  [UPDATED] {project_id}: → {new_track}")
    return True


def main(vault_path: str, dry_run: bool = True) -> int:
    vault_root = Path(vault_path).resolve()
    projects_dir = vault_root / "50_Projects" / "2025"

    if not projects_dir.exists():
        print(f"Error: {projects_dir} not found")
        return 1

    print("=== Project parent_id Fix Script ===\n")
    print(f"Mode: {'DRY-RUN' if dry_run else 'LIVE'}")
    print(f"Projects dir: {projects_dir}\n")

    updated = 0

    for project_dir in sorted(projects_dir.iterdir()):
        if not project_dir.is_dir():
            continue

        # Project_정의.md 찾기
        project_file = project_dir / "Project_정의.md"
        if not project_file.exists():
            continue

        # Project ID 추출 (폴더명에서)
        folder_name = project_dir.name
        match = re.match(r'P(\d+)_', folder_name)
        if not match:
            continue

        project_id = f"prj:{match.group(1).zfill(3)}"

        if project_id not in PROJECT_TO_TRACK:
            print(f"  [SKIP] {project_id}: not in mapping")
            continue

        new_track = PROJECT_TO_TRACK[project_id]

        if fix_project_file(project_file, project_id, new_track, dry_run):
            updated += 1

    print(f"\n=== Summary ===")
    print(f"{'Would update' if dry_run else 'Updated'}: {updated} projects")

    if dry_run:
        print("\nRun with --apply to actually modify files.")

    return 0


if __name__ == "__main__":
    vault_path = sys.argv[1] if len(sys.argv) > 1 else "."
    dry_run = "--apply" not in sys.argv
    sys.exit(main(vault_path, dry_run))
