# V4-QA-002 SEO / OG Validation

Date: 2026-06-13

## Scope

Executed the 10 §7 SEO/OG validation pass against local branch output and public
staging spot checks.

## Local Head Matrix

Source: local dev server `http://127.0.0.1:4321`, plus a temporary staging-backed local
server on `http://127.0.0.1:4323` for populated Dream Team and author data.

| Page | Status | Canonical | Robots | OG type | OG image | JSON-LD |
|---|---:|---|---|---|---|---|
| Home `/` | 200 | `/` | index | website | `og-home.png` | `WebSite`, `Organization` |
| Blog `/blog` | 200 | `/blog` | index | website | `og-blog.png` | `Blog` |
| Projects `/projects` | 200 | `/projects` | index | website | `og-projects.png` | `CollectionPage` |
| Case study `/projects/tableau-waterfall-chart` | 200 | self | index | article | `projects/tableau-waterfall-chart.png` | `CreativeWork`, `BreadcrumbList` |
| Dream Team `/dream-team` | 200 | `/dream-team` | index | website | `og-team.png` | `ItemList` |
| Author `/dream-team/atef-alvi` | 200 | self | index | profile | `og-team.png` | `ProfilePage`, `BreadcrumbList` |
| Connect `/connect` | 200 | `/connect` | index | website | `og-default.png` | `ContactPage` |
| Privacy `/privacy` | 200 | `/privacy` | index | website | `og-default.png` | none |
| 404 fallback | 404 | requested path | noindex | website | `og-default.png` | none |
| 500 `/500` | 500 | `/500` | noindex | website | `og-default.png` | none |

All checked pages emit:

- one canonical URL;
- `og:title`, `og:description`, `og:url`, `og:image`, `og:image:width=1200`,
  `og:image:height=630`, and `og:image:alt`;
- Twitter summary-large-image tags;
- one site-wide RSS alternate link to `https://data-dreamer.net/rss.xml`.

## Findings Fixed Inline

### RSS alternate was not site-wide

The RSS alternate link was only passed by blog routes. 10 §3 says the RSS alternate is
site-wide in the head. `BaseLayout` now injects the DataDreamer RSS feed by default and
deduplicates page-provided feeds.

### Case studies used generic OG fallback

10 §5.1 calls for per-case-study OG images. Added `scripts/generate-project-og.mjs`,
generated current project OG files, and wired case-study pages to
`/og/projects/{slug}.png`.

Generated files:

| File | Size | Dimensions |
|---|---:|---:|
| `og/projects/airflow-retry-framework.png` | 48 KB | 1200×630 |
| `og/projects/signal-dashboard.png` | 52 KB | 1200×630 |
| `og/projects/tableau-waterfall-chart.png` | 39 KB | 1200×630 |

## OG Asset Inventory

Temporary fallback images remain valid:

| File | Size | Dimensions |
|---|---:|---:|
| `og-default.png` | 38 KB | 1200×630 |
| `og-home.png` | 36 KB | 1200×630 |
| `og-blog.png` | 37 KB | 1200×630 |
| `og-projects.png` | 39 KB | 1200×630 |
| `og-team.png` | 40 KB | 1200×630 |
| `og-about.png` | 34 KB | 1200×630 |
| `og-courses.png` | 38 KB | 1200×630 |

## Robots / Sitemap / RSS

- `robots.txt` contains the required disallows:
  `/student`, `/api`, `/login`, `/signup`, `/forgot-password`, `/reset-password`.
- Built `dist/client/sitemap-index.xml` includes:
  `https://data-dreamer.net/sitemap-posts.xml` and
  `https://data-dreamer.net/sitemap-0.xml`.
- Built `dist/client/sitemap-0.xml` contains canonical public static routes only.
- Local `sitemap-posts.xml` returns `200`, `application/xml`, and
  `Cache-Control: public, s-maxage=3600`.
- Local `rss.xml` returns a valid empty feed because there are currently no published
  posts.

## Public Staging Spot Checks

Checked `https://staging.data-dreamer.net/`, `/blog`, `/projects`, `/dream-team`, and
`/connect`:

- all returned `200`;
- `X-Robots-Tag: noindex` present on staging responses;
- server-rendered titles, `robots`, and OG images matched the local branch contract for
  the currently deployed staging version.

OpenGraph.xyz automated checks were attempted for staging URLs and returned `429 Too
Many Requests`, so external visual preview evidence is blocked by the validator service.
The server-rendered OG tags were validated directly from HTTP responses instead.

## Remaining Risks

- Article `BlogPosting` and topic-page `CollectionPage` live checks need at least one
  published post with topics in staging. Current staging/local data has zero published
  posts, so these were covered by unit/snapshot tests and missing-route 404 checks only.
- Author pages intentionally use the `og-team.png` fallback until the deferred per-author
  final-art phase.
