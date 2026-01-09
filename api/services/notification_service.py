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

# Embed colors by entity type
COLORS = {
    "Task": 0x3498db,      # Blue
    "Project": 0x2ecc71,   # Green
    "Program": 0x9b59b6,   # Purple
    "Hypothesis": 0xe67e22, # Orange
    "default": 0x95a5a6,   # Gray
}


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
        entity_type: Task | Project | Program | Hypothesis
        entity_id: 엔티티 ID
        entity_name: 엔티티 이름
        actor: 생성자 (예: "api:김은향")
        extra_fields: 추가 필드 (status, assignee 등)
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

    # Add extra fields
    if extra_fields:
        for key, value in extra_fields.items():
            if value:
                fields.append({"name": key.title(), "value": str(value), "inline": True})

    embed = {
        "title": f"New {entity_type} Created",
        "description": f"**{entity_name}**",
        "color": color,
        "fields": fields,
        "timestamp": timestamp,
        "footer": {"text": "LOOP Vault"}
    }

    payload = {"embeds": [embed]}

    # Fire-and-forget: 별도 스레드에서 실행
    thread = threading.Thread(
        target=_send_discord_webhook,
        args=(payload,),
        daemon=True
    )
    thread.start()

    logger.debug(f"Discord notification queued for {entity_type} {entity_id}")
