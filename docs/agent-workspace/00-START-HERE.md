# 00 — START HERE: DataDreamer v4 Workspace

You are an agent working on the **DataDreamer v4 redesign**. This directory is the
complete, binding plan. It was produced from a full audit of the real codebase on
2026-06-12 (branch `feature/v4-redesign`).

## The 60-second orientation

- **What**: full redesign of data-dreamer.net — retiring the brutalist v3 look for
  "Observatory", a premium dark-first editorial-technical system; restructuring
  content (blog, projects, new Dream Team, courses); narrowing Directus to editorial
  content only.
- **Stack**: Astro 5 SSR + Directus + Coolify. No UI framework. Plain CSS tokens.
- **Releases**: v4.0 = core redesign (no auth). v4.1 = Courses + learner accounts.
- **Your rules**: `14-AGENT-INSTRUCTIONS.md` — read it before any work, every session.
- **Current state + your next task**: `15-HANDOFF.md` (top entry) + `13-TASKS.md`
  (status board).

## Reading order

| When | Read |
|---|---|
| Every session | `14-AGENT-INSTRUCTIONS.md` → `15-HANDOFF.md` → your task in `13-TASKS.md` |
| Before any UI task | `04-DESIGN-SYSTEM.md` + the page's blueprint in `05-PAGE-BLUEPRINTS.md` + `11-RESPONSIVE-ACCESSIBILITY.md` |
| Before any interactive/animated work | `07-ANIMATION-INTERACTION-SPEC.md` (pseudocode is canonical) |
| Before any data/Directus task | `08-DIRECTUS-CONTENT-MODEL.md` + `09-TECHNICAL-ARCHITECTURE.md` §4–6 |
| Before courses work (v4.1) | `docs/COURSES_PRD.md` **as amended by** `08 §4/§9` and `05 §14–18` |
| For context/why | `01-PRODUCT-VISION.md`, `02-EXISTING-SITE-AUDIT.md`, `03-INFORMATION-ARCHITECTURE.md` |

## Document map

| File | Contents |
|---|---|
| `01-PRODUCT-VISION.md` | What v4 is, audiences, success criteria, release strategy, glossary |
| `02-EXISTING-SITE-AUDIT.md` | Verified current-state: stack, routes, schema, callout system internals, debts |
| `03-INFORMATION-ARCHITECTURE.md` | Route map, redirects, nav/footer model, **content classification contract** |
| `04-DESIGN-SYSTEM.md` | "Observatory": tokens, type, color, grid, motion, logo spec, buttons, states |
| `05-PAGE-BLUEPRINTS.md` | Every page: sections, responsive layouts, states, SEO, acceptance criteria; **callout spec §3a** |
| `06-COMPONENT-ARCHITECTURE.md` | Component inventory + contracts, hydration policy, keep/refactor/replace/delete |
| `07-ANIMATION-INTERACTION-SPEC.md` | Pseudocode: hero, nav/menu focus trap, team graph, TOC, lightbox, course actions |
| `08-DIRECTUS-CONTENT-MODEL.md` | v4 schema, migrations, access policies, query contracts, PRD conflict table |
| `09-TECHNICAL-ARCHITECTURE.md` | Directory tree, deps, repositories, markdown pipeline, caching, errors, CI |
| `10-SEO-OG-METADATA.md` | Meta contract, JSON-LD matrix, OG inventory + temp/final image process |
| `11-RESPONSIVE-ACCESSIBILITY.md` | Breakpoint rationale, responsive rules, WCAG 2.2 AA contracts, QA scripts |
| `12-IMPLEMENTATION-ROADMAP.md` | Phases A→E→C, performance budgets, parallelism, rollback |
| `13-TASKS.md` | 46 task packets + status board — **the only place work is defined** |
| `14-AGENT-INSTRUCTIONS.md` | Operating rules (binding) |
| `15-HANDOFF.md` | Append-only state log — newest entry = truth about *state* |
| `assets/page-layouts/wireframes.md` | ASCII wireframes for key pages at key breakpoints |
| `assets/diagrams/directus-erd.md` | Mermaid ERD (v4.0 + v4.1) |
| `assets/diagrams/site-map.md` | Mermaid route map |
| `assets/content-models/example-records.md` | One realistic example record per collection (fixtures) |
| `assets/design-references/design-rationale.md` | Why Observatory looks the way it does; comparables; rejected directions |
| `qa/` (created during Phase D) | Completed QA checklists with evidence |

## Five rules people break first

1. Work on a `v4/<task-id>` branch off `feature/v4-redesign` — never `main`.
2. Implement only your task's scope; update the handoff when done; **stop**.
3. Tokens only (no raw hex/px); repositories only (no SDK in pages); zod at boundaries.
4. The `:::` callout back-compat contract (02 §5.5) is inviolable — goldens must pass.
5. Mobile + a11y requirements are acceptance criteria, not afterthoughts.

## Conflict resolution

Numbered docs define **intent**; `15-HANDOFF.md` defines **current state**;
`13-TASKS.md` defines **work**. COURSES_PRD remains authoritative for course
functionality except where `08 §9` amends it. If two docs disagree, file a handoff
`decision` entry rather than guessing.
