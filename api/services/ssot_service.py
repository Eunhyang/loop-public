"""
SSOT Service Layer
==================

Single Source of Truth (SSOT) Implementation
- ID 생성 로직 (Hash+Epoch based IDs)
- 파일명 규칙 강제
- ID 유효성 검증

Ref: public/00_Meta/SSOT_CONTRACT.md Section 11
"""

import re
import hashlib
import secrets
import time
from pathlib import Path
from typing import Optional, List, Tuple
from api.constants import ID_PATTERNS

class SSOTService:
    """Vault 규칙 집행자 (ID 생성, 검증, 명명)"""

    def __init__(self, vault_path: Path):
        self.vault_path = vault_path

    # ============================================
    # 1. Naming Convention (Stateless)
    # ============================================
    
    @staticmethod
    def get_task_filename(task_id: str) -> str:
        """Task 파일명 규칙: tsk-{id}.md (강제)"""
        return f"{task_id}.md"

    @staticmethod
    def get_project_filename(project_id: str) -> str:
        """Project 정의 파일명: project.md (강제)"""
        return "project.md"

    # ============================================
    # 2. Validation (Stateless)
    # ============================================

    @staticmethod
    def validate_id(entity_id: str, entity_type: str) -> bool:
        """
        ID가 해당 엔티티 타입의 SSOT 패턴을 따르는지 검증
        entity_type: 'Project', 'Task', 'Hypothesis', ...
        """
        # Entity Type -> ID Prefix mapping
        type_map = {
            'Project': 'prj',
            'Task': 'tsk',
            'Hypothesis': 'hyp',
            'Condition': 'cond',
            'Track': 'trk',
            'Experiment': 'exp',
            'Program': 'pgm'
        }
        
        prefix_key = type_map.get(entity_type)
        if not prefix_key:
            # 매핑되지 않은 타입은 검증하지 않음 (또는 False)
            return True 
            
        pattern = ID_PATTERNS.get(prefix_key)
        if not pattern:
            return False
            
        return bool(re.match(pattern, entity_id))

    # ============================================
    # 3. Hash Generation Utilities
    # ============================================

    @staticmethod
    def _to_base36(num: int) -> str:
        """Convert integer to base36 string (lowercase)"""
        alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
        if num == 0:
            return '0'
        result = ''
        while num:
            num, remainder = divmod(num, 36)
            result = alphabet[remainder] + result
        return result

    @staticmethod
    def _generate_hash(entity_name: str, prefix: str, hash_length: int = 6) -> str:
        """
        Generate collision-resistant hash for entity ID

        Args:
            entity_name: Name of entity
            prefix: ID prefix (prj, tsk, etc)
            hash_length: Length of hash (default 6 for ~2.2B combinations)

        Returns:
            Lowercase base36 hash
        """
        # Use cryptographic randomness
        salt = secrets.token_hex(16)
        timestamp = str(time.time_ns())  # nanosecond precision

        # SHA-256 of (prefix + name + timestamp + salt)
        input_str = f"{prefix}:{entity_name}:{timestamp}:{salt}"
        hash_bytes = hashlib.sha256(input_str.encode('utf-8')).digest()

        # Convert to base36 (lowercase alphanumeric)
        hash_int = int.from_bytes(hash_bytes[:4], 'big')
        hash_str = SSOTService._to_base36(hash_int)[:hash_length].lower()

        # Pad to hash_length if needed
        if len(hash_str) < hash_length:
            hash_str = hash_str.zfill(hash_length)

        return hash_str

    def _check_id_exists(self, entity_id: str, entity_type: str) -> bool:
        """
        Check if ID already exists in vault

        Scans all entity files of given type for duplicate ID

        Args:
            entity_id: ID to check
            entity_type: "Project" or "Task"

        Returns:
            True if ID exists, False otherwise
        """
        projects_dir = self.vault_path / "50_Projects"
        if not projects_dir.exists():
            return False

        if entity_type == "Project":
            # Check all project.md files
            for proj_file in projects_dir.rglob("project.md"):
                try:
                    content = proj_file.read_text(encoding="utf-8")
                    if f"entity_id: {entity_id}" in content or f'entity_id: "{entity_id}"' in content:
                        return True
                except:
                    pass
        elif entity_type == "Task":
            # Check all task files
            for task_file in projects_dir.rglob("Tasks/*.md"):
                try:
                    content = task_file.read_text(encoding="utf-8")
                    if f"entity_id: {entity_id}" in content:
                        return True
                except:
                    pass

        return False

    # ============================================
    # 4. ID Generation (Stateful - Scans Filesystem)
    # ============================================

    def generate_project_id(self, entity_name: str = "new-project") -> str:
        """
        Generate new Project ID with collision detection

        New format: prj-{hash6} (e.g., prj-a7k9m2)

        Args:
            entity_name: Project name for hash generation

        Returns:
            Unique Project ID

        Raises:
            RuntimeError: If unable to generate unique ID after max attempts
        """
        max_attempts = 20

        for attempt in range(max_attempts):
            hash_part = self._generate_hash(entity_name, "prj", hash_length=6)
            project_id = f"prj-{hash_part}"

            if not self._check_id_exists(project_id, "Project"):
                return project_id

        # Failure path: raise exception with clear message
        raise RuntimeError(
            f"Failed to generate unique Project ID after {max_attempts} attempts. "
            f"This indicates a serious collision issue or system overload. "
            f"Entity name: {entity_name}"
        )

    def generate_task_id(self, project_id: str, entity_name: str = "new-task") -> str:
        """
        Generate new Task ID with hash + epoch

        New format: tsk-{hash6}-{epoch13} (e.g., tsk-a7k9m2-1736412652123)

        Args:
            project_id: Parent project ID
            entity_name: Task name for hash generation

        Returns:
            Unique Task ID

        Raises:
            ValueError: If project_id is invalid
            RuntimeError: If unable to generate unique ID after max attempts
        """
        # 1. Validate Input
        if not project_id:
            raise ValueError("project_id is required for Task ID generation")

        max_attempts = 20

        for attempt in range(max_attempts):
            # Generate hash from task name
            hash_part = self._generate_hash(entity_name, "tsk", hash_length=6)
            epoch_ms = int(time.time() * 1000)

            task_id = f"tsk-{hash_part}-{epoch_ms}"

            if not self._check_id_exists(task_id, "Task"):
                return task_id

        raise RuntimeError(
            f"Failed to generate unique Task ID after {max_attempts} attempts. "
            f"This indicates a serious collision issue or system overload. "
            f"Entity name: {entity_name}"
        )
