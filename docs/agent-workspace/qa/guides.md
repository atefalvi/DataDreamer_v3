# QA — Field Guides (V4-QA-004)

Run on staging (Directus seeded via `scripts/migrations/v4-guides-schema.mjs`, frontend with
`PUBLIC_GUIDES_ENABLED=true`).

## Credential and role runbook

There are two identities and only one production service secret:

1. **Guide Server service user** — Directus User Directory account with role **Guide
   Server**, no admin/app access, and a static token. Put that token only on the Coolify
   **frontend** resource as `DIRECTUS_SERVICE_TOKEN`. It lets Astro read guide data and
   write progress after Astro verifies a human session. It is not used to sign in.
2. **Guide Reader human user** — every email/Google learner account. Registration and
   Google `AUTH_GOOGLE_DEFAULT_ROLE_ID` must assign this role. Human tokens/cookies are
   session identity only and never become `DIRECTUS_SERVICE_TOKEN`.

Frontend production env: `DIRECTUS_URL` (internal server URL),
`PUBLIC_DIRECTUS_URL=https://api.data-dreamer.net`,
`DIRECTUS_SERVICE_TOKEN=<Guide Server static token>`,
`SITE_URL=https://data-dreamer.net`, `PUBLIC_GUIDES_ENABLED=true`, and
`AUTH_COOKIE_DOMAIN=.data-dreamer.net`. Do not set this secret as `PUBLIC_*` and do not
put it on the backend resource.

Backend production env: Directus/database core vars plus `CORS_ORIGIN`,
`GUIDE_READER_ROLE_ID`, `SESSION_COOKIE_DOMAIN=.data-dreamer.net`,
`SESSION_COOKIE_SECURE=true`, and Google `AUTH_GOOGLE_CLIENT_ID` /
`AUTH_GOOGLE_CLIENT_SECRET`. Set
`GOOGLE_REDIRECT_URL=https://data-dreamer.net/api/auth/google/callback`; Directus allows
that one exact return URL while the app keeps the intended guide path in an HttpOnly
cookie. The compose file supplies the remaining provider settings.
In Directus Settings, enable User Registration and select **Guide Reader** as its default
role. In Google Cloud, authorize
`https://api.data-dreamer.net/auth/login/google/callback`.

Production must use a `DIRECTUS_SECRET` of at least 32 bytes; generate 32 random bytes
as 64 hex characters with `openssl rand -hex 32`. Rotating this value invalidates
existing signed sessions, so deploy it deliberately and expect users to sign in again.

To rotate the service token: generate a new static token on the Guide Server user,
replace `DIRECTUS_SERVICE_TOKEN` in the frontend, redeploy, run
`v4-guides-service-check.mjs`, then revoke the old token. Never paste it into source or
browser storage. The Guide Server policy must have read access to `directus_users` and
`directus_files`; rerun `v4-guides-schema.mjs` with an admin token after this policy
change. Astro verifies the learner id first, then requests only that user's profile.
Google sync keeps first name, last name, and email current but does not create a
Directus file avatar. To show a photo, open User Directory → learner → Avatar, upload a
square image, save, then sign in/reload; the UI otherwise uses a monogram fallback.

## Automated (CI gate) — ✅ passing

`astro check` 0 errors · unit tests · production build. Includes the pure
`deriveProgress` engine, repo preview/reader gating + ordering + curator dedup, and the
`safeNext` open-redirect guard.

## Live data layer — ✅ verified against staging Directus (api-staging / 192.168.10.211:8056)

Repeatable in one command (run after each deploy step):
`DIRECTUS_ADMIN_TOKEN=… node scripts/v4-guides-smoke.mjs <directusUrl> [frontendUrl]`

End-to-end, the exact operations the frontend performs (2026-06: 10/10):

- ✅ anon catalogue lists published guides only
- ✅ anon preview returns hero + section/item titles (gated bodies withheld by the query)
- ✅ register `guide_reader` → login → access token
- ✅ reader reads gated item content (markdown body)
- ✅ progress create 1/4 → 25% · update 2/4 → 50% · complete 4/4 → completed/100%
- ✅ progress persists and reads back (resume state intact)
- ✅ sign-out: app clears the session cookies → requests are anonymous again. (Note: in
  JSON mode the stateless access JWT stays valid until its short TTL; logout is effected
  client-side by clearing cookies, the standard pattern. ponytail: server-side token
  revocation skipped — add a session-mode `/auth/logout` call if the exfil-window matters.)

## Production hardening pass — 2026-06-21

- ✅ Guide Server token reads one published guide, two sections, and four items.
- ✅ `v4-guides-service-check.mjs` validates the frontend credential without printing
  or mutating it; guide credentials no longer fall back to `DIRECTUS_TOKEN`.
- ✅ Catalogue repository no longer requests forbidden `guides.date_created`.
- ✅ Account repository no longer requests forbidden `guide_progress.date_updated`.
- ✅ Production-mode logout returns 303, clears the OAuth cookie at
  `.data-dreamer.net`, and rejects a hostile origin with 403.
- ✅ Anonymous + signed-in guide, account, privacy, and tablet-home states rendered
  against production Directus data at 390, 820, 1200, and 1440 CSS pixels.
- ✅ Google provider is registered at the production Directus `/auth` endpoint.
- ⏳ Production frontend still shows the empty catalogue until the new code is deployed
  with `DIRECTUS_SERVICE_TOKEN` set on the frontend resource.
- ✅ Identity UI no longer exposes role language or generic “Admin” labels. It supports
  a server-enriched current-user profile, private avatar proxy, and monogram fallback.
- ⏳ Rerun the schema script in production so Guide Server can read `directus_users`;
  rerun `v4-guides-service-check.mjs` until it reports learner profile read available.
- ✅ Mobile brand mark uses the clean inline source paths (no blur filters or theme swap).
- ✅ Dream Team map has keyboard zoom controls, wheel/pinch zoom, drag pan, fit/reset,
  a person-focused mobile opening view, and zero horizontal overflow at 390px.

## Browser pass — ⏳ production deploy required

Rendering/interaction is verified via the `/dev/guides-preview` harness (dark + light);
the items below need the live staging frontend (Coolify redeploy) to tick:

## Journeys

- [x] **Catalogue (local production-data render)** `/guides` — seed guide shows as a card; featured lead renders; topic
      + difficulty chips filter via URL (`?topic=`, `?level=`); empty filter → empty state.
- [x] **Preview (anonymous, local production-data render)** `/guides/learn-airflow-the-real-way` — hero, why/outcome,
      syllabus titles visible; item bodies/links/notes hidden; "Sign in to start" gate shown.
- [ ] **Sign up** → returns to the guide; reader unlocks (item embeds/links/notes appear).
- [ ] **Progress** — toggle items; bar/percent/counts/“time left” update; reload persists;
      `/account` lists the guide with % and Continue.
- [x] **Sign out contract** → same-origin POST returns 303 and clears host + parent-domain cookies.
- [ ] **Production sign out browser journey** → account returns to anonymous state after deploy.

## Per-item type (in the reader)

- [ ] youtube facade loads the iframe only on click · external/repo/docs open new tab ·
      pdf/file download · note/cheat-sheet/code/exercise render inline markdown.

## Cross-cutting

- [ ] Keyboard: complete-toggle is a real button (Enter/Space), facade activatable.
- [ ] Dark + light themes; mobile + desktop.
- [ ] JS off: preview readable; `/guides` usable.
- [ ] No console errors; bad slug → 404.

## Known caveats (not blockers)

- Staging Directus restricts custom permission rules, so preview/reader gating + progress
  ownership are app-enforced, not DB-enforced (08 §5 note). A direct Directus API call
  could read drafts/gated fields — fine for staging; tighten on a licensed instance.
- Google SSO is built (button + Directus OAuth bridge + cookie logout). It registers once
  the staging Directus container restarts to pick up `AUTH_GOOGLE_*` (env + egress already
  confirmed); then `GET /auth` lists `google`.
