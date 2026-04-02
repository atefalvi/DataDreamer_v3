# CODE REVIEW — DATA DREAMER FRONTEND

> Last updated: 2026-04-02 (session 3 — full polish pass, spacing audit)
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
8. [Documentation](#8-documentation)
9. [Priority Matrix](#9-priority-matrix)

---

## 1. Code Duplication

### 1.3 Filter JavaScript Logic — Two Divergent Implementations

**Severity: Low**

Projects page uses a simple single-tag filter. Logs page adds a second author-dimension filter. The DOM querying and `data-*` reading patterns are copy-pasted boilerplate with different variable names.

**Fix:** Low priority. Extract a shared `filterByAttributes(selector, filters)` utility into `src/lib/filter.ts` if a third filterable list page is ever added.

---

## 2. TypeScript & Type Safety

### 2.3 Unsafe Type Assertions in directus.ts Internal Calls

**Severity: Low**

`fetchProjects`, `fetchLogs`, etc. use `as any` in `fields` arguments passed to the Directus SDK's `readItems`. This is a Directus SDK limitation (field arrays aren't perfectly typed), not user code — low priority.

---

## 3. CSS — Inconsistencies & Token Gaps

No remaining high-priority items. All transition tokens, logo duplication, and sidebar scrollbar issues resolved.

---

## 4. Social Sharing & SEO

### 4.4 `og:type` for Project Pages — Verify After Deploy

**Severity: Low (verification)**

`opengraph.xyz` previously showed `og:type: website` for a project page when it should be `article`. The code is correct (`ogType="article"` in `[slug].astro`). Verify after the next Coolify deploy using:

```
https://www.opengraph.xyz/url/https%3A%2F%2Fdata-dreamer.net%2Fprojects%2Ftableau-waterfall-chart-gantt-method
```

---

## 5. Accessibility

No remaining high-priority items.

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

## 7. Error Handling

No remaining items.

---

## 8. Documentation

No remaining items.

---

## 9. Priority Matrix

| # | Issue | File(s) | Effort | Impact |
|---|-------|---------|--------|--------|
| 1 | Filter JS duplication (projects vs logs) | index pages | Low | Low |
| 2 | `as any` in Directus SDK `fields` args | `directus.ts` | Low | Low (SDK limitation) |
| 3 | Responsive images (`srcset`) | `directus.ts` + cards | Medium | Medium |
| 4 | `og:type: article` — verify after deploy | — | Trivial | Low |

---

## Appendix — Completed Items (Sessions 1–3)

| Item | Fix Applied | Session |
|------|------------|---------|
| Post meta grid CSS duplicated | Moved to `global.css` | 1 |
| Filter button CSS duplicated | Moved to `global.css` | 1 |
| Hardcoded `#999`/`#eee` in projects/slug & AboutStack | Replaced with CSS vars | 1 |
| Empty `<style>` block in `about.astro` | Deleted | 1 |
| XSS via `set:html` in `AboutStack.astro` | Replaced with safe JSX map | 1 |
| `allowDangerousHtml` uncommented | Comment added in `renderMarkdown.ts` | 1 |
| Lightbox `alt` not set before display | Fixed — alt set before src, aria-live added | 1 |
| Filter buttons missing `aria-pressed` | Added with JS toggle | 1 |
| `excerpt` mapped but unused in logs/index | Removed from map | 1 |
| Resume button shows even with no file | Conditionally rendered only when `resumeId` exists | 1 |
| `display=swap` missing | Already present in global.css `@import` | 1 |
| `:::imagegrid` undocumented | Added to `AGENT_BLOG_GUIDE.md` | 1 |
| Blue links in blog/project content | Added `.blog-content a { color: var(--accent) }` to global.css | 1 |
| Mobile hero-actions buttons overflow | `flex-direction: column` at ≤540px in `AboutHero.astro` | 1 |
| `localStorage` crash in Messenger/in-app browsers | Wrapped in try/catch in `MainLayout.astro` | 1 |
| Social crawlers blocked (Cloudflare Bot Fight Mode) | `robots.txt` + WAF bypass rule + Bot Fight Mode disabled | 2 |
| Missing OG meta tags | Added `og:locale`, `og:image:type`, `og:image:secure_url`, `og:image:alt`, `article:published_time`, `twitter:image:alt` | 2 |
| Directus asset URL not validated as public | `isPublicHttpsUrl()` + Directus image transforms in `projects/[slug].astro` | 2 |
| `robots.txt` referenced non-existent sitemap | Removed sitemap line (re-added in session 3 once sitemap generation configured) | 2 |
| `PUBLIC_DIRECTUS_URL` vs `DIRECTUS_PUBLIC_URL` confusion | Full comment block added in `directus.ts`; env vars verified correct in Coolify | 2 |
| `any` types throughout pages (10+ locations) | Replaced with `Project`, `Log` types from directus.ts | 3 |
| Author formatting duplicated 3× | `formatAuthorName()` + `getAuthorInitials()` exported from `content.ts` | 3 |
| Date formatting inconsistency | `formatDate()` exported from `content.ts` and used on all pages | 3 |
| `prefers-reduced-motion` not respected | Canvas + cursor trail gated on `matchMedia` check | 3 |
| Silent empty state on Directus failure | Added empty state to `projects/index.astro` (logs/index already had one) | 3 |
| Add sitemap.xml generation | `@astrojs/sitemap` configured in `astro.config.mjs`; `Sitemap:` re-added to `robots.txt` | 3 |
| Missing `article:author` meta | Added `articleAuthor` prop + `<meta property="article:author">` in `MainLayout.astro` | 3 |
| `theme-color` only dark mode | Split into two `<meta name="theme-color">` with `media` attribute for light/dark | 3 |
| Loose `any[]` in `AboutSettings` | `StatItem`, `ExperienceItem`, `SkillItem`, `SkillCategory` lifted to `directus.ts` | 3 |
| Canvas null guard (`!` assertion) | `if (!canvas) throw` + `if (!ctx) throw` added to `HeroCanvas.astro` | 3 |
| Magic numbers in canvas | `FOV`, `TRAIL_LEN`, `SPAWN_RANGE` named constants in `HeroCanvas.astro` | 3 |
| Inconsistent transition tokens | `--transition-fast`, `--transition-normal`, `--transition-slow` added to `global.css` | 3 |
| Sidebar scrollbar hide duplicated | Removed duplicate block; added `.hide-scrollbar` class to sidebar `<aside>` | 3 |
| Duplicate `.dd-logo-accent` style | Removed from `Logo.astro`; kept only in `global.css` | 3 |
| Inline `style` attrs redundant | Removed from `index.astro`, `logs/index.astro`, `RelatedLogs.astro` | 3 |
| `JSON.stringify` tag data attributes | Switched to comma-separated `data-tags` + `.split(",")` in `projects/index.astro` | 3 |
| `PullQuote` / `QuoteBlock` duplication | Deleted `QuoteBlock.astro` (unimported); `PullQuote.astro` retained | 3 |
| `fetchpriority="high"` on hero image | Added `loading="eager" fetchpriority="high"` to project featured image | 3 |
| `AuthorChip` component extract | Created `src/components/blog/AuthorChip.astro`; used in both slug pages | 3 |
| `PageHero` component extract | Created `src/components/PageHero.astro`; used in projects/index + logs/index | 3 |
| `--nav-h` token mismatch (64px vs 56px) | Fixed to `56px` in `global.css` | 3 |
| Featured image dark mode background | `#f5f5f5` → `var(--bg-muted)` in `projects/[slug].astro` | 3 |
| Mobile teaser padding too large | Added `padding: 48px` at ≤768px for `.teaser-section` in `index.astro` | 3 |
| About component interfaces duplicated | `StatItem`, `ExperienceItem`, `SkillCategory` imported from `directus.ts` instead of re-declared | 3 |
