"""
Task API Router

Task 생성, 조회, 수정, 삭제 엔드포인트
캐시 기반으로 O(1) 조회 지원
"""

import re
import yaml
from pathlib import Path
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException

from ..models.entities import TaskCreate, TaskUpdate, TaskResponse, ValidationResult
from ..cache import get_cache
from ..utils.vault_utils import (
    load_members,
    sanitize_filename,
    get_vault_dir
)
from .audit import log_entity_action
from .ai import _validate_task_schema_internal

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

# Vault 경로
VAULT_DIR = get_vault_dir()


@router.get("")
def get_tasks(
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    assignee: Optional[str] = None
):
    """
    Task 목록 조회 (캐시 기반)

    Query Parameters:
        project_id: 프로젝트 ID로 필터
        status: 상태로 필터 (todo, doing, done, blocked)
        assignee: 담당자로 필터
    """
    cache = get_cache()
    tasks = cache.get_all_tasks(
        project_id=project_id,
        status=status,
        assignee=assignee
    )
    return {"tasks": tasks}


@router.get("/{task_id}")
def get_task(task_id: str):
    """개별 Task 상세 조회 (body 포함)"""
    cache = get_cache()

    # 캐시에서 경로 조회
    task_path = cache.get_task_path(task_id)
    if not task_path:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")

    # 파일에서 body 읽기
    try:
        with open(task_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        # 캐시와 파일 불일치 → 캐시에서 제거
        cache.remove_task(task_id)
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")

    # Frontmatter와 Body 분리
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', content, re.DOTALL)
    if not match:
        raise HTTPException(status_code=500, detail="Invalid frontmatter format")

    frontmatter = yaml.safe_load(match.group(1))
    body = match.group(2)

    # 경로 정보 추가
    frontmatter['_path'] = str(task_path.relative_to(VAULT_DIR))
    frontmatter['_body'] = body

    return {"task": frontmatter}


@router.post("", response_model=TaskResponse)
async def create_task(task: TaskCreate):
    """Task 생성 (auto_validate=True 시 자동 스키마 검증)"""
    cache = get_cache()

    # 1. Validation
    # 1a. entity_name 형식 검증 (주제 - 내용)
    if " - " not in task.entity_name:
        raise HTTPException(
            status_code=400,
            detail="entity_name은 '주제 - 내용' 형식이어야 합니다. (예: 'CoachOS - 프로토타입 개발')"
        )

    # 1b. assignee 검증
    members = load_members(VAULT_DIR)
    if task.assignee not in members:
        raise HTTPException(status_code=400, detail=f"Unknown assignee: {task.assignee}")

    # 2. Project 디렉토리 찾기 (캐시 사용)
    project_dir = cache.get_project_dir(task.project_id)
    if not project_dir:
        raise HTTPException(status_code=404, detail=f"Project not found: {task.project_id}")

    tasks_dir = project_dir / "Tasks"
    tasks_dir.mkdir(exist_ok=True)

    # 3. Task ID 생성 (캐시 기반)
    task_id = cache.get_next_task_id()

    # 4. 파일명 생성
    filename = sanitize_filename(task.entity_name) + ".md"
    task_file = tasks_dir / filename

    # 파일 중복 체크
    if task_file.exists():
        base_name = sanitize_filename(task.entity_name)
        counter = 1
        while task_file.exists():
            filename = f"{base_name}_{counter}.md"
            task_file = tasks_dir / filename
            counter += 1

    # 5. Frontmatter 생성
    today = datetime.now().strftime("%Y-%m-%d")

    # start_date와 due 기본값 설정 (Codex 피드백: 조건부로만 적용)
    start_date = task.start_date if task.start_date else today
    due_date = task.due if task.due else today

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
        "start_date": start_date,
        "due": due_date,
        "aliases": [task_id],
        "tags": task.tags if task.tags else [],
    }

    if task.notes:
        frontmatter["notes"] = task.notes

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

    # 7. 캐시 업데이트
    cache.set_task(task_id, frontmatter, task_file)

    # 8. 감사 로그
    log_entity_action(
        action="create",
        entity_type="Task",
        entity_id=task_id,
        entity_name=task.entity_name,
        details={
            "project_id": task.project_id,
            "assignee": task.assignee,
            "status": task.status,
            "auto_validate": task.auto_validate
        }
    )

    # 9. Auto-validate (optional)
    validation_result = None
    if task.auto_validate:
        val_result = await _validate_task_schema_internal(
            task_id=task_id,
            frontmatter=frontmatter,
            provider="openai"
        )
        validation_result = ValidationResult(
            validated=val_result.get("validated", True),
            issues_found=val_result.get("issues_found", 0),
            pending_created=val_result.get("pending_created", False),
            pending_id=val_result.get("pending_id"),
            run_id=val_result.get("run_id")
        )

    return TaskResponse(
        success=True,
        task_id=task_id,
        file_path=str(task_file.relative_to(VAULT_DIR)),
        message="Task created successfully",
        validation=validation_result
    )


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, task: TaskUpdate):
    """Task 수정"""
    cache = get_cache()

    # 캐시에서 경로 조회
    task_file = cache.get_task_path(task_id)
    if not task_file:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")

    # exec vault 태스크는 API를 통한 수정 불가 (읽기 전용 마운트)
    task_path_str = str(task_file)
    if '/exec/' in task_path_str or task_path_str.startswith('/vault/exec'):
        raise HTTPException(
            status_code=403,
            detail=f"Exec vault tasks cannot be modified through the API. Please edit directly in Obsidian. Task: {task_id}"
        )

    # 파일 읽기
    try:
        with open(task_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        cache.remove_task(task_id)
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")
    except PermissionError as e:
        raise HTTPException(status_code=500, detail=f"Permission denied reading task file: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading task file: {type(e).__name__}: {e}")

    # Frontmatter 파싱
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', content, re.DOTALL)
    if not match:
        raise HTTPException(status_code=500, detail="Invalid frontmatter format")

    try:
        frontmatter = yaml.safe_load(match.group(1))
    except yaml.YAMLError as e:
        raise HTTPException(status_code=500, detail=f"YAML parsing error: {e}")

    body = match.group(2)

    # 업데이트
    try:
        if task.entity_name:
            frontmatter['entity_name'] = task.entity_name
        if task.assignee:
            frontmatter['assignee'] = task.assignee
        if task.priority:
            frontmatter['priority'] = task.priority
        if task.start_date:
            frontmatter['start_date'] = task.start_date
        if task.due:
            frontmatter['due'] = task.due
        if task.status:
            frontmatter['status'] = task.status
        if task.notes is not None:
            frontmatter['notes'] = task.notes if task.notes else None
        if task.tags is not None:
            frontmatter['tags'] = task.tags
        # Agent Builder 파이프라인용 추가 필드
        if task.conditions_3y is not None:
            frontmatter['conditions_3y'] = task.conditions_3y
        if task.closed is not None:
            frontmatter['closed'] = task.closed
        if task.closed_inferred is not None:
            frontmatter['closed_inferred'] = task.closed_inferred
        if task.project_id is not None:
            frontmatter['project_id'] = task.project_id
        # 외부 링크
        if task.links is not None:
            frontmatter['links'] = [{'label': link.label, 'url': link.url} for link in task.links]

        frontmatter['updated'] = datetime.now().strftime("%Y-%m-%d")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating frontmatter: {type(e).__name__}: {e}")

    # 파일 다시 쓰기
    try:
        new_content = f"""---
{yaml.dump(frontmatter, allow_unicode=True, sort_keys=False)}---
{body}"""

        with open(task_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
    except PermissionError as e:
        raise HTTPException(status_code=500, detail=f"Permission denied writing task file: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error writing task file: {type(e).__name__}: {e}")

    # 캐시 업데이트
    cache.set_task(task_id, frontmatter, task_file)

    # 감사 로그
    try:
        changed_fields = {k: v for k, v in task.model_dump().items() if v is not None}
        log_entity_action(
            action="update",
            entity_type="Task",
            entity_id=task_id,
            entity_name=frontmatter.get("entity_name", ""),
            details={"changed_fields": changed_fields}
        )
    except Exception as e:
        # 감사 로그 실패는 무시 (메인 로직에 영향 주지 않음)
        print(f"Warning: Failed to log task update: {e}")

    return TaskResponse(
        success=True,
        task_id=task_id,
        message="Task updated successfully"
    )


@router.delete("/{task_id}", response_model=TaskResponse)
def delete_task(task_id: str):
    """Task 삭제"""
    cache = get_cache()

    # 캐시에서 경로 조회
    task_file = cache.get_task_path(task_id)
    if not task_file:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")

    # exec vault 태스크는 API를 통한 삭제 불가 (읽기 전용 마운트)
    task_path_str = str(task_file)
    if '/exec/' in task_path_str or task_path_str.startswith('/vault/exec'):
        raise HTTPException(
            status_code=403,
            detail=f"Exec vault tasks cannot be deleted through the API. Please delete directly in Obsidian. Task: {task_id}"
        )

    # Task 정보 백업 (감사 로그용)
    task_data = cache.get_task(task_id)
    entity_name = task_data.get("entity_name", "") if task_data else ""

    # 파일 삭제
    try:
        task_file.unlink()
    except FileNotFoundError:
        pass  # 이미 삭제됨

    # 캐시에서 제거
    cache.remove_task(task_id)

    # 감사 로그
    log_entity_action(
        action="delete",
        entity_type="Task",
        entity_id=task_id,
        entity_name=entity_name,
        details={"file_path": str(task_file)}
    )

    return TaskResponse(
        success=True,
        task_id=task_id,
        message="Task deleted successfully"
    )
