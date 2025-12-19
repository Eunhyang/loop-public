"""
Task API Router

Task 생성, 조회, 수정, 삭제 엔드포인트
"""

import re
import yaml
from pathlib import Path
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException

from ..models.entities import TaskCreate, TaskUpdate, TaskResponse
from ..utils.vault_utils import (
    extract_frontmatter,
    load_members,
    get_next_task_id,
    find_project_dir,
    sanitize_filename,
    get_vault_dir
)

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

# Vault 경로 (환경에 따라 자동 감지)
VAULT_DIR = get_vault_dir()
PROJECTS_DIR = VAULT_DIR / "50_Projects/2025"


@router.get("")
def get_tasks(project_id: Optional[str] = None, status: Optional[str] = None):
    """Task 목록 조회"""
    tasks = []

    for task_file in PROJECTS_DIR.rglob("Tasks/*.md"):
        frontmatter = extract_frontmatter(task_file)
        if not frontmatter:
            continue

        # 필터링
        if project_id and frontmatter.get('project_id') != project_id:
            continue
        if status and frontmatter.get('status') != status:
            continue

        frontmatter['_path'] = str(task_file.relative_to(VAULT_DIR))
        tasks.append(frontmatter)

    return {"tasks": sorted(tasks, key=lambda x: x.get('entity_id', ''))}


@router.get("/{task_id}")
def get_task(task_id: str):
    """개별 Task 상세 조회 (body 포함)"""

    # Task 파일 찾기
    task_file = None
    for tf in PROJECTS_DIR.rglob("Tasks/*.md"):
        frontmatter = extract_frontmatter(tf)
        if frontmatter and frontmatter.get('entity_id') == task_id:
            task_file = tf
            break

    if not task_file:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")

    # 파일 읽기
    with open(task_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Frontmatter와 Body 분리
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', content, re.DOTALL)
    if not match:
        raise HTTPException(status_code=500, detail="Invalid frontmatter format")

    frontmatter = yaml.safe_load(match.group(1))
    body = match.group(2)

    # 경로 정보 추가
    frontmatter['_path'] = str(task_file.relative_to(VAULT_DIR))
    frontmatter['_body'] = body

    return {"task": frontmatter}


@router.post("", response_model=TaskResponse)
def create_task(task: TaskCreate):
    """Task 생성"""

    # 1. Validation
    members = load_members(VAULT_DIR)
    if task.assignee not in members:
        raise HTTPException(status_code=400, detail=f"Unknown assignee: {task.assignee}")

    # 2. Project 디렉토리 찾기
    project_dir = find_project_dir(VAULT_DIR, task.project_id)
    if not project_dir:
        raise HTTPException(status_code=404, detail=f"Project not found: {task.project_id}")

    tasks_dir = project_dir / "Tasks"
    tasks_dir.mkdir(exist_ok=True)

    # 3. Task ID 생성
    task_id = get_next_task_id(VAULT_DIR)

    # 4. 파일명 생성
    filename = sanitize_filename(task.entity_name) + ".md"
    task_file = tasks_dir / filename

    # 파일 중복 체크
    if task_file.exists():
        # 파일명에 숫자 추가
        base_name = sanitize_filename(task.entity_name)
        counter = 1
        while task_file.exists():
            filename = f"{base_name}_{counter}.md"
            task_file = tasks_dir / filename
            counter += 1

    # 5. Frontmatter 생성
    today = datetime.now().strftime("%Y-%m-%d")

    frontmatter = {
        "entity_type": "Task",
        "entity_id": task_id,
        "entity_name": task.entity_name,
        "created": today,
        "updated": today,
        "status": task.status,
        "project_id": task.project_id,
        "parent_id": task.project_id,
        "assignee": task.assignee,
        "priority": task.priority,
        "aliases": [task_id],  # Obsidian 링크용
        "tags": task.tags if task.tags else [],
    }

    if task.due:
        frontmatter["due"] = task.due

    # 6. 파일 생성
    content = f"""---
{yaml.dump(frontmatter, allow_unicode=True, sort_keys=False)}---

# {task.entity_name}

## 설명

## 체크리스트

- [ ]

## 참고
"""

    with open(task_file, 'w', encoding='utf-8') as f:
        f.write(content)

    return TaskResponse(
        success=True,
        task_id=task_id,
        file_path=str(task_file.relative_to(VAULT_DIR)),
        message="Task created successfully"
    )


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, task: TaskUpdate):
    """Task 수정"""

    # Task 파일 찾기
    task_file = None
    for tf in PROJECTS_DIR.rglob("Tasks/*.md"):
        frontmatter = extract_frontmatter(tf)
        if frontmatter and frontmatter.get('entity_id') == task_id:
            task_file = tf
            break

    if not task_file:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")

    # 파일 읽기
    with open(task_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Frontmatter 파싱
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', content, re.DOTALL)
    if not match:
        raise HTTPException(status_code=500, detail="Invalid frontmatter format")

    frontmatter = yaml.safe_load(match.group(1))
    body = match.group(2)

    # 업데이트
    if task.entity_name:
        frontmatter['entity_name'] = task.entity_name
    if task.assignee:
        frontmatter['assignee'] = task.assignee
    if task.priority:
        frontmatter['priority'] = task.priority
    if task.due:
        frontmatter['due'] = task.due
    if task.status:
        frontmatter['status'] = task.status
    if task.tags is not None:
        frontmatter['tags'] = task.tags

    frontmatter['updated'] = datetime.now().strftime("%Y-%m-%d")

    # 파일 다시 쓰기
    new_content = f"""---
{yaml.dump(frontmatter, allow_unicode=True, sort_keys=False)}---
{body}"""

    with open(task_file, 'w', encoding='utf-8') as f:
        f.write(new_content)

    return TaskResponse(
        success=True,
        task_id=task_id,
        message="Task updated successfully"
    )


@router.delete("/{task_id}", response_model=TaskResponse)
def delete_task(task_id: str):
    """Task 삭제"""

    # Task 파일 찾기
    task_file = None
    for tf in PROJECTS_DIR.rglob("Tasks/*.md"):
        frontmatter = extract_frontmatter(tf)
        if frontmatter and frontmatter.get('entity_id') == task_id:
            task_file = tf
            break

    if not task_file:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")

    # 파일 삭제
    task_file.unlink()

    return TaskResponse(
        success=True,
        task_id=task_id,
        message="Task deleted successfully"
    )
