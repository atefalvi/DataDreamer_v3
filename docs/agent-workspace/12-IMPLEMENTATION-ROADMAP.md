# 12 — Implementation Roadmap

Phases A–F (v4.0 core) then C-series (v4.1 Field Guides). Tasks referenced by ID — full
specs in `13-TASKS.md`. Branching/deploy model: 09 §11.

## Performance budgets (gate for every phase's validation)

| Budget | Target |
|---|---|
| Client JS per public page | ≤ 35KB gzip total (hero page ≤ 45KB) |
| LCP (4G, mid-tier mobile) | < 2.5s; LCP element = text or sized image |
| CLS | < 0.1 (fonts size-adjusted, images dimensioned, no late banners) |
| INP | < 200ms (no long tasks; canvas loops budget-guarded 07 §2.4) |
| Fonts | 3 files, preloaded, swap; total ≤ 220KB |
| Images | always srcset'd; hero/cover `fetchpriority=high`, rest lazy |
| Directus | ≤ 2 queries per page + cached footer topics (09 §4.3); list queries never fetch `content` |
| Edge caching | s-maxage per 09 §8 |

---

## Phase A — Foundations (no visual change shipped)
**Goal**: workspace, tooling, tokens, CI, staging — everything later phases stand on.
**Dependencies**: none. **Parallel**: A1+A2 parallel; A3 after A1.
- A1 V4-FND-001 tooling: vitest, zod, fontsource, lucide-static, scripts, CI workflow.
- A2 V4-FND-002 temp OG generator + committed images (10 §5.2).
- A3 V4-FND-003 staging resource on Coolify tracking `feature/v4-redesign`.
- A4 V4-DS-001 `tokens.css` + `base.css` + contrast table.
- A5 V4-DS-002 ui primitives batch 1 (Button, Card, Chip, Kicker, SectionHeader,
  Avatar, Icon, EmptyState, ErrorState).
- A6 V4-DS-004 logo system assets + favicons.
- A7 V4-CMS-001..003 Directus v4.0 schema (authors/specialties/topics + backfills).
- A8 V4-ARC-001 directus client split + repositories (posts/authors/topics) + types
  + per-request cache. A9 V4-ARC-002 markdown pipeline v4 + golden tests.
- A10 V4-DS-003 prose stylesheet (after DS-001; markup contract from 05 §3a).
**Deliverables**: green CI; staging up; tokens reviewed in a Storybook-less demo page
(`/dev/styleguide` behind `import.meta.env.DEV`).
**Validation**: vitest green; `astro check`; contrast table in PR; pipeline goldens pass.
**Rollback**: schema tasks carry inverse ops + backups (08 §10). **Risk**: pipeline
regressions — goldens are the net.

## Phase B — Shell & core pages (the visible redesign)
**Goal**: every v4.0 route live on staging in the new system.
**Dependencies**: A complete. **Sequence**: B1 → B2 → (B3‖B4‖B5) → B6 → (B7‖B8) → B9.
- B1 V4-SHELL-001 BaseLayout + SeoHead + SkipLink + middleware (headers/errors)
  + 404/500 pages.
- B2 V4-SHELL-002 SiteNav + MobileMenu + ThemeToggle + SiteFooter.
- B3 V4-HOME-001 hero Signal Field; V4-HOME-002 home sections.
- B4 V4-BLOG-001 blog landing + topic pages + redirects; V4-BLOG-002 article page
  (incl. callout spec, TOC, progress, copy, lightbox); V4-BLOG-003 RSS.
- B5 V4-PAGE-001 about (content → about.ts); V4-PAGE-002 connect; V4-PAGE-003 privacy.
- B6 V4-CMS-005 projects → content collection migration; V4-PROJ-001 index,
  V4-PROJ-002 case study.
- B7 V4-DT-001 graph layout lib + tests; V4-DT-002 team page; V4-DT-003 author pages.
- B8 V4-SEO-001 jsonld lib + per-page wiring; V4-SEO-002 sitemap/robots/canonicals.
- B9 V4-CLEAN-001 delete v3 leftovers (06 §8 delete column), update AGENT_BLOG_GUIDE
  (V4-DOC-002). (Directus field/collection drops are V4-CMS-006 — Phase E, post-soak.)
**Validation**: blueprint acceptance criteria per page; budgets above on staging;
existing posts visually verified (sample of 5) on staging.

## Phase D — Hardening (named D to preserve historical phase ordering)
**Goal**: responsive/a11y/perf verification before production cutover.
- D1 V4-QA-001 responsive matrix (11 §A3). D2 V4-QA-002 SEO/OG validation pass.
- D3 V4-QA-003 screen-reader script (11 §B6). D4 V4-PERF-001 Lighthouse/budget audit
  + fixes. D5 V4-PERF-002 font loading tuning. D6 V4-PERF-003 CSP report-only → enforce.
**Exit criteria**: all gates green; findings either fixed or logged as accepted.

## Phase E — v4.0 production release
- E1 V4-REL-001: content freeze note to editors; final staging soak (48h);
  merge `feature/v4-redesign` → `main`; Coolify deploy; smoke script (curl status,
  redirects `/logs/*`, RSS, sitemap, OG fetch as Slackbot UA); Cloudflare purge.
- Rollback: revert merge commit; Directus v4.0 schema is backward-compatible with v3
  frontend EXCEPT dropped fields — therefore V4-CMS-006 (drops) executes **after** E1
  soak, not before. Sequenced in task deps.

## Phase C — Field Guides (v4.1) — after E1
**Goal**: curated learning paths (Learning Path → Sections → Items) in the v4 design
system, with public previews and login-gated guide reading/progress (`01` §1a,
`08` §4). Replaces the retired LMS/courses scope.
**Sequence**: C1 → C2 → C3 → C4 → (C5‖C8) → C6 → C7 → C9.
- C1 V4-GUIDE-001 schema (`guides`/`guide_sections`/`guide_items` + junctions) +
  Public preview policies + seed guide (08 §4).
- C2 V4-AUTH-001 Directus `guide_reader` role, `guide_progress`, registration/email/
  Google SSO setup notes, CORS/cookie policy, and permission snapshot.
- C3 V4-GUIDE-002 repository + view-models + mappers (public preview + authenticated
  reader contracts, 08 §8.5–§8.8).
- C4 V4-AUTH-002 Astro login/signup/logout/session bridge, `/account`, middleware
  locals/guards, and redirect preservation (`next`).
- C5 V4-GUIDE-003 server progress API + pure deriveProgress tests (09 §10).
- C6 V4-GUIDE-004 catalogue `/guides` + GuideCard (05 §14).
- C7 V4-GUIDE-005 public preview + logged-in guide reader page `/guides/[slug]`
  (05 §15). Depends on auth + progress.
- C8 V4-GUIDE-007 curation/authoring guide for Directus. (Parallelizable: docs.)
- C9 V4-GUIDE-006 nav/home integration + flag flip (`GUIDES_ENABLED`).
- C10 V4-QA-004 Field Guides QA: journeys E2E matrix (browse→preview→sign in→start→
  complete→reload→resume), per-type item rendering, a11y, permissions, indexability/
  JSON-LD, JS-disabled preview.
- then V4-REL-002 production release (same protocol as E1; includes auth smoke).
**Dropped entirely** (not backlog): votes, badges/certificates, enrollment, grading,
payments, cohorts — these are non-goals (`01` §6).

## Cross-phase rules
- Each task ends: validation run, docs touched updated, `15-HANDOFF.md` entry.
- Phases don't overlap releases; within a phase, "‖" marks safe parallelism (different
  files/systems). Two agents must not hold the same file; check handoff "in progress".
- Scope changes mid-phase go through a handoff "decision needed" entry, not silent edits.
