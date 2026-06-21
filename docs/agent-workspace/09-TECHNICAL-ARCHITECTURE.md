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
├── components/          # per 06 §1 (ui/ global/ home/ blog/ projects/ dream-team/ guides/ about/)
├── layouts/             # BaseLayout, ProseLayout
├── pages/
│   ├── index.astro  about.astro  connect.astro  privacy.astro  404.astro  500.astro
│   ├── blog/index.astro  blog/[...page].astro? (pagination)  blog/[slug].astro
│   │   blog/topic/[slug].astro
│   ├── projects/index.astro  projects/[slug].astro
│   ├── dream-team/index.astro  dream-team/[slug].astro
│   ├── logs/[...rest].astro          # 301 shim → /blog/*
│   ├── rss.xml.ts
│   └── (v4.1) guides/index.astro  guides/[slug].astro   # preview + gated reader
├── lib/
│   ├── directus/client.ts            # SDK instance + URL config ONLY
│   ├── repositories/                 # posts.ts authors.ts topics.ts (v4.1 guides.ts)
│   ├── markdown/                     # pipeline.ts blocks.ts headings.ts (see §6)
│   ├── motion/reveal.ts
│   ├── seo/ (meta.ts jsonld.ts og.ts)
│   ├── images.ts                     # Directus transform URL + srcset builders
│   ├── format.ts                     # dates, reading time, initials
│   ├── validation/ (schemas.ts)      # zod schemas for json fields
│   └── (v4.1) guides/progress.ts     # deriveProgress helpers + client enhancer (§10)
├── content/
│   ├── config.ts                     # content collection schemas (zod)
│   ├── projects/*.md                 # case studies (migrated from Directus)
│   ├── site.ts                       # nav/footer/social/home copy/flags
│   └── about.ts                      # about page content
├── middleware.ts                     # error envelope + security headers
│                                     #  (v4.1 adds session read + protected account/reader guards)
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
| `DIRECTUS_TOKEN` | server only | **optional** read-only static token (V4-ARC-001). Used by `lib/directus/client.ts` where the Public role isn't open (e.g. greenfield staging). Unset → reads via Public role. Never `PUBLIC_` |
| removed | — | `DIRECTUS_EMAIL`, `DIRECTUS_PASSWORD` (08 §5); no frontend admin login path |
| v4.1 Directus/Coolify | backend | Directus auth/SSO vars for registration, cookies, CORS credentials, email, and Google OpenID (`AUTH_PROVIDERS`, `AUTH_GOOGLE_*`, `USER_REGISTER_URL_ALLOW_LIST`, `PASSWORD_RESET_URL_ALLOW_LIST`, cookie-domain settings). No frontend admin credentials. |
| v4.1 frontend | server | Auth route configuration only (`SITE_URL`, Directus URLs, optional CSRF/session signing secret if the Astro bridge stores any local session metadata). Do not expose auth secrets with `PUBLIC_`. |

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
| Field Guide previews (v4.1) | same as public pages — preview content is public |
| Auth/account/guide reader state (v4.1) | `private, no-store` for authenticated HTML/API responses |

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

## 10. Field Guide auth + progress architecture (v4.1)

Field Guides are public previews with a login-gated reader. Anonymous visitors can
browse `/guides` and `/guides/[slug]` preview metadata, but starting a guide, reading
item bodies/curator notes, and saving progress require a Directus user with the
`guide_reader` role. This creates an account reason without reintroducing the old LMS
surface.

**Repository / view-model layer.** Field Guides follow the existing pattern exactly
(06 §7, 08 §8): `lib/repositories/guidesRepo.ts` is the only place that touches the
SDK for public preview data and authenticated guide reads. It maps raw Directus rows
(`lib/directus/schema.ts`) into view-models (`types/content.ts`) via `_mappers.ts`,
running markdown fields through the pipeline. Pages import repositories and auth
helpers, never the SDK directly.

**Auth bridge.** Astro owns the public UX routes (`/login`, `/signup`, `/account`) and
small server endpoints under `/api/auth/*`. Directus remains the identity source of
truth. Email/password login uses Directus session mode; Google login uses Directus
OpenID and redirects back through an allow-listed frontend URL. Middleware reads the
session, sets `Astro.locals.user`, and guards only `/account` plus the authenticated
reader state on `/guides/[slug]`.

Directus OAuth sets `directus_session_token` for the shared `.data-dreamer.net` parent
domain. Logout therefore clears both host-scoped JSON-auth cookies and that exact
domain-scoped cookie. `AUTH_COOKIE_DOMAIN` can override the scope; production also
infers `.data-dreamer.net` from `SITE_URL` so a missing Coolify variable cannot leave a
Google session behind. Local and unrelated hosts remain host-only. The authenticated
identity policy should expose only the current user's `id`, `email`, `first_name`, and
`last_name` through `/users/me`; account UI must remain usable if a restricted service
identity returns only `id`.

**Progress API** = `/api/guides/progress`, backed by `guide_progress`:

```
API:
  GET  /api/guides/progress?guide=<id>
       -> current user's progress row or derived empty progress
  POST /api/guides/progress
       body: { guideId, completedItemIds, lastItemId }
       -> validates session + item ids, upserts the current user's row

  deriveProgress(guide, row)-> {                            # PURE, unit-testable
       status: 'not-started' | 'in-progress' | 'completed',
       percent,                # round(completed / totalItems * 100)
       completedCount, remainingCount,
       estMinutesRemaining,    # sum est_time of incomplete items
       resumeItemId }          # lastItemId if still incomplete, else first incomplete

guards:
  - unauthenticated writes return 401 and the UI sends the user to
    `/login?next=/guides/<slug>`.
  - completedItemIds are pruned against the current published guide item ids.
  - a user can only read/update rows where `user = $CURRENT_USER`.
  - if a guide is archived/unpublished, progress remains in Directus but the public UI
    does not expose the guide.
```

**Rendering pattern.** The catalogue and guide preview render server-side for everyone.
Logged-out guide previews show the syllabus preview and a primary "Sign in to start"
CTA. Logged-in guide readers receive the full path and progress state from Directus.
Completion toggles are progressive enhancement: without JS, the reader still sees the
content and can submit simple form actions; with JS, toggles update optimistically and
refresh from the API.

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
