"""
Hypothesis API Router

Hypothesis 조회 엔드포인트
"""

from fastapi import APIRouter

from ..utils.vault_utils import extract_frontmatter, get_vault_dir

router = APIRouter(prefix="/api/hypotheses", tags=["hypotheses"])

# Vault 경로
VAULT_DIR = get_vault_dir()
HYPOTHESES_DIR = VAULT_DIR / "60_Hypotheses"


@router.get("")
def get_hypotheses():
    """Hypothesis 목록 조회"""
    hypotheses = []

    if not HYPOTHESES_DIR.exists():
        return {"hypotheses": []}

    # Search for all .md files in 60_Hypotheses
    for hyp_file in HYPOTHESES_DIR.rglob("*.md"):
        # Skip _INDEX.md and other utility files
        if hyp_file.name.startswith("_"):
            continue

        frontmatter = extract_frontmatter(hyp_file)
        if frontmatter and frontmatter.get('entity_type') == 'Hypothesis':
            frontmatter['_path'] = str(hyp_file.relative_to(VAULT_DIR))
            hypotheses.append(frontmatter)

    return {"hypotheses": sorted(hypotheses, key=lambda x: x.get('entity_id', ''))}
