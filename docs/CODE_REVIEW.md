# CODE REVIEW — DATA DREAMER FRONTEND

> Generated: 2026-04-01
> Scope: `/frontend/src/` — all pages, components, layouts, lib, styles
> Goal: Improve maintainability, type safety, accessibility, and consistency **without changing functionality or visual design.**

---

## TABLE OF CONTENTS

1. [Code Duplication](#1-code-duplication)
2. [TypeScript & Type Safety](#2-typescript--type-safety)
3. [CSS — Inconsistencies & Hardcoded Values](#3-css--inconsistencies--hardcoded-values)
4. [Security](#4-security)
5. [Accessibility](#5-accessibility)
6. [Performance](#6-performance)
7. [Dead Code & Unused Items](#7-dead-code--unused-items)
8. [Error Handling](#8-error-handling)
9. [Component Opportunities](#9-component-opportunities)
10. [Documentation](#10-documentation)
11. [Priority Matrix](#11-priority-matrix)

---

## 1. Code Duplication

### 1.1 Author Formatting Logic — 3 Files

**Severity: High**

The same author name/initials/avatar logic is copy-pasted across:

| File | Lines |
|------|-------|
| `pages/logs/[slug].astro` | 24–30 |
| `pages/projects/[slug].astro` | 21–30 |
| `pages/logs/index.astro` | 18–20 |

All three compute author initials identically:
```typescript
// repeated in every slug page
const authorInitials = authorName
  .split(" ")
  .filter(Boolean)
  .slice(0, 2)
  .map((w: string) => w[0])
  .join("");
```

**Fix:** Add two utility functions to `src/lib/content.ts`:

```typescript
export function formatAuthorName(author?: { first_name?: string; last_name?: string } | null): string {
  return author
    ? `${author.first_name ?? ""} ${author.last_name ?? ""}`.trim().toUpperCase()
    : "ATEF ALVI";
}

export function getAuthorInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("");
}
```

Then each page becomes a one-liner import.

---

### 1.2 Date Formatting — Mixed Approaches

**Severity: Medium**

`src/lib/content.ts` exports `formatDate()` but most pages ignore it and inline the conversion:

| File | Inline Pattern |
|------|---------------|
| `pages/index.astro` line 27 | `.toISOString().slice(0, 10).replace(/-/g, ".")` |
| `pages/projects/[slug].astro` line 65 | Same |
| `pages/logs/index.astro` line 11 | Same |

**Fix:** Import and use the existing `formatDate()` everywhere. Delete the inline repetitions.

---

### 1.3 Post Meta Grid CSS — Duplicated Across Two Pages

**Severity: High**

`pages/logs/[slug].astro` and `pages/projects/[slug].astro` each define an identical block of ~80 lines of CSS for the author/date/timeline grid:

- `.post-meta-grid`
- `.pmg-col`, `.pmg-label`, `.pmg-value`
- `.pmg-author-col`
- `.author-avatar`, `.author-initials`, `.author-chip`, `.author-name`

**Fix:** Move these shared styles into `src/styles/global.css` under a clearly labelled section `/* ── POST META GRID ── */`. Remove the duplicate blocks from both slug pages. No visual change needed.

---

### 1.4 Filter Button CSS — Duplicated Across Two Pages

**Severity: Medium**

`.filter-btn` styles in `pages/projects/index.astro` and `pages/logs/index.astro` are nearly identical (~20 lines each):

```css
/* both files */
.filter-btn {
  background: none;
  border: 1px solid var(--color-border);
  font-family: var(--font-tech);
  font-size: 10px;
  text-transform: uppercase;
  cursor: pointer;
  /* ... */
}
.filter-btn.active, .filter-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
```

**Fix:** Move `.filter-btn` and its states into `global.css`. Both pages can delete their local copies.

---

### 1.5 Filter JavaScript Logic — Two Divergent Implementations

**Severity: Low**

Projects page uses a simple single-tag filter. Logs page adds a second author-dimension filter. The DOM querying and `data-*` reading patterns are copy-pasted boilerplate with different variable names.

**Fix:** Extract a small shared `filterByAttributes(selector, filters)` utility into `src/lib/filter.ts` if a third filterable list page is ever added. Not urgent but flag for future.

---

### 1.6 Scrollbar Hiding — Duplicated

**Severity: Low**

| File | What it hides |
|------|--------------|
| `global.css` | Global scrollbar |
| `pages/projects/[slug].astro` lines 210–217 | Sidebar |
| `styles/global.css` | `.image-grid` on mobile |

The sidebar scrollbar-hide block in `[slug].astro` uses both `-webkit-scrollbar` and `scrollbar-width: none` and is a standalone 8-line block that duplicates the global pattern.

**Fix:** Add a utility class `.hide-scrollbar` to `global.css` and apply it to the sidebar `<aside>`.

---

## 2. TypeScript & Type Safety

### 2.1 Widespread Use of `any` — 10+ Locations

**Severity: High**

Every page uses `: any` in map callbacks instead of the proper types that are already defined in `src/lib/content.ts` and `src/lib/directus.ts`.

| File | Example |
|------|---------|
| `pages/index.astro` line 14 | `(p: any, i: number)` |
| `pages/projects/index.astro` line 9 | `(p: any, i: number)` |
| `pages/projects/index.astro` lines 22, 37, 47 | `(a: any)`, `(tag: any)`, `(project: any)` |
| `pages/logs/index.astro` lines 7, 86 | `(l: any)`, `(post: any)` |

**Fix:** Import and use existing types. For example:

```typescript
// pages/projects/index.astro
import type { DirectusProject } from "../lib/directus";

const projects = directusProjects.map((p: DirectusProject, i: number) => ({ ... }));
```

The types exist — they just aren't being imported on the pages.

---

### 2.2 Loose `any` Fields in Directus Type Definitions

**Severity: Medium**

`src/lib/directus.ts` defines top-level `AboutData` with:

```typescript
stats?: any[];
experience?: any[];
skills?: any[];
```

But `AboutStats.astro`, `AboutTimeline.astro`, and `AboutStack.astro` each define their own interfaces internally (`StatItem`, `ExperienceItem`, `SkillCategory`).

**Fix:** Move those interfaces up to `directus.ts` and use them in `AboutData`:

```typescript
export interface StatItem { value: string; label: string; }
export interface ExperienceItem { year: string; role: string; company: string; }
export interface SkillCategory { name: string; items: string[]; }

export interface AboutData {
  stats?: StatItem[];
  experience?: ExperienceItem[];
  skills?: SkillCategory[];
}
```

---

### 2.3 Unsafe Type Assertions in Canvas Code

**Severity: Low**

`src/components/hero/HeroCanvas.astro` uses several `as HTMLCanvasElement` casts without null guards:

```typescript
// line 66 — no null check before accessing context
const ctx = canvas.getContext("2d")!;
```

**Fix:** Guard with an early return:

```typescript
const canvas = document.getElementById("heroCanvas") as HTMLCanvasElement | null;
if (!canvas) return;
const ctx = canvas.getContext("2d");
if (!ctx) return;
```

---

### 2.4 Magic Numbers Without Named Constants

**Severity: Low**

`src/components/hero/HeroCanvas.astro` has several unexplained numeric literals:

```typescript
const NODE_COUNT = 60;  // ok, named
const EDGE_DIST  = 220; // ok, named
// but also:
const fov = 600;            // line 145 — what unit? why 600?
trail.length > 18           // line 195 — why 18?
(Math.random() - 0.5) * 1200 // line 101 — viewport assumption
```

**Fix:** Extract to named constants at the top of the script block with a brief comment:

```typescript
const FOV         = 600;  // perspective focal length (px)
const TRAIL_LEN   = 18;   // cursor trail history length
const SPAWN_RANGE = 1200; // initial position spread (matches hero width at 1440px)
```

---

## 3. CSS — Inconsistencies & Hardcoded Values

### 3.1 Hardcoded Hex Colors That Break Dark Mode

**Severity: High**

Several components use raw hex values instead of CSS variables, so they won't respond correctly when the theme toggles:

| File | Line | Hardcoded | Should Be |
|------|------|-----------|-----------|
| `pages/projects/[slug].astro` | 245 | `background: #eee` | `var(--bg-muted)` |
| `pages/projects/[slug].astro` | 246 | `color: #666` | `var(--text-secondary)` |
| `components/about/AboutStack.astro` | 226 | `color: #999` | `var(--text-secondary)` |
| `components/about/AboutStack.astro` | 245 | `background: #eee` | `var(--bg-muted)` |
| `components/Navigation.astro` | various | `#111`, `#fff` | `var(--color-ink)`, `var(--color-bg)` |

**Fix:** Do a global search for `#[0-9a-f]{3,6}` in `.astro` and `.css` files. Any that represent theme-sensitive values (backgrounds, text, borders) should use the existing CSS variable system.

---

### 3.2 Inconsistent Transition Values

**Severity: Low**

CSS variables `--transition-speed` and `--ease-out` are defined in `global.css` but most components ignore them:

| Usage | File |
|-------|------|
| `transition: all 0.2s` | `pages/projects/index.astro` line 93 |
| `transition: background 0.25s ease` | `pages/logs/index.astro` line 183 |
| `transition: filter 0.3s` | `global.css` line 606 |
| `transition: transform 0.35s ease` | `global.css` (image-grid) |

**Fix:** Extend the token set and use consistently:

```css
:root {
  --transition-fast:   0.2s ease;
  --transition-normal: 0.3s ease;
  --transition-slow:   0.5s ease;
}
```

Then replace all inline `transition:` values.

---

### 3.3 Duplicate Logo Accent Style

**Severity: Low**

`.dd-logo-accent { fill: #fd2e00; }` is defined in both `global.css` and `components/Logo.astro`. The component-scoped version is redundant.

**Fix:** Remove the duplicate from `Logo.astro`. The global rule already applies.

---

### 3.4 Inline `style` Attributes in Templates

**Severity: Low**

Some templates use `style="color:var(--text-secondary);"` inline rather than a class:

| File | Line |
|------|------|
| `pages/index.astro` | 43, 71 |
| `pages/logs/index.astro` | 105 |
| `components/blog/RelatedLogs.astro` | 24–25 |

**Fix:** The global `.meta-text` class already exists. Where these elements have `class="meta-text"` too, the inline style is redundant. Where they don't, add the class and remove the style attribute.

---

### 3.5 Unused CSS Rule

**Severity: Low**

`pages/about.astro` has:
```astro
<style>
  /* Body styles are handled globally by MainLayout and individual components */
</style>
```
An empty `<style>` block with only a comment.

**Fix:** Delete the entire `<style>` tag.

---

## 4. Security

### 4.1 Unguarded `set:html` in `AboutStack.astro`

**Severity: Medium**

```astro
<!-- components/about/AboutStack.astro line 31 -->
<div class="skill-name" set:html={category.name.replace(" ", "<br/>")}></div>
```

`category.name` comes from Directus. If the field ever contains `<script>` or event-handler attributes, this will execute them.

**Fix:** Strip tags before injection, or avoid `set:html` entirely for a simple line-break case:

```astro
<!-- Safe alternative — no HTML injection needed -->
{category.name.split(" ").map((word, i) => (
  <>{i > 0 && <br />}{word}</>
))}
```

---

### 4.2 `allowDangerousHtml` in Markdown Pipeline — Needs Comment

**Severity: Low**

`src/lib/renderMarkdown.ts` lines 143 and 148 use `allowDangerousHtml: true`. This is necessary for the custom `:::` block HTML to pass through, and it is safe because content comes from a trusted Directus admin panel — not from public user input.

**Fix:** It's safe as-is, but add a comment so the next developer doesn't remove it in confusion:

```typescript
// allowDangerousHtml is intentional — content is authored in Directus (trusted admin)
// and our :::block preprocessor injects raw HTML that must survive the rehype pipeline.
.use(remarkRehype, { allowDangerousHtml: true })
```

---

### 4.3 `define:vars` With URL — Use Data Attribute Instead

**Severity: Low**

`components/about/AboutHero.astro` passes `imageUrl` to an inline script via `define:vars`. This works but can break if the URL contains quotes.

**Fix:** Use a data attribute on the canvas element instead:

```astro
<canvas id="portrait-canvas" data-src={imageUrl}></canvas>
<script>
  const url = (document.getElementById('portrait-canvas') as HTMLElement).dataset.src ?? '';
</script>
```

---

## 5. Accessibility

### 5.1 Empty `alt` on Lightbox Image

**Severity: High**

`src/layouts/MainLayout.astro` (lightbox HTML):
```html
<img class="ig-lightbox-img" id="igImg" src="" alt="" />
```

Screen readers announce this as an unlabelled image. The `alt` is updated dynamically by JS but initialises empty.

**Fix:** Add a placeholder `alt` and update it in the `show()` function (the JS already does this — make sure `lbImg.alt` is always set before the lightbox becomes visible):

```typescript
function show(i: number) {
  idx = (i + items.length) % items.length;
  lbImg.src = items[idx].dataset.src ?? '';
  lbImg.alt = items[idx].querySelector('img')?.alt || `Image ${idx + 1}`;
  lbCounter.textContent = `${idx + 1} / ${items.length}`;
}
```

Also add `aria-live="polite"` to the counter so screen readers announce navigation.

---

### 5.2 Filter Buttons Missing `aria-pressed`

**Severity: Medium**

Filter buttons in both `pages/projects/index.astro` and `pages/logs/index.astro` toggle between active and inactive states, but have no ARIA state attribute. Screen reader users cannot determine which filter is active.

**Fix:** Set `aria-pressed` in the initial HTML and update it in the filter JS:

```html
<button class="filter-btn active" data-tag="all" aria-pressed="true">All</button>
<button class="filter-btn" data-tag="python" aria-pressed="false">Python</button>
```

```javascript
// in the filter click handler
document.querySelectorAll('.filter-btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
btn.setAttribute('aria-pressed', 'true');
```

---

### 5.3 `prefers-reduced-motion` Not Respected

**Severity: Medium**

`HeroCanvas.astro` and `MainLayout.astro` (cursor trail) run continuous canvas animations via `requestAnimationFrame`. Users who set `prefers-reduced-motion: reduce` in their OS still get the full animations.

**Fix:** Wrap animation start in a media query check:

```typescript
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reducedMotion) {
  drawCursor(); // only start the loop if motion is OK
}
```

For the hero canvas, the static fallback could simply show the grid at rest with no movement.

---

### 5.4 Missing `loading` Attribute on Featured Project Image

**Severity: Low**

`pages/projects/[slug].astro` line 78:
```html
<img src={imageUrl} alt={title} />
```

No `loading` attribute. Browser default is eager for above-the-fold images, which is correct for the hero image. But it should be explicit.

**Fix:** Add `loading="eager"` (or `fetchpriority="high"`) to make the intent clear and let the browser prioritise it:

```astro
<img src={imageUrl} alt={title} loading="eager" fetchpriority="high" />
```

---

## 6. Performance

### 6.1 Font Loading — Add `display=swap`

**Severity: Low**

`MainLayout.astro` loads Google Fonts synchronously. Without `display=swap`, text is invisible until fonts load (FOIT).

**Fix:** The `display=swap` parameter should already be in the URL — verify it is:

```html
<!-- should include &display=swap -->
<link href="https://fonts.googleapis.com/css2?family=Anton&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
```

If it's missing, add `&display=swap` to the URL.

---

### 6.2 No `srcset` / Responsive Images

**Severity: Low**

Project thumbnails and featured images are served at full Directus resolution. A 2000px image displayed at 300px wastes bandwidth on mobile.

**Fix:** Directus supports image transforms via URL params. Create a helper:

```typescript
// src/lib/directus.ts
export function getAssetUrl(id: string, width?: number): string {
  const base = `${DIRECTUS_URL}/assets/${id}`;
  return width ? `${base}?width=${width}&quality=80&format=webp` : base;
}
```

Then use `getAssetUrl(cover_image, 800)` for cards and `getAssetUrl(cover_image, 1400)` for hero images.

---

### 6.3 `JSON.stringify` for Tag Data Attributes

**Severity: Low**

`pages/projects/index.astro` line 50 serialises tag arrays to JSON in `data-tags` attributes, then `JSON.parse`s them in JS. This adds overhead and makes the HTML harder to inspect.

**Fix:** Use a simpler `data-tags` with comma-separated values:

```astro
data-tags={project.tags.map(t => t.toLowerCase()).join(",")}
```

```javascript
// JS filter
const tags = card.dataset.tags?.split(",") ?? [];
```

---

## 7. Dead Code & Unused Items

### 7.1 `excerpt` Mapped But Never Rendered

**File:** `pages/logs/index.astro` line 14

```typescript
excerpt: l.excerpt ?? "",  // mapped but not used in the template
```

The `excerpt` field is included in the posts array but the template only renders `title`, `date`, `tags`, and `author`.

**Fix:** Remove `excerpt` from the map if it's unused, or render it in the card if it was always intended to be shown.

---

### 7.2 Empty `<style>` Block

**File:** `pages/about.astro`

The file has a `<style>` tag containing only a comment. Delete it entirely.

---

### 7.3 Two Similar Pull Quote Components

**Severity: Low**

`components/blog/PullQuote.astro` and `components/blog/QuoteBlock.astro` both accept a `text` prop and render it via `set:html` into a pull-quote element. One appears to be an older version of the other.

**Fix:** Confirm which one is actually imported anywhere using a grep, then delete the unused one. If both are used, merge into a single component with an optional style variant prop.

---

## 8. Error Handling

### 8.1 Silent Empty State When Directus Fails

**Severity: Medium**

`pages/projects/index.astro` and `pages/logs/index.astro` both call fetch functions that could return `[]` on error. When they do, the page silently renders an empty grid with no message.

**Fix:** Add a check and render a fallback:

```astro
---
const projects = await fetchProjects();
---

{projects.length === 0 ? (
  <p class="empty-state">No projects found. Check back soon.</p>
) : (
  projects.map(project => <ProjectCard ... />)
)}
```

---

### 8.2 Resume URL Falls Back to `#` Silently

**File:** `components/about/AboutHero.astro` line 21

```typescript
const resumeUrl = resumeId ? getAssetUrl(resumeId) : "#";
```

If no resume is uploaded in Directus, the button renders but does nothing when clicked.

**Fix:** Conditionally hide the button when no resume is available:

```astro
{resumeId && (
  <a href={getAssetUrl(resumeId)} class="btn-secondary" download>
    DOWNLOAD RESUME
  </a>
)}
```

---

## 9. Component Opportunities

### 9.1 Author Meta Block — Extract to Component

The author chip (avatar + initials fallback + label + name) is rendered identically in `pages/logs/[slug].astro` and `pages/projects/[slug].astro`. This is a strong candidate for a reusable component.

**Suggested:** `src/components/blog/AuthorChip.astro`

```astro
---
interface Props {
  name: string;
  avatarUrl?: string | null;
  initials: string;
}
const { name, avatarUrl, initials } = Astro.props;
---
<div class="pmg-author-col">
  {avatarUrl
    ? <img class="author-avatar" src={avatarUrl} alt={name} />
    : <span class="author-initials">{initials}</span>
  }
  <span class="pmg-label">AUTHOR</span>
  <span class="pmg-value author-name">{name}</span>
</div>
```

---

### 9.2 Page Hero Header — Extract to Component

The section header pattern (`// META_LABEL` + title + optional subtitle) appears on at least 4 pages. A simple `PageHero.astro` component would make each page cleaner:

```astro
---
interface Props {
  label: string;   // e.g. "// PROJECT INDEX"
  title: string;
  subtitle?: string;
}
---
<header class="page-hero-header">
  <span class="meta-text">{label}</span>
  <h1 class="page-title">{title}</h1>
  {subtitle && <p class="page-subtitle">{subtitle}</p>}
</header>
```

---

## 10. Documentation

### 10.1 Document the Custom Markdown Syntax

There is no user-facing guide for the `:::` custom block syntax. The only documentation is the comment block at the top of `renderMarkdown.ts`.

**Fix:** Create `docs/MARKDOWN_SYNTAX.md` (separate from this file) listing:
- `:::tip / :::warning / :::info / :::note`
- `:::details Summary text`
- `:::quote`
- `:::imagegrid`

This already exists as `docs/AGENT_BLOG_GUIDE.md` — add the `:::imagegrid` section and any missing blocks to it rather than creating a new file.

---

### 10.2 Document Why `allowDangerousHtml` Is Safe

Already covered in [§4.2](#42-allowdangeroushtml-in-markdown-pipeline--needs-comment). One-line comment in `renderMarkdown.ts`.

---

### 10.3 Add JSDoc to Public Lib Functions

`src/lib/directus.ts` exports `fetchProjects`, `fetchLogs`, `fetchAbout` etc. with no JSDoc. Adding `/** */` comments to each explaining the return shape and error behaviour takes minutes and pays off later.

---

## 11. Priority Matrix

| # | Issue | File(s) | Effort | Impact |
|---|-------|---------|--------|--------|
| 1 | Hardcoded hex colors break dark mode | `projects/[slug].astro`, `AboutStack.astro` | Low | High |
| 2 | Meta grid CSS duplicated ~80 lines | both slug pages | Low | High |
| 3 | `any` types everywhere | all pages | Low | High |
| 4 | Author formatting duplicated 3× | slug pages, `content.ts` | Low | Medium |
| 5 | Filter button CSS duplicated | index pages | Low | Medium |
| 6 | `aria-pressed` missing on filter buttons | index pages | Low | Medium |
| 7 | `prefers-reduced-motion` not respected | `HeroCanvas.astro`, `MainLayout.astro` | Low | Medium |
| 8 | Lightbox `alt` not set before display | `MainLayout.astro` | Low | Medium |
| 9 | `set:html` XSS risk in `AboutStack` | `AboutStack.astro` | Low | Medium |
| 10 | `allowDangerousHtml` uncommented | `renderMarkdown.ts` | Trivial | Low |
| 11 | Empty `<style>` block | `about.astro` | Trivial | Low |
| 12 | Date formatting inconsistency | 3 pages | Low | Low |
| 13 | `excerpt` mapped but unused | `logs/index.astro` | Trivial | Low |
| 14 | Resume button shows when no file | `AboutHero.astro` | Low | Low |
| 15 | Directus image transforms for perf | `directus.ts` | Medium | Medium |
| 16 | Error state for empty fetch results | index pages | Low | Medium |
| 17 | `PullQuote` / `QuoteBlock` duplication | components | Low | Low |
| 18 | Magic numbers in canvas code | `HeroCanvas.astro` | Low | Low |
| 19 | `JSON.stringify` for filter data attrs | `projects/index.astro` | Low | Low |
| 20 | `display=swap` font loading | `MainLayout.astro` | Trivial | Low |

---

*Items 1–9 are the highest-value fixes: low effort, prevent real bugs (dark mode breakage, accessibility failures, type errors slipping through). Items 10–20 are polish and cleanup that can be batched.*
