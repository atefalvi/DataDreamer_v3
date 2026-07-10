"""Ollama client — embeddings + streaming chat, with optional fallback box.

Two homelab AI boxes may exist; ORBY_OLLAMA_URL is primary, ORBY_OLLAMA_FALLBACK_URL
optional. A request tries primary, then fallback, then raises OllamaUnavailable —
the orchestrator turns that into an honest 'offline' state, never a hang.
"""
from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator

import httpx

from .settings import settings

log = logging.getLogger("orby.ollama")


class OllamaUnavailable(Exception):
    pass


def _bases() -> list[str]:
    bases = [settings.ollama_url]
    if settings.ollama_fallback_url:
        bases.append(settings.ollama_fallback_url)
    return [base.rstrip("/") for base in bases if base]


async def embed(text: str, model: str, timeout: int = 30) -> list[float]:
    last: Exception | None = None
    for base in _bases():
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(
                    f"{base}/api/embeddings", json={"model": model, "prompt": text}
                )
                response.raise_for_status()
                embedding = response.json().get("embedding")
                if not embedding:
                    raise OllamaUnavailable("empty embedding")
                return embedding
        except Exception as error:  # noqa: BLE001
            last = error
            log.warning("embed failed on %s: %s", base, error)
    raise OllamaUnavailable(str(last))


async def chat_stream(
    messages: list[dict],
    model: str,
    temperature: float,
    max_tokens: int,
    timeout: int,
) -> AsyncIterator[str]:
    """Yield response text deltas. Tries primary then fallback before giving up."""
    last: Exception | None = None
    for base in _bases():
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(timeout, connect=5)) as client:
                async with client.stream(
                    "POST",
                    f"{base}/api/chat",
                    json={
                        "model": model,
                        "messages": messages,
                        "stream": True,
                        "options": {"temperature": temperature, "num_predict": max_tokens},
                    },
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if not line.strip():
                            continue
                        payload = json.loads(line)
                        delta = payload.get("message", {}).get("content", "")
                        if delta:
                            yield delta
                        if payload.get("done"):
                            return
                    return
        except Exception as error:  # noqa: BLE001
            last = error
            log.warning("chat failed on %s: %s", base, error)
    raise OllamaUnavailable(str(last))


async def health() -> dict:
    """Which boxes answer /api/version (no secrets, no model list exposure)."""
    out = {}
    for base in _bases():
        try:
            async with httpx.AsyncClient(timeout=4) as client:
                response = await client.get(f"{base}/api/version")
                out[base] = "ok" if response.status_code == 200 else f"http {response.status_code}"
        except Exception:  # noqa: BLE001
            out[base] = "unreachable"
    return out
