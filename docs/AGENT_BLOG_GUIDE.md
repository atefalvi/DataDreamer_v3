# Agent Blog Guide — DataDreamer v4

This guide is for agents and human authors publishing to the DataDreamer `posts`
collection in Directus. It documents the v4 Markdown contract used by the Astro
frontend, including the callout syntax covered by the golden fixture at
`frontend/src/lib/markdown/__fixtures__/agent-blog-guide-syntax.md`.

---

## Workflow

1. Create a new item in Directus → `posts`.
2. Fill the required metadata fields.
3. Write the article body in `content` using the Markdown syntax below.
4. Keep `status = draft` until the post is reviewed.
5. Set `status = published` when the article should appear on `/blog`, topic pages,
   RSS, and the post sitemap.

The site is SSR. Published posts are available on the next request; no rebuild is
needed for ordinary CMS edits.

Related operational docs:

- `README.md` for the current v4 architecture and branch model.
- `SETUP.md` for local development and Directus permissions.
- `docs/RELEASE_NEXT_STEPS.md` for branch cleanup and production release steps.

---

## Field Reference

| Field | Required | Guidance |
|---|---:|---|
| `title` | Yes | Human-readable article title. Use sentence/title case, not all caps. Keep it specific and under about 80 characters. |
| `slug` | Yes | Permanent URL segment in `kebab-case`, for example `airflow-retry-patterns`. Do not change after publishing. |
| `status` | Yes | `draft` for work in progress, `published` for live content. |
| `published_at` | Yes | Public publish date/time. Used for sorting, RSS, article meta, and sitemap `lastmod`. |
| `excerpt` | Yes | One or two complete sentences, ideally 120-160 characters. Used on cards and as the meta description. |
| `content` | Yes | Markdown body. Use `#` once at the top only if drafting outside Directus; the route renders the article title from metadata. |
| `author` | Yes | Relation to an `authors` profile. Choose the real author, not a Directus user. |
| `topics` | Recommended | Many-to-many topic taxonomy used for `/blog/topic/[slug]`, article chips, RSS categories, and related posts. |
| `cover_image` | Recommended | Directus file used for article cover, cards, and per-article OG image. Add useful file description/alt text. |
| `featured` | Optional | Makes the post eligible for featured positions on the blog/home pages. |
| `series_label` | Optional | Short label for a series, for example `Pipeline Notes`. |
| `post_number` | Optional | Numeric series/index marker when useful. |

Projects are not authored in Directus in v4. They live in the Astro `projects`
content collection.

---

## Writing Style

- Be direct, concrete, and technical.
- Use precise nouns and measured claims.
- Prefer short sections with useful headings.
- Avoid clickbait, vague introductions, and filler.
- Do not force all-caps labels or titles. The v4 design system handles visual hierarchy.
- Explain operational context: what changed, why it mattered, and what someone can reuse.

---

## Recommended Article Shape

````markdown
# Article Title

Opening paragraph. Establish the problem, system, or observation in 2-4 sentences.

## Context

What was being built, debugged, measured, or learned.

## What Changed

Specific implementation notes, data, commands, screenshots, or design decisions.

## Results

Numbers, tradeoffs, screenshots, before/after behavior, or lessons learned.

## Next

What should happen next, if there is a natural follow-up.
````

Use `##` for major sections and `###` for nested sections. The table of contents is
generated from `##` and `###` headings. Do not use `####` or deeper unless the prose
really demands it.

---

## Callouts

All custom blocks use the same open/close shape:

```markdown
:::type Optional Title
Body content supports **Markdown**, links, lists, and code.
:::
```

Title syntax also supports braces:

```markdown
:::caution{title="Dangerous Operation"}
Dropping a collection is irreversible without a backup.
:::
```

Supported callout types:

| Type | Use for |
|---|---|
| `note` | Side notes, small clarifications, or contextual remarks. |
| `info` | Neutral background, references, links, or definitions. |
| `tip` | Practical shortcuts, optimizations, and best practices. |
| `warning` | Risk, known issues, hardware limits, or fragile assumptions. |
| `caution` | Dangerous or destructive operations. |
| `important` | Must-read operational guidance. |
| `example` | Worked examples or small demonstrations. |
| `technical` | Deep implementation details that should remain visible. |

Callout content can contain normal Markdown:

```markdown
:::tip Data Format
Use **gradient checkpointing** to cut VRAM usage.

- Keep `instruction` and `response` keys.
- Validate rows before upload.

See [training notes](https://example.com/training).
:::
```

Nested `details` blocks inside callouts are supported. Nested callouts inside callouts
are intentionally not supported and should be avoided.

---

## Details Blocks

Use `details` for long logs, verbose configs, raw outputs, tracebacks, or optional
evidence that would interrupt the main reading flow.

````markdown
:::details Raw Training Log
Step 0/500 | loss: **2.4831**

```txt
loss=2.4831
lr=1e-4
```
:::
````

The text after `:::details` becomes the summary.

---

## Pull Quotes

Use `quote` for one thesis-level statement. Keep it short.

```markdown
:::quote
The data is the model. Garbage in, garbage out.
:::
```

---

## Images

Use normal Markdown images for a single figure:

```markdown
![Training loss curve](https://api.data-dreamer.net/assets/<FILE_UUID> "Loss curve after epoch three")
```

Rules:

- The alt text inside `![...]` is required. Describe the actual image.
- The optional title string becomes the visible caption.
- Prefer Directus asset URLs: `https://api.data-dreamer.net/assets/<FILE_UUID>`.
- Upload reasonably sized source images. A width around 1600-2200px is usually enough.
- Add a useful Directus file description for cover images because it becomes alt text
  in cards and article covers.

---

## Image Grids

Use `imagegrid` for related screenshots or visual comparisons.

```markdown
:::imagegrid
![Dashboard before filtering](https://api.data-dreamer.net/assets/<FILE_UUID_1>)
![Dashboard after filtering](https://api.data-dreamer.net/assets/<FILE_UUID_2>)
![Error trace detail](https://api.data-dreamer.net/assets/<FILE_UUID_3>)
:::
```

Every image still needs real alt text. The frontend renders the grid responsively and
opens images in the article lightbox.

---

## Code Blocks

Use fenced code blocks with a language hint:

````markdown
```python
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained("mistralai/Mistral-7B-v0.1")
```

```bash
python train.py --epochs 3 --batch-size 16 --lr 1e-4
```
````

The frontend adds dual-theme Shiki highlighting, a language label, keyboard-scrollable
code regions, and a copy button.

---

## Tables

GitHub-flavored Markdown tables are supported and automatically receive a horizontal
scroll wrapper on small screens.

```markdown
| Model | Params | VRAM | Throughput |
|---|---:|---:|---:|
| Mistral 7B | 7B | 16 GB | 42 tok/s |
| Llama 3 8B | 8B | 18 GB | 38 tok/s |
```

---

## Topics

Topics are a shared Directus taxonomy, not free-form tags on the post. Select existing
topics whenever possible so filters, related posts, RSS categories, and topic pages
stay coherent.

Recommended topic patterns:

| Topic family | Use for |
|---|---|
| Data engineering | Pipelines, orchestration, reliability, ingestion, warehouses. |
| Analytics | Metrics, BI, semantic modeling, dashboards, decision systems. |
| Applied AI | LLM workflows, model integration, evaluation, AI product patterns. |
| Infrastructure | Deployment, Docker, CI/CD, hosting, observability. |
| Visualization | Charts, maps, interaction design, visual explanation. |
| Research | Reading notes, papers, experiments, conceptual work. |

Avoid creating near-duplicates such as `AI`, `Artificial Intelligence`, and `Applied AI`.
Pick the canonical topic.

---

## SEO Checklist

- Title is descriptive and readable in search results.
- Excerpt is a complete sentence and can stand alone as the meta description.
- Slug is lowercase, stable, and not date-based.
- `published_at` is accurate.
- Cover image is present for important posts and has useful alt text/description.
- Author relation is set.
- At least one topic is selected when the post fits the taxonomy.

---

## Constraints

- Use the documented `:::` blocks for rich content. Avoid raw HTML in the editor.
- Use one H1 at most. Prefer metadata title plus `##` sections in Directus body.
- Do not change published slugs without adding a redirect plan.
- Do not create one-off topics for a single article unless the taxonomy truly needs it.
- Do not paste screenshots without alt text.
- Unsupported `:::unknown` blocks render literally for forward compatibility; do not
  rely on them for production posts.

---

## Complete Example

````markdown
# Airflow Retry Patterns That Do Not Hide Failure

Retries are useful until they become camouflage. This note documents the retry shape
I use when a pipeline should absorb transient failures without hiding real data issues.

## Context

The pipeline pulls hourly events from an API that occasionally returns 502s. The goal
is to recover from short upstream blips while still surfacing schema changes quickly.

:::info Reference
The DAG uses task-level retries for transport errors and explicit validation tasks for
data quality failures.
:::

## Retry Shape

```python
default_args = {
    "retries": 3,
    "retry_delay": timedelta(minutes=5),
    "retry_exponential_backoff": True,
}
```

:::important Must Read
Retries should wrap unstable infrastructure boundaries, not validation failures.
:::

:::caution{title="Dangerous Operation"}
Never retry a destructive write unless the operation is idempotent.
:::

## Evidence

:::details Raw Task Log
Attempt 1 failed with HTTP 502.
Attempt 2 succeeded after 03:12.
Validation completed with 0 rejected rows.
:::

:::imagegrid
![Retry timeline in Airflow](https://api.data-dreamer.net/assets/<FILE_UUID_1>)
![Validation task output](https://api.data-dreamer.net/assets/<FILE_UUID_2>)
:::

## Result

The DAG now absorbs short upstream outages without masking schema drift.

:::quote
Retries should buy time, not hide truth.
:::
````
