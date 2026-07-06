# 16 — Account model (v4.2): one account, opt-in public roles

Applied to production 2026-07-06 via `scripts/v4-account-model.mjs` (idempotent).

## The model

One login account (`directus_users`) per person. Public visibility and authoring are
**admin-granted add-ons**, not consequences of signing up.

| Capability | How it's granted | Where it lives |
|---|---|---|
| Take guides + track progress | automatic on signup/Google (role `guide_reader`) | `directus_users` + `guide_progress` |
| Appear on /dream-team | admin sets `authors.dream_team = true` | `authors` |
| Write blog drafts | admin assigns the **Contributor** role | Directus app (role + policy) |
| Publish anything | admin only | Administrator |

The link between an account and its public profile is `authors.user` (M2O →
`directus_users`, SET NULL on delete). One collection (`authors`) keeps serving both the
Dream Team pages and blog bylines — a profile just isn't on the team unless flagged.

## Admin runbook

- **Approve a Dream Team member:** Directus → Content → Authors → create/edit the profile,
  set **User** to their account, toggle **Dream team** on, status published.
- **Approve a blog author:** User Directory → their account → Role = **Contributor**
  (+ link an Authors profile as above so they have a byline and can edit their own bio).
  They then log into the Directus app: create posts (forced `draft`), edit/delete only
  their own unpublished posts, upload files, tag topics, edit only their own profile's
  bio/avatar/links fields. They cannot publish, touch others' posts, change their own
  `dream_team`/`slug`/`user` fields, or see other users.
- **Revoke:** flip `dream_team` off / set role back to `guide_reader`.

**Content-trust policy (decided 2026-07-06, review §9):** Contributors are vetted,
admin-approved authors — the markdown pipeline deliberately allows raw HTML
(`rehype-raw`) for expressive posts. Before ever granting Contributor to someone you
would not trust with raw HTML, add `rehype-sanitize` to the pipeline with an
allow-list covering the block classes (callout/checklist/metric/formula/embed/
image-grid), KaTeX output, and Shiki inline styles.

## Security posture (verified live)

- Public API: `posts`/`authors`/`projects` reads are row-filtered to `status=published`
  (drafts were anonymously readable before this pass — closed now), and `authors.user`
  is excluded from the public field list.
- Contributor permissions use row rules (`$CURRENT_USER`) + validation (`status` can
  never be set to `published`) + preset (`status: draft` on create).
- Learner sessions still have zero collection access (Astro's Guide Server token gates
  everything); Google login/session handling untouched.
- Removed the empty duplicate "Guide Reader" role/policy (live learners use
  `guide_reader`, per `GUIDE_READER_ROLE_ID` / `AUTH_GOOGLE_DEFAULT_ROLE_ID`);
  `v4-guides-schema.mjs` now adopts `guide_reader` instead of recreating the dup.

## Frontend contract

- Team pages (`/dream-team`, `[slug]`, homepage strip, related) filter
  `dream_team = true` (`lib/repositories/authors.ts` `TEAM`).
- Bylines everywhere else still use `posts.author` → any published author profile.
- Known follow-up (only matters once a contributor exists who is *not* on the team):
  byline links point at `/dream-team/<slug>`, which 404s for non-team authors — make
  the byline a plain span when `dream_team` is false.
