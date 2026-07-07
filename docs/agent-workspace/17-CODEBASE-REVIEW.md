# DataDreamer Codebase Review Report

Date: 2026-07-06 · Reviewer: Senior-architect audit pass (read-only; no code changed)
Scope: `frontend/` (Astro 5 SSR), `scripts/`, Directus integration, auth, CMS model.
Verified against live production where relevant (permissions, dev routes, caching).

---

## 1. Executive Summary

**Working well:** This is a disciplined codebase with unusually clear layering for its
size. Pages never touch the Directus SDK directly — everything goes through
`lib/repositories/*` with row types (`lib/directus/schema.ts`) mapped to view-models
(`types/content.ts`) in `_mappers.ts`. Errors are typed (`RepositoryError` +
`guard()`), SEO is centralized (`SeoHead` + `lib/seo/meta.ts`), the markdown pipeline
has a single entry point with golden-snapshot tests (103 tests passing), migrations are
idempotent scripts with a README, and the v4.2 account model (one login, admin-granted
Dream Team / Contributor add-ons) is clean and just landed.

**Biggest maintainability risks:** (1) the blog page detects image grids by
string-sniffing rendered HTML; (2) `cachedPerRequest` was built and tested but never
wired in, so `countsByAuthorId` fires the same aggregate query 2–3× per Dream Team
render; (3) byline links hardcode `/dream-team/<slug>` and will 404 for the first
blog-only Contributor.

**Biggest scalability risks:** none structural at current scale. Markdown rendering
(Shiki + KaTeX) per SSR request is real work, but the middleware's
`s-maxage=300, stale-while-revalidate=86400` behind Cloudflare absorbs it. The
catalogue/list queries select fields intentionally — no over-fetching pattern.

**Biggest security/privacy concerns:** minor and enumerated — two internal styleguide
pages are live on production (`/dev/styleguide`, `/dev/styleguide-prose` return 200);
guide collections still rely on app-layer gating even though the production license
now supports row rules; and two env items flagged earlier (`DIRECTUS_SECRET` < 32
bytes, `SESSION_COOKIE_SECURE=false`) plus secret rotation remain operator to-dos.
Service tokens are correctly server-only; drafts and the `authors.user` link were
locked down in the v4.2 hardening (verified live).

**Verdict:** healthy and safe to keep building on. Fix the small, concrete items in
Priority 1 before shipping more account-facing features; nothing needs a rewrite.

---

## 2. Overall Rating

**Overall rating: 7.5/10**

Why: strong architecture, typing, and test discipline for a small-team project;
loses points for a handful of fragile contracts (HTML sniff), unwired infrastructure
(per-request cache), latent 404s in byline links, and residual ops/env hardening.
Nothing scores low because nothing is structurally wrong.

- Architecture: **8/10** — clean layers, single-purpose libs, consistent page pattern.
- Maintainability: **7/10** — a few fragile contracts + some 500–1000-line page files.
- Scalability: **7/10** — fine with edge caching; repeated aggregates and per-request
  markdown rendering are the first things to hit at scale.
- Security: **7.5/10** — tokens server-only, drafts/user link locked down; dev pages
  exposed, DB-level guide rules not yet used, env items pending.
- Type safety: **8/10** — row/view-model separation; `any` confined to one documented
  pattern (`type Fields = any`, duplicated 5×).
- CMS/data model clarity: **8/10** — collections are well-scoped; `authors` doing
  team+byline is now explicit via `dream_team`; junctions clean.
- Frontend component structure: **7/10** — good component boundaries; several page
  files are large because Astro co-locates styles (idiomatic, but creeping).
- Auth/permission model: **8/10** — post-v4.2 the model is right: one account,
  opt-in public roles, least-privilege Contributor; session lifecycle has two
  documented ponytail gaps (no OAuth refresh, no server-side token revocation).

---

## 3. Strengths

1. **Repository layer + view-model mapping.**
   `lib/repositories/{posts,authors,guides,projects,topics}.ts` → `_mappers.ts` →
   `types/content.ts`. Pages import view-models only; the Directus SDK appears in
   exactly one place per concern. Renaming a CMS field is a two-file change.
2. **Three clearly-separated Directus access paths.**
   `lib/directus/client.ts`: public `directus` (optional read token), server-only
   `directusForService()` (throws without `DIRECTUS_SERVICE_TOKEN`), and
   `directusServiceFetch` for system endpoints. Doc comments state the rules; no
   `PUBLIC_` leakage of secrets anywhere.
3. **Typed error contract.** `RepositoryError` kinds (`not_found`/`fetch_failed`/
   `invalid_data`) + `guard()` wrapper (`lib/repositories/errors.ts`); pages map kinds
   to 404/ErrorState/500; decorative fetches deliberately `catch {}`. Consistent.
4. **Markdown pipeline with golden tests.** One entry (`renderMarkdown.ts`), custom
   blocks registered in one set, handlers in one file, fixtures + snapshots catch any
   output drift (`__tests__/renderMarkdown.test.ts`). The v4.2 rich-block additions
   slotted in without touching the engine.
5. **Auth bridge design.** Learner cookie proves identity (`/users/me?fields=id`),
   service token enriches only that verified id (`lib/auth/session.ts` `fetchMe`);
   `safeNext` open-redirect guard is unit-tested; avatar served via a private proxy
   (`/api/auth/avatar`), never a raw Directus URL; CSRF = same-origin check in
   `middleware.ts` + `X-Requested-With` on JSON APIs.
6. **Edge caching by default.** `middleware.ts:91` sets
   `public, max-age=0, s-maxage=300, stale-while-revalidate=86400` on anonymous HTML
   and `private, no-store` on session-bearing pages. Right defaults, one place.
7. **Idempotent, documented ops scripts.** `scripts/README.md` separates Active vs
   applied `migrations/`; `v4-account-model.mjs` / `v4-guides-schema.mjs` are rerunnable;
   the non-mutating `v4-guides-service-check.mjs` validates credentials without
   printing them.
8. **v4.2 account model.** One `directus_users` account; Dream Team and blog authoring
   are admin-granted (`authors.dream_team`, Contributor role with row-rule scoped,
   draft-only permissions). Public API hardened to published-only + `authors.user`
   hidden (verified live). `docs/agent-workspace/16-ACCOUNT-MODEL.md` is the runbook.

---

## 4. Issues Identified

### Issue 1: Image-grid lightbox gated by string-sniffing rendered HTML

Severity: Medium
Category: Maintainability
Where found: `frontend/src/pages/blog/[slug].astro:133` —
`hasImageGrid = post.bodyHtml.includes('class="image-grid"')`

What is happening: whether the lightbox `<dialog>` renders depends on a substring
match against the final HTML. The real contract (`class="image-grid"`, `.ig-item`,
`data-src`, `data-index`) lives implicitly across `lib/markdown/rehype.ts`,
`prose.css`, and `ArticleEnhancements.astro`.

Why this is a problem: any innocent change to class emission order/name in the
rehype handler silently disables the lightbox with no test failure at the page level.
It already constrains work (the v4.2 grid-title wrapper had to be designed around it).

Recommended solution: make `renderMarkdown` return the fact instead of the page
inferring it: add `hasImageGrid: boolean` to `RenderedMarkdown` (set in the imagegrid
handler or by checking the mdast once), thread it through `mapPost` → `Post`.

Implementation approach: (1) add the flag in `lib/markdown/types.ts` +
`renderMarkdown.ts`; (2) expose on `Post` in `types/content.ts` via `_mappers.ts`;
(3) switch `[slug].astro` to `post.hasImageGrid`; (4) keep the old sniff for one
release as a fallback if paranoid, then delete.

Risk of fixing: Low
Regression testing needed: blog post with grid → lightbox opens; post without grid →
no dialog in DOM; snapshot suite.

### Issue 2: Per-request cache built and tested but never wired — duplicate aggregates per render

Severity: Medium
Category: Performance / Maintainability
Where found: `lib/repositories/cache.ts` (`cachedPerRequest`, exported from
`index.ts`, tested in `cache.test.ts`, **zero call sites**);
`lib/repositories/posts.ts:212` `countsByAuthorId`;
`authors.ts` `allWithCounts` / `bySlug` / `related` each call it independently.

What is happening: a Dream Team profile render (`pages/dream-team/[slug].astro`)
executes the identical `posts` aggregate 2–3 times (bySlug → counts, related →
counts, page may also fetch counts via listing). The purpose-built memoizer exists
but nothing uses it. The footer topics fetch likewise repeats per page.

Why this is a problem: duplicated network round-trips per SSR render, and the cache
module is misleading dead infrastructure — a future agent will either duplicate it or
assume it's active.

Recommended solution: wire `cachedPerRequest(Astro.locals, key, load)` into the 2–3
hot loaders (`countsByAuthorId`, footer topics), or — if judged not worth threading
`locals` through repos — delete the module. Don't leave it in limbo.

Implementation approach: repos accept an optional `scope?: object` param defaulting
to a module-level throwaway; pages pass `Astro.locals`. Start with
`countsByAuthorId` only.

Risk of fixing: Low
Regression testing needed: dream-team index + profile render identical counts;
vitest suite; one render triggers one aggregate (assert with a spy).

### Issue 3: Byline links 404 for future non-team contributors

Severity: Medium (latent — zero impact today, guaranteed bug on first Contributor)
Category: Routing / Maintainability
Where found: `components/blog/AuthorBlock.astro`, `components/blog/PostCard.astro`
(byline refs), `components/guides/GuideHero.astro:42`,
`pages/projects/[slug].astro:21`, and JSON-LD author URLs in `lib/seo/meta.ts` /
`SeoHead` — all hardcode `/dream-team/${slug}`.

What is happening: v4.2 correctly filters team pages by `dream_team=true`, but every
byline still links to a team profile URL. A Contributor who writes posts without
being on the team produces dead links and dead JSON-LD `author.url`s.

Why this is a problem: broken UX + SEO signals the moment the new Contributor role is
actually used — which is the point of having it.

Recommended solution: add `dreamTeam: boolean` to `AuthorRef` in the mapper; byline
components render `<a>` when true, `<span>` when false; omit `author.url` from
JSON-LD when false. (Already noted as the known follow-up in 16-ACCOUNT-MODEL.md.)

Implementation approach: (1) add `dream_team` to author ref field selections +
`mapAuthorRef`; (2) update the 4 byline components conditionally; (3) update
`SeoHead` author URL logic; (4) test with a seeded non-team author.

Risk of fixing: Low
Regression testing needed: existing posts/projects/guides bylines still link; SeoHead
snapshot tests updated deliberately.

### Issue 4: Internal styleguide pages live on production

Severity: Medium
Category: Security (exposure) / Routing
Where found: `pages/dev/styleguide.astro`, `pages/dev/styleguide-prose.astro` —
verified live: both return **200** on data-dreamer.net; `pages/dev/guides-preview.astro:16`
has the correct guard (`if (import.meta.env.PROD) return Astro.rewrite('/404')`) and 404s.

What is happening: two of the three dev pages lack the PROD rewrite the third has.
`public/robots.txt` doesn't disallow `/dev` either (it does disallow stale routes
like `/student`, `/forgot-password`, `/reset-password` that don't exist).

Why this is a problem: internal harnesses are publicly reachable and indexable — no
data leak (mock/static content), but it's unprofessional surface and can leak design
intent; the inconsistency invites the next dev page to also ship ungated.

Recommended solution: copy the one-line guard from `guides-preview.astro` into both
files; add `Disallow: /dev` to robots.txt; drop stale robots entries.

Implementation approach: 3 one-line edits + robots.txt; redeploy; curl the three
routes expecting 404/404/404.

Risk of fixing: Low
Regression testing needed: dev pages still render in `npm run dev`; prod 404s.

### Issue 5: Guide content gating is app-layer only despite licensed row rules

Severity: Medium
Category: Security / CMS model
Where found: `scripts/v4-guides-schema.mjs` (Guide Server permissions are
all-or-nothing `fields:['*']` with no row rules — written when the staging instance
rejected `custom_permission_rules_enabled`); `lib/repositories/guides.ts` enforces
published/preview/ownership in app code.

What is happening: the service token can read draft guides and any user's
`guide_progress` row; only Astro code scopes queries. The v4.2 work proved the
**production license accepts row rules** (probe create/delete succeeded), so the
original constraint no longer holds.

Why this is a problem: single-layer enforcement — one repo-code regression (a missed
`user` filter on a progress query) becomes a data leak instead of being stopped by the
DB. Defense-in-depth is now free.

Recommended solution: add row rules to the Guide Server policy where they don't break
legitimate access: `guides/sections/items` read → `status=published` is **not**
possible (server must read drafts? it doesn't — previews only use published), so
published-only rules fit; `guide_progress` needs all-users access (server writes on
behalf of verified users), keep as-is but consider `validation` requiring `user` to be
set. At minimum: published-only on the three content collections.

Implementation approach: extend `v4-account-model.mjs`-style script (or the guides
script) with `permissions: {status:{_eq:'published'}}` on guide reads; rerun
`v4-guides-service-check.mjs` + `v4-guides-smoke.mjs` to prove nothing broke.

Risk of fixing: Medium (could 403 a query that touches drafts unexpectedly — smoke
test catches it)
Regression testing needed: full guides smoke (catalogue, preview, reader, progress
create/update/read-back), account "My guides".

### Issue 6: Session lifecycle gaps (documented ponytail shortcuts)

Severity: Low–Medium
Category: Auth
Where found: `lib/auth/session.ts:255` — OAuth path uses `directus_session_token`
directly with no server-side refresh ("user re-auths when it expires");
`logout()` in JSON mode clears cookies but the refresh-token revocation is
best-effort and the stateless access JWT stays valid until TTL (noted in
`qa/guides.md`).

What is happening: two consciously-taken shortcuts with comments. Google users get
signed out when the Directus session TTL lapses (no silent renewal); a stolen access
token remains usable for its short TTL after logout.

Why this is a problem: mostly UX (unexpected sign-outs) plus a small exfil window.
Not urgent; becomes worth fixing when guide engagement grows.

Recommended solution: (a) for OAuth, call Directus `/auth/refresh` in session mode
when the cookie is near expiry — or accept re-auth and say so in the UI; (b) keep
logout as-is (standard pattern) unless a compliance need appears.

Implementation approach: only if/when needed; the code comments already mark the
upgrade path.

Risk of fixing: Medium (session edge cases)
Regression testing needed: login/logout/refresh across email + Google, expiry
behavior.

### Issue 7: `type Fields = any` duplicated across five repositories

Severity: Low
Category: Types / Maintainability
Where found: `lib/repositories/authors.ts`, `posts.ts`, `guides.ts`, `projects.ts`,
`topics.ts` — each declares `type Fields = any; // eslint-disable…`.

What is happening: the documented single `any` exception (SDK dotted-field arrays
aren't generically typeable) is copy-pasted per file.

Why this is a problem: five declarations of the "one" exception; a future stricter
SDK type or lint rule means five edits, and the exception reads as five exceptions.

Recommended solution: export `type SdkFields = any` once from
`lib/directus/client.ts` (or `schema.ts`) with the justification comment; import it.

Implementation approach: mechanical; 6 files.
Risk of fixing: Low
Regression testing needed: `astro check` + vitest.

### Issue 8: Markdown render cost on cache miss (Shiki + KaTeX per request)

Severity: Low
Category: Performance
Where found: `lib/markdown/renderMarkdown.ts` (full unified pipeline per SSR render
of posts/projects/guides); mitigated by `middleware.ts` edge caching.

What is happening: every cache-miss render re-highlights code and re-renders KaTeX.
The rich-content demo post is the heaviest page. At current traffic + s-maxage=300 +
SWR=86400 behind Cloudflare this is fine.

Why this is a problem: only at scale, or if cache headers are ever weakened. There is
no per-content memoization keyed on the CMS row's update time.

Recommended solution: nothing now. If p95 TTFB grows: raise `s-maxage` for blog HTML
(content changes rarely), or memoize `renderMarkdown(content-hash)` in-process.

Risk of fixing: Low (when done)
Regression testing needed: cache-header behavior on anonymous vs session pages.

### Issue 9: Large single-file pages/components

Severity: Low
Category: Components / Maintainability
Where found: `pages/dream-team/index.astro` (968 lines),
`components/home/HeroSignalField.astro` (880), `pages/blog/[slug].astro` (589),
`lib/graph/enhancer.ts` (575), `pages/account.astro` (548),
`components/global/SiteNav.astro` (525).

What is happening: Astro co-locates markup + scoped styles + script, so line counts
inflate legitimately — but dream-team/index and HeroSignalField each bundle layout,
data prep, large scoped CSS, and canvas/graph glue in one file.

Why this is a problem: not wrong today; these files are where future agents will make
collateral mistakes because unrelated concerns share a scroll. No action until one of
them needs a feature — then split along existing seams (graph enhancer already
separate; extract the signal-field canvas config, the team-grid card grid).

Recommended solution: opportunistic extraction only; no proactive refactor.
Risk of fixing: Medium if done wholesale — hence: don't.
Regression testing needed: visual pass on the touched page.

### Issue 10: Ops/env hardening still pending (flagged previously, unresolved at review time)

Severity: Medium (operational, not code)
Category: Security
Where found: backend env (Coolify): `DIRECTUS_SECRET` 16 chars (Directus logs the
insecure warning at boot), `SESSION_COOKIE_SECURE=false` on an HTTPS-only site;
credentials (admin password, Google client secret, service token, DB password) were
shared in plaintext during ops sessions; redundant `AUTH_GOOGLE_REDIRECT_ALLOW_LIST`
and unused `APP_ORIGIN` env vars invite confusion.

Recommended solution: the checklist already exists in
`docs/agent-workspace/google-auth-profile-investigation.md` §Env — execute it in one
maintenance window (`openssl rand -hex 32` secret rotation signs everyone out;
schedule deliberately) and rotate the exposed secrets.

Risk of fixing: Low (planned window)
Regression testing needed: login (email + Google), guide read, logout.

---

## 5. Duplicate or Redundant Code

| Duplication | Where | Clean up? | Approach | Urgency |
|---|---|---|---|---|
| `type Fields = any` ×5 | all repositories | Yes | single exported alias (Issue 7) | Optional |
| `const PUBLISHED = { status: { _eq: 'published' } }` ×6 | repositories | Borderline | a shared `filters.ts` const; low value, low cost | Optional |
| `countsByAuthorId` re-fetch per call site | authors.ts ×3 call paths | Yes | wire `cachedPerRequest` (Issue 2) | Should-fix |
| `cachedPerRequest` unused-but-tested module | `lib/repositories/cache.ts` | Yes — use it or delete it | Issue 2 | Should-fix |
| Author field lists (summary/detail/byline subsets) | `authors.ts`, `posts.ts` (author.* subfields), `guides.ts` (author.*) | No | each selection is intentionally minimal per query; consolidating would cause over-fetching | Leave |
| Dev-page PROD guard present in 1 of 3 dev pages | `pages/dev/*` | Yes | copy the guard (Issue 4) | Must-fix |
| SVG icon markup inline in lightbox/copy button | `ArticleEnhancements.astro`, `rehype.ts` | No | 2 sites, static, readable; an icon system for 4 SVGs is over-engineering | Leave |
| `.prose`/`.blog-content` doubled selectors throughout `prose.css` | styles | No | deliberate dual-scope contract; a preprocessor would add tooling for cosmetics | Leave |

No duplicated business logic was found in auth, progress derivation (single pure
`deriveProgress`), or markdown handling.

## 6. User/Profile/Auth Model Review

Post-v4.2 (see `16-ACCOUNT-MODEL.md`) the model is **clean and correct**:

- **Single source of truth:** `directus_users` is the only account record. Guide
  learners are just accounts with role `guide_reader`. Public identity (`authors`) is
  a separate curated record *linked* via `authors.user` — public pages never read
  `directus_users`.
- **No duplication:** Dream Team membership = `authors.dream_team`; blog authoring =
  Contributor role. Both admin-granted, both revocable, both on the same account.
  Bylines and team pages share one `authors` collection intentionally.
- **Scalable:** thousands of learners cost nothing (no authors rows); approved
  contributors are the only rows added. Contributor permissions use `$CURRENT_USER`
  row rules — no per-user configuration.
- **Server-side authorization:** all gating decisions happen in Astro server code or
  Directus policies. No client-side-only permission checks exist (the client only
  receives already-filtered HTML and a normalized identity object).
- **Change:** fix byline links for non-team contributors (Issue 3) *before* approving
  the first Contributor; add DB-level published-only rules for guide content (Issue 5).
- **Leave alone:** the two-token bridge (learner proves id → service token acts),
  the avatar proxy, the session cookie design, and the `authors` dual-purpose
  collection — splitting "team profile" from "byline profile" into two collections
  would be pure over-engineering.

## 7. Directus/CMS Model Review

**Well designed:** `posts`/`topics`/`posts_topics`, `authors`/`specialties`/
`authors_specialties`, `projects`, and the guides tree
(`guides → guide_sections → guide_items` + `guide_progress` one-row-per-user+guide).
Junctions are conventional; view-model mapping keeps page code independent of shape.

**Overlap:** `authors` intentionally serves Dream Team + bylines — now explicit via
`dream_team`. No other overlapping collections.

**Relationships to add/clarify:** none required. Optional nicety: `guide_progress`
uniqueness (user+guide) is app-enforced — a DB unique constraint would prevent
duplicate rows if a race ever slips through.

**Fields that are risky:** `authors.links/tools/featured_work` are untyped JSON
(`unknown` in rows) — fine, but mappers must keep defensive parsing (they do).
`posts.content` markdown depends on `wysiwygNormalize` regex cleanup for
WYSIWYG-authored content — fragile by nature but pinned by fixture
`real-post-003-wysiwyg-cleanup.md`; keep the fixture in sync when Directus's editor
changes.

**Permission concerns:** public reads now row-filtered to published (v4.2, verified);
Contributor cannot publish or cross-edit (row rules + validation); Guide Server
remains over-broad (Issue 5). `directus_files` public read is `*` — acceptable since
uploads are site assets, but private files (user avatars) rely on the file not being
guessable; the avatar proxy pattern already avoids exposing ids.

**Migration/backfill concerns:** none outstanding; scripts are idempotent and the
account-model backfill ran. Move `v4-guides-schema.mjs`/`v4-account-model.mjs` into
`scripts/migrations/` once stable (the README convention says applied schema scripts
move there).

## 8. Frontend Code Review

- **Page structure:** consistent — fetch via repo in frontmatter, map `RepositoryError`
  kinds to 404/500/ErrorState, render with `SeoHead`. Blog/guides/projects/dream-team
  all follow it. `/account` handles both anon (onboarding) and authed (dashboard)
  states in one page — acceptable, borderline size (548 lines).
- **Components:** clear boundaries (`blog/`, `guides/`, `dream-team/`, `global/`,
  `ui/`). No premature generic components. `GuideItem.astro` renders all item types
  via a switch — right call vs 9 micro-components.
- **Layouts/metadata:** single `SeoHead` with JSON-LD builders in `lib/seo/meta.ts`;
  OG images per-section generated by scripts into `public/og/`. Centralized enough.
- **Error/loading states:** SSR means no client loading states except progress
  updates (optimistic with revert) — fine. Decorative fetch failures degrade silently
  by design.
- **Data fetching:** field selections are explicit constants per query — intentional,
  no `fields: ['*']` in app queries. One gap: markdown body images are transformed to
  a fixed `width=1440` (`lib/markdown/images.ts`) even for grid thumbnails rendered at
  ~12rem — cheap improvement: request smaller width for `.ig-item` thumbs while keeping
  1440 for the lightbox `data-src`.
- **Styling:** tokenized (`tokens.css`), scoped styles per component, `prose.css` as
  the one shared contract for rendered markdown (1,100 lines, organized by block —
  fine, watch its growth).
- **Practical improvements:** Issues 1–4 above; plus `readingMinutes` recomputed per
  render is trivial cost — ignore.

## 9. Security Review

- **Tokens:** `DIRECTUS_SERVICE_TOKEN` read via `process.env`/`import.meta.env` in
  `lib/directus/client.ts` only; never `PUBLIC_`-prefixed; never serialized into HTML;
  `directusForService()` throws without it. Learner `accessToken` lives in
  `Astro.locals`, not sent to the client. ✔
- **Env vars:** frontend requires only non-secret `PUBLIC_*` + server secrets; no
  secrets in the repo (`.env` gitignored; `backend/data` + `uploads` on disk but **not**
  git-tracked — verified `git ls-files` = 0). Backend env issues → Issue 10. ✔/⚠
- **Server/client separation:** all Directus reads happen in frontmatter/API routes;
  the only client fetch is `/api/guides/progress` (same-origin, `X-Requested-With`,
  session-checked, service-token write scoped to the verified user). ✔
- **Directus permissions vs frontend assumptions:** aligned since v4.2 — public reads
  are published-only at the DB (previously app-only). Guides remain app-gated
  (Issue 5). ✔/⚠
- **Public/private fields:** `authors.user` excluded from public reads (verified live
  403 on `?fields=user`); learner emails/names never appear in public pages;
  avatar via authenticated proxy. ✔
- **Authenticated routes:** middleware CSRF check on unsafe `/api/*` methods
  (`isTrustedRequestOrigin`, compensating for `security.checkOrigin: false` behind the
  TLS proxy); `/account` renders anon-safe content instead of leaking. Personalized
  HTML is `private, no-store` (`middleware.ts`). ✔
- **Role checks:** capability = Directus role/policy, not client flags. ✔
- **User-generated content:** the only UGC today is progress ticks (ids validated
  against the guide's real item ids in the API route). Future Contributor markdown
  enters the pipeline that allows raw HTML (`rehype-raw`) — **flag:** before the first
  non-trusted Contributor, either sanitize post HTML (rehype-sanitize on a schema
  allowing the block classes) or accept that contributors are vetted authors. Today
  all authors are trusted admins, so this is a pre-condition, not a current hole.
- **Dev routes:** two ungated in prod (Issue 4). ⚠

## 10. Recommended Improvement Roadmap

### Priority 1 — Must fix (before the next account/content feature)
1. **Gate `/dev/styleguide` + `/dev/styleguide-prose` in prod** (Issue 4) — benefit:
   closes public exposure; effort: Small; risk: Low; order: first (3 lines).
2. **Byline links for non-team authors** (Issue 3) — benefit: unblocks safely using
   the Contributor role; effort: Small–Medium; risk: Low; order: before approving any
   contributor.
3. **Env hardening window** (Issue 10) — secret length, cookie Secure flag, secret
   rotation; effort: Small (ops); risk: Low (planned sign-out); order: next deploy
   window.
4. **Sanitize or gate contributor-authored HTML** (Security §UGC) — decide policy
   before the first external contributor; effort: Small (decision) / Medium
   (rehype-sanitize integration); risk: Medium (block classes must be allow-listed).

### Priority 2 — Should fix
5. **Replace bodyHtml sniff with a pipeline flag** (Issue 1) — Small, Low risk.
6. **Wire or delete `cachedPerRequest`; memoize `countsByAuthorId`** (Issue 2) —
   Small, Low risk.
7. **DB-level published-only rules for guide content** (Issue 5) — Small script
   change + full smoke; Medium risk; do with the env window.
8. **Move applied schema scripts to `scripts/migrations/`** per README convention —
   Small, zero risk.

### Priority 3 — Nice to improve
9. Shared `SdkFields` type + shared `PUBLISHED` filter const (Issue 7) — Small.
10. Smaller image width for grid thumbnails (`images.ts`) — Small.
11. Robots.txt: add `/dev`, drop stale `/student` etc. (bundled with #1) — Small.
12. Opportunistic splitting of `dream-team/index.astro` / `HeroSignalField.astro`
    only when next touched (Issue 9) — Medium, do lazily.
13. OAuth session refresh (Issue 6) — Medium; wait for user demand.
14. `guide_progress` DB unique constraint (user+guide) — Small.

## 11. Suggested Refactor Plan (for a follow-up agent)

Incremental, behavior-preserving; run `npx vitest run && npm run check && npm run build`
after **every** stage; deploy stages independently.

- **Stage 1 (guards + robots).** Add the PROD rewrite to the two dev pages; update
  robots.txt. Checkpoint: curl prod `/dev/*` → 404; dev server still renders them.
- **Stage 2 (byline flag).** Add `dream_team` to author-ref selections and
  `AuthorRef`; conditional link in the 4 byline components + SeoHead author URL.
  Checkpoint: SeoHead snapshots updated intentionally; live bylines unchanged (all
  current authors are team members).
- **Stage 3 (pipeline flag).** `RenderedMarkdown.hasImageGrid` → `Post` → page;
  delete the sniff. Checkpoint: grid post opens lightbox; non-grid post has no dialog.
- **Stage 4 (request cache).** Memoize `countsByAuthorId` via `cachedPerRequest`.
  Checkpoint: spy test asserts one aggregate per render; dream-team pages identical.
- **Stage 5 (ops window, coordinated with owner).** Env hardening + guide-content
  row rules (script) + secret rotation. Checkpoint: `v4-guides-smoke.mjs` full pass,
  Google + email login, logout.
- **Stage 6 (tidy).** Shared `SdkFields`, move applied scripts to `migrations/`,
  thumbnail width. Checkpoint: suite green; no rendered-HTML diffs except image URLs.

Explicitly out of scope: markdown engine, auth bridge, repository layer shape,
`authors` collection split, component framework changes, any UI redesign.

## 12. Final Recommendation

**Yes — keep building on this codebase.** The architecture is sound, layered, and
tested; the account model landed correctly; security posture is deliberate with a
short, known punch list rather than unknown holes.

**Before adding more user/account features:** Priority 1 items — gate the dev pages,
fix byline links, run the env-hardening window, and decide the contributor-HTML
sanitization policy. All are small.

**Can wait:** per-request caching, pipeline flag, guide row rules, type tidies,
session refresh — schedule as Priority 2/3.

**Do not touch:** the repository/mappers layering, the two-token auth bridge and
avatar proxy, the markdown pipeline architecture and its golden tests, the `authors`
dual-purpose design, `prose.css`'s dual-scope selector contract, and the edge-caching
middleware defaults. These are the load-bearing walls, and they're good ones.

---

## Status update — 2026-07-06 (fix pass executed)

Completed (branch `fix/codebase-review-p1`): P1 #1 dev pages gated + robots (also added
`/account`, dropped stale entries) · P1 #2 byline `dreamTeam` flag (JSON-LD, GuideHero,
projects) · P1 #4 content-trust policy documented in 16-ACCOUNT-MODEL.md · P2 #5
`hasImageGrid` pipeline flag replaces the HTML sniff · P2 #6 `cachedPerRequest` wired
into `countsByAuthorId` (+ spy test) · P2 #7 Guide Server published-only row rules
applied to prod and verified (service check green, drafts hidden) · P3 #9 shared
`SdkFields` · P3 #10 640px grid thumbnails · P3 #11 robots cleanup.

Remaining (unchanged recommendations): env-hardening window (owner: DIRECTUS_SECRET,
SESSION_COOKIE_SECURE, secret rotation) · P2 #8 move applied scripts to migrations/
(deferred: docs still reference rerunning them) · P3 #12 lazy page splitting · P3 #13
OAuth refresh · P3 #14 guide_progress unique constraint (needs raw SQL).
