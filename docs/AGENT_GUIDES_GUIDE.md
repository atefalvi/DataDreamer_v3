# Agent Guides Guide — DataDreamer Field Guides (v4.1)

For agents and curators building **Field Guides** in Directus. A Field Guide is a
*curated learning path*: an ordered, annotated collection of existing resources
(videos, docs, repos, PDFs, notes) on one topic. The value is the **sequence**, the
**why**, and the **curator's notes** — not original lessons. We are not building a
course/LMS (see `docs/agent-workspace/01-PRODUCT-VISION.md` §1a).

Three levels: **Learning Path** (`guides`) → **Sections** (`guide_sections`) →
**Items** (`guide_items`).

Access model: the catalogue and a guide's **preview** (pitch, outcomes, syllabus
titles) are public and indexable. The full item content — links, embeds, downloads,
curator notes — and per-learner **progress** are behind a free account
(`guide_reader` role). You don't manage any of that as a curator; it's enforced by
Directus policies the schema script set up.

---

## Workflow

1. In Directus, create an item in **`guides`** and fill the metadata below.
2. Add **`guide_sections`** (the groups) in the order you want them, setting `sort`.
3. Inside each section add **`guide_items`** — one per resource — in `sort` order.
4. For each item, fill the field that matches its `type` (see the type table) **and**
   write the curator annotations (`why_included`, `focus_on`, `notes`) — those are the
   point of the guide.
5. Keep `status = draft` while building. Set `status = published` to go live.

The site is SSR — a published guide appears on `/guides` and `/guides/<slug>` on the
next request, no rebuild needed.

---

## `guides` — the path

| Field | Required | Guidance |
|---|---:|---|
| `title` | Yes | Specific, sentence case, ≤ ~80 chars. e.g. "Learn Airflow the real way". |
| `slug` | Yes | Permanent `kebab-case` URL segment. Don't change after publishing. |
| `status` | Yes | `draft` while building, `published` to go live, `archived` to retire. |
| `summary` | Yes | One or two sentences (≤ ~200 chars). Used on cards + as the meta description. |
| `cover_image` | No | ≥ 1200px wide. Optional — a tasteful generated cover is shown if omitted. |
| `difficulty` | Yes | `beginner` / `intermediate` / `advanced`. A filter facet on the catalogue. |
| `estimated_duration_minutes` | No | Your honest total estimate, in minutes. Not auto-summed. |
| `featured` | No | One featured guide leads the catalogue and the home teaser. |
| `why_this_path` | Yes | Markdown. The pitch: why this guide exists and why this route. |
| `expected_outcome` | No | Markdown. What the learner can do after finishing. |
| `recommended_audience` | No | One line: who this is for ("Python devs who've never run a scheduler"). |
| `author` | Yes | Relation to the primary curator's `authors` profile (the byline). |
| `authors` | No | Additional contributing curators (M2M). |
| `topics` | No | Shared site taxonomy (same as posts). Drives filtering + related guides. |
| `specialties` | No | Discipline tags, for grouping/affinity. |

## `guide_sections` — the groups

| Field | Required | Guidance |
|---|---:|---|
| `guide` | Yes | The parent guide. |
| `title` | Yes | A phase of the path, e.g. "Get something running", "Going deeper". |
| `description` | No | Markdown. A short intro shown above the section's items. |
| `sort` | Yes | Order within the guide (1, 2, 3 …). |

A guide with no sections still renders (items fall back to one "All resources" group),
but real sections make the path scannable — use them.

## `guide_items` — the resources

| Field | Required | Guidance |
|---|---:|---|
| `section` | Yes | The parent section. |
| `type` | Yes | One of the types below — decides the icon and how the item opens. |
| `title` | Yes | What the resource is. |
| `description` | No | One line: what it is / what it covers. |
| `url` | cond. | Required for link-like types (see table). |
| `asset` | cond. | Upload for `pdf` / `uploaded_file`. |
| `body` | cond. | Markdown content for `code_sample` / `cheat_sheet` / `personal_note` / `exercise`. Supports the same `:::` callouts and code blocks as blog posts. |
| `why_included` | No* | **Curator value.** Why this item is on the path. |
| `focus_on` | No* | **Curator value.** What to focus on / what to skip. |
| `notes` | No* | **Curator value.** Gotchas, personal notes, setup traps. |
| `estimated_time_minutes` | No | Per-item time estimate (feeds "time remaining"). |
| `difficulty` | No | Optional per-item override. |
| `sort` | Yes | Order within the section. |

\* Not technically required, but a guide without these is just a link list. Fill at
least `why_included` on most items — that judgement is what people come for.

### `type` → which field to fill, how it opens

| `type` | Fill | Opens as |
|---|---|---|
| `youtube` | `url` (watch/share link) | Inline facade → click loads a privacy-friendly embed |
| `external_url` | `url` | Link, new tab (shows the hostname) |
| `github_repo` | `url` | Link, new tab |
| `docs_page` | `url` | Link, new tab |
| `notebooklm` | `url` | Link, new tab |
| `pdf` | `asset` | Open / download |
| `uploaded_file` | `asset` | Download |
| `code_sample` | `body` (markdown) | Rendered inline (code blocks get a copy button) |
| `cheat_sheet` | `body` (markdown) | Rendered inline |
| `personal_note` | `body` (markdown) | Rendered inline |
| `exercise` | `body` (markdown) | Rendered inline |

---

## Good-guide checklist

- [ ] The **order** tells a story — first item gets someone to a quick win.
- [ ] Most items say **why they're here** in one or two sentences.
- [ ] You've added **focus_on** wherever a resource is long or partly irrelevant.
- [ ] Time estimates are honest (they drive "time remaining").
- [ ] `summary`, `why_this_path`, and `difficulty` are filled — they're the public pitch.
- [ ] `status = published` only when you'd happily share the link.

Related: `docs/agent-workspace/08-DIRECTUS-CONTENT-MODEL.md` §4 (schema),
`docs/agent-workspace/reports/field-guides-auth-plan.html` (auth/setup), and
`scripts/migrations/v4-guides-schema.mjs` (creates these collections + the seed example).
