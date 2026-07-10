# scripts/

Operational scripts for DataDreamer. All are plain Node ESM (`node scripts/<name>.mjs`)
and read config from environment variables — no secrets are committed.

## Active

Scripts you actually run today.

| Script | What it does | How to run |
|---|---|---|
| `v4-guides-schema.mjs` | **v4.1 Field Guides** — creates guide/progress collections, Guide Reader identity and Guide Server data roles, and one sample guide. Public and browser-session collection access stay closed; Astro uses a non-admin `DIRECTUS_SERVICE_TOKEN`. Idempotent. | `DIRECTUS_URL=… DIRECTUS_ADMIN_TOKEN=… node scripts/v4-guides-schema.mjs` |
| `v4-account-model.mjs` | **v4.2 Account model** — `authors.user` link + `authors.dream_team` flag, draft linked author profiles for signed-up users, Contributor role (create/edit/publish own posts only), public API hardened to published-only reads, duplicate reader role removed. See `docs/agent-workspace/16-ACCOUNT-MODEL.md`. Idempotent; applied to prod 2026-07-06. | `DIRECTUS_URL=… DIRECTUS_ADMIN_TOKEN=… node scripts/v4-account-model.mjs` |
| `v4-guides-service-check.mjs` | Non-mutating check that the frontend Guide Server credential can read one published guide, section, full item body, and learner profile id. Never prints token or user data. | `DIRECTUS_URL=… DIRECTUS_SERVICE_TOKEN=… node scripts/v4-guides-service-check.mjs` |
| `release-smoke.mjs` | Post-deploy smoke test (status codes, redirects, RSS, sitemap, OG fetch). | `node scripts/release-smoke.mjs https://data-dreamer.net` |
| `v4-guides-smoke.mjs` | **Field Guides QA** — full reader journey (anon catalogue/preview → register/login → gated read → progress) against a live env; verifies Google SSO is registered. | `DIRECTUS_ADMIN_TOKEN=… node scripts/v4-guides-smoke.mjs <directusUrl> [frontendUrl]` |
| `prepare-orby-assets.mjs` | **Orby chat** — audits every sprite strip in `docs/agent-workspace/assets/strips` (dimensions, frames, transparency, baselines), copies valid strips to `apps/orby-chat/public/orby/`, and generates the animation manifest + `docs/audits/orby-sprite-audit.{json,md}`. Sources are never mutated; exits non-zero on malformed strips. | `node scripts/prepare-orby-assets.mjs` |
| `generate-og-temp.mjs` | (Re)generate the section OG images in `frontend/public/og/`. | `node scripts/generate-og-temp.mjs` or `cd frontend && npm run og:sections` |
| `generate-project-og.mjs` | Generate per-project case-study OG images from published Directus projects and their cover assets. | `DIRECTUS_URL=… node scripts/generate-project-og.mjs` or `cd frontend && npm run og:projects` |

## migrations/

One-time Directus migrations that have **already been applied to production** (v4.0).
Kept for reproducibility and history — you should not need to run these again. Each is
idempotent if you do.

| Script | Purpose |
|---|---|
| `v4-cms-001-directus.mjs` | v4.0 schema: `posts`, `authors`, `specialties`, `topics` + junctions + public read policies. |
| `v4-cms-002-directus.mjs` | `posts.author` (M2O), `cover_image`, `featured`. |
| `v4-cms-003-directus.mjs` | Topics backfill — `posts_topics` rows for published posts. |
| `v4-cms-005-directus.mjs` | Projects → repo markdown export, then archive the Directus rows. |
| `v4-projects-to-directus.mjs` | Later reversal: projects back into a Directus `projects` collection. |
| `v4-dt-seed-directus.mjs` | Dream Team starter data (specialties + author profiles). |
| `v4-seed-staging-posts.mjs` | Seed a small staging writing set. |

## Conventions

- **Env, not flags, for secrets.** `DIRECTUS_URL` + `DIRECTUS_ADMIN_TOKEN` (or
  `DIRECTUS_TOKEN`) for schema/seed scripts.
- **Idempotent.** Re-running skips/updates rather than duplicating.
- When a feature ships and its schema script has been applied to production, move it from
  the top level into `migrations/`.
