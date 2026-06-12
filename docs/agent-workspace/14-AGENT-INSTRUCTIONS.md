# 14 — Agent Operating Instructions

Binding rules for every coding agent working on DataDreamer v4. Read this before
touching anything.

## 1. Session startup ritual (every session, in order)

1. Read `00-START-HERE.md`.
2. Read `15-HANDOFF.md` — top entry tells you the current state and the next task.
3. Read your assigned task in `13-TASKS.md` (the full spec section, not just the board)
   and every doc its spec references.
4. `git status` + `git branch --show-current` — you must be on a task branch cut from
   `feature/v4-redesign` (`v4/<task-id-lowercase>`, e.g. `v4/v4-blog-002`), working
   tree clean before you start. Never commit to `main` or `staging`. If the tree is
   dirty with someone else's changes, stop and record it in the handoff.
5. Inspect the existing code you're about to change — read files before editing them.
6. Set your task's Status to `in progress` in `13-TASKS.md` (commit this with your work).

## 2. While working

- **Implement only the assigned scope.** Adjacent problems → note in handoff
  ("observed, not fixed"), or file a new task row; do not fix drive-by.
- Follow the docs. If reality forces a deviation (API limitation, wrong assumption in
  a blueprint), make the smallest correct choice, then update the affected workspace
  doc **in the same PR** with a `> Deviation (TASK-ID):` note.
- Code standards (binding):
  - Tokens only — no raw hex/magic px (04 §3, §14). No unexplained animation values —
    use motion tokens (04 §12).
  - TypeScript types for all props/data; no `any` outside the documented SDK-fields
    exception inside repositories.
  - All Directus access via `lib/repositories/` (09 §4). Validate external data with
    zod at the boundary.
  - Components small and focused; pages compose, they don't implement. No function
    >~60 lines without a reason stated in a comment.
  - No new dependencies beyond 09 §1 without a handoff "decision needed" entry and
    explicit approval.
  - Semantic HTML first; the a11y contracts in 11 §B5 are not optional.
  - Comments explain *why*, only where non-obvious. No narration comments.
  - Never weaken the callout back-compat contract (02 §5.5). Golden tests are the gate.
  - Never move content across the Directus/repo boundary (03 §3) without a decision
    entry.
  - Never expose secrets: no tokens in client code, no `PUBLIC_` prefix on server
    secrets, no secrets in workspace docs or commits.
- Mobile + accessibility requirements are acceptance criteria, not polish. A task
  that ignores them is incomplete.

## 3. Finishing a task (definition of done from 13 — expanded)

1. Run: `cd frontend && npx astro check && npm test && npm run build`.
2. Review your own diff hunk-by-hunk (`git diff`). Remove debug code, stray files.
3. Verify acceptance criteria one by one; capture evidence where the task asks
   (screenshots → PR description; checklists → `docs/agent-workspace/qa/`).
4. Update docs you invalidated; update `13-TASKS.md` status (`done`).
5. Append a `15-HANDOFF.md` entry (template in that file): what changed, file list,
   decisions/deviations, validation results, what the next agent should do, any
   warnings.
6. Commit with message `feat(v4): <task-id> <short title>` (or `fix/chore/docs`),
   open PR into `feature/v4-redesign`.
7. **Stop.** Do not start the next task in the same session unless explicitly told to.

## 4. Hard prohibitions

- Never work directly on `main` (or any production branch).
- Never declare a task complete without running the validation commands.
- Never silently change architecture, schema, routes, tokens, or dependencies.
- Never create planning/design documents outside `docs/agent-workspace/`.
- Never replace a working system without the task saying so and the handoff
  documenting why.
- Never run destructive Directus/database operations without a fresh backup and a
  written inverse operation (08 §10). Never drop collections outside V4-CMS-006.
- Never remove or bypass: custom callout compatibility, reduced-motion paths, focus
  management, the repository layer, or the no-JS fallbacks (hero static, graph list).
- Never put static marketing content into Directus, or editorial content into the
  repo, without a boundary-contract update (03 §3).
- Never let Directus admin credentials reappear in frontend env/code (08 §5).

## 5. When blocked

Write a handoff entry with status `blocked`, the exact blocker, what you tried, and
the smallest decision needed. Set task status `blocked` in 13. Do not improvise
around schema, auth, or release steps.

## 6. Multi-agent etiquette

Before starting, scan handoff "in progress" entries; never pick a task whose files
overlap an in-progress one (roadmap "‖" marks safe pairs). If you find the workspace
docs and code disagree, the handoff log is the tiebreaker for *state*; the numbered
docs are the tiebreaker for *intent*.
