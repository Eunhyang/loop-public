"""
SSOT Service Layer
==================

Single Source of Truth (SSOT) Implementation
- ID 생성 로직 (Project-Scoped Task IDs)
- 파일명 규칙 강제
- ID 유효성 검증

Ref: public/00_Meta/SSOT_CONTRACT.md Section 11
"""

import re
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
    # 3. ID Generation (Stateful - Scans Filesystem)
    # ============================================

    def generate_project_id(self) -> str:
        """
        새 프로젝트 ID 생성 (prj-NNN)
        전체 프로젝트 스캔하여 최대 번호 + 1
        """
        max_num = 0
        
        # 50_Projects/{Year}/* 스캔
        projects_dir = self.vault_path / "50_Projects"
        if not projects_dir.exists():
            return "prj-001"

        # 재귀적으로 모든 project.md 또는 폴더명 검색
        # (폴더명 P{num} 패턴이 가장 신뢰할 수 있음)
        for path in projects_dir.rglob("*"):
            if path.is_dir() and path.name.startswith("P"):
                # P001_Name -> 001 extraction
                match = re.match(r"^P(\d{3})_", path.name)
                if match:
                    num = int(match.group(1))
                    if num > max_num:
                        max_num = num
        
        return f"prj-{max_num + 1:03d}"

    def generate_task_id(self, project_id: str) -> str:
        """
        새 Task ID 생성 (tsk-{prj_suffix}-{seq})
        
        Args:
            project_id: prj-023 or prj-n8n-automation
        Returns:
            tsk-023-01 or tsk-n8n-01
        """
        # 1. Validate Input
        if not project_id:
            raise ValueError("project_id is required for Task ID generation")
        
        # Determine prefix (023 or n8n)
        # prj-023 -> 023
        # prj-n8n-automation -> n8n (heuristic: first part after prj-)
        # But schema says: prj-(\d{3}|[a-z][a-z0-9-]+)
        # For non-numeric, we usually use the first keyword or the whole thing?
        # entity_generator.py logic: "prj-n8n-entity-autofill → n8n" (parts[0])
        # Let's trust that logic for consistency.
        
        if project_id.startswith("prj-"):
            full_suffix = project_id[4:]
            if re.match(r"^\d{3}$", full_suffix):
                prj_prefix = full_suffix
            else:
                # prj-n8n-automation -> n8n
                prj_prefix = full_suffix.split("-")[0]
        else:
            raise ValueError(f"Invalid Project ID format: {project_id}")

        # 2. Find Project Directory
        # 50_Projects 내에서 P{prj_prefix}_* 또는 prj-ID와 일치하는 폴더 찾기
        projects_root = self.vault_path / "50_Projects"
        target_dir = None
        
        # Optimized search
        # 1. Numeric: P023_*
        if re.match(r"^\d{3}$", prj_prefix):
             # Numeric: try P023_* and prj-023_*
             patterns = [f"P{prj_prefix}_*", f"prj-{prj_prefix}_*"]
             for pat in patterns:
                 for path in projects_root.rglob(pat):
                     if path.is_dir():
                         target_dir = path
                         break
                 if target_dir: break
        else:
             # Alphanumeric: try prj-{prefix}_* (e.g. prj-n8n_*)
             for path in projects_root.rglob(f"prj-{prj_prefix}*"):
                 if path.is_dir():
                     target_dir = path
                     break

        if not target_dir:
             # Fallback: Search by entity_id in project.md (Safe fallback)
             # This handles cases where folder name doesn't match ID at all
             for proj_file in projects_root.rglob("project.md"):
                  try:
                      content = proj_file.read_text(encoding="utf-8")
                      if f"entity_id: {project_id}" in content:
                          target_dir = proj_file.parent
                          break
                  except:
                      pass
        
        if not target_dir:
            raise FileNotFoundError(f"Project directory not found for ID: {project_id}")

        # 3. Scan Existing Tasks
        tasks_dir = target_dir / "Tasks"
        max_seq = 0
        
        if tasks_dir.exists():
            # tsk-{prj_prefix}-{seq}.md pattern
            pattern = re.compile(rf"^tsk-{re.escape(prj_prefix)}-(\d+)")
            
            for task_file in tasks_dir.glob("*.md"):
                match = pattern.match(task_file.name)
                if match:
                    seq = int(match.group(1))
                    if seq > max_seq:
                        max_seq = seq
        
        # 4. Generate Next ID
        next_seq = max_seq + 1
        return f"tsk-{prj_prefix}-{next_seq:02d}"
