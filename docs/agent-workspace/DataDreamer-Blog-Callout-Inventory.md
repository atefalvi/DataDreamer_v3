# DataDreamer Blog Callout Inventory

Read-only investigation. No source files changed. All paths relative to repo root; frontend
code under `frontend/src/`.

---

## 1. Executive summary

DataDreamer renders blog bodies from **Directus markdown** through a **unified (remark →
rehype)** pipeline in `frontend/src/lib/markdown/`. The single entry point is
`renderMarkdown()` (`lib/markdown/renderMarkdown.ts`), called by `mapPost()` in
`lib/repositories/_mappers.ts`, producing `post.bodyHtml` (+ `headings`, `readingMinutes`).
The blog page injects that HTML with `set:html` and layers CSS (`styles/prose.css`) and two
JS enhancers (`components/blog/ArticleEnhancements.astro`, `lib/markdown/codeCopy.ts`).

Rich blocks use a **custom `:::type … :::` fence** (not `remark-directive`), parsed in
`lib/markdown/blocks.ts` and turned into HTML by handlers in `lib/markdown/rehype.ts`.

**Supported today:** 8 callout types (note, info, tip, warning, caution, important, example,
technical), plus `details` (accordion), `quote` (pull quote), and `imagegrid` (with
lightbox). Standard GFM gives tables (auto-wrapped in a scroll region), fenced code blocks
(Shiki highlight + copy button), images (auto `<figure>` + caption), task-list checkboxes,
and `---` dividers.

**Notable factual defects found (not fixed):**
- `:::details` outputs `class="expand"`, but `prose.css` styles `details.expand-block` — the
  container/summary styling does **not** apply (only `.expand-content` matches).
- Image-grid presence is detected by string sniff `bodyHtml.includes('class="image-grid"')`
  in `pages/blog/[slug].astro`; brittle to any class/attr-order change.

---

## 2. Rendering pipeline map

```
Directus post row (.content markdown)
  → lib/repositories/posts.ts            (loads row, article fields incl. content)
  → lib/repositories/_mappers.ts mapPost() : renderMarkdown(row.content)
  → lib/markdown/renderMarkdown.ts        (unified pipeline, below)
      1. wysiwygNormalize()               blocks.ts  — clean WYSIWYG HTML, isolate ::: fences
      2. remarkParse → remarkGfm          standard markdown + GFM (tables, task lists, ~strike)
      3. remarkCustomBlocks()             blocks.ts  — ::: fences → `customBlock` mdast nodes
      4. remarkRehype (+markdownBlockHandlers)  rehype.ts — customBlock → callout/details/quote/imagegrid HTML
      5. rehypeRaw                        allow raw inline HTML from authors
      6. rehypeSlug + rehypeCollectHeadings + rehypeAutolinkHeadings   headings + "#" anchors
      7. rehypeMarkCodeLanguages → rehypeCodeBlocks → rehypeShiki      code header/copy + highlight
      8. rehypeTableScrollRegions         wrap <table> in .table-scroll region
      9. rehypeImageFigures               standalone <img> → <figure>(+figcaption); Directus URL transform
     10. rehypeStringify                  → HTML string
  → { html, headings, readingMinutes }  →  post.bodyHtml
  → pages/blog/[slug].astro:232  <div class="blog-content article-prose" data-article-prose set:html={post.bodyHtml} />
  → styles/prose.css                     (all block styling; scoped to .prose AND .blog-content)
  → components/blog/ArticleEnhancements.astro  (lightbox + initCodeCopy)
     + lib/markdown/codeCopy.ts           (copy-to-clipboard)
  → components/blog/ArticleToc.astro      (renders post.headings)
```

---

## 3. File inventory

| File | Purpose | Relevant exports / symbols | Why it matters |
|---|---|---|---|
| `lib/markdown/renderMarkdown.ts` | Pipeline orchestrator | `renderMarkdown()`, `readingMinutes()` | Single place all markdown → HTML happens (blog, projects, guides, bios) |
| `lib/markdown/blocks.ts` | `:::` fence parsing + WYSIWYG cleanup | `wysiwygNormalize()`, `remarkCustomBlocks()`, `parseBlockOpen()`, `transformBlockChildren()` | Defines authoring syntax + which blocks exist |
| `lib/markdown/rehype.ts` | Block HTML generation + rehype plugins | `markdownBlockHandlers` (`customBlock`), `rehypeImageFigures`, `rehypeMarkCodeLanguages`, `rehypeCodeBlocks`, `rehypeTableScrollRegions`, `rehypeCollectHeadings`, `calloutElement()`, `imageEntries()` | Maps each block type to its exact output HTML/classes |
| `lib/markdown/types.ts` | Shared types + block registry | `calloutTypes` (8), `MarkdownBlockType`, `walk()`, `Heading`, `RenderedMarkdown` | Canonical list of callout types + AST walker |
| `lib/markdown/icons.ts` | Callout icons | `getCalloutIcon()`, `calloutIcons` map | Inlines lucide-static SVGs into callout headers |
| `lib/markdown/images.ts` | Directus asset URL transform | `transformMarkdownImageUrl()` | Adds width/format/quality params to Directus `/assets/` images |
| `lib/markdown/codeCopy.ts` | Code copy enhancer | `initCodeCopy()` | Clipboard copy for `.code-block__copy`; shared blog + projects |
| `lib/repositories/_mappers.ts` | Directus row → view-model | `mapPost()` (async) sets `bodyHtml`,`headings`,`readingMinutes` | Where `post.bodyHtml` is generated |
| `lib/repositories/posts.ts` | Post loading | article field set incl. `content` | Supplies the markdown source |
| `types/content.ts` | View-model types | `Post` (`bodyHtml`, `headings`, `readingMinutes`) | Contract consumed by the page |
| `pages/blog/[slug].astro` | Article route | injects `bodyHtml`; `hasImageGrid` sniff (l.133); renders `ArticleToc`, `ArticleEnhancements` | Host of the rendered HTML + enhancement wiring |
| `styles/prose.css` | Prose + block styling | `.callout*`, `.code-block*`, `.table-scroll`, `.image-grid*`, `.ig-item`, `.pull-quote`, `.expand-content`, `details.expand-block` | All visual styling of blocks |
| `components/blog/ArticleEnhancements.astro` | Runtime JS | `<dialog data-article-lightbox>`; queries `.ig-item`; calls `initCodeCopy()` | Image-grid lightbox + code copy |
| `components/blog/ArticleToc.astro` | TOC | consumes `post.headings` | Renders h2/h3 nav |
| `lib/markdown/__fixtures__/agent-blog-guide-syntax.md` | Authoring reference | all `:::` examples | Canonical syntax examples |

---

## 4. Supported blocks / callouts

Authoring fence (from `blocks.ts` `parseBlockOpen` regex):
`:::type Title text` **or** `:::type{title="Title text"}` … content … `:::`
(Title optional; callouts default the title to sentence-cased type.)

| Block/Callout | Supported | Authoring syntax | Generated HTML / classes | Parser/generator | Styling | JS dep | Notes |
|---|---|---|---|---|---|---|---|
| note | ✅ | `:::note Title` | `<aside class="callout callout--note" role="note" aria-label>` → `.callout__header`(icon+`.callout__title`)+`.callout__body` | blocks.ts → rehype.ts `calloutElement` | prose.css 377–479 | none | icon `sticky-note` |
| info | ✅ | `:::info` | `.callout--info` | same | same | none | icon `info` |
| tip | ✅ | `:::tip` | `.callout--tip` | same | same | none | icon `lightbulb` |
| warning | ✅ | `:::warning` | `.callout--warning` | same | same | none | icon `triangle-alert` |
| caution | ✅ | `:::caution` | `.callout--caution` | same | same | none | icon `octagon-alert` |
| important | ✅ | `:::important` | `.callout--important` | same | same | none | icon `message-square-warning` |
| example | ✅ | `:::example` | `.callout--example` | same | same | none | icon `flask-conical` |
| technical | ✅ | `:::technical` | `.callout--technical` | same | same | none | icon `cpu` |
| insight | ❌ | — | — | — | — | — | not a type; nearest = note/tip. Additive to add |
| quote / pull quote | ✅ | `:::quote` … `:::` | `<figure class="pull-quote"><blockquote>…` | rehype.ts customBlock | prose.css 528+ | none | title ignored |
| details / accordion | ⚠️ partial | `:::details Title` … `:::` | `<details class="expand"><summary>Title</summary><div class="expand-content">` | rehype.ts customBlock | prose.css `details.expand-block` (❌ mismatch), `.expand-content` (✅) | native `<details>` | **class mismatch**: CSS targets `.expand-block`, output is `.expand` → container/summary unstyled |
| image grid | ✅ | `:::imagegrid` + `![alt](url)` lines + `:::` | `<div class="image-grid" data-count="N">` of `<button class="ig-item" data-src data-index aria-label><img loading=lazy decoding=async></button>` | rehype.ts customBlock `imageEntries` | prose.css 554+ | lightbox (ArticleEnhancements) | see §5 |
| image (single) | ✅ | `![alt](url "caption")` | standalone `<p><img>` → `<figure><img loading=lazy decoding=async>[<figcaption>title</figcaption>]` | rehype.ts `rehypeImageFigures` | prose.css | none | caption from markdown *title*; empty alt → `role="presentation"` |
| code block | ✅ | ` ```lang ` fence | `<div class="code-block"><div class="code-block__header"><span class="code-block__language">…</span><button class="code-block__copy" data-code-copy>…</button></div><pre tabindex="0">` (Shiki dual-theme) | rehype.ts `rehypeCodeBlocks`+`rehypeMarkCodeLanguages`+rehypeShiki | prose.css 187–283 | `codeCopy.ts` | light `github-light-default` / dark `github-dark-default` |
| table | ✅ | GFM `\| … \|` | `<div class="table-scroll" role="region" tabindex="0"><table>` | rehype.ts `rehypeTableScrollRegions` (GFM parse) | prose.css 317+ | none | horizontal scroll region |
| checklist | ⚠️ partial | GFM `- [ ]` / `- [x]` | `<li><input type="checkbox" disabled>` | remarkGfm | prose.css (generic list) | none | renders but no dedicated checklist styling |
| divider | ✅ | `---` | `<hr>` | remarkParse | prose.css (generic) | none | native rule |
| details (native HTML) | ✅ | raw `<details>` | passthrough | rehypeRaw | as authored | native | raw HTML allowed (trusted authors) |
| embed | ❌ | — | (only via raw HTML `<iframe>` if author writes it) | rehypeRaw passthrough | — | none | no first-class embed block |
| steps | ❌ | — | — | — | — | — | not supported |
| metric / stat | ❌ | — | — | — | — | — | not supported |
| citation / source | ❌ | — | — | — | — | — | only generic `>` blockquote / `:::quote` |

**Nesting rules (blocks.ts `transformBlockChildren`):** top-level blocks parse to depth 1;
`:::details` may contain nested content, but **callouts cannot nest inside callouts**
(guard: `depth > 0 && calloutTypes.includes(...)` bails). Unknown types (e.g. `:::mystery`)
are **not** matched (`supportedBlocks` set) and render as plain paragraphs.

---

## 5. Image-grid deep dive

- **Authoring:** `:::imagegrid` then one markdown image per line `![alt](url)`, then `:::`
  (fixture `agent-blog-guide-syntax.md` lines 67–71).
- **Conversion:** `rehype.ts` `markdownBlockHandlers.customBlock` → `imageEntries(node)` walks
  the block for `image` nodes, collecting `{ src: transformMarkdownImageUrl(url), alt }`.
- **Output classes:** `<div class="image-grid" data-count="N">`; each image is a
  **`<button class="ig-item" type="button" data-src data-index aria-label>`** wrapping
  `<img src alt loading="lazy" decoding="async">`.
- **Captions / alt:** markdown alt text → `img@alt` **and** the button `aria-label`
  (`Open image: <alt>` or `Open image N`). **No visible per-image caption in the grid.** A
  caption appears only in the lightbox as `"<i+1> / <n> - <alt>"` (ArticleEnhancements
  `show()`).
- **Lightbox discovery:** `ArticleEnhancements.astro` script queries
  `[data-article-prose] .ig-item`. The `<dialog data-article-lightbox>` is rendered **only
  when** `hasImageGrid` is true, set in `pages/blog/[slug].astro:133` via
  `post.bodyHtml.includes('class="image-grid"')`. Buttons open `dialog.showModal()`.
- **Layouts (prose.css 554+):** base grid is `repeat(auto-fit, minmax(min(12rem,100%), 1fr))`
  — so **2 / 3 / 4+ all flow responsively** (no explicit per-count rules). Only
  `data-count="1"` is special-cased (block, full width, natural aspect). `data-count` exists
  as an attribute but is used only for the `=1` case.
- **Mobile (<47.999rem, prose.css 678+):** grid switches to `display:flex; overflow-x:auto;
  scroll-snap-type:x mandatory` — a horizontal swipe carousel.
- **A11y:** ✅ each image is a real focusable `<button>` with `aria-label`; ✅ native
  `<dialog>` (focus trap, Esc); ✅ keyboard arrows + touch swipe + backdrop-click close in the
  lightbox; ⚠️ alt is duplicated into aria-label; ⚠️ no in-grid caption (caption is
  lightbox-only); ⚠️ lightbox nav buttons use text ("Prev/Next/Close"), not icons.

---

## 6. Code block / copy behavior

- **Generation (`rehype.ts` `rehypeCodeBlocks`):** each `<pre>` (not already wrapped) is
  wrapped in `<div class="code-block">` with a header: `.code-block__language` (from
  `rehypeMarkCodeLanguages` → `data-language` or `language-*` class, default `text`) and a
  `.code-block__copy` button carrying inline copy + check SVGs and an SR-only "Copy" label
  (`data-copy-label`). `<pre>` gets `tabindex="0"`.
- **Highlight:** `rehypeShiki` with dual themes `github-light-default` / `github-dark-default`
  (`defaultColor:false` → CSS variables switch by theme).
- **Copy JS (`lib/markdown/codeCopy.ts` `initCodeCopy`):** document-delegated, binds once
  (`documentElement.dataset.codeCopyBound`); copies `.code-block pre` textContent via
  Clipboard API with `execCommand` fallback (works on `http://localhost`); toggles
  `data-copied` (CSS swaps copy→check icon) and announces via `[data-code-copy-status]` live
  region (rendered in ArticleEnhancements). Called from `ArticleEnhancements.astro`.

---

## 7. TOC / headings behavior

- **Extraction:** `rehype.ts` `rehypeCollectHeadings` walks for `h2`/`h3` with an `id`
  (ids from `rehypeSlug`), pushing `{ id, text, depth }` to `file.data.headings`.
- **Anchors:** `rehypeAutolinkHeadings` appends a `#` link (`.heading-anchor`,
  aria-label "Link to section") to each heading.
- **Surfacing:** returned as `RenderedMarkdown.headings` → `post.headings` (`types/content.ts`)
  → rendered by `components/blog/ArticleToc.astro` at `pages/blog/[slug].astro:228`.
- **Depth:** only h2 (depth 2) and h3 (depth 3) collected; h4+ ignored.

---

## 8. Gaps vs a richer callout system

Not supported today (would be **new** blocks): `insight`, `steps`, `metric`/`stat`,
`citation`/`source`, first-class `embed`, styled `checklist`, styled `divider` variants.
Partial: `checklist` (GFM checkboxes render, unstyled); `details` (works but container
styling broken by class mismatch). No block-level custom attributes beyond `title=`. No
per-image caption in grids. No `columns=` control on image grids (layout is auto-fit).

---

## 9. Risk notes

1. **`details` class mismatch** — `rehype.ts` emits `class="expand"`; `prose.css` styles
   `details.expand-block`. Accordion container/summary is effectively unstyled. Factual bug.
2. **Image-grid detection by string sniff** — `bodyHtml.includes('class="image-grid"')`
   (`[slug].astro:133`). Any change to class output/order silently disables the lightbox.
3. **Raw HTML is allowed** — `remarkRehype allowDangerousHtml` + `rehypeRaw` +
   `rehypeStringify allowDangerousHtml`. Fine for trusted authors; an XSS surface if post
   content ever becomes untrusted.
4. **Callouts cannot nest in callouts** — by design; a "callout inside callout" author
   attempt degrades to plain content.
5. **Shared renderer** — `renderMarkdown` also serves projects, guides, and author bios
   (`_mappers.ts`). Any block change affects all four surfaces, not just blog.
6. **Additive changes are low-risk:** a new **callout type** = add to `calloutTypes`
   (`types.ts`) + `calloutIcons` (`icons.ts`) + `.callout--TYPE` (`prose.css`); the parser,
   handler, and a11y wrapper are generic. A new **block type** = add to `supportedBlocks`
   (`blocks.ts`) + a branch in `markdownBlockHandlers.customBlock` (`rehype.ts`) + CSS. No
   changes to auth/backend/deploy involved.

---

## 10. Files to share back (for MariaTheHR comparison)

Primary (parsing + generation + types):
- `frontend/src/lib/markdown/blocks.ts`
- `frontend/src/lib/markdown/rehype.ts`
- `frontend/src/lib/markdown/types.ts`
- `frontend/src/lib/markdown/renderMarkdown.ts`
- `frontend/src/lib/markdown/icons.ts`
- `frontend/src/lib/markdown/images.ts`
- `frontend/src/lib/markdown/codeCopy.ts`

Styling + runtime + wiring:
- `frontend/src/styles/prose.css` (callout/code/table/image-grid/pull-quote/expand blocks)
- `frontend/src/components/blog/ArticleEnhancements.astro`
- `frontend/src/components/blog/ArticleToc.astro`
- `frontend/src/pages/blog/[slug].astro`
- `frontend/src/lib/repositories/_mappers.ts` (`mapPost`) and `types/content.ts` (`Post`)

Reference / examples:
- `frontend/src/lib/markdown/__fixtures__/agent-blog-guide-syntax.md`
- `frontend/src/lib/markdown/__tests__/__snapshots__/renderMarkdown.test.ts.snap` (exact output HTML)
- `frontend/src/pages/dev/styleguide-prose.astro` (live block gallery)

---

## 11. Recommended next step (no implementation)

Diff DataDreamer's block set against MariaTheHR's using §4 as the checklist, then decide which
gaps to close **additively** — new callout types are trivial (three-file additive edit); new
structural blocks (steps/metric/citation) each need a `blocks.ts` registry entry, a
`rehype.ts` handler, and `prose.css` styling. Before any of that, note the two standalone
defects (§9.1 details class mismatch, §9.2 grid sniff) as separate small fixes. No code was
changed in this investigation.
