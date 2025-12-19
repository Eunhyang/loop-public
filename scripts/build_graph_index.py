#!/usr/bin/env python3
"""
LOOP Vault Graph Index Builder v4.0
_Graph_Index.md와 _build/graph.json을 자동 생성합니다.

변경사항 (v4.0):
- graph.json 생성 추가 (LLM 최적화된 JSON 형식)
- conditions_3y_index 추가 (Condition별 엔티티 매핑)
"""

import os
import re
import sys
import json
import yaml
from pathlib import Path
from typing import Dict, List, Optional, Set
from datetime import datetime
from collections import defaultdict

# === 설정 ===
INCLUDE_PATHS = [
    "01_North_Star",
    "20_Strategy",
    "50_Projects",
    "60_Hypotheses",
    "70_Experiments",
]

ENTITY_ORDER = [
    "NorthStar",
    "MetaHypothesis",
    "Condition",
    "Track",
    "Project",
    "Task",
    "Hypothesis",
    "Experiment",
]


def extract_frontmatter(content: str) -> Optional[Dict]:
    """마크다운에서 YAML frontmatter 추출"""
    match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if match:
        try:
            return yaml.safe_load(match.group(1))
        except yaml.YAMLError:
            return None
    return None


def collect_entities(vault_root: Path) -> Dict[str, Dict]:
    """모든 엔티티 수집"""
    entities = {}

    for filepath in vault_root.rglob("*.md"):
        relative = str(filepath.relative_to(vault_root))

        should_include = any(relative.startswith(inc) for inc in INCLUDE_PATHS)
        if not should_include:
            continue

        try:
            content = filepath.read_text(encoding="utf-8")
        except Exception:
            continue

        frontmatter = extract_frontmatter(content)
        if frontmatter and "entity_id" in frontmatter:
            entity_id = frontmatter["entity_id"]
            entities[entity_id] = {
                "filepath": filepath,
                "relative_path": relative,
                "frontmatter": frontmatter
            }

    return entities


def derive_children(entities: Dict[str, Dict]) -> Dict[str, List[str]]:
    """parent_id에서 children_ids 파생"""
    children_map = defaultdict(list)

    for entity_id, data in entities.items():
        parent_id = data["frontmatter"].get("parent_id")
        if parent_id:
            children_map[parent_id].append(entity_id)

    return dict(children_map)


def derive_incoming_relations(entities: Dict[str, Dict]) -> Dict[str, List[Dict]]:
    """outgoing_relations에서 incoming_relations 파생"""
    incoming_map = defaultdict(list)

    for entity_id, data in entities.items():
        relations = data["frontmatter"].get("outgoing_relations", [])
        if isinstance(relations, list):
            for rel in relations:
                if isinstance(rel, dict):
                    target_id = rel.get("target_id")
                    if target_id:
                        incoming_map[target_id].append({
                            "type": rel.get("type"),
                            "source_id": entity_id
                        })

    return dict(incoming_map)


def generate_index(entities: Dict[str, Dict], children_map: Dict, incoming_map: Dict, vault_root: Path) -> str:
    """그래프 인덱스 마크다운 생성"""
    now = datetime.now().strftime("%Y-%m-%d")

    # 엔티티 타입별 분류
    by_type = defaultdict(list)
    for entity_id, data in entities.items():
        entity_type = data["frontmatter"].get("entity_type", "Unknown")
        by_type[entity_type].append((entity_id, data))

    # 상태별 카운트
    status_count = defaultdict(int)
    for entity_id, data in entities.items():
        status = data["frontmatter"].get("status", "unknown")
        status_count[status] += 1

    lines = [
        "---",
        "entity_type: GraphIndex",
        "entity_id: meta:graph",
        "entity_name: LOOP Vault Graph Index",
        f"created: {now}",
        f"updated: {now}",
        f"total_entities: {len(entities)}",
        "auto_generated: true",
        'tags: ["meta", "graph", "index"]',
        "---",
        "",
        "# LOOP Vault Graph Index",
        "",
        "> 자동 생성됨 - 수동 편집 금지",
        "",
        "---",
        "",
        "## 요약 통계",
        "",
        f"- **총 엔티티**: {len(entities)}개",
        f"- **마지막 업데이트**: {now}",
        "",
        "### 타입별",
        "| Type | Count |",
        "|------|-------|",
    ]

    for entity_type in ENTITY_ORDER:
        count = len(by_type.get(entity_type, []))
        if count > 0:
            lines.append(f"| {entity_type} | {count} |")

    lines.extend([
        "",
        "### 상태별",
        "| Status | Count |",
        "|--------|-------|",
    ])

    for status, count in sorted(status_count.items()):
        lines.append(f"| {status} | {count} |")

    lines.extend([
        "",
        "---",
        "",
    ])

    # 엔티티 타입별 목록
    for entity_type in ENTITY_ORDER:
        type_entities = by_type.get(entity_type, [])
        if not type_entities:
            continue

        lines.extend([
            f"## {entity_type} ({len(type_entities)}개)",
            "",
            "| ID | Name | Status | Path |",
            "|----|------|--------|------|",
        ])

        for entity_id, data in sorted(type_entities):
            fm = data["frontmatter"]
            name = fm.get("entity_name", "")
            status = fm.get("status", "")
            path = data["relative_path"]
            lines.append(f"| `{entity_id}` | {name} | {status} | `{path}` |")

        lines.extend(["", ""])

    # 관계 매트릭스
    lines.extend([
        "---",
        "",
        "## 관계 요약",
        "",
        "### Parent-Child 관계",
        "",
    ])

    for parent_id, children in sorted(children_map.items()):
        if parent_id in entities:
            parent_name = entities[parent_id]["frontmatter"].get("entity_name", parent_id)
            lines.append(f"- **{parent_id}** ({parent_name})")
            for child_id in sorted(children):
                if child_id in entities:
                    child_name = entities[child_id]["frontmatter"].get("entity_name", child_id)
                    lines.append(f"  - {child_id} ({child_name})")

    lines.extend([
        "",
        "---",
        "",
        "## Critical Paths",
        "",
    ])

    # Critical 엔티티 목록
    critical_entities = [
        (eid, data) for eid, data in entities.items()
        if data["frontmatter"].get("priority_flag") == "critical"
    ]

    if critical_entities:
        lines.append("### Critical 엔티티")
        lines.append("")
        for entity_id, data in critical_entities:
            name = data["frontmatter"].get("entity_name", "")
            status = data["frontmatter"].get("status", "")
            lines.append(f"- **{entity_id}**: {name} (status: {status})")
    else:
        lines.append("Critical 엔티티 없음")

    lines.extend([
        "",
        "---",
        "",
        f"**Auto-generated**: {now}",
        "**Script**: scripts/build_graph_index.py",
    ])

    return "\n".join(lines)


def generate_json_index(entities: Dict[str, Dict], children_map: Dict, incoming_map: Dict) -> Dict:
    """LLM 최적화된 JSON 그래프 인덱스 생성"""
    now = datetime.now().isoformat()

    graph = {
        "generated": now,
        "total_entities": len(entities),
        "nodes": [],
        "edges": [],
        "conditions_3y_index": {},
        "by_type": {},
        "by_status": {},
    }

    # 노드 생성
    for entity_id, data in entities.items():
        fm = data["frontmatter"]
        node = {
            "id": entity_id,
            "type": fm.get("entity_type"),
            "name": fm.get("entity_name"),
            "status": fm.get("status"),
            "path": data["relative_path"],
        }

        # 추가 메타데이터
        if fm.get("conditions_3y"):
            node["conditions_3y"] = fm.get("conditions_3y")
        if fm.get("priority_flag"):
            node["priority_flag"] = fm.get("priority_flag")
        if fm.get("assignee"):
            node["assignee"] = fm.get("assignee")
        if fm.get("owner"):
            node["owner"] = fm.get("owner")

        graph["nodes"].append(node)

        # 타입별 인덱스
        entity_type = fm.get("entity_type", "Unknown")
        if entity_type not in graph["by_type"]:
            graph["by_type"][entity_type] = []
        graph["by_type"][entity_type].append(entity_id)

        # 상태별 인덱스
        status = fm.get("status", "unknown")
        if status not in graph["by_status"]:
            graph["by_status"][status] = []
        graph["by_status"][status].append(entity_id)

        # conditions_3y 인덱스 구축
        conditions = fm.get("conditions_3y", [])
        if isinstance(conditions, list):
            for cond in conditions:
                if cond not in graph["conditions_3y_index"]:
                    graph["conditions_3y_index"][cond] = []
                graph["conditions_3y_index"][cond].append(entity_id)

    # 에지 생성 (parent-child)
    for parent_id, children in children_map.items():
        for child_id in children:
            graph["edges"].append({
                "source": parent_id,
                "target": child_id,
                "type": "parent_of"
            })

    # 에지 생성 (outgoing_relations)
    for entity_id, data in entities.items():
        relations = data["frontmatter"].get("outgoing_relations", [])
        if isinstance(relations, list):
            for rel in relations:
                if isinstance(rel, dict):
                    graph["edges"].append({
                        "source": entity_id,
                        "target": rel.get("target_id"),
                        "type": rel.get("type")
                    })

    return graph


def main(vault_path: str) -> int:
    """메인 함수"""
    vault_root = Path(vault_path).resolve()

    if not vault_root.exists():
        print(f"Error: Vault path does not exist: {vault_root}")
        return 1

    print("Collecting entities...")
    entities = collect_entities(vault_root)
    print(f"Found {len(entities)} entities")

    print("Deriving children...")
    children_map = derive_children(entities)

    print("Deriving incoming relations...")
    incoming_map = derive_incoming_relations(entities)

    print("Generating markdown index...")
    index_content = generate_index(entities, children_map, incoming_map, vault_root)

    # 마크다운 인덱스 저장
    index_path = vault_root / "_Graph_Index.md"
    index_path.write_text(index_content, encoding="utf-8")
    print(f"  Saved: {index_path}")

    # JSON 인덱스 생성 및 저장
    print("Generating JSON index...")
    json_graph = generate_json_index(entities, children_map, incoming_map)

    build_dir = vault_root / "_build"
    build_dir.mkdir(exist_ok=True)
    json_path = build_dir / "graph.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_graph, f, indent=2, ensure_ascii=False)
    print(f"  Saved: {json_path}")

    print(f"\nTotal entities indexed: {len(entities)}")
    print(f"Conditions indexed: {len(json_graph['conditions_3y_index'])}")

    return 0


if __name__ == "__main__":
    vault_path = sys.argv[1] if len(sys.argv) > 1 else "."
    sys.exit(main(vault_path))
