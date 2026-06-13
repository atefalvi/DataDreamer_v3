# Homepage Redesign Plan

## Current issues found

- The homepage is structurally correct but visually underpowered: hero, writing, and team areas read as functional blocks rather than a premium editorial/data studio.
- The header uses the full lockup everywhere, which becomes weak on mobile. The desktop nav has improved spacing in the current branch, but the brand treatment still needs a more deliberate responsive system.
- The mobile menu already has the duplicate theme toggle removed in the current branch; it still needs a more polished panel composition and stronger active/hover states.
- The hero animation uses drifting pixels and embers, but the motion still feels like generic particles rather than an authored Data Dreamer signal system.
- The homepage sparse states are too plain. Latest writing and Dream Team need to feel designed even when Directus has little or no content.
- Buttons have begun moving in the right direction, but CTAs need sharper hierarchy and a more editorial, tactile finish.

## Proposed visual direction

Create a dark-first premium editorial-tech homepage: quiet, atmospheric, intelligent, and precise. The visual language should feel like signal cartography rather than AI clip art: measured grids, orbit paths, indexed coordinates, glow used sparingly, and confident typography.

The homepage will use a stronger composition:

- A full-viewport hero with an editorial label rail, a more forceful H1, concise supporting copy, and a designed “data atlas” motion field.
- A desktop header with a larger lockup, refined spacing, restrained glass treatment, and active states that feel deliberate.
- A mobile header that uses the recognizable mark instead of forcing the full wordmark.
- Content sections with richer framing, better section introductions, and premium empty states.

## Components/files to change

- `frontend/src/components/global/SiteNav.astro`: responsive mark/lockup treatment, spacing, active states, premium surface.
- `frontend/src/components/global/MobileMenu.astro`: cleaner editorial overlay and no duplicate theme toggle.
- `frontend/src/components/home/HeroSignalField.astro`: replace jittery particle feel with a smooth branded signal atlas.
- `frontend/src/pages/index.astro`: redesign section composition for writing and Dream Team.
- `frontend/src/components/ui/Button.astro`: refine CTA styling.
- `frontend/src/components/ui/EmptyState.astro`: make sparse content feel intentional.
- `frontend/src/content/site.ts`: tighten hero copy if needed.

## Animation approach

Use a deterministic “signal atlas” canvas on tablet/desktop only when `prefers-reduced-motion: no-preference`.

- Draw a slow field of horizontal and vertical data lines, a few orbital paths, and rare signal sweeps.
- Use low point counts, transforms/opacity/canvas drawing only, no layout reads per frame.
- Keep mobile and reduced-motion on a polished static SVG/CSS composition.
- Avoid chaotic particles, random jitter, and high-frequency motion.

## Mobile nav fix

- Keep a single theme toggle in the top nav.
- Do not render another theme toggle inside the mobile menu.
- Use the existing logo mark on mobile for clarity and brand recognition.
- Make the mobile panel feel like an editorial index: large links, subtle dividers, social links, and a single Connect action.

## Risks

- Over-designing the hero could hurt performance; mitigate with a small canvas system, motion guard, and static fallback.
- Mobile mark-only branding must remain recognizable; use the existing approved logo mark rather than inventing a new symbol.
- Current v4 routes are still mid-migration; do not break existing links or repository calls.
- Sparse CMS content can make the page feel empty; design the empty states as intentional editorial placeholders.

## Second pass audit

- The current atlas canvas only runs on tablet/desktop and has no pointer or touch response, so it reads as a nice background rather than a signature Data Dreamer moment.
- Mobile currently falls back to a static SVG field. That protects performance, but it leaves the most important viewport feeling less alive than the desktop composition.
- The second homepage section uses three equal columns inside a narrow right column; long words and larger headings create cramped cards and broken rhythm.
- Header and footer branding are not one system: the header uses the approved mark plus live wordmark, while the footer still renders the older full lockup SVG.

## Second pass direction

- Replace the atlas with a reactive signal field: deterministic graph nodes, data pixels, edge pulses, soft wavefronts, and pointer/touch influence. The motion should feel like a living data system waking up around the reader rather than generic particles.
- Use a separate mobile composition inside the same canvas system: fewer nodes, lower DPR cap, more vertical signal paths, autonomous pulses, and touch-triggered ripples without requiring hover.
- Redesign section two as an editorial studio breakdown with wide service rows, measured metadata, generous padding, and controlled line lengths instead of three cramped feature cards.
- Unify brand usage by using the same logo mark and live stacked wordmark treatment in the footer, with scale and spacing tuned for footer context.

## Second pass files

- `frontend/src/components/home/HeroSignalField.astro`: new responsive reactive canvas and improved static fallback.
- `frontend/src/pages/index.astro`: section-two markup and CSS redesign.
- `frontend/src/components/global/SiteFooter.astro`: replace older lockup SVG with the same mark-plus-wordmark system as the header.
