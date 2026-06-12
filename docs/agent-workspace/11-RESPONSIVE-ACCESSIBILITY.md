# 11 — Responsive Design & Accessibility

## A. Responsive system

### 1. Breakpoints and the reasoning behind each

| Token | Range | Named | Layout decision that defines it |
|---|---|---|---|
| (base) | <480 | SM small mobile | Single column everything; type at scale minimums; chips/scrollers become horizontal scroll with fade masks; stat grids 2×2 |
| `--bp-sm` 480 | 480–767 | LM large mobile | Compact post cards regain one-line meta rows; 2-up small grids (badges, avatars) |
| `--bp-md` 768 | 768–1023 | TP tablet portrait | **Nav switches** hamburger→inline links; hero canvas mounts (07 §2.8); 2-col card grids; article TOC still collapsed |
| `--bp-lg` 1024 | 1024–1279 | TL tablet landscape | Sidebars/rails appear (TOC, fact rail, course CTA rail); **team graph mounts**; asymmetric grids activate |
| `--bp-xl` 1280 | 1280–1535 | DT desktop | Full 12-col compositions, offset work grid |
| `--bp-2xl` 1536 | ≥1536 | WD wide | Nothing new appears — containers clamp, gutters grow. Deliberate: ultra-wide gets calm margins, not more columns |

Mobile-first CSS; every component's stylesheet is organized base → `min-width`
overrides in ascending order.

### 2. Cross-cutting responsive rules
- **Typography** scales via clamp tokens (04 §4.2) — no per-breakpoint font-size
  overrides except `--fs-display` hero which additionally caps at `9vw` on SM to
  prevent two-word lines breaking.
- **Touch targets** ≥44×44 CSS px on <1024px (links in prose exempt).
- **Sticky elements**: nav always; TOC/fact/CTA rails sticky only TL+; mobile course
  CTA bar sticky bottom with `padding-bottom: env(safe-area-inset-bottom)`; reading
  progress hidden <768.
- **Tables (prose)**: wrapped in `overflow-x:auto` containers with `tabindex=0` +
  `role="region" aria-label`; never reflowed into cards (data tables lose meaning).
- **Code blocks**: horizontal scroll, font 13px <768; copy button always visible on
  touch (no hover gate).
- **Images**: `sizes` attributes per slot (cards `(min-width:1024px) 33vw, (min-width:
  768px) 50vw, 100vw`; covers `(min-width:1280px) 1120px, 100vw`); art-directed crops
  not used in v4 (fixed ratios cover it).
- **Content order** changes only via CSS `order` where DOM order stays logical
  (e.g. blog row tag chips); never reorder interactive sequences.
- **Hover-dependent UI** always has a touch/focus equivalent (tooltips on focus,
  two-tap graph nodes 07 §5.4).
- **Safe areas**: `viewport-fit=cover` + env() padding on fixed bars only.
- Per-page specifics live in each blueprint (05) — blueprints are the source of truth
  for layout collapse; this doc defines the shared system.

### 3. Responsive QA matrix (executed in V4-QA-001)
360×640, 390×844, 480, 768×1024 (+landscape), 1024×768, 1280×800, 1440×900, 1920×1080;
each in dark + light; pages: home, blog, article (longest real post), case study,
team, author, connect, 404 (+ courses set in v4.1). Zero horizontal scroll anywhere;
all interactive elements reachable.

## B. Accessibility (WCAG 2.2 AA practices)

### 1. Structure & navigation
- Landmarks: one `<header>`, `<nav aria-label="Site">`, `<main id="main">`,
  `<footer>`; secondary navs labeled (Topics, Table of contents, Breadcrumbs).
- Skip link: first focusable, visible on focus, targets `#main`.
- Headings: exactly one h1/page; no skipped levels; section kickers are NOT headings
  (they're `<p class="kicker">`).
- Focus: global `:focus-visible` ring (04 §10) — never `outline: none` without
  replacement; focus order follows DOM; mobile menu trap per 07 §3.3; dialogs use
  `<dialog>.showModal()` native trapping; after dialog close, focus returns to opener.
- Keyboard: every flow completable — menu, theme, filters (links/buttons), graph
  (real links + arrows), lightbox, copy buttons, (v4.1) enroll/complete/forms.
- Target size: ≥24×24 minimum everywhere (2.2 AA), ≥44 on touch breakpoints.

### 2. Color & contrast
- All text tokens AA-verified in both themes at intended sizes (checked in V4-DS-001
  with a documented contrast table in the PR): `--text-3` only ≥14px mono or ≥18px.
- State never by color alone: selected chips get check icon; callouts have icons +
  labels; graph dimming pairs with `aria-pressed` filter state; form errors icon+text;
  links in prose underlined.
- Focus ring color distinct from accent (04 §3.1) for visibility on accent elements.

### 3. Motion & animation
- Single `prefers-reduced-motion` media query in tokens zeroes durations; reveal
  utility and hero/graph scripts check it independently (07 §1, §2, §5).
- No autoplaying video; no flashing content; hero idle motion subtle and pausable
  (off-screen pause is automatic).

### 4. Media & SVG
- CMS-required alt text: `directus_files.description` used as alt; pipeline falls back
  to empty alt + `role="presentation"` ONLY for decorative figures; authoring guide
  requires real alt in markdown (lint warning in golden tests for empty alts).
- Decorative SVGs (hero static field, dividers): `aria-hidden="true"`.
- Meaningful SVGs (logo, graph): `role="img"`/`role="group"` + labels (04 §9.3, 07 §5.3).
- Video embeds (v4.1): iframe `title="{lesson title} — video"`; facade play button
  labeled.

### 5. Components with explicit a11y contracts
| Component | Contract |
|---|---|
| Callouts | `<aside role="note" aria-label="{Type}: {Title}">` (05 §3a) |
| Expandable | native `<details>/<summary>`; summary is a real button semantically — no extra ARIA |
| TOC | `<nav aria-label="Table of contents">`, active = `aria-current="location"` |
| Reading progress | decorative; `aria-hidden="true"` (scroll position is the SR equivalent) |
| Lightbox | `<dialog aria-label="Image viewer">`, counter `aria-live="polite"`, alt before src |
| Filters/chips | links with `aria-current` (SSR filters) or buttons with `aria-pressed` (graph legend) |
| Theme toggle | dynamic `aria-label`, announces via label change |
| Graph | full non-graph equivalent list on ALL breakpoints (05 §7); SVG group labeled; nodes = named links |
| Progress bars (v4.1) | `role="progressbar"` + `aria-valuenow/min/max` + visible "X of N" text |
| Forms (v4.1) | label-for everything; errors `aria-describedby` + summary `role="alert"` focus target; `autocomplete` attrs; no placeholder-as-label |
| Toasts/announcements | one shared visually-hidden `aria-live="polite"` region (copy code, copied email); `assertive` reserved for form failures |

### 6. Screen-reader QA script (V4-QA-003)
VoiceOver/Safari + NVDA/Firefox passes: navigate home by landmarks/headings; open
mobile menu (focus enters, Escape returns); read an article incl. callouts, code copy,
TOC jump; team page via list; author page; (v4.1) full signup→enroll→complete→badge
flow. Findings logged as tasks before release.
