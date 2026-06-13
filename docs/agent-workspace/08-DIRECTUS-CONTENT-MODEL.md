# 08 — Directus Content Model (v4)

Directus owns **only** editorial/relational/user content (boundary contract: 03 §3).
ERD: `assets/diagrams/directus-erd.md`. Example records: `assets/content-models/example-records.md`.

## 1. Scope summary

| | Collections |
|---|---|
| **Add (v4.0)** | `posts`, `authors`, `specialties`, `authors_specialties`, `topics`, `posts_topics` |
| **Add (v4.1)** | `courses`, `lessons`, `resources`, `courses_topics`, `courses_authors`, `enrollments`, `lesson_completions`, `badges`, `user_badges`, `course_votes` |
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
(v4.0) and courses (v4.1) — single taxonomy, **deviation from COURSES_PRD** `course_tags`
(§9.4): one tag system beats two; recorded in §9 conflict table.

### 3.5 Junctions
`authors_specialties (id, authors_id, specialties_id, sort)` — unique (authors_id,
specialties_id). `posts_topics (id, posts_id, topics_id)` — unique pair.

## 4. v4.1 schema (courses)

Adopt COURSES_PRD §9 with these amendments (everything else verbatim from the PRD —
do not duplicate it here; the PRD remains the source for fields not mentioned):

| PRD item | Amendment | Why |
|---|---|---|
| `course_tags` + junction | **Replaced** by `topics` + `courses_topics(courses_id, topics_id)` | single taxonomy (§3.4) |
| — | **New** `courses_authors (courses_id, authors_id, sort)` M2M | Dream Team ↔ courses relationship (requirement); instructor display + author pages |
| `courses.utility_score_cached`, `vote_count_cached` | keep (write path = vote endpoint only) | computed-on-read would N+1 the catalogue |
| `courses.total_lessons_cached`, `total_duration_seconds_cached` | keep, recomputed by Directus Flow on lesson save (PRD §16.2–16.3) | catalogue perf |
| `lessons.slug` | unique **per course** — enforce composite unique index (course_id, slug) | PRD said "unique per course" without mechanism |
| `enrollments`, `lesson_completions`, `user_badges`, `course_votes` | unique composite indexes exactly per PRD §9.7–9.11 | idempotency depends on them |
| statuses | normalize to draft/published/archived (PRD used draft/published) | §2 convention |

## 5. Access policies

| Role | Access |
|---|---|
| **Public** | read published: `posts`, `authors`, `specialties`, `topics`, junctions, `directus_files` (asset transform reads); v4.1 adds published `courses`, `lessons`, `resources` (public types only per PRD §7.11), `badges` |
| **student** (v4.1) | Public + read own rows: enrollments, lesson_completions, course_votes, user_badges (`user_id = $CURRENT_USER`); read own user; **no writes** |
| **service token** (v4.1) | Astro server endpoints use a dedicated `service` role token (not full admin): CRUD on enrollments/completions/votes/user_badges, read everything. Stored as `DIRECTUS_SERVICE_TOKEN` env (frontend resource, server-only) |
| **editor** | full CRUD on content collections via Directus app |

The v3 pattern of the frontend logging in with **admin email/password** is retired
(audit §4): v4.0 public reads use the Public role only; `DIRECTUS_EMAIL/PASSWORD`
env vars are removed in V4-CMS-001.

## 6. Cached vs computed — the rule
Store a derived value only when a **list page** would otherwise need per-row
subqueries (course aggregates, vote stats). Everything else (reading time, post
counts on author cards — fetched via one aggregated query, §8.4) is computed at read.

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
// v4.1 adds same aggregate over courses_authors

// 8.5 course catalogue (v4.1)
readItems('courses', { filter: { status: published, level?, topics? },
  sort: ['-date_created'], fields: ['id','slug','title','short_description','level',
  'cover_image.id','badge_enabled','utility_score_cached','vote_count_cached',
  'total_lessons_cached','total_duration_seconds_cached',
  'topics.topics_id.{name,slug}','instructors:courses_authors.authors_id.{slug,display_name}'] })

// 8.6 course by slug → + lessons (sorted lesson_number) + resources + instructors
// 8.7 learner progress (server, service token):
//   enrollment by (user_id from session, course_id) + completions by user+lesson set
// 8.8 related posts: topics overlap → readItems('posts', { filter: { topics: { topics_id:
//   { slug: { _in: post.topicSlugs } } }, id: { _neq: post.id }, status: published },
//   limit: 3 }) → fallback latest(3)
```

Error policy: repositories catch SDK errors, log once with context, and **throw a
typed `RepositoryError`** — pages decide between ErrorState section vs 404/500
(05 universal rules). The v3 silent-empty-array pattern is retired for primary
fetches (kept only for decorative strips like footer topics).

## 9. COURSES_PRD conflict resolutions

| PRD says | v4 decision |
|---|---|
| §4 design tokens/typography (Anton, brutalist) | superseded by 04 (Observatory) |
| §17.1 nav "About·Projects·Logs·Courses·Connect" pill | superseded by 03 §2 nav model |
| course_tags collection | merged into `topics` (§3.4) |
| instructor = "Atef Alvi" literal in JSON-LD | instructors from `courses_authors` |
| `/student` naming | kept (`/student`, role `student`) |
| Badge design guidance (Anton, square) | restyled per 04; badge images regenerated at v4.1 |
| Wireframes §8 | superseded by 05 §14–18 layouts; flows/journeys (§6) remain authoritative |
| Everything in §7 (functional), §9 (data, as amended §4), §10–12 (API/auth/security), §14–16 (email, errors, policies/flows) | **adopted as-is** |

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
5. v4.1 **V4-CRS-001** — courses suite per §4 + roles/policies + service token +
   Directus Flows (PRD §16.2–16.3). Each step ends with a fresh `snapshot.yaml`
   committed.

Rollback: every migration task records the inverse operation in the handoff before
running; DB backup precedes every schema-touching task.

## 11. Example records
See `assets/content-models/example-records.md` (one realistic record per collection,
used as seed/test fixtures).
