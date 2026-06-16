# 13 — Task List (agent work packets)

55 tasks. Sequencing/parallelism: `12-IMPLEMENTATION-ROADMAP.md`. Status tracking
lives HERE (edit the Status column) + narrative in `15-HANDOFF.md`.

## Universal task contract (applies to every task; not repeated below)

- **Definition of done**: scope implemented; `npx astro check` clean; `npm test` green;
  `npm run build` succeeds; diff reviewed by the agent; relevant workspace docs
  updated if behavior diverged (with a "Deviation" note); `15-HANDOFF.md` entry
  written; status updated in the table below. **Stop after the assigned task.**
- **Out of scope for ALL tasks**: refactoring neighboring systems, dependency adds
  not listed in 09 §1, visual redesign of components owned by other tasks, touching
  `main`/`staging` branches.
- **Accessibility/responsive**: blueprint (05) + system docs (11) requirements are
  binding parts of every UI task's acceptance criteria.
- **Validation commands**: `cd frontend && npx astro check && npm test && npm run build`.

## Status board

| ID | Title | Phase | Depends on | Status |
|---|---|---|---|---|
| V4-FND-001 | Tooling & CI baseline | A | — | done |
| V4-FND-002 | Temporary OG image set | A | — | done |
| V4-FND-003 | Staging deploy resource | A | FND-001 | done |
| V4-DS-001 | Design tokens + base styles | A | FND-001 | done |
| V4-DS-002 | UI primitives batch | A | DS-001 | done |
| V4-DS-003 | Prose stylesheet | A | DS-001 | done |
| V4-DS-004 | Logo system & favicons | A | DS-001 | done |
| V4-CMS-001 | Directus: authors/specialties/topics | A | — | done |
| V4-CMS-002 | Directus: posts→authors relation | A | CMS-001 | done |
| V4-CMS-003 | Directus: topics backfill | A | CMS-002 | done |
| V4-ARC-001 | Repository layer + types | A | CMS-002, FND-001 | done |
| V4-ARC-002 | Markdown pipeline v4 + goldens | A | FND-001 | done |
| V4-SHELL-001 | BaseLayout, SeoHead, middleware, 404/500 | B | DS-001, ARC-001 | done |
| V4-SHELL-002 | Nav, mobile menu, theme, footer | B | SHELL-001, DS-002, DS-004 | done |
| V4-HOME-001 | Hero "Signal Field" | B | SHELL-002 | done |
| V4-HOME-002 | Home sections | B | HOME-001, DS-002 | done |
| V4-BLOG-001 | Blog landing + topics + redirects | B | SHELL-002, ARC-001 | done |
| V4-BLOG-002 | Article page + callouts | B | BLOG-001, ARC-002, DS-003 | done |
| V4-BLOG-003 | RSS feed | B | BLOG-002 | done |
| V4-PAGE-001 | About page | B | SHELL-002 | done |
| V4-PAGE-002 | Connect page | B | SHELL-002 | done |
| V4-PAGE-003 | Privacy page | B | SHELL-002 | done |
| V4-CMS-005 | Projects → content collection | B | SHELL-002 | done |
| V4-PROJ-001 | Project index | B | CMS-005 | done |
| V4-PROJ-002 | Case study page | B | PROJ-001, ARC-002 | done |
| V4-DT-001 | Graph layout module + tests | B | ARC-001 | done |
| V4-DT-002 | Dream Team page | B | DT-001, SHELL-002 | done |
| V4-DT-003 | Author pages | B | DT-002 | done |
| V4-SEO-001 | JSON-LD + meta wiring | B | SHELL-001, all page tasks | done |
| V4-SEO-002 | Sitemap, robots, canonicals | B | SEO-001 | done |
| V4-DOC-002 | Authoring guide v4 rewrite | B | BLOG-002 | done |
| V4-CLEAN-001 | v3 deletion sweep | B | all B pages | done |
| V4-QA-001 | Responsive matrix pass | D | Phase B | done |
| V4-QA-002 | SEO/OG validation pass | D | Phase B | done |
| V4-QA-003 | Screen-reader pass | D | Phase B | done |
| V4-PERF-001 | Budgets & Lighthouse audit | D | Phase B | done |
| V4-PERF-002 | Font loading tuning | D | PERF-001 | done |
| V4-PERF-003 | CSP rollout | D | PERF-001 | done |
| V4-REL-001 | v4.0 production release | E | Phase D | todo |
| V4-CMS-006 | Drop retired fields/collections | E | REL-001 soak | todo |
| V4-DOC-001 | README/SETUP refresh | E | REL-001 | todo |
| V4-GUIDE-001 | Field Guides schema + public preview policies + seed | C | REL-001 | todo |
| V4-AUTH-001 | Directus reader auth + progress policy baseline | C | GUIDE-001 | todo |
| V4-GUIDE-002 | Repository + view-models + mappers (guides) | C | AUTH-001 | todo |
| V4-AUTH-002 | Login/signup/session/account UI | C | AUTH-001 | todo |
| V4-GUIDE-003 | Server progress API + deriveProgress | C | GUIDE-002, AUTH-002 | todo |
| V4-GUIDE-004 | Catalogue page `/guides` + GuideCard | C | GUIDE-002, AUTH-002 | todo |
| V4-GUIDE-005 | Guide preview + gated reader `/guides/[slug]` | C | GUIDE-002, GUIDE-003, AUTH-002 | todo |
| V4-GUIDE-006 | Nav/home integration + flag flip | C | GUIDE-004, GUIDE-005 | todo |
| V4-GUIDE-007 | Authoring/curation guide (Directus workflow) | C | GUIDE-001 | todo |
| V4-QA-004 | Field Guides QA matrix | C | GUIDE-006 | todo |
| V4-REL-002 | v4.1 release | C | QA-004 | todo |

---

## Task specifications

### V4-FND-001 — Tooling & CI baseline
**Objective**: install/configure vitest, zod, fontsource (Fraunces var, Inter var,
JetBrains Mono), lucide-static; add `test` scripts; GitHub Actions workflow
(check+test+build on PR). **Context**: 09 §1, §11. **Scope**: `frontend/package.json`,
`vitest.config.ts`, `.github/workflows/ci.yml`, one smoke test. **Out of scope**: any
src refactors. **Inspect**: `package.json`, `astro.config.mjs`. **Accept**: CI green
on a no-op PR; `npm test` runs locally.

### V4-FND-002 — Temporary OG image set
**Objective**: `scripts/generate-og-temp.mjs` + commit 7 PNGs per 10 §5.2 naming.
**Inspect**: `public/og/*` (v3 files remain until CLEAN-001). **Accept**: files
1200×630 <300KB; script idempotent; inventory checklist in 10 §5.3 updated to
"temporary in place".

### V4-FND-003 — Staging deploy resource
**Objective**: Coolify third resource `staging.data-dreamer.net` tracking
`feature/v4-redesign`; staging env vars; `X-Robots-Tag: noindex` header on staging
(middleware env check). **Accept**: staging serves the branch; production untouched;
documented in handoff (URLs, env diffs).

### V4-DS-001 — Design tokens + base styles
**Objective**: `styles/tokens.css` (full 04 token set, both themes, reduced-motion
zeroing) + `styles/base.css` (reset, element defaults, focus ring, `.kicker`,
`.rule`, container classes, `[data-reveal]` CSS) + `/dev/styleguide` page rendering
all tokens/type scale/buttons-to-be. **Context**: 04 all. **Out of scope**: touching
v3 `global.css` (pages still use it until SHELL-001). **Accept**: contrast table
(every text token × both themes) in PR description; styleguide page renders.

### V4-DS-002 — UI primitives batch
**Objective**: build `ui/` components: Button, Card, Chip, Kicker, SectionHeader,
Avatar, Icon, EmptyState, ErrorState, Breadcrumbs per 06 §3 contracts + 04 §10/§11
states. **Accept**: each demoed on styleguide page in all variants/states incl.
focus-visible; zero raw hex/px-off-grid (review grep per 04 §3).

### V4-DS-003 — Prose stylesheet
**Objective**: `styles/prose.css` — article body styles for pipeline output: headings
with anchors, lists, tables (scroll wrappers), code blocks (dual Shiki themes, label,
copy button styles), figures/captions, callout spec 05 §3a (8 variants), details,
pull-quote, imagegrid grid + lightbox skin, print styles. **Context**: 05 §3/3a,
04 §4.3. **Depends**: ARC-002 emits the markup this styles (coordinate class names via
05 §3a — markup contract is the blueprint, not the other task's code). **Accept**:
styleguide prose fixture (golden test input rendered) reviewed at SM/TP/DT, both
themes, print preview.

### V4-DS-004 — Logo system & favicons (preserve existing mark — NOT a redesign)
**Objective**: productionize the **existing** DataDreamer mark per 04 §9: extract the
path data from `frontend/src/components/Logo.astro` into `src/assets/brand/`
(`logo-mark.svg`, `logo-lockup.svg`, `logo-mono.svg`), svgo cleanup with zero visible
geometry change, `--logo-ink`/`currentColor` ink, dot fixed `#FD2E00`; build the
lockup with the **"DATA DREAMER" stacked pixel wordmark converted to SVG outlines**
(no webfont or live `<text>`); regenerate `favicon.svg` + 32px `.ico` from the mark. **Inspect**:
`Logo.astro`, `public/logo.svg`, `public/favicon.svg`. **Out of scope**: redesigning
the mark, loading a brand wordmark font, swapping usage sites (SHELL-002). **Accept**:
1024px overlay diff old-vs-new mark shows no deviation (screenshot in PR); lockup
optical review at 24/32/64px on dark+light; favicon legible at 16px (dot-enlargement
deviation allowed per 04 §9.3, favicon only); aria patterns per 04 §9.3 noted for
SHELL-002; old `public/logo.svg` untouched (CLEAN-001 removes).

### V4-CMS-001 — Directus: authors/specialties/topics
**Objective**: per 08 §3.2–3.5 + seeds + public-role read grants; pg_dump + schema
snapshot before/after; commit `backend/snapshot.yaml`. Remove `DIRECTUS_EMAIL/PASSWORD`
from `.env.example` + SETUP note (code removal happens in ARC-001). **Accept**:
collections queryable anonymously (published filter); inverse-op notes in handoff.

### V4-CMS-002 — Directus: posts→authors relation
**Objective**: per 08 §3.1 — add `posts.author` (M2O → authors), `cover_image`, and
`featured`. Greenfield staging has no imported posts yet, so the mapping script may
record a documented no-op; if posts exist, every published post must receive an
author. **Inspect**: live data via the Directus app. **Accept**: every published post
has `author`; mapping/no-op documented in handoff with inverse op.

### V4-CMS-003 — Directus: topics backfill
**Objective**: assign topics to seeded/imported posts and create `posts_topics` rows.
There are no v4 `tag`/`category` compatibility fields. **Accept**: every published
post ≥1 topic; mapping documented in handoff.

### V4-ARC-001 — Repository layer + types
**Objective**: `lib/directus/client.ts` (no auth login path), `types/content.ts`,
`repositories/{posts,authors,topics}.ts` + `_mappers.ts` + `cachedPerRequest`,
zod schemas for json fields, `RepositoryError`; unit tests w/ mocked SDK. Queries per
08 §8. v3 `lib/directus.ts` stays until pages migrate (B phase) — new code is additive.
**Accept**: tests cover happy/empty/error per function; no `content` field in list
queries; grep gate 09 §4.1 passes for new pages.

### V4-ARC-002 — Markdown pipeline v4 + goldens
**Objective**: `lib/markdown/` per 09 §6 (8 stages), emitting markup per 05 §3a;
golden fixtures: every AGENT_BLOG_GUIDE syntax + 3 real post snapshots (copy source
from Directus into `lib/markdown/__fixtures__/`); reading time; headings extraction.
**Out of scope**: page wiring, prose.css. **Accept**: goldens committed + green;
markdown-inside-callouts fixture proves bold/links/code render; v3 `renderMarkdown.ts`
untouched (deleted in BLOG-002).

### V4-SHELL-001 — BaseLayout, SeoHead, middleware, 404/500
**Objective**: BaseLayout (06 §5), SeoHead (10 §2 contract), SkipLink, middleware
(09 §8 headers, §9 error envelope, staging noindex), 404 + 500 pages (05 §12–13),
`SITE_URL` env. Pages not yet migrated keep MainLayout — BaseLayout is additive.
**Pseudocode**: 09 §9. **Accept**: curl shows security headers; bad URL → styled 404
w/ 404 status; thrown error → 500 page; SeoHead snapshot test.

### V4-SHELL-002 — Nav, mobile menu, theme, footer
**Objective**: SiteNav, MobileMenu, ThemeToggle, SiteFooter, `content/site.ts`
(nav/footer/social/flags), wire into BaseLayout. **Spec**: 03 §2, 07 §3–4.
**Pseudocode**: 07 §3.3 (canonical). **Accept**: focus trap verified by keyboard
script in PR notes; `aria-expanded` correct; scroll lock incl. iOS; nav glass states
on home vs others; footer topics from repo cached call; reduced-motion path.

### V4-HOME-001 — Hero "Signal Field"
**Objective**: `home/HeroSignalField.astro` per 07 §2 (canvas system, static SVG
variant, pre-paint motion gate, perf guards) + home page route migrated to BaseLayout
with hero only. **Pseudocode**: 07 §2.3–2.4. **Accept**: 07 §2.9 acceptance list
verbatim; JS ≤8KB gz (report size in PR); off-screen CPU check evidence.

### V4-HOME-002 — Home sections
**Objective**: latest writing, selected work, team strip (+ guides teaser behind
flag) per 05 §1; PostCard variants needed here (`featured`,`compact`) land in
`blog/PostCard.astro`. **Accept**: blueprint §1 acceptance; empty-state behaviors;
reveal staggers.

### V4-BLOG-001 — Blog landing + topics + redirects
**Objective**: `/blog`, `/blog/topic/[slug]`, pagination, SSR filters, PostCard `row`
+ `hero` variants, `/logs` 301 shims (config + catch-all). **Spec**: 05 §2/§4.
**Accept**: blueprint acceptance incl. no-JS filtering; redirect curl tests
(`/logs`, `/logs/some-slug`) return 301 to `/blog…`.

### V4-BLOG-002 — Article page + callouts
**Objective**: `/blog/[slug]` per 05 §3 + 3a: ArticleHeader, TOC (07 §6), reading
progress (07 §10), prose render via ARC-002 pipeline, copy buttons (07 §9), lightbox
(07 §7), author block, related, prev/next; print stylesheet; delete v3
`renderMarkdown.ts` + legacy route pages + blog/ dead components after parity check.
**Accept**: 05 §3 acceptance list; 5 real posts verified on staging both themes;
404 (not redirect) for bad slug.

### V4-BLOG-003 — RSS
**Objective**: `rss.xml.ts` per 10 §4; head link. **Accept**: validates
(w3c feed validator); 20 items; excerpt-only.

### V4-PAGE-001 — About
**Objective**: 05 §9; `content/about.ts` authored from current Directus `about`
singleton data (copy values manually into the PR); portrait asset to
`src/assets/about/`; resume PDF to `public/`. **Accept**: zero Directus calls;
no canvas; blueprint criteria.

### V4-PAGE-002 — Connect
**Objective**: 05 §10 incl. copy-email live region. **Accept**: blueprint criteria;
keyboard + SR announcement verified.

### V4-PAGE-003 — Privacy
**Objective**: 05 §11 content + page. **Accept**: prose layout; linked from footer.

### V4-CMS-005 — Projects → content collection
**Objective**: 08 §10.4 migration script + `content/config.ts` schema (09 §5) +
markdown files + images in `src/assets/projects/`; Directus `projects` set to
archived statuses (not dropped). **Accept**: parity check table (old URL → new file)
in handoff; images load via Astro Image.

### V4-PROJ-001 — Project index
**Objective**: 05 §5. **Accept**: blueprint criteria; SSR tag filter; zero Directus.

### V4-PROJ-002 — Case study page
**Objective**: 05 §6 incl. shared pipeline plugins for content collection rendering
(09 §5), fact rail, per-slug OG build step. **Accept**: blueprint criteria; `:::tip`
in a case study renders identically to blog.

### V4-DT-001 — Graph layout module + tests
**Objective**: `lib/graph/layout.ts` pure function per 07 §5.2 + snapshot/property
tests (determinism, no out-of-bounds, collision floor). **Out of scope**: any UI.
**Accept**: fixtures with 3/8/25 authors pass; documented input/output types.

### V4-DT-002 — Dream Team page
**Objective**: 05 §7 + 07 §5.3–5.5: SSR SVG graph (TL+ only), enhancer script,
legend filters, AuthorCard list (all breakpoints). **Accept**: blueprint acceptance;
no-JS staging check (links work); keyboard walkthrough notes in PR.

### V4-DT-003 — Author pages
**Objective**: 05 §8 incl. ProfileHeader, posts list reuse, related authors;
breadcrumbs. **Accept**: blueprint criteria; zero-posts author renders.

### V4-SEO-001 — JSON-LD + meta wiring
**Objective**: `lib/seo/{meta,jsonld,og}.ts`; wire every page to the 10 §3 matrix.
**Accept**: head snapshot tests per page type; Rich Results spot-check evidence for
article + person.

### V4-SEO-002 — Sitemap, robots, canonicals
**Objective**: 10 §4 (robots.txt, sitemap incl. SSR posts endpoint, canonical/prev/
next on pagination). **Accept**: sitemap fetch lists posts w/ lastmod; robots
disallow set matches matrix.

### V4-DOC-002 — Authoring guide v4 rewrite
**Objective**: rewrite `docs/AGENT_BLOG_GUIDE.md`: same workflow, new callout set
(8 types + titles syntax), topics M2M, author selection, cover image, alt-text
requirement, removed ALL-CAPS guidance. **Accept**: every documented syntax has a
golden fixture in ARC-002 (add any missing).

### V4-CLEAN-001 — v3 deletion sweep
**Objective**: delete 06 §8 "delete" column files + v3 `global.css`, MainLayout,
old components; remove fonts CDN; verify no imports remain (`grep`). **Accept**:
build green; bundle report in PR; site visually unchanged on staging.

### V4-QA-001 / 002 / 003 — Hardening passes
Per 11 §A3 matrix / 10 §7 checks / 11 §B6 script respectively. **Output**: findings
fixed inline if ≤30min each, else filed as new tasks in this file + handoff.
**Accept**: completed checklist committed under `docs/agent-workspace/qa/` (create
dir; one md per pass with evidence).

### V4-PERF-001 — Budgets & Lighthouse audit
**Objective**: measure 12 budget table on staging (mobile throttled, real device if
available); fix overruns within scope (image sizes, preloads, script splitting).
**Accept**: budget table filled with measured numbers in `qa/perf.md`; all green or
deviations accepted in handoff.

### V4-PERF-002 — Font loading tuning
**Objective**: subset check, preloads, `size-adjust` fallback metrics (04 §4.1),
verify CLS ≈0 on slow 3G. **Accept**: WebPageTest/DevTools evidence in qa/perf.md.

### V4-PERF-003 — CSP rollout
**Objective**: 09 §8 CSP report-only → review console/staging week → enforce.
**Accept**: enforcing header live on staging w/ zero violations during soak.

### V4-REL-001 — v4.0 release
**Objective**: 12 Phase E protocol (freeze, soak, merge to main, smoke script,
purge). **Accept**: smoke checklist committed `qa/release-4.0.md`; production
Lighthouse spot check; rollback rehearsal noted.

### V4-CMS-006 — Drop retired collections
**Objective**: after 1-week soak: drop `site_settings/home_settings/about/projects`
collections; backups first; snapshot committed. **Accept**: site unaffected (staging
tested with drops first); inverse ops documented.

### V4-DOC-001 — README/SETUP refresh
**Objective**: rewrite README/SETUP for v4 reality (routes, env vars, content
collections, repositories, staging). **Accept**: a fresh-clone walkthrough following
SETUP works (agent performs it).

> **v4.1 = Field Guides (curation model).** The old LMS task set (courses schema with
> lessons, enrollments, votes, badges, certificates, and a student dashboard) is
> **retired** — see `01` §1a for the product rationale and `08` §9 for the schema
> decisions. The tasks below build public guide previews plus a login-gated guide
> reader with one Directus progress record per user+guide.

### V4-GUIDE-001 — Field Guides schema + public preview policies + seed
**Objective**: create the `08` §4 collections — `guides`, `guide_sections`,
`guide_items` + junctions `guides_topics`, `guides_specialties`, `guides_authors` —
with fields, enums, per-type validation conditions, and `(parent, sort)` ordering.
Add **Public preview permissions** filtered to published guides: cards, landing-page
fields, topics/authors/specialties, section titles/descriptions, and item titles/types
only. Public must not read item bodies, notes, URLs, assets, or progress. Seed one
realistic guide (2–3 sections, ~8 mixed-type items incl. youtube/github_repo/pdf/
personal_note) for dev + QA. Deliver as a `scripts/v4-guides-schema.mjs` admin script;
commit a fresh `snapshot.yaml`. **No service token, no Directus Flows.** **Accept**:
anonymous read of the published seed preview works; anonymous item-body read is denied;
draft guide is not publicly readable; snapshot committed.

### V4-AUTH-001 — Directus reader auth + progress policy baseline
**Objective**: create Directus `guide_reader` role, `guide_progress` collection
(`08` §4.5), user-owned policies, registration default-role setup notes, email/reset
setup notes, Google OpenID env checklist, CORS/cookie checklist, and permission
snapshot. **Scope**: Directus schema/policy script + docs only; no frontend UI.
**Accept**: `guide_reader` can read published guide item content and only their own
progress; Public cannot read gated fields or write progress; Google/email setup steps
are documented for staging and production.

### V4-GUIDE-002 — Repository + view-models + mappers (guides)
**Objective**: `lib/repositories/guidesRepo.ts` (+ `_mappers.ts` additions, raw row
types in `lib/directus/schema.ts`, view-models in `types/content.ts`) implementing the
`08` §8.5–§8.8 query contracts: `list({topic?, level?, page})`, `latest(n)`,
`previewBySlug(slug)`, `readerBySlug(slug, session)`, progress read helpers, and a
catalogue item-count aggregate. Pages never import the SDK (`01` §5.6).
**Tests**: mapper unit tests (per-type item shaping, ordering, markdown invocation).
**Accept**: typed view-models returned; ordering correct; `RepositoryError` on failure
(08 error policy); no SDK import outside `lib/`.

### V4-AUTH-002 — Login/signup/session/account UI
**Objective**: Astro auth bridge for Directus: `/login`, `/signup`, `/account`,
logout, session refresh, `Astro.locals.user`, protected-route middleware, safe internal
`next` redirects, Google primary CTA, email/password fallback, and premium Observatory
UI. **Accept**: anonymous Start CTA redirects to `/login?next=/guides/[slug]`; successful
email or Google login returns to `next`; `/account` requires login and shows an empty
My Guides state; logout clears session; no secrets leak to client code.

### V4-GUIDE-003 — Server progress API + deriveProgress
**Objective**: `lib/guides/progress.ts` pure derive helpers plus protected
`/api/guides/progress` endpoints backed by `guide_progress` (`09` §10). API derives
status, percent, completed/remaining counts, estimated time remaining, and resume item.
Writes validate session, guide, and item ids; completed ids are pruned against current
published items; upsert is scoped to the current user. **Tests**: empty/partial/full/
unknown-item pruning, unauthorized 401, cross-user denial, upsert/update math.
**Accept**: progress survives reload and is unavailable to anonymous users.

### V4-GUIDE-004 — Catalogue page `/guides` + GuideCard
**Objective**: `05` §14 — page header, featured guide, SSR topic+difficulty filters,
`GuideCard` / `GuideCardFeatured`, empty state, `ItemList` JSON-LD, `og-guides.png`.
Anonymous cards show "Sign in to start"; logged-in cards can show progress/resume from
`guide_progress`. **Accept**: blueprint criteria; fully usable with JS disabled; SSR
filters; cards equal height; no item-body data appears in page source for anonymous
visitors.

### V4-GUIDE-005 — Guide preview + gated reader `/guides/[slug]`
**Objective**: `05` §15 — public preview hero, why/outcome prose, syllabus preview,
sign-in CTA; logged-in reader with access/progress panel, ordered sections, `GuideItem`
cards per type (youtube facade embed, external/repo/docs links, pdf/file, inline
markdown for notes/cheat sheets/code/exercises), curator annotation blocks
(`why_included`/`focus_on`/`notes`), complete toggles, curators block, related guides,
`Article`/`CreativeWork` JSON-LD. 404 on bad/unpublished slug. **Accept**: blueprint
criteria; anonymous source excludes gated item body/notes/URLs/assets; login returns to
guide; progress toggle/percent/resume survives reload; YouTube iframe loads only on
interaction; keyboard path coherent; structured data validates.

### V4-GUIDE-006 — Nav/home integration + flag flip
**Objective**: add `FLAGS.GUIDES_ENABLED` to `src/content/site.ts`; nav item "Guides"
(03 §2), home Field Guides teaser (05 §1.4), footer link, sitemap inclusion (guides are
indexable), and account/sign-in nav state when auth is enabled. **Accept**: teaser
renders 3 guides; nav active-state on `/guides*`; anonymous/reader nav states are
correct; flag-off cleanly hides everything (rollback path).

### V4-GUIDE-007 — Authoring/curation guide (Directus workflow)
**Objective**: write `AGENT_GUIDES_GUIDE.md` (or extend the blog authoring guide): how
a curator builds a Field Guide in Directus — create the guide, add sections, add items
of each type (which field to fill per type), write the `why_included`/`focus_on`/
`notes` annotations, set difficulty + estimated time, attach topics/specialties/
co-curators, and publish (draft→published). **Accept**: a non-author can build a small
guide end-to-end in Directus by following it.

### V4-QA-004 — Field Guides QA matrix
**Objective**: `01` §1a journeys E2E manual matrix × {mobile, desktop} × {dark, light}:
browse → filter → open preview → sign in → start → complete items → reload (progress
persists) → resume from catalogue/account; each item type renders + opens correctly;
anonymous permissions denied for gated item fields/progress writes; a11y (auth forms,
toggles, embeds, links); indexability + JSON-LD; JS-disabled preview. **Accept**:
`qa/guides.md` checklist complete; blockers fixed or filed.

### V4-REL-002 — v4.1 release
**Objective**: release protocol re-run; production smoke on the live seed guide (browse,
preview, Google/email login, start, complete an item, reload, resume). **Accept**:
Directus auth env vars verified in Coolify; smoke passes on production; flag on;
rollback verified by toggling `GUIDES_ENABLED` off; `qa/release-4.1.md` committed.
