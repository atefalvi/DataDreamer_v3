# 06 — Component Architecture

Component inventory with contracts. Rule of thumb: a component earns existence by being
used twice OR isolating real complexity (canvas, focus trap, pipeline). Page-specific
markup stays in the page file. No premature generic systems.

## 1. Directory layout

```
frontend/src/components/
├── ui/            # design-system primitives (domain-agnostic)
├── global/        # shell: nav, footer, theme, skip link
├── home/          # hero + home-only sections
├── blog/          # post cards, TOC, reading progress, prose helpers
├── projects/      # project cards, fact rail
├── dream-team/    # graph, author cards, profile header
├── guides/        # v4.1: guide cards, hero, sections, items, progress (Field Guides)
└── about/         # about-only sections
```

## 2. Hydration policy (which components ship JS)

Astro components are server-rendered by default. The **only** client scripts in v4.0:

| Script | Where | Why client |
|---|---|---|
| Theme init (inline, head) | BaseLayout | pre-paint |
| Theme toggle | global/ThemeToggle | user pref |
| Mobile menu controller | global/MobileMenu | open/close, focus trap |
| Nav scroll state | global/SiteNav | transparent→solid class flip |
| Hero signal field | home/HeroSignalField | canvas |
| Reveal-on-scroll utility | lib/motion/reveal.ts (one global) | IO |
| Reading progress | blog/ReadingProgress | scroll mapping |
| TOC scrollspy | blog/TableOfContents | IO highlight |
| Code copy buttons | blog prose enhancer (one delegated listener) | clipboard |
| Lightbox | blog/Lightbox (mounted only on pages w/ imagegrid) | dialog |
| Team graph enhancer | dream-team/TeamGraph | hover/dim/tooltips (SVG itself is SSR) |

v4.1 adds (Field Guides): auth forms/account shell, YouTube video facade, and the guide
progress island (`lib/guides/progress.ts` + GuideProgress bar + per-item complete
toggles + catalogue card resume state) backed by protected Astro API endpoints.
Everything else is HTML+CSS. **No framework islands (React/etc.) — plain `<script>`
modules.** Adding a framework requires architecture sign-off via handoff.

## 3. UI primitives (`components/ui/`)

| Component | Props (typed) | Notes |
|---|---|---|
| `Button.astro` | `variant: 'primary'\|'secondary'\|'ghost'`, `size?: 'sm'\|'md'\|'lg'`, `href?`, `icon?`, `loading?` | renders `<a>` or `<button>`; 04 §11 |
| `Card.astro` | `href?`, `padding?: 'md'\|'lg'`, `interactive?` | geometry+hover contract 04 §10; slot content |
| `Chip.astro` | `label`, `href?`, `selected?`, `icon?` | filters, topics, specialties |
| `Kicker.astro` | `label` | mono eyebrow, 04 §13 |
| `SectionHeader.astro` | `kicker`, `title`, `intro?`, `action?: {label, href}` | standard section opener |
| `Avatar.astro` | `src?`, `name`, `size: 24\|32\|48\|64\|96\|128` | initials fallback, ring treatment |
| `EmptyState.astro` | `message`, `action?` | 04 §14.5 |
| `ErrorState.astro` | `message?` | section-level failure |
| `Prose.astro` | — | wraps `set:html` output; applies `styles/prose.css` scope class |
| `Icon.astro` | `name` (lucide), `size?: 16\|20\|24` | inlines SVG at build |
| `FormField.astro` (v4.1) | `label`, `name`, `type`, `error?`, `hint?`, `autocomplete?` | label+input+error wiring (`aria-describedby`) |
| `ProgressBar.astro` (v4.1) | `value: 0–100`, `label` | `role="progressbar"` + aria values |
| `Breadcrumbs.astro` | `items: {label, href?}[]` | + JSON-LD emission |

## 4. Global shell (`components/global/`)

- `SiteNav.astro` — props: none (reads route). Contains desktop links, ThemeToggle,
  Connect CTA, hamburger button. States: top-of-page = semi-transparent (home hero
  only), scrolled = glass + hairline bottom border. Behavior spec 07 §3.
- `MobileMenu.astro` — overlay panel; rendered in BaseLayout, controlled by SiteNav
  button. Focus trap, Escape, scroll-lock (07 §3.3).
- `SiteFooter.astro` — 03 §2; data from site.ts + `topicsRepo.top(5)` (cached).
- `ThemeToggle.astro` — button with sun/moon icon swap, `aria-label="Switch to light
  theme"` (dynamic), persists to localStorage.
- `SkipLink.astro` — first focusable, targets `#main`.
- `SeoHead.astro` — head partial used by BaseLayout; props mirror 10 §2 contract.

## 5. Layouts

- `BaseLayout.astro` — html/head/body, SeoHead, theme init, SkipLink, SiteNav,
  MobileMenu, `<main id="main">` slot, SiteFooter. Replaces MainLayout (which is
  deleted at the end of the shell phase). Global lightbox is **not** here (v3 mistake —
  it shipped on every page); it mounts per-page when needed.
- `ProseLayout.astro` — BaseLayout + article container + optional TOC rail slot
  (used by article, case study, privacy).
- v4.1: `AuthLayout.astro` (centered card), `StudentLayout.astro` (dashboard chrome).

## 6. Domain components (contracts for the non-obvious ones)

### blog/
- `PostCard.astro` — `post: PostListItem`, `variant: 'row'|'compact'|'featured'|'hero'`.
  One component, four layouts (05 §1–2). Whole card is one `<a>`; inner author/topic
  render as plain text in card context.
- `TableOfContents.astro` — `headings: Heading[]` (from pipeline). Scrollspy via
  IntersectionObserver on heading sentinels (replaces v3 scroll-loop). Depth 2–3 only.
- `ReadingProgress.astro` — no props; measures `<article data-article>`.
- `Lightbox.astro` — dialog element (`<dialog>`), keyboard + swipe, counter,
  conditionally included by article page when imagegrid present in HTML (string check).
- `AuthorBlock.astro` — `author: AuthorSummary` (article footer card).

### dream-team/
- `TeamGraph.astro` — `authors: GraphAuthor[]`, `specialties: Specialty[]`.
  Server-computes layout (07 §5.4) and renders complete SVG; client script adds
  hover/dim/tooltip only. Not rendered below `--bp-lg` (page-level conditional).
- `AuthorCard.astro` — `author: AuthorSummary`, used in list + related rows.
- `ProfileHeader.astro` — author page header block.

### projects/
- `ProjectCard.astro` — `project: ProjectListItem` (from content collection).
- `FactRail.astro` — `facts: {label, value|chips|links}[]`.

### guides/ (v4.1 — Field Guides)
- `GuideCard.astro` — `guide: GuideListItem` (catalogue card; progress upgrade via the
  client island, 05 §14).
- `GuideCardFeatured.astro` — featured variant (cover + summary + meta).
- `GuideHero.astro` — `guide: Guide` (title, summary, curator, meta).
- `GuideProgress.astro` — client island: status pill, percent bar, counts, time
  remaining, Start/Resume button; reads `lib/guides/progress.ts` (09 §10).
- `GuideSection.astro` — `section: GuideSection` (title, description, items slot).
- `GuideItem.astro` — `item: GuideItem` — renders by `type` (video facade / link / pdf
  / file / inline markdown), curator annotations (`whyIncluded`/`focusOn`/`notes`),
  and the authenticated complete toggle.
- `VideoEmbed.astro` — `url`, `title` (YouTube facade; 05 §15).
- `ItemCompleteToggle.astro` — `guideSlug`, `itemId` — authenticated completion toggle
  (optimistic; no network), `aria-pressed`.

## 7. View-model types (single source: `src/types/content.ts`)

Pages never receive raw Directus rows. Repositories (09 §4) map to these:

As implemented in `src/types/content.ts` (V4-ARC-001):

```ts
interface PostListItem { slug; title; excerpt; publishedAt: Date; topics: TopicRef[];
  author: AuthorRef; coverImage?: ImageRef; featured: boolean;
  seriesLabel?: string; postNumber?: number; readingMinutes?: number }
interface Post extends PostListItem { bodyHtml: string; headings: Heading[];
  readingMinutes: number }
interface AuthorRef { slug; name; avatar?: ImageRef }
interface AuthorSummary extends AuthorRef { roleTitle; specialties: SpecialtyRef[];
  postCount: number; guideCount: number }
interface Author extends AuthorSummary { bioHtml; statement?; links: AuthorLink[];
  tools: string[]; featuredWork: FeaturedLink[] }
interface ImageRef { id; src; width?; height?; alt }  // src builders attach srcset params
interface TopicRef { name; slug }   interface SpecialtyRef { name; slug; colorKey }
interface Heading { id; text; depth: 2|3 }

// Field Guides (v4.1) — view-models defined in V4-GUIDE-002 (08 §4 / §8.6):
interface GuideListItem { slug; title; summary; difficulty: 'beginner'|'intermediate'|
  'advanced'; coverImage?: ImageRef; estimatedMinutes?: number; itemCount: number;
  featured: boolean; curator: AuthorRef; topics: TopicRef[] }
interface GuideItem { id; type: GuideItemType; title; description?; url?;
  asset?: ImageRef; bodyHtml?: string; whyIncludedHtml?; focusOnHtml?; notesHtml?;
  estimatedMinutes?: number; difficulty?: 'beginner'|'intermediate'|'advanced' }
interface GuideSection { id; title; descriptionHtml?: string; items: GuideItem[] }
interface Guide extends GuideListItem { whyThisPathHtml: string; expectedOutcomeHtml?;
  recommendedAudience?; curators: AuthorRef[]; specialties: SpecialtyRef[];
  sections: GuideSection[] }
type GuideItemType = 'youtube'|'external_url'|'pdf'|'uploaded_file'|'notebooklm'|
  'github_repo'|'code_sample'|'cheat_sheet'|'personal_note'|'exercise'|'docs_page';
// NOTE: no progress fields on these content view-models — progress is a separate,
// per-user concern fetched from `guide_progress` and merged at render for logged-in
// readers (server-backed; 09 §10). Anonymous visitors get the preview shape only
// (no item bodies/notes/urls/assets).
```

> Deviation (V4-ARC-001): `readingMinutes` is **required on `Post` but optional on
> `PostListItem`**, and `postNumber` replaces the placeholder `logNumber` (schema field
> is `post_number`). Reading time needs `content`, which list queries omit for payload
> reasons (08 §8.1) — so listing cards do not render read time. If read time on cards
> becomes desired, add a cached `reading_minutes` column to `posts` (backlog), don't
> re-introduce `content` into list queries.

## 8. Files to keep / refactor / replace / delete (frontend)

| Action | Files |
|---|---|
| **Keep (modify lightly)** | `astro.config.mjs` (add redirects, image domains), `tsconfig.json`, `Dockerfile`, `.env.example` (+vars), `robots.txt` (regenerate) |
| **Refactor into v4 modules** | `lib/renderMarkdown.ts` → `lib/markdown/` (pipeline preserved + upgraded, 09 §6); `lib/directus.ts` → `lib/directus/client.ts` + `lib/repositories/*`; `lib/content.ts` formatters → `lib/format.ts` |
| **Replace (new implementation, same job)** | MainLayout → BaseLayout; Navigation → SiteNav+MobileMenu; Footer → SiteFooter; Logo → brand assets + `ui/Icon` usage; global.css → tokens.css+base.css+prose.css; PageHero → SectionHeader/PageHeader; ProjectCard, TableOfContents, RelatedLogs→RelatedPosts, AuthorChip→Avatar+meta, Callout/Expandable/PullQuote → pipeline-emitted markup + prose.css |
| **Delete (after replacement lands)** | HeroCanvas.astro, HeroTagline.astro, about/AboutHero canvas code, grain overlay + cursor canvas (in MainLayout), `public/masks/*`, `public/logo.svg` (replaced), dead `blog/{Callout,Expandable,PullQuote}.astro` |
| **Migrate later (v4.1)** | none — Field Guides/auth are net-new; do not migrate the retired LMS surface |

Deletion discipline: a file is deleted in the same task that ships its replacement,
never before; each deletion listed in the task's diff summary in the handoff.
