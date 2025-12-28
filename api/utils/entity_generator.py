"""
Entity Generator

ID 생성, 폴더 구조, 템플릿 렌더링 유틸리티
기존 vault_utils.py의 로직을 확장하고 통합

Usage:
    from api.utils.entity_generator import (
        EntityGenerator,
        generate_project_id,
        generate_task_id,
        create_project_structure,
        render_template
    )
"""

import re
import os
from pathlib import Path
from datetime import date
from typing import Dict, Any, Optional, Tuple, List
from string import Template

from .vault_utils import (
    get_vault_dir,
    extract_frontmatter,
    get_next_task_id,
    get_next_project_id,
    find_project_dir,
    sanitize_filename
)


class EntityGenerator:
    """Entity 생성 통합 유틸리티"""

    def __init__(self, vault_path: Optional[Path] = None):
        self.vault_path = vault_path or get_vault_dir()
        self.templates_dir = self.vault_path / "00_Meta/_TEMPLATES"

    def generate_project_id(self, prefix: str = "prj") -> str:
        """
        다음 Project ID 생성

        Args:
            prefix: ID 접두사 (기본값: "prj")

        Returns:
            새 Project ID (예: "prj-007")
        """
        # 기존 로직 재사용
        return get_next_project_id(self.vault_path)

    def generate_task_id(self, project_id: Optional[str] = None) -> str:
        """
        다음 Task ID 생성

        Args:
            project_id: 소속 프로젝트 ID (현재 미사용, 향후 확장용)

        Returns:
            새 Task ID (예: "tsk-003-05")
        """
        return get_next_task_id(self.vault_path)

    def generate_task_id_for_project(self, project_id: str) -> str:
        """
        특정 프로젝트 내 Task ID 생성 (prj-XXX-YY 형식)

        프로젝트별 Task ID 체계를 사용하는 경우:
        예: prj-n8n-entity-autofill → tsk-n8n-05

        Args:
            project_id: 프로젝트 ID

        Returns:
            새 Task ID
        """
        # 프로젝트 디렉토리 찾기
        project_dir = self._find_project_directory(project_id)
        if not project_dir:
            # fallback to global ID
            return self.generate_task_id()

        tasks_dir = project_dir / "Tasks"
        if not tasks_dir.exists():
            return self._make_project_task_id(project_id, 1)

        # 해당 프로젝트의 Task들 스캔
        max_seq = 0
        prefix = self._extract_task_prefix(project_id)

        for task_file in tasks_dir.glob("*.md"):
            fm = extract_frontmatter(task_file)
            if not fm or 'entity_id' not in fm:
                continue

            entity_id = fm['entity_id']
            # tsk-{prefix}-{seq} 패턴 매칭
            match = re.match(rf'tsk-{re.escape(prefix)}-(\d+)', entity_id)
            if match:
                seq = int(match.group(1))
                max_seq = max(max_seq, seq)

        return self._make_project_task_id(project_id, max_seq + 1)

    def _extract_task_prefix(self, project_id: str) -> str:
        """프로젝트 ID에서 Task prefix 추출"""
        # prj-n8n-entity-autofill → n8n
        # prj-001 → 001
        if project_id.startswith("prj-"):
            rest = project_id[4:]
            parts = rest.split("-")
            return parts[0]
        return project_id

    def _make_project_task_id(self, project_id: str, seq: int) -> str:
        """프로젝트별 Task ID 생성"""
        prefix = self._extract_task_prefix(project_id)
        return f"tsk-{prefix}-{seq:02d}"

    def _find_project_directory(self, project_id: str) -> Optional[Path]:
        """프로젝트 ID로 디렉토리 찾기"""
        # 다양한 위치 검색
        search_paths = [
            self.vault_path / "50_Projects/2025",
            self.vault_path / "50_Projects/Vault_System/Rounds",
            self.vault_path / "50_Projects",
        ]

        for search_path in search_paths:
            if not search_path.exists():
                continue

            for project_dir in search_path.rglob("**/Project_정의.md"):
                fm = extract_frontmatter(project_dir)
                if fm and fm.get('entity_id') == project_id:
                    return project_dir.parent

        # 폴더명으로 검색 (fallback)
        return find_project_dir(self.vault_path, project_id)

    def create_project_structure(
        self,
        project_id: str,
        entity_name: str,
        base_path: Optional[Path] = None
    ) -> Tuple[Path, List[Path]]:
        """
        프로젝트 폴더 구조 생성

        Args:
            project_id: 프로젝트 ID (예: "prj-007")
            entity_name: 프로젝트 이름 (예: "Dashboard - UX 개선")
            base_path: 기본 경로 (없으면 50_Projects/2025 사용)

        Returns:
            (project_dir, created_dirs)
        """
        if base_path is None:
            base_path = self.vault_path / "50_Projects/2025"

        # prj-007 → 007
        match = re.match(r'prj-(\d+)', project_id)
        if match:
            project_num = match.group(1)
        else:
            # 비표준 ID (예: prj-dashboard-ux-v1)
            project_num = project_id.replace("prj-", "")

        # 폴더명 생성: P007_Dashboard - UX 개선
        safe_name = sanitize_filename(entity_name)
        folder_name = f"P{project_num}_{safe_name}"

        project_dir = base_path / folder_name
        created_dirs = []

        # 디렉토리 생성
        dirs_to_create = [
            project_dir,
            project_dir / "Tasks",
            project_dir / "Results",
        ]

        for d in dirs_to_create:
            if not d.exists():
                d.mkdir(parents=True, exist_ok=True)
                created_dirs.append(d)

        return project_dir, created_dirs

    def render_template(
        self,
        template_name: str,
        placeholders: Dict[str, Any]
    ) -> str:
        """
        템플릿 렌더링

        Args:
            template_name: 템플릿 파일명 (예: "template_task.md")
            placeholders: 치환할 값들

        Returns:
            렌더링된 문자열
        """
        template_path = self.templates_dir / template_name

        if not template_path.exists():
            raise FileNotFoundError(f"Template not found: {template_path}")

        with open(template_path, 'r', encoding='utf-8') as f:
            template_content = f.read()

        # {{PLACEHOLDER}} 형식 치환
        result = template_content
        for key, value in placeholders.items():
            # 리스트는 YAML 형식으로 변환
            if isinstance(value, list):
                if value:
                    yaml_value = "\n".join(f"  - {v}" for v in value)
                else:
                    yaml_value = "[]"
                result = result.replace(f"{{{{{key}}}}}", yaml_value)
            elif value is None:
                result = result.replace(f"{{{{{key}}}}}", "null")
            else:
                result = result.replace(f"{{{{{key}}}}}", str(value))

        return result

    def validate_entity_name_format(self, name: str) -> Tuple[bool, str]:
        """
        엔티티 이름 형식 검증 (주제 - 내용)

        Args:
            name: 검증할 이름

        Returns:
            (is_valid, error_message)
        """
        if " - " not in name:
            return False, "이름에 ' - ' (공백-하이픈-공백) 구분자가 없습니다."

        parts = name.split(" - ", 1)
        if not parts[0].strip():
            return False, "주제 부분이 비어있습니다."
        if len(parts) < 2 or not parts[1].strip():
            return False, "내용 부분이 비어있습니다."

        return True, ""


# 편의 함수들 (클래스 없이 사용 가능)

def generate_project_id(vault_path: Optional[Path] = None) -> str:
    """다음 Project ID 생성"""
    gen = EntityGenerator(vault_path)
    return gen.generate_project_id()


def generate_task_id(vault_path: Optional[Path] = None) -> str:
    """다음 Task ID 생성"""
    gen = EntityGenerator(vault_path)
    return gen.generate_task_id()


def create_project_structure(
    project_id: str,
    entity_name: str,
    vault_path: Optional[Path] = None
) -> Tuple[Path, List[Path]]:
    """프로젝트 폴더 구조 생성"""
    gen = EntityGenerator(vault_path)
    return gen.create_project_structure(project_id, entity_name)


def render_template(
    template_name: str,
    placeholders: Dict[str, Any],
    vault_path: Optional[Path] = None
) -> str:
    """템플릿 렌더링"""
    gen = EntityGenerator(vault_path)
    return gen.render_template(template_name, placeholders)


def get_today() -> str:
    """오늘 날짜 (YYYY-MM-DD)"""
    return date.today().isoformat()
