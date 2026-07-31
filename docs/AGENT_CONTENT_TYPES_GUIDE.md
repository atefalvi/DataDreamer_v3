# Agent Content Types Guide

Source of truth for creating Posts, Projects, and Field Guides in Directus. Field names
match `backend/snapshot.yaml`; routes and behavior match the Astro application.

## Choose the content type

| Use | When the primary value is |
|---|---|
| Post | An argument, lesson, reflection, pattern, or time-bounded observation |
| Project | Evidence of completed work: problem, decisions, implementation, outcome, and trade-offs |
| Field Guide | An ordered, annotated learning path made from sections and resources |

All three use `draft`, `in_review`, `published`, or `archived`. Public routes only show
published content. Ordinary CMS changes are served by SSR on the next request; no
frontend rebuild is required.

“Required” below is the authoring requirement for a complete record. Directus may
supply a database default (notably `draft` status and beginner guide difficulty), but
agents should still set intentional values rather than rely on an implicit default.

## Posts

- Collection: `posts`
- Public route: `/blog/<slug>`
- Body field: `content` (Markdown)

| Field | Requirement | Type / operational rule |
|---|---|---|
| `id` | System | UUID assigned by Directus |
| `title` | Required | String; specific human-readable title |
| `slug` | Required | Unique permanent lowercase `kebab-case` segment |
| `status` | Required | `draft`, `in_review`, `published`, `archived` |
| `excerpt` | Required | Plain-text card and description summary; usually 120–160 characters |
| `content` | Required | Markdown; the route already renders the record title, so begin at H2 |
| `author` | Required | M2O relation to `authors` |
| `published_at` | At publish | Datetime; original public launch time |
| `topics` | Recommended | M2M relation through `posts_topics` |
| `cover_image` | Recommended | M2O file; used on cards, detail page, and per-post OG image |
| `featured` | Optional | Boolean; eligibility for featured placements |
| `series_label` | Optional | Short string naming a series |
| `post_number` | Optional | Integer series/index marker |
| `seo_title` | Optional | Search/social override; otherwise `title` |
| `seo_description` | Optional | Search/social override; otherwise `excerpt` |
| `noindex` | Optional | Boolean; removes from indexing/sitemaps, not access control |
| `date_created`, `date_updated` | System | Directus audit timestamps; do not author manually |

Minimal complete record:

```yaml
collection: posts
title: Data contracts fail at the handoff
slug: data-contracts-fail-at-the-handoff
status: draft
excerpt: A practical look at why ownership and escalation matter as much as schema validation.
author: <authors.id>
topics:
  - <topics.id>
cover_image: <directus_files.id>
featured: false
content: <Markdown from the body skeleton below>
# Set only when publishing:
published_at: 2026-07-30T14:00:00Z
```

Recommended body skeleton:

```markdown
## The situation

State the concrete context, decision, or friction.

## What the evidence showed

Explain observations, constraints, and the reasoning chain.

:::important The boundary
State the rule the reader should retain.
:::

## What changed

Describe the useful pattern, action, or conclusion.

## Limits and next questions

Name what remains uncertain and where the lesson does not apply.
```

Write a Post around one central idea. If the piece mainly demonstrates a shipped
system and its implementation, use a Project.

## Projects

- Collection: `projects`
- Public route: `/projects/<slug>`
- Body field: `body` (Markdown)

| Field | Requirement | Type / operational rule |
|---|---|---|
| `id` | System | UUID assigned by Directus |
| `title` | Required | String naming the project or system |
| `slug` | Required | Unique permanent lowercase `kebab-case` segment |
| `status` | Required | `draft`, `in_review`, `published`, `archived` |
| `summary` | Required | Plain-text problem/value summary |
| `body` | Required | Markdown case study; begin at H2 |
| `author` | Recommended | M2O relation to `authors` |
| `year` | Recommended | Integer year completed or meaningfully shipped |
| `role` | Recommended | String describing the author’s responsibility |
| `topics` | Recommended | M2M relation through `projects_topics` |
| `tags` | Optional | JSON array of specific tools/platforms, not a relation |
| `links` | Optional | JSON array of `{ "label": string, "url": string }` |
| `cover_image` | Recommended | M2O file; used on cards, detail hero, and per-project OG image |
| `cover_alt` | Recommended | Explicit image alt text when file description is insufficient |
| `featured` | Optional | Boolean; eligibility for featured placements |
| `sort` | Optional | Integer manual catalog order |
| `published_at` | At publish | Datetime; original public launch time |
| `seo_title` | Optional | Search/social override; otherwise `title` |
| `seo_description` | Optional | Search/social override; otherwise `summary` |
| `noindex` | Optional | Boolean; indexing control, not privacy |
| `date_created`, `date_updated` | System | Directus audit timestamps |

There is no separate technology relation, repository field, demo field, result field,
or outcome field. Put technologies in `tags`, repository/demo URLs in `links`, and
results/outcomes in `body`. Do not invent Project fields from the Post schema.

Minimal complete record:

```yaml
collection: projects
title: Building a reliable Tableau waterfall chart with Gantt bars
slug: tableau-waterfall-chart-gantt-method
status: draft
summary: A case study in stable waterfall calculations, checkpoints, and filter behavior.
year: 2026
role: Analytics engineer and designer
author: <authors.id>
topics:
  - <topics.id>
tags:
  - Tableau
  - Data Visualization
links:
  - label: Open the public visualization
    url: https://public.tableau.com/views/example/Main
cover_image: <directus_files.id>
cover_alt: Offset waterfall bars connected across a dark measured grid.
featured: false
body: <Markdown from the body skeleton below>
# Set only when publishing:
published_at: 2026-07-30T14:00:00Z
```

Recommended case-study skeleton:

```markdown
## The problem

What needed to change, for whom, and why it mattered.

## Constraints and context

Systems, data, stakeholders, time, risk, and assumptions.

## The approach

Architecture, workflow, implementation, and decisions.

:::technical System boundary
Explain the technical decision that would interrupt the main narrative.
:::

## Trade-offs

What was chosen, rejected, deferred, or simplified.

## Outcome

State measured or observed change. Never invent a metric.

## What I would do next

Limitations, lessons, and the next useful iteration.
```

## Field Guides

- Collections and hierarchy: `guides` → `guide_sections` → `guide_items`
- Public route: `/guides/<slug>`
- Catalogue and preview are public. Resource URLs/assets, item body, curator notes, and
  learner progress are gated to authenticated guide readers by the application/service
  layer. `noindex` affects search discovery, not access.

### `guides`

| Field | Requirement | Type / operational rule |
|---|---|---|
| `id` | System | UUID assigned by Directus |
| `title` | Required | String naming the learning path |
| `slug` | Required | Unique permanent lowercase `kebab-case` segment |
| `status` | Required | `draft`, `in_review`, `published`, `archived` |
| `summary` | Required | Plain-text catalog/meta summary |
| `difficulty` | Recommended | `beginner`, `intermediate`, or `advanced`; schema default is `beginner` |
| `why_this_path` | Required | Markdown public pitch and sequencing rationale |
| `author` | Recommended | M2O primary curator relation to `authors`; set for a public byline |
| `published_at` | At publish | Datetime; original public launch time |
| `expected_outcome` | Recommended | Markdown describing what completion enables |
| `recommended_audience` | Recommended | Plain-text audience/prerequisite line |
| `estimated_duration_minutes` | Recommended | Integer honest total; not auto-summed |
| `sections` | Required operationally | O2M alias to sorted `guide_sections` |
| `authors` | Optional | M2M additional curators |
| `topics` | Recommended | M2M shared editorial taxonomy |
| `specialties` | Optional | M2M capabilities/disciplines |
| `cover_image` | Recommended | M2O file used on cards, detail page, and per-guide OG image |
| `featured` | Optional | Boolean; eligibility for featured placements |
| `sort` | Optional | Integer manual catalog order |
| `seo_title` | Optional | Search/social override; otherwise `title` |
| `seo_description` | Optional | Search/social override; otherwise `summary` |
| `noindex` | Optional | Boolean; indexing control only |
| `date_created`, `date_updated` | System | Directus audit timestamps |

### `guide_sections`

| Field | Requirement | Type / operational rule |
|---|---|---|
| `id` | System | UUID assigned by Directus |
| `guide` | Required | M2O parent relation to `guides` |
| `title` | Required | String naming a phase of the path |
| `description` | Optional | Markdown section introduction |
| `sort` | Required | Integer display order within the guide |
| `items` | Operational alias | O2M alias to sorted `guide_items` |

### `guide_items`

| Field | Requirement | Type / operational rule |
|---|---|---|
| `section` | Required | M2O parent relation to `guide_sections` |
| `type` | Required | One exact value from the mapping below |
| `title` | Required | String naming the resource or activity |
| `description` | Recommended | Plain-text one-line description |
| `url` | Conditional | HTTPS URL for link-like types |
| `asset` | Conditional | M2O Directus file for file types |
| `body` | Conditional | Markdown for inline types |
| `why_included` | Recommended | Markdown curator rationale |
| `focus_on` | Recommended | Markdown guidance on what to use or skip |
| `notes` | Optional | Markdown gotchas, setup traps, or personal context |
| `estimated_time_minutes` | Recommended | Integer per-item estimate used for remaining time |
| `difficulty` | Optional | `beginner`, `intermediate`, or `advanced`; defaults to `beginner` when set implicitly |
| `sort` | Required | Integer display order within the section |
| `id` | System | UUID |

| `type` | Required content field | Reader behavior |
|---|---|---|
| `youtube` | `url` | Privacy-friendly inline facade after interaction |
| `external_url` | `url` | New-tab external link |
| `github_repo` | `url` | New-tab repository link |
| `docs_page` | `url` | New-tab documentation link |
| `notebooklm` | `url` | New-tab NotebookLM link |
| `pdf` | `asset` | Open/download file |
| `uploaded_file` | `asset` | Download file |
| `code_sample` | `body` | Rendered inline Markdown/code |
| `cheat_sheet` | `body` | Rendered inline Markdown |
| `personal_note` | `body` | Rendered inline Markdown |
| `exercise` | `body` | Rendered inline Markdown |

Minimal guide with one section and two items:

```yaml
guide:
  collection: guides
  title: A practical operating model for governed analytics
  slug: governed-analytics-operating-model
  status: draft
  summary: A sequenced path from ownership and definitions to controls and adoption.
  difficulty: intermediate
  estimated_duration_minutes: 240
  author: <authors.id>
  topics:
    - <topics.id>
  specialties:
    - <specialties.id>
  why_this_path: <Markdown public pitch>
  expected_outcome: <Markdown completion outcome>
  recommended_audience: Analysts and delivery leads responsible for shared reporting.
section:
  collection: guide_sections
  guide: <guide.id>
  title: Establish the operating boundary
  description: <Markdown section introduction>
  sort: 1
items:
  - collection: guide_items
    section: <section.id>
    type: docs_page
    title: Define ownership and escalation
    url: https://example.org/ownership
    why_included: <Markdown curator rationale>
    focus_on: The decision rights table and escalation path.
    estimated_time_minutes: 25
    sort: 1
  - collection: guide_items
    section: <section.id>
    type: exercise
    title: Map one metric from owner to consumer
    body: <Markdown inline exercise below>
    why_included: Applies the operating model to a real handoff.
    estimated_time_minutes: 35
    sort: 2
```

Inline `exercise` body example:

```markdown
### Exercise

Choose one production metric and record:

1. Its accountable owner.
2. Its calculation and source boundary.
3. Its consumer and escalation route.

:::checklist Completion check
[ ] Owner confirmed
[ ] Definition linked
[ ] Escalation route tested
:::
```

The guide’s value is the route and curator judgment, not a pile of links. Fill
`why_included` on most items and `focus_on` whenever a resource is long or partly irrelevant.

## Shared operating rules

- Keep slugs stable after publication. Redirects are not created automatically.
- Relate the real `authors` record and reuse existing `topics`; do not create a topic
  for every tool. Projects use `tags` for tool-level detail.
- Contributors work in `draft`, move ready work to `in_review`, and an administrator
  sets `published_at` and `published`. Preserve the original publish date on later edits.
- Leave SEO overrides blank when the normal title and summary/excerpt are stronger.
- A cover is one Directus file relation. Follow `docs/AGENT_COVER_IMAGE_GUIDE.md` and
  provide accurate alt text/file description.
- Markdown fields use `docs/AGENT_CUSTOM_CALLOUTS_GUIDE.md`; never invent a block or field.

## Pre-publish checklists

Post:

- [ ] One central idea; `title`, `excerpt`, `content`, author, topics, and date agree.
- [ ] Claims have evidence; body starts at H2; cover/SEO/OG fallbacks are correct.

Project:

- [ ] Problem, role, constraints, decisions, trade-offs, evidence, outcome, and limits are clear.
- [ ] `tags` and `links` use their exact JSON shapes; cover alt text is specific.

Field Guide:

- [ ] Sections and items have intentional `sort` values and tell a coherent learning story.
- [ ] Every item fills the field required by its `type`; gated details are not relied on in public copy.
- [ ] Most items explain `why_included`; long resources explain `focus_on`; time estimates are honest.

All:

- [ ] `status`, stable slug, `published_at`, relations, SEO overrides, and `noindex` are intentional.
- [ ] Every Markdown example/block renders in dark/light themes and at mobile width.
- [ ] Placeholder IDs, URLs, assets, and unsupported claims are removed.
