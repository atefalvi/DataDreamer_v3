"""Chat orchestrator — the whole pipeline for one user message.

classify → (guardrail short-circuits) → retrieve with scope routing →
evidence gate → prompt assembly → Ollama stream → persist + notify.

Yields (event, payload) tuples that main.py serializes as SSE. The sprite
states the widget shows ('thinking', 'searching', 'talking', …) are driven by
the `state` events emitted here, so UI and backend stay in sync by contract.
"""
from __future__ import annotations

import json
import logging
import time
import uuid
from collections.abc import AsyncIterator

from . import notify, ollama, rag, sessions
from .gate import gate
from .config import OrbyConfig
from .guardrails import classify, detect_person

log = logging.getLogger("orby.chat")

Event = tuple[str, dict]


def _canned(state: str, text: str, classification: str) -> list[Event]:
    return [
        ("state", {"state": state}),
        ("token", {"t": text}),
        ("done", {"classification": classification}),
    ]


async def respond(
    cfg: OrbyConfig,
    session_id: uuid.UUID,
    message: str,
    client_msg_id: str | None = None,
) -> AsyncIterator[Event]:
    started = time.monotonic()

    # Idempotent retry: if this exact client message was already answered, replay the
    # stored answer instead of generating (and never duplicate the user row).
    if client_msg_id:
        answered = await sessions.replay_for_client_key(session_id, client_msg_id)
        if answered is not None:
            yield ("state", {"state": "talking"})
            yield ("token", {"t": answered})
            yield ("done", {"classification": "replay"})
            return

    await sessions.save_message(session_id, "user", message, client_msg_id=client_msg_id)

    if await sessions.session_message_count(session_id) > cfg.max_messages_per_session:
        for event in _canned(
            "worried",
            "This conversation has hit its length limit — please refresh to start a new one.",
            "budget",
        ):
            yield event
        return

    verdict = classify(message, cfg.max_message_length)

    if verdict.kind == "too_long":
        for event in _canned("no", f"That message is a bit long for me — could you keep it under {cfg.max_message_length} characters?", "too_long"):
            yield event
        return

    if verdict.kind == "injection":
        await sessions.log_safety_event(session_id, "prompt_injection", verdict.detail)
        await notify.emit("security", f"Prompt-injection attempt in session {session_id}", session_id,
                          dedup_key=f"security:{session_id}", discord_enabled=cfg.discord_enabled)
        for event in _canned("warning", cfg.refusal_message, "injection"):
            yield event
        await sessions.save_message(session_id, "assistant", cfg.refusal_message, classification="injection")
        return

    if verdict.kind == "greeting":
        for event in _canned("happy" , cfg.welcome_message, "greeting"):
            yield event
        await sessions.save_message(session_id, "assistant", cfg.welcome_message, classification="greeting")
        return

    if verdict.kind == "off_topic":
        for event in _canned("no", cfg.out_of_scope_message, "off_topic"):
            yield event
        await sessions.save_message(session_id, "assistant", cfg.out_of_scope_message, classification="off_topic")
        return

    handoff = verdict.kind == "handoff"
    if handoff:
        await notify.emit(
            "handoff_request",
            f"A visitor asked to talk / book time (session {session_id}).",
            session_id, discord_enabled=cfg.discord_enabled,
        )
        if cfg.handoff_enabled and cfg.cal_com_url:
            yield ("handoff", {"url": cfg.cal_com_url, "cta": cfg.handoff_cta_text})
        # continue: retrieval may still add a useful answer about working with the team

    # ── generation slot (homelab GPU protection) ──
    session_key = str(session_id)
    slot = await gate.try_acquire(
        session_key, cfg.max_concurrent_generations, cfg.max_generation_queue_size
    )
    if slot == "session_busy":
        yield ("rejected", {"reason": "session_busy",
                            "message": "One at a time! I'm still answering your previous message."})
        return
    if slot == "queue_full":
        yield ("rejected", {"reason": "queue_full",
                            "message": "Orby is at capacity right now — please try again in a minute."})
        return
    if slot == "wait":
        yield ("state", {"state": "waiting"})
        slot = await gate.wait_for_slot(
            session_key, cfg.max_concurrent_generations, cfg.generation_queue_timeout_seconds
        )
        if slot == "timeout":
            yield ("rejected", {"reason": "timeout",
                                "message": "Orby is unusually busy and your spot in line timed out — please try again shortly."})
            return

    try:
        # ── retrieval ──
        yield ("state", {"state": "thinking"})
        author_slug = detect_person(message, await rag.known_authors())
        yield ("state", {"state": "searching"})
        hits = await rag.search(message, cfg, author_slug)
    except ollama.OllamaUnavailable:
        yield ("state", {"state": "offline"})
        yield ("token", {"t": cfg.maintenance_message})
        yield ("done", {"classification": "ollama_down"})
        await notify.emit("service_error", "Ollama unreachable during retrieval",
                          session_id, dedup_key="service_error:ollama", discord_enabled=cfg.discord_enabled)
        await gate.release(session_key)
        return

    try:
        context, sources = rag.build_context(hits, cfg)

        if not context:
            no_answer = cfg.no_answer_message
            if handoff and cfg.handoff_enabled and cfg.cal_com_url:
                no_answer = f"{cfg.handoff_cta_text}: {cfg.cal_com_url}"
            for event in _canned("confused", no_answer, "no_evidence"):
                yield event
            await sessions.save_message(session_id, "assistant", no_answer, classification="no_evidence")
            return

        # ── generation ──
        history = await sessions.recent_history(session_id, cfg.history_turns)
        prompt_messages = [
            {"role": "system", "content": f"{cfg.system_prompt}\n\n{context}\n\nCite naturally; do not invent sources."},
            *history[:-1],  # history includes the just-saved user message; keep prior turns only
            {"role": "user", "content": message},
        ]

        yield ("sources", {"sources": sources})
        yield ("state", {"state": "talking"})

        answer_parts: list[str] = []
        try:
            async for delta in ollama.chat_stream(
                prompt_messages, cfg.chat_model, cfg.temperature,
                cfg.max_generation_tokens, cfg.request_timeout_seconds,
            ):
                answer_parts.append(delta)
                yield ("token", {"t": delta})
        except ollama.OllamaUnavailable:
            yield ("state", {"state": "offline"})
            yield ("token", {"t": " …I lost my connection mid-thought. Please try again in a moment."})
            yield ("done", {"classification": "ollama_down"})
            await notify.emit("service_error", "Ollama unreachable during generation",
                              session_id, dedup_key="service_error:ollama", discord_enabled=cfg.discord_enabled)
            return

        answer = "".join(answer_parts).strip()
        latency = int((time.monotonic() - started) * 1000)
        await sessions.save_message(
            session_id, "assistant", answer,
            classification="handoff" if handoff else "datadreamer",
            model=cfg.chat_model, latency_ms=latency,
            sources=json.dumps(sources),
        )
        yield ("done", {"classification": "datadreamer", "latency_ms": latency})
    finally:
        await gate.release(session_key)
