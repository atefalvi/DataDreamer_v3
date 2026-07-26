# Rich Content Blocks — DataDreamer Markdown Contract

This is the authoritative authoring contract for every DataDreamer field rendered by
`renderMarkdown()`. Agents must read this file before drafting a Post, Project, or
Field Guide. Do not infer block names from their visual appearance.

The contract applies to:

- `posts.content`
- `projects.body`
- `guides.why_this_path` and `guides.expected_outcome`
- `guide_sections.description`
- `guide_items.body`, `why_included`, `focus_on`, and `notes`
- author bios, although rich blocks should rarely be necessary there

## Block syntax

Every custom block uses an opening marker and a closing `:::` marker on separate
lines, with a blank line before and after the block:

```markdown
:::type Optional title
Block content.
:::
```

Titles can also use the explicit form:

```markdown
:::warning{title="Production constraint"}
This depends on an upstream service.
:::
```

Unknown block types are left visible as literal text for forward compatibility. Treat
that as an authoring error, not as a fallback design.

One nested custom-block level is supported. For example, a `warning` or `text` block
can sit inside `details`. Do not nest blocks more than one level deep.

## Callouts

Callouts accept normal Markdown, including paragraphs, emphasis, links, lists, and
fenced code. Use them to change the reader's attention, not as decoration.

| Type | Use for |
|---|---|
| `note` | Contextual side notes and small clarifications. |
| `info` | Neutral definitions, references, sources, and background. |
| `tip` | Reusable advice, shortcuts, optimizations, and best practices. |
| `warning` | Known failure modes, limitations, fragile assumptions, and operational risks. |
| `caution` | Destructive, irreversible, security-sensitive, or high-consequence actions. |
| `important` | Guidance the reader must understand before continuing. |
| `example` | A concrete or worked example that demonstrates the surrounding idea. |
| `technical` | Implementation detail worth keeping visible for technical readers. |

```markdown
:::warning Schema migration
Take a verified backup and run the schema diff before applying this change.
:::
```

Choose the least severe accurate type. Do not use `caution` for ordinary advice or
place several callouts back-to-back.

## Collapsible details

Use `details` for optional evidence, long logs, verbose configuration, tracebacks, or
implementation depth that would interrupt the main narrative. `detail` is accepted as
an alias, but use the canonical `details` spelling in new content.

````markdown
:::details Raw task log
```txt
attempt=2 status=success duration=03:12
```
:::
````

The title becomes the clickable summary. Normal Markdown and one nested custom-block
level are supported inside.

## Pull quote

Use `quote` for one short thesis-level statement, not for ordinary quotations or
testimonials.

```markdown
:::quote
Reliable data is a product of reliable decisions.
:::
```

Standard Markdown blockquotes (`> quoted text`) are also supported when the content
is a conventional quotation rather than an editorial pull quote.

## Checklist

Checklist bodies are parsed as plain text. Markdown formatting inside an item is not
rendered. Each line becomes one item and its first marker determines its state.

| Marker | State |
|---|---|
| `[x]` | Complete |
| `[ ]` | Pending |
| `!` | Risk |
| `?` | Open question |
| `*` | Highlight |
| `-` | Neutral |
| no marker | Neutral |

```markdown
:::checklist Release readiness
[x] Validate the schema diff.
[ ] Confirm the production backup.
! Do not deploy with unresolved permission errors.
? Has the rollback path been tested?
* Record the release decision.
:::
```

## Embedded media

Use `embed` with an iframe-ready HTTPS URL. The renderer is provider-independent: it
does not identify vendors, load vendor SDKs, or add vendor-specific query parameters.
It safely renders the URL in a lazy, sandboxed iframe.

```markdown
:::embed Product walkthrough
url: https://video.example.com/embed/VIDEO_ID
ratio: 16 / 9
source: https://video.example.com/watch/VIDEO_ID
:::
```

Supported fields:

| Field | Required | Purpose |
|---|---|---|
| `url` | Yes | The HTTPS URL intended for use inside an iframe. |
| `ratio` | No | Responsive ratio such as `16 / 9`, `4 / 3`, or `1 / 1`. Defaults to `16 / 9`. |
| `height` | No | Fixed dashboard height from `240` to `1600` pixels. On short screens it is capped at `78svh`. |
| `source` | No | Public source or full-screen URL. Renders as an external “Open original” link. |

For dashboards and other tall interactive work, use `height` instead of hard-coding
width in vendor JavaScript:

```markdown
:::embed Interactive operations dashboard
url: https://charts.example.com/embed/operations
height: 720
source: https://charts.example.com/reports/operations
:::
```

You may also paste a provider's standard `<iframe ...></iframe>` code. The renderer
extracts only its HTTPS `src`, width, and height; arbitrary attributes and scripts are
discarded. A normal share/watch page is not necessarily embeddable because providers
can block framing, so use the URL from their **Embed** action rather than the address
bar. Legacy `<object>…<script>` SDK snippets are intentionally not executed.

Do not place explanatory prose in the block body; put it immediately before or after
the embed. Keep a normal source link immediately after an important interactive chart
so the work remains reachable when a browser extension or corporate policy blocks
third-party frames. External Markdown links open in a new tab; relative and same-site
links retain normal in-site navigation.

## Metric

Use `metric` for one meaningful result and `metrics` for a small comparison set. These
blocks are for real measurements with context—not decorative statistics.

Supported fields:

| Field | Required | Values |
|---|---:|---|
| `value` | Yes | Display value such as `38%`, `4.2h`, or `Stable`. |
| `label` | Recommended | What was measured. |
| `caption` | Recommended | Scope, baseline, period, or qualification. |
| `symbol` | No | Literal symbol or a supported word such as `up`, `down`, `neutral`, `check`, `warning`, `question`, or `star`. |
| `tone` | No | `green`, `red`, `yellow`, `blue`, or `neutral`. Default: `neutral`. |

```markdown
:::metric
label: Build time
value: 38% lower
caption: Compared with the previous transformation pipeline.
symbol: down
tone: green
:::
```

Separate cards inside `metrics` with a line containing exactly `---`:

```markdown
:::metrics Delivery snapshot
label: Lead time
value: 2.4 days
symbol: down
tone: green

---

label: Failed changes
value: 1.8%
symbol: neutral
tone: blue
:::
```

Metric bodies are plain-text fields; Markdown is not rendered inside their values.

## Formula

Use `formula` for a display equation with an optional caption. The `value` is KaTeX
syntax and is parsed as plain text.

```markdown
:::formula Renewal rate
value: \text{Renewal Rate} = \frac{\text{Renewed Accounts}}{\text{Eligible Accounts}} \times 100
caption: Keep the denominator definition stable across reporting periods.
:::
```

Standard inline `$E = mc^2$` and display `$$...$$` math are also supported.

## Image and image grid

Use normal Markdown for one image. Alt text is required; the optional title becomes a
visible caption.

```markdown
![Pipeline run timeline](https://api.data-dreamer.net/assets/FILE_UUID "Successful run after retry")
```

Use `imagegrid` for related screenshots or a before/after comparison. An optional
block title becomes the grid caption.

```markdown
:::imagegrid Before and after
![Dashboard before filtering](https://api.data-dreamer.net/assets/FILE_UUID_1 "Before")
![Dashboard after filtering](https://api.data-dreamer.net/assets/FILE_UUID_2 "After")
:::
```

The grid opens images in a lightbox on Posts and Projects. Every image still needs
specific alt text. Prefer Directus asset URLs and avoid embedding temporary links.

## Text panel

Use `text` for a compact titled panel inside `details`, especially when optional
material needs its own subheading. It accepts normal Markdown.

```markdown
:::details Implementation notes
:::text Example payload
The API expects `status`, `slug`, and an existing author relation.
:::
:::
```

Avoid using several top-level text panels as a substitute for normal sections.

## Divider

Use `divider` only when a long page has a real conceptual transition that headings do
not communicate well.

Supported patterns are `---` (plain), `***` (star), and `-x-` (x). Supported tones
are `neutral`, `muted`, and `accent`.

```markdown
:::divider
label: Phase two
pattern: ***
tone: accent
:::
```

The short form uses the block title as the label:

```markdown
:::divider Next phase
:::
```

Divider bodies are parsed as plain-text fields.

## Standard Markdown that needs no custom block

- `##` and `###` headings receive subtle copy-link controls on hover or keyboard focus;
  Posts also build a table of contents from them.
- Fenced code should include a language name and receives syntax highlighting plus a copy button.
- GitHub-flavored tables receive a keyboard-focusable horizontal scroll region on narrow screens.
- Ordered lists, unordered lists, task lists, links, emphasis, and nested blockquotes work normally.
- Raw HTML is sanitized through the site's allow-list, but authors should use Markdown and documented blocks instead.

## Agent authoring rules

1. Start with the content structure and factual evidence; choose blocks only where they
   improve comprehension.
2. Use at least one appropriate rich-content block when the source contains a genuine
   warning, checklist, measurement, comparison, formula, optional detail, or visual.
   Do not manufacture a block merely to satisfy this rule.
3. For Projects, prefer `metrics`, `checklist`, `technical`, `warning`, `imagegrid`, and
   `details` where the case-study evidence supports them.
4. For Field Guides, rich blocks are most useful in `why_this_path`, section
   descriptions, inline item bodies, and curator notes. Keep annotations concise.
5. Keep every `:::` marker on its own line. Validate the rendered result before moving
   content to `in_review`.
6. Never emit undocumented block names, unsupported tones, placeholder asset IDs, or
   invented measurements.

The executable examples live in
`frontend/src/lib/markdown/__fixtures__/agent-blog-guide-syntax.md` and
`frontend/src/lib/markdown/__fixtures__/rich-content-blocks.md`; the renderer tests are
the final source of truth when documentation and code disagree.
