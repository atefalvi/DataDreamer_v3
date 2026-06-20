# 10 — SEO, Metadata & OG Images

## 1. Principles
SSR pages with complete server-rendered meta (already true in v3 — keep the bar).
One `SeoHead.astro` partial; pages pass a typed `Seo` object; nothing assembles meta
ad hoc.

## 2. The `Seo` contract (`lib/seo/meta.ts`)

```ts
interface Seo {
  title: string;            // page part only; template applied centrally
  description: string;      // 120–160 chars target
  canonical?: string;       // default: SITE_URL + pathname (no query, no trailing /)
  ogType?: 'website'|'article'|'profile';
  ogImage?: OgImage;        // resolved via §5 cascade if omitted
  article?: { publishedTime: string; author: string; tags?: string[] };
  noindex?: boolean;
  jsonLd?: object[];        // emitted as one <script type="application/ld+json"> each
}
```

**Title template**: `{title} — DataDreamer`; homepage exactly
`DataDreamer — Field notes from the future of data`. Sentence case; ≤60 chars target;
the v3 `SECTION // NAME` voice is retired.
**Descriptions**: articles = excerpt; Field Guides = `summary`; listings = curated
strings in page files; authors = `{name} is a {role} at DataDreamer — writing on
{top topics}.` (built in repo mapper).

## 3. Per-page matrix

| Page | ogType | JSON-LD | noindex | Notes |
|---|---|---|---|---|
| Home | website | WebSite + Organization (logo, sameAs) | | |
| Blog landing | website | Blog | | `<link rel="alternate" type="application/rss+xml">` site-wide in head |
| Topic page | website | CollectionPage + BreadcrumbList | | canonical self; page-2+ canonical self + rel prev/next |
| Article | article | BlogPosting (headline, datePublished, dateModified, author→Person w/ url, image, wordCount) + BreadcrumbList | | article:published_time/author/tag |
| Project index | website | CollectionPage | | |
| Case study | article | CreativeWork + BreadcrumbList | | |
| Dream Team | website | ItemList of Person | | |
| Author | profile | ProfilePage + Person (sameAs = links) + BreadcrumbList | | |
| About | website | AboutPage + Person | | |
| Connect | website | ContactPage | | |
| Privacy | website | — | | |
| 404/500 | — | — | ✅ (meta robots) | |
| Field Guides catalogue (v4.1) | website | ItemList | | indexable |
| Field Guide (v4.1) | article | Article/CreativeWork (author = curator) + BreadcrumbList | | **Indexable**: the page serves a public **preview** (hero, why/outcome, curator, syllabus titles) to crawlers/anonymous users; gated item bodies/notes live behind login on the same URL, so there's nothing private to noindex |
| Login / Signup (v4.1) | — | — | ✅ | thin auth surfaces; never indexed |
| Account (v4.1) | — | — | ✅ | protected; `private, no-store` |

## 4. Robots, sitemap, RSS, duplication
- `robots.txt` (regenerated): allow all; `Disallow: /api/`, `/account`, `/login`,
  `/signup`. Field Guides (`/guides`, `/guides/[slug]`) are public previews and stay
  **indexable** — only the auth/account surfaces and API are disallowed.
- Sitemap: `@astrojs/sitemap` with filter excluding noindex routes; custom serializer
  adds `lastmod` for posts (needs SSR-aware approach: keep integration for static
  routes + a small custom `sitemap-posts.xml.ts` endpoint listing posts with lastmod;
  reference it from a `sitemap-index`). Task V4-SEO-002 owns this.
- RSS: `rss.xml.ts` — latest 20 posts, full excerpt + link (not full content), authors,
  topics as categories.
- Duplicate-content prevention: canonicals everywhere; topic pages don't paginate past
  content (12/page); `/logs/*` 301s (03 §1); query params never canonicalized.

## 5. OG image system

### 5.1 Inventory & naming (all 1200×630 PNG, `public/og/`)

| File | Used by | v4.0 source |
|---|---|---|
| `og-default.png` | fallback, connect, privacy | **temporary generated** (§5.2) |
| `og-home.png` | home | temporary generated |
| `og-blog.png` | blog landing/topics, article fallback | temporary generated |
| `og-projects.png` | project index, case-study fallback | temporary generated |
| `og-team.png` | dream team, author fallback | temporary generated |
| `og-about.png` | about | temporary generated |
| `og-guides.png` (v4.1) | Field Guide catalogue + guide fallback | temporary generated |
| per-article | article w/ cover_image | Directus transform (1200×630, jpeg, quality 85) + public-URL guard — pattern kept from v3 |
| per-case-study | case study w/ cover | build-time sharp resize → `public/og/projects/[slug].png` |
| per-author | author pages | **deferred to final-art phase**; fallback `og-team.png` until then |

### 5.2 Temporary fallback set (unblocks development — final art comes later)
One Satori-free approach (no new deps): a one-off node script
(`scripts/generate-og-temp.mjs`, uses sharp already present via Astro) composites:
`--bg-0` background, the retained DataDreamer lockup (existing nested-square mark +
Anton wordmark, white ink, brand-red `#FD2E00` dot — 04 §9) top-left at 64px margin,
section title in Inter 600 72px, thin ember rule. (The V4-FND-002 temporary set was
generated before the lockup decision was recorded; it is acceptable as-is for
development — final art and any regeneration must use the retained lockup.) Safe areas: 64px margins all sides;
no text in outer 80px bottom (platform UI overlap). Script committed; images
committed; regenerating is one command.

### 5.3 Final replacement process (when owner provides final PNGs)
1. Owner drops files into `public/og/` matching the inventory names exactly
   (overwrite). 2. Verify 1200×630, <300KB each. 3. Run checklist below. 4. Purge
   Cloudflare cache for `/og/*`. 5. Re-validate with opengraph.xyz + Slack/WhatsApp
   paste test (v3 lesson: Cloudflare bot rules — audit/CODE_REVIEW history; confirm
   WAF bypass still active).
**Checklist** (lives here; tick in handoff): [x] temporary fallback set in place
(V4-FND-002: default, home, blog, projects, team, about; v4.1 adds guides). Final
replacement: [ ] default [ ] home [ ] blog [ ] projects [ ] team [ ] about [ ] guides
[ ] per-author template decision.
During development, social previews always work because temporary files exist from
Phase A — **no broken-preview window.**

### 5.4 Hierarchy/lookup (implemented in `lib/seo/og.ts`)
```
resolveOgImage(page):
  explicit page-provided image (validated public https, 1200×630 params applied)
  → section default (table §5.1)
  → og-default.png
Always absolute URLs (SITE_URL); og:image:alt always set (title-derived).
```

## 6. Pagination & breadcrumbs
Paginated lists: `rel="prev"/"next"` links, canonical per page, titles suffixed
"— page 2". Breadcrumbs: `Breadcrumbs.astro` renders visible trail (article, author,
case study, topic, Field Guide pages) + BreadcrumbList JSON-LD from same data.

## 7. Validation gates (every SEO-touching task)
`astro build` then: meta snapshot tests (vitest over rendered head for fixture pages),
Rich Results test for BlogPosting/Article/Person manually at QA phase, opengraph.xyz
spot checks on staging (V4-QA-002 checklist).
