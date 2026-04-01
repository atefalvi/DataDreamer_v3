# DataDreamer v3

**Portfolio + blog platform** — Built with [Astro](https://astro.build) (SSR) as the frontend and [Directus](https://directus.io) as the headless CMS backend. Designed for technical logs, project case studies, and modern brutalist aesthetics.

---

## Architecture

```
DataDreamer_v3/
├── frontend/          # Astro SSR application
│   ├── src/
│   │   ├── components/   # Reusable Astro components
│   │   ├── layouts/      # Main shell with global styles
│   │   ├── lib/          # Directus SDK & data-fetching
│   │   ├── pages/        # File-based routing
│   │   └── styles/       # Atomic & global CSS
│   ├── .env.example      # Required env vars template
│   └── Dockerfile        # Multi-stage production build
│
├── backend/           # Directus CMS (Docker Compose)
│   ├── docker-compose.yml
│   ├── .env.example      # Required secrets template
│   ├── snapshot.yaml     # Directus schema definition (metadata)
│   ├── extensions/       # Custom Directus extensions
│   └── datadreamer_backup.sql  # Database structure (example)
│
└── docs/             # Documentation and guides
```

## Getting Started

See **[SETUP.md](./SETUP.md)** for detailed local development and environment variable configuration.

---

## Local Development

See **[SETUP.md](./SETUP.md)** for detailed local setup and permission guides.

1. **Start Backend:** `cd backend && docker compose up -d`
2. **Start Frontend:** `cd frontend && npm install && npm run dev`

---

## Deployment (Coolify)

This is a monorepo intended for two separate Coolify services.

### 1. Backend — Directus (Docker Compose)
1. **New Resource → Docker Compose**
2. **Base Directory:** `/backend`
3. Set domain to your API subdomain (e.g., `api.your-domain.com`)
4. Configure all environment variables from `backend/.env.example`

### 2. Frontend — Astro SSR
1. **New Resource → Application**
2. **Base Directory:** `/frontend`
3. Configure `DIRECTUS_URL` (internal) and `PUBLIC_DIRECTUS_URL` (external)
4. Set domain to your primary site (e.g., `your-domain.com`)

---

## Maintenance

```bash
# Type-check
cd frontend && npx astro check

# Export Directus schema snapshot
npx directus schema snapshot ./backend/snapshot.yaml
```

---

## Guides

- **[SETUP.md](./SETUP.md)** — Detailed local development and database restore.
- **[AGENT_BLOG_GUIDE.md](./docs/AGENT_BLOG_GUIDE.md)** — Content authoring guide for AI agents and human authors.
