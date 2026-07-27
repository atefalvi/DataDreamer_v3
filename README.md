# DataDreamer

An editorial data-intelligence studio site — Astro 5 SSR + Directus 12, deployed on a
homelab through Coolify behind Cloudflare, live at **[data-dreamer.net](https://data-dreamer.net)**.

The surface: homepage, posts (rich markdown blocks: callouts, checklists, metrics,
KaTeX formulas, image grids), project case studies, Dream Team profiles with a
specialty network graph, login-gated **Field Guides** (email + Google SSO, progress
tracking), a self-service contributor account area, dynamic per-post/project OG
cards, RSS, and sitemap. The **Orby** chat assistant floats on top from its own
service (see below).

> The repo directory is named `DataDreamer_v3` for continuity; the implementation is v4.

## Layout

```
frontend/   Astro SSR app (the site) — deploys from main via Coolify
backend/    Directus docker-compose + custom hook extensions (author-profile,
            google-picture-url), baked into a custom image
scripts/    Operational Node scripts (see scripts/README.md)
docs/       Current authoring, operations, privacy, cache, and QA runbooks
```

## Architecture in one paragraph

Pages never touch the Directus SDK directly: `lib/repositories/*` query with explicit
field lists, `_mappers.ts` converts rows (`lib/directus/schema.ts`) to view-models
(`types/content.ts`), and pages consume view-models only. Auth is a thin bridge — the
learner's session cookie proves identity, a least-privilege **Guide Server** service
token does the scoped reads/writes. Public API reads are row-filtered to published at
the Directus policy level. One account per person; Dream Team visibility and blog
authoring are admin-granted add-ons (`docs/ACCOUNT_MODEL.md` is the
runbook). Anonymous HTML is edge-cached (`s-maxage` + SWR); session pages are
`private, no-store`.

## Branches

`main` is the only long-lived branch — merges auto-deploy the frontend via Coolify.
Feature work happens on short-lived branches merged through PRs.

## Development

See [SETUP.md](SETUP.md). Quick start:

```bash
cd frontend && npm install && npm run dev     # http://localhost:4321
npm run check && npx vitest run && npm run build   # the gate before any merge
```

Backend (local Directus) runs from `backend/docker-compose.yml` on host port 8056 so
it never collides with production's 8055.

## Orby (chat assistant)

Orby lives in its own repository — **[github.com/atefalvi/orby](https://github.com/atefalvi/orby)**
— deployed separately at `chat.data-dreamer.net`. This repo's entire integration is an
env-guarded `<script>` tag in `BaseLayout.astro` (`PUBLIC_ORBY_WIDGET_URL`; unset = no
widget) plus the CSP allowance in `middleware.ts`. Runtime control (kill switch,
prompts, models, limits) lives in the Directus `orby` collection.

## Operations

- **Deploys:** push to `main` → Coolify builds the frontend. Backend redeploys are
  manual in Coolify (hook extensions ship in the image).
- **Smoke:** `node scripts/release-smoke.mjs https://data-dreamer.net`
- **Guides QA:** `docs/GUIDES_QA.md`
- **CMS editorial workflow:** `docs/CMS_EDITORIAL_WORKFLOW.md`
- **Agent authoring:** `docs/AGENT_BLOG_GUIDE.md`, `docs/AGENT_PROJECTS_GUIDE.md`,
  `docs/AGENT_GUIDES_GUIDE.md`, the shared `docs/RICH_CONTENT_BLOCKS.md`, and
  `docs/AGENT_COVER_IMAGE_GUIDE.md` for consistent text-free cover art
- **Dream Team taxonomy:** `docs/SPECIALTIES_TAXONOMY.md`
- **Cloudflare cache:** `docs/CLOUDFLARE_CACHE.md`
- **Frontend consolidation:** `docs/CODEBASE_CONSOLIDATION_PLAN.md`
- **Directus schema:** `backend/snapshot.yaml` is the current production structure;
  role and policy changes are administered in Directus and documented with the feature.
