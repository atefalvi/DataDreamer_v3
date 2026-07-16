# Account model: one account, opt-in public roles

Applied to production on July 6, 2026. The current collection structure is captured in
`backend/snapshot.yaml`; role and policy changes are administered in Directus.

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
| Write and submit posts for review | admin assigns the **Contributor** role (profile auto-created) | role/policy on `directus_users` |
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
> `maria-khan` and `syed-atef-alvi` — were linked to their accounts during the account
> model migration. New profiles get `user` set by the admin at approval time.

## Admin runbook (v4.3, 2026-07-07)

**To approve a user as an author:**
1. Open the user in Directus (User Directory).
2. Change **Role** to **Contributor**.
3. Save.
4. The `author-profile` hook creates or links their Author profile automatically
   (prefilled name + slug, `dream_team=false`; an existing linked draft is published,
   an archived one is left archived).
5. The user can now log into the Directus studio with the same Google/email account
   and write posts — create drafts, edit their own work, and set `status = in_review`
   when it is ready. Only an administrator publishes.
6. The user sees **Author Profile** and **Posts** tabs in `/account` and can edit
   their own safe profile fields (display name, role title, bio, statement, links,
   tools, featured work, specialties) from the website.
7. Admin still controls Dream Team visibility (`dream_team` toggle on the profile),
   publishing status, slug, sort, roles, and all system fields.

**Revoke:** set the role back to Guide Reader (site author tabs disappear only when
the profile link is removed or the profile is archived — role controls capability,
the linked profile controls the account tabs). Signups never create profiles;
authors = approved contributors only.

**One profile per user** is enforced three ways: DB unique constraint on
`authors.user`, the idempotent hook, and the /account API always targeting the
profile linked to the verified session (no client-supplied ids).

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
- Contributor permissions use row rules: ownership is `post.author.user =
  $CURRENT_USER` (create presets `status: draft`; contributors may use only `draft`
  and `in_review`; delete own drafts). Own-profile edits are field-restricted at BOTH layers: the Directus policy
  and the `/api/account/author` allow-list (`lib/account/authorForm.ts`) — user/
  status/dream_team/slug/sort are unwritable from the website and the studio alike.
- Seed Bot demoted from Administrator and suspended (2026-07-07); Guide User remains
  the only service account (Guide Server role, holder of DIRECTUS_SERVICE_TOKEN).
- Learner sessions still have zero collection access (Astro's Guide Server token gates
  everything); Google login/session handling untouched.
- Removed the empty duplicate "Guide Reader" role/policy; live learners use
  `guide_reader`, per `GUIDE_READER_ROLE_ID` / `AUTH_GOOGLE_DEFAULT_ROLE_ID`.

## Frontend contract

- Team pages (`/dream-team`, `[slug]`, homepage strip, related) filter
  `dream_team = true` (`lib/repositories/authors.ts` `TEAM`).
- Bylines everywhere else still use `posts.author` → any published author profile.
- Bylines link to `/dream-team/<slug>` only when the author has a public Dream Team
  profile. Other valid authors render as plain attribution.
