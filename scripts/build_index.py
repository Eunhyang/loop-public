#!/usr/bin/env python3
"""
LOOP Vault LLM Index Builder v1.0

LLM Auto-fill을 위한 문서 요약 인덱스를 생성합니다.
출력: _build/index.json

graph.json과의 차이:
- graph.json: 엔티티 관계 그래프 (노드, 에지)
- index.json: LLM Context용 문서 요약 (summary, metrics, weight)

Usage:
    python3 scripts/build_index.py .
"""

import os
import re
import sys
import json
import yaml
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime

# === 설정 ===
INCLUDE_PATHS = [
    "01_North_Star",
    "20_Strategy",
    "50_Projects",
]

# 문서 본문에서 요약 추출할 최대 길이
MAX_BODY_CHARS = 500

# Entity type별 요약 추출 전략
SUMMARY_STRATEGIES = {
    "NorthStar": ["vision", "description", "summary"],
    "MetaHypothesis": ["hypothesis", "description", "summary"],
    "Condition": ["definition", "description", "summary"],
    "Track": ["focus", "description", "summary"],
    "Project": ["description", "summary", "objective"],
    "Task": ["description", "summary"],
}


def extract_frontmatter(content: str) -> tuple[Optional[Dict], str]:
    """마크다운에서 YAML frontmatter와 본문 추출"""
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n?(.*)', content, re.DOTALL)
    if match:
        try:
            frontmatter = yaml.safe_load(match.group(1))
            body = match.group(2).strip()
            return frontmatter, body
        except yaml.YAMLError:
            return None, content
    return None, content


def extract_first_paragraph(body: str) -> str:
    """본문에서 첫 번째 의미있는 단락 추출 (메타데이터 블록 스킵)"""
    lines = body.split('\n')
    paragraph_lines = []
    skip_meta_block = True  # 처음 메타 블록(>, |, ---)은 스킵

    for line in lines:
        stripped = line.strip()

        # 빈 줄
        if not stripped:
            if paragraph_lines:
                break
            skip_meta_block = False  # 빈 줄 이후는 메타 블록이 아님
            continue

        # 헤더 스킵
        if stripped.startswith('#'):
            if paragraph_lines:
                break
            skip_meta_block = False
            continue

        # 메타데이터 블록 스킵 (>, |로 시작하는 줄, --- 구분선)
        if skip_meta_block:
            if stripped.startswith('>') or stripped.startswith('|') or stripped == '---':
                continue
            skip_meta_block = False

        # 코드 블록 스킵
        if stripped.startswith('```'):
            continue

        # 의미있는 텍스트 수집
        # 링크만 있는 줄 스킵 ([[...]] 형식)
        if re.match(r'^\[\[.*\]\]$', stripped):
            continue

        paragraph_lines.append(stripped)
        # 2~3줄이면 충분
        if len(paragraph_lines) >= 3:
            break

    result = ' '.join(paragraph_lines)
    if len(result) > MAX_BODY_CHARS:
        result = result[:MAX_BODY_CHARS] + "..."
    return result


def extract_section_content(body: str, section_names: List[str]) -> Optional[str]:
    """특정 섹션 헤더 아래의 내용 추출"""
    lines = body.split('\n')
    in_target_section = False
    section_lines = []

    for line in lines:
        stripped = line.strip()

        # 헤더 체크
        if stripped.startswith('#'):
            # 타겟 섹션 시작?
            header_text = stripped.lstrip('#').strip().lower()
            if any(name.lower() in header_text for name in section_names):
                in_target_section = True
                continue
            elif in_target_section:
                # 다른 섹션 시작 → 종료
                break

        if in_target_section and stripped:
            # 메타 블록 스킵
            if stripped.startswith('>') or stripped.startswith('|'):
                continue
            section_lines.append(stripped)
            if len(section_lines) >= 3:
                break

    if section_lines:
        result = ' '.join(section_lines)
        return result[:MAX_BODY_CHARS] if len(result) > MAX_BODY_CHARS else result
    return None


# Entity type별 섹션 추출 우선순위
SECTION_PRIORITIES = {
    "Project": ["개요", "목적", "설명", "overview", "description", "objective"],
    "Condition": ["정의", "definition", "설명", "description"],
    "Track": ["목표", "설명", "focus", "goal"],
    "NorthStar": ["비전", "vision", "설명"],
    "MetaHypothesis": ["가설", "hypothesis", "설명"],
}


def extract_summary(frontmatter: Dict, body: str, entity_type: str) -> str:
    """엔티티에서 요약 추출 (개선된 버전)"""
    # 1. frontmatter에서 summary/description 필드 찾기
    strategies = SUMMARY_STRATEGIES.get(entity_type, ["description", "summary"])

    for field in strategies:
        if field in frontmatter and frontmatter[field]:
            value = frontmatter[field]
            if isinstance(value, str) and len(value) > 10:  # 너무 짧은 값 스킵
                return value[:MAX_BODY_CHARS]
            elif isinstance(value, list) and value:
                return ' '.join(str(v) for v in value[:3])

    # 2. 특정 섹션에서 추출 시도
    section_names = SECTION_PRIORITIES.get(entity_type, [])
    if body and section_names:
        section_content = extract_section_content(body, section_names)
        if section_content and len(section_content) > 10:
            return section_content

    # 3. 본문에서 첫 의미있는 단락 추출
    if body:
        paragraph = extract_first_paragraph(body)
        if paragraph and len(paragraph) > 10:
            return paragraph

    # 4. entity_name 사용 (최후 수단)
    return frontmatter.get("entity_name", "")


def extract_metrics(frontmatter: Dict) -> List[Dict]:
    """엔티티에서 metrics 추출"""
    metrics = frontmatter.get("metrics", [])
    if not isinstance(metrics, list):
        return []

    result = []
    for m in metrics:
        if isinstance(m, dict):
            result.append({
                "name": m.get("name", ""),
                "threshold": m.get("threshold", ""),
                "current": m.get("current"),
                "status": m.get("status", ""),
            })
    return result


def extract_contributes(frontmatter: Dict) -> List[Dict]:
    """Project에서 contributes 추출"""
    contributes = frontmatter.get("contributes", [])
    if not isinstance(contributes, list):
        return []

    result = []
    for c in contributes:
        if isinstance(c, dict):
            result.append({
                "to": c.get("to", ""),
                "weight": c.get("weight", 0),
                "mechanism": c.get("mechanism", ""),
            })
    return result


def build_entity_record(entity_id: str, data: Dict, body: str) -> Dict:
    """단일 엔티티의 index 레코드 생성"""
    fm = data["frontmatter"]
    entity_type = fm.get("entity_type", "Unknown")

    record = {
        "id": entity_id,
        "type": entity_type,
        "name": fm.get("entity_name", ""),
        "path": data["relative_path"],
        "summary": extract_summary(fm, body, entity_type),
    }

    # 공통 필드
    if fm.get("status"):
        record["status"] = fm.get("status")
    if fm.get("priority_flag"):
        record["priority"] = fm.get("priority_flag")

    # Condition 전용
    if entity_type == "Condition":
        record["metrics"] = extract_metrics(fm)
        if fm.get("weight_to_northstar"):
            record["weight_to_northstar"] = fm.get("weight_to_northstar")
        if fm.get("if_broken"):
            record["if_broken"] = fm.get("if_broken")

    # Track 전용
    if entity_type == "Track":
        if fm.get("conditions_3y"):
            record["conditions"] = fm.get("conditions_3y")

    # Project 전용
    if entity_type == "Project":
        record["contributes"] = extract_contributes(fm)
        if fm.get("tier"):
            record["tier"] = fm.get("tier")
        if fm.get("impact_magnitude"):
            record["impact_magnitude"] = fm.get("impact_magnitude")
        if fm.get("confidence"):
            record["confidence"] = fm.get("confidence")
        if fm.get("track"):
            record["track"] = fm.get("track")
        if fm.get("owner"):
            record["owner"] = fm.get("owner")

    # NorthStar 전용
    if entity_type == "NorthStar":
        if fm.get("vision"):
            record["vision"] = fm.get("vision")[:200] if isinstance(fm.get("vision"), str) else ""

    return record


def collect_entities(vault_root: Path) -> Dict[str, tuple[Dict, str]]:
    """모든 엔티티 수집 (frontmatter + body)"""
    entities = {}

    for filepath in vault_root.rglob("*.md"):
        relative = str(filepath.relative_to(vault_root))

        # 포함 경로 체크
        should_include = any(relative.startswith(inc) for inc in INCLUDE_PATHS)
        if not should_include:
            continue

        # 템플릿 제외
        if "_TEMPLATES" in relative or "template" in relative.lower():
            continue

        try:
            content = filepath.read_text(encoding="utf-8")
        except Exception:
            continue

        frontmatter, body = extract_frontmatter(content)
        if frontmatter and "entity_id" in frontmatter:
            entity_id = frontmatter["entity_id"]
            entities[entity_id] = {
                "frontmatter": frontmatter,
                "relative_path": relative,
            }, body

    return entities


def build_type_index(records: List[Dict]) -> Dict[str, List[str]]:
    """타입별 entity_id 인덱스"""
    index = {}
    for record in records:
        entity_type = record.get("type", "Unknown")
        if entity_type not in index:
            index[entity_type] = []
        index[entity_type].append(record["id"])
    return index


def build_condition_index(records: List[Dict]) -> Dict[str, Dict]:
    """Condition별 상세 인덱스 (LLM Context용)"""
    index = {}

    for record in records:
        if record.get("type") == "Condition":
            cond_id = record["id"]
            index[cond_id] = {
                "name": record.get("name", ""),
                "summary": record.get("summary", ""),
                "metrics": record.get("metrics", []),
                "weight_to_northstar": record.get("weight_to_northstar"),
                "if_broken": record.get("if_broken"),
                "projects": [],  # 아래에서 채움
            }

    # Project의 contributes에서 Condition 연결
    for record in records:
        if record.get("type") == "Project":
            contributes = record.get("contributes", [])
            for c in contributes:
                cond_id = c.get("to", "")
                if cond_id in index:
                    index[cond_id]["projects"].append({
                        "id": record["id"],
                        "name": record.get("name", ""),
                        "weight": c.get("weight", 0),
                    })

    return index


def main(vault_path: str) -> int:
    """메인 함수"""
    vault_root = Path(vault_path).resolve()

    if not vault_root.exists():
        print(f"Error: Vault path does not exist: {vault_root}")
        return 1

    print("Collecting entities...")
    entities = collect_entities(vault_root)
    print(f"Found {len(entities)} entities")

    print("Building index records...")
    records = []
    for entity_id, (data, body) in entities.items():
        record = build_entity_record(entity_id, data, body)
        records.append(record)

    print("Building type index...")
    type_index = build_type_index(records)

    print("Building condition index...")
    condition_index = build_condition_index(records)

    # 최종 인덱스 구조
    index = {
        "generated": datetime.now().isoformat(),
        "version": "1.0.0",
        "total_entities": len(records),
        "records": records,
        "by_type": type_index,
        "conditions": condition_index,
    }

    # 저장
    build_dir = vault_root / "_build"
    build_dir.mkdir(exist_ok=True)

    index_path = build_dir / "index.json"
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index, f, indent=2, ensure_ascii=False)
    print(f"Saved: {index_path}")

    # 통계 출력
    print(f"\n=== Index Statistics ===")
    print(f"Total records: {len(records)}")
    for entity_type, ids in sorted(type_index.items()):
        print(f"  {entity_type}: {len(ids)}")
    print(f"Conditions indexed: {len(condition_index)}")

    return 0


if __name__ == "__main__":
    vault_path = sys.argv[1] if len(sys.argv) > 1 else "."
    sys.exit(main(vault_path))
