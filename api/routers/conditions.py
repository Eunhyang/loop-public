"""
Condition API Router

3-Year Conditions 조회 엔드포인트
"""

from fastapi import APIRouter

from ..utils.vault_utils import extract_frontmatter, get_vault_dir

router = APIRouter(prefix="/api/conditions", tags=["conditions"])

# Vault 경로
VAULT_DIR = get_vault_dir()
CONDITIONS_DIR = VAULT_DIR / "20_Strategy/3Y_Conditions_2026-2028"


@router.get("")
def get_conditions():
    """Condition 목록 조회"""
    conditions = []

    if not CONDITIONS_DIR.exists():
        return {"conditions": []}

    # Search for all .md files in 3Y_Conditions
    for cond_file in CONDITIONS_DIR.rglob("*.md"):
        # Skip _INDEX.md and other utility files
        if cond_file.name.startswith("_"):
            continue

        frontmatter = extract_frontmatter(cond_file)
        if frontmatter and frontmatter.get('entity_type') == 'Condition':
            frontmatter['_path'] = str(cond_file.relative_to(VAULT_DIR))
            conditions.append(frontmatter)

    return {"conditions": sorted(conditions, key=lambda x: x.get('entity_id', ''))}
