# Design Rationale — why "Observatory" looks the way it does

Companion to `04-DESIGN-SYSTEM.md`. This explains the reasoning so future agents can
make in-spirit decisions when a spec is silent.

## 1. The brief's tension, and how we resolve it

"Premium studio" and "technically credible" usually pull in opposite directions:
studio sites trend decorative; technical sites trend austere. Observatory resolves it
by assigning each instinct a layer:

- **Editorial layer** (serif display, whitespace, asymmetric grid) carries the
  premium signal.
- **Instrument layer** (mono metadata, hairlines, restrained accent, data-true
  details like reading time and counts) carries the technical signal.
- **One living moment** (hero field; graph on the team page) proves craft without
  spreading animation everywhere.

## 2. Comparable quality bars (study, do not copy)

- Stripe Press — editorial typography discipline, restraint with one accent.
- Linear — dark-surface hierarchy, border-driven elevation, motion economy.
- Vercel/Geist docs — mono-as-metadata, token rigor.
- Pudding/Quanta article pages — TOC, figures, reading rhythm.
- Obys / studio portfolios — asymmetric grids, kicker patterns (we take composition
  ideas, not their JS-heavy transitions).

## 3. Rejected directions (and why)

| Direction | Why rejected |
|---|---|
| Brutalism 2.0 (refine v3) | Brief retires it; ALL-CAPS + alarm red caps readability and warmth |
| Glassmorphism/dashboard aesthetic | Reads as product UI, not publication; ages fast |
| Light-first paper magazine | Beautiful but loses the technical-night identity and v3 continuity; kept as the secondary theme instead |
| Maximal-motion showcase (GSAP scenes, scroll-jacking) | Violates perf/a11y budgets; "over-animated showcase" is an explicit anti-goal |
| Tailwind + shadcn look | The "generic AI site" the brief forbids; bespoke tokens are the differentiator |

## 4. Specific choices, defended

- **The existing logo stays** (owner decision, 2026-06-12): the nested-square "D"
  with the red dot is the brand. Million-dollar studio work doesn't mean a new mark —
  it means treating the one you have like an asset: vectorized Anton wordmark (no
  font cost), token-driven ink, disciplined clear space, and the mark's three ideas
  (pixel, data, connection) promoted to site-wide motifs (04 §1.4). The contrast
  between the refined serif/sans system and one bold industrial lockup *is* the
  signature.
- **Fraunces** for display: a serif with optical sizing and genuine character that
  still feels contemporary; instantly separates DataDreamer from Inter-only dev sites.
  Used scarcely (H1/H2/pull quotes/stat numerals) so it stays special.
- **Inter** for text: invisible excellence; the body must disappear into reading.
- **JetBrains Mono kept**: the one thread of v3 DNA; it carries "data" texture in
  kickers/meta and is already the code face.
- **Ember `#FF5C38`**: keeps brand recognition from `#FF2E00` while dropping the
  alarm quality; darkened variant on light theme for AA.
- **Dark-first**: audience habit (devs), continuity, and the hero/graph render best
  on dark fields. Light theme is a true paper palette, not inverted dark.
- **Radius 6–16px**: the single clearest "the brutalist era ended" signal, kept
  modest so the site doesn't read as a consumer app.
- **No page transitions in v4.0**: SSR full loads are fast and robust; transition
  polish is the first thing to break a11y/back-button expectations. Revisit later.
- **SVG graph, no physics**: determinism = trust (people find themselves in the same
  place every visit), SSR = works without JS, and the team is small. A force sim is
  demo-ware at this scale.
- **Server-rendered filters** (blog/projects/courses): URLs become shareable state,
  crawlers see every facet, and we delete two divergent client filter scripts from v3.

## 5. Voice examples (apply across UI copy)

| v3 (retired) | v4 |
|---|---|
| `// TERMINAL OUTPUT — DEV LOG` | `From the blog` |
| `INITIATE CONTACT SEQUENCE_` | `Let's talk` |
| `// NO LOGS FOUND — SYSTEM IDLE` | `Nothing here yet — new writing is on the way.` |
| `READY TO PROCESS DATA?` | `Have a data problem worth solving?` |

## 6. When the spec is silent

Prefer: fewer elements; text over ornament; a hairline over a box; one accent use per
component; the calmer motion option; the semantic HTML element. If a choice would make
the site feel like "a template", it is wrong here.
