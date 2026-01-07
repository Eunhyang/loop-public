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
        새 Task ID 생성 (tsk-{prj_num}-{seq})
        
        Args:
            project_id: prj-023
        Returns:
            tsk-023-01
        """
        # 1. Validate Input
        if not project_id:
            raise ValueError("project_id is required for Task ID generation")
            
        if not re.match(r"^prj-\d{3}$", project_id):
            # prj-legacy-name 등은 자동 생성 지원 안함 (혹은 별도 로직)
            raise ValueError(f"Auto ID generation only supported for standard Project IDs (prj-NNN). Got: {project_id}")

        prj_num = project_id.split("-")[1] # 023

        # 2. Find Project Directory
        # 50_Projects 내에서 P{prj_num}_* 폴더 찾기
        projects_root = self.vault_path / "50_Projects"
        target_dir = None
        
        for path in projects_root.rglob("*"):
            if path.is_dir() and path.name.startswith(f"P{prj_num}_"):
                target_dir = path
                break
        
        if not target_dir:
            raise FileNotFoundError(f"Project directory not found for ID: {project_id}")

        # 3. Scan Existing Tasks
        tasks_dir = target_dir / "Tasks"
        max_seq = 0
        
        if tasks_dir.exists():
            # tsk-{prj_num}-{seq}.md 패턴 찾기
            pattern = re.compile(rf"^tsk-{prj_num}-(\d{{2}})")
            
            for task_file in tasks_dir.glob("*.md"):
                # 파일명에서 시퀀스 추출 (tsk-023-04.md)
                match = pattern.match(task_file.name)
                if match:
                    seq = int(match.group(1))
                    if seq > max_seq:
                        max_seq = seq
                else:
                    # 파일명에 없으면 frontmatter 확인? (성능 이슈로 파일명 우선)
                    # SSOT 규칙상 파일명이 ID여야 함.
                    pass

        # 4. Generate Next ID
        next_seq = max_seq + 1
        return f"tsk-{prj_num}-{next_seq:02d}"
