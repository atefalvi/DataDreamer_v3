# 08 — Directus Content Model (v4)

Directus owns **only** editorial/relational/user content (boundary contract: 03 §3).
ERD: `assets/diagrams/directus-erd.md`. Example records: `assets/content-models/example-records.md`.

## 1. Scope summary

| | Collections |
|---|---|
| **Add (v4.0)** | `posts`, `authors`, `specialties`, `authors_specialties`, `topics`, `posts_topics` |
| **Add (v4.1 — Field Guides)** | `guides`, `guide_sections`, `guide_items`, `guides_topics`, `guides_specialties`, `guides_authors`, `guide_progress`; Directus system users/roles for guide readers |
| **Retire** | `site_settings`, `home_settings`, `about` (→ repo, 03 §3), `projects` (→ content collection, after migration V4-CMS-005) |

## 2. Naming conventions

Plural snake_case collections; junctions `a_b` (left = owning side); fields snake_case;
every content collection has `status`, `sort` only where manual ordering matters,
`date_created`/`date_updated` (Directus-managed). Statuses: `draft | published |
archived` everywhere (archived = unpublished-but-kept; never delete published content).

### 2.1 Decision: use `posts` as the physical collection name
The v4 staging CMS is greenfield. The Directus collection, repository layer, and UI
language all use `posts`. Legacy `/logs/*` URLs remain only as route-level 301
redirects to `/blog/*`; they are not CMS collection names.

## 3. v4.0 schema

### 3.1 `posts`

| Field | Type | Req | Notes |
|---|---|---|---|
| `id, title, slug, status, published_at, excerpt, content, post_number, series_label` | — | — | created by V4-CMS-001; slug **unique index** |
| `author` | M2O → `authors` | ✅ | added by V4-CMS-002 |
| `cover_image` | file M2O | — | new, optional; used for cards + OG |
| `featured` | boolean default false | — | new; blog landing hero pick |
| `topics` | M2M via `posts_topics` | — | topic taxonomy for filtering and related posts |
| `reading_time` | — | — | **not stored** — computed at render (cheap, derivable; cached fields only where queries need them, see §6) |

Validation: slug regex `^[a-z0-9]+(-[a-z0-9]+)*$`, ≤60 chars; excerpt ≤200;
title ≤120. Sort default `-published_at`.

### 3.2 `authors`

| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | uuid PK | | |
| `status` | enum draft/published/archived | ✅ | archived authors keep pages 404'd but relations intact |
| `slug` | string, unique | ✅ | `firstname-lastname` |
| `display_name` | string ≤80 | ✅ | |
| `role_title` | string ≤80 | ✅ | "Data Engineer" |
| `bio` | text (markdown) | ✅ | rendered through pipeline |
| `statement` | string ≤200 | — | pull-quote on author page |
| `avatar` | file M2O | — | enforce ≥512px square (Directus validation note in collection description) |
| `links` | json `[{label, url}]` | — | validated server-side on read (zod) |
| `tools` | json `string[]` | — | chip list |
| `featured_work` | json `[{title, url, description?}]` max 2 | — | |
| `specialties` | M2M via `authors_specialties` | ✅ ≥1 | **order matters**: junction `sort` field; first = primary (graph clustering) |
| `sort` | integer | — | manual ordering in lists |

### 3.3 `specialties`
`id, status, name (≤40, unique), slug (unique), description (≤200), color_key
(enum viz-1…viz-6), sort`. Expected seed: Data Engineering, Analytics, Machine
Learning, AI & Agents, Automation, Visualization.

### 3.4 `topics`
`id, status, name (unique ≤40), slug (unique), description (≤200)`. Shared by posts
(v4.0) and Field Guides (v4.1) via `posts_topics` and `guides_topics` — one single
taxonomy across the whole site (no separate "course tags").

### 3.5 Junctions
`authors_specialties (id, authors_id, specialties_id, sort)` — unique (authors_id,
specialties_id). `posts_topics (id, posts_id, topics_id)` — unique pair.

## 4. v4.1 schema (Field Guides)

Supersedes the earlier "courses" suite (`courses/lessons/resources/enrollments/
badges/...`). That was a traditional LMS model and is **dropped** — see `01` §1a for
the product rationale. Field Guides are **curated learning paths**: public previews
with a login-gated reader. There are no enrollments, votes, certificates, badges, or
LMS dashboards; learner state is limited to one progress record per user and guide
(`guide_progress`, §4.5).

Three editorial collections + three editorial junctions + one learner progress
collection. Editorial collections follow §2 conventions (snake_case, `status` =
draft/published/archived, `date_created`/`date_updated`).

### 4.1 `guides` (a Field Guide = one learning path)

| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | uuid PK | | |
| `status` | enum draft/published/archived | ✅ | only `published` is publicly readable |
| `slug` | string, unique | ✅ | regex `^[a-z0-9]+(-[a-z0-9]+)*$`, ≤60; immutable after publish |
| `title` | string ≤120 | ✅ | |
| `summary` | string ≤200 | ✅ | card + meta description |
| `cover_image` | file M2O | — | card + hero + OG; ≥1200px wide |
| `difficulty` | enum beginner/intermediate/advanced | ✅ | filter facet |
| `estimated_duration_minutes` | integer | — | **curator-entered** total; not auto-summed (items are external; durations are estimates anyway) |
| `featured` | boolean default false | — | catalogue hero + home teaser pick |
| `why_this_path` | text (markdown) | ✅ | "why this guide exists" — the curator's pitch |
| `expected_outcome` | text (markdown) | — | "what you'll be able to do after" |
| `recommended_audience` | string ≤200 | — | "who this is for" |
| `author` | M2O → `authors` | ✅ | the primary curator (card byline) |
| `authors` | M2M via `guides_authors` | — | additional contributors (order = junction `sort`) |
| `topics` | M2M via `guides_topics` | — | shared taxonomy (§3.4); filtering + related |
| `specialties` | M2M via `guides_specialties` | — | discipline grouping (graph/clustering parity with authors) |
| `sort` | integer | — | manual ordering in catalogue |

Notes: aggregates the catalogue needs (item count, section count) are **computed at
read** via one aggregated query (§6, §8.x) — not cached — because guides are small
(tens of items) and the catalogue page is short. `estimated_duration_minutes` is a
curator field, not a cache, so no Directus Flow is required anywhere in this suite.

### 4.2 `guide_sections` (ordered groups inside a guide)

| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | uuid PK | | |
| `guide` | M2O → `guides` | ✅ | parent path |
| `title` | string ≤120 | ✅ | "Foundations", "Going deeper" |
| `description` | text (markdown) | — | optional intro shown above the section's items |
| `sort` | integer | ✅ | section order within the guide |

A guide with no explicit sections still renders: the UI falls back to a single
implicit "All resources" section (`05` §15). Sections have no `status` of their own —
they inherit visibility from the parent guide.

### 4.3 `guide_items` (the curated resources)

| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | uuid PK | | |
| `section` | M2O → `guide_sections` | ✅ | parent section (also gives the guide transitively) |
| `type` | enum (see below) | ✅ | drives the item card + how it opens |
| `title` | string ≤140 | ✅ | |
| `url` | string ≤500 | cond. | required for link-like types (`youtube`, `external_url`, `github_repo`, `docs_page`, `notebooklm`); validated by type |
| `asset` | file M2O | cond. | required for `pdf` / `uploaded_file`; Directus file |
| `body` | text (markdown) | cond. | the content itself for `personal_note` / `cheat_sheet` / `code_sample` / `exercise` (rendered via the markdown pipeline) |
| `description` | string ≤300 | — | one-line "what this is" |
| `why_included` | text (markdown) | — | **curator value**: why this item is on the path |
| `focus_on` | text (markdown) | — | **curator value**: what to focus on / what to skip |
| `notes` | text (markdown) | — | **curator value**: personal notes / gotchas |
| `estimated_time_minutes` | integer | — | per-item time estimate |
| `difficulty` | enum beginner/intermediate/advanced | — | optional per-item override |
| `sort` | integer | ✅ | item order within the section |

`type` enum (the flexible resource kinds from the requirement):
`youtube` · `external_url` · `pdf` · `uploaded_file` · `notebooklm` · `github_repo` ·
`code_sample` · `cheat_sheet` · `personal_note` · `exercise` · `docs_page`.

Per-type field validation (enforced in the repository mapper + Directus field
conditions, documented in the collection description):
- `youtube` → `url` (a YouTube watch/share URL); rendered as a facade embed (`05` §15).
- `external_url`, `github_repo`, `docs_page`, `notebooklm` → `url`; open in a new tab.
- `pdf`, `uploaded_file` → `asset`.
- `code_sample`, `cheat_sheet`, `personal_note`, `exercise` → `body` markdown (may
  *also* set `url` to point at a repo/source).

### 4.4 Junctions

`guides_topics (id, guides_id, topics_id)` — unique pair.
`guides_specialties (id, guides_id, specialties_id, sort)` — unique pair; `sort` =
primary-first (parity with `authors_specialties`).
`guides_authors (id, guides_id, authors_id, sort)` — unique pair; additional
contributors beyond `guides.author`.

### 4.5 `guide_progress` (learner state)

One row per authenticated guide reader and guide. This is progress tracking, not an
enrollment model.

| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | uuid PK | | |
| `user` | M2O → `directus_users` | ✅ | owner; permissions always filter to current user |
| `guide` | M2O → `guides` | ✅ | parent guide |
| `completed_items` | json `string[]` | ✅ | guide item ids marked complete; mapper prunes ids no longer in the guide |
| `last_item` | M2O → `guide_items` | — | resume target; fallback = first incomplete item |
| `status` | enum not_started/in_progress/completed | ✅ | derived on write for simple admin visibility |
| `percent` | integer 0–100 | ✅ | derived on write; source of truth remains completed_items + current item list |
| `started_at` | datetime | — | first write for the guide |
| `completed_at` | datetime | — | set when status becomes completed; cleared if progress regresses |
| `date_created`, `date_updated` | Directus-managed | | |

Indexes/integrity: unique `(user, guide)`. Deleting a user deletes their progress.
Archiving a guide keeps progress rows but the reader UI no longer exposes the guide.

### 4.6 Indexes & integrity
- `guides.slug` unique.
- `guide_sections (guide, sort)` — list ordering; not unique.
- `guide_items (section, sort)` — list ordering; not unique.
- `guide_progress (user, guide)` unique.
- ON DELETE: deleting a guide cascades sections → items (Directus relation cascade);
  prefer `status=archived` over deletion for published guides (§2). Progress rows for
  archived guides are retained for audit/recovery.

### 4.7 What was dropped vs. the old "courses" plan
`enrollments`, `lesson_completions`, `course_votes`, `badges`, `user_badges`, the
`student` Directus role and Directus Flows for aggregate recompute. Guide access uses
the low-permission `guide_reader` identity role and progress is one user-owned row.
On Directus editions without custom field/row rules, a non-admin Guide Server token is
required by Astro; it never reaches the browser. Migration impact is tracked in
`12-IMPLEMENTATION-ROADMAP.md` and `13-TASKS.md`.

## 5. Access policies

| Role | Access |
|---|---|
| **Public** | read published editorial collections and assets; guide collections remain closed when field-limited rules are unavailable |
| **guide_reader** | authenticate via `/users/me`; Astro gates the reader using this verified user id and never grants browser access to the user directory |
| **Guide Server** | non-admin, server-only guide/progress access plus explicit `directus_users`/`directus_files` reads; Astro filters published content, scopes progress, and enriches only the already-verified current user profile/avatar |
| **editor** | full CRUD on content collections via Directus app |

v4.1 adds authenticated end-user access, but only for guide reading/progress. The v3
admin email/password login pattern stays retired; `DIRECTUS_EMAIL/PASSWORD` env vars
are not reintroduced. User auth uses Directus native auth/SSO, not an admin credential.

## 6. Cached vs computed — the rule
Store a derived value only when a **list page** would otherwise need per-row
subqueries. In practice v4 stores **none**: posts/authors aggregates and Field Guide
aggregates (item count, section count, summed item time) are all computed at read via
one aggregated query (§8.4), because every list page is short. The earlier "courses"
plan cached lesson counts / durations / vote scores and recomputed them with Directus
Flows; Field Guides drop all of that.

## 7. Editorial workflow
Draft → published via status change (visible immediately — SSR). Archived hides from
site, keeps data. Slug immutability: Directus field set to non-editable after creation
(field condition), documented in the updated authoring guide (V4-DOC-002 rewrites
`AGENT_BLOG_GUIDE.md` for v4: same `:::` syntax + new callout types + topics M2M
+ author selection).

## 8. Query contracts (implemented only in `lib/repositories/`)

All examples use the Directus SDK; fields lists are explicit (never `*` except
singleton-free now). Repository functions return view-models (06 §7), never SDK rows.

```ts
// 8.1 posts list (blog landing / topic / author) — NO content field
readItems('posts', {
  filter: { status: { _eq: 'published' },
            ...(topic && { topics: { topics_id: { slug: { _eq: topic } } } }),
            ...(author && { author: { slug: { _eq: author } } }) },
  sort: ['-published_at'], limit: 12, page,
  fields: ['id','slug','title','excerpt','published_at','featured','series_label',
    'post_number','cover_image.id','cover_image.width','cover_image.height',
    'author.slug','author.display_name','author.avatar.id',
    'topics.topics_id.name','topics.topics_id.slug'] })

// 8.2 post by slug (article) — adds content; single item
readItems('posts', { filter: { slug: {_eq: slug}, status: {_eq:'published'} },
  limit: 1, fields: [...listFields, 'content'] })
// reading_time computed from content; bodyHtml + headings from markdown pipeline

// 8.3 author by slug + their posts
readItems('authors', { filter: { slug: {_eq}, status: {_eq:'published'} }, limit: 1,
  fields: ['id','slug','display_name','role_title','bio','statement','links','tools',
    'featured_work','avatar.id','specialties.sort',
    'specialties.specialties_id.{name,slug,color_key}'] })
// posts: query 8.1 with author filter

// 8.4 dream-team graph data — one query + one aggregate
authors  = readItems('authors', { filter: published, fields: [core + specialties…] })
counts   = readItems('posts', { filter: published, aggregate: { count: 'id' },
                               groupBy: ['author'] })          // single aggregate
// v4.1 adds same aggregate over guides_authors

// 8.5 Field Guide catalogue (v4.1) — cards only, no sections/items
readItems('guides', { filter: { status: published, difficulty?, topics? },
  sort: ['-featured','sort','-date_created'], limit, page,
  fields: ['id','slug','title','summary','difficulty','featured',
  'estimated_duration_minutes','cover_image.id','cover_image.width','cover_image.height',
  'author.slug','author.display_name','author.avatar.id',
  'topics.topics_id.{name,slug}'] })
// item/section counts for cards: one aggregate over guide_items grouped by the parent
// guide (via section→guide), computed at read — never cached (§6).

// 8.6 Field Guide preview by slug → public landing (no item bodies)
readItems('guides', { filter: { slug: {_eq}, status: published }, limit: 1,
  fields: ['id','slug','title','summary','difficulty','featured',
    'estimated_duration_minutes','cover_image.id','why_this_path',
    'expected_outcome','recommended_audience','date_updated',
    'author.{slug,display_name,role_title,avatar.id}',
    'authors.authors_id.{slug,display_name,avatar.id}',
    'topics.topics_id.{name,slug}','specialties.specialties_id.{name,slug,color_key}',
    'sections.{id,title,description,sort}'] })

// 8.7 Field Guide reader by slug → authenticated full path (deep read, one query)
readItems('guides', { filter: { slug: {_eq}, status: published }, limit: 1,
  fields: ['…all guide fields…',
    'author.{slug,display_name,role_title,avatar.id}',
    'authors.authors_id.{slug,display_name,avatar.id}',
    'topics.topics_id.{name,slug}','specialties.specialties_id.{name,slug,color_key}',
    // nested sections + items, ordered:
    'sections.{id,title,description,sort}',
    'sections.items.{id,type,title,url,asset.id,body,description,why_included,' +
      'focus_on,notes,estimated_time_minutes,difficulty,sort}'] })
// repository sorts sections by sort, items by sort; markdown fields (why_this_path,
// expected_outcome, body, why_included, focus_on, notes) run through the pipeline.
// Only call this through an authenticated request/session.

// 8.8 guide progress by current user + guide
readItems('guide_progress', { filter: { user: {_eq: '$CURRENT_USER'}, guide: {_eq: id} },
  limit: 1, fields: ['id','completed_items','last_item','status','percent',
    'started_at','completed_at','date_updated'] })

// 8.9 related posts: topics overlap → readItems('posts', { filter: { topics: { topics_id:
//   { slug: { _in: post.topicSlugs } } }, id: { _neq: post.id }, status: published },
//   limit: 3 }) → fallback latest(3)
```

Error policy: repositories catch SDK errors, log once with context, and **throw a
typed `RepositoryError`** — pages decide between ErrorState section vs 404/500
(05 universal rules). The v3 silent-empty-array pattern is retired for primary
fetches (kept only for decorative strips like footer topics).

## 9. COURSES_PRD status: superseded by the Field Guides model

The old `COURSES_PRD` described a full LMS (course/module/lesson, enrollment, auth,
votes, badges, certificates, Directus Flows, learner email). That product direction is
**retired** — see `01` §1a. The PRD is kept only as historical reference; nothing in it
is authoritative for v4.1 except where the table below re-adopts it.

| PRD concept | v4.1 (Field Guides) decision |
|---|---|
| Course / module / lesson hierarchy | **Replaced** by Learning Path → `guide_sections` → `guide_items` (§4) |
| `lessons` as authored video+notes pages | Replaced by `guide_items` of many types (curated resources, not authored lessons) |
| `resources` collection | Merged into `guide_items` (a resource *is* an item) |
| `course_tags` | Merged into shared `topics` (§3.4) |
| `enrollments`, `lesson_completions` | **Replaced** by one `guide_progress` row per user+guide (§4.5) |
| `course_votes`, `utility_score` | **Dropped** — no rating system in v4.1 |
| `badges`, `user_badges`, certificates | **Dropped** — no gamification (§1a non-goals) |
| `student` role, auth, `/login`/`/signup`, session middleware | **Partly re-adopted** — use `guide_reader`, Directus auth/SSO, login/signup/account pages; no student dashboard or LMS role |
| `service` token, Directus Flows for aggregate recompute | **Dropped** — no server learner writes; aggregates computed at read (§6) |
| instructor display | `guides.author` + `guides_authors` M2M (Dream Team ↔ guides) |
| §4 design tokens/typography (Anton, brutalist) | superseded by 04 (Observatory) |
| Wireframes §8, page layouts | superseded by 05 §14–15 (Field Guide blueprints) |

## 10. Migration approach (ordered, reversible)

1. **V4-CMS-001** — snapshot backup (`directus schema snapshot` + pg_dump where
   available). Create `posts`, `authors`, `specialties`, `topics` + junctions. Seed
   specialties/topics and the first author. Remove frontend admin login env usage.
2. **V4-CMS-002** — add `posts.author` (M2O authors), `cover_image`, and `featured`;
   for greenfield staging with no posts, record the mapping as a no-op.
3. **V4-CMS-003** — topics assignment: create `posts_topics` rows for seeded/imported
   posts. There are no `tag`/`category` compatibility fields in v4.
4. **V4-CMS-005** — export `projects` rows to `src/content/projects/*.md` (script:
   frontmatter from fields, body = description, download cover images to
   `src/assets/projects/`); verify rendered parity; archive collection (don't drop
   until v4.0 ships — rollback path).
5. v4.1 **V4-GUIDE-001 / V4-AUTH-001** — Field Guides suite per §4: create `guides`,
   `guide_sections`, `guide_items` + the three junctions; create `guide_reader` role
   and `guide_progress`; add Guide Reader identity and Guide Server data policies;
   seed one realistic guide (2–3 sections, ~8 mixed-type items). No Flows. Keep the
   Guide Server static token only in frontend server env. Ends with a fresh
   `snapshot.yaml` committed.

Rollback: every migration task records the inverse operation in the handoff before
running; DB backup precedes every schema-touching task.

## 11. Example records
See `assets/content-models/example-records.md` (one realistic record per collection,
used as seed/test fixtures).
