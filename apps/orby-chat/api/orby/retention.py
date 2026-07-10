"""Retention job — deletes sessions (and cascaded messages) idle beyond the
Directus-configured window. Run daily:  python -m orby.retention"""
from __future__ import annotations

import asyncio
import logging

from . import db
from .config import loader


async def _main() -> None:
    logging.basicConfig(level=logging.INFO)
    await db.migrate()
    cfg = await loader.get()
    from .sessions import purge_expired

    deleted = await purge_expired(cfg.retain_chat_days)
    print(f"retention: deleted {deleted} session(s) idle > {cfg.retain_chat_days} days")
    await db.close()


if __name__ == "__main__":
    asyncio.run(_main())
