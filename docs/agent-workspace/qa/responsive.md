# V4-QA-001 Responsive Matrix

Date: 2026-06-13

## Scope

Executed the 11 §A3 responsive matrix against the Phase B v4 shell and pages.

Viewports:

| Token | Size |
|---|---:|
| SM | 360×640 |
| SM | 390×844 |
| LM | 480×800 |
| TP | 768×1024 |
| TL | 1024×768 |
| DT | 1280×800 |
| DT | 1440×900 |
| WD | 1920×1080 |

Themes: dark and light.

## Pages Checked

Primary local dev server (`http://127.0.0.1:4321`):

| Page | Path | Result |
|---|---|---|
| Home | `/` | Pass |
| Blog landing | `/blog` | Pass, empty-state path |
| Project index | `/projects` | Pass |
| Case study | `/projects/tableau-waterfall-chart` | Pass after inline fix |
| Dream Team | `/dream-team` | Pass, empty-state path |
| Connect | `/connect` | Pass |
| Privacy | `/privacy` | Pass |
| 404 | `/not-a-real-responsive-route` | Pass |

Temporary staging-backed local server (`http://127.0.0.1:4323`, env only; repo files
unchanged):

| Page | Path | Result |
|---|---|---|
| Dream Team populated state | `/dream-team` | Pass |
| Author detail | `/dream-team/atef-alvi` | Pass |

Article detail was not executable because staging/local data currently has zero
published posts. The staging-backed server verified unknown blog and topic slugs return
404 (`/blog/test`, `/blog/topic/nope`), but no real article URL exists to inspect.

## Automated Checks

For each route/theme/viewport combination:

- exactly one `h1`;
- primary nav, `main#main`, and footer present;
- theme toggle can set dark/light;
- no horizontal overflow;
- no references to retired v3 assets (`/logo.svg`, `/masks/*`, old JPG OG images);
- no console errors.

Evidence:

| Matrix | Checks | Failures | Console errors |
|---|---:|---:|---:|
| Core renderable routes | 128 | 0 | 0 |
| Author detail | 16 | 0 | 0 |
| Populated Dream Team | 16 | 0 | 0 |

Populated Dream Team graph behavior matched the blueprint: graph hidden below 1024px,
author list present at every breakpoint, graph visible from 1024×768 upward.

## Manual / Interaction Spot Checks

- Mobile menu at 390×844 opens from the hamburger button.
- Focus moves into the menu on open.
- `Escape` closes the menu, removes scroll lock, and returns focus to the menu button.
- Theme switching persisted across page navigations during the matrix.

## Findings Fixed Inline

### Case study horizontal overflow on SM

The case-study content grid used the default grid track sizing, so the prose/code block
min-content width forced the single-column layout wider than the viewport at 360px and
390px.

Fix:

- set `.case__layout { grid-template-columns: minmax(0, 1fr); }`;
- set `.case__body, .case__rail { min-width: 0; }`.

Post-fix evidence:

| Page | Viewport | Theme | Result |
|---|---|---|---|
| Case study | 360×640 | dark | no overflow |
| Case study | 360×640 | light | no overflow |
| Case study | 390×844 | dark | no overflow |
| Case study | 390×844 | light | no overflow |

## Remaining Risks

- Article detail still needs a visual responsive pass once at least one published post is
  seeded in staging. This is content availability, not a known frontend defect.
- Current local `.env` points at `localhost:8055`, which was not running during this pass;
  staging-backed checks were done with temporary process env vars only.
