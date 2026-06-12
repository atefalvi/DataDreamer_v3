# 15 — Handoff Log

Newest entry first. Every agent appends an entry when finishing, blocking, or making
a decision. Keep entries factual and short; link docs instead of repeating them.

## Entry template

```
## [YYYY-MM-DD] <agent/task id> — <status: done | in progress | blocked | decision>
**Did**: …
**Files**: …
**Decisions / deviations**: … (with doc refs updated)
**Validation**: astro check / tests / build results, evidence links
**Next**: what the next agent should pick up
**Warnings**: …
```

---

## [2026-06-12] Planning session — done (planning only; no implementation)

**Did**: Full repository audit (every source file, docs, schema snapshot, COURSES_PRD,
reference/ design docs) and authored the complete v4 planning workspace:
documents `00`–`15` plus `assets/` (wireframes, ERD, site map, example records,
design rationale). No production code was changed.

**Files**: `docs/agent-workspace/**` (all new). Nothing else touched.

**Key decisions made** (rationale in the docs):
1. Design direction "Observatory" — dark-first editorial-technical system; Fraunces /
   Inter / JetBrains Mono; ember `#FF5C38` accent; radius + hairline borders; brutalist
   system fully retired (04).
2. Two-release plan: v4.0 core redesign, v4.1 courses + auth (01 §7, 12).
3. `/logs` → `/blog` with 301s; physical Directus collection stays `logs` (08 §2.1).
4. Directus scope narrowed to editorial/relational/user content; `site_settings`,
   `home_settings`, `about`, `projects` leave Directus (03 §3, 08 §1). Projects become
   an Astro content collection (V4-CMS-005).
5. New `authors` (Dream Team), `specialties`, shared `topics` taxonomy (also replaces
   COURSES_PRD `course_tags`) (08).
6. Callout system preserved + upgraded: same `:::` syntax, proper remark plugin,
   markdown-inside-blocks fixed, 8 variants, aside/role=note semantics, golden-file
   back-compat tests (05 §3a, 09 §6).
7. Hero = "Signal Field" canvas, ≤8KB hand-rolled, static SVG below 768px /
   reduced-motion (07 §2). Dream Team graph = SSR SVG with deterministic layout, list
   fallback on all breakpoints, no graph library (07 §5).
8. No new heavy deps: zod, fontsource, lucide-static, vitest only (09 §1).
9. Frontend admin-credential login to Directus is retired (08 §5).

**Open items needing the owner's input (not blockers for Phase A)**:
- Final homepage H1 copy approval (placeholder locked in 05 §1).
- Final OG artwork (temporary generated set unblocks everything — 10 §5).
- Author headshots ≥512px + bios for every Dream Team member before V4-DT-002 QA.
- Approval of ember accent + Fraunces pairing from the styleguide page (V4-DS-001
  produces the review artifact).
- Coolify access for V4-FND-003 (staging resource).

**Validation**: n/a (documentation only). Workspace cross-references checked for
consistency (routes, task IDs, token names, callout variants, breakpoints).

**Next**: First implementation task is **V4-FND-001 — Tooling & CI baseline**
(13-TASKS.md). Read 14-AGENT-INSTRUCTIONS.md §1 first. V4-FND-002 and V4-CMS-001 are
safe to run in parallel with it (different files/systems).

**Warnings**: Do not begin implementation until the owner has reviewed and approved
this workspace. The working tree contains these docs uncommitted — committing them to
`feature/v4-redesign` should be the first action after approval.
