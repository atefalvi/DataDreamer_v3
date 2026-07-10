"""Generation gate — protects the homelab GPU from concurrent overload.

Pure asyncio, in-process (single api container by ADR; Redis/Celery deliberately
deferred until uploads or multi-replica scaling exist). Semantics:

  try_acquire()  →  'ok'            got a slot immediately (caller MUST release)
                    'wait'          no slot; caller is counted in the bounded queue,
                                    should emit a 'waiting' UI state, then await
                                    wait_for_slot()
                    'session_busy'  this session already has a generation running
                    'queue_full'    server queue at capacity — reject cleanly
  wait_for_slot() → 'ok' | 'timeout'   (timeout leaves the queue cleanly)

Capacity values come from Directus config per call, so the owner can tune
concurrency live without restarts. One slow session can never block others
beyond occupying its single slot.
"""
from __future__ import annotations

import asyncio


class GenerationGate:
    def __init__(self) -> None:
        self._cond = asyncio.Condition()
        self._active = 0
        self._sessions: set[str] = set()
        self._waiting = 0

    @property
    def stats(self) -> dict:
        return {"active": self._active, "waiting": self._waiting}

    async def try_acquire(self, session_id: str, max_concurrent: int, max_queue: int) -> str:
        async with self._cond:
            if session_id in self._sessions:
                return "session_busy"
            if self._active < max_concurrent:
                self._active += 1
                self._sessions.add(session_id)
                return "ok"
            if self._waiting >= max_queue:
                return "queue_full"
            self._waiting += 1
            return "wait"

    async def wait_for_slot(self, session_id: str, max_concurrent: int, timeout: float) -> str:
        """Only valid after try_acquire returned 'wait'."""
        try:
            async with asyncio.timeout(timeout):
                async with self._cond:
                    while self._active >= max_concurrent or session_id in self._sessions:
                        await self._cond.wait()
                    self._waiting -= 1
                    self._active += 1
                    self._sessions.add(session_id)
                    return "ok"
        except TimeoutError:
            async with self._cond:
                self._waiting -= 1
            return "timeout"

    async def release(self, session_id: str) -> None:
        async with self._cond:
            if session_id in self._sessions:
                self._sessions.discard(session_id)
                self._active = max(0, self._active - 1)
            self._cond.notify_all()


gate = GenerationGate()
