"""
Task API Router

Task 생성, 조회, 수정, 삭제 엔드포인트
캐시 기반으로 O(1) 조회 지원
"""

import re
import yaml
import copy
from pathlib import Path
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException

from ..models.entities import TaskCreate, TaskUpdate, TaskResponse, ValidationResult
from ..cache import get_cache
from ..utils.vault_utils import (
    sanitize_filename,
    get_vault_dir,
    get_exec_vault_dir
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

    # 경로 정보 추가 (public/exec vault 모두 지원)
    try:
        frontmatter['_path'] = str(task_path.relative_to(VAULT_DIR))
    except ValueError:
        # exec vault의 경로일 수 있음
        exec_dir = get_exec_vault_dir()
        try:
            frontmatter['_path'] = f"exec/{task_path.relative_to(exec_dir)}"
        except ValueError:
            # 둘 다 아닌 경우 절대 경로 사용 (fallback)
            frontmatter['_path'] = str(task_path)
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

    # 1b. assignee 검증 (캐시 기반 - tsk-018-06)
    member = cache.get_member(task.assignee)
    if not member:
        raise HTTPException(status_code=400, detail=f"Unknown assignee: {task.assignee}")

    # 2. Project 디렉토리 찾기 (캐시 사용)
    project_dir = cache.get_project_dir(task.project_id)
    if not project_dir:
        raise HTTPException(status_code=404, detail=f"Project not found: {task.project_id}")

    tasks_dir = project_dir / "Tasks"
    tasks_dir.mkdir(exist_ok=True)

    # 3. Task ID 생성 (캐시 기반)
    # SSOT: tsk-{project_num}-{sequence}
    task_id = cache.get_next_task_id(task.project_id)

    # 4. 파일명 생성 (SSOT: tsk-{id}.md 강제 - tsk-019-01)
    # Content-based filename (e.g. "My_Task.md") is NO LONGER ALLOWED
    filename = f"{task_id}.md"
    task_file = tasks_dir / filename

    # entity_id는 유일하므로 충돌 불가 (이론적으로)
    # 만약 파일이 존재한다면 심각한 오류
    if task_file.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Task file already exists: {filename} (entity_id collision)"
        )

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

    if task.type:
        frontmatter["type"] = task.type

    if task.notes:
        frontmatter["notes"] = task.notes

    # tsk-022-11: Bug 3 fix - persist links to frontmatter (convert HttpUrl to str)
    if task.links is not None:
        frontmatter['links'] = [{'label': link.label, 'url': str(link.url)} for link in task.links]

    # tsk-uegvfe-1767941662809: GitHub Integration fields
    if task.pr_url:
        frontmatter['pr_url'] = task.pr_url
    if task.merged_commit:
        frontmatter['merged_commit'] = task.merged_commit

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
    """Task 수정

    tsk-dashboard-ux-v1-31: Added debug logging for type field
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"[update_task] task_id={task_id}, received type={task.type!r}")

    cache = get_cache()

    # 캐시에서 경로 조회
    task_file = cache.get_task_path(task_id)
    if not task_file:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")

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

    # SSOT Rule B: Optimistic concurrency control (tsk-019-14)
    # Check BEFORE any frontmatter mutation to prevent race conditions
    if task.expected_updated_at:
        current_updated = frontmatter.get('updated')
        if current_updated != task.expected_updated_at:
            raise HTTPException(
                status_code=409,
                detail={
                    "error": "Conflict: Entity was modified",
                    "entity_id": task_id,
                    "current_updated_at": current_updated,
                    "expected_updated_at": task.expected_updated_at,
                    "message": "Entity was modified by another user/process. Please reload and retry."
                }
            )

    # SSOT Rule C: Preserve old frontmatter for diff calculation (tsk-019-14)
    old_frontmatter = copy.deepcopy(frontmatter)  # Deep copy before mutations

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
        # 외부 링크 (tsk-022-11: convert HttpUrl to str)
        if task.links is not None:
            frontmatter['links'] = [{'label': link.label, 'url': str(link.url)} for link in task.links]
        # Task 타입
        if task.type is not None:
            frontmatter['type'] = task.type
            logger.info(f"[update_task] task_id={task_id}, type added to frontmatter: {task.type!r}")
        else:
            logger.info(f"[update_task] task_id={task_id}, type is None, skipping frontmatter update")
        # GitHub Integration fields (tsk-uegvfe-1767941662809)
        if task.pr_url is not None:
            frontmatter['pr_url'] = task.pr_url if task.pr_url else None
        if task.merged_commit is not None:
            frontmatter['merged_commit'] = task.merged_commit if task.merged_commit else None

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
        logger.info(f"[update_task] task_id={task_id}, file written successfully, type in frontmatter: {frontmatter.get('type')!r}")
    except PermissionError as e:
        raise HTTPException(status_code=500, detail=f"Permission denied writing task file: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error writing task file: {type(e).__name__}: {e}")

    # 캐시 업데이트
    cache.set_task(task_id, frontmatter, task_file)

    # SSOT Rule C: 감사 로그 with diff (tsk-019-14)
    try:
        # Calculate modified_fields: exclude request-only fields (expected_updated_at, etc.)
        ENTITY_FIELDS = {'entity_name', 'assignee', 'priority', 'start_date', 'due', 'status',
                        'notes', 'tags', 'conditions_3y', 'closed', 'closed_inferred',
                        'project_id', 'links', 'type'}
        changed_fields = [k for k, v in task.model_dump().items()
                         if v is not None and k in ENTITY_FIELDS]

        # Calculate diff: {field: {old, new}} for actually changed values
        diff = {}
        for field in changed_fields:
            old_val = old_frontmatter.get(field)
            new_val = frontmatter.get(field)
            if old_val != new_val:
                diff[field] = {"old": old_val, "new": new_val}

        log_entity_action(
            action="update",
            entity_type="Task",
            entity_id=task_id,
            entity_name=frontmatter.get("entity_name", ""),
            details={"changed_fields": changed_fields},  # Legacy
            source="api",
            modified_fields=list(diff.keys()),  # Only actually modified fields
            diff=diff
        )
    except Exception as e:
        # 감사 로그 실패는 무시 (메인 로직에 영향 주지 않음)
        print(f"Warning: Failed to log task update: {e}")

    # tsk-dashboard-ux-v1-31: 업데이트된 Task 정보도 반환
    return TaskResponse(
        success=True,
        task_id=task_id,
        message="Task updated successfully",
        task=frontmatter
    )


@router.delete("/{task_id}", response_model=TaskResponse)
def delete_task(task_id: str):
    """Task 삭제"""
    cache = get_cache()

    # 캐시에서 경로 조회
    task_file = cache.get_task_path(task_id)
    if not task_file:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")

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


@router.post("/{task_id}/duplicate", response_model=TaskResponse)
def duplicate_task(task_id: str):
    """
    Task 복제 (ID와 날짜만 변경, 나머지 전부 동일)

    변경되는 필드 (4개만):
    - entity_id: 새 ID 생성
    - aliases: 새 ID로 교체
    - created: 오늘 날짜
    - updated: 오늘 날짜

    나머지 전부 동일: entity_name, status, assignee, priority, type, project_id, tags, conditions_3y, body 등
    """
    cache = get_cache()

    # 1. Source task 조회
    source_frontmatter = cache.get_task(task_id)
    if not source_frontmatter:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")

    source_path = cache.get_task_path(task_id)
    if not source_path:
        raise HTTPException(status_code=404, detail=f"Task path not found: {task_id}")

    # Body 읽기
    try:
        with open(source_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        cache.remove_task(task_id)
        raise HTTPException(status_code=404, detail=f"Task file not found: {task_id}")

    # Frontmatter와 Body 분리
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', content, re.DOTALL)
    if not match:
        raise HTTPException(status_code=500, detail="Invalid frontmatter format")

    body = match.group(2)

    # 2. Frontmatter 복제 - ID/날짜만 변경
    new_frontmatter = copy.deepcopy(source_frontmatter)

    # 새 Task ID 생성
    project_id = new_frontmatter.get('project_id')
    if not project_id:
        raise HTTPException(status_code=500, detail="Source task has no project_id")

    new_task_id = cache.get_next_task_id(project_id)
    today = datetime.now().strftime("%Y-%m-%d")

    # 변경되는 필드 (4개만)
    new_frontmatter['entity_id'] = new_task_id
    new_frontmatter['aliases'] = [new_task_id]
    new_frontmatter['created'] = today
    new_frontmatter['updated'] = today

    # 3. Project 디렉토리 찾기
    project_dir = cache.get_project_dir(project_id)
    if not project_dir:
        raise HTTPException(status_code=404, detail=f"Project not found: {project_id}")

    tasks_dir = project_dir / "Tasks"
    tasks_dir.mkdir(exist_ok=True)

    # 4. 파일 생성
    filename = f"{new_task_id}.md"
    task_file = tasks_dir / filename

    if task_file.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Task file already exists: {filename} (entity_id collision)"
        )

    new_content = f"""---
{yaml.dump(new_frontmatter, allow_unicode=True, sort_keys=False)}---
{body}"""

    with open(task_file, 'w', encoding='utf-8') as f:
        f.write(new_content)

    # 5. 캐시 업데이트
    cache.set_task(new_task_id, new_frontmatter, task_file)

    # 6. 감사 로그
    log_entity_action(
        action="duplicate",
        entity_type="Task",
        entity_id=new_task_id,
        entity_name=new_frontmatter.get("entity_name", ""),
        details={
            "source_task_id": task_id,
            "project_id": project_id,
            "assignee": new_frontmatter.get("assignee"),
            "status": new_frontmatter.get("status")
        }
    )

    return TaskResponse(
        success=True,
        task_id=new_task_id,
        file_path=str(task_file.relative_to(VAULT_DIR)),
        message=f"Task duplicated successfully from {task_id}",
        task=new_frontmatter
    )


@router.post("/parse-nl")
async def parse_task_natural_language(request: dict):
    """
    자연어 텍스트를 파싱하여 Task 필드 제안

    Request Body:
        {
            "text": "로그인 버그 수정, 김철수, 높은 우선순위, 내일까지"
        }

    Returns:
        Partial<Task> - 파싱된 필드들
    """
    from ..services.llm_service import LLMService
    from ..constants import TASK_STATUS, TASK_PRIORITY, TASK_TYPES

    text = request.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    # Get members from cache
    cache = get_cache()
    members = cache.get_all_members()
    member_names = [m.get("id") for m in members if m.get("id")]

    # Get projects from cache
    projects = cache.get_all_projects()
    project_options = [
        {"id": p.get("entity_id"), "name": p.get("entity_name")}
        for p in projects
        if p.get("entity_id") and p.get("entity_name")
    ]

    # Build project options string
    project_options_str = ', '.join([f"{p['id']}({p['name']})" for p in project_options])

    # Build prompt
    system_prompt = f"""You are a task parsing assistant. Parse natural language text into structured task fields.

Available assignees: {', '.join(member_names)}
Available projects: {project_options_str}
Available statuses: {', '.join(TASK_STATUS)}
Available priorities: {', '.join(TASK_PRIORITY)}
Available types: {', '.join(TASK_TYPES)}

Return a JSON object with the following fields (only include fields you can extract):
{{
    "entity_name": "task title/description",
    "project_id": "one of the available project IDs (match by context/keywords)",
    "assignee": "one of the available assignees (match by name similarity)",
    "priority": "one of: critical, high, medium, low",
    "status": "one of: todo, doing, hold, done, blocked (default: todo)",
    "type": "one of: dev, bug, strategy, research, ops, meeting",
    "due": "YYYY-MM-DD format (parse relative dates like '내일', '오늘', 'tomorrow')",
    "notes": "apply template if mentioned, fill in user content into template structure"
}}

Current date: {datetime.now().strftime('%Y-%m-%d')}

Parse relative dates:
- "오늘", "today" → {datetime.now().strftime('%Y-%m-%d')}
- "내일", "tomorrow" → {(datetime.now() + __import__('datetime').timedelta(days=1)).strftime('%Y-%m-%d')}

Priority keywords:
- "긴급", "critical" → critical
- "높은", "high", "중요한" → high
- "보통", "medium" → medium
- "낮은", "low" → low

Type keywords:
- "버그", "bug", "수정" → bug
- "개발", "dev", "구현" → dev
- "전략", "strategy" → strategy
- "연구", "research" → research
- "운영", "ops" → ops
- "회의", "meeting" → meeting

Project matching (PRIORITY ORDER):
1. FIRST: If input contains explicit project ID pattern (prj-xxx), use that ID directly
   - Example: "prj-156anu, Antler 2차..." → project_id = "prj-156anu"
2. SECOND: Match by keywords in Available projects list
   - Example: "Antler 작업" → search "Antler" in project names → find "prj-156anu(Antler - 엔틀러코리아...)"
3. If no match found, leave project_id empty

TEMPLATE APPLICATION RULES:
1. ONLY apply template if user EXPLICITLY requests it:
   - "버그 템플릿", "bug template", "버그 템플릿 적용해줘" → Bug template
   - "dev 템플릿", "개발 템플릿" → Dev template
2. If NO template is requested → Put user content directly in notes field WITHOUT template structure
3. NEVER leave placeholders like [fill user content] - always replace with actual content

When template IS requested, fill in user content into the structure:

Bug Template:
```
## Bug 설명
**증상**: [actual user description here]
**재현 단계**:
1. [actual steps from user]
**예상 동작**:
**실제 동작**: [actual user description]
---
## 환경
- Browser:
- OS: [extract from user input if mentioned]
- Version:
---
## 해결 방안
### 원인 분석
### 수정 내용
---
## 검증
- [ ] 버그 재현 불가 확인
- [ ] 회귀 테스트 통과
```

Dev Template:
```
## 목표
**완료 조건**:
1. [actual user requirements]
---
## 상세 내용
### 배경
### 작업 내용
[actual user content]
---
## 체크리스트
- [ ] 구현 완료
- [ ] 테스트 통과
- [ ] 빌드 성공
---
## Notes
### Todo
- [ ]
### 작업 로그
```

Example - NO template requested:
Input: "prj-156anu, Antler 2차 - Take Home Test Form 작성, 김은향, 내용은 질문1, 질문2..."
Output notes: "질문1, 질문2..." (just the raw content, no template structure)"""

    user_prompt = f"Parse this text into task fields: {text}"

    # Call LLM
    llm = LLMService()
    try:
        result = await llm.call_llm(
            prompt=user_prompt,
            system_prompt=system_prompt,
            provider="openai",
            model="gpt-4.1-mini",
            temperature=0.3,
            max_tokens=1024,
            response_format="json",
            entity_context={"action": "parse_task_nl", "text_length": len(text)},
            log_run=True
        )

        if not result["success"]:
            raise HTTPException(
                status_code=500,
                detail=f"LLM parsing failed: {result.get('error', 'Unknown error')}"
            )

        parsed_fields = result["content"]

        # Validate and normalize fields
        response = {}

        if "entity_name" in parsed_fields and parsed_fields["entity_name"]:
            response["entity_name"] = parsed_fields["entity_name"]

        if "project_id" in parsed_fields and parsed_fields["project_id"]:
            # Validate project exists
            valid_project_ids = [p["id"] for p in project_options]
            if parsed_fields["project_id"] in valid_project_ids:
                response["project_id"] = parsed_fields["project_id"]

        if "assignee" in parsed_fields and parsed_fields["assignee"]:
            # Validate assignee exists
            if parsed_fields["assignee"] in member_names:
                response["assignee"] = parsed_fields["assignee"]

        if "priority" in parsed_fields and parsed_fields["priority"]:
            if parsed_fields["priority"] in TASK_PRIORITY:
                response["priority"] = parsed_fields["priority"]

        if "status" in parsed_fields and parsed_fields["status"]:
            if parsed_fields["status"] in TASK_STATUS:
                response["status"] = parsed_fields["status"]

        if "type" in parsed_fields and parsed_fields["type"]:
            if parsed_fields["type"] in TASK_TYPES:
                response["type"] = parsed_fields["type"]

        if "due" in parsed_fields and parsed_fields["due"]:
            # Validate date format (YYYY-MM-DD)
            try:
                datetime.strptime(parsed_fields["due"], "%Y-%m-%d")
                response["due"] = parsed_fields["due"]
            except ValueError:
                pass  # Skip invalid dates

        if "notes" in parsed_fields and parsed_fields["notes"]:
            response["notes"] = parsed_fields["notes"]

        return {
            "success": True,
            "parsed_fields": response,
            "run_id": result.get("run_id")
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Parsing error: {str(e)}"
        )
