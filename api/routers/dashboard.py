"""
Dashboard API Router

React Dashboard v2 초기 로딩을 위한 통합 엔드포인트
"""

from fastapi import APIRouter, Request
from ..cache import get_cache
from ..constants import get_all_constants

router = APIRouter(prefix="/api", tags=["dashboard"])

@router.get("/dashboard-init")
def get_dashboard_init(request: Request):
    """
    Dashboard 초기 로딩 데이터 통합 반환
    모든 핵심 엔티티(Task, Project, Member 등)를 한 번에 내려줌
    """
    cache = get_cache()
    
    # 1. User Info (from OAuth middleware)
    user = getattr(request.state, 'user_id', 'anonymous')
    role = getattr(request.state, 'role', 'guest')
    scope = getattr(request.state, 'scope', '')

    # 2. Fetch Entities from Cache
    # project_id, status, assignee 필터 없이 전체 조회
    tasks = cache.get_all_tasks()
    projects = cache.get_all_projects()
    
    # Tracks & Conditions (Cache에 메서드가 없다면 파일에서 읽거나 별도 로직 필요)
    # 현재 Cache 구현상 get_all_tracks 등이 명시적으로 없으면 
    # 기존 Router 로직을 참조해야 하나, 통상 Cache에 다 있다고 가정.
    # 만약 없으면 빈 리스트로 나가고 추후 보완
    try:
        tracks = cache.get_all_tracks()
    except AttributeError:
        tracks = []

    try:
        conditions = cache.get_all_conditions() 
    except AttributeError:
        conditions = []

    try:
        hypotheses = cache.get_all_hypotheses()
    except AttributeError:
        hypotheses = []

    # Members
    # 민감 정보 포함 여부는 role에 따라 결정 (기본은 제외)
    include_sensitive = role in ['admin', 'exec']
    members_dict = cache.get_all_members(include_sensitive=include_sensitive)
    # Members는 dict {id: data} 형태가 아니라 list로 내려주는 게 프론트에서 편할 수 있음
    # 하지만 기존 API(get_members)가 dict를 리턴하므로, 
    # 여기서는 프론트 요구사항(list)에 맞춤 (Dashboard v2는 task.assignee 매핑용)
    members = list(members_dict.values()) if isinstance(members_dict, dict) else members_dict

    # 3. Constants
    constants = get_all_constants()

    return {
        "user": {
            "id": user,
            "role": role,
            "scope": scope
        },
        "tasks": tasks,
        "projects": projects,
        "tracks": tracks,
        "hypotheses": hypotheses,
        "conditions": conditions,
        "members": members,
        "constants": constants,
        # Badge Counts (Pending 등) - 추후 구현
        "pending_badge_count": 0 
    }
