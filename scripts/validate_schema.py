#!/usr/bin/env python3
"""
LOOP Vault Schema Validator v5.0
모든 마크다운 파일의 frontmatter를 검증합니다.

변경사항 (v5.0):
- Hypothesis: hypothesis_question, success_criteria, failure_criteria 필수
- Hypothesis: hypothesis_question은 "?"로 끝나야 함
- Project: expected_impact (statement, metric, target) 필수
- Project: realized_impact - status=done|failed일 때 필수
- Task: validates 관계 금지 (역할 분리)

변경사항 (v4.0):
- conditions_3y 필드 검증 추가 (Task, Project, Track 필수)
- VALID_CONDITION_IDS 상수 추가
"""

import os
import re
import sys
import yaml
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# === 설정 ===
INCLUDE_PATHS = [
    "01_North_Star",
    "20_Strategy",
    "50_Projects",
    "60_Hypotheses",
    "70_Experiments",
]

EXCLUDE_PATHS = [
    "00_Meta/_TEMPLATES",
    "10_Study",
    "30_Ontology",
    "40_LOOP_OS",
    "90_Archive",
    "00_Inbox",
]

EXCLUDE_FILES = [
    "_INDEX.md",
    "_ENTRY_POINT.md",
    "CLAUDE.md",
    "README.md",
    "_HOME.md",
    "_Graph_Index.md",
]

# === ID 패턴 ===
ID_PATTERNS = {
    "ns": r"^ns:\d{3}$",
    "mh": r"^mh:[1-4]$",
    "cond": r"^cond:[a-e]$",
    "trk": r"^trk:[1-6]$",
    "prj": r"^prj:\d{3}$",
    "tsk": r"^tsk:\d{3}-\d{2}$",
    "hyp": r"^hyp:[1-6]-\d{2}$",  # Track기반: hyp:1-01, hyp:6-14
    "exp": r"^exp:\d{3}$",
    "pl": r"^pl:[1-9]$",          # ProductLine: pl:1 ~ pl:9
    "ps": r"^ps:[1-9]$",          # PartnershipStage: ps:1 ~ ps:9
}

# === 필수 필드 ===
REQUIRED_FIELDS = {
    "all": ["entity_type", "entity_id", "entity_name", "created", "updated", "status"],
    "NorthStar": [],
    "MetaHypothesis": ["if_broken"],
    "Condition": ["if_broken"],
    "Track": ["owner", "horizon", "conditions_3y"],
    "Project": ["owner", "parent_id", "conditions_3y", "expected_impact"],
    "Task": ["assignee", "project_id", "parent_id", "conditions_3y"],
    # Hypothesis: hypothesis_question OR hypothesis_text (마이그레이션 기간)
    "Hypothesis": [],  # 별도 함수에서 검증
    "Experiment": ["hypothesis_id", "metrics"],
}

# === 마이그레이션 모드 ===
# True: hypothesis_text도 허용 (레거시)
# False: hypothesis_question만 허용 (마이그레이션 완료 후)
ALLOW_LEGACY_HYPOTHESIS = True

# === 유효한 Condition IDs ===
VALID_CONDITION_IDS = ["cond:a", "cond:b", "cond:c", "cond:d", "cond:e"]

# === 유효한 상태값 ===
VALID_STATUSES = ["planning", "active", "blocked", "done", "failed", "learning", "fixed", "assumed", "validating", "validated", "falsified", "in_progress", "pending", "completed"]


def extract_frontmatter(content: str) -> Optional[Dict]:
    """마크다운에서 YAML frontmatter 추출"""
    match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if match:
        try:
            return yaml.safe_load(match.group(1))
        except yaml.YAMLError as e:
            return {"_parse_error": str(e)}
    return None


def validate_id_format(entity_id: str) -> Tuple[bool, str]:
    """ID 형식 검증"""
    if not entity_id or ":" not in entity_id:
        return False, "ID must be in format {type}:{number}"

    prefix = entity_id.split(":")[0]
    pattern = ID_PATTERNS.get(prefix)

    if not pattern:
        return False, f"Unknown ID prefix: {prefix}"

    if not re.match(pattern, entity_id):
        return False, f"ID '{entity_id}' doesn't match pattern '{pattern}'"

    return True, ""


def validate_conditions_3y(frontmatter: Dict, entity_type: str) -> List[str]:
    """conditions_3y 필드 검증"""
    errors = []

    # Task, Project, Track만 필수
    if entity_type not in ["Task", "Project", "Track"]:
        return errors

    conditions = frontmatter.get("conditions_3y")

    # 필수 체크
    if conditions is None:
        errors.append("conditions_3y field is required")
        return errors

    # 리스트 타입 체크
    if not isinstance(conditions, list):
        errors.append("conditions_3y must be a list")
        return errors

    # 최소 1개 필수
    if len(conditions) == 0:
        errors.append("conditions_3y must have at least 1 condition")
        return errors

    # 각 항목이 유효한 cond:* ID인지 체크
    for cond in conditions:
        if not isinstance(cond, str):
            errors.append(f"conditions_3y items must be strings, got: {type(cond)}")
        elif not cond.startswith("cond:"):
            errors.append(f"conditions_3y must reference cond:* IDs, got: {cond}")
        elif cond not in VALID_CONDITION_IDS:
            errors.append(f"conditions_3y contains invalid condition: {cond} (valid: {VALID_CONDITION_IDS})")

    return errors


def validate_hypothesis(frontmatter: Dict) -> List[str]:
    """Hypothesis 엔티티 검증 (v3.3 스키마)"""
    errors = []

    has_question = frontmatter.get("hypothesis_question")
    has_text = frontmatter.get("hypothesis_text")

    # 최소 하나는 있어야 함
    if not has_question and not has_text:
        errors.append("Hypothesis must have hypothesis_question (or hypothesis_text for legacy)")
        return errors

    # hypothesis_question 우선 검증
    if has_question:
        # "?"로 끝나야 함
        if not str(has_question).strip().endswith("?"):
            errors.append("hypothesis_question must end with '?' (질문 형태 강제)")

        # success_criteria 필수
        if not frontmatter.get("success_criteria"):
            errors.append("Hypothesis requires success_criteria")

        # failure_criteria 필수
        if not frontmatter.get("failure_criteria"):
            errors.append("Hypothesis requires failure_criteria")

    elif has_text and not ALLOW_LEGACY_HYPOTHESIS:
        # 마이그레이션 기간 종료 후
        errors.append("hypothesis_text is deprecated. Use hypothesis_question instead.")

    return errors


def validate_project_impact(frontmatter: Dict) -> List[str]:
    """Project expected_impact/realized_impact 검증 (v3.3 스키마)"""
    errors = []
    status = frontmatter.get("status")

    # expected_impact 필수
    expected = frontmatter.get("expected_impact")
    if expected is None:
        errors.append("Project requires expected_impact (statement, metric, target)")
    elif isinstance(expected, dict):
        for field in ["statement", "metric", "target"]:
            if not expected.get(field):
                errors.append(f"expected_impact.{field} is required")
    else:
        errors.append("expected_impact must be an object with statement, metric, target")

    # realized_impact: status=done|failed일 때 필수
    if status in ["done", "failed"]:
        realized = frontmatter.get("realized_impact")
        if realized is None:
            errors.append(f"Project with status='{status}' requires realized_impact")
        elif isinstance(realized, dict):
            if not realized.get("outcome"):
                errors.append("realized_impact.outcome is required (supported|rejected|inconclusive)")
        else:
            errors.append("realized_impact must be an object")

    return errors


def validate_task_no_validates(frontmatter: Dict) -> List[str]:
    """Task는 validates 관계를 가질 수 없음 (역할 분리)"""
    errors = []

    validates = frontmatter.get("validates")
    if validates and len(validates) > 0:
        errors.append("Task cannot have 'validates' relation (역할 분리: Task는 전략 판단에 개입하지 않음)")

    return errors


def validate_file(filepath: Path, frontmatter: Dict) -> List[str]:
    """단일 파일 검증"""
    errors = []

    # 파싱 오류 체크
    if "_parse_error" in frontmatter:
        errors.append(f"YAML parse error: {frontmatter['_parse_error']}")
        return errors

    # 필수 필드 체크 (공통)
    for field in REQUIRED_FIELDS["all"]:
        if field not in frontmatter:
            errors.append(f"Missing required field: {field}")

    # entity_type 체크
    entity_type = frontmatter.get("entity_type")
    if not entity_type:
        errors.append("Missing entity_type")
        return errors

    # 엔티티별 필수 필드 체크
    type_required = REQUIRED_FIELDS.get(entity_type, [])
    for field in type_required:
        if field not in frontmatter or frontmatter[field] is None:
            errors.append(f"Missing required field for {entity_type}: {field}")

    # ID 형식 체크
    entity_id = frontmatter.get("entity_id")
    if entity_id:
        valid, msg = validate_id_format(entity_id)
        if not valid:
            errors.append(msg)

    # status 값 체크
    status = frontmatter.get("status")
    if status and status not in VALID_STATUSES:
        errors.append(f"Invalid status: {status}")

    # parent_id 형식 체크 (있는 경우)
    parent_id = frontmatter.get("parent_id")
    if parent_id:
        valid, msg = validate_id_format(parent_id)
        if not valid:
            errors.append(f"Invalid parent_id: {msg}")

    # validates/validated_by 형식 체크
    for field in ["validates", "validated_by"]:
        values = frontmatter.get(field, [])
        if values:
            if not isinstance(values, list):
                errors.append(f"{field} must be a list")
            else:
                for v in values:
                    if not isinstance(v, str):
                        errors.append(f"{field} must contain only strings, got: {type(v)}")

    # conditions_3y 검증 (Task, Project, Track)
    conditions_errors = validate_conditions_3y(frontmatter, entity_type)
    errors.extend(conditions_errors)

    # === v3.3 스키마 검증 ===

    # Hypothesis 검증
    if entity_type == "Hypothesis":
        hypothesis_errors = validate_hypothesis(frontmatter)
        errors.extend(hypothesis_errors)

    # Project expected_impact/realized_impact 검증
    if entity_type == "Project":
        impact_errors = validate_project_impact(frontmatter)
        errors.extend(impact_errors)

    # Task validates 금지
    if entity_type == "Task":
        task_errors = validate_task_no_validates(frontmatter)
        errors.extend(task_errors)

    return errors


def should_validate(filepath: Path, vault_root: Path) -> bool:
    """파일을 검증해야 하는지 확인"""
    relative = filepath.relative_to(vault_root)

    # 제외 파일 체크
    if filepath.name in EXCLUDE_FILES:
        return False

    # 제외 경로 체크
    for exclude in EXCLUDE_PATHS:
        if str(relative).startswith(exclude):
            return False

    # 포함 경로 체크
    for include in INCLUDE_PATHS:
        if str(relative).startswith(include):
            return True

    return False


def main(vault_path: str) -> int:
    """메인 검증 함수"""
    vault_root = Path(vault_path).resolve()

    if not vault_root.exists():
        print(f"Error: Vault path does not exist: {vault_root}")
        return 1

    errors_found = []
    files_checked = 0

    for filepath in vault_root.rglob("*.md"):
        if not should_validate(filepath, vault_root):
            continue

        files_checked += 1

        try:
            content = filepath.read_text(encoding="utf-8")
        except Exception as e:
            errors_found.append((filepath, [f"Read error: {e}"]))
            continue

        frontmatter = extract_frontmatter(content)
        if frontmatter is None:
            # frontmatter 없는 파일은 스킵
            continue

        errors = validate_file(filepath, frontmatter)
        if errors:
            errors_found.append((filepath, errors))

    # 결과 출력
    print(f"\n=== Schema Validation Report ===")
    print(f"Files checked: {files_checked}")
    print(f"Files with errors: {len(errors_found)}")

    if errors_found:
        print(f"\n--- Errors ---")
        for filepath, errors in errors_found:
            print(f"\n{filepath.relative_to(vault_root)}:")
            for error in errors:
                print(f"  - {error}")
        return 1

    print("\nAll files passed validation!")
    return 0


if __name__ == "__main__":
    vault_path = sys.argv[1] if len(sys.argv) > 1 else "."
    sys.exit(main(vault_path))
