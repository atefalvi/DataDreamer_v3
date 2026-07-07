# Data Dreamer — Users / Authors Data-Model Audit

Date: 2026-07-07 · Read-only pass (no schema, data, or code changes made)
Evidence: live production Directus (read-only API), repo at `main` (`f7a9d9b`), plus
`docs/agent-workspace/16-ACCOUNT-MODEL.md` and `scripts/v4-account-model.mjs` history.
Secrets: referenced by env-var name only, never by value.

---

## 1. Executive Summary

- **The target architecture is ~80% built and live.** `authors.user` (M2O →
  `directus_users`) exists; `posts.author → authors`; `guide_progress.user →
  directus_users`; a least-privilege Contributor role exists with row-rule scoped,
  own-only permissions; the public API is published-only and never exposes
  `authors.user` (verified live: `?fields=user` → 403).
- **The approval workflow is designed and partially deployed:** a backend hook
  (`backend/extensions/directus-extension-author-profile`, committed at `f7a9d9b`)
  creates a draft profile at signup and publishes the linked profile when the user's
  role is set to **Contributor** — the one-action admin approval. **Unverified whether
  the production container is running this hook yet** (no `[author-profile] hook
  loaded` check was possible in this pass; see §13.A).
- **The exact reported inconsistency is confirmed:** Maria Khan's author profile is
  linked to her Google account, but her role is still `guide_reader`, so she has a
  published byline + Dream Team presence with zero authoring capability. Contributor
  role has **0 users**.
- **New finding — duplicate human identity:** "Syed Alvi" now exists twice: the
  original Administrator account (email/password) *and* a separate Google-login
  `guide_reader` account. The `syed-atef-alvi` author profile is linked to the
  **Administrator** account, not the Google one. One person, two accounts, one profile.
- **`/account` has no contributor experience at all** — it gates only on "is there a
  session" (`Astro.locals.user`), fetches guide progress, and stops. No Author
  Profile tab, no Posts tab, no author fetch, no author-edit API route. Contributors
  are expected to work inside the Directus app (policy has `app_access: true`).
- **Seed Bot has full Administrator access** — a seed/service account with the
  highest privilege in the system. Highest-severity cleanup item.
- **`open_innovation_grant` does not exist** — not in the production schema, zero code
  references. Nothing to keep, archive, or delete.
- **Two Contributor permission gaps vs the target:** contributors cannot edit their own
  `display_name` and cannot manage their own `specialties` junction rows.
- **Naming nits, not blockers:** the live flag is `dream_team` (target doc says
  `dream_team_enabled` — keep `dream_team`); the learner role is lowercase
  `guide_reader` (rename display-name only, IDs are what env vars reference).
- **Decision needed (§13.A/L):** whether profile creation happens at signup for
  everyone (current committed hook) or only at approval. Recommendation: **only at
  approval** — draft-per-signup pollutes Content → Authors with every learner.

## 2. Current-State Data Model

### Collections (production, custom only)

| Collection | Hidden | Purpose | Frontend consumer |
|---|---|---|---|
| `authors` | no | Public contributor profile (Dream Team + bylines) | `lib/repositories/authors.ts`, `_mappers.ts` |
| `authors_specialties` | no | M2M authors ↔ specialties (sort = primary) | authors repo (subfields) |
| `posts` | no | Blog | `lib/repositories/posts.ts` |
| `posts_topics` | no | M2M posts ↔ topics | posts repo |
| `projects` | no | Case studies | `lib/repositories/projects.ts` |
| `topics` | no | Shared taxonomy | topics repo, footer |
| `specialties` | no | Author taxonomy | authors/dream-team |
| `guides` | no | Field Guides | `lib/repositories/guides.ts` |
| `guide_sections` / `guide_items` | yes | Guide tree | guides repo |
| `guides_topics` / `guides_specialties` / `guides_authors` | yes | Guide junctions | guides repo |
| `guide_progress` | yes | One row per learner+guide | guides repo (`progressFor`, `myGuides`, `saveProgress`) |

No `lessons`, `enrollments`, `user_guides`, or `user_progress` collections exist —
`guide_progress` is the only progress store, and it is correctly keyed on the login
account (`guide_progress.user → directus_users`, verified via `/relations`).

`open_innovation_grant`: **not present** in the schema; `grep -rin innovation` across
frontend/scripts/backend returns nothing.

### `authors` fields vs target

| Target field | Live? | Notes |
|---|---|---|
| `user` M2O → directus_users | ✅ | SET NULL on delete; hidden from public reads |
| `status` (draft/published/archived) | ✅ | archive_value archived |
| `slug`, `display_name`, `role_title`, `bio`, `statement`, `avatar` | ✅ | |
| `links`, `tools`, `featured_work` | ✅ | JSON; zod-parsed in `_mappers.ts` |
| `specialties` M2M | ✅ | via `authors_specialties` |
| `dream_team_enabled` | ✅ as **`dream_team`** | same semantics; keep the live name |
| `sort` | ✅ | |

No missing, duplicate, or misnamed fields beyond the `dream_team` naming equivalence.

### Key relationships (verified via `/relations`)

```
authors.user        → directus_users   (the identity link; 2/2 profiles linked)
authors.avatar      → directus_files
posts.author        → authors          ✅ (not directus_users)
guide_progress.user → directus_users   ✅ (not authors)
guide_progress.guide→ guides · guide_progress.last_item → guide_items
```

### Backend/API consumers

- Astro server reads guides/progress with the **Guide Server** static token
  (`DIRECTUS_SERVICE_TOKEN`, frontend env) after verifying the learner session
  (`lib/auth/session.ts` `fetchMe`; `lib/directus/client.ts` `directusForService`).
- Public content uses the Public policy (no token) via `directus` client.
- `/api/auth/avatar` proxies the learner's Directus avatar (service token, private).
- `/api/guides/progress` writes progress rows scoped to the verified user id
  (`guides.ts:206,222,272,279` all filter `user: userId`).

## 3. Current-State Role & Permission Matrix

Roles (live): **Administrator** (2 users), **Contributor** (0 users, app_access),
**guide_reader** (2 users, no policies), **Guide Server** (1 service user).

| Collection | Public | guide_reader | Contributor | Guide Server | Admin |
|---|---|---|---|---|---|
| posts | R published | — (via public) | C (preset draft) / R pub+own / U own / D own drafts | — | full |
| posts_topics | R | — | C / R / D own-post rows | — | full |
| authors | R published, 14 fields (`user` excluded) | — | R (14 fields) / **U own, 7 fields** | R * | full |
| authors_specialties | R | — | R | — | full |
| topics / specialties | R | — | R | R | full |
| projects | R published | — | — | — | full |
| guides/sections/items | — | — (site uses service token) | — | R **published-only (row rules)** | full |
| guides junctions | — | — | — | R | full |
| guide_progress | — | — (site-mediated) | — | C/R/U (unrestricted; app-scoped) | full |
| directus_files | R | — | C / R | R | full |
| directus_users | — | (self via /users/me core) | (self via core) | R 9 profile fields | full |

Notes:
- `guide_reader` deliberately has **zero policies** — learner capability is delivered
  by the Astro bridge (session proves identity; Guide Server token does the reads,
  every query user-scoped in `guides.ts`). Contributor therefore **inherits guide
  access architecturally** — any valid account can use guides; role is irrelevant to
  guide access. This satisfies "Contributor = Guide Reader + authoring".
- Contributor `authors.update` own-row fields: `role_title, bio, statement, avatar,
  links, tools, featured_work` — **missing `display_name` and specialties junction
  write** vs the target safe list (gap; see §8).
- Contributor **cannot** touch `user`, `status`, `dream_team`, `slug`, `sort`, other
  users, or roles — all hard constraints hold today.
- `guide_progress` is open to the service token by design (it writes on behalf of any
  verified learner); ownership enforcement is app-layer. Documented trade-off.
- Over-permission: **Seed Bot is a full Administrator** (see §10).

## 4. Current-State Approval Workflow

Design (committed at `f7a9d9b`, hook `backend/extensions/directus-extension-author-profile`):

1. `users.create` → hook creates a **draft** `authors` profile linked to the new user
   (slug/display_name prefilled from account, `dream_team=false`).
2. Admin sets role → **Contributor** in User Directory → hook publishes the linked
   profile (creates one if missing). One admin action.
3. Dream Team = separate manual toggle on the profile.

Reality check (live):

- Contributor role exists with correct permissions; **0 users have it**.
- Only 2 author profiles exist, both linked, both published — **no draft profiles**,
  so the signup-time hook has demonstrably **not fired in production** (either the
  backend hasn't been redeployed since `f7a9d9b`, or no user signed up since). The
  role-approval path is therefore **unverified in production**.
- Maria: linked profile ✔ / role still `guide_reader` ✘ → she was never "approved"
  through the new mechanism; her state predates it.
- `/account` shows nothing extra after approval (no author tabs exist), so approval
  currently unlocks only Directus-app access, not website features.
- Fragmentation summary: **schema ✔, permissions ✔, hook committed ✔, hook deployment
  unverified, backfill of existing humans not done, frontend account surface absent.**

## 5. Current-State `/account` Contributor Experience

Evidence: `frontend/src/pages/account.astro`.

- **Gate:** `Astro.locals.user` only (line 15). No role check, no author-link check —
  Directus roles are not even present in the session view-model (`SessionUser` has
  `provider` but not `role`).
- **Tabs/sections:** profile summary (identity, avatar, provider badge), "Continue
  learning" / "Completed" guide lists (`guidesRepo.myGuides(user.id)`), sign-out.
  There are no tabs in the UI at all — it is a single dashboard page.
- **Author Profile editing:** none. No fetch of `authors where user = $me`, no edit
  form, no API route (`pages/api/` contains only `auth/*` and `guides/progress`).
- **Post authoring:** none on the website. The Contributor policy's `app_access: true`
  means authoring happens in the **Directus admin app** today.
- Gap vs target: everything in the "Author Profile in /account" spec is missing —
  the account page was built for learners only.

## 6. Proposed Normalized Data Model

**No structural changes required.** The live schema already matches the target:

| Piece | State | Action |
|---|---|---|
| `directus_users` = identity/login/permissions, never public | ✅ live | none |
| `authors` = 0..1 public profile per user, linked via `authors.user` | ✅ live (2/2 linked) | enforce uniqueness (below) |
| `posts.author → authors` | ✅ live | none |
| `guide_progress.user → directus_users` | ✅ live | none |
| `dream_team` boolean gates /dream-team | ✅ live (frontend `TEAM` filter, `authors.ts:49`) | keep name |

**One-active-profile-per-user enforcement (currently app-logic only, in the hook):**
recommended combination —
1. **DB unique index** on `authors.user` (nullable-unique; Postgres treats NULLs as
   distinct, so unlinked legacy rows stay legal). This is the real guarantee.
2. Keep the hook idempotent (it already reuses an existing linked row).
3. Do **not** make `authors.user` required — bylines for departed people whose login
   was deleted legitimately have `user = NULL` (relation is SET NULL on delete).

## 7. Proposed Approval Workflow

**Recommended admin action: change the user's Role to `Contributor` in User
Directory.** One field, native Directus UI, no custom app extension needed, and the
role *is* the capability — there is no way for a "role changed but permissions didn't"
disconnect. The committed hook makes this action also produce the profile.

- **What the admin does:** User Directory → user → Role = Contributor → Save.
  (Optionally also: open the profile and toggle *Dream team* when appropriate.)
- **What happens automatically (hook):** linked `authors` row is created if missing
  (prefilled `display_name`, `slug`, `role_title: 'Contributor'`, `dream_team:false`)
  or reused; profile is published so bylines work.
- **Defaults:** `dream_team=false` (constraint honored: contributors cannot
  self-publish to Dream Team), safe-field editing immediately available to the user,
  `status` — see the one open decision below.
- **`/account` unlock rule (recommended):** show author tabs when **a linked author
  profile exists for the current user** (`authors.user = me`, fetched server-side via
  the service token). This is safer and more maintainable than checking role, because
  (a) role names/ids stay out of the frontend, (b) the profile is what the tab edits —
  keying visibility off the thing being edited can never dangle, and (c) an
  admin-authored profile for a non-Contributor (e.g. legacy Maria before backfill)
  degrades gracefully to a read-only state rather than vanishing.
- **No disconnected state:** the boolean-ish signals (`dream_team`, `status`) control
  *visibility only*; capability comes only from the role; the hook keeps role ⇒
  profile consistent; the unique index keeps profile-per-user consistent. There is no
  standalone "is_author" flag anywhere — correct.
- **Open decision (owner):** current committed hook also creates a **draft profile for
  every new signup**. Recommend **removing the `users.create` branch** — hundreds of
  learners would mean hundreds of draft author rows cluttering Content → Authors and
  weakening "authors = approved contributors". Profile creation at approval time is
  sufficient and matches the product flow. (If the pending-review UX is wanted later,
  a filtered "pending" view is a better tool than pre-created rows.)

## 8. Gap Analysis

- **[approval-blocker][data-quality] High** — Maria Khan: published+linked profile but
  role `guide_reader`; cannot author. Contributor role has 0 users. Backfill needed.
- **[data-quality][disconnected] High** — Syed has two accounts (Administrator
  email/password `58a0b59a…` + Google `guide_reader` `adc7b215…`); the author profile
  links to the Administrator one. If he signs in with Google on the site, the session
  user has no linked profile → future account-page author tab won't show for him.
  Needs a human decision: which account is canonical for the profile link.
- **[approval-blocker][admin-ux] High** — hook deployment unverified in production
  (no `[author-profile]` evidence obtainable read-only; zero draft profiles exist).
  Until the backend image containing `f7a9d9b` is deployed, role-change approval does
  not auto-create/publish profiles.
- **[security][permissions] High** — Seed Bot is a full Administrator service/seed
  account. Should be demoted/suspended/renamed with a documented purpose.
- **[schema] Medium** — one-profile-per-user has no DB constraint (hook-only). Add
  nullable-unique index on `authors.user`.
- **[permissions] Medium** — Contributor can't edit own `display_name`; can't
  create/delete own `authors_specialties` rows (target says specialties are
  self-editable). Extend the policy field list + junction perms scoped via
  `{authors_id: {user: {_eq: $CURRENT_USER}}}`.
- **[account-ux][frontend] Medium** — `/account` has no Author Profile / Posts tabs,
  no author fetch, no edit API. Whole target section unimplemented.
- **[admin-ux] Medium** — draft-profile-per-signup (committed hook behavior) will
  clutter Content → Authors at scale; decide before deploying widely (§7).
- **[frontend] Low** — `SessionUser` doesn't carry role or author-link info, so no
  building block exists yet for account-tab gating; add `authorSlug`/`hasAuthorProfile`
  during enrichment (service token already reads the 9 user fields + can read authors).
- **[admin-ux] Low** — role naming: `guide_reader` (lowercase, snake) vs other roles'
  Title Case; rename display name to "Guide Reader" only after confirming nothing
  matches on name (the guides schema script matches `'guide_reader'` by name —
  update it in the same change; env vars reference IDs, unaffected).
- **[unused] Low** — `og-about.png` and other static assets aside, no unused
  collections found; `open_innovation_grant` already absent; guide junctions all
  consumed. Collection hygiene is good.
- **[permissions] Low** — Guide Server `authors.read fields:*` includes `user`
  (needed? enrichment uses `directus_users`, not authors) — could narrow to the public
  field list; harmless today because that token never reaches clients.

## 9. Migration Plan (ordered, reversible)

1. **Verify hook live** (ops): confirm the backend runs the `f7a9d9b` image; check
   startup log line `[author-profile] hook loaded`. *Rollback: redeploy previous image.*
2. **Decide + adjust hook scope** (owner decision from §7): keep or drop the
   `users.create` draft branch. *Reversible: single-file hook edit + redeploy.*
3. **Backfill Maria** (the only affected human): set her role → Contributor via the
   normal admin action (this also exercises the hook end-to-end; profile already
   linked/published, so it's a no-op on the profile). *Rollback: set role back;
   nothing else changes.*
4. **Resolve Syed's dual accounts** (human decision):
   - Option A (recommended): keep Administrator as his working account; re-link
     `syed-atef-alvi.user` → his Google account **only if** he wants site-side author
     features under Google login; otherwise leave as-is and delete/suspend the Google
     duplicate.
   - Flag: do not auto-link by email similarity — emails differ. Manual only.
   *Rollback: relink the previous user id (recorded in this report).*
5. **Add nullable-unique index** on `authors.user` (schema migration via idempotent
   script; verify the two linked rows are distinct first — they are). *Rollback: drop
   index.*
6. **Extend Contributor policy**: + `display_name` in own-author update fields; +
   `authors_specialties` create/delete scoped to own profile. *Rollback: re-run the
   previous `ensurePermission` payloads (script is idempotent + versioned).*
7. **Frontend account tabs** (separate deploy, §11): purely additive UI; no URL,
   slug, byline, login, or guide-access changes anywhere in this plan. Existing
   `/dream-team/[slug]` URLs, bylines, Google + email login, guide progress: untouched
   by every step above.
8. Records that cannot be auto-linked: none today (2 profiles, both linked). Any
   future unlinked profile (user deleted → SET NULL) is legitimate; surface in an
   admin filter rather than auto-fixing.

## 10. Cleanup Plan

| Item | Type | Recommendation | Reason | Evidence | Risk | Timing |
|---|---|---|---|---|---|---|
| Seed Bot (`se***@data-dreamer.net`) | user (seed) | **Investigate → demote or suspend** | full Administrator; unclear active use | `/users` role=Administrator | Low (verify seeding scripts first — they use admin *token*, not this account) | next ops window |
| Syed's Google `guide_reader` account | user (human dup) | **Investigate** (merge decision) | duplicate identity; profile links to the other account | `/users` `adc7b215…` | Low | with §9.4 |
| Guide User (`gu***@data-dreamer.net`) | user (service) | **Keep** + document | holder of Guide Server static token (`DIRECTUS_SERVICE_TOKEN`) | role Guide Server, 1 user | — | note in 16-ACCOUNT-MODEL |
| `guide_reader` role name | role | **Rename** display → "Guide Reader" | naming consistency | `/roles` | Low (update name-match in `v4-guides-schema.mjs:252`同时) | anytime |
| Contributor role | role | **Keep** | correct, awaiting first user | 0 users by design | — | — |
| hook `users.create` draft branch | code | **Investigate → likely Delete branch** | draft-per-signup clutters Authors | `extensions/directus-extension-author-profile` | Low | before wide deploy |
| `open_innovation_grant` | collection | **n/a — does not exist** | absent from schema & code | `/collections`, grep | — | — |
| Guide Server `authors.read fields:*` | permission | **Narrow** to public fields | excludes `user` from one more surface | perms dump §3 | Low | with §9.6 |
| `og-about.png` / `og-team.png` naming vs pages | asset | **Keep** | referenced by pages (`dream-team/index.astro:82`) | grep | — | — |
| `dream_team` field name | field | **Keep** (do not rename to `dream_team_enabled`) | live queries + public field list depend on it | `authors.ts:49` | rename = churn, no benefit | — |

## 11. Implementation Plan (sequenced so nothing breaks)

1. **Ops gate:** confirm backend image with the hook is live (§9.1); decide hook scope
   (§7). Nothing user-visible.
2. **Directus (idempotent script additions to `scripts/v4-account-model.mjs`):**
   unique index on `authors.user`; Contributor `display_name` + specialties-junction
   perms; optional Guide Server authors field narrowing. Run `v4-guides-service-check`
   + spot reads after.
3. **Approve Maria** via role change (first real use of the approval path). Verify:
   she can log into the Directus app, sees only her own posts/profile, can publish her
   own post, cannot touch `status`/`dream_team`/others.
4. **Session enrichment:** add `hasAuthorProfile`/`authorSlug` to `SessionUser` in
   `lib/auth/session.ts` (one extra service-token read of `authors?filter[user]=me`,
   memoizable per request). No UI yet — deploy safely.
5. **`/account` author surface:** tabs (Account · Guides · Author Profile · Posts)
   gated on `hasAuthorProfile`; Author Profile tab = form editing the 9 safe fields
   via a new same-origin API route (`/api/account/author`, POST, CSRF-checked like
   `/api/guides/progress`) that verifies the session and PATCHes the *linked* profile
   through the service token with an explicit field allow-list (defense-in-depth on
   top of the Directus policy). Posts tab v1 = list own posts + deep-link into the
   Directus app editor; website-native post editor is a later phase (§13.B).
6. **Tests:** unit — session enrichment mapping, allow-list filter; integration —
   account tab gating (anon / learner / contributor states); existing 104-test suite
   plus `v4-guides-smoke.mjs` regression.
7. **Deploy order:** backend (hook/permissions) → verify → frontend (enrichment) →
   verify → frontend (tabs/editor). Each step independently rollbackable (previous
   image / permission payloads are in the idempotent script history).

## 12. Risks & Rollback

- **Auth:** none of the steps touch login paths; Google + email/password flows are
  untouched (hard constraint honored). Rollback = previous frontend image.
- **Permissions:** widened Contributor fields are still own-row scoped; worst case a
  contributor renames their display name badly — editorial, not security. Rollback =
  re-run prior permission payloads.
- **Public URLs:** no slug/URL changes anywhere; Dream Team filter untouched.
- **Data migration:** only two humans affected (Maria role change; Syed link
  decision). Both single-field, recorded, reversible.
- **Service accounts:** do not touch Guide User; Seed Bot changes only after
  confirming no automation authenticates *as it* (scripts authenticate with the admin
  account's token, not Seed Bot — evidence: `scripts/*.mjs` read `DIRECTUS_ADMIN_TOKEN`).
- **Frontend regression:** account page changes are additive behind
  `hasAuthorProfile`; learners see zero difference.
- **Directus admin UX:** the only risky choice is draft-profile-per-signup — decide
  before it scales (§7).

## 13. Answers to Open Questions

**A. Simplest admin approval workflow?** Change the user's **Role → Contributor** in
User Directory (native UI, one field). The committed hook then creates/publishes the
linked profile automatically. Evidence: hook source
`backend/extensions/directus-extension-author-profile/dist/index.js` (`users.update`
→ `ensureProfile(id,'published')`). *Assumption:* the production container runs the
`f7a9d9b` image — unresolved read-only; resolve by checking backend startup logs for
`[author-profile] hook loaded` (or User-test after next deploy). No extra field,
button, or Flow needed; a Flow would add a second source of truth for no benefit.

**B. Where do contributors author posts?** Today: **Directus admin app only**
(Contributor policy `app_access: true`; `/account` has no posts UI — evidence
`pages/account.astro`, `pages/api/` contents). Recommendation: keep Directus for v1
(it's a capable, permission-scoped editor), add a Posts tab in `/account` that lists
own posts and deep-links to the Directus editor; build a website-native editor only
if contributor feedback demands it.

**C. Do author-profile edits publish immediately?** Yes — Contributor `authors.update`
(own row, 7 fields) has no review step, while `status`, `dream_team`, `slug`, `user`,
`sort` are excluded from the writable field list (evidence: permissions dump §3).
This matches the stated default assumption. Keep.

**D. Authors field list vs target?** Full match; only naming delta is live
`dream_team` vs target `dream_team_enabled` — keep `dream_team` (§2 table).

**E. `posts.author` shape?** M2O → **`authors`** (evidence `/relations/posts`). Correct.

**F. Current permissions per role?** Full matrix in §3 (from live `/permissions`).
Highlights: Public = published-only reads, `authors.user` hidden; Contributor =
own-scoped posts C/R/U + delete-own-drafts, own-profile 7 safe fields; Guide Server =
published-only guide reads (row rules), progress C/R/U, 9-field user read;
`guide_reader` = intentionally zero policies (site-mediated); Administrator = admin.

**G. Progress collections?** Only `guide_progress` (hidden), keyed
`user → directus_users`, `guide → guides`, `last_item → guide_items`. Consumed by
`lib/repositories/guides.ts` with every query filtered by the verified user id.

**H. What does `/account` check?** Only session presence (`Astro.locals.user`,
`account.astro:15`) — neither role nor author link. Recommended gate for author tabs:
**linked-author-profile existence** (§7 rationale).

**I. Do public pages expose `directus_users`?** No. Grep across `pages/` +
`lib/repositories/` shows no public route touching users; the only user-data path is
the authenticated avatar proxy (`/api/auth/avatar`) and server-side enrichment. The
Public policy has no `directus_users` permission at all (§3).

**J. Service accounts clearly separated?** Partially. Guide User is correctly isolated
under Guide Server (confirmed the service account behind `DIRECTUS_SERVICE_TOKEN`).
**Seed Bot is not** — it's a second full Administrator with no documented purpose
(scripts authenticate via `DIRECTUS_ADMIN_TOKEN`/admin login, not Seed Bot).
Recommend: document-or-demote (§10).

**K. Unused/confusing items?** No unused collections, no conflicting policies, no
stale roles (the earlier duplicate "Guide Reader" role was already removed). Confusion
points: lowercase `guide_reader` name; Seed Bot; Syed's duplicate account;
draft-per-signup hook decision.

**L. Contributor with no linked profile?** Should not persist: the hook creates the
profile at approval; the unique index prevents duplicates; if it's ever observed
(hook failure), `/account` should show "Author profile setup pending" (read-only
state) and the fix is re-saving the role or creating the profile manually — do **not**
have the frontend create authors rows client-side. Auto-creation stays server-side in
the hook only.

**M. Author profile exists but user still `guide_reader` (the Maria case)?** Flag and
fix **manually via the normal approval action** (role → Contributor) — a migration
that auto-promotes anyone with a profile would silently grant authoring capability to
any profile an admin ever created for display-only purposes. Manual, per-person,
recorded: Maria is the only current instance.

---

*End of audit. No schema, data, code, or permission changes were made in this pass.*

---

## Implementation follow-up — 2026-07-07 (v4.3, this pass)

Executed from this audit: hook rewritten to **approval-only** profile creation (no
draft-per-signup; archived profiles not revived); Contributor ownership moved to
`post.author.user = $CURRENT_USER` (covers admin-created posts with a contributor
byline); Contributor can now edit own `display_name` + manage own
`authors_specialties`; DB **unique constraint on `authors.user`** (verified 2 linked,
0 duplicates first); role renamed `guide_reader` → "Guide Reader"; **Maria Khan
promoted to Contributor** (profile untouched); **Seed Bot demoted + suspended**;
session enrichment (`hasAuthorProfile`/`authorId`/`authorSlug`) gates new `/account`
tabs (Account · Guides · Author Profile · Posts); author editing via
`/api/account/author` (allow-listed, https-only URLs, specialty validation, junction
replace); Posts tab lists own posts with Directus deep links. Remaining manual items:
backend redeploy to load the updated hook (check `[author-profile] hook loaded`),
and the Syed dual-account link decision (§8).
