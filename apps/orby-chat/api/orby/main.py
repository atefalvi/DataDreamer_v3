"""Orby API — FastAPI app.

Routes:
  GET  /widget.js         the embeddable widget bundle (static)
  GET  /orby/*            sprite strips + manifest (static)
  GET  /api/boot          widget bootstrap: enabled/maintenance/welcome/handoff (no secrets)
  POST /api/chat          one user message → SSE stream (state/token/sources/handoff/done)
  GET  /health/live       process is up
  GET  /health/ready      db + config loaded
  GET  /health/dependencies  db/directus-config/ollama status (no secrets)

CORS is enforced from the Directus-config allowlist; every response from /api/*
is no-store. The widget is the only intended consumer.
"""
from __future__ import annotations

import json
import logging
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from . import chat, db, ollama, sessions
from .config import loader
from .settings import settings

logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","message":"%(message)s"}',
)
log = logging.getLogger("orby.api")

PUBLIC_DIR = Path(__file__).resolve().parents[2] / "public"


@asynccontextmanager
async def lifespan(_: FastAPI):
    await db.migrate()
    await loader.get()
    yield
    await db.close()


app = FastAPI(title="Orby", docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)
app.mount("/orby", StaticFiles(directory=PUBLIC_DIR / "orby"), name="orby-assets")


def _origin_allowed(request: Request, allowed: list[str]) -> str | None:
    origin = (request.headers.get("origin") or "").rstrip("/")
    if origin and origin in allowed:
        return origin
    if not settings.is_production and origin.startswith("http://localhost"):
        return origin
    return None


def _cors_headers(origin: str) -> dict[str, str]:
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": "content-type, x-orby-visitor, x-orby-session",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Vary": "Origin",
        "Cache-Control": "no-store",
    }


@app.options("/api/{rest:path}")
async def preflight(request: Request, rest: str):
    cfg = await loader.get()
    origin = _origin_allowed(request, cfg.allowed_origins)
    if not origin:
        return JSONResponse({"error": "origin"}, status_code=403)
    return JSONResponse({}, headers=_cors_headers(origin))


@app.get("/widget.js")
async def widget_js():
    return FileResponse(
        PUBLIC_DIR / "widget.js",
        media_type="text/javascript",
        headers={"Cache-Control": "public, max-age=300, stale-while-revalidate=86400"},
    )


@app.get("/api/boot")
async def boot(request: Request):
    """Everything the widget needs to decide whether/how to render. No secrets."""
    cfg = await loader.get()
    origin = _origin_allowed(request, cfg.allowed_origins)
    if not origin:
        return JSONResponse({"enabled": False}, status_code=403)
    return JSONResponse(
        {
            "enabled": cfg.enabled and not cfg.maintenance_mode,
            "maintenance": cfg.maintenance_mode,
            "maintenanceMessage": cfg.maintenance_message if cfg.maintenance_mode else None,
            "welcome": cfg.welcome_message,
            "maxMessageLength": cfg.max_message_length,
            "handoff": {"enabled": cfg.handoff_enabled and bool(cfg.cal_com_url), "cta": cfg.handoff_cta_text},
            "maxQueuedMessages": cfg.max_queued_messages_per_session,
        },
        headers=_cors_headers(origin),
    )


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    visitor: str = Field(min_length=16, max_length=100)
    session: str | None = Field(default=None, max_length=40)
    # Client idempotency key: retries reuse it → replay instead of re-generation.
    client_id: str | None = Field(default=None, min_length=8, max_length=64, pattern=r"^[\w-]+$")


@app.post("/api/chat")
async def api_chat(request: Request, body: ChatRequest):
    cfg = await loader.get()
    origin = _origin_allowed(request, cfg.allowed_origins)
    if not origin:
        return JSONResponse({"error": "origin"}, status_code=403)
    if not cfg.enabled:
        return JSONResponse({"error": "disabled"}, status_code=503, headers=_cors_headers(origin))
    if cfg.maintenance_mode:
        return JSONResponse(
            {"error": "maintenance", "message": cfg.maintenance_message},
            status_code=503, headers=_cors_headers(origin),
        )

    client_ip = request.headers.get("cf-connecting-ip") or (request.client.host if request.client else "unknown")
    limiter_key = sessions.peppered(f"{client_ip}:{body.visitor}")
    if not sessions.rate_limiter.allow(limiter_key, cfg.rate_limit_per_minute):
        await sessions.log_safety_event(None, "rate_limit", limiter_key[:16])
        return JSONResponse({"error": "rate_limited"}, status_code=429, headers=_cors_headers(origin))

    visitor_id = await sessions.ensure_visitor(body.visitor)
    session_id = await sessions.ensure_session(
        visitor_id, body.session, client_ip,
        request.headers.get("user-agent", ""), request.headers.get("referer", ""),
    )

    async def stream():
        yield f"event: meta\ndata: {json.dumps({'session': str(session_id)})}\n\n"
        try:
            async for event, payload in chat.respond(cfg, session_id, body.message.strip(), body.client_id):
                yield f"event: {event}\ndata: {json.dumps(payload)}\n\n"
        except Exception:  # noqa: BLE001 — stream must end cleanly; details go to logs only
            log.exception("chat stream failed session=%s", session_id)
            yield f"event: error\ndata: {json.dumps({'message': 'Something went wrong on my side.'})}\n\n"

    headers = _cors_headers(origin) | {"Content-Type": "text/event-stream", "X-Accel-Buffering": "no"}
    return StreamingResponse(stream(), headers=headers)


@app.get("/health/live")
async def health_live():
    return {"status": "ok"}


@app.get("/health/ready")
async def health_ready():
    try:
        database = await db.pool()
        await database.fetchval("SELECT 1")
        cfg = await loader.get()
        return {"status": "ok", "enabled": cfg.enabled}
    except Exception:  # noqa: BLE001
        return JSONResponse({"status": "degraded"}, status_code=503)


@app.get("/health/dependencies")
async def health_dependencies():
    out: dict = {"config_error": loader.config_error}
    try:
        database = await db.pool()
        out["postgres"] = "ok" if await database.fetchval("SELECT 1") == 1 else "bad"
        out["knowledge_chunks"] = await database.fetchval("SELECT count(*) FROM knowledge_chunks")
    except Exception:  # noqa: BLE001
        out["postgres"] = "unreachable"
    out["ollama"] = await ollama.health()
    return out
