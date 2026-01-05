"""
MCP Composite API Router

GPT가 MCP 도구를 호출할 때 권한 요청 횟수를 최소화하기 위한 복합 API 엔드포인트.
기존 여러 API 호출을 1회로 통합하여 UX 개선.

Endpoints:
    GET /api/mcp/vault-context      - Vault 구조 + 현황 (GPT 첫 호출용)
    GET /api/mcp/vault-navigation   - Dual-vault 통합 네비게이션 (NEW)
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
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
from fastapi import APIRouter, Query, HTTPException, Request
from pydantic import BaseModel

from ..cache import get_cache
from ..utils.vault_utils import get_vault_dir, get_exec_vault_dir
from ..constants import get_all_constants
from ..oauth.jwks import verify_jwt


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


class VaultFolderInfo(BaseModel):
    """Vault 폴더 정보"""
    count: Optional[int] = None
    purpose: str


class KeyDocument(BaseModel):
    """핵심 문서 정보"""
    path: str
    purpose: str


class PriorityFile(BaseModel):
    """최우선 파일 정보"""
    path: str
    purpose: str


class DisclosurePolicy(BaseModel):
    """공개 원칙"""
    allowed: List[str]
    forbidden: List[str]


class VaultInfo(BaseModel):
    """개별 Vault 정보"""
    description: str
    access: str
    folders: Dict[str, VaultFolderInfo]
    key_documents: Optional[List[KeyDocument]] = None
    priority_files: Optional[List[PriorityFile]] = None
    disclosure_policy: Optional[DisclosurePolicy] = None


class RoutingGuideItem(BaseModel):
    """라우팅 가이드 항목"""
    question: str
    vault: str
    path: str
    api: Optional[str] = None


class VaultNavigationResponse(BaseModel):
    """Vault Navigation 응답 - dual-vault 통합 네비게이션"""
    dual_vault: Dict[str, VaultInfo]
    routing_guide: List[RoutingGuideItem]
    entity_stats: Dict[str, Dict[str, Any]]  # public은 int, exec는 note 문자열
    quick_links: Dict[str, str]
    generated_at: str


# ============================================
# RBAC Helper
# ============================================

def get_role_and_scope(request: Request) -> Tuple[str, str]:
    """request.scope["state"]에서 role/scope 가져오거나 JWT에서 확인"""
    # 1. ASGI scope["state"] 확인 (AuthMiddleware가 설정)
    state = request.scope.get("state", {})
    if isinstance(state, dict):
        role = state.get("role")
        scope = state.get("scope")
        if role and scope:
            return role, scope

    # 2. Authorization 헤더에서 직접 JWT 확인
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]
        payload = verify_jwt(token)
        if payload:
            return payload.get("role", "member"), payload.get("scope", "mcp:read")

    # 3. 기본값
    return "member", "mcp:read"


def require_exec_access(request: Request):
    """exec vault 접근 권한 확인. 없으면 403 발생"""
    role, scope = get_role_and_scope(request)
    if role not in ("exec", "admin"):
        raise HTTPException(
            status_code=403,
            detail=f"Access denied: exec vault requires 'exec' or 'admin' role (current: {role})"
        )
    if "mcp:exec" not in scope:
        raise HTTPException(
            status_code=403,
            detail="Access denied: exec vault requires 'mcp:exec' scope"
        )
    return role, scope


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
            "/api/mcp/status-summary - 전체 현황 보기",
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


@router.get("/file-read")
async def file_read(
    paths: str = Query(..., description="읽을 파일 경로들 (쉼표 구분, vault 상대 경로)"),
    max_chars_per_file: int = Query(8000, ge=1000, le=20000, description="파일당 최대 문자수")
):
    """
    Vault 파일 직접 읽기

    경로로 파일을 직접 읽어 frontmatter + body 반환.
    검색 없이 특정 파일을 바로 읽고 싶을 때 사용.

    경로 예시:
    - `50_Projects/n8n/prj-n8n.md`
    - `50_Projects/n8n/Tasks/tsk-n8n-03_xxx.md`
    - 여러 파일: `paths=file1.md,file2.md`
    """
    vault_dir = get_vault_dir()

    path_list = [p.strip() for p in paths.split(",") if p.strip()]
    if not path_list:
        raise HTTPException(status_code=400, detail="No paths provided")

    results: List[FileContent] = []

    for rel_path in path_list[:10]:  # 최대 10개 파일
        file_path = vault_dir / rel_path

        # 경로 탈출 방지
        try:
            file_path.resolve().relative_to(vault_dir.resolve())
        except ValueError:
            results.append(FileContent(
                path=rel_path,
                frontmatter={"error": "Path traversal not allowed"},
                body="",
                truncated=False
            ))
            continue

        # 제외 패턴 체크
        if any(exclude in str(file_path) for exclude in EXCLUDE_PATTERNS):
            results.append(FileContent(
                path=rel_path,
                frontmatter={"error": "Path excluded"},
                body="",
                truncated=False
            ))
            continue

        if not file_path.exists():
            results.append(FileContent(
                path=rel_path,
                frontmatter={"error": "File not found"},
                body="",
                truncated=False
            ))
            continue

        try:
            frontmatter, body = extract_frontmatter_and_body(file_path)
            body_truncated, was_truncated = truncate_body(body, max_chars_per_file)

            results.append(FileContent(
                path=rel_path,
                frontmatter=frontmatter or {},
                body=body_truncated,
                truncated=was_truncated
            ))
        except Exception as e:
            results.append(FileContent(
                path=rel_path,
                frontmatter={"error": str(e)},
                body="",
                truncated=False
            ))

    return {
        "total_files": len(results),
        "files": results
    }


@router.get("/project/{project_id}/context")
async def get_project_context(
    project_id: str,
    include_body: bool = Query(False, description="프로젝트/Task 본문 포함 여부"),
    max_body_chars: int = Query(5000, ge=1000, le=15000, description="본문 최대 문자수")
):
    """
    프로젝트 + 모든 Task + 관련 Hypothesis + 부모 Track

    기존: project (1회) + tasks (N회) + hypotheses (M회) = 1+N+M회 호출
    개선: 1회 호출로 프로젝트 전체 컨텍스트 획득

    include_body=true 시 프로젝트와 Task의 본문(body)도 포함
    """
    cache = get_cache()
    vault_dir = get_vault_dir()

    # 프로젝트 조회
    project = cache.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project not found: {project_id}")

    # include_body=true일 때 프로젝트 본문 추가
    project_data = dict(project)
    if include_body and project.get('_path'):
        file_path = vault_dir / project['_path']
        if file_path.exists():
            _, body = extract_frontmatter_and_body(file_path)
            body_truncated, _ = truncate_body(body, max_body_chars)
            project_data['_body'] = body_truncated

    # 프로젝트의 Tasks 조회
    tasks = cache.get_all_tasks(project_id=project_id)

    # include_body=true일 때 Task 본문도 추가
    tasks_data = []
    for task in tasks:
        task_data = dict(task)
        if include_body and task.get('_path'):
            file_path = vault_dir / task['_path']
            if file_path.exists():
                _, body = extract_frontmatter_and_body(file_path)
                body_truncated, _ = truncate_body(body, max_body_chars)
                task_data['_body'] = body_truncated
        tasks_data.append(task_data)

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

    return {
        "project": project_data,
        "tasks": tasks_data,
        "hypotheses": hypotheses,
        "parent_track": parent_track
    }


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


@router.get("/status-summary", response_model=DashboardResponse)
async def get_status_summary():
    """
    Vault 전체 현황 요약 (Tasks/Projects 상태 집계)

    기존: tasks + projects + 필터들 = 10+ 호출
    개선: 1회 호출로 전체 상태 데이터 획득
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


# ============================================
# Vault Full Scan (슈퍼 복합 API)
# ============================================

class VaultMeta(BaseModel):
    """Vault 메타 정보"""
    name: str
    philosophy: str
    hierarchy: str
    id_patterns: Dict[str, str]
    schema_version: str


class EntityTypeInfo(BaseModel):
    """엔티티 타입별 정보"""
    count: int
    required_fields: List[str]
    known_fields: List[str]
    field_values: Dict[str, Dict[str, int]]  # field -> {value: count}
    samples: Optional[List[Dict[str, Any]]] = None  # depth=full 시


class VaultFullScanResponse(BaseModel):
    """vault-full-scan 응답"""
    vault_meta: VaultMeta
    entity_types: Dict[str, EntityTypeInfo]
    active_summary: ActiveSummary
    query_guide: Dict[str, str]


def _get_entities_by_type(entity_type: str, cache) -> List[Dict]:
    """타입별 엔티티 조회"""
    type_to_method = {
        "Task": cache.get_all_tasks,
        "Project": cache.get_all_projects,
        "Hypothesis": cache.get_all_hypotheses,
        "Track": cache.get_all_tracks,
        "Condition": cache.get_all_conditions,
        "Program": cache.get_all_programs,
        "NorthStar": cache.get_all_northstars,
        "MetaHypothesis": cache.get_all_metahypotheses,
    }
    method = type_to_method.get(entity_type)
    return method() if method else []


def _calculate_field_distribution(entity_type: str, entities: List[Dict]) -> Dict[str, Dict[str, int]]:
    """필드값 분포 계산"""
    # 타입별 분포 수집 대상 필드
    target_fields = {
        "Task": ["status", "assignee", "priority", "type", "target_project"],
        "Project": ["status", "owner"],
        "Hypothesis": ["evidence_status", "horizon"],
        "Track": ["status", "horizon"],
        "Condition": ["status"],
        "Program": ["status", "program_type"],
        "NorthStar": ["status"],
        "MetaHypothesis": ["status"],
    }

    fields = target_fields.get(entity_type, ["status"])
    distribution = {}

    for field in fields:
        counter = {}
        for entity in entities:
            value = entity.get(field)
            if value is not None:
                # 리스트 값 처리
                if isinstance(value, list):
                    for v in value:
                        counter[str(v)] = counter.get(str(v), 0) + 1
                else:
                    counter[str(value)] = counter.get(str(value), 0) + 1
        if counter:
            distribution[field] = counter

    return distribution


def _select_samples(entities: List[Dict], count: int) -> List[Dict[str, Any]]:
    """샘플 엔티티 선택 (다양성 + 최신성)"""
    if not entities:
        return []

    # doing 상태 우선, 그 다음 최신 updated 순
    def sort_key(e):
        status_priority = {"doing": 0, "active": 0, "validating": 0, "todo": 1, "planning": 1}.get(e.get("status", ""), 2)
        updated = e.get("updated", "")
        updated_str = updated.isoformat() if hasattr(updated, 'isoformat') else str(updated) if updated else ""
        return (status_priority, updated_str)

    sorted_entities = sorted(entities, key=sort_key, reverse=True)

    # 샘플 선택 (frontmatter만, _body/_path 제외)
    samples = []
    seen_owners = set()

    for entity in sorted_entities[:count * 2]:  # 후보 풀 확대
        if len(samples) >= count:
            break

        owner = entity.get("owner") or entity.get("assignee")

        # 다양성: 가능하면 다른 owner/assignee
        if owner not in seen_owners or len(samples) == count - 1:
            # _body, _path 등 내부 필드 제외
            sample = {k: v for k, v in entity.items() if not k.startswith("_")}
            # date 객체 문자열 변환
            for key in ["created", "updated", "due", "start_date", "closed"]:
                if key in sample and hasattr(sample[key], 'isoformat'):
                    sample[key] = sample[key].isoformat()
            samples.append(sample)
            if owner:
                seen_owners.add(owner)

    return samples


@router.get("/vault-full-scan", response_model=VaultFullScanResponse)
async def vault_full_scan(
    depth: str = Query("summary", regex="^(summary|full)$", description="summary 또는 full"),
    types: Optional[str] = Query(None, description="조회할 타입들 (쉼표 구분, 예: Task,Project)"),
    sample_count: int = Query(2, ge=1, le=5, description="타입당 샘플 수 (depth=full 시)")
):
    """
    Vault 전체 스캔 - ChatGPT 1회 allow용 슈퍼 복합 API

    한 번의 호출로 Vault 전체 구조를 파악:
    - 타입 목록 + 스키마 + 샘플 + 속성 분포

    depth=summary: 필드 + 분포만 (기본, < 50KB)
    depth=full: 샘플 엔티티 포함 (< 200KB)
    types: 특정 타입만 조회 (예: "Task,Project")
    """
    cache = get_cache()
    all_constants = get_all_constants()

    # 1. Vault 메타 정보 구성
    vault_meta = VaultMeta(
        name="LOOP Vault",
        philosophy="결정–증거–정량화(A/B)–승인–학습 루프를 SSOT + Derived로 구현한 0→1 운영 OS",
        hierarchy="NorthStar → MetaHypothesis → Condition → Track → Project → Task",
        id_patterns={
            "Project": "prj-NNN 또는 prj-name (예: prj-001, prj-vault-gpt)",
            "Task": "tsk-{prj}-NN (예: tsk-001-01, tsk-vault-gpt-06)",
            "Hypothesis": "hyp-N-NN (예: hyp-2-01)",
            "Track": "trk-N (예: trk-1 ~ trk-6)",
            "Condition": "cond-X (예: cond-a ~ cond-e)"
        },
        schema_version=all_constants.get("schema_version", "5.3")
    )

    # 2. 조회할 타입 결정
    default_types = ["Task", "Project", "Hypothesis", "Track", "Condition", "Program"]
    if types:
        target_types = [t.strip() for t in types.split(",") if t.strip() in default_types + ["NorthStar", "MetaHypothesis"]]
    else:
        target_types = default_types

    # 3. 엔티티 타입별 정보 수집
    entity_types = {}
    for entity_type in target_types:
        entities = _get_entities_by_type(entity_type, cache)

        # 필드 정보 (constants에서 가져오거나 기본값)
        required_base = all_constants.get("required_fields", {})
        known_base = all_constants.get("known_fields", {})

        required = list(set(
            required_base.get("all", []) +
            required_base.get(entity_type, [])
        ))
        known = list(set(
            known_base.get("all", []) +
            known_base.get(entity_type, [])
        ) - set(required))

        # 필드값 분포
        field_values = _calculate_field_distribution(entity_type, entities)

        # 샘플 (depth=full 시에만)
        samples = None
        if depth == "full" and entities:
            samples = _select_samples(entities, sample_count)

        entity_types[entity_type] = EntityTypeInfo(
            count=len(entities),
            required_fields=required if required else ["entity_type", "entity_id", "entity_name", "status"],
            known_fields=known if known else [],
            field_values=field_values,
            samples=samples
        )

    # 4. 활성 상태 요약
    all_tasks = cache.get_all_tasks()
    all_projects = cache.get_all_projects()

    doing_tasks = [t for t in all_tasks if t.get('status') == 'doing']
    doing_projects = [p for p in all_projects if p.get('status') == 'doing']

    # 주의 필요 항목
    today = datetime.now().date().isoformat()
    attention_needed = []

    for task in doing_tasks[:10]:
        due = task.get('due')
        due_str = due.isoformat() if hasattr(due, 'isoformat') else str(due) if due else None
        if due_str and due_str < today:
            attention_needed.append({
                "type": "overdue_task",
                "id": task.get('entity_id'),
                "name": task.get('entity_name'),
                "due": due_str
            })

    # 활성 Track
    active_track_ids = set()
    for project in doing_projects:
        parent = project.get('parent_id')
        if parent and parent.startswith('trk-'):
            active_track_ids.add(parent)

    active_summary = ActiveSummary(
        doing_tasks=len(doing_tasks),
        doing_projects=len(doing_projects),
        active_tracks=list(active_track_ids)[:6],
        attention_needed=attention_needed[:5]
    )

    # 5. 쿼리 가이드
    query_guide = {
        "search": "/api/mcp/search-and-read?q=키워드",
        "file_read": "/api/mcp/file-read?paths=경로",
        "project_detail": "/api/mcp/project/{project_id}/context?include_body=true",
        "track_detail": "/api/mcp/track/{track_id}/context",
        "status_summary": "/api/mcp/status-summary",
        "entity_graph": "/api/mcp/entity/{entity_id}/graph"
    }

    return VaultFullScanResponse(
        vault_meta=vault_meta,
        entity_types=entity_types,
        active_summary=active_summary,
        query_guide=query_guide
    )


# ============================================
# Vault Navigation (tsk-vault-gpt-10)
# ============================================

# 정적 라우팅 가이드 (VAULT_REGISTRY.md 기반)
ROUTING_GUIDE = [
    {"question": "프로젝트/태스크 상태?", "vault": "public", "path": "50_Projects/", "api": "/api/tasks"},
    {"question": "Track 상태?", "vault": "public", "path": "20_Strategy/12M_Tracks/", "api": "/api/tracks"},
    {"question": "가설 검증 현황?", "vault": "public", "path": "60_Hypotheses/", "api": "/api/hypotheses"},
    {"question": "온톨로지 스키마?", "vault": "public", "path": "30_Ontology/Schema/", "api": None},
    {"question": "런웨이 몇 개월?", "vault": "exec", "path": "10_Runway/Current_Status.md", "api": "/api/mcp/exec-read?paths=10_Runway/Current_Status.md"},
    {"question": "채용 가능?", "vault": "exec", "path": "40_People/Hiring_Gate.md", "api": "/api/mcp/exec-read?paths=40_People/Hiring_Gate.md"},
    {"question": "이번 달 지출?", "vault": "exec", "path": "20_Cashflow/", "api": "/api/mcp/exec-context"},
    {"question": "투자 파이프라인?", "vault": "exec", "path": "30_Pipeline/Investment_Pipeline.md", "api": "/api/mcp/exec-read?paths=30_Pipeline/Investment_Pipeline.md"},
    {"question": "최악 시나리오?", "vault": "exec", "path": "60_Contingency/Worst_Case.md", "api": "/api/mcp/exec-read?paths=60_Contingency/Worst_Case.md"},
]

# 정적 Exec Vault 폴더 정보 (민감 데이터 보호 - count 제외)
EXEC_VAULT_FOLDERS = {
    "10_Runway": {"purpose": "Runway status, decision triggers"},
    "20_Cashflow": {"purpose": "Monthly income/expense tracking"},
    "30_Pipeline": {"purpose": "Investment, grants, B2B pipeline"},
    "40_People": {"purpose": "Team roster, hiring, contracts"},
    "50_Projects": {"purpose": "Exec-only sensitive projects"},
    "60_Contingency": {"purpose": "Worst case scenarios, contingency plans"},
}


def _count_folder_entities(vault_dir: Path, folder_name: str) -> int:
    """폴더 내 .md 파일 수 카운트 (템플릿 제외)"""
    folder_path = vault_dir / folder_name
    if not folder_path.exists():
        return 0
    count = 0
    for md_file in folder_path.rglob("*.md"):
        # 템플릿, 숨김 파일 제외
        if "template" in md_file.name.lower() or md_file.name.startswith("_"):
            continue
        if any(part.startswith('.') for part in md_file.parts):
            continue
        count += 1
    return count


@router.get("/vault-navigation", response_model=VaultNavigationResponse)
async def get_vault_navigation():
    """
    Dual-Vault 통합 네비게이션 - 분산된 navigation 문서를 대체하는 단일 API

    한 번의 호출로 vault 전체 구조 파악:
    - dual-vault 구조 (public + exec)
    - 질문별 라우팅 가이드
    - 실시간 엔티티 통계
    - 빠른 접근 링크

    기존 분산 문서 대체:
    - _HOME.md, _ENTRY_POINT.md → dual_vault
    - _VAULT_REGISTRY.md → routing_guide
    - _Graph_Index.md → entity_stats
    """
    cache = get_cache()
    vault_dir = get_vault_dir()

    # 1. Public vault 폴더 정보 (실시간 count)
    public_folders = {
        "00_Inbox": VaultFolderInfo(
            count=_count_folder_entities(vault_dir, "00_Inbox"),
            purpose="임시 메모, 아이디어 (Inbox)"
        ),
        "01_North_Star": VaultFolderInfo(
            count=_count_folder_entities(vault_dir, "01_North_Star"),
            purpose="10-year vision, MetaHypotheses (MH1-4)"
        ),
        "10_Study": VaultFolderInfo(
            count=_count_folder_entities(vault_dir, "10_Study"),
            purpose="온톨로지 학습, 연구 노트"
        ),
        "20_Strategy": VaultFolderInfo(
            count=_count_folder_entities(vault_dir, "20_Strategy"),
            purpose="3Y Conditions (A-E), 12M Tracks (1-6)"
        ),
        "30_Ontology": VaultFolderInfo(
            count=_count_folder_entities(vault_dir, "30_Ontology"),
            purpose="Product ontology schema (ILOS)"
        ),
        "40_LOOP_OS": VaultFolderInfo(
            count=_count_folder_entities(vault_dir, "40_LOOP_OS"),
            purpose="LOOP OS 정의, Inner Loop 운영 원칙"
        ),
        "50_Projects": VaultFolderInfo(
            count=len(cache.get_all_projects()),
            purpose="Projects and Tasks"
        ),
        "60_Hypotheses": VaultFolderInfo(
            count=len(cache.get_all_hypotheses()),
            purpose="Hypothesis validation"
        ),
        "90_Archive": VaultFolderInfo(
            count=_count_folder_entities(vault_dir, "90_Archive"),
            purpose="아카이브 (완료된 엔티티, 과거 증거)"
        ),
    }

    # Public vault 핵심 문서
    public_key_documents = [
        KeyDocument(
            path="30_Ontology/Schema/v0.1/Ontology-lite v0.1 (ILOS).md",
            purpose="온톨로지 스키마 정의 (Event, Episode, LoopStateWindow)"
        ),
        KeyDocument(
            path="40_LOOP_OS/Inner Loop OS 정의v1.md",
            purpose="LOOP OS 운영 원칙"
        ),
        KeyDocument(
            path="00_Meta/LOOP_PHILOSOPHY.md",
            purpose="Vault 설계 철학 (SSOT, Decision-Evidence-Loop)"
        ),
        KeyDocument(
            path="00_Meta/schema_constants.yaml",
            purpose="스키마 상수 SSOT (entity ID 패턴, status 값)"
        ),
        KeyDocument(
            path="00_Meta/schema_registry.md",
            purpose="엔티티별 필드 정의, 검증 규칙"
        ),
    ]

    # 2. Exec vault 폴더 정보 (정적, 보안상 count 제외)
    exec_folders = {
        name: VaultFolderInfo(count=None, purpose=info["purpose"])
        for name, info in EXEC_VAULT_FOLDERS.items()
    }

    # Exec vault 최우선 파일 (진입 시 먼저 읽을 파일)
    exec_priority_files = [
        PriorityFile(
            path="10_Runway/Current_Status.md",
            purpose="런웨이 상태 (Green/Yellow/Red)"
        ),
        PriorityFile(
            path="10_Runway/Decision_Triggers.md",
            purpose="의사결정 조건 정의 (runway_green/yellow/red)"
        ),
        PriorityFile(
            path="20_Cashflow/_INDEX.md",
            purpose="캐시플로우 인덱스 → 최신 월간 보고서 링크"
        ),
        PriorityFile(
            path="30_Pipeline/Investment_Pipeline.md",
            purpose="투자/지원사업/B2B 파이프라인"
        ),
        PriorityFile(
            path="40_People/Team_Roster.md",
            purpose="팀 현황 (인원, 역할)"
        ),
    ]

    # Exec vault 공개 원칙 (외부에 어떤 정보를 노출할 수 있는가)
    exec_disclosure_policy = DisclosurePolicy(
        allowed=[
            "상태 (Green/Yellow/Red)",
            "트리거 조건 (숫자 없이)",
            "정책 원칙 (Hiring Gate 열림/닫힘)",
            "파이프라인 단계 (confirmed/negotiating 등)",
        ],
        forbidden=[
            "구체적 금액 (매출, 비용, 급여, 잔고)",
            "개인 계약 조건 (단가, 계약서)",
            "투자자/파트너 협상 상세",
            "계좌번호, 세금 상세",
            "개인정보 (주민번호, 연락처 등)",
        ]
    )

    # 3. Dual vault 구조
    dual_vault = {
        "public": VaultInfo(
            description="Shared vault - Projects, Tasks, Strategy, Ontology",
            access="team + c-level",
            folders=public_folders,
            key_documents=public_key_documents
        ),
        "exec": VaultInfo(
            description="Executive vault - Runway, Budget, People (sensitive)",
            access="c-level only (requires role=exec/admin + mcp:exec scope)",
            folders=exec_folders,
            priority_files=exec_priority_files,
            disclosure_policy=exec_disclosure_policy
        )
    }

    # 4. 라우팅 가이드
    routing_guide = [
        RoutingGuideItem(**item) for item in ROUTING_GUIDE
    ]

    # 5. 엔티티 통계 (public만 실시간, exec는 보안상 제외)
    entity_stats = {
        "public": {
            "Project": len(cache.get_all_projects()),
            "Task": len(cache.get_all_tasks()),
            "Hypothesis": len(cache.get_all_hypotheses()),
            "Track": len(cache.get_all_tracks()),
            "Condition": len(cache.get_all_conditions()),
            "Program": len(cache.get_all_programs()),
        },
        "exec": {
            "note": "Use /api/mcp/exec-context for exec vault stats (requires auth)"
        }
    }

    # 6. 빠른 접근 링크
    quick_links = {
        "search": "/api/mcp/search-and-read?q={keyword}",
        "file_read": "/api/mcp/file-read?paths={path}",
        "project_detail": "/api/mcp/project/{project_id}/context?include_body=true",
        "track_detail": "/api/mcp/track/{track_id}/context",
        "status_summary": "/api/mcp/status-summary",
        "vault_full_scan": "/api/mcp/vault-full-scan?depth=summary",
        "exec_context": "/api/mcp/exec-context (requires mcp:exec scope)",
        "exec_read": "/api/mcp/exec-read?paths={path} (requires mcp:exec scope)",
    }

    return VaultNavigationResponse(
        dual_vault=dual_vault,
        routing_guide=routing_guide,
        entity_stats=entity_stats,
        quick_links=quick_links,
        generated_at=datetime.now().isoformat()
    )


# ============================================
# Exec Vault Endpoints (RBAC Protected)
# ============================================

@router.get("/exec-context")
async def get_exec_context(request: Request):
    """
    Exec Vault (loop_exec) 구조 + 현황

    C-Level 전용 민감 데이터 (Runway, Budget, People 등) 접근.
    role=admin 또는 role=exec + mcp:exec scope 필요.
    """
    # RBAC 권한 확인
    role, scope = require_exec_access(request)

    exec_vault = get_exec_vault_dir()
    if not exec_vault.exists():
        raise HTTPException(status_code=500, detail="Exec vault not found")

    # 폴더 구조 탐색
    folders = {}
    for item in exec_vault.iterdir():
        if item.is_dir() and not item.name.startswith('.'):
            md_files = list(item.glob("*.md"))
            folders[item.name] = {
                "file_count": len(md_files),
                "files": [f.name for f in md_files[:10]]  # 최대 10개만
            }

    # 엔트리 포인트 확인
    entry_point = exec_vault / "_ENTRY_POINT.md"
    entry_content = None
    if entry_point.exists():
        entry_content = entry_point.read_text(encoding='utf-8')[:2000]

    return {
        "vault_path": str(exec_vault),
        "folders": folders,
        "entry_point": entry_content,
        "access_info": {
            "role": role,
            "scope": scope
        }
    }


@router.get("/exec-read")
async def exec_read(
    request: Request,
    paths: str = Query(..., description="읽을 파일 경로들 (쉼표 구분, exec vault 상대 경로)")
):
    """
    Exec Vault 파일 읽기

    경로 예시: `_ENTRY_POINT.md` 또는 `50_Projects/P015/Tasks/some_file.md`
    여러 파일: `paths=file1.md,file2.md`
    """
    # RBAC 권한 확인
    role, scope = require_exec_access(request)

    exec_vault = get_exec_vault_dir()
    if not exec_vault.exists():
        raise HTTPException(status_code=500, detail="Exec vault not found")

    path_list = [p.strip() for p in paths.split(",") if p.strip()]
    if not path_list:
        raise HTTPException(status_code=400, detail="No paths provided")

    results = []
    for rel_path in path_list[:10]:  # 최대 10개 파일
        file_path = exec_vault / rel_path

        # 경로 탈출 방지
        try:
            file_path.resolve().relative_to(exec_vault.resolve())
        except ValueError:
            results.append({
                "path": rel_path,
                "error": "Path traversal not allowed"
            })
            continue

        if not file_path.exists():
            results.append({
                "path": rel_path,
                "error": "File not found"
            })
            continue

        try:
            content = file_path.read_text(encoding='utf-8')
            frontmatter, body = extract_frontmatter_and_body(file_path)
            body_truncated, was_truncated = truncate_body(body, 5000)

            results.append({
                "path": rel_path,
                "frontmatter": frontmatter,
                "body": body_truncated,
                "truncated": was_truncated
            })
        except Exception as e:
            results.append({
                "path": rel_path,
                "error": str(e)
            })

    return {
        "files": results,
        "access_info": {
            "role": role,
            "scope": scope
        }
    }


@router.get("/exec-search")
async def exec_search(
    request: Request,
    q: str = Query(..., description="검색 키워드"),
    max_results: int = Query(20, ge=1, le=50, description="최대 결과 수")
):
    """
    Exec Vault 검색

    파일명과 내용에서 키워드 검색. 매칭된 파일 목록과 미리보기 반환.
    """
    # RBAC 권한 확인
    role, scope = require_exec_access(request)

    exec_vault = get_exec_vault_dir()
    if not exec_vault.exists():
        raise HTTPException(status_code=500, detail="Exec vault not found")

    query_lower = q.lower()
    matches = []

    for md_file in exec_vault.rglob("*.md"):
        # 숨김 폴더 제외
        if any(part.startswith('.') for part in md_file.parts):
            continue

        rel_path = md_file.relative_to(exec_vault)

        # 파일명 매칭
        name_match = query_lower in md_file.name.lower()

        # 내용 매칭
        content_match = False
        preview = ""
        try:
            content = md_file.read_text(encoding='utf-8')
            if query_lower in content.lower():
                content_match = True
                # 매칭 위치 주변 미리보기
                idx = content.lower().find(query_lower)
                start = max(0, idx - 50)
                end = min(len(content), idx + len(q) + 100)
                preview = "..." + content[start:end] + "..."
        except Exception:
            pass

        if name_match or content_match:
            matches.append({
                "path": str(rel_path),
                "name_match": name_match,
                "content_match": content_match,
                "preview": preview[:200] if preview else None
            })

            if len(matches) >= max_results:
                break

    return {
        "query": q,
        "total_matches": len(matches),
        "results": matches,
        "access_info": {
            "role": role,
            "scope": scope
        }
    }


# ============================================
# Admin Endpoints (tsk-017-09: Program-Round Join)
# ============================================

# 민감 필드 목록 - 응답에서 제외
SENSITIVE_FIELDS = {
    "salary", "contract_terms", "budget_details", "personal_info",
    "bank_account", "ssn", "password", "token", "secret"
}

# Program 응답에 포함할 안전한 필드 (화이트리스트)
PROGRAM_SAFE_FIELDS = {
    "entity_id", "entity_name", "entity_type", "status", "program_type",
    "parent_id", "tags", "created", "updated", "aliases"
}

# Round(Project) 응답에 포함할 안전한 필드 (화이트리스트)
ROUND_SAFE_FIELDS = {
    "entity_id", "entity_name", "status", "owner", "cycle",
    "created", "updated", "hypothesis_text", "parent_id", "conditions_3y"
}


def _normalize_date(value) -> Optional[str]:
    """날짜 값을 문자열로 정규화 (None 처리 포함)"""
    if value is None:
        return None
    if hasattr(value, 'isoformat'):
        return value.isoformat()
    str_val = str(value)
    if str_val in ('None', 'null', ''):
        return None
    return str_val


def _filter_sensitive_fields(data: Dict[str, Any], safe_fields: set) -> Dict[str, Any]:
    """안전한 필드만 필터링하여 반환"""
    return {k: v for k, v in data.items() if k in safe_fields}


def _scan_exec_rounds_sync(exec_vault: Path, program_id: str, limit: int = 100) -> Tuple[List[Dict[str, Any]], int]:
    """
    exec vault에서 program_id 일치하는 Project(Round) 스캔 (동기 버전)

    Codex 피드백 반영:
    - 개별 파일 파싱 에러 catch (전체 실패 방지)
    - limit 적용하여 무한 스캔 방지
    - 민감 필드 화이트리스트 적용
    - total_available 반환하여 페이지네이션 지원

    Returns:
        (rounds, total_available): 매칭된 rounds 리스트와 전체 개수
    """
    import logging
    logger = logging.getLogger(__name__)

    rounds = []
    total_available = 0

    if not exec_vault.exists():
        return rounds, 0

    for md_file in exec_vault.rglob("*.md"):
        # 숨김 파일/폴더 제외
        if any(part.startswith('.') for part in md_file.parts):
            continue

        try:
            frontmatter, _ = extract_frontmatter_and_body(md_file)
            if not frontmatter:
                continue

            # Project 타입이 아니면 스킵
            if frontmatter.get('entity_type') != 'Project':
                continue

            # program_id 일치 확인
            if frontmatter.get('program_id') != program_id:
                continue

            # 매칭된 Round 발견
            total_available += 1

            # limit 이후는 count만 하고 데이터는 수집하지 않음
            if len(rounds) >= limit:
                continue

            # 안전한 필드만 추출
            conditions_3y = frontmatter.get('conditions_3y', [])
            if not isinstance(conditions_3y, list):
                conditions_3y = []

            round_data = {
                "project_id": frontmatter.get('entity_id', ''),
                "entity_name": frontmatter.get('entity_name', ''),
                "status": frontmatter.get('status', 'unknown'),
                "owner": frontmatter.get('owner', ''),
                "cycle": frontmatter.get('cycle'),
                "created": _normalize_date(frontmatter.get('created')),
                "updated": _normalize_date(frontmatter.get('updated')),
                "hypothesis_text": frontmatter.get('hypothesis_text'),
                "parent_id": frontmatter.get('parent_id'),
                "conditions_3y": conditions_3y
            }

            rounds.append(round_data)

        except Exception as e:
            # 개별 파일 에러는 로그만 남기고 계속 진행
            logger.warning(f"Error parsing {md_file}: {e}")
            continue

    sorted_rounds = sorted(rounds, key=lambda x: x.get('project_id', ''))
    return sorted_rounds, total_available


async def _scan_exec_rounds(exec_vault: Path, program_id: str, limit: int = 100) -> Tuple[List[Dict[str, Any]], int]:
    """
    exec vault에서 program_id 일치하는 Project(Round) 스캔 (비동기 버전)

    Codex 피드백: 파일 I/O를 threadpool에서 실행하여 이벤트 루프 블로킹 방지
    """
    import asyncio
    return await asyncio.to_thread(_scan_exec_rounds_sync, exec_vault, program_id, limit)


@router.get("/admin/programs/{pgm_id}/rounds")
async def get_program_rounds(
    request: Request,
    pgm_id: str,
    limit: int = Query(100, ge=1, le=500, description="최대 반환 Round 수")
):
    """
    Program + 연결된 Round(Project) 조인 조회

    LOOP vault에서 Program 정보를 조회하고,
    exec vault에서 해당 program_id를 가진 Project(Round)들을 스캔하여 조인.

    **권한 요구사항**:
    - role: admin (exec 또는 admin role 필요)
    - scope: mcp:exec (exec vault 접근 권한)

    **민감 필드 제외**:
    - salary, contract_terms, budget_details 등 민감 정보는 응답에서 제외

    **에러 코드**:
    - 403: 권한 없음 (admin role 아님)
    - 404: Program을 찾을 수 없음
    - 500: exec vault 접근 실패

    Args:
        pgm_id: Program ID (예: pgm-vault-system)
        limit: 최대 반환 Round 수 (기본 100, 최대 500)

    Returns:
        ProgramRoundsResponse: Program 정보 + Round 목록
    """
    # 1. Admin 권한 검증
    role, scope = require_exec_access(request)

    # Codex 피드백: 명시적 admin role 체크
    # require_exec_access는 exec 또는 admin을 허용하지만,
    # 이 엔드포인트는 admin 전용으로 제한
    if role != "admin":
        raise HTTPException(
            status_code=403,
            detail=f"Admin role required for this endpoint (current role: {role})"
        )

    # 2. LOOP vault에서 Program 조회
    cache = get_cache()
    program = cache.get_program(pgm_id)

    if not program:
        raise HTTPException(
            status_code=404,
            detail=f"Program not found: {pgm_id}"
        )

    # 3. Program 정보에서 안전한 필드만 추출
    from ..models.entities import ProgramSummary, RoundSummary, ProgramRoundsResponse

    program_tags = program.get('tags', [])
    if not isinstance(program_tags, list):
        program_tags = []

    program_summary = ProgramSummary(
        entity_id=program.get('entity_id', ''),
        entity_name=program.get('entity_name', ''),
        entity_type=program.get('entity_type', 'Program'),
        status=program.get('status'),
        program_type=program.get('program_type'),
        parent_id=program.get('parent_id'),
        tags=program_tags,
        created=_normalize_date(program.get('created')),
        updated=_normalize_date(program.get('updated'))
    )

    # 4. VaultCache에서 program_id 일치하는 프로젝트 조회 (exec vault 포함)
    # tsk-018-01: VaultCache 사용으로 변경 (exec vault 프로젝트도 캐시에서 조회)
    all_matching_projects = cache.get_projects_by_program_id(pgm_id)
    total_available = len(all_matching_projects)
    round_data_list = all_matching_projects[:limit]  # limit 적용

    # 5. RoundSummary 모델로 변환
    rounds = [
        RoundSummary(
            project_id=r.get('entity_id', ''),  # entity_id를 project_id로 매핑
            entity_name=r.get('entity_name', ''),
            status=r.get('status', 'unknown'),
            owner=r.get('owner', ''),
            cycle=r.get('cycle'),
            created=_normalize_date(r.get('created')),  # date → string 변환
            updated=_normalize_date(r.get('updated')),  # date → string 변환
            hypothesis_text=r.get('hypothesis_text'),
            parent_id=r.get('parent_id'),
            conditions_3y=r.get('conditions_3y', [])
        )
        for r in round_data_list
    ]

    # 6. 응답 반환
    # Codex 피드백: total_count는 전체 개수, returned_count는 반환된 개수
    return ProgramRoundsResponse(
        program=program_summary,
        rounds=rounds,
        total_count=total_available,
        returned_count=len(rounds),
        limit_applied=limit
    )
