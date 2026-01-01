"""
Hypothesis API Router

Hypothesis CRUD 엔드포인트 (캐시 기반)
- GET /api/hypotheses - 목록 조회
- GET /api/hypotheses/{hypothesis_id} - 개별 조회
- POST /api/hypotheses - 생성 (auto_validate 옵션 지원)
- PUT /api/hypotheses/{hypothesis_id} - 수정
- DELETE /api/hypotheses/{hypothesis_id} - 삭제

v5.3 검증 체크리스트:
A. 구조 검증: ID 패턴, parent_id, horizon
B. 품질 검증: hypothesis_question, success/failure_criteria, measurement
C. Evidence 운영 가능성: normalized_delta, sample_size, counterfactual
D. Project 연결: validates 연결
"""

import re
import yaml
from pathlib import Path
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException

from ..cache import get_cache
from ..constants import HYPOTHESIS_EVIDENCE_STATUS
from ..models.entities import HypothesisCreate, HypothesisUpdate, HypothesisResponse, ValidationResult
from ..utils.vault_utils import (
    get_vault_dir,
    validate_track_exists,
    validate_horizon,
    sanitize_filename
)
from .ai import _validate_hypothesis_schema_internal
from .audit import log_entity_action

router = APIRouter(prefix="/api/hypotheses", tags=["hypotheses"])

# Vault 경로
VAULT_DIR = get_vault_dir()
HYPOTHESES_DIR = VAULT_DIR / "60_Hypotheses"


@router.get("")
def get_hypotheses(
    parent_id: Optional[str] = None,
    evidence_status: Optional[str] = None,
    horizon: Optional[str] = None
):
    """
    Hypothesis 목록 조회 (캐시 기반)

    Query Parameters:
        parent_id: Track ID로 필터 (예: trk-1)
        evidence_status: 상태로 필터 (schema_constants.yaml 참조)
        horizon: 검증 목표 연도로 필터 (예: 2026)
    """
    cache = get_cache()
    hypotheses = cache.get_all_hypotheses(
        parent_id=parent_id,
        evidence_status=evidence_status,
        horizon=horizon
    )

    return {"hypotheses": hypotheses}


@router.get("/{hypothesis_id}")
def get_hypothesis(hypothesis_id: str):
    """개별 Hypothesis 상세 조회 (body 포함)"""
    cache = get_cache()

    # 캐시에서 경로 조회
    hyp_file = cache.get_hypothesis_path(hypothesis_id)
    if not hyp_file:
        raise HTTPException(status_code=404, detail=f"Hypothesis not found: {hypothesis_id}")

    try:
        with open(hyp_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        # 캐시 무효화
        cache.remove_hypothesis(hypothesis_id)
        raise HTTPException(status_code=404, detail=f"Hypothesis not found: {hypothesis_id}")

    # Frontmatter와 Body 분리
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n?(.*)$', content, re.DOTALL)
    if not match:
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
    cache = get_cache()

    # 1. Validation
    if not hypothesis.hypothesis_question.strip().endswith('?'):
        raise HTTPException(
            status_code=400,
            detail="hypothesis_question must end with '?'"
        )

    parent_match = re.match(r'^trk-(\d+)$', hypothesis.parent_id)
    if not parent_match:
        raise HTTPException(
            status_code=400,
            detail="parent_id must be in format 'trk-N' (e.g., trk-1)"
        )

    track_num = int(parent_match.group(1))

    if not validate_track_exists(VAULT_DIR, hypothesis.parent_id):
        raise HTTPException(
            status_code=400,
            detail=f"Track not found: {hypothesis.parent_id}"
        )

    if not validate_horizon(hypothesis.horizon):
        raise HTTPException(
            status_code=400,
            detail="horizon must be a 4-digit year (e.g., 2026)"
        )

    # SSOT: schema_constants.yaml → api/constants.py
    if hypothesis.evidence_status not in HYPOTHESIS_EVIDENCE_STATUS:
        raise HTTPException(
            status_code=400,
            detail=f"evidence_status must be one of: {HYPOTHESIS_EVIDENCE_STATUS}"
        )

    # 2. Hypothesis ID 생성 (캐시 기반 + 디스크 폴백)
    hypothesis_id = cache.get_next_hypothesis_id(track_num)

    # 3. 파일 경로 결정
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
        "status": hypothesis.evidence_status,

        "parent_id": hypothesis.parent_id,
        "aliases": [hypothesis_id, sanitize_filename(hypothesis.entity_name)],

        "hypothesis_question": hypothesis.hypothesis_question,
        "success_criteria": hypothesis.success_criteria,
        "failure_criteria": hypothesis.failure_criteria,
        "measurement": hypothesis.measurement,

        "horizon": hypothesis.horizon,
        "deadline": hypothesis.deadline,

        "evidence_status": hypothesis.evidence_status,
        "confidence": hypothesis.confidence,

        "loop_layer": hypothesis.loop_layer if hypothesis.loop_layer else [],
        "tags": hypothesis.tags if hypothesis.tags else [],

        "validates": [],
        "validated_by": [],
    }

    # 5. 파일 생성 (file-first: 파일 먼저 쓰고 캐시 업데이트)
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

    # 6. 캐시 업데이트 (파일 쓰기 성공 후)
    cache.set_hypothesis(hypothesis_id, frontmatter, hyp_file)

    return HypothesisResponse(
        success=True,
        hypothesis_id=hypothesis_id,
        file_path=str(hyp_file.relative_to(VAULT_DIR)),
        message="Hypothesis created successfully"
    )


@router.put("/{hypothesis_id}", response_model=HypothesisResponse)
def update_hypothesis(hypothesis_id: str, hypothesis: HypothesisUpdate):
    """Hypothesis 수정"""
    cache = get_cache()

    # 캐시에서 경로 조회
    hyp_file = cache.get_hypothesis_path(hypothesis_id)
    if not hyp_file:
        raise HTTPException(status_code=404, detail=f"Hypothesis not found: {hypothesis_id}")

    # 파일 읽기
    try:
        with open(hyp_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        cache.remove_hypothesis(hypothesis_id)
        raise HTTPException(status_code=404, detail=f"Hypothesis not found: {hypothesis_id}")

    # Frontmatter 파싱
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', content, re.DOTALL)
    if not match:
        raise HTTPException(status_code=500, detail="Invalid frontmatter format")

    frontmatter = yaml.safe_load(match.group(1))
    body = match.group(2)

    # Validation 및 업데이트
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
        # SSOT: schema_constants.yaml → api/constants.py
        if hypothesis.evidence_status not in HYPOTHESIS_EVIDENCE_STATUS:
            raise HTTPException(
                status_code=400,
                detail=f"evidence_status must be one of: {HYPOTHESIS_EVIDENCE_STATUS}"
            )
        frontmatter['evidence_status'] = hypothesis.evidence_status
        frontmatter['status'] = hypothesis.evidence_status

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

    # 파일 다시 쓰기 (file-first)
    new_content = f"""---
{yaml.dump(frontmatter, allow_unicode=True, sort_keys=False, default_flow_style=False)}---
{body}"""

    with open(hyp_file, 'w', encoding='utf-8') as f:
        f.write(new_content)

    # 캐시 업데이트 (파일 쓰기 성공 후)
    cache.set_hypothesis(hypothesis_id, frontmatter, hyp_file)

    return HypothesisResponse(
        success=True,
        hypothesis_id=hypothesis_id,
        message="Hypothesis updated successfully"
    )


@router.delete("/{hypothesis_id}", response_model=HypothesisResponse)
def delete_hypothesis(hypothesis_id: str):
    """Hypothesis 삭제"""
    cache = get_cache()

    # 캐시에서 경로 조회
    hyp_file = cache.get_hypothesis_path(hypothesis_id)
    if not hyp_file:
        raise HTTPException(status_code=404, detail=f"Hypothesis not found: {hypothesis_id}")

    # 파일 삭제 (file-first)
    try:
        hyp_file.unlink()
    except FileNotFoundError:
        pass  # 이미 삭제됨

    # 캐시에서 제거 (파일 삭제 성공 후)
    cache.remove_hypothesis(hypothesis_id)

    return HypothesisResponse(
        success=True,
        hypothesis_id=hypothesis_id,
        message="Hypothesis deleted successfully"
    )
