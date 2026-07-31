# Agent Custom Callouts Guide

Source of truth for rich Markdown in Posts, Projects, and Field Guides. It owns block
syntax only; collection fields live in `docs/AGENT_CONTENT_TYPES_GUIDE.md` and cover
rules live in `docs/AGENT_COVER_IMAGE_GUIDE.md`.

## Universal syntax

Open a block on its own line, add the body, and close it with `:::` on its own line.

```markdown
:::note Optional title
Markdown body.
:::
```

`:::name{title="Optional title"}` is also accepted. The space-title form is preferred.
Block names are lowercase and exact. A missing closing fence leaves the text unstyled.

## Catalog

| Block | Use | Opener title | Body contract |
|---|---|---|---|
| `note` | Neutral context | Optional; defaults to “Note” | Markdown |
| `info` | Supporting information | Optional; defaults to “Info” | Markdown |
| `tip` | Practical shortcut | Optional; defaults to “Tip” | Markdown |
| `warning` | Failure mode or important risk | Optional; defaults to “Warning” | Markdown |
| `caution` | Destructive, security, or irreversible risk | Optional; defaults to “Caution” | Markdown |
| `important` | A rule the reader must retain | Optional; defaults to “Important” | Markdown |
| `example` | Representative input, output, or scenario | Optional; defaults to “Example” | Markdown |
| `technical` | Implementation detail | Optional; defaults to “Technical” | Markdown |
| `details` | Collapsible secondary material | Optional; defaults to “Details” | Markdown |
| `quote` | Editorial pull quote | Ignored | Markdown quotation |
| `text` | Bounded supporting prose panel | Optional | Markdown |
| `imagegrid` | Two or more related images with lightbox | Optional | Markdown images |
| `checklist` | State-coded task or review list | Optional | Plain marker lines |
| `embed` | Sandboxed HTTPS iframe | Optional | URL/config or pasted safe embed markup |
| `metric` | One compact measure | Optional | `key: value` fields |
| `metrics` | A group of measures | Optional | Metric records separated by `---` |
| `formula` | Display mathematics | Optional | LaTeX plus optional caption |
| `divider` | Deliberate section transition | Optional fallback label | Divider fields |
| `diagram` | Server-rendered flow or ERD | Optional fallback title | Diagram metadata and DSL |

`detail` is a compatibility alias for `details`; do not use it in new content.

## Callouts: `note`, `info`, `tip`, `warning`, `caution`, `important`, `example`, `technical`

- Attributes: optional opener title only.
- Body: normal Markdown—paragraphs, lists, links, inline code, fenced code, and images.
- Rendering: semantic `aside` card with a type-specific icon and treatment.
- Nesting: one custom block may be nested inside a top-level block. A third level is
  treated as literal content. Avoid nesting unless the hierarchy is essential.

Minimal:

```markdown
:::warning
Validate the row count before replacing the table.
:::
```

Practical:

````markdown
:::technical Calculation boundary
The display field and the aggregation field must remain separate.

```sql
select segment, sum(value) as total
from movements
group by segment;
```
:::
````

Use the narrowest truthful type. Do not turn ordinary paragraphs into decorative
callouts, and never use `caution` for a low-impact suggestion.

## `details`

- Attributes: optional opener title; defaults to “Details”.
- Body: normal Markdown; one nested custom block is supported.
- Rendering: closed native disclosure that the reader can expand.

```markdown
:::details Inspect the raw assumptions
- One fiscal year is selected.
- Region is treated as an independent slice.
:::
```

Do not hide information required to understand or safely perform the main task.

## `quote`

- Attributes: none; an opener title is accepted by the parser but is not rendered.
- Body: normal Markdown, ideally one short quotation. Attribution may be a final line.
- Rendering: editorial `figure` and `blockquote`.

```markdown
:::quote
Good analysis makes the decision boundary visible.

— Project retrospective
:::
```

Do not use it to enlarge an ordinary sentence or fabricate a quotation.

## `text`

- Attributes: optional opener title.
- Body: normal Markdown; one nested custom block is supported.
- Rendering: bounded text panel with an optional label.

```markdown
:::text Reading the result
Treat the final total as a checkpoint, not another movement.
:::
```

Use a callout instead when the content has a clear semantic state such as warning or tip.

## `imagegrid`

- Attributes: optional opener title.
- Body: Markdown images. Image title text becomes the lightbox caption.
- Rendering: responsive thumbnail grid; each item opens the full-size transformed asset.
- Nesting: do not nest custom blocks; non-image prose is ignored by the grid renderer.

```markdown
:::imagegrid Before and after
![Unfiltered chart](/images/before.webp "Before validation")
![Validated chart](/images/after.webp "After validation")
:::
```

Use meaningful alt text. Do not use a one-image grid; use a normal Markdown image.

## `checklist`

- Attributes: optional opener title.
- Body: plain text, one item per line. Markdown inside items is not parsed.
- Markers: `[x]` done, `[ ]` pending, `!` risk, `?` question, `*` highlight, `-` neutral.
- Rendering: state-coded list with accessible text labels.

```markdown
:::checklist Release gate
[x] Row counts reconciled
[ ] Mobile layout checked
! Confirm rollback ownership
? Has the publish date been approved?
:::
```

Do not indent sublists or use task-list Markdown outside these exact markers.

## `embed`

- Attributes: optional opener title.
- Body accepts one bare HTTPS URL; `url:`, `source:`, `height:`, and `ratio:` fields;
  an HTTPS `iframe`/`embed`/`object`; or a legacy object snippet with usable metadata.
- `height`: integer pixels from 240–1600. `ratio`: positive `width/height` or `width:height`.
- Rendering: lazy, sandboxed iframe. Scripts from pasted snippets are never executed.
  `source:` adds an “Open original” new-tab link.
- Nesting: none; body is plain text.

Minimal:

```markdown
:::embed Interactive model
https://example.org/public/view
:::
```

Practical:

```markdown
:::embed Interactive model
url: https://example.org/embed/model
source: https://example.org/model
ratio: 16/9
height: 720
:::
```

Only HTTPS is accepted. Prefer a direct embeddable URL; provider scripts, arbitrary
HTML, credentials, and unsafe protocols are discarded. Some hosts may still block
iframes through their own security headers—in that case keep a `source:` link.

## `metric` and `metrics`

- Attributes: optional opener title.
- Record fields: `value` (required), `label`, `caption`, `symbol`, `tone`.
- `tone`: `green`, `red`, `yellow`, `blue`, or `neutral`; unknown values become neutral.
- `symbol`: literal text or `up`, `down`, `neutral`, `right`, `check`, `warning`,
  `question`, or `star` and their common synonyms.
- `metrics` separates records with a line containing at least three hyphens.
- Body is plain text; Markdown is not parsed.

```markdown
:::metric Coverage
value: 98%
label: Valid records
caption: After the quality gate
symbol: up
tone: green
:::
```

```markdown
:::metrics Outcome snapshot
value: 38%
label: Lower cycle time
symbol: down
tone: green
---
value: 2
label: Manual handoffs
tone: neutral
:::
```

Do not use a metric for an unsupported claim; put scope or comparison context in
`caption`.

## `formula`

- Attributes: optional opener title.
- Body: a bare LaTeX expression, or `value:` plus optional `caption:`. Markdown is not parsed.
- Rendering: server-rendered KaTeX display math; invalid syntax is shown safely.

```markdown
:::formula Running total
value: R_t = R_{t-1} + \Delta_t
caption: Each movement is applied to the previous checkpoint.
:::
```

Do not include display delimiters such as `$$`; provide the expression itself.

## `divider`

- Attributes: optional opener title, used as the label when `label:` is absent.
- Fields: `label`; `tone` = `accent`, `neutral`, or `muted`; `pattern` = `---`, `***`, or `-x-`.
- Rendering: semantic separator. Invalid values fall back to neutral dashes.

```markdown
:::divider
label: Implementation
tone: accent
pattern: ---
:::
```

Use sparingly. Headings should carry most structure.

## `diagram`

Diagrams are parsed, laid out, and rendered to inline SVG on the server. Directus
stores only the raw source. The render cache identity is `sourceHash + rendererVersion`.
No browser-side graph library or layout runtime is used.

### Shared metadata

Metadata comes first, followed by one blank line and the diagram body.

| Key | Required | Values |
|---|---:|---|
| `type` | Yes | `flow` or `erd` |
| `title` | Recommended | Plain-text accessible title, up to 120 characters |
| `columns` | ERD only | Integer; clamped to 1–4, default 3 |

Supported color suffixes are `blue`, `yellow`, `orange`, `green`, and `purple`.
Unknown colors safely use the default style.

### Flow contract

- Connect nodes with `->`. A label ending in `?` is rendered as a decision.
- Indent branches by two spaces. The first token is the connector label (`yes`, `no`,
  `fallback`, and so on).
- Add a color to a declaration with `Node label: blue`.
- Reuse a node with `@Existing node label`. Matching is case-insensitive. A terminal
  decision `?` may be omitted in the reference; all other label text must match.
- Limits: 80 nodes, 160 connectors, and 80 characters per node label.

```markdown
:::diagram
type: flow
title: Data quality gate

Incoming data -> Valid?: yellow
  yes -> Load: blue -> Available: green
  no -> Remediate: orange -> @Load
:::
```

Retry example:

```markdown
:::diagram
type: flow
title: Tiered retry

Send request -> Succeeded?: yellow
  yes -> Store result: blue -> Complete: green
  no -> Retry fast: orange -> @Send request

Retry fast -> Recovered?: yellow
  yes -> Store result
  no -> Dead-letter queue: orange
:::
```

Do not invent Mermaid syntax or duplicate a label to mean a new node. Wide diagrams remain readable inside a contained
horizontal scroller rather than shrinking their text.

### ERD contract

- Declare entities at column zero in source order: `Entity: color`.
- Indent each field by two spaces.
- Prefix keys with `PK`, `FK`, or `UK`.
- Only an `FK` may declare `-> Entity.field`; the entity and field must exist.
- Placement is row-major using `columns`. Limits: 24 entities and 30 fields per entity.

```markdown
:::diagram
type: erd
title: Commerce model
columns: 3

Customer: blue
  PK customer_id
  UK email
  name

Order: orange
  PK order_id
  FK customer_id -> Customer.customer_id
  order_date
  status
:::
```

Entity color affects only the header treatment. PK remains orange, FK blue, and UK
neutral. Relationships attach to exact field rows and route around unrelated entities.

## Markdown and nesting rules

- Normal Markdown bodies support paragraphs, H2/H3 headings, lists, links, fenced code,
  tables, and images. Do not add another page H1 inside CMS body Markdown.
- `checklist`, `embed`, `metric`, `metrics`, `formula`, `divider`, and `diagram` use raw
  text contracts; Markdown formatting inside them is not interpreted.
- One nested custom-block level is supported in Markdown-body blocks. A block nested
  inside that nested block remains literal. Raw-body blocks should never contain blocks.
- Put opening and closing fences on their own lines with blank lines around the block.
- External HTTP(S) article links open in a new tab; internal and fragment links do not.

## Validation checklist

- [ ] Block name, title form, field names, and accepted values match this guide.
- [ ] Every opening fence has one closing `:::` on its own line.
- [ ] Raw-body blocks contain plain contract text, not formatted Markdown.
- [ ] Nested blocks are no deeper than one level.
- [ ] Images have useful alt text; code fences include a language.
- [ ] Embed URLs use HTTPS and provide `source:` when the host may block framing.
- [ ] Diagram references resolve to an existing label; only a terminal decision `?` may be omitted.
- [ ] Diagram labels, nodes, final states, entities, and connectors are visible at
  320px, 390px, tablet, and desktop widths without page-level overflow.
