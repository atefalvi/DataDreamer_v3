# 15 — Handoff Log

Newest entry first. Every agent appends an entry when finishing, blocking, or making
a decision. Keep entries factual and short; link docs instead of repeating them.

## Entry template

```
## [YYYY-MM-DD] <agent/task id> — <status: done | in progress | blocked | decision>
**Did**: …
**Files**: …
**Decisions / deviations**: … (with doc refs updated)
**Validation**: astro check / tests / build results, evidence links
**Next**: what the next agent should pick up
**Warnings**: …
```

---

## [2026-06-12] V4-ARC-001 — done

**Did**: Built the v4 repository layer + view-models (additive; v3 `lib/directus.ts`
and pages untouched). New modules under `frontend/src/`:
- `lib/directus/schema.ts` (raw row shapes from snapshot.yaml) + `client.ts`
  (REST-only, no login; optional `DIRECTUS_TOKEN` static token via `.with(staticToken)`).
- `types/content.ts` (view-models, 06 §7) — pages consume only these.
- `lib/repositories/{posts,authors,topics}.ts` + `_mappers.ts` + `index.ts`
  (`postsRepo`/`authorsRepo`/`topicsRepo`), `errors.ts` (`RepositoryError` + `guard`),
  `cache.ts` (`cachedPerRequest`).
- `lib/images.ts` (`directusAssetUrl`/`directusSrcset`/`toImageRef`).
- `lib/validation/schemas.ts` (zod for `links`/`tools`/`featured_work`, `.catch([])`).
- Tests: `repositories.test.ts` (13) + `cache.test.ts` (3), mocked SDK; cover
  happy/empty/error per function, field-discipline (no `content` in list fields),
  markdown-in-callout rendering through `bySlug`, and malformed-JSON degradation.
Queries implemented per 08 §8: posts.list (topic/author filter, over-fetch paging),
latest, bySlug, byAuthor, related (+ countsByAuthorId aggregate); authors.allWithCounts,
forTeamStrip, bySlug, related; topics.all, bySlug, withPostCounts, top.

**Files**: `frontend/src/lib/directus/{schema,client}.ts`,
`frontend/src/lib/repositories/{posts,authors,topics,_mappers,errors,cache,index}.ts`,
`frontend/src/lib/repositories/__tests__/{repositories,cache}.test.ts`,
`frontend/src/lib/images.ts`, `frontend/src/lib/validation/schemas.ts`,
`frontend/src/types/content.ts`, `frontend/.env.example`;
docs `06` §7, `09` §3, `13` (status), `15`.

**Decisions / deviations**:
1. **`DIRECTUS_TOKEN`** (optional, server-only read token) added to client + `.env.example`
   + 09 §3, replacing the retired v3 admin login for the v4 path. Use it where the
   Public role isn't open (staging). Distinct from the v4.1 write service token.
2. **`readingMinutes` optional on `PostListItem`, required on `Post`** (06 §7 deviation):
   list queries omit `content`, so cards can't compute read time. Add a cached
   `reading_minutes` column later if cards need it — do not re-add `content` to lists.
3. `postNumber` (schema `post_number`) used throughout, not the placeholder `logNumber`.
4. Single documented `any` is the SDK dotted-field cast at call sites (CODE_REVIEW 2.3).

**Validation**: `npx astro check` → 0 errors/0 warnings/0 hints; `npm test` → 23 passed
(4 files); `npm run build` → success. Grep gate clean: no `@directus/sdk` imports in
`src/pages` or `src/components`.

**Token note (action for owner)**: the provided "Agent Staging" token
(`stagingagent@gmail.com`) returns `INVALID_CREDENTIALS` against
`https://api.data-dreamer.net`, and the staging Directus (`192.168.10.211:8056`) is
LAN-only/unreachable from this environment. So the repository layer was built+tested
against `snapshot.yaml` + mocked SDK (the task's intended method). To wire a live read,
set `DIRECTUS_TOKEN` on the relevant frontend resource (or open the Public role) and
confirm the token's role has read on posts/authors/topics/specialties/junctions/files.

**Next**: Phase B opens. **V4-SHELL-001** (BaseLayout, SeoHead, middleware, 404/500)
is the next critical-path task (deps DS-001 ✓, ARC-001 ✓). V4-CMS-003 (topics backfill)
is independent and ownable in parallel. This branch is `v4/v4-arc-001` off `v4/v4-cms-002`;
merge CMS-002 then ARC-001 into `feature/v4-redesign` in that order.

**Warnings**: Repository functions THROW `RepositoryError` on fetch failure (primary
fetches → 404/500; decorative strips like footer topics should catch). Don't reintroduce
the v3 silent-empty-array pattern for primary fetches. Keep `content` out of list field sets.

## [2026-06-12] V4-CMS-002 — done

**Did**: Added `posts.author`, `posts.cover_image`, and `posts.featured` to staging
Directus with `scripts/v4-cms-002-directus.mjs`; created M2O relations
`posts.author -> authors` and `posts.cover_image -> directus_files`; mapped missing
post authors to seeded `authors.atef-alvi` where needed; regenerated
`backend/snapshot.yaml`. Greenfield staging had 0 posts, so the mapping was a
documented no-op.
**Files**: `scripts/v4-cms-002-directus.mjs`; `backend/snapshot.yaml`;
`frontend/src/lib/directus.ts`; `frontend/src/lib/content.ts`; `SETUP.md`;
`frontend/vitest.config.ts`; `docs/AGENT_BLOG_GUIDE.md`; `docs/agent-workspace/13-TASKS.md`;
`docs/agent-workspace/15-HANDOFF.md`.
**Decisions / deviations**: No sub-agents used. `posts.author` is marked required in
Directus UI but remains nullable at the database level so the migration can be applied
to a non-empty `posts` collection before mapping. Inverse operation, if rollback is
needed before content depends on these fields: delete relations `posts.author` and
`posts.cover_image`, then delete fields `posts.featured`, `posts.cover_image`, and
`posts.author`; restore the prior `backend/snapshot.yaml`.
**Validation**: Migration script ran against `http://192.168.10.211:8056` and exited
`0`; API field read confirmed `author` (`select-dropdown-m2o`, required),
`cover_image` (`file-image`), and `featured` (`boolean`) exist on `posts`; posts query
returned 0 rows, so no published post is missing an author. Frontend validation:
`cd frontend && npx astro check && npm test && npm run build`. GitHub CI initially
hit the existing markdown golden test's 5s default timeout, so `vitest.config.ts`
now sets `testTimeout: 15000`.
**Next**: `V4-CMS-003` — assign topics to seeded/imported posts and create
`posts_topics` rows. If staging still has 0 posts, record the backfill as a no-op and
leave the taxonomy ready for ARC/BLOG work.
**Warnings**: Keep staging/prod Directus tokens separate. The legacy v3 `/logs` pages
still exist until the blog migration tasks, but their Directus helper now reads
`posts`.

## [2026-06-12] V4-CMS-001 — done

**Did**: Completed the staging Directus v4.0 greenfield schema migration with
`scripts/v4-cms-001-directus.mjs`. The script is idempotent and creates clean v4
collections: `posts`, `authors`, `specialties`, `topics`, `authors_specialties`, and
`posts_topics`; scalar `posts` fields use `post_number`;
`posts.topics`; `authors.avatar`; `authors.specialties`; `authors_specialties`
relations; and `posts_topics.posts_id` / `posts_topics.topics_id`. Seeded
`atef-alvi`, 6 specialties, and 6 topics; removed an accidental `agent-staging`
author row from earlier token testing; added Public read permissions; and wrote
`backend/snapshot.yaml`. Removed retired frontend admin credential examples from
`frontend/.env.example` and `SETUP.md`.
**Files**: `scripts/v4-cms-001-directus.mjs`; `backend/snapshot.yaml`;
`frontend/.env.example`; `frontend/src/lib/directus.ts`; `frontend/src/lib/content.ts`;
`frontend/src/pages/index.astro`; `frontend/src/pages/logs/index.astro`; `README.md`;
`SETUP.md`; `docs/AGENT_BLOG_GUIDE.md`; `docs/agent-workspace/01-PRODUCT-VISION.md`;
`docs/agent-workspace/03-INFORMATION-ARCHITECTURE.md`;
`docs/agent-workspace/08-DIRECTUS-CONTENT-MODEL.md`;
`docs/agent-workspace/13-TASKS.md`; `docs/agent-workspace/15-HANDOFF.md`;
`docs/agent-workspace/assets/content-models/example-records.md`;
`docs/agent-workspace/assets/diagrams/directus-erd.md`.
**Decisions / deviations**: No sub-agents used. Owner clarified staging is
greenfield: do not restore v3 production content; create a clean v4 baseline instead.
The physical Directus collection is `posts`; old `/logs/*` remains only as URL
redirect compatibility. There are no v4 migration-compat fields from the previous
model. `pg_dump` was not captured because local
`pg_dump` is unavailable and `192.168.10.211:5432` refused direct connections; schema
snapshot is committed and this greenfield DB has no production content to preserve.
**Validation**: Migration script ran against `http://192.168.10.211:8056` and
exited `0`. Anonymous curl checks: `posts` published query count 0 and includes
`topics.topics_id.slug`; authors count 1; specialties count 6; topics count 6;
`authors_specialties` and `posts_topics` queryable; `/files?limit=1` queryable.
Authenticated schema read lists non-system collections `authors`,
`authors_specialties`, `posts`, `posts_topics`, `specialties`, `topics`; relation
metadata exists for `authors.avatar`, `authors_specialties.authors_id`,
`authors_specialties.specialties_id`, `posts_topics.posts_id`, and
`posts_topics.topics_id`.
**Next**: `V4-CMS-002` is now unblocked: add `author`, `cover_image`, and
`featured` to `posts`. Because staging is greenfield, its mapping step should create a
documented no-op result when there are no published posts yet. Those fields are not
available in Directus until V4-CMS-002 lands.
**Warnings**: Keep production and staging Directus secrets separate. Rotate any
production secrets that were pasted into chat. If this greenfield staging DB is later
replaced by a production restore, rerun `scripts/v4-cms-001-directus.mjs` before
starting CMS-002.

## [2026-06-12] V4-FND-003 — done

**Did**: Completed the Coolify staging resource verification. Staging frontend
serves at `https://staging.data-dreamer.net/` and internal
`http://192.168.10.211:4322/` with `X-Robots-Tag: noindex`. Staging backend
Directus responds at `http://192.168.10.211:8056/` and `/admin`. Updated
`backend/docker-compose.yml` so staging can use a separate host port/uploads path
through env overrides while production defaults remain `8055`, `/mnt/datadreamer/*`,
and local dev CORS defaults.
**Files**: `frontend/src/middleware.ts`; `backend/docker-compose.yml`;
`docs/agent-workspace/13-TASKS.md`; `docs/agent-workspace/15-HANDOFF.md`.
**Decisions / deviations**: Accepted the earlier staging resource setup and owner
NPM/proxy configuration. Rejected the hardcoded backend `8056` compose change as a
merge risk; replaced it with `DIRECTUS_HOST_PORT`,
`DIRECTUS_UPLOADS_PATH`, and `DIRECTUS_EXTENSIONS_PATH` overrides. Production
Coolify resources were not changed.
**Validation**: `curl -sSI http://192.168.10.211:4322/` returned `200 OK` with
`x-robots-tag: noindex`; `curl -sSI https://staging.data-dreamer.net/` returned
`200` with `x-robots-tag: noindex`; `curl -sSI https://data-dreamer.net/` returned
`200` with no `x-robots-tag`; `curl -sSI http://192.168.10.211:8056/` returned
Directus `302 Found` to `./admin`; `curl -sSI http://192.168.10.211:8056/admin`
returned Directus `200 OK`. Previous repo validation on this task: `cd frontend &&
npx astro check`, `npm test`, and `npm run build` all passed.
**Next**: `V4-CMS-001` is the next eligible incomplete Phase A task.
**Warnings**: Keep staging backend env overrides separate from production:
`DIRECTUS_HOST_PORT=8056`, staging database/user/password/secret,
`DIRECTUS_UPLOADS_PATH=/mnt/datadreamer-staging/uploads`,
`DIRECTUS_EXTENSIONS_PATH=/mnt/datadreamer-staging/extensions`,
`DIRECTUS_PUBLIC_URL=https://api-staging.data-dreamer.net`, and CORS limited to
staging frontend origins. Rotate any production secrets that were pasted into chat.

## [2026-06-12] V4-FND-003 — blocked

**Did**: Created the repo-side staging noindex implementation by adding Astro
middleware that sends `X-Robots-Tag: noindex` only when `DEPLOY_ENV=staging`.
Added the non-secret `DEPLOY_ENV` example to the ignored frontend env sample. In
Coolify, verified the cloned staging environment/resource created during this task:
environment `datadreamer-staging`
(`tsks4w4888kkgwwwo0s8oo0w`), frontend
`datadreamer-frontend-staging` (`agsc0gc004s04skwwk40g0og`), backend
`datadreamer-backend-staging` (`d8w488os44sgk4os0w80wk4g`), and frontend domain
`https://staging.data-dreamer.net/`.
**Files**: `frontend/src/middleware.ts`; `frontend/.env.example`;
`docs/agent-workspace/13-TASKS.md`; `docs/agent-workspace/15-HANDOFF.md`.
**Decisions / deviations**: No sub-agents used; scope stayed on FND-003. Production
Coolify resources were not edited. The staging frontend Git Source page initially
showed branch `staging`; it was changed in the form to `feature/v4-redesign` and
saved before Chrome interaction became blocked. The Environment Variables page
showed Directus URL variables but no `DEPLOY_ENV`; adding `DEPLOY_ENV=staging` and
deploying could not be completed because Chrome reported an extension UI blocking
automation.
**Validation**: `cd frontend && npx astro check` clean; `npm test` passed
(7 tests); `npm run build` passed. Local preview with `DEPLOY_ENV=staging` returned
`x-robots-tag: noindex`; local preview without `DEPLOY_ENV=staging` returned no
`x-robots-tag`. Live staging was not deployed/verified.
**Next**: Dismiss the Chrome extension overlay, then resume V4-FND-003. Verify the
staging frontend source branch is still `feature/v4-redesign`, add
`DEPLOY_ENV=staging` to the staging frontend environment variables, deploy the
staging frontend, and verify `curl -sSI https://staging.data-dreamer.net/` includes
`X-Robots-Tag: noindex` while `https://data-dreamer.net/` does not.
**Warnings**: Do not mark V4-FND-003 done until live staging serves the feature
branch and the noindex header is verified. The unrelated `reference/` deletion
remains stashed as `user-reference-folder-deletion-before-v4-cms-001`.

## [2026-06-12] V4-DS-004 — done

**Did**: Productionized the existing DataDreamer mark into standalone brand assets:
`logo-mark.svg`, `logo-lockup.svg`, and `logo-mono.svg` under
`frontend/src/assets/brand/`. Regenerated `frontend/public/favicon.svg` and
`frontend/public/favicon.ico` from the same preserved mark geometry. Left
`frontend/public/logo.svg` untouched for CLEAN-001.
**Files**: `frontend/src/assets/brand/logo-mark.svg`;
`frontend/src/assets/brand/logo-lockup.svg`;
`frontend/src/assets/brand/logo-mono.svg`; `frontend/public/favicon.svg`;
`frontend/public/favicon.ico`; `docs/agent-workspace/04-DESIGN-SYSTEM.md`;
`docs/agent-workspace/13-TASKS.md`; `docs/agent-workspace/15-HANDOFF.md`.
**Decisions / deviations**: Owner direction on 2026-06-12 replaced the earlier Anton
lockup requirement with a vector pixel wordmark for "DATA DREAMER"; 04 §4.1/§9.2 and
13 V4-DS-004 were updated accordingly. After owner visual feedback, the lockup was
refined to a retained mark + fine divider + stacked `DATA` / `DREAMER` composition
instead of a one-line wordmark. The lockup contains path geometry only, no runtime
font and no live `<text>`. The mark paths are copied from
`frontend/src/components/Logo.astro`; ink uses `var(--logo-ink, currentColor)` and
the color logo dot remains exact `#FD2E00`. The mono asset sets all paths to
`currentColor`. Bacon's read-only audit findings were accepted; no sub-agent code was
integrated.
**Validation**: `cd frontend && npx astro check` clean; `npm test` passed
(7 tests); `npm run build` passed. Asset validation: old inline mark vs new
`logo-mark.svg` rendered at 1024px had 0 differing bytes; `logo-lockup.svg` and
favicons contain no `<text>`, `font-family`, or `Anton`; `favicon.ico` header reports
1 icon, 32x32, 32-bit; refined lockup reviewed at 24/32/64/160px on light and dark
backgrounds. Review finding: the stacked lockup is premium at 64px+; below 64px,
use the compact mark instead.
**Next**: `V4-CMS-001` is the next implementable Phase A task. `V4-FND-003` is still
the next listed incomplete task but remains blocked until Coolify/staging access is
available.
**Warnings**: Unrelated working-tree deletions under `reference/` remain unstaged and
untouched. SHELL-002 must later replace usage sites and apply the recorded aria
patterns.

## [2026-06-12] V4-ARC-002 — done

**Did**: Added the additive v4 markdown pipeline under `frontend/src/lib/markdown/`.
The new `renderMarkdown(content)` returns `{ html, headings, readingMinutes }` and
implements the documented stages: WYSIWYG cleanup, GFM parsing, proper `:::` custom
block handling, markdown-inside-blocks, callout/details/quote/imagegrid rendering,
heading slug/autolink collection, dual-theme Shiki output, code block header/copy
markup, table scroll wrappers, standalone image figures/captions, Directus asset URL
transforms, and stringification. Existing v3 `frontend/src/lib/renderMarkdown.ts`
was left untouched.
**Files**: `frontend/src/lib/markdown/**`;
`docs/agent-workspace/13-TASKS.md`; `docs/agent-workspace/15-HANDOFF.md`.
**Decisions / deviations**: No dependency changes. Implemented one nested block level:
details/quote/imagegrid can render inside a parent block; nested callouts intentionally
remain literal, matching 05 §3a's callout-in-callout rule. The three committed
`real-post-*` fixtures are deterministic local source snapshots based on existing
authoring/workspace examples because local Directus was unavailable (`localhost:8055`
refused connection; Docker daemon not running). Replace or supplement them with live
published Directus post bodies when backend access is available.
**Validation**: `cd frontend && npx astro check` clean; `npm test` passed
(7 tests: smoke + markdown goldens); `npm run build` passed. Markdown tests assert
all 8 callout variants, callout semantics, markdown inside callouts, nested details,
unsupported block literal behavior, heading collection with original case, table
scroll wrappers, code copy/label markup, figure captions, Directus image transforms,
WYSIWYG cleanup, and committed HTML snapshots.
**Next**: `V4-CMS-001` remains the next major Phase A prerequisite for repository
work; `V4-DS-004` is also eligible and independent. `V4-ARC-001` still depends on
CMS-002, so do not start it until the CMS author/topic work and post relation tasks
are complete.
**Warnings**: Unrelated working-tree deletions under `reference/` remain unstaged and
untouched.

## [2026-06-12] V4-DS-003 — done

**Did**: Completed the prose stylesheet: `frontend/src/styles/prose.css` covering the
full pipeline markup contract (05 §3a / 09 §6) — headings with appended anchors,
lists, blockquote, hr, inline/block code with `.code-block` header (language label +
copy button), dual-theme Shiki via `--shiki-dark/--shiki-light` vars, `.table-scroll`
tables, figures/captions, all 8 callout variants with icon/title/body structure,
details/expand, pull-quote figure, image-grid (incl. `data-count="1"` natural-size
case and mobile swipe carousel), lightbox skin, and print styles. Every selector is
dual-written for `.prose` (v4) and `.blog-content` + v3 class shapes (`.callout.tip`,
`details.expand-block`, `div.pull-quote`) for the migration compat window. Added
`/dev/styleguide-prose` — a hand-authored fixture matching the markup contract for
review — and linked it from `/dev/styleguide`.
**Files**: `frontend/src/styles/prose.css`;
`frontend/src/pages/dev/styleguide-prose.astro`;
`frontend/src/pages/dev/styleguide.astro` (link);
`frontend/src/components/ui/Icon.astro` (bug fix, see below);
`docs/agent-workspace/13-TASKS.md`; `docs/agent-workspace/15-HANDOFF.md`.
**Decisions / deviations**: One out-of-task fix folded in: `Icon.astro` resolved
lucide-static from `process.cwd()`, which 500s whenever the dev server cwd isn't
`frontend/` (e.g. `astro dev --root frontend` via launch.json). Now resolves through
`createRequire(import.meta.url)`. Copy-button visibility is gated on
`@media (hover: hover)` (not viewport width) so touch devices always see it, per 11 §2.
**Validation**: `npx astro check` clean (0 errors); `npm test` passed; `npm run build`
passed. Browser-verified on the dev server: desktop dark + light themes (hero, lists,
all 8 callouts, code block with language/copy, table, figure, image grids, legacy v3
markup block), mobile 375px (zero horizontal overflow; callout padding 16px, icon
16px, code at `--fs-xs`, copy/summary touch targets ≥44px; image-grid becomes snap
carousel; single image full-width). Console clean.
**Next**: Eligible now: `V4-DS-004` (logo productionization — preserve existing mark
per 04 §9), `V4-CMS-001` (independent Directus schema work, needs the local Directus
backend running), or `V4-ARC-002` (markdown pipeline + goldens; its output must match
the fixture markup in `/dev/styleguide-prose`).
**Warnings**: Print preview was reviewed only via the print stylesheet's logic, not a
physical print test; include it in the V4-QA-001 pass. The pre-existing unstaged
`reference/` deletions remain untouched in the working tree.

## [2026-06-12] V4-DS-002 — done

**Did**: Added the first v4 `ui/` primitive batch: Button, Card, Chip, Kicker,
SectionHeader, Avatar, Icon, EmptyState, ErrorState, and Breadcrumbs. Updated
`/dev/styleguide` to demo the primitives across variants and states, including
loading/disabled buttons, selected chips, cards, icons, avatars, empty/error states,
and breadcrumb structured data.
**Files**: `frontend/src/components/ui/*.astro`;
`frontend/src/pages/dev/styleguide.astro`; `frontend/src/styles/tokens.css`;
`docs/agent-workspace/04-DESIGN-SYSTEM.md`;
`docs/agent-workspace/13-TASKS.md`; `docs/agent-workspace/15-HANDOFF.md`.
**Decisions / deviations**: Added `--text-on-accent` to 04 §3.4 and
`tokens.css` so solid accent controls can satisfy the tokens-only rule while keeping
AA contrast. Accepted the read-only sub-agent audit findings: exact Button variants
and sizes, Kicker as non-heading text, Breadcrumbs `aria-label` + JSON-LD, selected
chip semantics/check icon, decorative vs labeled Icon behavior, and 44px mobile
touch targets. v3 pages and blog callout behavior remain untouched.
**Validation**: `cd frontend && npx astro check` clean; `npm test` passed
(1 smoke test); `npm run build` passed. Browser check on `/dev/styleguide`: desktop
and 390px mobile had no horizontal overflow, no app console errors beyond Vite dev
connection logs, Breadcrumbs JSON-LD present, active breadcrumb exposed, and mobile
interactive targets all ≥44×44. Grep review found no raw hex/off-grid px in new UI
components or styleguide; raw values only appear in the token definition file.
**Next**: `V4-DS-003 — Prose stylesheet` is the next eligible implementation task.
`V4-DS-004` is also unblocked after DS-001 but should remain focused on preserving
the existing logo; `V4-CMS-001` remains independent; `V4-FND-003` still requires
Coolify access.
**Warnings**: Unrelated working-tree deletions under `reference/` were present before
this task and were not staged or modified by this agent.

## [2026-06-12] V4-DS-001 — done

**Did**: Added the additive v4 design foundation: `tokens.css` with Observatory dark
and light theme tokens, `base.css` with reset/base elements/focus ring/container
utilities/`.kicker`/`.rule`/`[data-reveal]`, and standalone `/dev/styleguide` that
renders tokens, type scale, button directions, spacing, grid, and base-state demos
without importing v3 `global.css`.
**Files**: `frontend/src/styles/tokens.css`; `frontend/src/styles/base.css`;
`frontend/src/pages/dev/styleguide.astro`; `docs/agent-workspace/04-DESIGN-SYSTEM.md`;
`docs/agent-workspace/13-TASKS.md`; `docs/agent-workspace/15-HANDOFF.md`.
**Decisions / deviations**: Deviation recorded in 04 §3.4: `--text-3` changed to
`#858E99` (dark) and `#646D77` (light) because the planning values did not meet
AA contrast across the documented surfaces. v4 styles remain additive and are not
imported by `MainLayout` or existing v3 pages. Read-only sub-agent audit accepted:
keep styleguide standalone and avoid v3 class/import collisions.
**Validation**: `cd frontend && npx astro check` clean; `npm test` passed
(1 smoke test); `npm run build` passed. Browser check: `/dev/styleguide` renders at
desktop and 390px mobile with no console errors and no horizontal overflow. Source
grep for new `base.css` + styleguide found no raw hex and no raw px values >4px
outside token definitions. Contrast table (text token × bg token):
dark `text-1` 17.00/16.19/15.03/13.57, `text-2` 9.03/8.60/7.98/7.21,
`text-3` 5.90/5.62/5.21/4.71; light `text-1` 15.88/16.71/14.67/16.71,
`text-2` 7.27/7.65/6.72/7.65, `text-3` 4.99/5.26/4.61/5.26.
**Next**: `V4-DS-002 — UI primitives batch` is now unblocked. `V4-CMS-001` remains
an independent Phase A option; `V4-FND-003` still requires Coolify access.
**Warnings**: Unrelated working-tree deletions under `reference/` were present during
this task and were not staged or modified by this agent.

## [2026-06-12] Owner direction — decision (logo & brand continuity)

**Decision**: The existing DataDreamer logo is **retained, not redesigned**: the bold
geometric black-and-white "D" built from nested squares with the small red circular
dot at the lower-left, plus its Anton uppercase "DATA DREAMER" wordmark. The earlier
"dreaming datum" new-mark concept is withdrawn. Additionally, the mark's three ideas —
**pixel, data, connection** — are now binding site-wide brand motifs.
**Docs updated**: 04 §1.4 (new motif principle), §3.4 (dot stays brand red `#FD2E00`
in the lockup; UI echoes use `--accent`), §4.1 (Anton survives only as vectorized
SVG wordmark — never loaded as a webfont, never used for headings), §9 (full rewrite:
preservation spec, source of truth = `Logo.astro` path data, overlay-diff acceptance);
07 §2.1/2.4/2.8 (hero field: neutral points are square *pixels*, ember nodes are
*circles* echoing the logo dot); 13 V4-DS-004 (rewritten as productionize-existing,
not redesign); 10 §5.2 (OG lockup wording); design-rationale §4.
**Impact on completed tasks**: V4-FND-001 unaffected. V4-FND-002's temporary OG set
predates this entry — acceptable for development; regeneration/final art must use the
retained lockup (noted in 10 §5.2).
**Next**: unchanged — next eligible Phase A tasks are V4-CMS-001 or V4-DS-001;
V4-DS-004 now requires no creative exploration, only asset extraction + wordmark
vectorization.

## [2026-06-12] V4-FND-002 — done

**Did**: Added `scripts/generate-og-temp.mjs`, an idempotent sharp-based generator
for the seven temporary v4 OG fallback PNGs. Generated and committed
`og-default.png`, `og-home.png`, `og-blog.png`, `og-projects.png`, `og-team.png`,
`og-about.png`, and `og-courses.png` in `frontend/public/og/`. Updated 10 §5.3 to
record that the temporary fallback set is in place.
**Files**: `scripts/generate-og-temp.mjs`; `frontend/public/og/og-*.png`;
`docs/agent-workspace/10-SEO-OG-METADATA.md`;
`docs/agent-workspace/13-TASKS.md`; `docs/agent-workspace/15-HANDOFF.md`.
**Decisions / deviations**: No new dependency added; the script resolves `sharp`
from the existing frontend/Astro install as specified in 10 §5.2. Existing v3 OG
JPGs were left untouched for CLEAN-001.
**Validation**: `node scripts/generate-og-temp.mjs` passed and reported every file
as 1200×630, 34–40KB; `cd frontend && npx astro check` clean; `npm test` passed
(1 smoke test); `npm run build` passed. Visual spot-check completed for
`og-home.png`.
**Next**: Pick the next eligible Phase A task from `13-TASKS.md`: either
`V4-CMS-001` (independent Directus schema work) or `V4-DS-001` (now unblocked by
FND-001). `V4-FND-003` is also unblocked but requires Coolify access.
**Warnings**: Final owner-provided OG art is still pending; this task only provides
the temporary fallback set.

## [2026-06-12] V4-FND-001 — done

**Did**: Added the v4 tooling baseline: approved dependencies (`zod`,
`lucide-static`, fontsource packages, `vitest`), frontend `check`/`test` scripts,
Vitest config, one TypeScript smoke test, and PR CI workflow running install, Astro
check, tests, and build. Made two minimal v3 type fixes required for the new
`astro check` gate: narrowed `HeroCanvas` canvas/context references after runtime
guards and allowed `ProjectCard` to receive the nullable image value its callers
already pass.
**Files**: `.github/workflows/ci.yml`; `frontend/package.json`;
`frontend/package-lock.json`; `frontend/vitest.config.ts`;
`frontend/src/lib/__tests__/smoke.test.ts`;
`frontend/src/components/hero/HeroCanvas.astro`;
`frontend/src/components/projects/ProjectCard.astro`;
`docs/agent-workspace/13-TASKS.md`; `docs/agent-workspace/15-HANDOFF.md`.
**Decisions / deviations**: No architecture/dependency deviation; all new deps are
listed in 09 §1. Source edits were limited to type-only fixes because the newly
required CI `astro check` failed on existing v3 code before they were corrected.
`npm install` reported existing audit findings (15 vulnerabilities: 9 moderate,
6 high); not addressed in this task.
**Validation**: `cd frontend && npx astro check` clean; `npm test` passed
(1 smoke test); `npm run build` passed.
**Next**: Pick the next eligible Phase A task from `13-TASKS.md`; `V4-FND-002` and
`V4-CMS-001` are still independent, and tasks depending on FND-001 are now unblocked
after this branch is merged into `feature/v4-redesign`.
**Warnings**: CI is configured for PRs targeting `feature/v4-redesign` and `main`;
staging deployment setup remains V4-FND-003.

## [2026-06-12] Planning session — done (planning only; no implementation)

**Did**: Full repository audit (every source file, docs, schema snapshot, COURSES_PRD,
reference/ design docs) and authored the complete v4 planning workspace:
documents `00`–`15` plus `assets/` (wireframes, ERD, site map, example records,
design rationale). No production code was changed.

**Files**: `docs/agent-workspace/**` (all new). Nothing else touched.

**Key decisions made** (rationale in the docs):
1. Design direction "Observatory" — dark-first editorial-technical system; Fraunces /
   Inter / JetBrains Mono; ember `#FF5C38` accent; radius + hairline borders; brutalist
   system fully retired (04).
2. Two-release plan: v4.0 core redesign, v4.1 courses + auth (01 §7, 12).
3. `/logs` → `/blog` with 301s; physical Directus collection is `posts` (08 §2.1).
4. Directus scope narrowed to editorial/relational/user content; `site_settings`,
   `home_settings`, `about`, `projects` leave Directus (03 §3, 08 §1). Projects become
   an Astro content collection (V4-CMS-005).
5. New `authors` (Dream Team), `specialties`, shared `topics` taxonomy (also replaces
   COURSES_PRD `course_tags`) (08).
6. Callout system preserved + upgraded: same `:::` syntax, proper remark plugin,
   markdown-inside-blocks fixed, 8 variants, aside/role=note semantics, golden-file
   back-compat tests (05 §3a, 09 §6).
7. Hero = "Signal Field" canvas, ≤8KB hand-rolled, static SVG below 768px /
   reduced-motion (07 §2). Dream Team graph = SSR SVG with deterministic layout, list
   fallback on all breakpoints, no graph library (07 §5).
8. No new heavy deps: zod, fontsource, lucide-static, vitest only (09 §1).
9. Frontend admin-credential login to Directus is retired (08 §5).

**Open items needing the owner's input (not blockers for Phase A)**:
- Final homepage H1 copy approval (placeholder locked in 05 §1).
- Final OG artwork (temporary generated set unblocks everything — 10 §5).
- Author headshots ≥512px + bios for every Dream Team member before V4-DT-002 QA.
- Approval of ember accent + Fraunces pairing from the styleguide page (V4-DS-001
  produces the review artifact).
- Coolify access for V4-FND-003 (staging resource).

**Validation**: n/a (documentation only). Workspace cross-references checked for
consistency (routes, task IDs, token names, callout variants, breakpoints).

**Next**: First implementation task is **V4-FND-001 — Tooling & CI baseline**
(13-TASKS.md). Read 14-AGENT-INSTRUCTIONS.md §1 first. V4-FND-002 and V4-CMS-001 are
safe to run in parallel with it (different files/systems).

**Warnings**: Do not begin implementation until the owner has reviewed and approved
this workspace. The working tree contains these docs uncommitted — committing them to
`feature/v4-redesign` should be the first action after approval.
