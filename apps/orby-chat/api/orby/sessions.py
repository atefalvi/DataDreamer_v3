"""Visitors, sessions, messages, rate limits.

Privacy: raw visitor tokens and IPs are never stored — only peppered SHA-256
hashes. Rate limiting is in-memory (single container, ADR-documented); budgets
(message length, per-session caps) come from Directus config.
"""
from __future__ import annotations

import hashlib
import time
import uuid

from . import db
from .settings import settings


def peppered(value: str) -> str:
    return hashlib.sha256(f"{settings.hash_pepper}:{value}".encode()).hexdigest()


async def ensure_visitor(anon_token: str) -> uuid.UUID:
    database = await db.pool()
    token_hash = peppered(anon_token)
    row = await database.fetchrow(
        "INSERT INTO chat_visitors (anon_token_hash) VALUES ($1)"
        " ON CONFLICT (anon_token_hash) DO UPDATE SET last_seen_at = now()"
        " RETURNING id",
        token_hash,
    )
    return row["id"]


async def ensure_session(
    visitor_id: uuid.UUID,
    session_id: str | None,
    client_ip: str,
    user_agent: str,
    referrer: str,
) -> uuid.UUID:
    database = await db.pool()
    if session_id:
        try:
            row = await database.fetchrow(
                "UPDATE chat_sessions SET last_activity_at = now()"
                " WHERE id = $1 AND visitor_id = $2 RETURNING id",
                uuid.UUID(session_id), visitor_id,
            )
            if row:
                return row["id"]
        except ValueError:
            pass  # malformed id → new session
    row = await database.fetchrow(
        "INSERT INTO chat_sessions (visitor_id, client_ip_hash, user_agent, referrer)"
        " VALUES ($1,$2,$3,$4) RETURNING id",
        visitor_id, peppered(client_ip), user_agent[:300], referrer[:500],
    )
    return row["id"]


async def session_message_count(session_id: uuid.UUID) -> int:
    database = await db.pool()
    return await database.fetchval(
        "SELECT message_count FROM chat_sessions WHERE id=$1", session_id
    ) or 0


async def save_message(
    session_id: uuid.UUID,
    role: str,
    content: str,
    classification: str | None = None,
    model: str | None = None,
    latency_ms: int | None = None,
    sources: str | None = None,
    client_msg_id: str | None = None,
) -> None:
    database = await db.pool()
    await database.execute(
        "INSERT INTO chat_messages (session_id, role, content, classification, model, latency_ms, sources, client_msg_id)"
        " VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)"
        " ON CONFLICT DO NOTHING",  # retries with the same client key never duplicate
        session_id, role, content, classification, model, latency_ms, sources, client_msg_id,
    )
    await database.execute(
        "UPDATE chat_sessions SET message_count = message_count + 1, last_activity_at = now() WHERE id=$1",
        session_id,
    )


async def recent_history(session_id: uuid.UUID, turns: int) -> list[dict]:
    database = await db.pool()
    rows = await database.fetch(
        "SELECT role, content FROM chat_messages WHERE session_id=$1 AND role IN ('user','assistant')"
        " ORDER BY created_at DESC LIMIT $2",
        session_id, turns * 2,
    )
    return [{"role": r["role"], "content": r["content"]} for r in reversed(rows)]


async def log_safety_event(session_id: uuid.UUID | None, event_type: str, detail: str) -> None:
    database = await db.pool()
    await database.execute(
        "INSERT INTO safety_events (session_id, event_type, detail) VALUES ($1,$2,$3)",
        session_id, event_type, detail[:500],
    )


async def purge_expired(retain_days: int) -> int:
    """Retention job: drop sessions (and cascaded messages) idle beyond the window."""
    database = await db.pool()
    result = await database.execute(
        "DELETE FROM chat_sessions WHERE last_activity_at < now() - ($1 || ' days')::interval",
        str(retain_days),
    )
    return int(result.split()[-1]) if result else 0


class RateLimiter:
    """Fixed-window in-memory limiter keyed on hashed ip+visitor.

    Single-container deployment (ADR): no Redis needed. Windows are pruned lazily.
    """

    def __init__(self) -> None:
        self._hits: dict[str, list[float]] = {}

    def allow(self, key: str, per_minute: int) -> bool:
        now = time.monotonic()
        window = self._hits.setdefault(key, [])
        cutoff = now - 60
        while window and window[0] < cutoff:
            window.pop(0)
        if len(window) >= per_minute:
            return False
        window.append(now)
        if len(self._hits) > 10_000:  # memory guard against key churn
            self._hits = {k: v for k, v in self._hits.items() if v and v[-1] > cutoff}
        return True


rate_limiter = RateLimiter()


async def replay_for_client_key(session_id: uuid.UUID, client_msg_id: str) -> str | None:
    """If this client key was already answered, return the stored answer (idempotent
    retry → replay, never a second generation). None = not answered yet."""
    database = await db.pool()
    row = await database.fetchrow(
        """
        SELECT a.content FROM chat_messages u
        JOIN LATERAL (
          SELECT content FROM chat_messages a
          WHERE a.session_id = u.session_id AND a.role = 'assistant'
            AND a.created_at > u.created_at
          ORDER BY a.created_at ASC LIMIT 1
        ) a ON true
        WHERE u.session_id = $1 AND u.client_msg_id = $2 AND u.role = 'user'
        """,
        session_id, client_msg_id,
    )
    return row["content"] if row else None
