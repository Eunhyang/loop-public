"""
Project API Router

Project 생성 및 조회 엔드포인트
"""

import re
import yaml
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter

from ..models.entities import ProjectCreate, ProjectResponse
from ..utils.vault_utils import (
    extract_frontmatter,
    get_next_project_id,
    sanitize_filename,
    get_vault_dir
)

router = APIRouter(prefix="/api/projects", tags=["projects"])

# Vault 경로 (환경에 따라 자동 감지)
VAULT_DIR = get_vault_dir()
PROJECTS_DIR = VAULT_DIR / "50_Projects/2025"


@router.get("")
def get_projects():
    """프로젝트 목록 조회"""
    projects = []

    for project_dir in PROJECTS_DIR.glob("P*"):
        project_file = project_dir / "Project_정의.md"
        if not project_file.exists():
            continue

        frontmatter = extract_frontmatter(project_file)
        if frontmatter:
            frontmatter['_path'] = str(project_dir.relative_to(VAULT_DIR))
            projects.append(frontmatter)

    return {"projects": sorted(projects, key=lambda x: x.get('entity_id', ''))}


@router.post("", response_model=ProjectResponse)
def create_project(project: ProjectCreate):
    """Project 생성"""

    # 1. Project ID 생성
    project_id = get_next_project_id(VAULT_DIR)
    project_num = re.match(r'prj:(\d+)', project_id).group(1)

    # 2. 프로젝트 디렉토리 생성
    dir_name = f"P{project_num}_{sanitize_filename(project.entity_name)}"
    project_dir = PROJECTS_DIR / dir_name
    project_dir.mkdir(exist_ok=True)

    # 3. 서브 디렉토리 생성
    (project_dir / "Tasks").mkdir(exist_ok=True)
    (project_dir / "Results").mkdir(exist_ok=True)

    # 4. Frontmatter 생성
    today = datetime.now().strftime("%Y-%m-%d")

    frontmatter = {
        "entity_type": "Project",
        "entity_id": project_id,
        "entity_name": project.entity_name,
        "created": today,
        "updated": today,
        "status": "planning",
        "owner": project.owner,
        "priority_flag": project.priority,
        "aliases": [project_id],  # Obsidian 링크용
        "tags": []
    }

    if project.parent_id:
        frontmatter["parent_id"] = project.parent_id

    # 5. Project_정의.md 생성
    project_file = project_dir / "Project_정의.md"
    content = f"""---
{yaml.dump(frontmatter, allow_unicode=True, sort_keys=False)}---

# {project.entity_name}

## 목표

## 범위

## 일정

## 참고
"""

    with open(project_file, 'w', encoding='utf-8') as f:
        f.write(content)

    return ProjectResponse(
        success=True,
        project_id=project_id,
        directory=dir_name,
        message="Project created successfully"
    )
