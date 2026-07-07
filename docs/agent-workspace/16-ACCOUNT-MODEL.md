# 16 — Account model (v4.2): one account, opt-in public roles

Applied to production 2026-07-06 via `scripts/v4-account-model.mjs` (idempotent).

## The model

**One person = one login account + (optionally) one public profile, linked.** They are
two collections on purpose, joined by `authors.user`:

```
          directus_users (private)                 authors (public)
          ── the login / identity ──               ── the public profile ──
  ┌──────────────────────────────────┐     ┌──────────────────────────────────┐
  │ id, email, password/Google,      │◄────┤ user  (M2O → directus_users)     │
  │ role (guide_reader | Contributor │  1:1 │ slug, display_name, bio, avatar, │
  │       | Administrator)           │     │ links, specialties,              │
  │ guide_progress rows              │     │ dream_team (bool)                │
  └──────────────────────────────────┘     └──────────────────────────────────┘
   every signup/Google login gets one        only people with a public presence
                                              (Dream Team and/or blog byline)
```

Maria Khan is **one identity**: one `directus_users` row (her Google login — she takes
guides like anyone) *and* one `authors` row (`dream_team=true`, her posts point at it via
`posts.author`), tied together by `authors.user`. Being a guide user, a Dream Team member,
and an author are three hats on the **same** account, not three accounts.

| Capability | How it's granted | Where it lives |
|---|---|---|
| Take guides + track progress | automatic on signup/Google (role `guide_reader`) | `directus_users` + `guide_progress` |
| Appear on /dream-team | admin sets `authors.dream_team = true` | `authors` |
| Byline on posts | `posts.author` → the `authors` row | `authors` |
| Write + publish own posts in Directus | admin assigns the **Contributor** role (profile auto-created) | role/policy on `directus_users` |
| Publish anything | admin only | Administrator |

### Why two collections and not one

`directus_users` is Directus's built-in auth table — Google OAuth and password login
provision rows there, and it holds emails, roles, and session data that must **never** be
exposed to anonymous visitors. `authors` is a public content collection safe to read
anonymously (name, bio, avatar, slug). Merging them would mean either exposing the auth
table publicly (a data leak) or losing Directus-native login — so the correct, standard
pattern is **two collections linked 1:1 via `authors.user`**, which is what we have. The
public API never returns `authors.user` (verified: `?fields=user` → 403).

The link is what makes a logged-in person recognizable as their profile — and it's what
lets a Contributor edit only their **own** profile (`authors.update` is scoped to
`user = $CURRENT_USER`). Without it, that permission matches nothing.

> Reconciliation note (2026-07-06): the two profiles that predate the `user` field —
> `maria-khan` and `syed-atef-alvi` — were linked to their accounts by
> `scripts/v4-account-model.mjs` (`linkKnownAuthors`). New profiles get `user` set by the
> admin at approval time.

## Admin runbook (simplified 2026-07-06)

- **Make someone an author — one step:** User Directory → their account → Role =
  **Contributor**. The `author-profile` backend hook auto-creates their linked `authors`
  profile (name + slug prefilled from the account, `dream_team=false`). They can then
  log into the Directus app to: write, edit, and **publish their own posts**; delete
  their own drafts; upload files; tag topics; and edit their own profile (bio, avatar,
  links, tools). They can never touch other people's posts, publish others' drafts,
  or change their own `dream_team`/`slug`/`user` fields.
- **Put them on the Dream Team:** open the auto-created profile (Content → Authors)
  and toggle **Dream team** on. That's the only extra step — profile fields are already
  there for them (or you) to fill in.
- **Revoke:** flip `dream_team` off / set role back to `guide_reader`. Their published
  posts stay (bylines keep working; the byline is plain text if they're not on the team).

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
