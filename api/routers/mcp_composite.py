"""
MCP Composite API Router

GPT가 MCP 도구를 호출할 때 권한 요청 횟수를 최소화하기 위한 복합 API 엔드포인트.
기존 여러 API 호출을 1회로 통합하여 UX 개선.

Endpoints:
    GET /api/mcp/vault-context      - Vault 구조 + 현황 (GPT 첫 호출용)
    GET /api/mcp/search-and-read    - 검색 + 파일 내용 한 번에 반환
    GET /api/mcp/project/{id}/context - 프로젝트 + Tasks + Hypotheses
    GET /api/mcp/track/{id}/context   - Track + 하위 Projects
    GET /api/mcp/dashboard           - Vault 현황 요약 (칸반 대시보드)
    GET /api/mcp/entity/{id}/graph   - 엔티티 관계 그래프
    GET /api/mcp/strategy            - 전략 계층 (기존 API 위임)
    GET /api/mcp/schema              - 스키마/상수 정보 (기존 API 위임)
"""

import re
import json
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

from ..cache import get_cache
from ..utils.vault_utils import get_vault_dir
from ..constants import get_all_constants


router = APIRouter(prefix="/api/mcp", tags=["mcp-composite"])


# ============================================
# Response Models
# ============================================

class VaultStructure(BaseModel):
    """Vault 구조 정보"""
    hierarchy: str
    id_patterns: Dict[str, str]
    entity_counts: Dict[str, int]


class ActiveSummary(BaseModel):
    """활성 상태 요약"""
    doing_tasks: int
    doing_projects: int
    active_tracks: List[str]
    attention_needed: List[Dict[str, Any]]


class PhilosophySummary(BaseModel):
    """LOOP Vault 설계 철학 요약"""
    one_liner: str
    core_principles: List[str]
    full_doc_path: str


class VaultContextResponse(BaseModel):
    """Vault 전체 컨텍스트"""
    philosophy: PhilosophySummary
    structure: VaultStructure
    current_state: ActiveSummary
    recommended_start: List[str]


class FileContent(BaseModel):
    """파일 내용"""
    path: str
    frontmatter: Dict[str, Any]
    body: str
    truncated: bool


class SearchAndReadResponse(BaseModel):
    """검색 + 읽기 결과"""
    query: str
    total_matches: int
    files: List[FileContent]


class ProjectContextResponse(BaseModel):
    """프로젝트 컨텍스트"""
    project: Dict[str, Any]
    tasks: List[Dict[str, Any]]
    hypotheses: List[Dict[str, Any]]
    parent_track: Optional[Dict[str, Any]]


class TrackContextResponse(BaseModel):
    """Track 컨텍스트"""
    track: Dict[str, Any]
    projects: List[Dict[str, Any]]
    hypotheses: List[Dict[str, Any]]
    condition: Optional[Dict[str, Any]]


class DashboardResponse(BaseModel):
    """대시보드 요약"""
    summary: Dict[str, int]
    attention_needed: List[Dict[str, Any]]
    recent_updates: List[Dict[str, Any]]
    active_tracks: List[Dict[str, Any]]


class EntityGraphResponse(BaseModel):
    """엔티티 그래프"""
    entity: Dict[str, Any]
    parents: List[Dict[str, Any]]
    children: List[Dict[str, Any]]
    related: List[Dict[str, Any]]


# ============================================
# Configuration
# ============================================

# 검색 제외 패턴
EXCLUDE_PATTERNS = [
    ".obsidian",
    "90_Archive",
    ".git",
    "__pycache__",
    "node_modules",
    "_build",
]


# ============================================
# Helper Functions
# ============================================

def extract_frontmatter_and_body(file_path: Path) -> tuple[Optional[Dict], str]:
    """파일에서 frontmatter와 body 추출"""
    import yaml

    try:
        content = file_path.read_text(encoding='utf-8')
        match = re.match(r'^---\s*\n(.*?)\n---\s*\n?(.*)', content, re.DOTALL)
        if match:
            frontmatter = yaml.safe_load(match.group(1))
            body = match.group(2).strip()
            return frontmatter, body
        return None, content.strip()
    except Exception:
        return None, ""


def truncate_body(body: str, max_chars: int) -> tuple[str, bool]:
    """본문을 최대 길이로 자르기"""
    if len(body) <= max_chars:
        return body, False
    return body[:max_chars] + "\n\n... (truncated)", True


# ============================================
# Endpoints
# ============================================

@router.get("/vault-context", response_model=VaultContextResponse)
async def get_vault_context():
    """
    Vault 전체 구조 + 현황 (GPT 첫 호출용)

    GPT가 Vault 구조를 이해하고 효율적으로 탐색할 수 있도록
    계층 구조, ID 패턴, 현재 상태를 한 번에 반환.
    """
    cache = get_cache()

    # 엔티티 카운트
    all_tasks = cache.get_all_tasks()
    all_projects = cache.get_all_projects()

    entity_counts = {
        "tasks": len(all_tasks),
        "projects": len(all_projects),
        "programs": len(cache.get_all_programs()),
        "hypotheses": len(cache.get_all_hypotheses()),
        "tracks": len(cache.get_all_tracks()),
        "conditions": len(cache.get_all_conditions()),
    }

    # 활성 상태 집계
    doing_tasks = [t for t in all_tasks if t.get('status') == 'doing']
    doing_projects = [p for p in all_projects if p.get('status') == 'doing']

    # 주의 필요 항목 (overdue or high priority doing)
    today = datetime.now().date().isoformat()
    attention_needed = []

    for task in doing_tasks:
        due = task.get('due')
        priority = task.get('priority_flag')
        # due가 date 객체면 문자열로 변환
        due_str = due.isoformat() if hasattr(due, 'isoformat') else str(due) if due else None
        if due_str and due_str < today:
            attention_needed.append({
                "type": "overdue_task",
                "id": task.get('entity_id'),
                "name": task.get('entity_name'),
                "due": due_str
            })
        elif priority in ['critical', 'high']:
            attention_needed.append({
                "type": "high_priority_task",
                "id": task.get('entity_id'),
                "name": task.get('entity_name'),
                "priority": priority
            })

    # 활성 Track 추출 (parent_id가 trk-*인 프로젝트에서 직접 추출)
    active_track_ids = set()
    for project in doing_projects:
        parent = project.get('parent_id')
        if parent and parent.startswith('trk-'):
            active_track_ids.add(parent)

    # Task의 project → project의 parent_id(Track) 추론
    for task in doing_tasks:
        project_id = task.get('project_id')
        if project_id:
            project = cache.get_project(project_id)
            if project:
                parent = project.get('parent_id')
                if parent and parent.startswith('trk-'):
                    active_track_ids.add(parent)

    return VaultContextResponse(
        philosophy=PhilosophySummary(
            one_liner="LOOP Vault는 '결정–증거–정량화(A/B)–승인–학습' 루프를 문서 기반 SSOT + 자동화(Derived)로 구현한 0→1 단계용 Palantir-lite 운영 OS",
            core_principles=[
                "SSOT + Derived: 한 곳에만 저장, 나머지는 계산 (드리프트 방지)",
                "계산은 코드가, 판단은 사람이: LLM은 제안, 점수 계산은 서버, 승인은 인간",
                "A/B 점수화: 베팅(A)과 결과(B) 분리 → 학습이 누적되는 구조",
                "윈도우 기반 평가: Project(월간) → Track(분기) → Condition(반기) 롤업"
            ],
            full_doc_path="00_Meta/LOOP_PHILOSOPHY.md"
        ),
        structure=VaultStructure(
            hierarchy="NorthStar → MetaHypothesis → Condition → Track → Project → Task",
            id_patterns={
                "Project": "prj-NNN (예: prj-001)",
                "Task": "tsk-NNN-NN (예: tsk-001-01)",
                "Hypothesis": "hyp-N-NN (예: hyp-2-01)",
                "Track": "trk-N (예: trk-1)",
                "Condition": "cond-X (예: cond-a)"
            },
            entity_counts=entity_counts
        ),
        current_state=ActiveSummary(
            doing_tasks=len(doing_tasks),
            doing_projects=len(doing_projects),
            active_tracks=list(active_track_ids)[:6],
            attention_needed=attention_needed[:5]
        ),
        recommended_start=[
            "/api/mcp/search-and-read?q=키워드 - 검색+읽기",
            "/api/mcp/dashboard - 전체 현황 보기",
            "/api/mcp/project/{project_id}/context - 프로젝트 상세"
        ]
    )


@router.get("/search-and-read", response_model=SearchAndReadResponse)
async def search_and_read(
    q: str = Query(..., min_length=2, description="검색어 (2자 이상)"),
    max_files: int = Query(5, ge=1, le=10, description="최대 파일 수"),
    max_chars_per_file: int = Query(5000, ge=1000, le=15000, description="파일당 최대 문자수")
):
    """
    검색 + 매칭 파일 내용 한 번에 반환

    기존: search (1회) + read (N회) = N+1회 호출
    개선: 1회 호출로 검색과 읽기 동시 처리
    """
    vault_dir = get_vault_dir()

    # 정규식 패턴 (대소문자 무시)
    pattern = re.compile(re.escape(q), re.IGNORECASE)

    matched_files: List[FileContent] = []
    total_matches = 0

    # .md 파일만 검색
    for md_file in vault_dir.rglob("*.md"):
        # 제외 패턴 체크
        file_str = str(md_file)
        if any(exclude in file_str for exclude in EXCLUDE_PATTERNS):
            continue

        try:
            content = md_file.read_text(encoding='utf-8')
            matches = list(pattern.finditer(content))

            if matches:
                total_matches += len(matches)

                if len(matched_files) < max_files:
                    frontmatter, body = extract_frontmatter_and_body(md_file)
                    body_truncated, truncated = truncate_body(body, max_chars_per_file)

                    matched_files.append(FileContent(
                        path=str(md_file.relative_to(vault_dir)),
                        frontmatter=frontmatter or {},
                        body=body_truncated,
                        truncated=truncated
                    ))

        except (UnicodeDecodeError, PermissionError):
            continue

    return SearchAndReadResponse(
        query=q,
        total_matches=total_matches,
        files=matched_files
    )


@router.get("/project/{project_id}/context", response_model=ProjectContextResponse)
async def get_project_context(project_id: str):
    """
    프로젝트 + 모든 Task + 관련 Hypothesis + 부모 Track

    기존: project (1회) + tasks (N회) + hypotheses (M회) = 1+N+M회 호출
    개선: 1회 호출로 프로젝트 전체 컨텍스트 획득
    """
    cache = get_cache()

    # 프로젝트 조회
    project = cache.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project not found: {project_id}")

    # 프로젝트의 Tasks 조회 (frontmatter만, body 제외)
    tasks = cache.get_all_tasks(project_id=project_id)

    # 관련 Hypothesis 조회
    validates = project.get('validates', []) or []
    hypotheses = []
    for hyp_id in validates:
        hyp = cache.get_hypothesis(hyp_id)
        if hyp:
            hypotheses.append(hyp)

    # 부모 Track 조회
    parent_track = None
    parent_id = project.get('parent_id')
    if parent_id and parent_id.startswith('trk-'):
        parent_track = cache.get_track(parent_id)

    return ProjectContextResponse(
        project=project,
        tasks=tasks,
        hypotheses=hypotheses,
        parent_track=parent_track
    )


@router.get("/track/{track_id}/context", response_model=TrackContextResponse)
async def get_track_context(track_id: str):
    """
    Track + 하위 Projects + Hypotheses 전체

    기존: track (1회) + projects (N회) + hypotheses (M회) = 1+N+M회 호출
    개선: 1회 호출로 Track 전체 컨텍스트 획득
    """
    cache = get_cache()

    # Track 조회
    track = cache.get_track(track_id)
    if not track:
        raise HTTPException(status_code=404, detail=f"Track not found: {track_id}")

    # Track의 Projects 조회 (parent_id가 이 track인 프로젝트들)
    all_projects = cache.get_all_projects()
    track_projects = [
        p for p in all_projects
        if p.get('parent_id') == track_id
    ]

    # Track 번호로 Hypothesis 조회 (hyp-{track_num}-*)
    track_num = track_id.replace('trk-', '')
    all_hypotheses = cache.get_all_hypotheses()
    track_hypotheses = [
        h for h in all_hypotheses
        if h.get('entity_id', '').startswith(f'hyp-{track_num}-')
    ]

    # 부모 Condition 조회
    condition = None
    parent_id = track.get('parent_id')
    if parent_id and parent_id.startswith('cond-'):
        condition = cache.get_condition(parent_id)

    return TrackContextResponse(
        track=track,
        projects=track_projects,
        hypotheses=track_hypotheses,
        condition=condition
    )


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard():
    """
    Vault 전체 현황 요약 (칸반 대시보드 데이터)

    기존: tasks + projects + 필터들 = 10+ 호출
    개선: 1회 호출로 대시보드 전체 데이터 획득
    """
    cache = get_cache()

    all_tasks = cache.get_all_tasks()
    all_projects = cache.get_all_projects()

    # 상태별 집계
    task_by_status = {}
    for task in all_tasks:
        status = task.get('status', 'unknown')
        task_by_status[status] = task_by_status.get(status, 0) + 1

    project_by_status = {}
    for project in all_projects:
        status = project.get('status', 'unknown')
        project_by_status[status] = project_by_status.get(status, 0) + 1

    # 주의 필요 항목
    today = datetime.now().date().isoformat()
    attention_needed = []

    doing_tasks = [t for t in all_tasks if t.get('status') == 'doing']
    for task in doing_tasks:
        due = task.get('due')
        # due가 date 객체면 문자열로 변환
        due_str = due.isoformat() if hasattr(due, 'isoformat') else str(due) if due else None
        if due_str and due_str < today:
            attention_needed.append({
                "type": "overdue",
                "entity_type": "Task",
                "id": task.get('entity_id'),
                "name": task.get('entity_name'),
                "due": due_str,
                "assignee": task.get('assignee')
            })

    # 최근 업데이트 (updated 기준 정렬)
    def normalize_date(d):
        """date 객체를 문자열로 변환"""
        if d is None:
            return ''
        if hasattr(d, 'isoformat'):
            return d.isoformat()
        return str(d)

    all_entities = all_tasks + all_projects
    sorted_entities = sorted(
        [e for e in all_entities if e.get('updated')],
        key=lambda x: normalize_date(x.get('updated')),
        reverse=True
    )
    recent_updates = [
        {
            "id": e.get('entity_id'),
            "name": e.get('entity_name'),
            "type": e.get('entity_type'),
            "status": e.get('status'),
            "updated": normalize_date(e.get('updated'))
        }
        for e in sorted_entities[:10]
    ]

    # 활성 Tracks
    all_tracks = cache.get_all_tracks()
    active_tracks = [
        {
            "id": t.get('entity_id'),
            "name": t.get('entity_name'),
            "status": t.get('status')
        }
        for t in all_tracks
        if t.get('status') == 'doing'
    ]

    return DashboardResponse(
        summary={
            "total_tasks": len(all_tasks),
            "total_projects": len(all_projects),
            "doing_tasks": task_by_status.get('doing', 0),
            "todo_tasks": task_by_status.get('todo', 0),
            "done_tasks": task_by_status.get('done', 0),
            "doing_projects": project_by_status.get('doing', 0),
        },
        attention_needed=attention_needed[:10],
        recent_updates=recent_updates,
        active_tracks=active_tracks
    )


@router.get("/entity/{entity_id}/graph", response_model=EntityGraphResponse)
async def get_entity_graph(entity_id: str):
    """
    엔티티 + 상위/하위/관련 관계 전체

    _build/graph.json 활용하여 관계 데이터 제공.
    """
    cache = get_cache()
    vault_dir = get_vault_dir()

    # 엔티티 조회 (타입별로 시도)
    entity = None
    entity_type = None

    if entity_id.startswith('tsk-'):
        entity = cache.get_task(entity_id)
        entity_type = 'Task'
    elif entity_id.startswith('prj-'):
        entity = cache.get_project(entity_id)
        entity_type = 'Project'
    elif entity_id.startswith('hyp-'):
        entity = cache.get_hypothesis(entity_id)
        entity_type = 'Hypothesis'
    elif entity_id.startswith('trk-'):
        entity = cache.get_track(entity_id)
        entity_type = 'Track'
    elif entity_id.startswith('cond-'):
        entity = cache.get_condition(entity_id)
        entity_type = 'Condition'

    if not entity:
        raise HTTPException(status_code=404, detail=f"Entity not found: {entity_id}")

    # graph.json에서 관계 로드
    graph_path = vault_dir / "_build" / "graph.json"
    graph_data = {"nodes": [], "edges": []}

    if graph_path.exists():
        try:
            graph_data = json.loads(graph_path.read_text(encoding='utf-8'))
        except Exception:
            pass

    # 관계 추출
    parents = []
    children = []
    related = []

    # ID 중복 체크용 세트
    parent_ids = set()
    child_ids = set()

    edges = graph_data.get('edges', [])
    # nodes_map 구성 시 id 없는 노드 스킵 (Codex 피드백)
    nodes_map = {n.get('id'): n for n in graph_data.get('nodes', []) if n.get('id')}

    for edge in edges:
        if edge.get('target') == entity_id:
            # 부모 관계
            source_id = edge.get('source')
            if source_id in nodes_map and source_id not in parent_ids:
                parents.append(nodes_map[source_id])
                parent_ids.add(source_id)
        elif edge.get('source') == entity_id:
            # 자식 관계
            target_id = edge.get('target')
            if target_id in nodes_map and target_id not in child_ids:
                children.append(nodes_map[target_id])
                child_ids.add(target_id)

    # 캐시에서 직접 관계 보완 (ID 기반 중복 체크 - Codex 피드백)
    if entity_type == 'Task':
        # Task의 project
        project_id = entity.get('project_id')
        if project_id and project_id not in parent_ids:
            project = cache.get_project(project_id)
            if project:
                parents.append({
                    "id": project_id,
                    "type": "Project",
                    "name": project.get('entity_name'),
                    "status": project.get('status')
                })
                parent_ids.add(project_id)

    elif entity_type == 'Project':
        # Project의 tasks
        tasks = cache.get_all_tasks(project_id=entity_id)
        for task in tasks:
            task_id = task.get('entity_id')
            if task_id and task_id not in child_ids:
                children.append({
                    "id": task_id,
                    "type": "Task",
                    "name": task.get('entity_name'),
                    "status": task.get('status')
                })
                child_ids.add(task_id)

        # Project가 validates하는 hypotheses
        validates = entity.get('validates', []) or []
        for hyp_id in validates:
            hyp = cache.get_hypothesis(hyp_id)
            if hyp:
                related.append({
                    "id": hyp_id,
                    "type": "Hypothesis",
                    "name": hyp.get('entity_name'),
                    "relation": "validates"
                })

    return EntityGraphResponse(
        entity=entity,
        parents=parents[:10],
        children=children[:20],
        related=related[:10]
    )


@router.get("/strategy")
async def get_strategy_overview(
    depth: str = Query("summary", regex="^(summary|full)$", description="summary 또는 full")
):
    """
    전체 전략 계층 (기존 /api/strategy/context 위임)

    NorthStar → MetaHypotheses → Conditions → Tracks → Hypotheses
    """
    cache = get_cache()

    result = {
        "northstars": cache.get_all_northstars(),
        "metahypotheses": cache.get_all_metahypotheses(),
        "conditions": cache.get_all_conditions(),
        "tracks": cache.get_all_tracks(),
    }

    if depth == "full":
        result["hypotheses"] = cache.get_all_hypotheses()

    return result


@router.get("/schema")
async def get_schema_info(
    category: str = Query("all", description="all, task, project, hypothesis, track, condition")
):
    """
    Vault 스키마/상수 정보 (기존 /api/constants 위임)
    """
    all_constants = get_all_constants()

    # 대소문자 정규화 (Codex 피드백)
    category = category.lower()

    if category == "all":
        return all_constants

    # 카테고리별 필터링
    category_mapping = {
        "task": ["task"],
        "project": ["project"],
        "hypothesis": ["hypothesis"],
        "track": ["track"],
        "condition": ["condition_ids"]
    }

    keys = category_mapping.get(category, [])
    if not keys:
        raise HTTPException(status_code=400, detail=f"Unknown category: {category}")

    filtered = {k: v for k, v in all_constants.items() if any(key in k.lower() for key in keys)}
    return filtered
