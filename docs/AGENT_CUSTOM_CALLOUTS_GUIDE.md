# Agent Custom Callouts and Rich Blocks Guide

Canonical authoring contract for rich Markdown in DataDreamer Posts, Projects, and
Field Guides. This guide is derived from the production parser and renderer in
`frontend/src/lib/markdown/`; do not invent block names, fields, or values.

Collection fields belong in `docs/AGENT_CONTENT_TYPES_GUIDE.md`. Cover-generation
rules belong in `docs/AGENT_COVER_IMAGE_GUIDE.md`.

## How custom blocks work

Open and close every block with fences on their own lines:

```markdown
:::note Optional title
Normal Markdown body.
:::
```

The alternative opener `:::note{title="Optional title"}` also works, but the
space-title form is easier to read and is preferred. Rules:

- Block names and configuration field names are lowercase and exact.
- The opener may have one plain-text title. Callouts supply their type name when the
  title is omitted; most other blocks leave it blank or use the default noted below.
- A missing closing fence leaves the source as ordinary, unstyled content.
- Markdown-body blocks support paragraphs, H2/H3 headings, lists, links, tables,
  images, inline code, and fenced code. Do not add an H1 to CMS body content.
- Raw-body blocks parse only their documented lines or fields. Markdown emphasis,
  links, lists, and nested custom blocks do not render inside raw bodies.
- One custom block may be nested inside a top-level Markdown-body block. A third
  level stays literal. Do not nest raw-body blocks.
- External HTTP(S) links open in a new tab. Internal and fragment links stay in the
  current tab.

## Complete block catalog

| Block | Short purpose | Body |
|---|---|---|
| `note` | Neutral context | Markdown |
| `info` | Supporting explanation | Markdown |
| `tip` | Practical improvement or shortcut | Markdown |
| `warning` | Likely failure mode or material risk | Markdown |
| `caution` | Destructive, security, or irreversible risk | Markdown |
| `important` | Rule the reader must retain | Markdown |
| `example` | Representative input, output, or scenario | Markdown |
| `technical` | Implementation detail that would interrupt the narrative | Markdown |
| `details` | Collapsible secondary material | Markdown |
| `quote` | Editorial quotation | Markdown |
| `text` | Bounded supporting prose | Markdown |
| `imagegrid` | Related images with a lightbox | Markdown images |
| `checklist` | State-coded review or task list | Raw marker lines |
| `embed` | Sandboxed external interactive content | Raw URL/config/embed markup |
| `metric` | One compact measure | Raw fields |
| `metrics` | Several compact measures | Raw records |
| `formula` | Display mathematics | Raw LaTeX/config |
| `divider` | Deliberate visual transition | Raw pattern/config |
| `diagram` | Server-rendered flowchart or ERD | Raw metadata and DSL |

`detail` remains a compatibility alias for `details`. Never use the alias in new
content.

## Semantic callouts

All eight callouts accept only an optional opener title. Their bodies are Markdown,
and each renders as an accessible labelled aside with a distinct icon and treatment.
Use the narrowest truthful type; ordinary paragraphs should remain ordinary text.

### `note`

Purpose: neutral context that helps interpretation but is not a warning or rule.
Default title: `Note`.

```markdown
:::note Source boundary
The extract contains closed opportunities only.
:::
```

### `info`

Purpose: supporting information or background the reader may need.
Default title: `Info`.

```markdown
:::info Refresh cadence
The public dataset refreshes once each morning.
:::
```

### `tip`

Purpose: a practical shortcut, improvement, or easier way to complete a task.
Default title: `Tip`.

```markdown
:::tip Validate early
Reconcile the row count before adding calculated fields.
:::
```

### `warning`

Purpose: a likely failure mode, important risk, or condition that can make the result
wrong. Default title: `Warning`.

```markdown
:::warning Filter scope
Selecting multiple independent fiscal years combines separate waterfalls.
:::
```

### `caution`

Purpose: destructive, security-sensitive, costly, or difficult-to-reverse action.
Default title: `Caution`. Do not use it for low-impact advice.

```markdown
:::caution Production change
Back up the workbook before replacing the published data source.
:::
```

### `important`

Purpose: a durable rule or decision the reader must retain.
Default title: `Important`.

```markdown
:::important Calculation boundary
Keep movement classification separate from colour assignment.
:::
```

### `example`

Purpose: representative input, output, scenario, or worked application.
Default title: `Example`.

```markdown
:::example Checkpoint row
`Final Commit` is a total, so its bar begins at zero rather than at the prior balance.
:::
```

### `technical`

Purpose: implementation detail that is useful to practitioners but would interrupt
the main editorial narrative. Default title: `Technical`.

````markdown
:::technical Query boundary
Aggregate once at the reporting grain.

```sql
select segment, sum(value) as total
from movements
group by segment;
```
:::
````

## `details`

Short purpose: collapsible secondary evidence, assumptions, or extended explanation.

- Opener title: optional; rendered summary defaults to `Details`.
- Body: Markdown.
- Nesting: one custom-block level is supported.
- Initial state: closed; the reader expands the native disclosure.

```markdown
:::details Inspect the assumptions
- One fiscal year is selected.
- Region is treated as an independent slice.
:::
```

Never hide a prerequisite, safety warning, or fact required to understand the main
argument.

## `quote`

Short purpose: a genuine quotation or concise editorial pull quote.

- Opener title: do not use one; the parser accepts it but the renderer does not show it.
- Body: Markdown, ideally one short quotation. A final attribution line is allowed.
- Rendering: `figure` containing a semantic `blockquote`.

```markdown
:::quote
Good analysis makes the decision boundary visible.

— Project retrospective
:::
```

Do not fabricate an attribution or use this block merely to enlarge normal prose.

## `text`

Short purpose: visually bounded supporting prose with no warning, success, or other
semantic state.

- Opener title: optional.
- Body: Markdown.
- Nesting: one custom-block level is supported.

```markdown
:::text Reading the result
Treat the final total as a checkpoint, not another movement.
:::
```

Choose a semantic callout instead when the content is truly a tip, warning, rule, or
technical note.

## `imagegrid`

Short purpose: present related images as a responsive gallery with full-size lightbox
viewing.

- Opener title: optional; rendered as the gallery caption.
- Body: Markdown image syntax only. Other prose is ignored by the gallery.
- Image alt text: used for the image and its accessible “Open image” control.
- Markdown image title: becomes the lightbox caption.
- Image count: one is supported; use two or more when comparison or sequence is the
  reason for choosing a grid. A standalone Markdown image is usually better for one.
- Images are lazy-loaded; Directus assets receive optimized thumbnail/full transforms.

```markdown
:::imagegrid Before and after
![Unfiltered waterfall with broken totals](/images/before.webp "Before validation")
![Validated waterfall with stable checkpoints](/images/after.webp "After validation")
:::
```

Use specific alt text that describes what is visible, not a filename or the article
title.

## `checklist`

Short purpose: show task, review, risk, and question states in one scannable list.

- Opener title: optional.
- Body: raw plain text, one item per nonblank line.
- Markdown inside an item is not parsed.
- An unmarked line renders as a neutral item.

| Marker | State | Rendered mark |
|---|---|---|
| `[x]` or `[X]` | Done | ✓ |
| `[ ]` | Pending | Empty status mark |
| `! ` | Risk | ! |
| `? ` | Question | ? |
| `* ` | Highlight | ★ |
| `- ` | Neutral | • |
| No marker | Neutral | • |

```markdown
:::checklist Release gate
[x] Row counts reconciled
[ ] Mobile layout checked
! Confirm rollback ownership
? Has the publish date been approved?
* Record the final decision
- Keep the fallback simple
:::
```

This is a display block, not an interactive task tracker; readers cannot toggle the
items.

## `embed`

Short purpose: display provider-independent HTTPS interactive content in a responsive,
sandboxed iframe.

### Supported input and precedence

The renderer extracts the iframe URL in this order:

1. `url:` field;
2. first body line containing only an HTTPS URL;
3. `src` from an `<iframe>` or `<embed>` tag;
4. `data` from an `<object>` tag;
5. a legacy object snippet with valid `host_url`, `name`, and `embed_code_version`;
6. first anchor `href` in pasted markup.

Only HTTPS URLs without embedded usernames or passwords are accepted. If `url:` is
present, it must be valid; an invalid explicit URL is not replaced by a later source.
Pasted scripts are never executed.

| Field | Required | Accepted value | Effect |
|---|---:|---|---|
| `url` | Recommended | Safe HTTPS embeddable URL | Iframe source |
| `source` | Optional | Safe HTTPS public page | “Open original” link when different from `url`; link-only fallback when no iframe URL exists |
| `height` | Optional | Integer or `px`, 240–1600 | Explicit frame height, capped by the viewport in CSS |
| `ratio` | Optional | Positive `width/height` or `width:height` | Responsive aspect ratio; default `16/9` |

An iframe/embed `width` and `height` between 240 and 1600 infer the ratio. A valid
embedded height or legacy `.style.height` can supply height when no ratio was inferred.

Preferred explicit form:

```markdown
:::embed Interactive model
url: https://example.org/embed/model
source: https://example.org/model
ratio: 16/9
height: 720
:::
```

Minimal form:

```markdown
:::embed Interactive model
https://example.org/embed/model
:::
```

Ordinary YouTube watch, share, Shorts, and live URLs are accepted in the minimal form.
The renderer converts them to a privacy-enhanced video player and keeps the pasted URL
as the “Open original” link:

```markdown
:::embed Airflow in three minutes
https://www.youtube.com/watch?v=AHMm1wfGuHE
:::
```

Safe pasted iframe form:

```markdown
:::embed Product walkthrough
<iframe width="800" height="450" src="https://media.example.org/embed/walkthrough"></iframe>
:::
```

Use the direct embeddable URL whenever possible. Some providers forbid iframe display
with their own security headers; always supply `source:` when a public viewing page is
available so the reader has a reliable new-tab route.

## `metric`

Short purpose: show one factual measure with optional direction and context.

| Field | Required | Accepted value |
|---|---:|---|
| `value` | Recommended | Plain text; missing value renders `—` |
| `label` | Optional | Short measure name |
| `caption` | Optional | Scope, denominator, period, or comparison context |
| `symbol` | Optional | Literal text/symbol or a supported word below |
| `tone` | Optional | `green`, `red`, `yellow`, `blue`, `neutral`; invalid values become `neutral` |

Symbol words are case-insensitive:

- `up`, `increase`, `increased`, `positive`, `higher` → ↑
- `down`, `decrease`, `decreased`, `negative`, `lower` → ↓
- `neutral`, `stable`, `same`, `unchanged` → —
- `right`, `next`, `forward` → →
- `check`, `done`, `success` → ✓
- `warning`, `caution`, `risk` → !
- `question`, `unknown` → ?
- `star`, `highlight` → ★

Any other `symbol` value is rendered literally.

```markdown
:::metric Coverage
value: 98%
label: Valid records
caption: After the quality gate
symbol: up
tone: green
:::
```

Do not present an estimated or invented value as measured fact.

## `metrics`

Short purpose: compare several measures using the same field contract as `metric`.

- Opener title: optional.
- Record fields: `value`, `label`, `caption`, `symbol`, and `tone` exactly as above.
- Separate records with a line containing three or more hyphens.
- Body: raw plain text; Markdown is not parsed.
- Records containing no recognized fields are omitted.

```markdown
:::metrics Outcome snapshot
value: 38%
label: Lower cycle time
symbol: down
tone: green

---

value: 2
label: Manual handoffs
caption: After consolidation
tone: neutral
:::
```

Keep all measures in one block conceptually related and give ambiguous values a
caption.

## `formula`

Short purpose: render one display equation with server-side KaTeX.

- Opener title: optional.
- `value`: optional field containing the LaTeX expression. When absent, all plain
  unrecognized lines are joined and used as the expression.
- `caption`: optional plain-text explanation beneath the equation.
- Body: raw LaTeX/config; Markdown is not parsed.
- Do not wrap the expression in `$` or `$$` inside this block.
- Invalid LaTeX is rendered safely rather than executing code.

```markdown
:::formula Running total
value: R_t = R_{t-1} + \Delta_t
caption: Each movement is applied to the previous checkpoint.
:::
```

Outside a custom block, standard inline `$…$` and display `$$…$$` math are also
supported.

## `divider`

Short purpose: mark a deliberate phase or thematic transition when a heading would be
too strong. Use sparingly; headings should carry most document structure.

| Input | Accepted values | Default / precedence |
|---|---|---|
| Opener title | Plain text | Used as label only when `label:` is absent |
| `label` | Plain text | Overrides opener title |
| `pattern` | `---`, `***`, `-x-` | Defaults to `---` |
| `tone` | `accent`, `neutral`, `muted` | Defaults to `neutral` |
| Bare pattern line | `---`, `***`, `-x-` | Used when `pattern:` is absent |

Invalid patterns fall back to `---`; invalid tones fall back to `neutral`. A `***` or
`-x-` divider without a label shows a small center mark. These are all supported forms:

Plain divider:

```markdown
:::divider
:::
```

Title becomes the label:

```markdown
:::divider Next phase
:::
```

Bare dash pattern:

```markdown
:::divider
---
:::
```

Bare star pattern:

```markdown
:::divider
***
:::
```

Bare x pattern:

```markdown
:::divider
-x-
:::
```

Fully configured:

```markdown
:::divider
label: Phase two
pattern: -x-
tone: accent
:::
```

## `diagram`

Short purpose: render a deterministic flowchart or entity-relationship diagram as
inline SVG on the server. The browser receives no graph-layout runtime.

### Shared metadata

Put metadata first, then the diagram body. The opener title is a fallback only when
`title:` is absent.

| Field | Required | Accepted value |
|---|---:|---|
| `type` | Yes | `flow` or `erd` |
| `title` | Recommended | Plain accessible title; truncated to 120 characters |
| `columns` | ERD only | Integer; rounded and clamped to 1–4; default 3 |

Node/entity color suffixes are `blue`, `yellow`, `orange`, `green`, and `purple`.
Unknown colors use the default treatment.

### Flow diagrams

- Connect nodes with `->`.
- A node label ending in `?` is a decision.
- Indent a decision branch by two spaces. Its first token is the connector label such
  as `yes`, `no`, or `fallback`.
- Add colour with `Node label: blue`.
- Reuse an existing node with `@Existing node label`. Matching is case-insensitive. A
  terminal decision `?` may be omitted in the reference; otherwise labels must match.
- Limits: 80 nodes, 160 connectors, 80 characters per node label.

```markdown
:::diagram
type: flow
title: Data quality gate

Incoming data -> Valid?: yellow
  yes -> Load: blue -> Available: green
  no -> Remediate: orange -> @Load
:::
```

Do not use Mermaid syntax or repeat a label when the intent is to reference the same
node.

### ERD diagrams

- Declare each entity at column zero as `Entity: color`.
- Indent fields by two spaces.
- Optional field prefixes are `PK`, `FK`, and `UK`.
- Only an `FK` may reference `-> Entity.field`; both targets must exist.
- Each `FK` renders as many-to-one: `M` beside the referencing entity and `1` beside
  the referenced entity. Model many-to-many relationships with an explicit junction
  entity containing two FKs.
- Entity names are unique case-insensitively.
- Entity placement follows source order, row-major, using `columns`.
- Limits: 24 entities and 30 fields per entity.

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

Entity colour affects its header and the relationships that originate from its FK
fields, making dense models easier to trace. Hovering a relationship exposes its
source and target field names. PK remains orange, FK blue, and UK neutral. Wide
diagrams stay inside a keyboard-focusable horizontal scroller instead of overflowing
the page.

## Agent authoring checklist

- [ ] The chosen block adds meaning, not decoration.
- [ ] Block name, title form, field names, and accepted values exactly match this guide.
- [ ] Every opener has one closing `:::` on its own line.
- [ ] Markdown-body blocks and raw-body blocks are not confused.
- [ ] Nesting is no deeper than one level, and raw blocks contain no nested blocks.
- [ ] Images have accurate alt text; fenced code includes a language.
- [ ] Metrics are evidenced and captions state necessary scope.
- [ ] Embed URLs are HTTPS and include a `source:` route when available.
- [ ] Diagram references resolve and only valid flow/ERD syntax is used.
- [ ] No page-level H1 is added inside CMS body Markdown.
