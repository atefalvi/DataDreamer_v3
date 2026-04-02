# CODE REVIEW — DATA DREAMER FRONTEND

> Last updated: 2026-04-01 (session 2 — social sharing audit + general polish scan)
> Scope: `/frontend/src/` — all pages, components, layouts, lib, styles
> Goal: Improve maintainability, type safety, accessibility, and consistency **without changing functionality or visual design.**

---

## TABLE OF CONTENTS

1. [Code Duplication](#1-code-duplication)
2. [TypeScript & Type Safety](#2-typescript--type-safety)
3. [CSS — Inconsistencies & Token Gaps](#3-css--inconsistencies--token-gaps)
4. [Social Sharing & SEO](#4-social-sharing--seo)
5. [Accessibility](#5-accessibility)
6. [Performance](#6-performance)
7. [Error Handling](#7-error-handling)
8. [Component Opportunities](#8-component-opportunities)
9. [Documentation](#9-documentation)
10. [Priority Matrix](#10-priority-matrix)

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

### 1.3 Filter JavaScript Logic — Two Divergent Implementations

**Severity: Low**

Projects page uses a simple single-tag filter. Logs page adds a second author-dimension filter. The DOM querying and `data-*` reading patterns are copy-pasted boilerplate with different variable names.

**Fix:** Low priority. Extract a shared `filterByAttributes(selector, filters)` utility into `src/lib/filter.ts` if a third filterable list page is ever added.

---

### 1.4 Scrollbar Hiding — Sidebar Not Using Utility Class

**Severity: Low**

`pages/projects/[slug].astro` defines its own 8-line scrollbar-hide block for the sidebar instead of using the `.hide-scrollbar` utility class that already exists in `global.css`.

**Fix:** Add `class="hide-scrollbar"` to the sidebar `<aside>` and remove the duplicate CSS block.

---

## 2. TypeScript & Type Safety

### 2.1 Widespread Use of `any` — 10+ Locations

**Severity: High**

Every page uses `: any` in map callbacks instead of the proper types already defined in `src/lib/content.ts` and `src/lib/directus.ts`.

| File | Example |
|------|---------|
| `pages/index.astro` line 14 | `(p: any, i: number)` |
| `pages/projects/index.astro` line 9 | `(p: any, i: number)` |
| `pages/projects/index.astro` lines 22, 37, 47 | `(a: any)`, `(tag: any)`, `(project: any)` |
| `pages/logs/index.astro` lines 7, 86 | `(l: any)`, `(post: any)` |

**Fix:** Import and use existing types — e.g. `import type { Project } from "../lib/directus"`. The types exist — they just aren't imported.

---

### 2.2 Loose `any` Fields in Directus Type Definitions

**Severity: Medium**

`src/lib/directus.ts` defines `AboutSettings` with:

```typescript
stats?: any[];
experience?: any[];
skills?: any[];
```

But `AboutStats.astro`, `AboutTimeline.astro`, and `AboutStack.astro` each define their own interfaces internally (`StatItem`, `ExperienceItem`, `SkillCategory`).

**Fix:** Lift those interfaces into `directus.ts` and use them in `AboutSettings`:

```typescript
export interface StatItem { value: string; label: string; }
export interface ExperienceItem { year: string; role: string; company: string; }
export interface SkillCategory { name: string; items: { name: string; suffix?: string }[]; }
```

---

### 2.3 Unsafe Type Assertions in Canvas Code

**Severity: Low**

`HeroCanvas.astro` uses `!` non-null assertions on canvas context without null guards:

```typescript
const ctx = canvas.getContext("2d")!;
```

**Fix:**
```typescript
const canvas = document.getElementById("heroCanvas") as HTMLCanvasElement | null;
if (!canvas) return;
const ctx = canvas.getContext("2d");
if (!ctx) return;
```

---

### 2.4 Magic Numbers Without Named Constants

**Severity: Low**

`HeroCanvas.astro` has several unexplained numeric literals:

```typescript
const fov = 600;             // why 600?
trail.length > 18            // why 18?
(Math.random() - 0.5) * 1200 // viewport assumption
```

**Fix:** Extract to named constants with brief comments:

```typescript
const FOV         = 600;  // perspective focal length (px)
const TRAIL_LEN   = 18;   // cursor trail history length
const SPAWN_RANGE = 1200; // initial spread (matches hero width at 1440px)
```

---

## 3. CSS — Inconsistencies & Token Gaps

### 3.1 Inconsistent Transition Values

**Severity: Low**

CSS variable `--transition-speed` is defined in `global.css` but rarely used. Most components inline their own values:

| Usage | File |
|-------|------|
| `transition: all 0.2s` | `pages/projects/index.astro` |
| `transition: background 0.25s ease` | `pages/logs/index.astro` |
| `transition: filter 0.3s` | `global.css` |

**Fix:** Extend the token set:

```css
:root {
  --transition-fast:   0.2s ease;
  --transition-normal: 0.3s ease;
  --transition-slow:   0.5s ease;
}
```

Then use consistently rather than inlining.

---

### 3.2 Duplicate Logo Accent Style

**Severity: Low**

`.dd-logo-accent { fill: #fd2e00; }` is defined in both `global.css` and `components/Logo.astro`. The component-scoped version is redundant.

**Fix:** Remove the duplicate from `Logo.astro`.

---

### 3.3 Inline `style` Attributes in Templates

**Severity: Low**

Some templates use `style="color:var(--text-secondary);"` inline rather than a class:

| File | Line |
|------|------|
| `pages/index.astro` | 43, 71 |
| `pages/logs/index.astro` | 105 |
| `components/blog/RelatedLogs.astro` | 24–25 |

**Fix:** The global `.meta-text` class already exists. Where these elements also have `class="meta-text"`, the inline style is redundant — remove it.

---

### 3.4 `theme-color` Meta Only Covers Dark Mode

**Severity: Low**

`MainLayout.astro` has:

```html
<meta name="theme-color" content="#111111" />
```

This sets the browser address-bar color to dark even when the user is in light mode.

**Fix:** Use `media` attribute to provide both:

```html
<meta name="theme-color" content="#111111" media="(prefers-color-scheme: dark)" />
<meta name="theme-color" content="#F2F2F7" media="(prefers-color-scheme: light)" />
```

---

## 4. Social Sharing & SEO

### 4.1 `PUBLIC_DIRECTUS_URL` vs `DIRECTUS_PUBLIC_URL` — Name Confusion

**Severity: Medium (documentation/ops)**

These are two completely different things that look similar:

| Variable | Where | Purpose |
|----------|-------|---------|
| `DIRECTUS_PUBLIC_URL` | **Directus backend** env var | Tells Directus its own public URL for admin UI, file links in emails, etc. |
| `PUBLIC_DIRECTUS_URL` | **Astro frontend** env var (our code) | Tells the frontend what public URL to use when building `/assets/` URLs for social crawlers |

In `src/lib/directus.ts` the frontend looks for `PUBLIC_DIRECTUS_URL` (our var), falling back to `DIRECTUS_URL`. Since `DIRECTUS_URL=https://api.data-dreamer.net` is already set to the public domain in Coolify, the fallback works correctly and **you do not need to set `PUBLIC_DIRECTUS_URL` separately**.

**Fix:** Add a comment to `directus.ts` at the `PUBLIC_DIRECTUS_URL` declaration:

```typescript
// PUBLIC_DIRECTUS_URL = public-facing Directus URL for asset links visible to browsers/crawlers.
// Falls back to DIRECTUS_URL. Note: Directus's own DIRECTUS_PUBLIC_URL env var is a different,
// unrelated setting used by the Directus backend itself.
const PUBLIC_DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL ?? ...
```

---

### 4.2 Missing `article:author` on Article Pages

**Severity: Low**

`ogType="article"` pages (projects, logs) emit `article:published_time` but not `article:author`. Facebook and LinkedIn use this for rich attribution.

**Fix:** Add to `MainLayout.astro` props and template:

```typescript
// Props
articleAuthor?: string; // e.g. "Atef Alvi"

// Template (after article:published_time)
{ogType === "article" && articleAuthor && (
    <meta property="article:author" content={articleAuthor} />
)}
```

Then pass `articleAuthor="Atef Alvi"` from both slug pages.

---

### 4.3 No `sitemap.xml` — Consider Adding

**Severity: Medium**

Search engines (Google, Bing) use sitemaps to discover and prioritise pages. Astro has first-party support via `@astrojs/sitemap`.

**Fix:**

```bash
npm install @astrojs/sitemap
```

```javascript
// astro.config.mjs
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://data-dreamer.net',
  integrations: [sitemap()],
  ...
});
```

This auto-generates `/sitemap.xml` at build time. Then re-add the `Sitemap:` line to `robots.txt`.

---

### 4.4 `og:type` for Project Pages — Verify After Deploy

**Severity: Low (verification)**

`opengraph.xyz` showed `og:type: website` for a project page when it should be `article`. The code is correct (`ogType="article"` in `[slug].astro`). This may have been a caching artefact or the opengraph.xyz display normalising the value. Verify after the next Coolify deploy completes using:

```
https://www.opengraph.xyz/url/https%3A%2F%2Fdata-dreamer.net%2Fprojects%2Ftableau-waterfall-chart-gantt-method
```

---

## 5. Accessibility

### 5.1 `prefers-reduced-motion` Not Respected

**Severity: Medium**

`HeroCanvas.astro` and `MainLayout.astro` (cursor trail) run continuous canvas animations via `requestAnimationFrame`. Users who set `prefers-reduced-motion: reduce` still get the full animations.

**Fix:**

```typescript
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reducedMotion) {
  drawCursor(); // only start the loop if motion is OK
}
```

For the hero canvas, the static fallback could simply render the grid at rest with no node movement.

---

### 5.2 Missing `loading` / `fetchpriority` on Hero Images

**Severity: Low**

`pages/projects/[slug].astro` featured image has no loading attribute:

```html
<img src={imageUrl} alt={title} />
```

**Fix:** This is the largest above-the-fold image — tell the browser to load it eagerly at high priority:

```astro
<img src={imageUrl} alt={title} loading="eager" fetchpriority="high" />
```

---

## 6. Performance

### 6.1 No `srcset` / Responsive Images

**Severity: Low**

Project thumbnails and featured images are served at full Directus resolution. On mobile, a 2000px image displayed at 300px wastes significant bandwidth.

Directus supports image transforms via URL params. `getAssetUrl()` already handles this for OG images — extend it for display use:

```typescript
// src/lib/directus.ts
export function getAssetUrl(id: string, width?: number, format = 'webp'): string {
  const base = `${PUBLIC_DIRECTUS_URL}/assets/${id}`;
  return width ? `${base}?width=${width}&quality=80&format=${format}` : base;
}
```

Then `getAssetUrl(cover_image, 800)` for cards and `getAssetUrl(cover_image, 1400)` for hero images.

---

### 6.2 `JSON.stringify` for Tag Data Attributes

**Severity: Low**

`pages/projects/index.astro` serialises tag arrays to JSON in `data-tags` attributes, then `JSON.parse`s them in JS. This adds unnecessary overhead.

**Fix:** Use comma-separated values instead:

```astro
data-tags={project.tags.map(t => t.toLowerCase()).join(",")}
```

```javascript
const tags = card.dataset.tags?.split(",") ?? [];
```

---

## 7. Error Handling

### 7.1 Silent Empty State When Directus Fails

**Severity: Medium**

`pages/projects/index.astro` and `pages/logs/index.astro` both call fetch functions that return `[]` on error. When empty, the page silently renders a blank grid — no message, no indication something is wrong.

**Fix:**

```astro
{projects.length === 0 ? (
  <p class="empty-state">// NO PROJECTS FOUND — CHECK BACK SOON.</p>
) : (
  projects.map(project => <ProjectCard ... />)
)}
```

---

### 7.2 Two Similar Pull Quote Components

**Severity: Low**

`components/blog/PullQuote.astro` and `components/blog/QuoteBlock.astro` both accept a `text` prop and render it via `set:html`. One appears to be an older version of the other.

**Fix:** Grep for which one is actually imported anywhere, delete the unused one. If both are used, merge into one component with an optional `variant` prop.

---

## 8. Component Opportunities

### 8.1 Author Meta Block — Extract to Component

The author chip (avatar + initials fallback + label + name) is rendered identically in `logs/[slug].astro` and `projects/[slug].astro`.

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

### 8.2 Page Hero Header — Extract to Component

The `// META_LABEL` + title + optional subtitle pattern appears on at least 4 pages.

**Suggested:** `src/components/PageHero.astro`

```astro
---
interface Props {
  label: string;
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

## 9. Documentation

### 9.1 Add JSDoc to Public Lib Functions

`src/lib/directus.ts` exports `fetchProjects`, `fetchLogs`, `fetchAbout`, etc. with no JSDoc. Adding brief `/** */` comments explaining return shapes and error behaviour takes minutes.

---

## 10. Priority Matrix

| # | Issue | File(s) | Effort | Impact |
|---|-------|---------|--------|--------|
| 1 | `any` types throughout pages | all pages | Low | High |
| 2 | Author formatting duplicated 3× | slug pages | Low | Medium |
| 3 | Date formatting inconsistency | 3 pages | Low | Low |
| 4 | `prefers-reduced-motion` ignored | HeroCanvas, MainLayout | Low | Medium |
| 5 | Silent empty state (Directus fail) | index pages | Low | Medium |
| 6 | `PUBLIC_DIRECTUS_URL` comment | `directus.ts` | Trivial | Medium |
| 7 | Add sitemap.xml generation | `astro.config.mjs` | Low | Medium |
| 8 | `article:author` meta tag | MainLayout + slug pages | Low | Low |
| 9 | `theme-color` light/dark split | MainLayout | Trivial | Low |
| 10 | Loose `any` in Directus type defs | `directus.ts` | Low | Medium |
| 11 | Responsive images (srcset) | `directus.ts` + cards | Medium | Medium |
| 12 | Canvas null guard | `HeroCanvas.astro` | Low | Low |
| 13 | Magic numbers in canvas | `HeroCanvas.astro` | Low | Low |
| 14 | Inconsistent transition tokens | global.css + components | Low | Low |
| 15 | Sidebar scrollbar hide → `.hide-scrollbar` | `projects/[slug].astro` | Trivial | Low |
| 16 | Duplicate logo accent style | `Logo.astro` | Trivial | Low |
| 17 | Inline style attrs redundant | 3 files | Low | Low |
| 18 | JSON.stringify → comma-split | `projects/index.astro` | Low | Low |
| 19 | PullQuote/QuoteBlock duplication | blog components | Low | Low |
| 20 | JSDoc for lib functions | `directus.ts`, `content.ts` | Low | Low |
| 21 | `og:type: article` — verify after deploy | — | Trivial | Low |
| 22 | `fetchpriority="high"` on hero image | `projects/[slug].astro` | Trivial | Low |
| 23 | AuthorChip component | blog components | Low | Low |
| 24 | PageHero component | pages | Low | Low |

---

## Appendix — Completed Items (Session 1 + 2)

The following issues from the original review have been resolved:

| Item | Fix Applied |
|------|------------|
| Post meta grid CSS duplicated | Moved to `global.css` |
| Filter button CSS duplicated | Moved to `global.css` |
| Hardcoded `#999`/`#eee` in projects/slug & AboutStack | Replaced with CSS vars |
| Empty `<style>` block in `about.astro` | Deleted |
| XSS via `set:html` in `AboutStack.astro` | Replaced with safe JSX map |
| `allowDangerousHtml` uncommented | Comment added in `renderMarkdown.ts` |
| Lightbox `alt` not set before display | Fixed — alt set before src, aria-live added |
| Filter buttons missing `aria-pressed` | Added with JS toggle |
| `excerpt` mapped but unused in logs/index | Removed from map |
| Resume button shows even with no file | Conditionally rendered only when `resumeId` exists |
| `display=swap` missing | Already present in global.css `@import` |
| `:::imagegrid` undocumented | Added to `AGENT_BLOG_GUIDE.md` |
| Blue links in blog/project content | Added `.blog-content a { color: var(--accent) }` to global.css |
| Mobile hero-actions buttons overflow | `flex-direction: column` at ≤540px in `AboutHero.astro` |
| `localStorage` crash in Messenger/in-app browsers | Wrapped in try/catch in `MainLayout.astro` |
| Social crawlers blocked (Cloudflare Bot Fight Mode) | `robots.txt` + WAF bypass rule + Bot Fight Mode disabled |
| Missing OG meta tags | Added `og:locale`, `og:image:type`, `og:image:secure_url`, `og:image:alt`, `article:published_time`, `twitter:image:alt` |
| Directus asset URL not validated as public | `isPublicHttpsUrl()` + Directus image transforms in `projects/[slug].astro` |
| `robots.txt` referenced non-existent sitemap | Removed sitemap line |
