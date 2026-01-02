"""
Project API Router

Project 생성 및 조회 엔드포인트
캐시 기반으로 O(1) 조회 지원
autofill_expected_impact 옵션으로 LLM 자동 채움 지원
"""

import re
import yaml
import shutil
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException

from ..models.entities import ProjectCreate, ProjectUpdate, ProjectResponse, ValidationResult
from ..cache import get_cache
from ..utils.vault_utils import (
    sanitize_filename,
    get_vault_dir
)
from ..utils.impact_calculator import calculate_expected_score, validate_contributes_weights
from ..services.llm_service import get_llm_service
from ..prompts.expected_impact import EXPECTED_IMPACT_SYSTEM_PROMPT, build_simple_expected_impact_prompt
from .audit import log_entity_action
from .ai import _validate_project_schema_internal

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
async def create_project(project: ProjectCreate):
    """
    Project 생성 (auto_validate=True 시 자동 스키마 검증)

    옵션:
        autofill_expected_impact=True: LLM으로 Expected Impact 자동 채움
        expected_impact: 수동 Expected Impact 설정
        auto_validate=True: 생성 후 스키마 검증 자동 실행
    """
    # 0. entity_name 형식 검증 (주제 - 내용)
    if " - " not in project.entity_name:
        raise HTTPException(
            status_code=400,
            detail="entity_name은 '주제 - 내용' 형식이어야 합니다. (예: 'Dashboard - UX 개선')"
        )

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

    if project.conditions_3y:
        frontmatter["conditions_3y"] = project.conditions_3y

    # 5. Expected Impact 처리
    expected_impact_result = None
    expected_score = None

    if project.autofill_expected_impact:
        # LLM 자동 채움
        expected_impact_result, expected_score = await _autofill_expected_impact(
            project_id=project_id,
            project_name=project.entity_name,
            conditions_3y=project.conditions_3y,
            provider=project.llm_provider
        )
        if expected_impact_result:
            frontmatter["expected_impact"] = expected_impact_result

    elif project.expected_impact:
        # 수동 설정
        expected_impact_result = {
            "tier": project.expected_impact.tier,
            "impact_magnitude": project.expected_impact.impact_magnitude,
            "confidence": project.expected_impact.confidence,
            "contributes": project.expected_impact.contributes
        }
        frontmatter["expected_impact"] = expected_impact_result

        # Score 계산
        try:
            expected_score = calculate_expected_score(
                tier=project.expected_impact.tier,
                magnitude=project.expected_impact.impact_magnitude,
                confidence=project.expected_impact.confidence
            )
        except ValueError:
            pass

    # 6. Project_정의.md 생성
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

    # 7. 캐시 업데이트
    cache.set_project(project_id, frontmatter, project_file)

    # 8. 감사 로그
    log_entity_action(
        action="create",
        entity_type="Project",
        entity_id=project_id,
        entity_name=project.entity_name,
        details={
            "autofill_expected_impact": project.autofill_expected_impact,
            "expected_impact": expected_impact_result,
            "expected_score": expected_score,
            "auto_validate": project.auto_validate
        }
    )

    # 9. Auto-validate (optional)
    validation_result = None
    if project.auto_validate:
        val_result = await _validate_project_schema_internal(
            project_id=project_id,
            frontmatter=frontmatter,
            provider=project.llm_provider
        )
        validation_result = ValidationResult(
            validated=val_result.get("validated", True),
            issues_found=val_result.get("issues_found", 0),
            pending_created=val_result.get("pending_created", False),
            pending_id=val_result.get("pending_id"),
            run_id=val_result.get("run_id")
        )

    return ProjectResponse(
        success=True,
        project_id=project_id,
        directory=dir_name,
        message="Project created successfully",
        expected_impact=expected_impact_result,
        expected_score=round(expected_score, 2) if expected_score else None,
        validation=validation_result
    )


async def _autofill_expected_impact(
    project_id: str,
    project_name: str,
    conditions_3y: list,
    provider: str = "openai"
) -> tuple:
    """
    LLM으로 Expected Impact 자동 채움

    Returns:
        (expected_impact_dict, expected_score) or (None, None) on failure
    """
    try:
        # 프롬프트 생성
        prompt = build_simple_expected_impact_prompt(
            project_name=project_name,
            project_description="",  # 생성 시점에는 설명 없음
            conditions_3y=conditions_3y
        )

        # LLM 호출
        llm = get_llm_service()
        result = await llm.call_llm(
            prompt=prompt,
            system_prompt=EXPECTED_IMPACT_SYSTEM_PROMPT,
            provider=provider,
            response_format="json"
        )

        if not result["success"]:
            return None, None

        content = result["content"]

        # 응답 파싱
        tier = "operational"
        magnitude = "mid"
        confidence = 0.7
        contributes = []

        if "tier" in content:
            tier_data = content["tier"]
            tier = tier_data.get("value", tier) if isinstance(tier_data, dict) else tier_data

        if "impact_magnitude" in content:
            mag_data = content["impact_magnitude"]
            magnitude = mag_data.get("value", magnitude) if isinstance(mag_data, dict) else mag_data

        if "confidence" in content:
            conf_data = content["confidence"]
            confidence = conf_data.get("value", confidence) if isinstance(conf_data, dict) else conf_data

        if "contributes" in content and isinstance(content["contributes"], list):
            _, contributes, _ = validate_contributes_weights(content["contributes"])

        # Score 계산
        expected_score = calculate_expected_score(tier, magnitude, confidence)

        expected_impact = {
            "tier": tier,
            "impact_magnitude": magnitude,
            "confidence": confidence,
            "contributes": contributes
        }

        return expected_impact, expected_score

    except Exception as e:
        print(f"Autofill expected impact error: {e}")
        return None, None


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
        # === tsk-n8n-15: 가설 필수 게이트 ===
        # active/done으로 전환 시 가설 연결 필수
        if project.status in ["active", "done"]:
            has_hypothesis = (
                frontmatter.get("primary_hypothesis_id") or
                frontmatter.get("validates")
            )
            if not has_hypothesis:
                raise HTTPException(
                    status_code=400,
                    detail="Project requires at least one hypothesis before transitioning to active/done. "
                           "Use POST /api/ai/infer/hypothesis_draft to generate a hypothesis, "
                           "then approve it via Dashboard."
                )
        # === END tsk-n8n-15 ===
        frontmatter['status'] = project.status
    if project.priority_flag is not None:
        frontmatter['priority_flag'] = project.priority_flag
    if project.deadline is not None:
        frontmatter['deadline'] = project.deadline
    if project.hypothesis_text is not None:
        frontmatter['hypothesis_text'] = project.hypothesis_text
    if project.tags is not None:
        frontmatter['tags'] = project.tags
    # 외부 링크
    if project.links is not None:
        frontmatter['links'] = [{'label': link.label, 'url': link.url} for link in project.links]

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
