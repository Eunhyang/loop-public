"""
Hypothesis Generator Utilities

Hypothesis 생성, 검증, 파일 생성 유틸리티.

tsk-n8n-11: Hypothesis Seeder 워크플로우 API 개발

기능:
- generate_hypothesis_id: hyp-{track}-{seq} 형식 ID 생성
- validate_hypothesis_quality: 품질 점수 및 이슈 목록 반환
- assess_evidence_readiness: Evidence 운영 가능성 평가
- create_hypothesis_file: Hypothesis 파일 생성
- update_project_validates: Project.validates 업데이트
"""

import re
import yaml
from pathlib import Path
from datetime import date
from typing import Dict, Any, Optional, Tuple, List, Set

from .vault_utils import get_vault_dir, sanitize_filename


# ============================================
# 고객중심 가설 검증 토큰 (tsk-n8n-15)
# ============================================

CUSTOMER_TOKENS = {
    "segment": [
        "사용자", "고객", "코치", "참여자", "구독자", "회원", "수강생",
        "클라이언트", "이용자", "유저", "소비자", "학습자", "수험생",
        "환자", "내담자", "피코칭자", "졸업자", "신규"
    ],
    "trigger": [
        "할 때", "직후", "상황에서", "시점에", "경우에", "시에", "후에", "전에",
        "첫 주", "첫날", "처음", "시작", "도중에", "중간에", "마지막",
        "아침에", "저녁에", "밤에", "주말에", "평일에"
    ],
    "pain": [
        "어렵다", "못한다", "이탈", "재발", "스트레스", "포기", "실패",
        "힘들", "불편", "불안", "걱정", "부담", "지치", "피로",
        "감소", "하락", "떨어", "낮아", "줄어들"
    ],
    "change": [
        "증가", "감소", "개선", "전환", "복귀", "완료", "지속", "향상",
        "줄어", "높아", "늘어", "좋아", "나아", "달성", "성공",
        "유지", "강화", "확대", "상승"
    ]
}


def check_customer_centric(question: str) -> Tuple[bool, List[str], Set[str]]:
    """
    가설 질문이 고객 중심인지 휴리스틱으로 검증 (tsk-n8n-15)

    4개 카테고리 (segment, trigger, pain, change) 중
    최소 2개 카테고리의 토큰이 존재해야 고객중심으로 판정

    Args:
        question: hypothesis_question 문자열

    Returns:
        (is_customer_centric, found_categories, missing_categories)
    """
    found_categories = []

    for category, tokens in CUSTOMER_TOKENS.items():
        for token in tokens:
            if token in question:
                found_categories.append(category)
                break  # 카테고리당 하나만 카운트

    # 최소 2개 카테고리 필요
    is_customer_centric = len(found_categories) >= 2
    missing_categories = set(CUSTOMER_TOKENS.keys()) - set(found_categories)

    return is_customer_centric, found_categories, missing_categories


def extract_track_number(track_id: str) -> Optional[int]:
    """
    Track ID에서 숫자 추출

    Args:
        track_id: Track ID (예: "trk-1", "trk-2")

    Returns:
        Track 번호 (int) 또는 None
    """
    if not track_id:
        return None

    match = re.match(r'trk-(\d+)', track_id)
    if match:
        return int(match.group(1))
    return None


def generate_hypothesis_id(track_id: str, vault_path: Optional[Path] = None) -> str:
    """
    Hypothesis ID 생성

    형식: hyp-{track_number}-{seq:02d}
    예: hyp-3-01, hyp-3-02

    VaultCache의 get_next_hypothesis_id() 사용 (스레드 안전, 디스크 폴백 포함)

    Args:
        track_id: Track ID (예: "trk-3")
        vault_path: Vault 경로 (기본값: 자동 감지)

    Returns:
        새 Hypothesis ID

    Raises:
        ValueError: Track ID가 유효하지 않은 경우
    """
    track_num = extract_track_number(track_id)
    if track_num is None:
        raise ValueError(f"Invalid track_id format: {track_id}. Expected trk-N pattern.")

    # VaultCache 사용 (스레드 안전, 디스크 폴백 포함)
    from ..cache import get_cache
    cache = get_cache()
    return cache.get_next_hypothesis_id(track_num)


def validate_hypothesis_quality(draft: Dict[str, Any]) -> Tuple[float, List[str]]:
    """
    Hypothesis draft 품질 검증

    검증 항목:
    - entity_name: 존재하고 비어있지 않은지
    - hypothesis_question: ?로 끝나는 질문 형태인지
    - success_criteria: 존재하고 10자 이상인지
    - failure_criteria: 존재하고 10자 이상인지
    - measurement: 존재하고 10자 이상인지
    - confidence: 0.0-1.0 범위인지
    - horizon: 4자리 연도 형식인지

    Args:
        draft: Hypothesis draft 딕셔너리

    Returns:
        (quality_score, issues): 품질 점수 (0.0-1.0)와 이슈 목록
    """
    issues = []
    score = 1.0
    deduction = 0.15  # 각 이슈당 감점

    # 1. entity_name 검증
    entity_name = draft.get("entity_name", "")
    if not entity_name or not entity_name.strip():
        issues.append("missing_entity_name")
        score -= deduction

    # 2. hypothesis_question 검증
    question = draft.get("hypothesis_question", "")
    if not question or not question.strip():
        issues.append("missing_hypothesis_question")
        score -= deduction * 2  # 핵심 필드
    elif not question.strip().endswith("?"):
        issues.append("hypothesis_question_not_question_form")
        score -= deduction

    # 3. success_criteria 검증
    success = draft.get("success_criteria", "")
    if not success:
        issues.append("missing_success_criteria")
        score -= deduction
    elif len(success.strip()) < 10:
        issues.append("weak_success_criteria")
        score -= deduction * 0.5

    # 4. failure_criteria 검증
    failure = draft.get("failure_criteria", "")
    if not failure:
        issues.append("missing_failure_criteria")
        score -= deduction
    elif len(failure.strip()) < 10:
        issues.append("weak_failure_criteria")
        score -= deduction * 0.5

    # 5. measurement 검증
    measurement = draft.get("measurement", "")
    if not measurement:
        issues.append("missing_measurement")
        score -= deduction
    elif len(measurement.strip()) < 10:
        issues.append("weak_measurement")
        score -= deduction * 0.5

    # 6. confidence 검증
    confidence = draft.get("confidence")
    if confidence is None:
        issues.append("missing_confidence")
        score -= deduction * 0.5
    elif not isinstance(confidence, (int, float)):
        issues.append("invalid_confidence_type")
        score -= deduction
    elif not (0.0 <= float(confidence) <= 1.0):
        issues.append("confidence_out_of_range")
        score -= deduction

    # 7. horizon 검증
    horizon = draft.get("horizon", "")
    if not horizon:
        issues.append("missing_horizon")
        score -= deduction * 0.5
    else:
        # 4자리 연도 형식 검증
        horizon_str = str(horizon)
        if not re.match(r'^\d{4}$', horizon_str):
            issues.append("invalid_horizon_format")
            score -= deduction
        else:
            year = int(horizon_str)
            if year < 2024 or year > 2030:
                issues.append("horizon_year_out_of_range")
                score -= deduction * 0.5

    # 8. 고객중심 검증 (tsk-n8n-15)
    question = draft.get("hypothesis_question", "")
    if question:
        is_customer_centric, found_categories, missing_categories = check_customer_centric(question)

        if not is_customer_centric:
            issues.append("not_customer_centric")
            score -= 0.25  # 중요 감점

            # 디버깅용: 어떤 카테고리가 부족한지
            if missing_categories:
                missing_str = ",".join(sorted(missing_categories))
                issues.append(f"missing_customer_elements:{missing_str}")

    # 점수 범위 제한
    score = max(0.0, min(1.0, score))

    return (round(score, 2), issues)


def assess_evidence_readiness(draft: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evidence 운영 가능성 평가

    Hypothesis가 검증되었을 때 B Score 계산이 가능한지 평가합니다.

    Args:
        draft: Hypothesis draft 딕셔너리

    Returns:
        Evidence 운영 가능성 정보
    """
    # LLM이 제안한 evidence_readiness 사용 (있으면)
    evidence_readiness = draft.get("evidence_readiness", {})

    if evidence_readiness:
        return {
            "is_ready": True,
            "normalized_delta_method": evidence_readiness.get("normalized_delta_method"),
            "suggested_sample_size": evidence_readiness.get("suggested_sample_size"),
            "counterfactual_type": evidence_readiness.get("counterfactual_type", "none"),
            "confounders": evidence_readiness.get("confounders", [])
        }

    # LLM 제안이 없으면 measurement 기반으로 기본값 생성
    measurement = draft.get("measurement", "")

    # counterfactual 유형 추정
    counterfactual = "none"
    if "before" in measurement.lower() and "after" in measurement.lower():
        counterfactual = "before_after"
    elif "control" in measurement.lower() or "대조군" in measurement:
        counterfactual = "controlled"
    elif "비교" in measurement or "차이" in measurement:
        counterfactual = "before_after"

    return {
        "is_ready": bool(measurement),
        "normalized_delta_method": "목표 대비 달성률 계산" if measurement else None,
        "suggested_sample_size": 30,  # 기본값
        "counterfactual_type": counterfactual,
        "confounders": [],
        "needs_refinement": True
    }


def create_hypothesis_file(
    draft: Dict[str, Any],
    hypothesis_id: str,
    parent_id: str,
    vault_path: Optional[Path] = None
) -> Tuple[Path, str]:
    """
    Hypothesis 파일 생성

    경로: 60_Hypotheses/{horizon}/hyp-{track}-{seq}_{sanitized_name}.md

    Args:
        draft: Hypothesis draft 딕셔너리
        hypothesis_id: 생성된 Hypothesis ID
        parent_id: Track ID (parent_id)
        vault_path: Vault 경로

    Returns:
        (file_path, content): 생성된 파일 경로와 내용

    Raises:
        FileExistsError: 동일 ID의 파일이 이미 존재하는 경우
        ValueError: horizon이 유효하지 않은 경우
    """
    if vault_path is None:
        vault_path = get_vault_dir()

    # Horizon 검증
    horizon = draft.get("horizon", "")
    if not horizon or not re.match(r'^\d{4}$', str(horizon)):
        raise ValueError(f"Invalid horizon format: {horizon}. Expected 4-digit year.")

    # 디렉토리 생성
    horizon_dir = vault_path / "60_Hypotheses" / str(horizon)
    horizon_dir.mkdir(parents=True, exist_ok=True)

    # 파일명 생성
    entity_name = draft.get("entity_name", "Unnamed")
    safe_name = sanitize_filename(entity_name)
    filename = f"{hypothesis_id}_{safe_name}.md"
    file_path = horizon_dir / filename

    # 기존 파일 존재 체크
    if file_path.exists():
        raise FileExistsError(f"Hypothesis file already exists: {file_path}")

    # Frontmatter 생성
    today = date.today().isoformat()

    frontmatter = {
        "entity_type": "Hypothesis",
        "entity_id": hypothesis_id,
        "entity_name": draft.get("entity_name", ""),
        "created": today,
        "updated": today,
        "evidence_status": "assumed",

        # 계층
        "parent_id": parent_id,
        "aliases": [hypothesis_id],

        # Hypothesis 전용 필드
        "hypothesis_question": draft.get("hypothesis_question", ""),
        "success_criteria": draft.get("success_criteria", ""),
        "failure_criteria": draft.get("failure_criteria", ""),
        "measurement": draft.get("measurement", ""),
        "confidence": draft.get("confidence", 0.7),
        "horizon": str(horizon),

        # 분류
        "tags": ["hypothesis", "auto-generated"],
    }

    # 본문 생성
    body = f"""# {draft.get('entity_name', 'Hypothesis')}

> Hypothesis ID: `{hypothesis_id}` | Track: `{parent_id}` | Status: assumed

## 가설 질문

{draft.get('hypothesis_question', '')}

## 성공 기준

{draft.get('success_criteria', '')}

## 실패 기준

{draft.get('failure_criteria', '')}

## 측정 방법

{draft.get('measurement', '')}

---

## Evidence 운영 준비

### normalized_delta 계산 방법
{draft.get('evidence_readiness', {}).get('normalized_delta_method', '정의 필요')}

### 표본 크기
{draft.get('evidence_readiness', {}).get('suggested_sample_size', 'TBD')}

### Counterfactual 유형
{draft.get('evidence_readiness', {}).get('counterfactual_type', 'none')}

### 교란 변수
{', '.join(draft.get('evidence_readiness', {}).get('confounders', [])) or '미식별'}

---

## 생성 근거

{draft.get('reasoning', {}).get('hypothesis_derivation', '')}

---

**Created**: {today}
**Auto-generated by**: Hypothesis Seeder API
"""

    # 파일 저장
    content = "---\n" + yaml.dump(
        frontmatter,
        allow_unicode=True,
        default_flow_style=False,
        sort_keys=False
    ) + "---\n\n" + body

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    # 캐시 업데이트
    from ..cache import get_cache
    cache = get_cache()
    cache.set_hypothesis(hypothesis_id, frontmatter, file_path)

    return (file_path, content)


def update_project_validates(
    project_id: str,
    hypothesis_id: str,
    vault_path: Optional[Path] = None,
    set_as_primary: bool = False
) -> bool:
    """
    Project의 validates 필드에 Hypothesis ID 추가

    Args:
        project_id: Project ID
        hypothesis_id: 추가할 Hypothesis ID
        vault_path: Vault 경로
        set_as_primary: primary_hypothesis_id로도 설정할지 여부

    Returns:
        성공 여부
    """
    if vault_path is None:
        vault_path = get_vault_dir()

    # 캐시에서 Project 조회
    from ..cache import get_cache
    cache = get_cache()
    project = cache.get_project(project_id)

    if not project:
        return False

    # 파일 경로 가져오기
    project_dir = cache.get_project_dir(project_id)
    if not project_dir:
        return False

    # Project 파일 찾기
    project_file = None
    for pattern in ["project.md", "Project_정의.md", "*.md"]:
        files = list(project_dir.glob(pattern))
        for f in files:
            if f.name.startswith("_") or "Tasks" in str(f):
                continue
            project_file = f
            break
        if project_file:
            break

    if not project_file:
        return False

    # 파일 읽기
    with open(project_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Frontmatter 파싱
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', content, re.DOTALL)
    if not match:
        return False

    frontmatter = yaml.safe_load(match.group(1))
    body = match.group(2)

    # validates 업데이트
    validates = frontmatter.get("validates", [])
    if validates is None:
        validates = []

    # 중복 체크
    if hypothesis_id not in validates:
        validates.append(hypothesis_id)
        frontmatter["validates"] = validates

    # primary_hypothesis_id 설정 (요청 시 또는 첫 번째 가설인 경우)
    if set_as_primary or not frontmatter.get("primary_hypothesis_id"):
        frontmatter["primary_hypothesis_id"] = hypothesis_id

    # updated 필드 갱신
    frontmatter["updated"] = date.today().isoformat()

    # 파일 저장
    new_content = "---\n" + yaml.dump(
        frontmatter,
        allow_unicode=True,
        default_flow_style=False,
        sort_keys=False
    ) + "---\n" + body

    with open(project_file, 'w', encoding='utf-8') as f:
        f.write(new_content)

    # 캐시 업데이트
    frontmatter['_path'] = str(project_file.relative_to(vault_path))
    frontmatter['_dir'] = str(project_file.parent.relative_to(vault_path))
    cache.set_project(project_id, frontmatter, project_file)

    return True


def build_hypothesis_draft(
    llm_response: Dict[str, Any],
    project: Dict[str, Any],
    hypothesis_id: str
) -> Dict[str, Any]:
    """
    LLM 응답을 Hypothesis draft로 구성

    Args:
        llm_response: LLM 응답 딕셔너리
        project: Project 정보
        hypothesis_id: 생성된 Hypothesis ID

    Returns:
        완성된 Hypothesis draft
    """
    parent_id = project.get("parent_id", "")

    # 기본 draft 구성
    draft = {
        "entity_id": hypothesis_id,
        "entity_type": "Hypothesis",
        "entity_name": llm_response.get("entity_name", ""),
        "parent_id": parent_id,
        "hypothesis_question": llm_response.get("hypothesis_question", ""),
        "success_criteria": llm_response.get("success_criteria", ""),
        "failure_criteria": llm_response.get("failure_criteria", ""),
        "measurement": llm_response.get("measurement", ""),
        "confidence": llm_response.get("confidence", 0.7),
        "horizon": llm_response.get("horizon", "2026"),
        "evidence_status": "assumed",
        "reasoning": llm_response.get("reasoning", {}),
        "evidence_readiness": llm_response.get("evidence_readiness", {})
    }

    return draft
