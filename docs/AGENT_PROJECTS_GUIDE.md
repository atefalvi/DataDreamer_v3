# Agent Projects Guide — DataDreamer v4

This guide is for agents and human authors creating proof-of-work case studies in the
Directus `projects` collection. Project bodies use the same Markdown renderer as Posts,
including every custom block in `docs/RICH_CONTENT_BLOCKS.md`. Read that contract before
drafting `body`. Read `docs/AGENT_COVER_IMAGE_GUIDE.md` before generating a cover.

## Workflow

1. Create an item in Directus → `projects` and keep `status = draft`.
2. Complete the metadata and relation fields before drafting the case study.
3. Write `body` as evidence of the work: context, constraints, decisions,
   implementation, outcome, and lessons.
4. Render-check callouts, metrics, images, tables, and code at desktop and mobile sizes.
5. Move the item to `in_review`; an administrator sets `published_at` and publishes it.

Published projects are server-rendered on the next request. A frontend rebuild is not
needed for ordinary CMS edits.

## Field reference

| Field | Required | Guidance |
|---|---:|---|
| `title` | Yes | Specific project or system name, preferably under 80 characters. |
| `slug` | Yes | Permanent lowercase `kebab-case` URL segment. |
| `status` | Yes | `draft`, `in_review`, `published`, or `archived`. |
| `summary` | Yes | One or two complete sentences describing the problem and value. |
| `body` | Yes | Markdown case study using `docs/RICH_CONTENT_BLOCKS.md`. |
| `year` | Recommended | Year the work was completed or meaningfully shipped. |
| `role` | Recommended | The author's role or scope of responsibility. |
| `author` | Recommended | Relation to the real `authors` profile. |
| `topics` | Recommended | Durable shared subjects used across Posts, Projects, and Guides. |
| `tags` | Optional | Specific tools, platforms, frameworks, and implementation labels. |
| `links` | Optional | Array of `{label, url}` entries for live work, source, or supporting material. |
| `cover_image` | Recommended | Text-free editorial cover following `docs/AGENT_COVER_IMAGE_GUIDE.md`; upload a useful Directus description. |
| `cover_alt` | Recommended | Specific alt text when the cover description is insufficient. |
| `featured` | Optional | Makes the project eligible for highlighted placements. |
| `sort` | Optional | Manual catalogue order. |
| `published_at` | At publish | Original public launch date; preserve it during later edits. |
| `seo_title` | Optional | Search/social override, ideally under 60 characters. |
| `seo_description` | Optional | Search/social override, ideally 120–160 characters. |
| `noindex` | Optional | Excludes the page from search indexing and sitemaps without making it private. |

## Recommended case-study shape

````markdown
## The problem

What needed to change, for whom, and why it mattered.

## Constraints and context

Systems, data, stakeholders, time, risk, and important assumptions.

## The approach

Architecture, workflow, analysis, implementation, and the decisions behind them.

:::technical System boundary
Explain a technical decision that would otherwise interrupt the main narrative.
:::

## Trade-offs

What was deliberately chosen, rejected, deferred, or simplified.

## Outcome

:::metrics Outcome snapshot
label: Cycle time
value: 38% lower
caption: Compared with the previous manual workflow.
symbol: down
tone: green
:::

## What I would do next

Lessons, limitations, and the next useful iteration.
````

Do not claim an outcome that cannot be supported. If there are no reliable numbers,
describe observed operational or user changes plainly rather than inventing metrics.

## Project-specific use of rich blocks

- `technical`: architecture, data model, integration, or implementation detail.
- `warning`: a known limitation, dependency, or failure mode.
- `caution`: destructive migration or security-sensitive action.
- `example`: representative input/output, query, workflow, or user scenario.
- `checklist`: acceptance criteria, migration readiness, or validation coverage.
- `metric` / `metrics`: measured results with baseline and scope in the caption.
- `imagegrid`: before/after states, workflow stages, or related interface evidence.
- `details`: logs, schemas, configuration, or optional deep implementation notes.
- `divider`: a genuine phase transition in a long case study; use sparingly.

## Taxonomy

Use Topics for durable subjects that connect content across the site. Use `tags` for
specific technologies or stack details. For example, use the `Data Engineering` Topic
and tags such as `Airflow`, `dbt`, and `Postgres`. Do not create a Topic for every tool.

## Review checklist

- [ ] The first section identifies the real problem and audience.
- [ ] The author's role and contribution are unambiguous.
- [ ] Decisions and trade-offs are explained, not just the tool list.
- [ ] Claims are supported by evidence, screenshots, measurements, or clear observation.
- [ ] Rich blocks are used where they aid comprehension and render correctly.
- [ ] Images have useful alt text; code fences include language names.
- [ ] Author, Topics, publication date, SEO fallback, and links are correct.
- [ ] Placeholder copy, asset IDs, example URLs, and test data are removed.
