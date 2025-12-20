"""
Track API Router

Track 조회 엔드포인트
"""

from fastapi import APIRouter

from ..utils.vault_utils import extract_frontmatter, get_vault_dir

router = APIRouter(prefix="/api/tracks", tags=["tracks"])

# Vault 경로
VAULT_DIR = get_vault_dir()
TRACKS_DIR = VAULT_DIR / "20_Strategy/12M_Tracks"


@router.get("")
def get_tracks():
    """Track 목록 조회"""
    tracks = []

    if not TRACKS_DIR.exists():
        return {"tracks": []}

    for track_file in TRACKS_DIR.rglob("Track_*.md"):
        frontmatter = extract_frontmatter(track_file)
        if frontmatter and frontmatter.get('entity_type') == 'Track':
            frontmatter['_path'] = str(track_file.relative_to(VAULT_DIR))
            tracks.append(frontmatter)

    return {"tracks": sorted(tracks, key=lambda x: x.get('entity_id', ''))}
