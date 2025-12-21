"""
Hypothesis API Router

Hypothesis CRUD 엔드포인트
- GET /api/hypotheses - 목록 조회
- GET /api/hypotheses/{hypothesis_id} - 개별 조회
- POST /api/hypotheses - 생성
- PUT /api/hypotheses/{hypothesis_id} - 수정
- DELETE /api/hypotheses/{hypothesis_id} - 삭제
"""

import re
import yaml
from pathlib import Path
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException

from ..models.entities import HypothesisCreate, HypothesisUpdate, HypothesisResponse
from ..utils.vault_utils import (
    extract_frontmatter,
    get_vault_dir,
    get_next_hypothesis_id,
    validate_track_exists,
    validate_horizon,
    sanitize_filename
)

router = APIRouter(prefix="/api/hypotheses", tags=["hypotheses"])

# Vault 경로
VAULT_DIR = get_vault_dir()
HYPOTHESES_DIR = VAULT_DIR / "60_Hypotheses"


def find_hypothesis_file(hypothesis_id: str) -> Optional[Path]:
    """
    Hypothesis ID로 파일 경로 찾기

    Codex 피드백: entity_type도 함께 검증하여 다른 타입 파일과의 충돌 방지
    """
    if not HYPOTHESES_DIR.exists():
        return None

    for hyp_file in HYPOTHESES_DIR.rglob("*.md"):
        if hyp_file.name.startswith("_"):
            continue

        frontmatter = extract_frontmatter(hyp_file)
        if not frontmatter:
            continue

        # entity_type과 entity_id 모두 검증
        if (frontmatter.get('entity_type') == 'Hypothesis' and
            frontmatter.get('entity_id') == hypothesis_id):
            return hyp_file

    return None


@router.get("")
def get_hypotheses(
    parent_id: Optional[str] = None,
    evidence_status: Optional[str] = None,
    horizon: Optional[str] = None
):
    """
    Hypothesis 목록 조회

    Query Parameters:
        parent_id: Track ID로 필터 (예: trk-1)
        evidence_status: 상태로 필터 (planning, validating, validated, falsified, learning)
        horizon: 검증 목표 연도로 필터 (예: 2026)
    """
    hypotheses = []

    if not HYPOTHESES_DIR.exists():
        return {"hypotheses": []}

    for hyp_file in HYPOTHESES_DIR.rglob("*.md"):
        if hyp_file.name.startswith("_"):
            continue

        frontmatter = extract_frontmatter(hyp_file)
        if not frontmatter or frontmatter.get('entity_type') != 'Hypothesis':
            continue

        # 필터링
        if parent_id and frontmatter.get('parent_id') != parent_id:
            continue
        if evidence_status and frontmatter.get('evidence_status') != evidence_status:
            continue
        if horizon and frontmatter.get('horizon') != horizon:
            continue

        frontmatter['_path'] = str(hyp_file.relative_to(VAULT_DIR))
        hypotheses.append(frontmatter)

    return {"hypotheses": sorted(hypotheses, key=lambda x: x.get('entity_id', ''))}


@router.get("/{hypothesis_id}")
def get_hypothesis(hypothesis_id: str):
    """개별 Hypothesis 상세 조회 (body 포함)"""
    hyp_file = find_hypothesis_file(hypothesis_id)
    if not hyp_file:
        raise HTTPException(status_code=404, detail=f"Hypothesis not found: {hypothesis_id}")

    try:
        with open(hyp_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Hypothesis not found: {hypothesis_id}")

    # Frontmatter와 Body 분리 (Codex 피드백: 더 나은 에러 핸들링)
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n?(.*)$', content, re.DOTALL)
    if not match:
        # frontmatter가 없는 경우도 허용 (body만 있는 경우)
        raise HTTPException(
            status_code=400,
            detail=f"Hypothesis file has invalid format (missing frontmatter): {hypothesis_id}"
        )

    try:
        frontmatter = yaml.safe_load(match.group(1))
        if not frontmatter:
            frontmatter = {}
    except yaml.YAMLError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Hypothesis file has malformed YAML frontmatter: {hypothesis_id}"
        )

    body = match.group(2) if match.group(2) else ""

    frontmatter['_path'] = str(hyp_file.relative_to(VAULT_DIR))
    frontmatter['_body'] = body

    return {"hypothesis": frontmatter}


@router.post("", response_model=HypothesisResponse)
def create_hypothesis(hypothesis: HypothesisCreate):
    """Hypothesis 생성"""

    # 1. Validation
    # hypothesis_question은 ?로 끝나야 함
    if not hypothesis.hypothesis_question.strip().endswith('?'):
        raise HTTPException(
            status_code=400,
            detail="hypothesis_question must end with '?'"
        )

    # parent_id 형식 검증 (trk-[1-6])
    parent_match = re.match(r'^trk-(\d+)$', hypothesis.parent_id)
    if not parent_match:
        raise HTTPException(
            status_code=400,
            detail="parent_id must be in format 'trk-N' (e.g., trk-1)"
        )

    track_num = int(parent_match.group(1))

    # Track 실제 존재 확인
    if not validate_track_exists(VAULT_DIR, hypothesis.parent_id):
        raise HTTPException(
            status_code=400,
            detail=f"Track not found: {hypothesis.parent_id}"
        )

    # horizon 검증 (4자리 연도)
    if not validate_horizon(hypothesis.horizon):
        raise HTTPException(
            status_code=400,
            detail="horizon must be a 4-digit year (e.g., 2026)"
        )

    # evidence_status 검증
    valid_statuses = ['planning', 'validating', 'validated', 'falsified', 'learning']
    if hypothesis.evidence_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"evidence_status must be one of: {valid_statuses}"
        )

    # 2. Hypothesis ID 생성 (전체 스캔)
    hypothesis_id = get_next_hypothesis_id(VAULT_DIR, track_num)

    # 3. 파일 경로 결정 (horizon 기반)
    horizon_dir = HYPOTHESES_DIR / hypothesis.horizon
    horizon_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{hypothesis_id}_{sanitize_filename(hypothesis.entity_name)}.md"
    hyp_file = horizon_dir / filename

    # 파일 중복 체크
    if hyp_file.exists():
        counter = 1
        base_name = f"{hypothesis_id}_{sanitize_filename(hypothesis.entity_name)}"
        while hyp_file.exists():
            filename = f"{base_name}_{counter}.md"
            hyp_file = horizon_dir / filename
            counter += 1

    # 4. Frontmatter 생성
    today = datetime.now().strftime("%Y-%m-%d")

    frontmatter = {
        "entity_type": "Hypothesis",
        "entity_id": hypothesis_id,
        "entity_name": hypothesis.entity_name,
        "created": today,
        "updated": today,
        "status": hypothesis.evidence_status,  # status와 evidence_status 동기화

        # 계층 관계
        "parent_id": hypothesis.parent_id,
        "aliases": [hypothesis_id, sanitize_filename(hypothesis.entity_name)],

        # 가설 정의 (필수 4요소)
        "hypothesis_question": hypothesis.hypothesis_question,
        "success_criteria": hypothesis.success_criteria,
        "failure_criteria": hypothesis.failure_criteria,
        "measurement": hypothesis.measurement,

        # 시간 범위
        "horizon": hypothesis.horizon,
        "deadline": hypothesis.deadline,

        # 상태
        "evidence_status": hypothesis.evidence_status,
        "confidence": hypothesis.confidence,

        # 분류
        "loop_layer": hypothesis.loop_layer if hypothesis.loop_layer else [],
        "tags": hypothesis.tags if hypothesis.tags else [],

        # 관계 (빈 상태로 시작)
        "validates": [],
        "validated_by": [],
    }

    # 5. 파일 생성
    content = f"""---
{yaml.dump(frontmatter, allow_unicode=True, sort_keys=False, default_flow_style=False)}---

# {hypothesis.entity_name}

## 가설

{hypothesis.hypothesis_question}

## 성공 기준

{hypothesis.success_criteria}

## 실패 기준

{hypothesis.failure_criteria}

## 측정 방법

{hypothesis.measurement}

## 검증 계획

(작성 예정)

## 근거/결과

(검증 후 기록)
"""

    with open(hyp_file, 'w', encoding='utf-8') as f:
        f.write(content)

    return HypothesisResponse(
        success=True,
        hypothesis_id=hypothesis_id,
        file_path=str(hyp_file.relative_to(VAULT_DIR)),
        message="Hypothesis created successfully"
    )


@router.put("/{hypothesis_id}", response_model=HypothesisResponse)
def update_hypothesis(hypothesis_id: str, hypothesis: HypothesisUpdate):
    """Hypothesis 수정"""
    hyp_file = find_hypothesis_file(hypothesis_id)
    if not hyp_file:
        raise HTTPException(status_code=404, detail=f"Hypothesis not found: {hypothesis_id}")

    # 파일 읽기
    try:
        with open(hyp_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Hypothesis not found: {hypothesis_id}")

    # Frontmatter 파싱
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', content, re.DOTALL)
    if not match:
        raise HTTPException(status_code=500, detail="Invalid frontmatter format")

    frontmatter = yaml.safe_load(match.group(1))
    body = match.group(2)

    # Validation
    if hypothesis.hypothesis_question is not None:
        if not hypothesis.hypothesis_question.strip().endswith('?'):
            raise HTTPException(
                status_code=400,
                detail="hypothesis_question must end with '?'"
            )
        frontmatter['hypothesis_question'] = hypothesis.hypothesis_question

    if hypothesis.horizon is not None:
        if not validate_horizon(hypothesis.horizon):
            raise HTTPException(
                status_code=400,
                detail="horizon must be a 4-digit year (e.g., 2026)"
            )
        frontmatter['horizon'] = hypothesis.horizon

    if hypothesis.evidence_status is not None:
        valid_statuses = ['planning', 'validating', 'validated', 'falsified', 'learning']
        if hypothesis.evidence_status not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"evidence_status must be one of: {valid_statuses}"
            )
        frontmatter['evidence_status'] = hypothesis.evidence_status
        frontmatter['status'] = hypothesis.evidence_status  # 동기화

    # 업데이트 가능한 필드들
    if hypothesis.entity_name is not None:
        frontmatter['entity_name'] = hypothesis.entity_name
    if hypothesis.success_criteria is not None:
        frontmatter['success_criteria'] = hypothesis.success_criteria
    if hypothesis.failure_criteria is not None:
        frontmatter['failure_criteria'] = hypothesis.failure_criteria
    if hypothesis.measurement is not None:
        frontmatter['measurement'] = hypothesis.measurement
    if hypothesis.loop_layer is not None:
        frontmatter['loop_layer'] = hypothesis.loop_layer
    if hypothesis.confidence is not None:
        frontmatter['confidence'] = hypothesis.confidence
    if hypothesis.deadline is not None:
        frontmatter['deadline'] = hypothesis.deadline
    if hypothesis.tags is not None:
        frontmatter['tags'] = hypothesis.tags

    frontmatter['updated'] = datetime.now().strftime("%Y-%m-%d")

    # 파일 다시 쓰기
    new_content = f"""---
{yaml.dump(frontmatter, allow_unicode=True, sort_keys=False, default_flow_style=False)}---
{body}"""

    with open(hyp_file, 'w', encoding='utf-8') as f:
        f.write(new_content)

    return HypothesisResponse(
        success=True,
        hypothesis_id=hypothesis_id,
        message="Hypothesis updated successfully"
    )


@router.delete("/{hypothesis_id}", response_model=HypothesisResponse)
def delete_hypothesis(hypothesis_id: str):
    """Hypothesis 삭제"""
    hyp_file = find_hypothesis_file(hypothesis_id)
    if not hyp_file:
        raise HTTPException(status_code=404, detail=f"Hypothesis not found: {hypothesis_id}")

    # 파일 삭제
    try:
        hyp_file.unlink()
    except FileNotFoundError:
        pass  # 이미 삭제됨

    return HypothesisResponse(
        success=True,
        hypothesis_id=hypothesis_id,
        message="Hypothesis deleted successfully"
    )