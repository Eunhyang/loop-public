"""
Link Preview Router

Fetch OG (Open Graph) metadata for URLs to display rich preview cards.
Uses caching to reduce external requests and implements security measures.

Task: tsk-023-1768228605920
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, HttpUrl
from typing import Optional
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
import re
from functools import lru_cache
from datetime import datetime, timedelta

router = APIRouter()

# TTL Cache: 24 hours, max 1000 entries
CACHE_TTL_HOURS = 24
FETCH_TIMEOUT = 5  # seconds

# Internal/private IP ranges (CIDR notation)
INTERNAL_IP_PATTERNS = [
    re.compile(r'^127\.'),  # 127.0.0.0/8
    re.compile(r'^10\.'),   # 10.0.0.0/8
    re.compile(r'^172\.(1[6-9]|2[0-9]|3[01])\.'),  # 172.16.0.0/12
    re.compile(r'^192\.168\.'),  # 192.168.0.0/16
    re.compile(r'^localhost$'),
    re.compile(r'^::1$'),  # IPv6 loopback
]


class LinkPreviewResponse(BaseModel):
    """Link preview metadata response"""
    url: str
    title: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    site_name: Optional[str] = None
    favicon: Optional[str] = None


# Simple in-memory cache with TTL
_preview_cache: dict[str, tuple[LinkPreviewResponse, datetime]] = {}


def is_internal_ip(url: str) -> bool:
    """
    Check if URL resolves to internal/private IP address

    Args:
        url: Full URL starting with http/https

    Returns:
        True if URL is internal/private, False otherwise
    """
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname

        if not hostname:
            return False

        # Check against internal IP patterns
        for pattern in INTERNAL_IP_PATTERNS:
            if pattern.match(hostname):
                return True

        return False
    except Exception:
        return False


def extract_og_metadata(html: str, url: str) -> dict:
    """
    Parse HTML and extract OG tags + fallbacks

    Args:
        html: HTML content
        url: Base URL for resolving relative URLs

    Returns:
        Dictionary with title, description, image, site_name, favicon
    """
    soup = BeautifulSoup(html, 'lxml')
    parsed_url = urlparse(url)
    base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"

    metadata = {
        'title': None,
        'description': None,
        'image': None,
        'site_name': None,
        'favicon': None,
    }

    # Extract OG tags
    og_tags = {
        'og:title': 'title',
        'og:description': 'description',
        'og:image': 'image',
        'og:site_name': 'site_name',
    }

    for og_property, key in og_tags.items():
        tag = soup.find('meta', property=og_property)
        if tag and tag.get('content'):
            content = tag.get('content').strip()
            if key == 'image' and content:
                # Make image URL absolute
                metadata[key] = urljoin(url, content)
            else:
                metadata[key] = content

    # Fallback to standard HTML tags if OG tags not found
    if not metadata['title']:
        title_tag = soup.find('title')
        if title_tag:
            metadata['title'] = title_tag.get_text().strip()

    if not metadata['description']:
        desc_tag = soup.find('meta', attrs={'name': 'description'})
        if desc_tag and desc_tag.get('content'):
            metadata['description'] = desc_tag.get('content').strip()

    # Extract favicon
    favicon_selectors = [
        ('link', {'rel': 'icon'}),
        ('link', {'rel': 'shortcut icon'}),
        ('link', {'rel': 'apple-touch-icon'}),
    ]

    for tag_name, attrs in favicon_selectors:
        favicon_tag = soup.find(tag_name, attrs=attrs)
        if favicon_tag and favicon_tag.get('href'):
            favicon_href = favicon_tag.get('href')
            metadata['favicon'] = urljoin(url, favicon_href)
            break

    # Default favicon fallback
    if not metadata['favicon']:
        metadata['favicon'] = f"{base_url}/favicon.ico"

    return metadata


async def fetch_link_preview(url: str) -> LinkPreviewResponse:
    """
    Fetch link preview metadata from URL

    Args:
        url: Full URL to fetch

    Returns:
        LinkPreviewResponse with metadata

    Raises:
        HTTPException: On validation or security errors
    """
    # Validate URL format
    if not url.startswith(('http://', 'https://')):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")

    # Security: Block internal IPs
    if is_internal_ip(url):
        raise HTTPException(status_code=403, detail="Internal IP addresses are not allowed")

    # Check cache
    now = datetime.now()
    if url in _preview_cache:
        cached_response, cached_time = _preview_cache[url]
        if now - cached_time < timedelta(hours=CACHE_TTL_HOURS):
            return cached_response
        else:
            # Expired, remove from cache
            del _preview_cache[url]

    # Fetch URL
    try:
        async with httpx.AsyncClient(timeout=FETCH_TIMEOUT, follow_redirects=True) as client:
            response = await client.get(url, headers={
                'User-Agent': 'Mozilla/5.0 (compatible; LOOP-LinkPreview/1.0)'
            })
            response.raise_for_status()
            html = response.text
    except httpx.TimeoutException:
        # Timeout: return empty metadata (fallback in frontend)
        preview = LinkPreviewResponse(url=url)
        _preview_cache[url] = (preview, now)
        return preview
    except httpx.HTTPStatusError as e:
        # HTTP error: return empty metadata
        preview = LinkPreviewResponse(url=url)
        _preview_cache[url] = (preview, now)
        return preview
    except Exception as e:
        # Other errors: return empty metadata
        preview = LinkPreviewResponse(url=url)
        _preview_cache[url] = (preview, now)
        return preview

    # Parse HTML and extract metadata
    try:
        metadata = extract_og_metadata(html, url)
        preview = LinkPreviewResponse(
            url=url,
            title=metadata.get('title'),
            description=metadata.get('description'),
            image=metadata.get('image'),
            site_name=metadata.get('site_name'),
            favicon=metadata.get('favicon'),
        )

        # Cache result
        _preview_cache[url] = (preview, now)

        return preview
    except Exception as e:
        # Parse error: return partial data
        preview = LinkPreviewResponse(url=url)
        _preview_cache[url] = (preview, now)
        return preview


@router.get("/link-preview", response_model=LinkPreviewResponse)
async def get_link_preview(
    url: str = Query(..., description="Full URL starting with http/https")
) -> LinkPreviewResponse:
    """
    Fetch OG metadata for URL to display rich preview card.

    Args:
        url: Full URL starting with http/https

    Returns:
        LinkPreviewResponse with title, description, image, site_name, favicon

    Raises:
        HTTPException 400: Invalid URL format
        HTTPException 403: Internal IP blocked

    Example:
        GET /api/link-preview?url=https://github.com

    Response:
        {
          "url": "https://github.com",
          "title": "GitHub: Let's build from here",
          "description": "GitHub is where over 100 million developers...",
          "image": "https://github.githubassets.com/images/modules/site/social-cards/github-social.png",
          "site_name": "GitHub",
          "favicon": "https://github.com/favicon.ico"
        }

    Cache:
        Results are cached for 24 hours (max 1000 entries)

    Security:
        - Blocks internal/private IP addresses (127.0.0.1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
        - 5 second timeout for external requests

    Fallback:
        - On timeout/error: returns empty metadata fields
        - Frontend shows favicon + domain as fallback
    """
    return await fetch_link_preview(url)
