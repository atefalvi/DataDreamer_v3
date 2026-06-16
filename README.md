# DataDreamer v4

DataDreamer is an editorial data-intelligence studio site built with Astro SSR,
Directus, and the v4 Observatory design system. The current v4 surface includes the
homepage, writing, topic filters, project case studies, Dream Team profiles, RSS,
sitemap/robots, OG assets, and the production-ready global shell.

The repository directory is still named `DataDreamer_v3` for continuity, but the active
implementation and documentation are v4.

---

## Current Branch Model

| Branch | Purpose |
|---|---|
| `feature/v4-redesign` | Active v4 integration branch and staging deploy source. |
| `main` | Production deploy source. Do not merge v4 here until the release checklist is complete. |
| `v4/<task-id>` | Historical task branches. Branches that already have merged PRs can be deleted. |
| `codex/*` | Small assistant-side utility/doc branches. Merge or delete after review. |

For release sequencing, use [docs/RELEASE_NEXT_STEPS.md](./docs/RELEASE_NEXT_STEPS.md).

---

## Architecture

```text
DataDreamer_v3/
├── frontend/                  # Astro 5 SSR frontend
│   ├── src/
│   │   ├── assets/             # Brand assets and project images
│   │   ├── components/         # Global shell, UI primitives, blog, home, projects
│   │   ├── content/            # Astro content collections, including projects
│   │   ├── layouts/            # BaseLayout and SEO shell
│   │   ├── lib/                # Directus repositories, markdown, SEO, graph, motion
│   │   ├── pages/              # Routes: home, blog, projects, dream-team, connect, privacy
│   │   └── styles/             # Observatory tokens, base, prose, fonts
│   ├── .env.example
│   └── Dockerfile
├── backend/                   # Directus + Postgres + Redis compose resource
│   ├── docker-compose.yml
│   ├── .env.example
│   ├── snapshot.yaml
│   ├── extensions/
│   └── datadreamer_backup.sql
├── docs/
│   ├── AGENT_BLOG_GUIDE.md
│   ├── RELEASE_NEXT_STEPS.md
│   └── agent-workspace/
└── scripts/                   # active tools (OG, guides schema, smoke); see scripts/README.md
    └── migrations/             # one-time Directus migrations already applied (history)
```

---

## Content Ownership

| Content | Source |
|---|---|
| Posts, authors, specialties, topics | Directus |
| Project case studies | Astro content collection in `frontend/src/content/projects/` |
| Navigation, homepage copy, social links, feature flags | `frontend/src/content/site.ts` |
| About/contact/privacy page copy | Source-controlled frontend content/components |
| Courses/auth/student dashboard | Planned v4.1 work, not part of the v4.0 release |

Retired v3 Directus collections such as `projects`, `site_settings`, `home_settings`,
and `about` should not be used for v4 frontend content. They remain only until the
post-release cleanup task drops them after the v4.0 soak.

---

## Local Development

Full setup is in [SETUP.md](./SETUP.md).

```bash
# Backend
cd backend
cp .env.example .env
docker compose up -d

# Frontend
cd ../frontend
cp .env.example .env
npm install
npm run dev
```

Frontend: `http://localhost:4321`

Directus: `http://localhost:8055/admin`

---

## Validation

Run these before opening or merging frontend changes:

```bash
cd frontend
npx astro check
npm test
npm run build
```

Release smoke:

```bash
PUBLIC_DIRECTUS_URL=http://192.168.10.211:8056 \
  node ../scripts/release-smoke.mjs https://staging.data-dreamer.net
```

---

## Deployment

DataDreamer uses separate Coolify resources:

| Resource | Branch / source | Notes |
|---|---|---|
| Staging frontend | `feature/v4-redesign` | `DEPLOY_ENV=staging`; should send `X-Robots-Tag: noindex`. |
| Production frontend | `main` | Cut over only through the v4.0 release checklist. |
| Staging backend | Directus compose | Separate DB/uploads/extensions from production. |
| Production backend | Directus compose | Do not run post-release drops before v4.0 soak completes. |

See [docs/RELEASE_NEXT_STEPS.md](./docs/RELEASE_NEXT_STEPS.md) before touching
production.

---

## Guides

- [SETUP.md](./SETUP.md) — local development, environment variables, Directus policies.
- [docs/AGENT_BLOG_GUIDE.md](./docs/AGENT_BLOG_GUIDE.md) — v4 authoring guide for posts.
- [docs/RELEASE_NEXT_STEPS.md](./docs/RELEASE_NEXT_STEPS.md) — branch cleanup and v4.0 release sequence.
- [docs/agent-workspace/13-TASKS.md](./docs/agent-workspace/13-TASKS.md) — implementation task board.
- [docs/agent-workspace/15-HANDOFF.md](./docs/agent-workspace/15-HANDOFF.md) — chronological handoff log.
