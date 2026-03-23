# DataDreamer v3

**Portfolio + blog platform** — Atef Alvi's personal site built with [Astro](https://astro.build) (SSR) as the frontend and [Directus](https://directus.io) as the headless CMS backend. Deployed via [Coolify](https://coolify.io) to `data-dreamer.net`.

---

## Architecture

```
DataDreamer_v3/
├── frontend/          # Astro SSR application
│   ├── src/
│   │   ├── components/   # Reusable Astro components
│   │   │   ├── about/    # About page sections
│   │   │   ├── blog/     # Log/blog components & callout components
│   │   │   ├── hero/     # Home page hero
│   │   │   └── projects/ # Project card
│   │   ├── layouts/      # MainLayout.astro
│   │   ├── lib/          # Data-fetching & utilities
│   │   │   ├── directus.ts     # Directus SDK client, types, fetchers
│   │   │   ├── content.ts      # Formatted content models
│   │   │   └── renderMarkdown.ts # Markdown → HTML pipeline
│   │   ├── pages/        # File-based routing
│   │   └── styles/       # global.css
│   ├── .env.example      # Required env vars template
│   └── Dockerfile        # Multi-stage production build
│
├── backend/           # Directus CMS (Docker Compose)
│   ├── docker-compose.yml
│   ├── .env.example      # Required secrets template
│   ├── snapshot.yaml     # Directus schema definition
│   ├── extensions/       # Custom Directus extensions
│   └── datadreamer_backup.sql  # PostgreSQL data dump
│
└── reference/         # [gitignored] local dev notes only
```

---

## Environment Variables

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PUBLIC_DIRECTUS_URL` | ✅ | Full URL to Directus API, e.g. `https://api.data-dreamer.net` |
| `DIRECTUS_EMAIL` | Optional | Admin email — only needed if collections are not fully public |
| `DIRECTUS_PASSWORD` | Optional | Admin password — only needed if collections are not fully public |

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DB_USER` | ✅ | Postgres username |
| `DB_PASSWORD` | ✅ | Postgres password |
| `DB_DATABASE` | ✅ | Postgres database name |
| `DIRECTUS_SECRET` | ✅ | Random 64-char secret key (`openssl rand -hex 32`) |
| `DIRECTUS_ADMIN_EMAIL` | ✅ | Initial Directus admin email |
| `DIRECTUS_ADMIN_PASSWORD` | ✅ | Initial Directus admin password |
| `DIRECTUS_PUBLIC_URL` | ✅ | The public URL of the Directus API, e.g. `https://api.data-dreamer.net` |
| `CORS_ORIGIN` | ✅ | Frontend URL allowed to call the API, e.g. `https://data-dreamer.net` |

---

## Local Development

See **[SETUP.md](./SETUP.md)** for full local setup instructions.

Quick start:
```bash
# 1. Start Directus backend
cd backend
cp .env.example .env  # fill in your values
docker compose up -d

# 2. Start Astro frontend
cd ../frontend
cp .env.example .env  # fill in your values
npm install
npm run dev           # http://localhost:4321
```

---

## Deployment (Coolify)

This is a **monorepo** with two separate Coolify services.

### 1. Backend — Directus (Docker Compose)

1. **New Resource → Docker Compose**
2. **Base Directory:** `/backend`
3. **Docker Compose Location:** `/backend/docker-compose.yml`
4. In **Environment Variables**, set all vars from `backend/.env.example`:
   - `DIRECTUS_SECRET`, `DIRECTUS_ADMIN_EMAIL`, `DIRECTUS_ADMIN_PASSWORD`
   - `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`
   - `DIRECTUS_PUBLIC_URL=https://api.data-dreamer.net`
   - `CORS_ORIGIN=https://data-dreamer.net`
5. Set domain → `api.data-dreamer.net`
6. **Deploy**

#### Restore Database Content
After the DB container is healthy, run:
```bash
cat backend/datadreamer_backup.sql | docker exec -i <db_container_id> psql -U directus -d datadreamer
```
Or apply the schema only (no content):
```bash
npx directus schema apply ./backend/snapshot.yaml
```

### 2. Frontend — Astro SSR

1. **New Resource → Application** (Dockerfile)
2. **Base Directory:** `/frontend`
3. Coolify auto-detects `frontend/Dockerfile`
4. In **Environment Variables**, set:
   - `PUBLIC_DIRECTUS_URL=https://api.data-dreamer.net`
5. Set domain → `data-dreamer.net`
6. **Deploy**

---

## Maintenance

```bash
# Type-check
cd frontend && npx astro check

# Verify production build
cd frontend && npm run build

# Export Directus schema snapshot
npx directus schema snapshot ./backend/snapshot.yaml
```

---

## Agent Blog Guide

See **[docs/AGENT_BLOG_GUIDE.md](./docs/AGENT_BLOG_GUIDE.md)** for content authoring instructions for AI agents.
