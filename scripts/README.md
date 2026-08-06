# scripts/

Operational scripts for DataDreamer. All are plain Node ESM (`node scripts/<name>.mjs`)
and read config from environment variables — no secrets are committed.

## Active

Scripts you actually run today.

| Script | What it does | How to run |
|---|---|---|
| `v4-guides-service-check.mjs` | Non-mutating check that the frontend Guide Server credential can read one published guide, section, full item body, and learner profile id. Never prints token or user data. | `DIRECTUS_URL=… DIRECTUS_SERVICE_TOKEN=… node scripts/v4-guides-service-check.mjs` |
| `release-smoke.mjs` | Post-deploy smoke test (status codes, redirects, RSS, sitemap, OG fetch). | `node scripts/release-smoke.mjs https://data-dreamer.net` |
| `v4-guides-smoke.mjs` | **Field Guides QA** — full reader journey (anon catalogue/preview → register/login → gated read → progress) against a live env; verifies Google SSO is registered. | `DIRECTUS_ADMIN_TOKEN=… node scripts/v4-guides-smoke.mjs <directusUrl> [frontendUrl]` |
| `generate-og-temp.mjs` | (Re)generate the section OG images in `frontend/public/og/`. | `node scripts/generate-og-temp.mjs` or `cd frontend && npm run og:sections` |
| `cms-model-maintenance.mjs` | Dry-run/apply reconciliation for safe many-to-many deletion rules, non-truncating SEO text storage, and the canonical Dream Team Specialty catalogue. | `node --env-file=.env.cms scripts/cms-model-maintenance.mjs` (dry-run), then add `--apply` after review. |

> **Orby** (the site chat assistant) lives in its own repository —
> [github.com/atefalvi/orby](https://github.com/atefalvi/orby) — including its Directus
> setup script and sprite tooling. This repo only carries the widget `<script>` tag in
> `BaseLayout.astro` (env-guarded by `PUBLIC_ORBY_WIDGET_URL`).

Older one-time migration and fixture scripts were removed after production
verification. Git history preserves them. `cms-model-maintenance.mjs` remains active
because relationship rules and the Specialty catalogue must be safely reconcilable
across environments. Use `backend/snapshot.yaml` to recreate the current collection
structure; configure roles and policies in Directus.
