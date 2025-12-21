"""
Project API Router

Project 생성 및 조회 엔드포인트
캐시 기반으로 O(1) 조회 지원
"""

import re
import yaml
import shutil
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, HTTPException

from ..models.entities import ProjectCreate, ProjectUpdate, ProjectResponse
from ..cache import get_cache
from ..utils.vault_utils import (
    sanitize_filename,
    get_vault_dir
)

router = APIRouter(prefix="/api/projects", tags=["projects"])

# Vault 경로
VAULT_DIR = get_vault_dir()
PROJECTS_DIR = VAULT_DIR / "50_Projects/2025"


@router.get("")
def get_projects():
    """프로젝트 목록 조회 (캐시 기반)"""
    cache = get_cache()
    projects = cache.get_all_projects()
    return {"projects": projects}


@router.get("/{project_id}")
def get_project(project_id: str):
    """개별 Project 조회"""
    cache = get_cache()
    project = cache.get_project(project_id)

    if not project:
        raise HTTPException(status_code=404, detail=f"Project not found: {project_id}")

    return {"project": project}


@router.post("", response_model=ProjectResponse)
def create_project(project: ProjectCreate):
    """Project 생성"""
    cache = get_cache()

    # 1. Project ID 생성 (캐시 기반)
    project_id = cache.get_next_project_id()
    project_num = re.match(r'prj-(\d+)', project_id).group(1)

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
        "aliases": [project_id],
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

    # 6. 캐시 업데이트
    cache.set_project(project_id, frontmatter, project_file)

    return ProjectResponse(
        success=True,
        project_id=project_id,
        directory=dir_name,
        message="Project created successfully"
    )


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: str, project: ProjectUpdate):
    """Project 수정"""
    cache = get_cache()

    # 1. 캐시에서 Project 조회
    project_data = cache.get_project(project_id)
    if not project_data:
        raise HTTPException(status_code=404, detail=f"Project not found: {project_id}")

    # 2. 파일 경로 가져오기
    project_dir = cache.get_project_dir(project_id)
    project_file = project_dir / "Project_정의.md"

    # 3. 파일 읽기
    try:
        with open(project_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        cache.remove_project(project_id)
        raise HTTPException(status_code=404, detail=f"Project not found: {project_id}")

    # 4. Frontmatter 파싱
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', content, re.DOTALL)
    if not match:
        raise HTTPException(status_code=500, detail="Invalid frontmatter format")

    frontmatter = yaml.safe_load(match.group(1))
    body = match.group(2)

    # 5. 업데이트
    if project.entity_name is not None:
        frontmatter['entity_name'] = project.entity_name
    if project.owner is not None:
        frontmatter['owner'] = project.owner
    if project.parent_id is not None:
        frontmatter['parent_id'] = project.parent_id
    if project.status is not None:
        frontmatter['status'] = project.status
    if project.priority_flag is not None:
        frontmatter['priority_flag'] = project.priority_flag
    if project.deadline is not None:
        frontmatter['deadline'] = project.deadline
    if project.hypothesis_text is not None:
        frontmatter['hypothesis_text'] = project.hypothesis_text
    if project.tags is not None:
        frontmatter['tags'] = project.tags

    frontmatter['updated'] = datetime.now().strftime("%Y-%m-%d")

    # 6. 파일 다시 쓰기
    new_content = f"""---
{yaml.dump(frontmatter, allow_unicode=True, sort_keys=False)}---
{body}"""

    with open(project_file, 'w', encoding='utf-8') as f:
        f.write(new_content)

    # 7. 캐시 업데이트 (_body 포함)
    frontmatter['_body'] = body
    cache.set_project(project_id, frontmatter, project_file)

    return ProjectResponse(
        success=True,
        project_id=project_id,
        directory=str(project_dir.name) if project_dir else None,
        message="Project updated successfully"
    )


@router.delete("/{project_id}", response_model=ProjectResponse)
def delete_project(project_id: str, force: bool = False):
    """
    Project 삭제

    Args:
        project_id: 삭제할 프로젝트 ID
        force: True면 하위 Task 포함 강제 삭제, False면 Task 있을 시 거부
    """
    cache = get_cache()

    # 1. 캐시에서 Project 디렉토리 찾기
    project_dir = cache.get_project_dir(project_id)
    if not project_dir:
        raise HTTPException(status_code=404, detail=f"Project not found: {project_id}")

    # 2. 하위 Task 확인
    tasks_dir = project_dir / "Tasks"
    task_files = list(tasks_dir.glob("*.md")) if tasks_dir.exists() else []
    task_count = len(task_files)

    if task_count > 0 and not force:
        raise HTTPException(
            status_code=400,
            detail=f"Project has {task_count} task(s). Use force=true to delete with tasks."
        )

    # 3. 하위 Task 캐시에서 제거
    for task_file in task_files:
        from ..utils.vault_utils import extract_frontmatter
        fm = extract_frontmatter(task_file)
        if fm and fm.get('entity_id'):
            cache.remove_task(fm['entity_id'])

    # 4. 디렉토리 전체 삭제
    dir_name = project_dir.name
    shutil.rmtree(project_dir)

    # 5. 캐시에서 제거
    cache.remove_project(project_id)

    message = "Project deleted successfully"
    if task_count > 0:
        message += f" (including {task_count} task(s))"

    return ProjectResponse(
        success=True,
        project_id=project_id,
        directory=dir_name,
        message=message
    )
