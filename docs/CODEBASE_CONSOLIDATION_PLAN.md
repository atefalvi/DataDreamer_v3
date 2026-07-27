# Frontend consolidation plan

## Execution record — July 27, 2026

The consolidation described below is complete. The implementation now has one clear
owner for the repeated collection patterns:

| Concern | Shared owner | Domain adapters |
| --- | --- | --- |
| Featured collection lead | `CollectionFeature.astro` | `PostCard`, `CaseCard`, `GuideCardFeatured` |
| Archive heading, view controls, grid, and pagination | `CollectionArchive.astro` | Posts, Projects, and Guides index pages |
| Editorial/grid/list card frame | `EditorialCardFrame.astro` | `PostCard`, `CaseCard`, `GuideCard` |
| Page parsing and nine-item pagination | `lib/collections/pagination.ts` | Path-based Posts and query-based Projects/Guides |
| Query URLs, search normalization, redirects | `lib/collections/query.ts` | Projects and Guides index pages |

Post and Project detail heroes were compared but intentionally not combined: their
metadata, content width, and responsive structure are different. The Guide reader
also remains separate because authentication, progress, and locked-resource behavior
give it a distinct purpose. This follows the extraction guardrail rather than creating
a large conditional shell.

The permanent development preview at `/dev/editorial-collections-preview` exercises
a featured item plus a nine-card archive for each content type, including missing
covers and all three viewing modes. It is linked from `SETUP.md` and is not shipped in
production.

This is a deliberately incremental plan for making the frontend smaller and more
consistent without turning the work into a risky rewrite. Each phase should ship on
its own, preserve the current design, and leave the production site in a complete
state.

## Guardrails

- Extract a pattern only when it appears in at least three places with the same
  purpose. Similar-looking elements with different behavior should remain separate.
- Keep content-specific components (`PostCard`, `CaseCard`, and `GuideCard`) as thin
  adapters rather than building one component with a large union of unrelated props.
- Preserve the current editorial hierarchy, light/dark themes, responsive behavior,
  accessibility semantics, URLs, filters, and nine-card pagination contract.
- Migrate one surface at a time. Do not combine a visual redesign with structural
  refactoring.
- Delete the former implementation only after every caller uses the replacement.

## Required baseline before each phase

1. Start from a clean, passing branch.
2. Capture desktop and mobile references in light and dark mode for Posts, Projects,
   and Guides. Include empty, featured, filtered, and multi-page states.
3. Run `npm run check`, `npm test`, and `npm run build` from `frontend/`.
4. Record the affected routes and component imports before editing.

## Phase 1 — Shared featured collection module

The featured area is the best first extraction because it appears in all three index
pages with the same editorial intent.

Create a shared `CollectionFeature.astro` shell in `components/ui/` with a small,
slot-based API:

- `meta` slot for year, date, difficulty, topics, or status;
- `title` and `href` props;
- optional `byline` slot;
- `summary` slot;
- optional `media` slot using the existing cover/placeholder treatment;
- consistent heading level, focus state, spacing, image ratio, and mobile stacking.

Keep `PostCard`, `CaseCard`, and `GuideCardFeatured` responsible for translating their
own data into those slots. Migrate the development collection preview first, then
Projects, Posts, and Guides individually. Delete duplicated feature-layout CSS only
after all three match the reference captures.

## Phase 2 — Shared archive section frame

Extract the repeated results heading, item count, view toggle, grid/list container,
and pagination placement into `CollectionArchive.astro`. The component should accept
slots for cards and labels rather than understand post, project, or guide data.

Keep search and filter controls outside this component: their semantics and URL
contracts differ enough that combining them would create a harder abstraction.

Success criteria:

- nine cards on every archive page;
- three columns on wide desktop, two on tablet, one on mobile;
- the editorial/list preference continues to work;
- featured items never repeat in the archive;
- a single shared pagination component remains in use.

## Phase 3 — Card-frame convergence

Audit `PostCard`, `CaseCard`, and `GuideCard` for repeated structure: cover frame,
placeholder artwork, metadata row, title link, summary clamp, author row, and hover or
focus treatment. Extract only the repeated visual frame into a slot-based
`EditorialCardFrame.astro`.

Retain content-specific metadata and accessibility labels in the adapters. Avoid a
single component with optional props for every possible field.

## Phase 4 — Collection query and URL helpers

Consolidate stable, non-visual behavior:

- positive page-number parsing and canonical redirects;
- normalized search input;
- query-string preservation and page reset after a filter changes;
- shared nine-item page-size constant and in-memory pagination helper;
- consistent previous/next metadata.

Posts use path-based pagination while Projects and Guides use query parameters, so
share parsing primitives rather than forcing all three into one routing model.

## Phase 5 — Detail-page editorial shells

Compare Post and Project detail heroes, cover overlays, metadata sidebars, related
content sections, and prose widths. Extract a shared `EditorialDetailHero.astro` only
where the structure and responsive behavior are genuinely identical.

Treat the Guide reader separately because authentication, progress, locked content,
and resume behavior give it a different purpose.

## Phase 6 — CSS and token reduction

After component migration, identify declarations repeated three or more times and
move only stable values into semantic tokens or shared component styles. Priorities:

- collection vertical rhythm;
- cover aspect ratios and overlays;
- metadata typography;
- card borders, radii, focus rings, and transitions;
- results-grid breakpoints.

Remove old selectors in the same change that removes their last markup reference.
Do not create tokens for one-off values.

## Phase 7 — Repository and documentation hygiene

Run a bounded cleanup after every two phases:

- locate unreferenced assets and components with `rg` and confirm they are absent from
  runtime loaders before deletion;
- keep Markdown fixtures referenced by renderer tests;
- keep production runbooks even when they are not imported by code;
- ensure every current runbook and development preview is linked from `README.md` or
  `SETUP.md`;
- remove temporary preview routes once their replacement is covered by the permanent
  style guide.

## Verification for every phase

- `npm run check`
- `npm test`
- `npm run build`
- desktop and mobile review in light and dark mode
- keyboard focus and reduced-motion check
- featured, unfeatured, missing-cover, empty, filtered, and second-page states
- no broken canonical, previous, or next links

The goal is not the fewest possible files. The goal is one clear owner for every
repeated behavior while keeping domain-specific code easy to understand.
