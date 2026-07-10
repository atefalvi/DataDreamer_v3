"""Postgres (pgvector) access — one pool, plain SQL, tiny migration runner.

Orby owns its own database (never DataDreamer's): visitors, sessions, messages,
knowledge chunks, safety/notification events. Parameterized SQL everywhere.
"""
from __future__ import annotations

import logging
from pathlib import Path

import asyncpg

from .settings import settings

log = logging.getLogger("orby.db")

MIGRATIONS_DIR = Path(__file__).parent / "migrations"

_pool: asyncpg.Pool | None = None


async def pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(settings.database_url, min_size=1, max_size=8)
    return _pool


async def close() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


async def migrate() -> None:
    """Apply migrations/NNN_*.sql in order, tracked in orby_migrations.

    The embedding dimension is templated into the SQL ({{EMBEDDING_DIM}}) because
    pgvector columns need a fixed dimension; it comes from env, not Directus, so it
    can't drift underneath the stored vectors.
    """
    db = await pool()
    await db.execute(
        "CREATE TABLE IF NOT EXISTS orby_migrations (name text PRIMARY KEY, applied_at timestamptz DEFAULT now())"
    )
    applied = {row["name"] for row in await db.fetch("SELECT name FROM orby_migrations")}
    for path in sorted(MIGRATIONS_DIR.glob("*.sql")):
        if path.name in applied:
            continue
        sql = path.read_text().replace("{{EMBEDDING_DIM}}", str(settings.embedding_dim))
        async with db.acquire() as conn, conn.transaction():
            await conn.execute(sql)
            await conn.execute("INSERT INTO orby_migrations (name) VALUES ($1)", path.name)
        log.info("applied migration %s", path.name)
