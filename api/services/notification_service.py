"""
Discord Notification Service

Entity 생성 시 Discord 채널로 알림 전송

tsk-discord-notify-01: Discord webhook 기반 알림 시스템
"""

import os
import logging
import threading
from datetime import datetime
from typing import Optional, Dict, Any

import httpx

logger = logging.getLogger(__name__)

# Environment variables
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "")
DISCORD_NOTIFY_ENABLED = os.getenv("DISCORD_NOTIFY_ENABLED", "true").lower() == "true"
DASHBOARD_BASE_URL = os.getenv("DASHBOARD_BASE_URL", "https://mcp.sosilab.synology.me/v2")

# Embed colors by entity type
COLORS = {
    "Task": 0x3498db,      # Blue
    "Project": 0x2ecc71,   # Green
    "Program": 0x9b59b6,   # Purple
    "Hypothesis": 0xe67e22, # Orange
    "Comment": 0xf1c40f,   # Yellow (새 댓글 강조)
    "default": 0x95a5a6,   # Gray
}


def escape_discord_mentions(text: str) -> str:
    """
    Escape Discord special mentions to prevent unintended pings

    Converts @everyone and @here to use zero-width space to prevent pings
    while keeping the visual appearance

    Args:
        text: Input text potentially containing mentions

    Returns:
        Text with escaped mentions
    """
    text = text.replace("@everyone", "@\u200beveryone")
    text = text.replace("@here", "@\u200bhere")
    return text


def _send_discord_webhook(payload: Dict[str, Any]) -> bool:
    """
    Discord webhook 동기 호출 (별도 스레드에서 실행됨)

    Args:
        payload: Discord webhook payload (embeds 포함)

    Returns:
        성공 여부
    """
    if not DISCORD_WEBHOOK_URL:
        logger.warning("DISCORD_WEBHOOK_URL not set, skipping notification")
        return False

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(
                DISCORD_WEBHOOK_URL,
                json=payload
            )

            if response.status_code == 204:
                logger.info("Discord notification sent successfully")
                return True
            else:
                logger.warning(f"Discord webhook returned {response.status_code}: {response.text}")
                return False

    except httpx.TimeoutException:
        logger.error("Discord webhook timed out")
        return False
    except Exception as e:
        logger.error(f"Discord notification failed: {e}")
        return False


def _build_entity_url(
    entity_type: str,
    entity_id: str,
    extra_fields: Optional[Dict[str, str]] = None
) -> Optional[str]:
    """
    엔티티 타입과 ID로 Dashboard URL 생성

    Comment의 경우 target_type, target_entity를 사용하여 대상 페이지 URL 생성

    Args:
        entity_type: Task | Project | Program | Comment 등
        entity_id: 엔티티 ID
        extra_fields: 추가 필드 (Comment의 경우 target_type, target_entity 필요)

    Returns:
        Dashboard URL 또는 None (알 수 없는 타입)
    """
    if entity_type == "Task":
        return f"{DASHBOARD_BASE_URL}/tasks/{entity_id}"
    elif entity_type == "Project":
        return f"{DASHBOARD_BASE_URL}/projects/{entity_id}"
    elif entity_type == "Program":
        return f"{DASHBOARD_BASE_URL}/program"
    elif entity_type == "Comment":
        # Comment는 target 엔티티 페이지로 이동
        if not extra_fields:
            logger.warning("Comment notification missing extra_fields for URL generation")
            return None

        target_type = str(extra_fields.get("target_type", "")).lower()
        target_entity = str(extra_fields.get("target_entity", ""))

        if not target_type or not target_entity:
            logger.warning(f"Comment notification incomplete: target_type={target_type}, target_entity={target_entity}")
            return None

        # Map entity type to URL path (proper pluralization)
        type_to_path = {
            "task": "tasks",
            "project": "projects",
        }

        path = type_to_path.get(target_type)
        if not path:
            logger.warning(f"Unknown Comment target_type: {target_type}")
            return None

        return f"{DASHBOARD_BASE_URL}/{path}/{target_entity}"
    else:
        logger.debug(f"No Dashboard URL mapping for entity_type: {entity_type}")
        return None


def send_entity_created_notification(
    entity_type: str,
    entity_id: str,
    entity_name: str,
    actor: Optional[str] = None,
    extra_fields: Optional[Dict[str, str]] = None
) -> None:
    """
    Entity 생성 알림을 Discord로 전송 (비동기, fire-and-forget)

    Args:
        entity_type: Task | Project | Program | Hypothesis | Comment
        entity_id: 엔티티 ID
        entity_name: 엔티티 이름
        actor: 생성자 (예: "api:김은향")
        extra_fields: 추가 필드 (status, assignee, content 등)
    """
    if not DISCORD_NOTIFY_ENABLED:
        logger.debug("Discord notifications disabled")
        return

    if not DISCORD_WEBHOOK_URL:
        logger.debug("DISCORD_WEBHOOK_URL not configured")
        return

    # Build embed
    color = COLORS.get(entity_type, COLORS["default"])
    timestamp = datetime.utcnow().isoformat() + "Z"

    # Clean up actor display
    actor_display = actor or "api"
    if actor_display.startswith("api:"):
        actor_display = actor_display[4:]  # Remove "api:" prefix

    fields = [
        {"name": "ID", "value": f"`{entity_id}`", "inline": True},
        {"name": "Type", "value": entity_type, "inline": True},
        {"name": "Created by", "value": actor_display, "inline": True},
    ]

    # Special handling for Comment: show content in description
    description = f"**{entity_name}**"
    if entity_type == "Comment" and extra_fields and extra_fields.get("content"):
        # Escape Discord mentions and limit length
        content = escape_discord_mentions(str(extra_fields["content"]))
        if len(content) > 300:
            content = content[:297] + "..."
        description = content

    # Add extra fields (excluding content for Comments as it's in description)
    if extra_fields:
        for key, value in extra_fields.items():
            if value and key != "content":  # Skip content for Comments
                # Don't show internal fields in Discord
                if key not in ["target_type", "target_entity"]:
                    fields.append({"name": key.title(), "value": str(value), "inline": True})

    embed = {
        "title": f"New {entity_type} Created",
        "description": description,
        "color": color,
        "fields": fields,
        "timestamp": timestamp,
        "footer": {"text": "LOOP Vault"}
    }

    # Add URL for clickable embed title
    entity_url = _build_entity_url(entity_type, entity_id, extra_fields)
    if entity_url:
        embed["url"] = entity_url

    payload = {"embeds": [embed]}

    # Fire-and-forget: 별도 스레드에서 실행
    thread = threading.Thread(
        target=_send_discord_webhook,
        args=(payload,),
        daemon=True
    )
    thread.start()

    logger.debug(f"Discord notification queued for {entity_type} {entity_id}")
