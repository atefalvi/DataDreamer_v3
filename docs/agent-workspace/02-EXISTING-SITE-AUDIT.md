# 02 — Existing Site Audit (v3, verified 2026-06-12)

> Every statement in this document was verified against the actual codebase on branch
> `feature/v4-redesign`, not against older docs. Where existing documentation disagrees
> with the code, the code wins and the discrepancy is noted.

---

## 1. Stack summary

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Astro **5.17** SSR (`output: 'server'`, `@astrojs/node` standalone) | No UI framework, no Tailwind — hand-written CSS |
| CMS | Directus (`directus/directus:latest` in Docker Compose) | Postgres (postgis:13) + Redis 6 |
| SDK | `@directus/sdk` 18 | REST + optional email/password auth |
| Markdown | unified: remark-parse, remark-gfm, remark-rehype, rehype-raw, rehype-slug, rehype-autolink-headings, `@shikijs/rehype` (theme `github-dark`), rehype-stringify | Custom `:::` block preprocessor before the pipeline |
| Sitemap | `@astrojs/sitemap` | Configured in `astro.config.mjs`, `site: https://data-dreamer.net` |
| Fonts | Google Fonts CDN: **Anton** + **JetBrains Mono** | Loaded twice: `@import` in `global.css` AND `<link>` in `MainLayout.astro` |
| Deploy | Coolify, two resources (backend compose, frontend app), Cloudflare in front | See `README.md`, `SETUP.md` |
| Tests | **None** | No test runner installed |

## 2. Repository layout (relevant parts)

```
frontend/src/
├── components/
│   ├── Logo.astro                 # inline SVG monogram, --logo-main + #fd2e00 accent
│   ├── Navigation.astro           # fixed dark bar, center pill, hamburger drawer, theme toggle
│   ├── Footer.astro               # red display CTA + contact grid (fetches site_settings)
│   ├── PageHero.astro             # label + giant title header (shared)
│   ├── HeroTagline.astro          # 3-line tagline w/ left bar (hardcoded defaults)
│   ├── hero/HeroCanvas.astro      # 557 lines: 3D node constellation + pixel-text canvas
│   ├── about/ (AboutHero, AboutStats, AboutTimeline, AboutStack)
│   ├── blog/ (Callout, Expandable, PullQuote, AuthorChip, RelatedLogs, TableOfContents)
│   └── projects/ProjectCard.astro
├── layouts/MainLayout.astro       # head/meta/OG, theme-init inline script, grain overlay,
│                                  # cursor-halo canvas, global lightbox + its JS
├── lib/
│   ├── directus.ts                # SDK client, types, all fetchers (362 lines)
│   ├── content.ts                 # formatters + ContentLog/ContentProject view models
│   └── renderMarkdown.ts          # ::: preprocessor + unified pipeline + TOC extraction
├── pages/
│   ├── index.astro                # hero + projects teaser + logs teaser
│   ├── about.astro  connect.astro
│   ├── logs/index.astro  logs/[slug].astro
│   └── projects/index.astro  projects/[slug].astro
└── styles/global.css              # 953 lines: tokens, themes, blog content, callouts, lightbox
frontend/public/
├── og/{default,log,project}.jpg   # static 1200×630 OG images
├── favicon.ico  favicon.svg  logo.svg  robots.txt
└── masks/portrait-dissolve-{light,dark}.svg   # ORPHANED — AboutHero now uses canvas
backend/
├── docker-compose.yml  snapshot.yaml  .env.example
└── uploads/                       # Directus file storage (local volume)
docs/  COURSES_PRD.md  AGENT_BLOG_GUIDE.md  CODE_REVIEW.md
reference/                         # v3 design references (brutalist) — historical only
```

## 3. Current routes (verified against `src/pages/`)

| Route | Renders | Data |
|---|---|---|
| `/` | HeroCanvas + featured projects (3) + recent logs (3) | `fetchFeaturedProjects`, `fetchRecentLogs` |
| `/about` | AboutHero (canvas portrait dissolve), stats, timeline, stack | `about` singleton |
| `/projects` | Filterable card grid (client-side tag filter) | `projects` collection |
| `/projects/[slug]` | Case study: hero, meta grid, featured image, markdown body, sidebar | fetches **all** projects then `.find()` — N+1 style inefficiency |
| `/logs` | Filter bars (tag + author), log list | `logs` collection (fetches full `content` field on list page — wasteful) |
| `/logs/[slug]` | Post hero, meta grid, TOC sidebar, rendered markdown, RelatedLogs | `fetchLog(slug)` + `getLogs()` (full list again, for related) |
| `/connect` | Status block + channel table | `site_settings` singleton |
| 404 | **None** — `logs/[slug]` redirects to `/logs`; `projects/[slug]` redirects to `/404` which does not exist | Gap |

No middleware, no API routes, no auth, no search, no privacy page, no custom 404/500.

## 4. Directus content model (verified against `snapshot.yaml` + `directus.ts`)

Collections that actually exist: `projects`, `logs`, `site_settings` (singleton),
`home_settings` (singleton), `about` (singleton), plus system collections.
**None of the Courses PRD collections exist yet.** No `authors` collection — post/project
authors are M2O to `directus_users`.

Field inventories match `SETUP.md` §Content Model (verified). Notable details:

- `logs`: `title, slug, status(draft/published), published_at, excerpt, content(markdown),
  tag(string), category(string fallback), log_number(int), series_label, author(M2O users)`.
  Single free-text `tag` per post — no M2M topics.
- `projects`: `title, slug, status, published_at, summary, description(markdown),
  cover_image(file), tags(json array), featured(bool), author(M2O users)`.
- `about` singleton holds JSON arrays for stats/experience/skills — structured content
  hidden inside JSON blobs (hard to validate, no Directus relational integrity).
- Public role needs manual read grants (documented in SETUP.md §3).
- Frontend can optionally log in with admin email/password (`ensureAuthenticated()`); in
  production it appears to rely on the Public role.

## 5. Custom blog block system (the part that must survive)

### 5.1 Authoring syntax (verified in `renderMarkdown.ts` + `AGENT_BLOG_GUIDE.md`)

| Syntax | Output HTML | Notes |
|---|---|---|
| `:::tip TITLE` … `:::` | `<div class="callout tip"><div class="callout-label">TITLE</div><p>…</p></div>` | Same for `warning`, `info`, `note`. Label defaults to the type uppercased |
| `:::details SUMMARY` … `:::` | `<details class="expand-block"><summary>…</summary><div class="expand-content">…</div></details>` | Summary text required |
| `:::quote` … `:::` | `<div class="pull-quote">…</div>` | Lines joined with `<br />` |
| `:::imagegrid` + `![alt](src)` lines … `:::` | `<div class="image-grid" data-count="N">` of `<button class="ig-item">` | Lightbox bound globally in `MainLayout.astro` |

### 5.2 How it works (pipeline order matters)

1. `preprocessCustomBlocks()` — a **line-based scanner**, not a remark plugin. First it
   un-wraps WYSIWYG damage: `&nbsp;`, `<br>`, `<p>`-wrapped code fences, `<p>`-wrapped
   table rows, `<p>:::…</p>` markers, then strips remaining `<p>` tags entirely.
2. Open/close `:::` matching builds raw HTML strings pushed into the output line stream.
3. unified pipeline with `allowDangerousHtml` + `rehype-raw` lets that raw HTML through.
4. `extractHeadings()` regex-scans final HTML for `<h2>/<h3>` ids → TOC.

### 5.3 Strengths

- Author-friendly: works typed into Directus WYSIWYG **or** plain markdown field.
- Resilient to WYSIWYG `<p>`-wrapping (the single biggest real-world failure mode —
  see `reference/memory.md`).
- Zero client JS for callouts/details/quote; lightbox JS is global and small.
- `<details>` used natively for expandables (good a11y baseline).

### 5.4 Weaknesses / risks (input to the v4 callout spec)

1. **Markdown inside callouts is not rendered** — callout body becomes
   `<p>${lines.join(' ')}</p>` BEFORE the markdown pass; raw HTML survives via
   rehype-raw, but markdown (`**bold**`, links, lists, code) inside a callout body is
   emitted as raw text inside an HTML block, so remark does not process it reliably.
   v4 must render block content through the full pipeline.
2. Stripping ALL `<p>` tags globally is a sledgehammer; it has worked but is fragile.
3. `:::info{title="X"}` syntax matched but title not extracted (silent label fallback).
4. Callouts are `<div>`s with no ARIA semantics; color is the only type signal besides
   the label text (no icons; fails color-independence at a glance).
5. Hardcoded colors `#00ff87` (tip), `#0088ff` (info) bypass the token system and were
   never contrast-checked on light theme.
6. No nesting support; no `caution/important/example` variants; details block content
   also skips markdown rendering (same issue as #1).
7. `Callout.astro`, `Expandable.astro`, `PullQuote.astro` components exist but are
   **dead code on the blog path** — the preprocessor emits raw HTML; the components are
   only useful if a page hand-places them. Their class names must stay in sync manually.
8. TOC extraction by regex on final HTML works but uppercases text and strips numbering
   with a brittle regex.

### 5.5 Backward-compatibility contract for v4

All published posts use: `:::tip|warning|info|note [TITLE]`, `:::details SUMMARY`,
`:::quote`, `:::imagegrid`, GFM tables, fenced code with language hints, Directus asset
image URLs, one `#` H1 followed by `##`/`###`. **v4 must render all of these without
content edits.** New variants must be additive.

## 6. Design system (v3 — being retired)

- Tokens in `global.css`: dual theme (`data-theme` attr + `prefers-color-scheme`),
  accent `#FF2E00`, Anton display / JetBrains Mono body, 0px border-radius global reset,
  8px spacing unit, 1200px container, `--nav-h: 56px`.
- Signature v3 effects (all retired in v4): grain overlay, canvas cursor halo (global),
  hero pixel-text + 3D wireframe constellation, grayscale-to-color image hover,
  skew-on-hover display text, ALL-CAPS transforms everywhere, `// META_LABEL` prefixes.
- A "legacy map" of old var names (`--color-primary` → `--accent` etc.) is still in use
  by ~half the components — token naming is already in mid-migration.
- Theme toggle in nav writes `localStorage.theme`; inline pre-paint script in head.
- `prefers-reduced-motion` respected by hero canvas + cursor trail (gates the rAF loop)
  but mouse listeners still attach.

## 7. SEO / OG current state

- `MainLayout.astro` emits a complete OG/Twitter set incl. `og:image:secure_url`,
  `article:published_time`, `article:author`, dual `theme-color`. Solid baseline.
- Static OG images: `/og/default.jpg`, `/og/log.jpg`, `/og/project.jpg`.
  Project pages upgrade to the Directus cover image via `toOgImageUrl()`
  (1200×630 transform) with `isPublicHttpsUrl()` guard — pattern worth keeping.
- No JSON-LD anywhere. No RSS. Sitemap auto-generated.
- Titles use `SECTION // DATA DREAMER` pattern (brutalist voice — will change).

## 8. Accessibility current state

Good: skip-free simple structure, `aria-pressed` on filters, `aria-label`s on lightbox,
lightbox sets alt before src, `<details>` for expandables, reduced-motion gates on canvases.
Gaps: hamburger has no `aria-expanded`/focus trap/Escape handling; no skip link; no
focus-visible styling system; heading hierarchy on listing pages jumps (h1 → card h2 ok,
but TOC `aside` lacks a label); callouts have no semantics; theme toggle icon-only with
label "Toggle theme" (ok) but no announced state; `body` text 16px but blog body is 14px
with `opacity: .8` (contrast risk); hover-only avatar zoom (scale 3.5!) is unusable on
touch and odd for a11y.

## 9. Performance current state

- Three persistent rAF canvases on `/` (hero constellation, pixel text, cursor halo) —
  expensive on low-end devices; cursor halo runs on **every** page.
- Fonts from Google CDN (extra connection, no self-host), loaded twice.
- No responsive images / `srcset`; Directus transforms only used for OG images
  (CODE_REVIEW.md open item #3).
- Logs list page fetches full `content` of every post.
- `logs/[slug]` fetches the entire logs list a second time for RelatedLogs.
- No caching layer in front of Directus calls; every SSR request re-fetches.
- No font preloads (stylesheet only); blocking Google Fonts CSS.

## 10. CODE_REVIEW.md open items (carried into v4 planning)

1. Responsive images via Directus transforms (Medium impact) — folded into V4 image strategy.
2. Filter JS duplication (Low) — superseded by v4 component architecture.
3. `as any` SDK fields args (Low, SDK limitation) — repository layer will isolate this.
4. Verify `og:type article` after deploy (Trivial).

## 11. Courses PRD vs reality

`docs/COURSES_PRD.md` (v1.0, 2026-04-02) is **entirely unimplemented**: no collections,
no middleware, no auth, no API routes, no course pages. The PRD's design language section
(§4) is written for the brutalist system and is superseded by the v4 design system; its
data model, security model, journeys, and API design remain valid inputs.
Conflicts and resolutions are catalogued in `08-DIRECTUS-CONTENT-MODEL.md` §9 and
`05-PAGE-BLUEPRINTS.md` (course pages).

## 12. Orphaned / removable artifacts

- `frontend/public/masks/portrait-dissolve-*.svg` — replaced by canvas approach.
- `reference/` directory — v3-era design references; keep for history, exclude from v4 guidance.
- `frontend/src/components/blog/{Callout,Expandable,PullQuote}.astro` — currently dead on
  the render path (see §5.4.7); v4 replaces them with a single rendering source of truth.
- Legacy CSS var map in `global.css` — retired with the v4 token file.

## 13. What is genuinely good and should carry forward

1. The `:::` authoring convention and its WYSIWYG resilience (improve, don't replace).
2. SSR mode + repository-ish fetch isolation in `lib/directus.ts` (formalize into
   `lib/repositories/`).
3. The OG image public-URL guard + Directus transform pattern.
4. Dual-theme token architecture with pre-paint inline script.
5. `AGENT_BLOG_GUIDE.md` as an authoring contract — update for v4, keep the idea.
6. Deployment topology (Coolify two-resource monorepo) — unchanged in v4.
