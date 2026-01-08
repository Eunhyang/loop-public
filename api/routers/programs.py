"""
Program API Router

Program 조회 및 생성 엔드포인트 (캐시 기반)
tsk-022-02: POST /api/programs 추가
"""

import re
import yaml
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, HTTPException

from ..cache import get_cache
from ..models.entities import ProgramCreate, ProgramResponse
from ..constants import PROGRAM_TYPES
from ..utils.vault_utils import get_vault_dir
from .audit import log_entity_action

router = APIRouter(prefix="/api/programs", tags=["programs"])

# Vault 경로
VAULT_DIR = get_vault_dir()
PROJECTS_DIR = VAULT_DIR / "50_Projects"


def _normalize_program_id(name: str) -> str:
    """Program ID 생성 (kebab-case)

    예: "채용" -> "pgm-hiring" (PROGRAM_TYPES 매칭 시)
    예: "YouTube Weekly" -> "pgm-youtube-weekly"
    """
    # 영문 소문자로 변환
    normalized = name.lower()
    # 공백 및 특수문자를 하이픈으로 변환
    normalized = re.sub(r'[^a-z0-9가-힣]+', '-', normalized)
    # 연속 하이픈 제거
    normalized = re.sub(r'-+', '-', normalized)
    # 앞뒤 하이픈 제거
    normalized = normalized.strip('-')

    # 한글인 경우 기본 ID 생성
    if not re.match(r'^[a-z0-9-]+$', normalized):
        # 한글 이름을 기반으로 간단한 ID 생성
        normalized = re.sub(r'[^a-z0-9]+', '-', normalized.lower())
        normalized = normalized.strip('-') or 'program'

    return f"pgm-{normalized}"


@router.get("")
def get_programs():
    """Program 목록 조회 (캐시 기반)"""
    cache = get_cache()
    programs = cache.get_all_programs()
    return {"programs": programs}


@router.get("/{program_id}")
def get_program(program_id: str):
    """개별 Program 조회"""
    cache = get_cache()
    program = cache.get_program(program_id)

    if not program:
        raise HTTPException(status_code=404, detail=f"Program not found: {program_id}")

    return {"program": program}


@router.post("", response_model=ProgramResponse)
def create_program(program: ProgramCreate):
    """
    Program 생성 (tsk-022-02)

    - entity_name: Program 이름
    - program_type: PROGRAM_TYPES에서 선택 (hiring, fundraising, etc.)
    - owner: 책임자
    - description: 설명 (선택)
    - principles: 운영 원칙 (선택)
    - process_steps: 프로세스 단계 (선택)
    """
    cache = get_cache()

    # 1. program_type 검증 (SSOT: schema_constants.yaml)
    if program.program_type not in PROGRAM_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid program_type: {program.program_type}. "
                   f"Valid types: {', '.join(PROGRAM_TYPES)}"
        )

    # 2. Program ID 생성
    program_id = _normalize_program_id(program.entity_name)

    # 3. 중복 체크
    existing = cache.get_program(program_id)
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Program already exists: {program_id}"
        )

    # 4. 디렉토리 생성
    # entity_name에서 폴더명 추출 (특수문자 제거)
    folder_name = re.sub(r'[^\w가-힣\s-]', '', program.entity_name)
    folder_name = folder_name.replace(' ', '_')
    program_dir = PROJECTS_DIR / folder_name
    program_dir.mkdir(parents=True, exist_ok=True)

    # 5. Frontmatter 생성
    today = datetime.now().strftime("%Y-%m-%d")

    frontmatter = {
        "entity_type": "Program",
        "entity_id": program_id,
        "entity_name": program.entity_name,
        "created": today,
        "updated": today,
        "status": "doing",  # Program은 항상 doing (닫지 않음)
        "program_type": program.program_type,
        "owner": program.owner,
        "principles": program.principles if program.principles else [],
        "process_steps": program.process_steps if program.process_steps else [],
        "templates": [],
        "kpis": [],
        "exec_rounds_path": None,
        "parent_id": None,
        "aliases": [program_id, program.entity_name],
        "outgoing_relations": [],
        "validates": [],
        "validated_by": [],
        "tags": ["program", program.program_type],
        "priority_flag": "medium"
    }

    # 6. _PROGRAM.md 파일 생성
    program_file = program_dir / "_PROGRAM.md"

    description_text = program.description if program.description else "프로그램 설명을 입력하세요."

    content = f"""---
{yaml.dump(frontmatter, allow_unicode=True, sort_keys=False)}---

# {program.entity_name}

> Program ID: `{program_id}` | Type: {program.program_type} | Status: doing

## 프로그램 개요

{description_text}

---

## 운영 원칙

{chr(10).join(f"- {p}" for p in program.principles) if program.principles else "- 운영 원칙을 추가하세요."}

---

## 프로세스

{chr(10).join(f"{i+1}. {step}" for i, step in enumerate(program.process_steps)) if program.process_steps else "1. 프로세스를 정의하세요."}

---

## Rounds (하위 프로젝트)

| Round | Status | Link |
|-------|--------|------|
| - | - | - |

---

**Created**: {today}
**Owner**: {program.owner}
"""

    with open(program_file, 'w', encoding='utf-8') as f:
        f.write(content)

    # 7. 캐시 업데이트
    cache.set_program(program_id, frontmatter, program_file)

    # 8. 감사 로그
    log_entity_action(
        action="create",
        entity_type="Program",
        entity_id=program_id,
        entity_name=program.entity_name,
        details={
            "program_type": program.program_type,
            "owner": program.owner,
            "directory": str(program_dir.name)
        }
    )

    return ProgramResponse(
        success=True,
        program_id=program_id,
        file_path=str(program_file.relative_to(VAULT_DIR)),
        message=f"Program '{program.entity_name}' created successfully"
    )


@router.delete("/{program_id}", response_model=ProgramResponse)
def delete_program(program_id: str):
    """
    Program 삭제

    Args:
        program_id: 삭제할 Program ID

    Returns:
        ProgramResponse: 성공 메시지

    Raises:
        HTTPException:
            - 404: Program이 존재하지 않음
            - 400: 하위 Project가 존재하여 삭제 불가
    """
    cache = get_cache()

    # 1. Program 존재 확인 (404 먼저 체크)
    program = cache.get_program(program_id)
    if not program:
        raise HTTPException(
            status_code=404,
            detail=f"Program not found: {program_id}"
        )

    # 2. 하위 Project 확인 (400)
    all_projects = cache.get_all_projects()
    child_projects = [
        p for p in all_projects
        if p.get("program_id") == program_id
    ]

    if child_projects:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete program: {len(child_projects)} project(s) are linked. "
                   f"Delete the projects first."
        )

    # 3. 파일 경로 구성
    # Cache stores _path as relative, need to construct absolute path
    relative_path = program.get("_path")
    if not relative_path:
        raise HTTPException(
            status_code=500,
            detail="Program path not found in cache"
        )

    program_file = VAULT_DIR / relative_path
    program_dir = program_file.parent

    # 4. 파일 및 디렉토리 삭제
    entity_name = program.get("entity_name", "")
    try:
        # _PROGRAM.md 파일 삭제
        if program_file.exists():
            program_file.unlink()

        # 디렉토리가 비어있으면 삭제
        if program_dir.exists() and program_dir.is_dir():
            # 디렉토리 내 다른 파일이 있는지 확인
            remaining_files = list(program_dir.iterdir())
            if not remaining_files:
                program_dir.rmdir()

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete program files: {str(e)}"
        )

    # 5. 캐시에서 제거 (파일 삭제 성공 후에만)
    cache.remove_program(program_id)

    # 6. 감사 로그
    log_entity_action(
        action="delete",
        entity_type="Program",
        entity_id=program_id,
        entity_name=entity_name,
        details={
            "file_path": str(program_file),
            "directory": str(program_dir.name)
        }
    )

    return ProgramResponse(
        success=True,
        program_id=program_id,
        file_path=str(program_file.relative_to(VAULT_DIR)),
        message=f"Program '{entity_name}' deleted successfully"
    )
