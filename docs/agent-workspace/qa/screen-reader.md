# V4-QA-003 Screen-Reader Pass

Date: 2026-06-13

## Scope

Executed the 11 §B screen-reader and keyboard contract pass against the Phase B v4
shell and content pages.

Primary target:

- temporary staging-backed local server at `http://127.0.0.1:4323`;
- env only: `PUBLIC_DIRECTUS_URL=http://192.168.10.211:8056`,
  `DIRECTUS_URL=http://192.168.10.211:8056`;
- repo `.env` was not changed.

## Method

This pass used browser DOM, keyboard, and focus-state automation. Native VoiceOver and
NVDA application passes were not run from this macOS automation environment; NVDA is
not available here. The checks below cover the same page contracts in rendered DOM and
keyboard behavior, and the native screen-reader smoke pass should be repeated manually
before production release.

## Page Matrix

| Page | Path | Result |
|---|---|---|
| Home | `/` | Pass |
| Blog landing | `/blog` | Pass, empty-state path |
| Project index | `/projects` | Pass after inline heading fix |
| Dream Team populated state | `/dream-team` | Pass |
| Author detail | `/dream-team/atef-alvi` | Pass |
| Connect | `/connect` | Pass |
| Privacy | `/privacy` | Pass |
| 404 | `/404` | Pass after global header landmark fix |
| Prose fixture | `/dev/styleguide-prose` | Pass for prose semantics; dev route is not shell-wrapped |

For production routes, the automated audit verified:

- banner/header, primary navigation, `main#main`, and footer landmarks;
- skip link is the first focusable control and targets `#main`;
- exactly one `h1`;
- no skipped heading levels;
- no visible unnamed buttons or links;
- no focusable controls under `aria-hidden="true"`;
- no duplicate IDs.

## Keyboard / Focus Checks

| Flow | Evidence | Result |
|---|---|---|
| Mobile menu open | hamburger `aria-expanded=true`, panel unhidden, body `overflow=hidden`, body `touch-action=none` | Pass |
| Mobile menu focus entry | active element became first panel link: `01 Projects` | Pass |
| Mobile menu trap contract | panel has 7 focusable controls; trap now cycles panel controls only | Pass |
| Mobile menu Escape | `aria-expanded=false`, panel `hidden=true`, body lock removed, focus restored to `#menuButton` | Pass |
| Mobile theme toggle | one visible theme toggle on mobile; no duplicate mobile controls | Pass |

## Component Semantics

| Component / Surface | Evidence | Result |
|---|---|---|
| Callouts | 8 rendered notes with labels: Note, Reference, Pro tip, Hardware alert, Destructive operation, Read this first, Worked example, Deep dive | Pass |
| Details | native `details > summary` controls present | Pass |
| Code copy | copy button and polite live-region pattern present | Pass |
| Tables | table scroll region is keyboard focusable | Pass |
| Image grid | image controls expose descriptive open-image labels | Pass |
| Reading progress | decorative only; removed conflicting `role="progressbar"` from `aria-hidden` element | Pass |
| Dream Team graph | graph exposes `role="group"` with equivalent-list label | Pass |
| Dream Team graph links | SVG author links have author/role labels; equivalent author list contains the same hrefs | Pass |
| Dream Team filters | specialty filter chips expose `aria-pressed` | Pass |
| Connect copy | email copy has one button and one polite live region | Pass |

## Findings Fixed Inline

### Global shell lacked a guaranteed header landmark

`BaseLayout` rendered the primary nav as a top-level `nav` without a banner
`header`. Pages with their own hero headers still exposed a header element, but routes
like 404 could miss the global header landmark. The shell now wraps `SiteNav` in
`<header>`.

### Project index skipped from `h1` to card `h3`s

The project index had no section heading before its case-study card titles, causing a
document outline jump from `h1` to `h3`. Added a visually hidden `h2` labelled
`Project case studies` around the results grid.

### Reading progress had contradictory ARIA

`ReadingProgress` was `aria-hidden="true"` and `role="progressbar"`. The progress
indicator is decorative per 11 §B6, so the role was removed.

### Mobile menu focus trap included the hamburger in the trapped order

The hamburger is the restore/close target, not panel content. The focus trap now wraps
through panel links/actions only while Escape still restores focus to the hamburger.

## Remaining Risks

- Native VoiceOver/Safari and NVDA/Firefox passes still need manual execution before
  production release.
- Article-detail checks for real TOC, related content, and lightbox behavior remain
  content-blocked because staging/local currently have zero published posts. Prose
  semantics were covered through `/dev/styleguide-prose`, and unknown article slugs
  correctly return 404.
- The prose fixture is intentionally a dev route and is not expected to have the full
  production shell landmarks.
