# 13 — Task List (agent work packets)

46 tasks. Sequencing/parallelism: `12-IMPLEMENTATION-ROADMAP.md`. Status tracking
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
| V4-FND-003 | Staging deploy resource | A | FND-001 | todo |
| V4-DS-001 | Design tokens + base styles | A | FND-001 | todo |
| V4-DS-002 | UI primitives batch | A | DS-001 | todo |
| V4-DS-003 | Prose stylesheet | A | DS-001 | todo |
| V4-DS-004 | Logo system & favicons | A | DS-001 | todo |
| V4-CMS-001 | Directus: authors/specialties/topics | A | — | todo |
| V4-CMS-002 | Directus: posts→authors relation | A | CMS-001 | todo |
| V4-CMS-003 | Directus: topics backfill | A | CMS-002 | todo |
| V4-ARC-001 | Repository layer + types | A | CMS-002, FND-001 | todo |
| V4-ARC-002 | Markdown pipeline v4 + goldens | A | FND-001 | todo |
| V4-SHELL-001 | BaseLayout, SeoHead, middleware, 404/500 | B | DS-001, ARC-001 | todo |
| V4-SHELL-002 | Nav, mobile menu, theme, footer | B | SHELL-001, DS-002, DS-004 | todo |
| V4-HOME-001 | Hero "Signal Field" | B | SHELL-002 | todo |
| V4-HOME-002 | Home sections | B | HOME-001, DS-002 | todo |
| V4-BLOG-001 | Blog landing + topics + redirects | B | SHELL-002, ARC-001 | todo |
| V4-BLOG-002 | Article page + callouts | B | BLOG-001, ARC-002, DS-003 | todo |
| V4-BLOG-003 | RSS feed | B | BLOG-002 | todo |
| V4-PAGE-001 | About page | B | SHELL-002 | todo |
| V4-PAGE-002 | Connect page | B | SHELL-002 | todo |
| V4-PAGE-003 | Privacy page | B | SHELL-002 | todo |
| V4-CMS-005 | Projects → content collection | B | SHELL-002 | todo |
| V4-PROJ-001 | Project index | B | CMS-005 | todo |
| V4-PROJ-002 | Case study page | B | PROJ-001, ARC-002 | todo |
| V4-DT-001 | Graph layout module + tests | B | ARC-001 | todo |
| V4-DT-002 | Dream Team page | B | DT-001, SHELL-002 | todo |
| V4-DT-003 | Author pages | B | DT-002 | todo |
| V4-SEO-001 | JSON-LD + meta wiring | B | SHELL-001, all page tasks | todo |
| V4-SEO-002 | Sitemap, robots, canonicals | B | SEO-001 | todo |
| V4-DOC-002 | Authoring guide v4 rewrite | B | BLOG-002 | todo |
| V4-CLEAN-001 | v3 deletion sweep | B | all B pages | todo |
| V4-QA-001 | Responsive matrix pass | D | Phase B | todo |
| V4-QA-002 | SEO/OG validation pass | D | Phase B | todo |
| V4-QA-003 | Screen-reader pass | D | Phase B | todo |
| V4-PERF-001 | Budgets & Lighthouse audit | D | Phase B | todo |
| V4-PERF-002 | Font loading tuning | D | PERF-001 | todo |
| V4-PERF-003 | CSP rollout | D | PERF-001 | todo |
| V4-REL-001 | v4.0 production release | E | Phase D | todo |
| V4-CMS-006 | Drop retired fields/collections | E | REL-001 soak | todo |
| V4-DOC-001 | README/SETUP refresh | E | REL-001 | todo |
| V4-CRS-001 | Courses schema + policies + flows | C | REL-001 | todo |
| V4-AUTH-001 | Session middleware + auth lib | C | CRS-001 | todo |
| V4-AUTH-002 | Auth pages + endpoints | C | AUTH-001 | todo |
| V4-CRS-002 | Catalogue page | C | CRS-001 | todo |
| V4-CRS-003 | Course landing | C | CRS-002 | todo |
| V4-CRS-004 | Lesson page | C | CRS-003 | todo |
| V4-CRS-005 | Enroll/complete/progress APIs + UI | C | AUTH-002, CRS-004 | todo |
| V4-CRS-006 | Student dashboard + settings | C | CRS-005 | todo |
| V4-CRS-007 | Badge awarding + display | C | CRS-005 | todo |
| V4-CRS-008 | Courses nav/home integration | C | CRS-002..006 | todo |
| V4-QA-004 | Courses QA matrix | C | CRS-008 | todo |
| V4-REL-002 | v4.1 release | C | QA-004 | todo |
| V4-CMS-099 | (backlog) rename logs→posts collection | — | — | backlog |

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

### V4-DS-004 — Logo system & favicons
**Objective**: build SVGs per 04 §9 (mark, lockup, mono), favicon.svg + .ico,
`src/assets/brand/`; replace usage sites later (SHELL-002). **Accept**: optical
review at 20/28/64px on dark+light; favicon legible at 16px; aria patterns per 04 §9.3
documented in the component-to-come; old `public/logo.svg` untouched (CLEAN-001 removes).

### V4-CMS-001 — Directus: authors/specialties/topics
**Objective**: per 08 §3.2–3.5 + seeds + public-role read grants; pg_dump + schema
snapshot before/after; commit `backend/snapshot.yaml`. Remove `DIRECTUS_EMAIL/PASSWORD`
from `.env.example` + SETUP note (code removal happens in ARC-001). **Accept**:
collections queryable anonymously (published filter); inverse-op notes in handoff.

### V4-CMS-002 — Directus: posts→authors relation
**Objective**: per 08 §3.1 — add `author_profile` (M2O → authors), `cover_image`,
`featured` to `logs`; mapping script copies the existing `author` (directus_users)
relation to the matching `authors` record. The old `author` field is left untouched
so the live v3 frontend keeps rendering until cutover (dropped in V4-CMS-006).
**Inspect**: live data via the Directus app. **Accept**: every published post has an
`author_profile`; production v3 site unaffected (spot-check 3 posts); mapping
documented in handoff with inverse op.

### V4-CMS-003 — Directus: topics backfill
**Objective**: hand-written tag→topic mapping table (in task PR), create topics +
`posts_topics` rows; keep `tag`/`category` untouched. **Accept**: every published
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
**Objective**: latest writing, selected work, team strip (+ courses teaser behind
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
`renderMarkdown.ts` + logs pages + blog/ dead components after parity check.
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
(8 types + titles syntax), topics M2M, author_profile selection, cover image, alt-text
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

### V4-CMS-006 — Drop retired fields/collections
**Objective**: after 1-week soak: drop `logs.tag/category/legacy author` (per
CMS-002 note), drop `site_settings/home_settings/about/projects` collections;
backups first; snapshot committed. **Accept**: site unaffected (staging tested with
drops first); inverse ops documented.

### V4-DOC-001 — README/SETUP refresh
**Objective**: rewrite README/SETUP for v4 reality (routes, env vars, content
collections, repositories, staging). **Accept**: a fresh-clone walkthrough following
SETUP works (agent performs it).

### V4-CRS-001 — Courses schema + policies + flows
**Objective**: 08 §4 collections + indexes + roles (student/service) + token env +
Directus Flows (PRD §16.2–16.3) + one sample course (3 lessons, 2 resources, badge).
**Accept**: anonymous read of published course works; student role row-filters
verified with a test user; snapshot committed.

### V4-AUTH-001 — Session middleware + auth lib
**Objective**: `lib/auth/` (session validate/refresh, guards, rate-limit), middleware
extension per PRD §7.2 + 09 §10. **Tests**: unit (rate limiter, redirect-safety,
cookie flags). **Accept**: `/student` redirects anonymous → `/login?redirect=…`;
locals.user populated when valid.

### V4-AUTH-002 — Auth pages + endpoints
**Objective**: 05 §17 pages + `/api/auth/*` per PRD §7.1/§10/§12.1. **Accept**:
signup→login→logout E2E manual; rate-limit 429 path; no-enumeration forgot-password;
all noindex; a11y form contract (11 §B5).

### V4-CRS-002 — Catalogue
**Objective**: 05 §14 + CourseCard. **Accept**: blueprint criteria; logged-out
parity; SSR filters.

### V4-CRS-003 — Course landing
**Objective**: 05 §15 incl. four-state CTA, lesson list states, study hub gating,
Course JSON-LD. **Accept**: blueprint criteria with each auth state screenshotted.

### V4-CRS-004 — Lesson page
**Objective**: 05 §16: facade embed, notes via pipeline, resources, sidebar/bottom-bar,
video-unavailable fallback, noindex. **Accept**: blueprint criteria; keyboard path;
facade loads iframe only on interaction (network tab evidence).

### V4-CRS-005 — Enroll/complete/progress APIs + UI
**Objective**: PRD §7.7–7.8 + §10 endpoints (service token, session-derived user,
idempotent upserts, progress recalcs) + MarkComplete/Enroll client per 07 §8.
**Tests**: endpoint unit tests (mocked Directus) for auth/idempotency/error mapping.
**Accept**: PRD safeguards demonstrably enforced (test evidence); optimistic UI
reverts on failure.

### V4-CRS-006 — Student dashboard + settings
**Objective**: 05 §18. **Accept**: blueprint criteria; empty states; settings flows
(name, password) against Directus; delete-account = documented manual process v4.1.

### V4-CRS-007 — Badge awarding + display
**Objective**: server-side award on completion (within CRS-005 transaction path),
completion dialog (07 §8), dashboard badge grid. **Accept**: E2E complete-course →
badge appears; duplicate completion safe.

### V4-CRS-008 — Courses nav/home integration
**Objective**: flip `COURSES_ENABLED`; nav item, home teaser (05 §1.4), footer link,
sitemap inclusion. **Accept**: teaser renders 3 courses; flag-off still works
(rollback path).

### V4-QA-004 — Courses QA matrix
**Objective**: PRD §6 journeys E2E manual matrix × {mobile, desktop} × {dark, light};
auth a11y; noindex verification; rate-limit probe. **Accept**: `qa/courses.md`
checklist complete; blockers fixed or filed.

### V4-REL-002 — v4.1 release
**Objective**: release protocol re-run incl. Coolify env (`DIRECTUS_SERVICE_TOKEN`),
production smoke incl. signup/enroll on a test account, then test-account cleanup.
**Accept**: `qa/release-4.1.md` committed.
