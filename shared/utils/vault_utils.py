"""
Vault Utilities

Vault 경로 및 파일 처리 유틸리티.

Usage:
    from shared.utils.vault_utils import get_vault_dir, extract_frontmatter
"""

import os
import re
from pathlib import Path
from typing import Optional, Dict, Any, Tuple


def get_vault_dir() -> Path:
    """Get LOOP Vault directory path

    환경에 따라 자동 감지 (우선순위):
    1. VAULT_DIR 환경변수 (legacy)
    2. LOOP_VAULT_PATH 환경변수
    3. Docker: /vault
    4. NAS: /volume1/LOOP_CORE/vault/LOOP
    5. Mac mount: /Volumes/LOOP_CORE/vault/LOOP
    6. Local: ~/dev/loop/public
    7. Fallback: cwd

    Returns:
        Path to LOOP Vault directory
    """
    # Priority 1: VAULT_DIR env var (legacy, api 호환성)
    if os.environ.get("VAULT_DIR"):
        return Path(os.environ["VAULT_DIR"])

    # Priority 2: LOOP_VAULT_PATH env var
    env_path = os.environ.get("LOOP_VAULT_PATH")
    if env_path:
        return Path(env_path)

    # Priority 3: Docker environment
    docker_path = Path("/vault")
    if docker_path.exists() and docker_path.is_dir():
        return docker_path

    # Priority 4: NAS path (Synology)
    nas_path = Path("/volume1/LOOP_CORE/vault/LOOP")
    if nas_path.exists():
        return nas_path

    # Priority 5: Mac mount path
    mac_path = Path("/Volumes/LOOP_CORE/vault/LOOP")
    if mac_path.exists():
        return mac_path

    # Priority 6: Local development
    local_path = Path.home() / "dev" / "loop" / "public"
    if local_path.exists():
        return local_path

    # Fallback
    return Path.cwd()


def get_exec_vault_dir() -> Path:
    """Get Exec Vault directory path

    환경에 따라 자동 감지 (우선순위):
    1. EXEC_VAULT_DIR 환경변수 (legacy)
    2. LOOP_EXEC_PATH 환경변수
    3. Docker: /vault/exec
    4. NAS: /volume1/LOOP_CLevel/vault/loop_exec
    5. Mac mount: /Volumes/LOOP_CLevel/vault/loop_exec
    6. Local: ~/dev/loop/exec
    7. Fallback: relative to vault

    Returns:
        Path to Exec Vault directory
    """
    # Priority 1: EXEC_VAULT_DIR env var (legacy, api 호환성)
    if os.environ.get("EXEC_VAULT_DIR"):
        return Path(os.environ["EXEC_VAULT_DIR"])

    # Priority 2: LOOP_EXEC_PATH env var
    env_path = os.environ.get("LOOP_EXEC_PATH")
    if env_path:
        return Path(env_path)

    # Priority 3: Docker environment
    docker_path = Path("/vault/exec")
    if docker_path.exists() and docker_path.is_dir():
        return docker_path

    # Priority 4: NAS path (Synology)
    nas_path = Path("/volume1/LOOP_CLevel/vault/loop_exec")
    if nas_path.exists():
        return nas_path

    # Priority 5: Mac mount path
    mac_path = Path("/Volumes/LOOP_CLevel/vault/loop_exec")
    if mac_path.exists():
        return mac_path

    # Priority 6: Local development
    local_path = Path.home() / "dev" / "loop" / "exec"
    if local_path.exists():
        return local_path

    # Fallback: relative to vault
    vault_dir = get_vault_dir()
    return vault_dir.parent / "exec"


def extract_frontmatter(content: str) -> Tuple[Optional[Dict[str, Any]], str]:
    """Extract YAML frontmatter from markdown content

    Args:
        content: Markdown file content

    Returns:
        Tuple of (frontmatter dict, body content)
        frontmatter is None if not found or invalid
    """
    try:
        import yaml
    except ImportError:
        return None, content

    # Check for frontmatter delimiters
    if not content.startswith("---"):
        return None, content

    # Find closing delimiter
    lines = content.split("\n")
    end_index = -1
    for i, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end_index = i
            break

    if end_index == -1:
        return None, content

    # Parse YAML
    frontmatter_text = "\n".join(lines[1:end_index])
    body = "\n".join(lines[end_index + 1:])

    try:
        frontmatter = yaml.safe_load(frontmatter_text)
        return frontmatter, body
    except yaml.YAMLError:
        return None, content


def parse_entity_id(filename: str) -> Optional[str]:
    """Extract entity ID from filename

    Args:
        filename: File name (e.g., "tsk-001-01.md", "prj-003.md")

    Returns:
        Entity ID or None
    """
    # Task pattern: tsk-NNN-NN
    task_match = re.match(r"(tsk-\d{3}-\d{2})", filename)
    if task_match:
        return task_match.group(1)

    # Project pattern: prj-NNN
    proj_match = re.match(r"(prj-\d{3})", filename)
    if proj_match:
        return proj_match.group(1)

    # Hypothesis pattern: hyp-N-NN
    hyp_match = re.match(r"(hyp-\d+-\d{2})", filename)
    if hyp_match:
        return hyp_match.group(1)

    return None


def is_vault_path(path: str, vault_dir: Path) -> bool:
    """Check if path is within vault directory

    Args:
        path: Path to check
        vault_dir: Vault root directory

    Returns:
        True if path is within vault
    """
    try:
        resolved = Path(path).resolve()
        vault_resolved = vault_dir.resolve()
        return str(resolved).startswith(str(vault_resolved))
    except Exception:
        return False
