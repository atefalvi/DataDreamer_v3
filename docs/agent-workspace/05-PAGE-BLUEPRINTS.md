# 05 — Page Blueprints

Every v4 page, specified to build-without-guessing depth. Shared conventions first;
each blueprint then covers: purpose, users, actions, section order, responsive layouts,
behavior, data, components, motion, loading/empty/error, SEO/OG, a11y, acceptance
criteria, risks, and a component tree. ASCII wireframes for key pages live in
`assets/page-layouts/wireframes.md`.

**Breakpoint shorthand** (from 04 §5.4): SM <480 (small mobile), LM 480–767 (large
mobile), TP 768–1023 (tablet portrait), TL 1024–1279 (tablet landscape), DT 1280–1535,
WD ≥1536 (wide — content clamps at container widths; only gutters grow).

**Universal rules** (apply to every page; not repeated below):
- Shell: sticky glass nav (07 §3), footer (03 §2), skip link, `<main id="main">`.
- All sections use the kicker pattern (04 §13) and `data-reveal` motion (04 §12).
- Loading: pages are SSR — no client loading states for initial content. "Loading"
  rows below refer to in-page async actions only.
- Error: any repository call that throws renders the page with that section's error
  state (`ui/ErrorState`), never a blank section, never a 500 for partial data. A
  failed *primary* fetch (e.g. post by slug) renders 404 or 500 page as appropriate.
- SEO: every page sets title/description/canonical/OG per `10-SEO-OG-METADATA.md`.
- A11y: heading order strict (one h1), focus management per 11; touch targets ≥44px.

---

## 1. Home `/`

- **Purpose**: state what DataDreamer is in one viewport; route visitors to blog,
  work, courses, team. **Primary user**: first-time practitioner/client.
  **Primary action**: open the latest post. **Secondary**: explore work / courses.
- **Section order**:
  1. **Hero** — "Signal Field" animated canvas (full spec + pseudocode: 07 §2).
     Content: kicker `Data · Analytics · AI`, H1 (2 lines, Fraunces, `--fs-display`):
     "Field notes from the future of data." (copy locked in `src/content/site.ts`;
     wording final unless owner edits), sub (≤2 sentences): "DataDreamer is an
     independent publication and learning platform — practical writing, courses, and
     case studies from working engineers." CTAs: primary "Read the blog" → `/blog`;
     secondary "Explore courses" → `/courses` (v4.0: secondary is "See the work" →
     `/projects` until courses ship — flag `COURSES_ENABLED` in site.ts).
  2. **Latest writing** — kicker "From the blog" + 3 latest posts: 1 featured
     `PostCardFeatured` (cover image 16/10, title, excerpt, author chip, date, topic)
     + 2 compact `PostCard` rows. "All posts →" ghost button.
  3. **Selected work** — 2 `ProjectCard`s (featured flag from content collection
     frontmatter) on an asymmetric grid (cols 1–6 / 7–12, second card offset
     `margin-top: var(--space-8)` on TL+). "All work →".
  4. **Courses teaser** (v4.1; hidden by flag) — single tinted band (`--bg-1`):
     kicker "Learn", 3 `CourseCard`s, "Browse courses →".
  5. **Dream Team strip** — kicker "The Dream Team", overlapping avatar row (max 8) +
     one line: "Writing and courses from N practitioners across M specialties." →
     `/dream-team`. Static (no graph here).
- **Layouts**: DT/WD as above; TL: work cards lose offset; TP: featured post full-width,
  compact posts 2-up, work 1-up, avatars wrap; LM/SM: everything single column, hero
  becomes static composition (07 §2.8), CTAs stack full-width, order unchanged.
- **Data**: `postsRepo.latest(3)`, projects content collection (featured 2),
  `authorsRepo.forTeamStrip()` (avatars + counts), site.ts copy. Courses teaser:
  `coursesRepo.latest(3)`.
- **Empty**: no posts → section renders EmptyState "New writing is on the way." (only
  plausible pre-launch); no projects → omit section entirely.
- **SEO/OG**: title "DataDreamer — Field notes from the future of data";
  OG: `og-home.png` (static, 10 §5). JSON-LD: `WebSite` + `Organization`.
- **A11y**: hero canvas `aria-hidden`; H1 + sub render server-side before any JS;
  avatar strip is a labeled list, not background decoration.
- **Acceptance**: LCP element is the H1 (not canvas); home readable with JS disabled;
  all sections keyboard reachable; hero idles to <2% CPU when off-screen; Lighthouse
  targets (01 §5) met.
- **Risks**: hero perf on low-end mobile (mitigated: static on <768px); copy drift
  (single source in site.ts).
- **Tree**: `index.astro → HeroSignalField / SectionHeader+PostCardFeatured+PostCard×2
  / ProjectCard×2 / CoursesTeaser? / TeamStrip`.

## 2. Blog landing `/blog`

- **Purpose**: browse all writing. **User**: returning reader. **Primary**: open a post.
  **Secondary**: filter by topic / author.
- **Sections**: 1) Page header: kicker "The blog", H1 "Writing", intro line, post count
  (mono). 2) **Featured post** — most recent `featured=true` else latest: full-width
  `PostCardFeatured` variant `hero` (image right 5/12, text left 7/12). 3) **Filter
  row**: topic chips (from `topics` with ≥1 post, ordered by count) + author select
  (only if >1 author has posts). Chips are links (`/blog/topic/[slug]`) — **server-
  rendered filtering, not client JS** (replaces v3 client filter; SEO-correct, no JS
  needed). Active chip = selected state (04 §10). 4) **Post list**: remaining posts as
  `PostCard` rows (date — title — excerpt(1 line, LM+) — topic chip — reading time),
  grouped by year with mono year markers when >12 posts. 5) Pagination: page size 12,
  `/blog/2` etc. (`rel=prev/next`, 10 §6) — build pagination only when count >12.
- **Layouts**: DT: featured split 7/5, list rows with 110px date gutter. TP: featured
  stacks image-top; rows keep one line. LM/SM: header tightens, chips scroll-x with
  fade mask (44px touch height), rows stack (title → meta row).
- **Data**: `postsRepo.list({topic?, author?, page})` — list query excludes `content`
  field (fixes audit §9). Topic/author from query path.
- **Empty**: filtered-empty → "No posts in this topic yet" + "Clear filter". True empty
  → EmptyState.
- **SEO/OG**: title "Writing — DataDreamer"; topic pages "‘Data engineering’ —
  DataDreamer"; OG `og-blog.png`; JSON-LD `Blog` (landing) / `CollectionPage` (topic).
  RSS `<link rel="alternate">`.
- **A11y**: chips in a `<nav aria-label="Topics">`; current chip `aria-current="true"`;
  reading order date→title preserved visually and in DOM.
- **Acceptance**: `/logs` 301s here; topic filtering works with JS disabled; no layout
  shift when images load; rows fully clickable with single accessible link (no nested
  links — author chip on rows is plain text here).
- **Tree**: `blog/index.astro → PageHeader / PostCardFeatured / TopicChips /
  PostList(PostCard×n) / Pagination`.

## 3. Article `/blog/[slug]`

- **Purpose**: best-in-class reading. **Primary**: read to end. **Secondary**: author
  page, related posts.
- **Sections**: 1) **Article header** (container-content, asymmetric: text cols 1–8):
  kicker = topic links + series label, H1 (Fraunces `--fs-4xl`), lede = excerpt
  (`--fs-lg`, `--text-2`), meta row (author chip with avatar → author page · date
  (mono, `<time>`) · reading time · log number if set). 2) Optional cover image
  (16/9, container-content, radius-lg). 3) **Body grid** (TL+): TOC rail cols 1–3
  sticky (`TableOfContents`, 07 §6) · prose cols 4–11 (`--container-prose`). Body =
  markdown pipeline output (callout spec: §3a below). 4) **Author block** — card:
  avatar 64px, name, role, 2-line bio, specialties chips, "More from {name} →".
  5) **Related posts** — 2–3 by shared topic (fallback latest), compact cards.
  6) Prev/next post links (chronological, ghost buttons).
- **Reading progress**: thin 2px `--accent` bar fixed under the nav, width = scroll
  progress through the article element. Decision: **include** — cheap (one rAF-throttled
  scroll listener), genuinely useful for long posts. Hidden on <768px (the scrollbar
  thumb already communicates position) and when the article is < 1.5 viewports tall.
  **Kept** under reduced-motion: it maps scroll position 1:1 with no autonomous
  animation — positional feedback, not motion.
- **Code blocks**: Shiki dual theme (`github-dark-default` + `github-light-default` via
  CSS vars), language label (mono, top-right), copy button (ghost, appears on
  hover/focus, `aria-label="Copy code"`, announces "Copied" via live region), soft-wrap
  off + horizontal scroll with momentum, `tabindex="0"` on scrollable `<pre>`.
- **Images/figures**: markdown images render as `<figure>` (natural ratio, radius-lg)
  with alt→`<figcaption>` only when title syntax `![alt](src "caption")` used;
  imagegrid + lightbox preserved (07 §7).
- **Layouts**: TL+: TOC rail visible. TP: TOC collapses to a "Contents" `<details>`
  above the body. LM/SM: same; meta row wraps to two lines; tables get
  `overflow-x:auto` wrappers; code font 13px.
- **Data**: `postsRepo.bySlug(slug)` (404 page if null — **not** redirect, fixing v3),
  `postsRepo.related(post, 3)`, author embedded in post query.
- **SEO/OG**: title "{Post title} — DataDreamer"; meta description = excerpt; OG image
  = post `cover_image` via Directus transform w/ public-URL guard, else `og-blog.png`;
  `article:*` tags; JSON-LD `BlogPosting` w/ author → author page URL; canonical.
- **A11y**: TOC = `<nav aria-label="Table of contents">`; callout semantics (§3a);
  progress bar `role="progressbar" aria-hidden="true"` (decorative duplicate of scroll);
  prose contrast: body text `--text-1` at 17.5px (fixes v3's 14px/0.8-opacity).
- **Acceptance**: all existing posts render correctly (compat contract audit §5.5);
  markdown **inside** callouts/details now renders (bold/links/code/lists); heading
  anchors hover-reveal a `#` link; copy button works; 404 for bad slug; print
  stylesheet: hide nav/footer/TOC/progress, black-on-white prose, callouts get
  border+label only.
- **Risks**: pipeline rewrite regressions → golden-file tests (V4-BLOG-002).
- **Tree**: `blog/[slug].astro → ArticleHeader(AuthorChip) / CoverImage? /
  ReadingProgress / TocRail / Prose(set:html) / AuthorBlock / RelatedPosts / PrevNext`.

### 3a. Callout specification (formal, v4)

**Variants** (final set — each must be visually distinct beyond color):

| Type | Icon (Lucide) | Accent token | Aliases (back-compat) |
|---|---|---|---|
| `note` | `sticky-note` | `--text-2` (neutral) | — |
| `info` | `info` | `--info` | — |
| `tip` | `lightbulb` | `--success` | — |
| `warning` | `triangle-alert` | `--warning` | — |
| `caution` | `octagon-alert` | `--danger` | new: destructive/dangerous ops |
| `important` | `message-square-warning` | `--accent` | new: must-read |
| `example` | `flask-conical` | `--viz-4` | new: worked examples |
| `technical` | `cpu` | `--viz-2` | new: deep-dive detail, collapsible by default? **No** — stays open; use `:::details` to collapse |

Dropped from consideration: none of the v3 four are removed. 8 variants is the ceiling.

**Syntax** (unchanged + extended): `:::type Optional Title` … `:::`. Title defaults to
the type name in sentence case ("Warning"). `:::type{title="X"}` now parsed properly.
Nesting: one level supported (callout containing code/list/details), callout-in-callout
unsupported (renders literally; documented).

**Rendering** (replaces raw-HTML-string approach; see 09 §6 pipeline):
```html
<aside class="callout callout--warning" role="note" aria-label="Warning: Hardware alert">
  <div class="callout__header">
    <svg class="callout__icon" aria-hidden="true">…</svg>
    <span class="callout__title">Hardware alert</span>
  </div>
  <div class="callout__body"> …full markdown-rendered content… </div>
</aside>
```
Style: `--bg-1` surface, radius-md, 1px `--border-1`, 3px inset left rule in the type
accent, icon 20px in accent, title Inter 600 `--fs-sm`, body `--fs-base` `--text-2`.
No tinted full backgrounds (keeps text AA in both themes). Mobile: padding `--space-4`,
icon 16px. Print: border + title only, icons hidden.
**Back-compat**: old emitted classes (`callout tip` etc.) get a thin compatibility
selector during migration window; golden-file tests assert v3 sample posts produce the
new structure.

## 4. Blog topic `/blog/topic/[slug]`
Same template as §2 with: header kicker "Topic", H1 = topic name, description from
`topics.description`, active chip preselected, canonical to itself, `CollectionPage`
JSON-LD, breadcrumbs (Blog → Topic). 404 for unknown topic. No featured section.

## 5. Project index `/projects`
- **Purpose**: portfolio proof. **Primary**: open case study.
- **Sections**: header (kicker "Selected work", H1 "Work", intro) → tag filter chips
  (client-side **is** acceptable here — content collection is small & static; but
  implement as links with `?tag=` SSR filter for consistency — decision: SSR like blog)
  → asymmetric 2-col card grid (16/10 covers, title, summary, year+tags mono meta).
- **Layouts**: DT 2-col offset grid; TP 2-col even; LM/SM 1-col.
- **Data**: Astro content collection `projects` (03 §3) — frontmatter schema in 09 §5.
- **Empty**: EmptyState "Case studies are being written up."
- **SEO/OG**: "Work — DataDreamer", `og-projects.png`, `CollectionPage`.
- **Acceptance**: zero Directus calls on this page; filters work without JS.
- **Tree**: `projects/index.astro → PageHeader / TagChips / ProjectCard×n`.

## 6. Case study `/projects/[slug]`
- **Sections**: header (kicker "Case study · {year}", H1, summary lede, meta grid:
  role · stack chips · year · link-out if any) → full-width cover (21/9, radius-lg) →
  prose body (same pipeline as articles; callouts available) → fact rail (TL+: sticky
  right rail cols 10–12 with stack/timeline/links; TP-: facts render as a grid card
  above body) → prev/next project.
- **Data**: content collection entry; `render()` via Astro's content pipeline but
  **piped through the same remark/rehype plugin set** (shared config — 09 §6) so
  callouts work in case studies too.
- **SEO/OG**: cover as OG (build-time resized to `public/og/projects/[slug].png` if
  authored; else `og-projects.png`); `article` type; JSON-LD `CreativeWork`.
- **Acceptance**: 404 on bad slug; images responsive via Astro `<Image>`; body reads
  identically to blog prose.
- **Tree**: `projects/[slug].astro → CaseHeader / Cover / Prose / FactRail / PrevNext`.

## 7. Dream Team `/dream-team`
Full interaction spec + pseudocode: 07 §5. Blueprint:
- **Purpose**: present the collective; route to author pages. **Primary**: open an
  author. **Secondary**: filter by specialty.
- **Sections**: 1) header (kicker "The people", H1 "Dream Team", intro). 2) **Graph
  stage** (TL+ only): SVG constellation, container-wide, height `min(72vh, 760px)`.
  Specialty anchors arranged on a golden-angle ring; author nodes (avatar circles
  44–56px by post+course count) cluster around their primary specialty; hairline edges
  author→each-of-their-specialties; specialty labels mono. Hover/focus: node lifts
  (scale 1.08), tooltip card (name, role, n posts), connected edges brighten, others
  dim to 35%. Click/Enter: navigate to author page. Specialty legend chips below
  double as filters (dim non-matching nodes). 3) **Member list** (all breakpoints;
  the graph's accessible equivalent): grouped by specialty, `AuthorCard` (avatar,
  name, role, specialties, counts). On TL+ the list sits below the graph under a
  "Everyone" kicker; on TP- the list **is** the page (graph not rendered at all —
  not just hidden: component not mounted).
- **Behavior**: deterministic layout (seeded by author id — same positions every
  visit); no physics simulation; keyboard = roving tabindex over nodes in
  specialty-then-name order; Escape clears filter; reduced-motion: no idle drift, no
  entrance stagger, tooltips instant.
- **No-JS**: graph `<noscript>`-safe — SVG is server-rendered with static positions
  (layout computed at request time in frontmatter), links are real `<a>` in SVG; only
  tooltips/dim effects need JS. This is why SVG was chosen (decision record 07 §5.1).
- **Data**: `authorsRepo.allWithCounts()`, `specialtiesRepo.all()`.
- **Empty/loading**: <2 authors → skip graph, list only. Avatar images lazy with
  initials fallback.
- **SEO/OG**: "Dream Team — DataDreamer", `og-team.png`, JSON-LD `ItemList` of
  `Person`s. The list section carries the semantic content for crawlers.
- **A11y**: SVG `role="group" aria-label="Team constellation; the list below contains
  the same people"`; every node link has accessible name "{name}, {role}"; tooltips
  `aria-hidden` (duplicate info); filter chips toggle with `aria-pressed`.
- **Acceptance**: graph never traps focus; 60fps hover on mid-range laptop; positions
  stable across reloads; list-only mobile passes all flows; zero horizontal scroll.
- **Risks**: collision overlap with >20 authors (mitigation: collision-relax loop with
  cap, 07 §5.4); avatar quality variance (enforce 512px square uploads in Directus).
- **Tree**: `dream-team/index.astro → PageHeader / TeamGraph(SVG, TL+) /
  SpecialtyLegend / AuthorList(AuthorCard×n)`.

## 8. Author page `/dream-team/[slug]`
- **Sections**: 1) **Profile header** (asymmetric: avatar 128px col 1–2; name H1,
  role, specialty chips, links row (icon ghost buttons: GitHub/LinkedIn/site/email)
  cols 3–9). 2) Bio prose (markdown, ≤ 70ch) + optional pull-quote personal statement
  (Fraunces italic). 3) Tools/tech: chip group. 4) **Writing** — author's posts,
  `PostCard` rows, count in kicker, paginated >10. 5) **Courses** (v4.1): `CourseCard`
  row if instructor on any. 6) Featured work: up to 2 hand-picked links (json field) as
  compact cards. 7) "More of the team" — 3 `AuthorCard`s sharing a specialty.
- **Layouts**: TP: header stacks (avatar 96px centered-left, text below). SM: links
  row wraps; chips scroll-x.
- **Data**: `authorsRepo.bySlug(slug)` (404 if none/inactive), `postsRepo.byAuthor`,
  `coursesRepo.byInstructor` (flagged), `authorsRepo.related`.
- **SEO/OG**: "{Name} — {Role} — DataDreamer"; OG: generated per-author card
  (10 §5.3: avatar + name template) else `og-team.png`; JSON-LD `ProfilePage` +
  `Person` (sameAs = links); canonical.
- **A11y**: links row each labeled ("GitHub profile of {name}"); avatar alt = name.
- **Acceptance**: renders fully with zero posts (sections omit gracefully); social
  links open new tab w/ `rel="noopener"`; breadcrumbs Dream Team → Name.
- **Tree**: `dream-team/[slug].astro → ProfileHeader / BioProse / ToolChips /
  AuthorPosts / AuthorCourses? / FeaturedWork? / RelatedAuthors`.

## 9. About `/about`
- **Purpose**: the person/practice behind the platform; conversion to contact.
- **Sections**: 1) header: kicker "About", H1 (from about.ts), portrait (square,
  radius-lg, duotone-subtle; **retire** the canvas pixel-dissolve — decision: high
  maintenance, brutalist-era; replaced by a clean treatment with an ember node motif
  overlay in the corner echoing the logo) on cols 8–12, text 1–7. 2) Stats row: 3–4
  mono-numeral stat tiles (Fraunces numerals `--fs-3xl`). 3) Timeline: vertical rule
  with year markers (mono) + role cards — from about.ts array. 4) Stack: grouped
  chips. 5) CTA band: "Work with me" → `/connect` + resume ghost button (PDF in
  `public/` now, not Directus).
- **Layouts**: TP: portrait above text; SM: stats 2×2.
- **Data**: `src/content/about.ts` only. Zero Directus.
- **SEO/OG**: "About — DataDreamer", `og-about.png`, JSON-LD `AboutPage`+`Person`.
- **Acceptance**: no canvas, no Directus call; portrait has explicit dimensions.

## 10. Connect `/connect`
- **Sections**: header (kicker "Contact", H1 "Let's talk", intro: what to contact
  about) → primary email card (big mono email, copy-to-clipboard button with live
  region "Copied") → channel rows (GitHub/LinkedIn/X: icon, label, handle, external
  arrow) → availability note (plain sentence, from site.ts) → FAQ-ish 3 bullets
  (response time, engagement types, timezone).
- No form in v4.0 (no backend mail infra; mailto is honest). Form = future work.
- **Layouts**: single column prose-width all breakpoints; email card text scales down
  SM with ellipsis-free wrap (`overflow-wrap:anywhere`).
- **Data**: site.ts. **SEO**: "Contact — DataDreamer", `og-default.png`, `ContactPage`.
- **Acceptance**: copy button keyboard accessible + announces; all links labeled.

## 11. Privacy `/privacy`
Static prose page (header + prose). Content: data collected (none in v4.0 beyond
server logs; v4.1 adds account data per PRD §12.4 — page ships v4.0 with hosting/log
disclosure and is extended in v4.1). noindex **not** set (it's fine to index).
`og-default.png`.

## 12. 404 page
Custom `src/pages/404.astro`: mark (mono variant, large, 25% opacity), H1 "This page
doesn't exist", line "The link may be old — these might help:", links: Home, Blog,
Work, Connect. Search-less by design. Status 404 (Astro handles). Log slugs that 404
via server console (helps catch redirect gaps). Replaces v3's redirect-to-listing
behavior (audit §3) — **redirect-on-missing-slug is retired**.

## 13. 500 / error page
`src/pages/500.astro` (Astro 5 supports): calm message "Something broke on our side",
"Try again" link, no stack traces. Also used by middleware catch (09 §9). Maintenance
mode: not built; documented ops note — Coolify-level static page if ever needed.

## 14. Courses catalogue `/courses` (v4.1)
Per COURSES_PRD §7.3 with v4 design substitutions:
- Header: kicker "Learn", H1 "Courses", intro. Filter row: level chips
  (All/Beginner/Intermediate/Advanced) + topic chips (shared `topics`) — SSR query
  params. Sort select (Newest/Shortest) — "Most useful" deferred until votes exist
  (PRD phase 2). Grid of `CourseCard`: cover (16/10) or generated gradient+mark
  placeholder, level chip, title (Inter 600 — Fraunces reserved for page headings),
  one-line description, mono meta (n lessons · duration · ★ score when ≥3 votes),
  badge dot if badge_enabled. Enrolled state (signed in): progress bar (4px,
  radius-full — PRD's square bars are v3-era) + "Continue → Lesson N".
- Layouts: 3-col DT / 2-col TP / 1-col LM-SM. Empty: "No courses yet — check back
  soon." per PRD. SEO: PRD §13.1 with v4 title format "Courses — DataDreamer";
  `og-courses.png`. JSON-LD `ItemList`.
- Acceptance: usable logged-out fully; filters SSR; cards equal height.

## 15. Course landing `/courses/[slug]` (v4.1)
PRD §7.4 structure retained (hero → stats row → outcomes → lesson list → study hub →
CTA block) restyled: stats row = 4 stat tiles (lessons/duration/level/badge);
outcomes = check-icon list (2-col TP+); lesson list = numbered rows (mono number,
title, duration, state icon: check `--success` / current `--accent` ring / upcoming
neutral; locked rows only when not preview & logged out — show lock + tooltip);
study hub = resource cards grouped by type with gating per PRD §7.11 (gated items
show lock + "Free account required"); CTA block per auth state (PRD §7.4.6) — sticky
bottom bar on LM/SM (safe-area padded), inline card on TP+ right rail (cols 9–12,
sticky). JSON-LD `Course` per PRD §13.2. OG: course cover else `og-courses.png`.
404 for bad slug. Acceptance: all four auth-state CTA variants render correctly;
lesson states accurate; structured data validates.

## 16. Lesson `/courses/[courseSlug]/[lessonSlug]` (v4.1)
PRD §7.5 retained: breadcrumb (course → lesson n), H1, 16/9 YouTube embed
(**facade pattern**: static thumbnail + play button; iframe injected on interaction —
saves ~500KB JS on load; `youtube-nocookie.com`, `rel=0&modestbranding=1`), notes
prose (markdown pipeline, callouts available), resources list, progress sidebar TL+
(x/N, bar, Mark complete button, prev/next) / sticky bottom bar TP- per PRD §8.6.
Video-unavailable fallback per PRD §15.5. `noindex` per PRD §13.1. Mark-complete:
optimistic UI + idempotent POST (07 §8 pseudocode). Not-enrolled visit: page renders,
Mark complete replaced by "Enroll to track progress". Acceptance: complete→badge flow
works E2E; keyboard path video→complete→next coherent; bottom bar never overlaps
content (scroll-padding).

## 17. Auth pages `/login` `/signup` `/forgot-password` `/reset-password` (v4.1)
Single centered card (max 400px) on `--bg-0`: mark, H1, fields per PRD §7.1 (Inter
labels — not mono-uppercase; that was v3), inline validation on blur + summary on
submit (`aria-live="assertive"`, focus to first error), submit primary full-width
with loading state, swap links (login↔signup), redirect param honored w/ safety rule
(PRD §7.1). All `noindex`. Error mapping per PRD §15.1. Acceptance: full keyboard +
SR pass; rate-limit 429 shows "Too many attempts" message; password manager
compatible (`autocomplete` attrs).

## 18. Student dashboard `/student` + `/student/settings` (v4.1)
PRD §7.6 retained, v4 style: greeting header ("Welcome back, {name}"), Continue
Learning card (most prominent — cover thumb, course, lesson, bar, Resume primary),
My courses table→cards (TP- stack), Completed + badges grid (badge = image in
radius-lg tile + course + date), account block → settings page (display name,
password change, delete-account confirmation flow). Empty: "No active courses —
Browse courses →". Protected by middleware; `noindex`. Settings: forms with same
validation pattern as §17.

## 19. Search `/search` — **future work, not in v4** (01 §6). Blueprint stub: when
post count > 50, server-rendered search over Directus `search` param, single input +
grouped results. Do not build without a new task.
