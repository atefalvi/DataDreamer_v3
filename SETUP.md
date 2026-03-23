# SETUP.md — Local Development Guide

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20+ | Required for Astro |
| npm | 10+ | Bundled with Node.js |
| Docker | Latest | For running Directus backend |
| Docker Compose | v2+ | Included with Docker Desktop |

---

## 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/DataDreamer_v3.git
cd DataDreamer_v3
```

---

## 2. Start the Backend (Directus + Postgres + Redis)

```bash
cd backend

# Copy and fill in environment variables
cp .env.example .env
```

Edit `backend/.env` with local dev values:
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

Then start:
```bash
docker compose up -d
```

Directus UI will be available at **http://localhost:8055/admin**.

### Restore Content (First Time)

After the containers are healthy, restore the database dump:
```bash
docker compose ps  # note the database container name
cat datadreamer_backup.sql | docker exec -i <database_container_name> psql -U directus -d datadreamer
```

Or apply schema only (without content):
```bash
npx directus schema apply ./snapshot.yaml
```

---

## 3. Configure Directus Permissions

Log into Directus at `http://localhost:8055/admin`, then:

1. Go to **Settings → Access Policies → Public**
2. Grant **Read** permission on:
   - `projects`
   - `logs`
   - `site_settings`
   - `home_settings`
   - `about`
   - `directus_files`

---

## 4. Start the Frontend (Astro)

```bash
cd ../frontend

# Copy and fill in environment variables
cp .env.example .env
```

Edit `frontend/.env`:
```env
PUBLIC_DIRECTUS_URL=http://localhost:8055
# Leave DIRECTUS_EMAIL and DIRECTUS_PASSWORD blank if using Public policy
```

Install dependencies and start the dev server:
```bash
npm install
npm run dev
```

The site will be available at **http://localhost:4321**.

---

## Content Model Overview

### `logs` Collection (Blog Posts)

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Auto-generated primary key |
| `title` | String | Post title (displayed in ALL CAPS) |
| `slug` | String | URL-friendly identifier, e.g. `my-first-log` |
| `status` | Dropdown | `draft` / `published` — only `published` items appear on the site |
| `published_at` | DateTime | Display date shown on the log list |
| `excerpt` | Text | Short summary (1–2 sentences) shown on listing page |
| `content` | Long Text | Full post body in Markdown (supports custom blocks) |
| `tag` | String | Primary tag used for filtering, e.g. `ML`, `DEVLOG` |
| `category` | String | Secondary category (fallback for tag) |
| `log_number` | Integer | Optional sequential number for ordered series |
| `series_label` | String | Optional series name grouping related posts |
| `author` | Relation | M2O to `directus_users` |

### `projects` Collection

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Auto-generated primary key |
| `title` | String | Project name |
| `slug` | String | URL-friendly identifier |
| `status` | Dropdown | `draft` / `published` |
| `published_at` | DateTime | Used for sorting (newest first) |
| `summary` | Text | Short description (shown on card) |
| `description` | Long Text | Full Markdown description |
| `cover_image` | File (UUID) | Directus file ID for the cover image |
| `tags` | JSON Array | List of technology tags |
| `featured` | Boolean | Pins to the homepage featured section |
| `author` | Relation | M2O to `directus_users` |

### `site_settings` Singleton

| Field | Type | Description |
|---|---|---|
| `status_text` | String | Availability badge text in navbar |
| `email` | String | Contact email |
| `github` | String | GitHub profile URL |
| `linkedin` | String | LinkedIn profile URL |
| `twitter` | String | Twitter/X profile URL |
| `footer_cta_heading` | String | Footer call-to-action heading text |

### `home_settings` Singleton

| Field | Type | Description |
|---|---|---|
| `hero_tagline_1` | String | First animated tagline line |
| `hero_tagline_2` | String | Second animated tagline line |
| `hero_tagline_3` | String | Third animated tagline line |

### `about` Singleton

| Field | Type | Description |
|---|---|---|
| `hero_tagline` | String | Small label above the name |
| `hero_title` | String | Large display name |
| `hero_description` | Long Text | Bio paragraph |
| `profile_image` | File (UUID) | Directus file ID for the portrait |
| `resume` | File (UUID) | Directus file ID for the resume PDF |
| `stats` | JSON Array | Array of `{ label, value }` objects for stats bar |
| `experience` | JSON Array | Array of `{ year, role, company, description }` for timeline |
| `skills` | JSON Array | Array of `{ category, items[] }` for the stack section |

---

## Troubleshooting

### CORS errors in browser console
- Ensure `CORS_ORIGIN` in `backend/.env` matches exactly the frontend URL (no trailing slash)
- Verify the backend is running: `docker compose ps`
- After changing `.env`, restart with `docker compose down && docker compose up -d`

### Data not loading on site
- Confirm the Public access policy has Read access on all required collections (Step 3 above)
- Check the correct `PUBLIC_DIRECTUS_URL` is set in `frontend/.env`
- Run `npm run dev` from the `frontend/` directory and check terminal output for fetch errors

### Authentication failures (if using DIRECTUS_EMAIL)
- Verify credentials in `frontend/.env` match the Directus admin credentials
- Try logging in at `http://localhost:8055/admin` with the same credentials

### Astro type errors
```bash
cd frontend && npx astro check
```

### Frontend build fails
```bash
cd frontend && npm run build 2>&1 | head -50
```
Ensure all env vars are set — missing `PUBLIC_DIRECTUS_URL` is the most common cause.

### Reset everything locally
```bash
cd backend
docker compose down -v   # WARNING: destroys database data
docker compose up -d
# Then re-apply schema or restore backup
```
