#!/usr/bin/env python3
"""
LOOP Dashboard API Server

Task/Project를 웹 UI에서 생성/수정/삭제할 수 있도록 REST API 제공

Usage:
    uvicorn scripts.api_server:app --host 0.0.0.0 --port 8081 --reload

Endpoints:
    GET  /api/tasks              - Task 목록
    POST /api/tasks              - Task 생성
    PUT  /api/tasks/{task_id}    - Task 수정
    DELETE /api/tasks/{task_id}  - Task 삭제

    GET  /api/projects           - Project 목록
    POST /api/projects           - Project 생성

    GET  /api/members            - 멤버 목록
"""

import os
import re
import yaml
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ============================================
# Configuration
# ============================================
VAULT_DIR = Path("/Volumes/LOOP_CORE/vault/LOOP")
PROJECTS_DIR = VAULT_DIR / "50_Projects/2025"
TEMPLATES_DIR = VAULT_DIR / "00_Meta/_TEMPLATES"
MEMBERS_FILE = VAULT_DIR / "00_Meta/members.yaml"

# ============================================
# Pydantic Models
# ============================================
class TaskCreate(BaseModel):
    entity_name: str = Field(..., description="Task 이름")
    project_id: str = Field(..., description="프로젝트 ID (예: prj:001)")
    assignee: str = Field(..., description="담당자 ID (예: eunhyang)")
    priority: str = Field(default="medium", description="우선순위: low/medium/high")
    due: Optional[str] = Field(default=None, description="마감일 (YYYY-MM-DD)")
    status: str = Field(default="todo", description="상태: todo/doing/done/blocked")
    tags: List[str] = Field(default_factory=list, description="태그")

class TaskUpdate(BaseModel):
    entity_name: Optional[str] = None
    assignee: Optional[str] = None
    priority: Optional[str] = None
    due: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None

class ProjectCreate(BaseModel):
    entity_name: str = Field(..., description="프로젝트 이름")
    owner: str = Field(..., description="책임자 ID")
    parent_id: Optional[str] = Field(default=None, description="부모 Track/Hypothesis ID")
    priority: str = Field(default="medium", description="우선순위")

# ============================================
# FastAPI App
# ============================================
app = FastAPI(title="LOOP Dashboard API", version="1.0.0")

# CORS 설정 (웹 브라우저에서 접근 가능하도록)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Utility Functions
# ============================================
def load_members() -> Dict[str, Dict]:
    """멤버 목록 로드"""
    if not MEMBERS_FILE.exists():
        return {}

    with open(MEMBERS_FILE, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
        members = {}
        for member in data.get('members', []):
            members[member['id']] = member
        return members

def extract_frontmatter(file_path: Path) -> Optional[Dict[str, Any]]:
    """YAML frontmatter 추출"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
        if not match:
            return None

        return yaml.safe_load(match.group(1))
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
        return None


def extract_frontmatter_and_body(file_path: Path) -> Tuple[Optional[Dict[str, Any]], str]:
    """YAML frontmatter와 본문을 함께 추출"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        match = re.match(r'^---\s*\n(.*?)\n---\s*\n?(.*)', content, re.DOTALL)
        if not match:
            return None, content

        frontmatter = yaml.safe_load(match.group(1))
        body = match.group(2).strip()
        return frontmatter, body
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
        return None, ""

def get_next_task_id() -> str:
    """다음 Task ID 생성"""
    max_id = 0

    # 모든 Task 파일 스캔
    for task_file in PROJECTS_DIR.rglob("Tasks/*.md"):
        frontmatter = extract_frontmatter(task_file)
        if not frontmatter or 'entity_id' not in frontmatter:
            continue

        entity_id = frontmatter['entity_id']
        # tsk:001-01 형식에서 숫자 추출
        match = re.match(r'tsk:(\d+)-(\d+)', entity_id)
        if match:
            main_num = int(match.group(1))
            sub_num = int(match.group(2))
            combined = main_num * 100 + sub_num
            max_id = max(max_id, combined)

    # 다음 ID 계산
    next_id = max_id + 1
    main = next_id // 100
    sub = next_id % 100

    if main == 0:
        main = 1

    return f"tsk:{main:03d}-{sub:02d}"

def get_next_project_id() -> str:
    """다음 Project ID 생성"""
    max_num = 0

    for project_dir in PROJECTS_DIR.glob("P*"):
        # P001_Name 형식에서 숫자 추출
        match = re.match(r'P(\d+)', project_dir.name)
        if match:
            num = int(match.group(1))
            max_num = max(max_num, num)

    return f"prj:{max_num + 1:03d}"

def find_project_dir(project_id: str) -> Optional[Path]:
    """Project ID로 프로젝트 디렉토리 찾기"""
    # project_id: "prj:001" → "P001"
    match = re.match(r'prj:(\d+)', project_id)
    if not match:
        return None

    project_num = match.group(1)

    for project_dir in PROJECTS_DIR.glob(f"P{project_num}_*"):
        return project_dir

    return None

def sanitize_filename(name: str) -> str:
    """파일명 안전하게 변환"""
    # 특수문자 제거, 공백을 언더스코어로
    name = re.sub(r'[^\w\s-]', '', name)
    name = re.sub(r'[-\s]+', '_', name)
    return name.strip('_')

# ============================================
# API Endpoints
# ============================================

@app.get("/")
def root():
    """API 정보"""
    return {
        "name": "LOOP Dashboard API",
        "version": "1.0.0",
        "endpoints": {
            "tasks": "/api/tasks",
            "projects": "/api/projects",
            "members": "/api/members"
        }
    }

@app.get("/api/members")
def get_members():
    """멤버 목록 조회"""
    return {"members": load_members()}

@app.get("/api/projects")
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

@app.get("/api/tasks")
def get_tasks(
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    include_body: bool = True
):
    """Task 목록 조회

    Args:
        project_id: 특정 프로젝트의 Task만 조회
        status: 특정 상태의 Task만 조회
        include_body: 본문(마크다운) 포함 여부 (기본: True)
    """
    tasks = []

    for task_file in PROJECTS_DIR.rglob("Tasks/*.md"):
        # 경로 검증: Vault 내부 파일인지 확인
        if not task_file.is_relative_to(VAULT_DIR):
            continue

        if include_body:
            frontmatter, body = extract_frontmatter_and_body(task_file)
        else:
            frontmatter = extract_frontmatter(task_file)
            body = None

        if not frontmatter:
            continue

        # 필터링
        if project_id and frontmatter.get('project_id') != project_id:
            continue
        if status and frontmatter.get('status') != status:
            continue

        frontmatter['_path'] = str(task_file.relative_to(VAULT_DIR))

        # 본문을 _body 필드로 추가 (기존 notes 필드 보호)
        if include_body and body:
            frontmatter['_body'] = body

        tasks.append(frontmatter)

    return {"tasks": sorted(tasks, key=lambda x: x.get('entity_id', ''))}

@app.post("/api/tasks")
def create_task(task: TaskCreate):
    """Task 생성"""

    # 1. Validation
    members = load_members()
    if task.assignee not in members:
        raise HTTPException(status_code=400, detail=f"Unknown assignee: {task.assignee}")

    # 2. Project 디렉토리 찾기
    project_dir = find_project_dir(task.project_id)
    if not project_dir:
        raise HTTPException(status_code=404, detail=f"Project not found: {task.project_id}")

    tasks_dir = project_dir / "Tasks"
    tasks_dir.mkdir(exist_ok=True)

    # 3. Task ID 생성
    task_id = get_next_task_id()

    # 4. 파일명 생성
    filename = sanitize_filename(task.entity_name) + ".md"
    task_file = tasks_dir / filename

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

    return {
        "success": True,
        "task_id": task_id,
        "file_path": str(task_file.relative_to(VAULT_DIR)),
        "message": "Task created successfully"
    }

@app.put("/api/tasks/{task_id}")
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

    return {
        "success": True,
        "task_id": task_id,
        "message": "Task updated successfully"
    }

@app.delete("/api/tasks/{task_id}")
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

    return {
        "success": True,
        "task_id": task_id,
        "message": "Task deleted successfully"
    }

@app.post("/api/projects")
def create_project(project: ProjectCreate):
    """Project 생성"""

    # 1. Project ID 생성
    project_id = get_next_project_id()
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

    return {
        "success": True,
        "project_id": project_id,
        "directory": dir_name,
        "message": "Project created successfully"
    }

# ============================================
# Health Check
# ============================================
@app.get("/health")
def health_check():
    """헬스 체크"""
    return {
        "status": "healthy",
        "vault_exists": VAULT_DIR.exists(),
        "projects_count": len(list(PROJECTS_DIR.glob("P*"))),
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8081, reload=True)