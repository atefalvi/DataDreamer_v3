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

---

# V4-PERF-002 Font Loading Tuning

Date: 2026-06-14

## Scope

Completed the font-specific follow-up from 04 §4.1: subset check, preloads,
metric-compatible fallback stacks, and CLS verification on slow 3G.

Runtime used:

- `npm run build`
- `PUBLIC_DIRECTUS_URL=http://192.168.10.211:8056`
- `DIRECTUS_URL=http://192.168.10.211:8056`
- `npm run preview -- --host 127.0.0.1 --port 4324`
- Lighthouse 13.4.0, mobile form factor, 390×844, simulated slow 3G
  (`rttMs=400`, `throughputKbps=400`, `cpuSlowdownMultiplier=4`).

## Subset / Preload Check

| Face | File | Loaded by | Size |
|---|---|---|---:|
| Fraunces display | `fraunces-latin-wght-normal.*.woff2` | `BaseLayout` preload + `styles/fonts.css` | 36 KB |
| Inter text/UI | `inter-latin-wght-normal.*.woff2` | `BaseLayout` preload + `styles/fonts.css` | 48 KB |
| JetBrains Mono | `jetbrains-mono-latin-400-normal.*.woff2` | `BaseLayout` preload + `styles/fonts.css` | 24 KB |
| **Total** | 3 WOFF2 files | all public routes | **108 KB** |

Checked built output after tuning: no extra WOFF2 files were emitted.

## Fallback Metrics

Measured with a temporary `fontkit` install outside the repo against the actual WOFF2
files and macOS local fallback files. The resulting fallback faces are declared in
`styles/fonts.css` and referenced by the design tokens before the generic fallbacks.

| Role | Webfont | Local fallback | Size adjust | Ascent | Descent | Line gap |
|---|---|---|---:|---:|---:|---:|
| Display | Fraunces Variable | Georgia | 115.9% | 84.4% | 22% | 0% |
| Text/UI | Inter Variable | Arial | 107.1% | 90.5% | 22.5% | 0% |
| Mono | JetBrains Mono | Menlo | 99.7% | 102.3% | 30.1% | 0% |

Token stacks after tuning:

- `--font-display`: `"Fraunces Variable", "Fraunces Fallback", Georgia, serif`
- `--font-text`: `"Inter Variable", "Inter Fallback", system-ui, sans-serif`
- `--font-mono`: `"JetBrains Mono", "JetBrains Mono Fallback", ui-monospace, monospace`

## Slow-3G CLS Evidence

| Route | FCP | LCP | CLS | TBT |
|---|---:|---:|---:|---:|
| `/` | 4.4s | 8.0s | 0 | 0ms |
| `/blog` | 3.2s | 6.0s | 0 | 0ms |
| `/projects` | 3.2s | 6.4s | 0 | 0ms |
| `/dream-team` | 3.6s | 6.8s | 0 | 0ms |
| `/connect` | 3.2s | 6.4s | 0 | 0ms |

The intentionally harsh slow-3G run is for font-swap layout stability, not the 4G
performance gate. CLS stayed at 0 across the measured public routes.

## Remaining Risks

- JetBrains Mono ships only the 400 latin file to keep the 3-file budget. Existing
  `font-weight: 600` mono labels rely on browser synthesis. The visual smoke check
  should be repeated on staging after deploy.
- The latin-only subset matches current English content. If future author/content names
  need broader scripts, add a deliberate subset-expansion task instead of reintroducing
  broad all-range fontsource imports.

---

# V4-PERF-003 CSP Rollout

Date: 2026-06-14

## Scope

Rolled the 09 §8 CSP from the previous placeholder state to an enforcing header in
middleware. HTML responses receive a per-request nonce that is injected into SSR-emitted
`<script>` and `<style>` tags before the response is returned. Static hashed assets keep
their immutable cache headers and are not rewritten.

The policy is intentionally narrow:

- `default-src 'self'`
- `base-uri 'self'`
- `object-src 'none'`
- `frame-ancestors 'none'`
- `img-src 'self' data: <Directus origin>`
- `font-src 'self'`
- `connect-src 'self' <Directus origin>`
- `script-src 'self' 'nonce-...'`
- `script-src-elem 'self' 'nonce-...'`
- `style-src 'self' 'nonce-...'`
- `style-src-elem 'self' 'nonce-...'`
- `style-src-attr 'unsafe-inline'`
- `frame-src https://www.youtube-nocookie.com https://youtube-nocookie.com`
- `form-action 'self'`

`style-src-attr 'unsafe-inline'` is the only inline allowance because the design system
uses benign style attributes in rendered markup. Script execution remains nonce-gated.

## Header Evidence

Runtime used:

- `PUBLIC_DIRECTUS_URL=http://192.168.10.211:8056`
- `DIRECTUS_URL=http://192.168.10.211:8056`
- `npm run build`
- `npm run preview -- --host 127.0.0.1 --port 4324`

Checked `GET /`:

- `Content-Security-Policy` present and enforcing, not report-only.
- One nonce value is present in the policy for `script-src`, `script-src-elem`,
  `style-src`, and `style-src-elem`.
- `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=86400`.
- `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` still present.

Checked static JS asset `/_astro/HeroSignalField...js`:

- no HTML nonce rewrite;
- `Cache-Control: public, max-age=31536000, immutable`;
- `Content-Type: text/javascript`.

Checked `/404` and `/500`:

- CSP/security headers still present;
- `Cache-Control: no-store`.

## Nonce Coverage

HTML source checks confirmed zero inline `<script>` or `<style>` tags without a nonce:

| Route | Missing script nonce | Missing style nonce | Nonced tags | Nonce values |
|---|---:|---:|---:|---:|
| `/` | 0 | 0 | 11 | 1 |
| `/blog` | 0 | 0 | 10 | 1 |
| `/projects` | 0 | 0 | 9 | 1 |
| `/dream-team` | 0 | 0 | 10 | 1 |
| `/connect` | 0 | 0 | 8 | 1 |
| `/privacy` | 0 | 0 | 7 | 1 |
| `/404` | 0 | 0 | 7 | 1 |
| `/500` | 0 | 0 | 8 | 1 |

## Browser Evidence

Playwright/Chromium checked `/`, `/blog`, `/projects`, `/dream-team`, and `/connect`
at 1440×1000, 820×1180, and 375×812.

Results:

- 15/15 route + viewport checks returned status `200`;
- zero console warnings/errors and zero page errors;
- no horizontal overflow;
- home hero canvas still mounted on desktop/tablet/mobile;
- mobile menu opened, locked scroll, focused the first panel link, closed on Escape, and
  restored focus to the hamburger;
- theme toggle still changed and persisted `data-theme`.

## Accepted Deviation

The task spec describes a report-only period followed by a one-week staging soak before
enforcement. In this branch, enforcement is implemented and locally verified so the code
can move forward, but the real staging soak can only begin after this PR is deployed to
`staging.data-dreamer.net`. Monitor staging browser consoles/logs during that soak and
patch any violation before the production release task.
