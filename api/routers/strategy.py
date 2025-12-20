"""
Strategy API Router

NorthStar, MetaHypothesis, ProductLine, PartnershipStage 조회 엔드포인트
"""

from fastapi import APIRouter

from ..utils.vault_utils import extract_frontmatter, get_vault_dir

router = APIRouter(prefix="/api/strategy", tags=["strategy"])

# Vault 경로
VAULT_DIR = get_vault_dir()
NORTH_STAR_DIR = VAULT_DIR / "01_North_Star"


@router.get("/northstar")
def get_northstar():
    """NorthStar (10년 비전) 조회"""
    northstars = []

    if not NORTH_STAR_DIR.exists():
        return {"northstars": []}

    for ns_file in NORTH_STAR_DIR.rglob("*.md"):
        if ns_file.name.startswith("_"):
            continue

        frontmatter = extract_frontmatter(ns_file)
        if frontmatter and frontmatter.get('entity_type') == 'NorthStar':
            frontmatter['_path'] = str(ns_file.relative_to(VAULT_DIR))
            northstars.append(frontmatter)

    return {"northstars": northstars}


@router.get("/metahypotheses")
def get_metahypotheses():
    """MetaHypothesis (MH1-4) 목록 조회"""
    metahypotheses = []

    if not NORTH_STAR_DIR.exists():
        return {"metahypotheses": []}

    for mh_file in NORTH_STAR_DIR.rglob("*.md"):
        if mh_file.name.startswith("_"):
            continue

        frontmatter = extract_frontmatter(mh_file)
        if frontmatter and frontmatter.get('entity_type') == 'MetaHypothesis':
            frontmatter['_path'] = str(mh_file.relative_to(VAULT_DIR))
            metahypotheses.append(frontmatter)

    return {"metahypotheses": sorted(metahypotheses, key=lambda x: x.get('entity_id', ''))}


@router.get("/productlines")
def get_productlines():
    """ProductLine (PL1-5) 목록 조회"""
    productlines = []

    # ProductLine은 20_Strategy 또는 별도 폴더에 있을 수 있음
    strategy_dir = VAULT_DIR / "20_Strategy"

    if not strategy_dir.exists():
        return {"productlines": []}

    for pl_file in strategy_dir.rglob("*.md"):
        if pl_file.name.startswith("_"):
            continue

        frontmatter = extract_frontmatter(pl_file)
        if frontmatter and frontmatter.get('entity_type') == 'ProductLine':
            frontmatter['_path'] = str(pl_file.relative_to(VAULT_DIR))
            productlines.append(frontmatter)

    return {"productlines": sorted(productlines, key=lambda x: x.get('entity_id', ''))}


@router.get("/partnershipstages")
def get_partnershipstages():
    """PartnershipStage (Stage 1-4) 목록 조회"""
    stages = []

    # PartnershipStage은 20_Strategy 또는 별도 폴더에 있을 수 있음
    strategy_dir = VAULT_DIR / "20_Strategy"

    if not strategy_dir.exists():
        return {"partnershipstages": []}

    for ps_file in strategy_dir.rglob("*.md"):
        if ps_file.name.startswith("_"):
            continue

        frontmatter = extract_frontmatter(ps_file)
        if frontmatter and frontmatter.get('entity_type') == 'PartnershipStage':
            frontmatter['_path'] = str(ps_file.relative_to(VAULT_DIR))
            stages.append(frontmatter)

    return {"partnershipstages": sorted(stages, key=lambda x: x.get('entity_id', ''))}
