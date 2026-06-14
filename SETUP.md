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
| `feature/v4-redesign` | Main v4 integration branch and staging frontend source. |
| `main` | Production frontend source. Merge here only during the release cutover. |
| `v4/<task-id>` | Task branches. Already merged task branches can be deleted. |

When in doubt, work from `feature/v4-redesign`.

---

## Environment Variables

Copy the example files and fill in local values. Never commit `.env`.

### Frontend: `frontend/.env`

```env
DIRECTUS_URL=http://localhost:8055
PUBLIC_DIRECTUS_URL=http://localhost:8055
SITE_URL=http://localhost:4321
DEPLOY_ENV=local
# DIRECTUS_TOKEN=
```

| Variable | Required | Description |
|---|---:|---|
| `DIRECTUS_URL` | Yes | Server-side Directus URL used by Astro SSR. |
| `PUBLIC_DIRECTUS_URL` | Yes | Browser-visible Directus asset origin. |
| `SITE_URL` | Recommended | Canonical origin for SEO/OG output. |
| `DEPLOY_ENV` | Recommended | Use `staging` only on the staging frontend resource. |
| `DIRECTUS_TOKEN` | Optional | Server-only read token for locked-down Directus instances. Do not prefix with `PUBLIC_`. |

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
DIRECTUS_PUBLIC_URL=http://localhost:8055
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

Directus admin: `http://localhost:8055/admin`

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
   - `directus_files`

The frontend expects public reads for published editorial content. Drafts should remain
hidden by policy and repository filters.

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
| `/blog` | Writing index |
| `/blog/topic/[slug]` | Topic filter |
| `/projects` | Astro content collection project index |
| `/dream-team` | Author/team graph and list |
| `/connect` | Contact |
| `/privacy` | Privacy |
| `/dev/styleguide` | Design-system review page, dev only |
| `/dev/styleguide-prose` | Prose/callout review page, dev only |

---

## Current v4 Content Model

### Directus Collections Used by v4.0

| Collection | Purpose |
|---|---|
| `posts` | Published writing, Markdown body, cover image, featured flag. |
| `authors` | Dream Team profiles and post authors. |
| `specialties` | Author expertise taxonomy. |
| `topics` | Shared writing taxonomy. |
| `authors_specialties` | M2M relation. |
| `posts_topics` | M2M relation. |
| `directus_files` | Images and file metadata. |

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

### Source-Controlled Content

| Content | Location |
|---|---|
| Projects | `frontend/src/content/projects/*.md` |
| Project images | `frontend/src/assets/projects/` |
| Navigation/social/home flags | `frontend/src/content/site.ts` |
| Brand assets | `frontend/src/assets/brand/` and `frontend/public/favicon.*` |
| Temporary OG images | `frontend/public/og/` |

### Retired v3 Directus Content

These v3-era collections are no longer frontend sources in v4:

- `projects`
- `site_settings`
- `home_settings`
- `about`

Do not add new content there for v4. They are scheduled for post-release cleanup after
the v4.0 release soak.

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
