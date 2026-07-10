# Orby — DataDreamer chat assistant

A fully separate service: FastAPI + PostgreSQL/pgvector + Ollama RAG, serving its own
widget. DataDreamer's only knowledge of Orby is one env-guarded `<script>` tag in
`BaseLayout.astro`. See `ARCHITECTURE.md` for the ADR and threat model.

```
apps/orby-chat/
  api/orby/          FastAPI service (config, chat, rag, ingest, sessions, notify)
  api/tests/         security-logic tests (pytest)
  public/widget.js   the embeddable widget (vanilla JS, Shadow DOM)
  public/orby/       sprite strips + manifest (generated — never edit by hand)
  Dockerfile · docker-compose.yml · .env.example
```

## How it fits together

- **Directus → Content → Orby** is the control panel: kill switch, maintenance mode,
  prompts, models, retrieval limits, rate limits, handoff, Discord toggle. Changes
  apply within 60 s, no redeploys. Created by `node scripts/orby-directus-setup.mjs`.
- **Env vars** hold only secrets/infra (`.env.example`): DB password, Directus token,
  Ollama URLs, embedding dimension, Discord webhook, hash pepper.
- **Knowledge** = published posts, projects, guide previews (gated bodies are
  excluded at the Directus-permission level), contributor profiles. Ingested on
  demand: `docker compose exec orby-api python -m orby.ingest` (`--full` to rebuild).

## Deploy (Coolify)

1. New resource → Docker Compose → point at `apps/orby-chat/docker-compose.yml`.
2. Set env vars from `.env.example` (generate `ORBY_HASH_PEPPER` + `ORBY_DB_PASSWORD`
   with `openssl rand -hex 32`).
3. In Directus: User Directory → create **Orby Bot** with role **Orby** → generate a
   static token → `ORBY_DIRECTUS_TOKEN`.
4. Domain: `chat.data-dreamer.net` → orby-api :8100 (Cloudflare in front as usual).
   Postgres has no published port; Ollama stays on the private network.
5. Verify from the Coolify host: `curl http://<ollama-box>:11435/api/version`, then
   `curl https://chat.data-dreamer.net/health/dependencies`.
6. Ingest: `python -m orby.ingest --full` inside the api container.
7. Flip **enabled** in Directus → Content → Orby.
8. On the DataDreamer frontend resource, set
   `PUBLIC_ORBY_WIDGET_URL=https://chat.data-dreamer.net/widget.js` and redeploy.

## Kill switches (any one suffices)

1. Directus → Orby → `enabled` off (widget vanishes on next load, ≤60 s).
2. Directus → Orby → `maintenance_mode` on (widget shows the maintenance note).
3. Coolify: stop the orby stack (widget fails closed; site unaffected).
4. Frontend: unset `PUBLIC_ORBY_WIDGET_URL` (script tag is never emitted).

Full removal: the above + delete the `orby` collection, Orby role/policy, and Orby
Bot user in Directus, delete `apps/orby-chat/` and the BaseLayout block.

## Operations

- Health: `/health/live`, `/health/ready`, `/health/dependencies` (no secrets).
- Retention: sessions idle past `retain_chat_days` are purged by
  `python -m orby.retention` — schedule it (Coolify scheduled task, daily) or run
  ad hoc. Raw visitor tokens and IPs are never stored (peppered hashes only).
- Re-ingest after publishing content: incremental `python -m orby.ingest` (cheap —
  checksums skip unchanged documents). Schedule daily or run after publishing.
- Backups: include the `orby_pgdata` volume in the existing homelab backup routine;
  restore = restore volume + start stack (migrations are idempotent).
- Logs: structured JSON to stdout; message bodies are stored in Postgres, not logs.

## Sprites

Source of truth: `docs/agent-workspace/assets/strips` (never edited by tooling).
`node scripts/prepare-orby-assets.mjs` re-audits and regenerates
`public/orby/` + the manifest whenever strips are added or changed.

## Current limits (deliberate v1 scope)

- No file uploads yet (largest attack surface — separate reviewed phase).
- No email identification / cross-device memory (no SMTP available); returning
  visitors are recognized per-browser via an anonymous token only.
- Discord notifications no-op until `ORBY_DISCORD_WEBHOOK_URL` is set and
  `discord_enabled` is flipped; handoff CTA hides until `cal_com_url` is set.
- Rate limiting is in-memory (single api container by design).
