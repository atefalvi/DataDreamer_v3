# 09 — Technical Architecture (Astro v4 organization)

## 1. Stack decisions (changes from v3)

| Area | Decision | Rationale |
|---|---|---|
| Astro 5 SSR + node adapter | **keep** | works, deployed, SSR needed for instant publish + (v4.1) auth |
| Rendering strategy | SSR everywhere; per-route `Cache-Control` headers (§8) | simpler than mixed prerender; Cloudflare does the caching |
| CSS | plain CSS + tokens (no Tailwind) | v3 precedent, small team, design system is bespoke; Tailwind migration would be churn without capability gain |
| Fonts | self-hosted `@fontsource-variable/{fraunces,inter}` + `@fontsource/jetbrains-mono` | kills Google CDN dependency (audit §9) |
| Icons | `lucide-static` (build-time SVG) | 04 §8 |
| Validation | `zod` | external data (Directus rows, json fields, API bodies v4.1) validated at the repository boundary |
| Images | Astro `<Image>` for repo assets; Directus transform URL builder for CMS assets | §7 |
| Tests | `vitest` (unit) — markdown pipeline golden files, repositories (mocked fetch), layout algorithm, format utils | meaningful-behavior testing without E2E infra; manual QA checklist for flows |
| New deps total | fontsource pkgs, lucide-static, zod, vitest (dev) | each justified above; anything further needs handoff note |

## 2. Directory tree (target)

```
frontend/src/
├── components/          # per 06 §1 (ui/ global/ home/ blog/ projects/ dream-team/ courses/ about/)
├── layouts/             # BaseLayout, ProseLayout (+ v4.1 AuthLayout, StudentLayout)
├── pages/
│   ├── index.astro  about.astro  connect.astro  privacy.astro  404.astro  500.astro
│   ├── blog/index.astro  blog/[...page].astro? (pagination)  blog/[slug].astro
│   │   blog/topic/[slug].astro
│   ├── projects/index.astro  projects/[slug].astro
│   ├── dream-team/index.astro  dream-team/[slug].astro
│   ├── logs/[...rest].astro          # 301 shim → /blog/*
│   ├── rss.xml.ts
│   └── (v4.1) courses/…  student/…  login.astro…  api/auth/*  api/courses/*
├── lib/
│   ├── directus/client.ts            # SDK instance + URL config ONLY
│   ├── repositories/                 # posts.ts authors.ts topics.ts (v4.1 courses.ts progress.ts)
│   ├── markdown/                     # pipeline.ts blocks.ts headings.ts (see §6)
│   ├── motion/reveal.ts
│   ├── seo/ (meta.ts jsonld.ts og.ts)
│   ├── images.ts                     # Directus transform URL + srcset builders
│   ├── format.ts                     # dates, reading time, initials
│   ├── validation/ (schemas.ts)      # zod schemas for json fields + API bodies
│   └── (v4.1) auth/ (session.ts guards.ts rate-limit.ts)
├── content/
│   ├── config.ts                     # content collection schemas (zod)
│   ├── projects/*.md                 # case studies (migrated from Directus)
│   ├── site.ts                       # nav/footer/social/home copy/flags
│   └── about.ts                      # about page content
├── middleware.ts                     # (v4.0: error envelope + security headers;
│                                     #  v4.1: + session → locals.user, /student guard)
├── styles/ (tokens.css base.css prose.css)
├── assets/ (brand/ icons/ projects/ about/)
├── types/content.ts
└── env.d.ts
```

Migration is incremental (06 §8): new modules land beside old ones; pages switch
imports task-by-task; old files deleted in the same task that replaces them. **No
big-bang rewrite commit.**

## 3. Environment variables (v4 final set)

| Var | Scope | Notes |
|---|---|---|
| `DIRECTUS_URL` | server | internal API URL |
| `PUBLIC_DIRECTUS_URL` | client-visible | asset URL base (keep v3 comment block explaining the pair — it earned its keep) |
| `SITE_URL` | server | `https://data-dreamer.net` (stop hardcoding in layout) |
| `DIRECTUS_TOKEN` | server only | **optional** read-only static token (V4-ARC-001). Used by `lib/directus/client.ts` where the Public role isn't open (e.g. greenfield staging). Unset → reads via Public role. Never `PUBLIC_`. Distinct from the v4.1 write service token |
| removed | — | `DIRECTUS_EMAIL`, `DIRECTUS_PASSWORD` (08 §5); the new client has no login path (still set in `.env` only because v3 pages/`lib/directus.ts` use them until B-phase migration) |
| v4.1: `DIRECTUS_SERVICE_TOKEN` | server only | service role; never `PUBLIC_` |
| v4.1: `SESSION_COOKIE_NAME`, `RATE_LIMIT_*` | server | auth tuning |

`.env.example` updated in lockstep; Coolify var changes listed in handoff before deploy.

## 4. Repository layer rules

1. Pages/components import repositories only — `grep -r "@directus/sdk" src/pages src/components` must return nothing.
2. Each repo function: explicit field list, zod-parse of json fields, map to view-model
   (06 §7), typed `RepositoryError` on failure (08 §8 error policy).
3. Per-request memoization: a tiny `cachedPerRequest(fn)` helper keyed on
   `Astro.locals` so footer-topics + page data don't double-fetch within one request.
   Cross-request caching is delegated to HTTP caching (§8) — no in-process TTL cache
   (multi-instance Coolify would make it inconsistent).
4. No repository imports another repository's internals; shared mapping helpers live
   in `repositories/_mappers.ts`.

## 5. Content collections (`src/content/config.ts`)

```ts
projects: defineCollection({ type: 'content', schema: ({image}) => z.object({
  title: z.string().max(120), slug: implicit-from-filename,
  summary: z.string().max(220), year: z.number(), role: z.string(),
  stack: z.array(z.string()).max(10), cover: image(), coverAlt: z.string(),
  featured: z.boolean().default(false), order: z.number().default(0),
  links: z.array(z.object({label: z.string(), url: z.string().url()})).optional() })})
```
Case-study bodies run through the same remark/rehype plugin set as Directus posts
(shared `markdown/pipelineConfig.ts` consumed both by `lib/markdown/pipeline.ts` and
`astro.config.mjs` markdown settings) so `:::` blocks behave identically.

## 6. Markdown pipeline v4 (`lib/markdown/`)

Preserves the v3 authoring contract (audit §5.5), fixes the weaknesses (audit §5.4).

```
renderMarkdown(content: string) → { html, headings, readingMinutes }

Stage 0  wysiwygNormalize(raw)        # blocks.ts — port of v3 cleanup (nbsp, <br>,
         <p>-wrapped fences/tables/markers); covered by golden-file tests
Stage 1  remark-parse + remark-gfm
Stage 2  remarkCustomBlocks (NEW — proper remark plugin replacing string splicing):
         - walks the tree for paragraph nodes matching /^:::(type)(\s+title|\{title=…\})?/
         - collects sibling nodes until closing ::: paragraph
         - wraps them as a `containerDirective`-style custom node {type, title, children}
         - children remain mdast → **markdown inside blocks now renders fully**
         - one nesting level; unknown types pass through literally (forward compat)
Stage 3  remark-rehype (allowDangerousHtml for legacy inline HTML) + rehype-raw
Stage 4  rehypeCustomBlocks: custom nodes → final HTML structures
         - callouts → <aside> per callout spec (05 §3a), icon SVG injected from a
           build-time map (lucide), title text escaped
         - details → <details class="expand"><summary>…
         - quote → <figure class="pull-quote"><blockquote>…
         - imagegrid → grid markup (unchanged classes for lightbox)
Stage 5  rehype-slug + autolink (behavior: 'append', anchor link with aria-label)
Stage 6  @shikijs/rehype dual theme (github-dark-default / github-light-default,
         defaultColor: false → CSS-variable driven, themed by [data-theme])
         + transformer adding language label + copy-button wrapper
Stage 7  rehype-image-figure (img w/ title → figure/figcaption; adds loading=lazy,
         decoding=async; Directus URLs get width/format params via images.ts)
Stage 8  rehype-stringify
Headings: collected in Stage 5 from the tree (no regex on HTML — audit §5.4.8 fixed);
         original case preserved.
readingMinutes = ceil(words/220).
Tests:   golden fixtures = every syntax from AGENT_BLOG_GUIDE.md + 3 real published
         posts' source snapshots → snapshot HTML. Run in CI (vitest).
```

## 7. Image strategy

- Repo assets: Astro `<Image>`/`<Picture>` (sharp at build), widths {480,800,1200,1600}.
- Directus assets: `images.ts` builders:
  `directusImage(id, {w, h?, fit?})` → `${PUBLIC_DIRECTUS_URL}/assets/${id}?width=…&format=webp&quality=80`
  `directusSrcset(id, widths, sizes)` → full srcset string. All CMS `<img>` go through
  these; `width`/`height` attrs from stored file metadata (zero CLS).
- OG images: 1200×630 jpeg transform with the v3 public-URL guard (kept verbatim).

## 8. Caching & headers (middleware)

| Route class | Cache-Control |
|---|---|
| Public pages (v4.0) | `public, max-age=0, s-maxage=300, stale-while-revalidate=86400` (Cloudflare edge does the work; publish latency ≤5 min accepted; documented for editors) |
| RSS/sitemap | `s-maxage=3600` |
| Static assets (hashed) | `immutable, max-age=31536000` (Astro default) |
| v4.1 authed/student/api | `private, no-store` |

Security headers (middleware, all routes): `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy: camera=(), microphone=(), geolocation=()`, CSP report-only first
(`default-src 'self'; img-src 'self' PUBLIC_DIRECTUS_URL data:; script-src 'self'
'inline-hash…'; frame-src youtube-nocookie.com` — tightened to enforcing after a week
of clean reports; task V4-PERF-003).

## 9. Error handling (route level)

```
middleware onRequest:
  try { return next() }
  catch err:
    log structured {url, message, stack-id}   # console → Coolify logs
    if err instanceof RepositoryError and err.kind == 'not_found': rewrite to /404
    return rewrite to /500 (status 500)
Page-level: primary fetch null → Astro.rewrite('/404') (NOT redirect — keep URL);
section fetch failure → ErrorState component (05 universal rules).
```

## 10. Auth architecture (v4.1) — adopt COURSES_PRD §11 verbatim
with these implementation pins: middleware validates session only on `/student/*` and
API routes (public pages read the cookie without Directus round-trip unless present);
`auth/rate-limit.ts` = fixed-window counters in a Map with periodic sweep (single
node instance; revisit if scaled horizontally — documented limitation); logout POST
only (CSRF: SameSite=Lax + custom header check `X-Requested-With` on all POST APIs).

## 11. Build, CI, deploy

- Scripts: `dev`, `build`, `preview`, `check` (astro check), `test` (vitest),
  `test:golden` (pipeline fixtures).
- CI (GitHub Actions, new): on PR → install, `astro check`, `vitest run`, `astro build`
  (with stub env). Merge to `main` → Coolify auto-deploy (existing).
- Branch model: tasks branch from `feature/v4-redesign`; PRs into it; staging deploy
  tracks `feature/v4-redesign` (set up in Coolify as a third resource —
  `staging.data-dreamer.net`, V4-FND-003); production cutover = merge to `main`
  (12 §Phase F).
- Local dev unchanged (SETUP.md flow); SETUP.md updated at cutover (V4-DOC-001).
