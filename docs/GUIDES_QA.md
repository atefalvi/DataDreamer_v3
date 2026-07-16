# Field Guides QA

Use this runbook after changes to guide content, authentication, Directus permissions,
or the frontend guide reader.

## Required configuration

The frontend requires `DIRECTUS_URL`, `PUBLIC_DIRECTUS_URL`,
`DIRECTUS_SERVICE_TOKEN`, `SITE_URL`, and `PUBLIC_GUIDES_ENABLED=true`. The service
token must belong to the least-privilege **Guide Server** user; never use an admin or
learner token.

Directus requires a **Guide Reader** default registration role, Google provider
settings when SSO is enabled, and matching session-cookie/CORS origins. The Guide
Server policy needs only the fields and collections used by guide previews, reader
content, progress, files, and learner-profile verification.

To rotate the service token:

1. Generate a new static token on the Guide Server user.
2. Replace `DIRECTUS_SERVICE_TOKEN` on the frontend deployment.
3. Redeploy and run `v4-guides-service-check.mjs`.
4. Revoke the old token.

## Automated checks

From `frontend/`:

```bash
npm run check
npm test
npm run build
```

Verify the service credential without mutating data:

```bash
DIRECTUS_URL=https://api.data-dreamer.net \
DIRECTUS_SERVICE_TOKEN=… \
node ../scripts/v4-guides-service-check.mjs
```

Run the full temporary-user journey against staging or another safe environment that
contains at least one published guide:

```bash
DIRECTUS_ADMIN_TOKEN=… \
node scripts/v4-guides-smoke.mjs <directus-url> <frontend-url>
```

The full smoke registers and removes a temporary user and writes temporary progress.
Do not point it at production unless that mutation is intentional.

## Browser journeys

- Anonymous `/guides` shows only published guides and supports topic/level filters.
- Anonymous `/guides/<slug>` shows the pitch and syllabus but withholds gated bodies,
  links, assets, and curator notes.
- Signup and login return to the requested guide.
- Signed-in readers can open all supported item types and save progress.
- Reloading restores progress; `/account` shows the current percentage and Continue.
- Sign-out clears both app and parent-domain session cookies.
- Archived or unknown guides return `404` and do not appear in sitemaps.

Test keyboard activation, dark/light themes, mobile/desktop layouts, JavaScript-off
preview readability, and console errors. Native VoiceOver or NVDA checks should be
reported only when they were actually performed.

## Security checks

- Anonymous API requests cannot read guide item URLs, bodies, notes, files, drafts, or
  progress rows.
- Learner sessions cannot call editorial collections directly.
- Progress reads/writes are scoped to the user id verified by the server.
- Service and session tokens never appear in HTML, browser storage, logs, or URLs.
- Production uses a strong `DIRECTUS_SECRET`; rotating it invalidates sessions and
  should be scheduled deliberately.
