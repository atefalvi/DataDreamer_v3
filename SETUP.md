# SETUP.md — DataDreamer v4 Local Development

This guide describes the current v4 setup. The repository folder may still be named
`DataDreamer_v3`, but the active frontend, content model, and release work are v4.

---

## Prerequisites

| Tool | Version | Notes |
|---|---:|---|
| Node.js | 20+ | Astro SSR and build tooling |
| npm | 10+ | Bundled with Node |
| Docker Desktop | latest | Directus, Postgres, Redis |
| Docker Compose | v2+ | Included with Docker Desktop |

---

## Repository Branches

| Branch | Use |
|---|---|
| `main` | The only long-lived branch. Merges auto-deploy production via Coolify. |
| feature branches | Short-lived, merged via PR after `npm run check` + tests + build pass. |

When in doubt, branch from `main`.

---

## Environment Variables

Copy the example files and fill in local values. Never commit `.env`.

### Frontend: `frontend/.env`

```env
DIRECTUS_URL=http://localhost:8056
PUBLIC_DIRECTUS_URL=http://localhost:8056
SITE_URL=http://localhost:4321
DEPLOY_ENV=local
# DIRECTUS_TOKEN=
# DIRECTUS_SERVICE_TOKEN=
PUBLIC_GUIDES_ENABLED=true
```

| Variable | Required | Description |
|---|---:|---|
| `DIRECTUS_URL` | Yes | Server-side Directus URL used by Astro SSR. |
| `PUBLIC_DIRECTUS_URL` | Yes | Browser-visible Directus asset origin. |
| `SITE_URL` | Recommended | Canonical origin for SEO/OG output. |
| `DEPLOY_ENV` | Recommended | Use `staging` only on the staging frontend resource. |
| `DIRECTUS_TOKEN` | Optional | Server-only read token for locked-down Directus instances. Do not prefix with `PUBLIC_`. |
| `DIRECTUS_SERVICE_TOKEN` | Required for Guides | Static token for the least-privilege Guide Server user. |
| `PUBLIC_GUIDES_ENABLED` | Recommended | Guides are enabled unless explicitly set to `false`. |

The v4 frontend does not log into Directus with admin credentials. Public content should
be readable through the Directus Public policy unless a server-only read token is
intentionally configured.

### Backend: `backend/.env`

```env
DB_USER=directus
DB_PASSWORD=localdevpassword
DB_DATABASE=datadreamer
DIRECTUS_SECRET=any_random_long_string_for_local
DIRECTUS_ADMIN_EMAIL=admin@local.dev
DIRECTUS_ADMIN_PASSWORD=localadmin
DIRECTUS_PUBLIC_URL=http://localhost:8056
CORS_ORIGIN=http://localhost:4321
```

| Variable | Required | Description |
|---|---:|---|
| `DB_USER` | Yes | Postgres username. |
| `DB_PASSWORD` | Yes | Postgres password. |
| `DB_DATABASE` | Yes | Postgres database name. |
| `DIRECTUS_SECRET` | Yes | Random secret, for example `openssl rand -hex 32`. |
| `DIRECTUS_ADMIN_EMAIL` | Yes | Local Directus admin email. |
| `DIRECTUS_ADMIN_PASSWORD` | Yes | Local Directus admin password. |
| `DIRECTUS_PUBLIC_URL` | Yes | Public URL Directus uses when generating links/assets. |
| `CORS_ORIGIN` | Yes | Frontend origin allowed to request Directus. |

---

## Start the Backend

```bash
cd backend
cp .env.example .env
# Edit .env with the local values above.
docker compose up -d
```

Directus admin: `http://localhost:8056/admin`

### Apply Schema or Restore Data

For a clean v4 schema:

```bash
cd backend
npx directus schema apply ./snapshot.yaml
```

For a local restore from the example dump:

```bash
cd backend
docker compose ps
cat datadreamer_backup.sql | docker exec -i <database_container_name> \
  psql -U directus -d datadreamer
```

After applying schema/restoring content, restart Directus if policies or extensions were
changed.

---

## Configure Directus Public Read Access

In Directus:

1. Open **Settings → Access Policies → Public**.
2. Grant read access for published content on:
   - `posts`
   - `authors`
   - `specialties`
   - `topics`
   - `authors_specialties`
   - `posts_topics`
   - `projects`
   - `directus_files`

The frontend expects public reads for published editorial content. Drafts should remain
hidden by policy and repository filters.

Guide content uses the separate least-privilege **Guide Server** policy through
`DIRECTUS_SERVICE_TOKEN`. Do not grant anonymous access to guide item URLs, bodies,
notes, assets, or progress rows. See `docs/GUIDES_QA.md` for the guide access checks.

---

## Start the Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env with the local values above.
npm install
npm run dev
```

Frontend: `http://localhost:4321`

Useful local routes:

| Route | Purpose |
|---|---|
| `/` | Homepage |
| `/blog` | Posts index |
| `/blog/topic/[slug]` | Topic filter |
| `/projects` | Project index |
| `/guides` | Field Guide catalogue |
| `/dream-team` | Author/team graph and list |
| `/connect` | Contact |
| `/privacy` | Privacy |
| `/dev/styleguide` | Design-system review page, dev only |
| `/dev/styleguide-prose` | Prose/callout review page, dev only |
| `/dev/editorial-collections-preview` | Shared Posts, Projects, and Guides card QA, dev only |
| `/dev/guides-preview` | Guide catalogue and reader-state QA, dev only |

---

## Current v4 Content Model

### Directus Collections Used by v4

| Collection | Purpose |
|---|---|
| `posts` | Published posts, Markdown body, cover image, featured flag. |
| `authors` | Dream Team profiles and post authors. |
| `specialties` | Author expertise taxonomy. |
| `topics` | Shared post and guide taxonomy. |
| `projects` | Project case studies. |
| `guides` | Field Guide metadata and curator relationships. |
| `guide_sections` | Ordered groups within guides. |
| `guide_items` | Ordered resources within guide sections. |
| `guide_progress` | Private per-user guide progress. |
| `authors_specialties` | M2M relation. |
| `posts_topics` | M2M relation. |
| `guides_authors` | M2M guide curator relation. |
| `guides_specialties` | M2M guide specialty relation. |
| `guides_topics` | M2M guide topic relation. |
| `directus_files` | Images and file metadata. |

The canonical Specialty catalogue and selection rules are documented in
`docs/SPECIALTIES_TAXONOMY.md`. To preview or apply the idempotent Specialty and
many-to-many relationship reconciliation, run `scripts/cms-model-maintenance.mjs` as
documented in `scripts/README.md`.

### `posts` Fields

| Field | Notes |
|---|---|
| `title` | Article title. |
| `slug` | Stable URL segment. |
| `status` | `draft` or `published`; only published posts render publicly. |
| `published_at` | Sort date, RSS date, sitemap date. |
| `excerpt` | Cards and meta description. |
| `content` | Markdown body using the v4 authoring guide. |
| `author` | M2O relation to `authors`. |
| `topics` | M2M relation via `posts_topics`. |
| `cover_image` | Optional Directus file for article/card/OG imagery. |
| `featured` | Optional homepage/blog feature eligibility. |
| `series_label` | Optional series text. |
| `post_number` | Optional numeric sequence. |

### Source-Controlled Site Content

| Content | Location |
|---|---|
| Navigation/social/home flags | `frontend/src/content/site.ts` |
| Brand assets | `frontend/src/assets/brand/` and `frontend/public/favicon.*` |
| Section OG images | `frontend/public/og/` |

`site_settings`, `home_settings`, and `about` are retired v3 collections and are not
frontend data sources. The authoritative current schema is `backend/snapshot.yaml`.
Editorial statuses, shared topics, SEO fields, and publishing responsibilities are
documented in `docs/CMS_EDITORIAL_WORKFLOW.md`.

---

## Validation Commands

Run before opening or merging frontend changes:

```bash
cd frontend
npx astro check
npm test
npm run build
```

Run staging release smoke:

```bash
PUBLIC_DIRECTUS_URL=http://192.168.10.211:8056 \
  node ../scripts/release-smoke.mjs https://staging.data-dreamer.net
```

Run production release smoke after cutover:

```bash
PUBLIC_DIRECTUS_URL=https://api.data-dreamer.net \
  node ../scripts/release-smoke.mjs https://data-dreamer.net
```

---

## Troubleshooting

### CORS Errors

- `backend/.env` `CORS_ORIGIN` must exactly match the frontend origin.
- Local frontend origin is usually `http://localhost:4321`.
- Restart Directus after changing backend env:

  ```bash
  cd backend
  docker compose down
  docker compose up -d
  ```

### Public Content Returns 403

- Confirm Public policy read access for the v4 collections listed above.
- Confirm repository filters are not excluding records because `status` is not
  `published`.
- Do not add admin credentials to the frontend env.

### Images Do Not Load

- Confirm `PUBLIC_DIRECTUS_URL` points to the browser-reachable Directus origin.
- Confirm `directus_files` has public read access for published content.
- Confirm image URLs use the same origin allowed by CSP.

### Astro Type or Build Errors

```bash
cd frontend
npx astro check
npm run build
```

### Reset Local Backend Data

This destroys local database data:

```bash
cd backend
docker compose down -v
docker compose up -d
```

Then re-apply `backend/snapshot.yaml` or restore a backup.
