# V4-PERF-001 Budgets & Lighthouse Audit

Date: 2026-06-14

## Scope

Measured the 12 §performance budget table against a production build. Staging was also
checked for response headers, but the Lighthouse pass used a local production preview of
this branch so the measurements include the cache/font fixes in this task.

Runtime used for measured Lighthouse pass:

- `npm run build`
- `PUBLIC_DIRECTUS_URL=http://192.168.10.211:8056`
- `DIRECTUS_URL=http://192.168.10.211:8056`
- `npm run preview -- --host 127.0.0.1 --port 4324`
- Lighthouse 13.4.0, mobile form factor, 390×844, simulated throttling.

## Budget Results

| Budget | Target | Measured | Result |
|---|---:|---:|---|
| Client JS per public page | ≤35 KB gzip; home ≤45 KB | Home 3.21 KB gzip; blog/projects/team/connect 0 KB; case study 0.06 KB | Pass |
| LCP | <2.5s | 2.0–2.1s across measured public routes | Pass |
| CLS | <0.1 | 0 across measured routes | Pass |
| INP | <200ms | Lab proxy: TBT 0ms across measured routes | Pass as lab proxy; needs field data after release |
| Fonts | 3 files, preloaded, swap, ≤220 KB | 3 files, 108 KB total, all preloaded | Pass |
| Images | srcset/sized; priority for hero/cover | Project covers use Astro image widths; blog cards/articles use Directus `srcset`; no image CLS in Lighthouse | Pass |
| Directus | ≤2 queries/page + cached footer topics | Home fits primary budget; blog/detail/team routes can exceed budget because listing/detail and footer topic calls are separate | Accepted deviation |
| Edge caching | s-maxage per 09 §8 | Successful HTML: `public, max-age=0, s-maxage=300, stale-while-revalidate=86400` | Pass after inline fix |

## Lighthouse Matrix

| Route | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | Byte weight |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` | 99 | 96 | 100 | 100 | 2.1s | 0 | 0ms | 183 KB |
| `/blog` | 99 | 100 | 100 | 100 | 2.0s | 0 | 0ms | 160 KB |
| `/projects` | 99 | 100 | 100 | 100 | 2.0s | 0 | 0ms | 165 KB |
| `/dream-team` | 99 | 100 | 100 | 100 | 2.0s | 0 | 0ms | 170 KB |
| `/connect` | 99 | 100 | 100 | 100 | 2.0s | 0 | 0ms | 157 KB |

Baseline before the font fix had home Lighthouse Performance 93 and home LCP 2.6s.
The optimized font set and preloads brought home LCP to 2.1s.

## Asset Inventory

Built font files:

| File | Size |
|---|---:|
| `fraunces-latin-wght-normal.*.woff2` | 36 KB |
| `inter-latin-wght-normal.*.woff2` | 48 KB |
| `jetbrains-mono-latin-400-normal.*.woff2` | 24 KB |
| **Total** | **108 KB** |

Public route JS:

| Route | JS |
|---|---:|
| `/` | `HeroSignalField` 3.21 KB gzip |
| `/blog` | 0 KB |
| `/projects` | 0 KB |
| `/projects/tableau-waterfall-chart` | 0.06 KB gzip |
| `/dream-team` | 0 KB |
| `/dream-team/atef-alvi` | 0 KB |
| `/connect` | 0 KB |
| `/privacy` | 0 KB |

Every checked built route emitted exactly three font preloads and the successful-HTML
edge cache header.

## Staging Header Spot Check

Checked `https://staging.data-dreamer.net/`, `/blog`, `/projects`, `/dream-team`, and
`/connect` before this branch was merged:

- all returned `200`;
- `X-Robots-Tag: noindex` was present;
- security headers were present;
- successful HTML still returned `Cache-Control: no-store` on the deployed staging
  version, which is the cache bug fixed in this task.

Checked static staging assets:

| Asset | Result |
|---|---|
| `/_astro/HeroSignalField...js` | `Cache-Control: public, max-age=31536000, immutable` |
| `/og/og-home.png` | `Cache-Control: public, max-age=14400` |

## Findings Fixed Inline

### Successful public HTML used `no-store`

The adapter already set `Cache-Control`, so middleware only filled missing values and
left successful public HTML at `no-store`. Middleware now always applies the 09 §8
public-page cache policy to successful HTML `GET` responses and still uses `no-store`
for errors and non-GET HTML.

### Font bundle exceeded the budget and had no preload

The global shell imported broad fontsource CSS files, bundling 18 WOFF2 files totaling
about 404 KB and emitting no preload hints. The shell now imports `styles/fonts.css`,
which defines only the latin Fraunces variable, latin Inter variable, and latin
JetBrains Mono 400 faces. BaseLayout preloads those three files.

Dev styleguide pages now use the same `styles/fonts.css`, so the build artifact
inventory reflects the production font strategy.

## Accepted Deviations / Follow-Up

- **Directus query count**: blog listing/detail and author detail can exceed the strict
  ≤2 primary-query budget once populated because listing metadata, author counts,
  related content, and footer topics are fetched independently. This needs a focused
  repository aggregation/caching pass; changing those contracts during the Lighthouse
  audit would exceed the intended task scope.
- **INP**: Lighthouse provides TBT, not real INP. Field INP should be reviewed after
  production traffic exists.
- **Native staging Lighthouse after merge**: this branch measured local production
  preview for the fixed code. Re-run Lighthouse against `staging.data-dreamer.net` after
  the PR deploys to confirm Cloudflare/Coolify parity.
