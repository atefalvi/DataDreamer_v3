# QA — Field Guides (V4-QA-004)

Run on staging (Directus seeded via `scripts/v4-guides-schema.mjs`, frontend with
`PUBLIC_GUIDES_ENABLED=true`).

## Automated (CI gate) — ✅ passing

`astro check` 0 errors · 90 unit tests · production build. Includes the pure
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
- ✅ Catalogue repository no longer requests forbidden `guides.date_created`.
- ✅ Account repository no longer requests forbidden `guide_progress.date_updated`.
- ✅ Production-mode logout returns 303, clears the OAuth cookie at
  `.data-dreamer.net`, and rejects a hostile origin with 403.
- ✅ Anonymous + signed-in guide, account, privacy, and tablet-home states rendered
  against production Directus data at 390, 820, 1200, and 1440 CSS pixels.
- ✅ Google provider is registered at the production Directus `/auth` endpoint.
- ⏳ Production frontend still shows the empty catalogue until the new code is deployed
  with `DIRECTUS_SERVICE_TOKEN` set on the frontend resource.
- ⏳ Guide Server `/users/me` currently returns only `id`; grant own-user read access to
  `email`, `first_name`, and `last_name` for named account UI. The shipped fallback is
  “Reader session active.”

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
