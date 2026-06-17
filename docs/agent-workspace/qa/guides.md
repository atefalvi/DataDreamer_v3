# QA — Field Guides (V4-QA-004)

Run on staging (Directus seeded via `scripts/v4-guides-schema.mjs`, frontend with
`PUBLIC_GUIDES_ENABLED=true`). Already verified at the API layer (register → login →
read gated → progress write/read); this is the browser pass.

## Journeys

- [ ] **Catalogue** `/guides` — seed guide shows as a card; featured lead renders; topic
      + difficulty chips filter via URL (`?topic=`, `?level=`); empty filter → empty state.
- [ ] **Preview (anonymous)** `/guides/learn-airflow-the-real-way` — hero, why/outcome,
      syllabus titles visible; item bodies/links/notes hidden; "Sign in to start" gate shown.
- [ ] **Sign up** → returns to the guide; reader unlocks (item embeds/links/notes appear).
- [ ] **Progress** — toggle items; bar/percent/counts/“time left” update; reload persists;
      `/account` lists the guide with % and Continue.
- [ ] **Sign out** → guide drops back to the preview gate.

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
- Google SSO not built yet (email/password only).
