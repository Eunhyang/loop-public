"""
Vault Utility Functions

Obsidian Vault 파일 읽기/쓰기 및 frontmatter 처리
"""

import os
import re
import yaml
from pathlib import Path
from typing import Dict, Any, Optional


def get_vault_dir() -> Path:
    """환경에 따라 Vault 경로 반환"""
    # 환경변수가 설정되어 있으면 사용
    if os.environ.get("VAULT_DIR"):
        return Path(os.environ["VAULT_DIR"])

    # NAS 경로 (Synology)
    nas_path = Path("/volume1/LOOP_CORE/vault/LOOP")
    if nas_path.exists():
        return nas_path

    # MacBook 경로
    mac_path = Path("/Volumes/LOOP_CORE/vault/LOOP")
    if mac_path.exists():
        return mac_path

    # 기본값 (현재 디렉토리 기준)
    return Path.cwd()


def get_exec_vault_dir() -> Path:
    """환경에 따라 Exec Vault (loop_exec) 경로 반환

    Exec vault는 민감한 C-Level 데이터(runway, cashflow, salary 등)를 담고 있음.
    role=exec 또는 admin + mcp:exec scope가 있어야 접근 가능.
    """
    # 환경변수가 설정되어 있으면 사용
    if os.environ.get("EXEC_VAULT_DIR"):
        return Path(os.environ["EXEC_VAULT_DIR"])

    # NAS 경로 (Synology)
    nas_path = Path("/volume1/LOOP_CLevel/vault/loop_exec")
    if nas_path.exists():
        return nas_path

    # MacBook 경로
    mac_path = Path("/Volumes/LOOP_CLevel/vault/loop_exec")
    if mac_path.exists():
        return mac_path

    # 기본값 (현재 디렉토리 기준)
    return Path.cwd() / "exec_vault"


def extract_frontmatter(file_path: Path) -> Optional[Dict[str, Any]]:
    """YAML frontmatter 추출"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
        if not match:
            return None

        return yaml.safe_load(match.group(1))
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
        return None


def load_members(vault_path: Path) -> Dict[str, Dict]:
    """멤버 목록 로드"""
    members_file = vault_path / "00_Meta/members.yaml"
    if not members_file.exists():
        return {}

    with open(members_file, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
        members = {}
        for member in data.get('members', []):
            members[member['id']] = member
        return members


def get_next_task_id(vault_path: Path) -> str:
    """다음 Task ID 생성"""
    projects_dir = vault_path / "50_Projects/2025"
    max_id = 0

    # 모든 Task 파일 스캔
    for task_file in projects_dir.rglob("Tasks/*.md"):
        frontmatter = extract_frontmatter(task_file)
        if not frontmatter or 'entity_id' not in frontmatter:
            continue

        entity_id = frontmatter['entity_id']
        # tsk-001-01 형식에서 숫자 추출
        match = re.match(r'tsk-(\d+)-(\d+)', entity_id)
        if match:
            main_num = int(match.group(1))
            sub_num = int(match.group(2))
            combined = main_num * 100 + sub_num
            max_id = max(max_id, combined)

    # 다음 ID 계산
    next_id = max_id + 1
    main = next_id // 100
    sub = next_id % 100

    if main == 0:
        main = 1

    return f"tsk-{main:03d}-{sub:02d}"


def get_next_project_id(vault_path: Path) -> str:
    """다음 Project ID 생성"""
    projects_dir = vault_path / "50_Projects/2025"
    max_num = 0

    for project_dir in projects_dir.glob("P*"):
        # P001_Name 형식에서 숫자 추출
        match = re.match(r'P(\d+)', project_dir.name)
        if match:
            num = int(match.group(1))
            max_num = max(max_num, num)

    return f"prj-{max_num + 1:03d}"


def find_project_dir(vault_path: Path, project_id: str) -> Optional[Path]:
    """Project ID로 프로젝트 디렉토리 찾기"""
    projects_dir = vault_path / "50_Projects/2025"

    # project_id: "prj-001" → "P001"
    match = re.match(r'prj-(\d+)', project_id)
    if not match:
        return None

    project_num = match.group(1)

    for project_dir in projects_dir.glob(f"P{project_num}_*"):
        return project_dir

    return None


def sanitize_filename(name: str) -> str:
    """파일명 안전하게 변환"""
    # 특수문자 제거, 공백을 언더스코어로
    name = re.sub(r'[^\w\s-]', '', name)
    name = re.sub(r'[-\s]+', '_', name)
    return name.strip('_')


def get_next_hypothesis_id(vault_path: Path, track_num: int) -> str:
    """
    다음 Hypothesis ID 생성 (hyp-{trk}-{seq})

    전체 60_Hypotheses/** 스캔하여 해당 track의 최대 seq를 찾고 +1 반환.
    Codex 피드백: 연도별이 아닌 전체 스캔하여 중복 방지.

    Args:
        vault_path: Vault 루트 경로
        track_num: Track 번호 (1-6)

    Returns:
        새 Hypothesis ID (예: hyp-1-12)
    """
    hypotheses_dir = vault_path / "60_Hypotheses"
    max_seq = 0

    if not hypotheses_dir.exists():
        return f"hyp-{track_num}-01"

    # 전체 60_Hypotheses/** 스캔 (모든 연도 폴더)
    for hyp_file in hypotheses_dir.rglob("*.md"):
        if hyp_file.name.startswith("_"):
            continue

        frontmatter = extract_frontmatter(hyp_file)
        if not frontmatter or frontmatter.get('entity_type') != 'Hypothesis':
            continue

        entity_id = frontmatter.get('entity_id', '')
        # hyp-{trk}-{seq} 패턴 매칭
        match = re.match(r'hyp-(\d+)-(\d+)', entity_id)
        if match:
            trk = int(match.group(1))
            seq = int(match.group(2))
            if trk == track_num:
                max_seq = max(max_seq, seq)

    return f"hyp-{track_num}-{max_seq + 1:02d}"


def validate_track_exists(vault_path: Path, track_id: str) -> bool:
    """
    Track ID가 실제로 존재하는지 확인

    Codex 피드백: regex만으로는 불충분, 실제 Track 파일 존재 확인 필요.

    Args:
        vault_path: Vault 루트 경로
        track_id: Track ID (예: trk-1)

    Returns:
        Track 존재 여부
    """
    tracks_dir = vault_path / "20_Strategy/12M_Tracks"

    if not tracks_dir.exists():
        return False

    # 모든 연도 폴더 스캔
    for track_file in tracks_dir.rglob("*.md"):
        if track_file.name.startswith("_"):
            continue

        frontmatter = extract_frontmatter(track_file)
        if frontmatter and frontmatter.get('entity_id') == track_id:
            return True

    return False


def validate_horizon(horizon: str) -> bool:
    """
    horizon 값이 유효한 4자리 연도인지 확인

    Codex 피드백: 경로 탈출 공격 방지를 위한 whitelist 검증.

    Args:
        horizon: 검증할 연도 문자열

    Returns:
        유효 여부
    """
    return bool(re.match(r'^\d{4}$', horizon))
