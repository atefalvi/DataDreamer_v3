"""Discord notifications — backend-only, webhook from env, graceful no-op.

Deterministic events with cooldown + dedup (brief §11): no transcripts, no
uploaded content, no PII beyond what the rules explicitly whitelist. The
webhook URL arrives later; until ORBY_DISCORD_WEBHOOK_URL is set and Directus
`discord_enabled` is true, events are recorded in notification_events only.
"""
from __future__ import annotations

import logging
import uuid

import httpx

from . import db
from .settings import settings

log = logging.getLogger("orby.notify")

COOLDOWN_MINUTES = {
    "handoff_request": 10,   # per session
    "service_error": 30,     # global-ish via dedup key
    "security": 15,
}


async def emit(
    event_type: str,
    summary: str,
    session_id: uuid.UUID | None = None,
    dedup_key: str | None = None,
    discord_enabled: bool = False,
) -> None:
    database = await db.pool()
    key = dedup_key or f"{event_type}:{session_id}"
    cooldown = COOLDOWN_MINUTES.get(event_type, 15)
    recent = await database.fetchval(
        "SELECT count(*) FROM notification_events WHERE dedup_key=$1"
        " AND created_at > now() - ($2 || ' minutes')::interval",
        key, str(cooldown),
    )
    if recent:
        return

    status = "skipped"
    if discord_enabled and settings.discord_webhook_url:
        try:
            async with httpx.AsyncClient(timeout=8) as client:
                await client.post(
                    settings.discord_webhook_url,
                    json={"content": f"**Orby · {event_type}**\n{summary[:1500]}"},
                )
            status = "sent"
        except Exception as error:  # noqa: BLE001 — notification failure must never break chat
            log.warning("discord notify failed: %s", error)
            status = "failed"

    await database.execute(
        "INSERT INTO notification_events (session_id, event_type, summary, dedup_key, status, sent_at)"
        " VALUES ($1,$2,$3,$4,$5, CASE WHEN $5='sent' THEN now() END)",
        session_id, event_type, summary[:1000], key, status,
    )
