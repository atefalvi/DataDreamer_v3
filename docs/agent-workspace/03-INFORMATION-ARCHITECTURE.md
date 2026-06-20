# 03 — Information Architecture

## 1. Full v4 route map

```
/                                   Home
/about                              About
/projects                           Project index
/projects/[slug]                    Project case study
/blog                               Blog landing
/blog/[slug]                        Article
/blog/topic/[slug]                  Topic listing (thin page, indexable)
/dream-team                         Team landing (node graph + list)
/dream-team/[slug]                  Author page
/connect                            Contact
/privacy                            Privacy policy (static)
/404                                Not found (custom)
/500                                Server error (custom, rendered by error middleware)
/rss.xml                            Blog RSS feed
/sitemap-index.xml                  (generated)

— v4.1 (Field Guides release) —
/guides                             Catalogue (Field Guides)
/guides/[slug]                      Public guide preview or logged-in guide reader
/login                              Public auth page
/signup                             Public account creation page
/account                            Protected learner progress page
/api/auth/*                         Astro auth bridge to Directus
/api/guides/progress                Protected progress read/write endpoint
```

Field Guides are **public previews with a login-gated reader**. Visitors can browse
guide cards and preview pages, including syllabus section titles, but item bodies,
curator notes, completion controls, and resume state require authentication. There is
no separate per-item page: items are curated external resources and render inline in
the authenticated guide reader (open externally or expand in place — `05` §15). The
retired course routes (`/courses`, `/courses/[slug]/[lesson]`, `/student`,
`/api/courses/*`) are not built.

### Redirects (must ship with v4.0)

| From | To | Type | Why |
|---|---|---|---|
| `/logs` | `/blog` | 301 | Section rename; preserve search equity |
| `/logs/[slug]` | `/blog/[slug]` | 301 | Slugs unchanged — only the prefix moves |
| `/logs/rss` (if ever linked) | `/rss.xml` | 301 | n/a today, cheap insurance |

Implementation: Astro `redirects` map in `astro.config.mjs` for the static pair, plus a
`src/pages/logs/[...rest].astro` catch-all that 301s to `/blog/{rest}` (dynamic slugs
can't be enumerated at config time under SSR).

## 2. Navigation model

### Primary nav (desktop, left→right)
`Logo` · `Work` · `Blog` · `Guides`(v4.1) · `Dream Team` · `About` — right side:
theme toggle · `Connect` (button-styled CTA). When guides/auth are enabled, show a
compact `Sign in` link for anonymous visitors and `Account` for authenticated readers.

- "Work" routes to `/projects` (label tested better than "Projects" for client audience;
  the route stays `/projects`).
- "Guides" routes to `/guides` (the Field Guides catalogue), gated by
  `FLAGS.GUIDES_ENABLED` until v4.1 ships.
- No dropdowns/mega-menu in v4.0: six items max fits comfortably to 768px. If guides
  later need sub-nav, it lives on the guide pages, not in the global bar.
- Active state: route-prefix matching (`/blog*` → Blog active; `/guides*` → Guides active).

### Mobile nav
Hamburger → full-height overlay panel (not a dropdown strip): nav links stacked large,
then Connect CTA, then theme toggle and social links at the bottom. Spec + focus
management pseudocode in `07-ANIMATION-INTERACTION-SPEC.md` §3.

### Footer (all pages)
Four columns desktop / stacked mobile:
1. Mark + one-line mission + © line.
2. Explore: Home, Work, Blog, Guides, Dream Team, About, Connect.
3. Topics: top 5 topics by post count (link to `/blog/topic/[slug]`).
4. Elsewhere: GitHub, LinkedIn, X, Email, RSS. (+ Privacy link in the © row.)
Newsletter slot: reserved area in column 1, hidden behind a code-level flag
(`SHOW_NEWSLETTER = false` in `src/content/site.ts`) until infrastructure exists.

## 3. Content classification (the Directus boundary)

Every piece of content is classified into exactly one bucket. **This table is the
contract; agents must not move content across buckets without updating this doc.**

| Content | Bucket | Lives in | Why |
|---|---|---|---|
| Blog posts | Directus editorial | `posts` collection | Frequent, authored by multiple people, workflow needs draft/publish |
| Topics | Directus editorial | `topics` + junctions | Shared taxonomy for posts & Field Guides, editor-managed |
| Authors / Dream Team profiles | Directus editorial | `authors` (+ `specialties`) | Multi-person, evolves, relates to posts/guides |
| Author↔post, author↔guide relations | Directus relational | M2O / M2M | Relational integrity belongs in the DB |
| Field Guides (paths, sections, items) | Directus editorial | `guides` / `guide_sections` / `guide_items` per `08-…` §4 | Curators publish without code changes |
| Learner accounts | Directus system | `directus_users` with `guide_reader` role | Required to start/read guides and keep progress tied to one person |
| Learner progress | Directus relational | `guide_progress` (`09` §10) | One lightweight row per user+guide; no LMS enrollment model |
| Media for the above | Directus files | `directus_files` | Belongs with its content |
| Homepage copy (hero headline, section intros) | Repo static | `src/content/site.ts` | Changes ~quarterly with design intent; versioned with the code that lays it out |
| About page content (bio, timeline, skills, stats, portrait) | Repo static | `src/content/about.ts` + `src/assets/` | Single-owner, rarely changes; v3's JSON-blob singleton was the worst of both worlds |
| Projects / case studies | Repo static | Astro content collection `src/content/projects/*.md` | Long-form, image-heavy, written by the owner in an editor with git review; ~quarterly cadence. Removes `projects` collection from Directus |
| Contact channels, social links | Repo static | `src/content/site.ts` | Change ≈ never; not worth a CMS round-trip |
| Nav labels, button text, empty-state copy, error pages | Code-owned UI text | components | UI text is design |
| Legal (privacy) | Repo static | `src/pages/privacy.astro` | Versioned text |
| Site URL, Directus URLs, tokens | Environment config | `.env` / Coolify | Secrets & deployment topology |
| Footer CTA heading, "status_text" badge | **Retired** | — | v3 singleton fields with no v4 equivalent |
| Future: testimonials, press, multi-language | Future configurable | revisit | Not in v4 |

Consequences:
- Directus collections **retired**: `site_settings`, `home_settings`, `about`,
  `projects` (after content migration to repo markdown — task V4-CMS-005).
- Directus collections **added for v4.0**: `posts`, `authors`, `specialties`,
  `authors_specialties`, `topics`, `posts_topics`; v4.1 adds the Field Guides suite
  (`guides`, `guide_sections`, `guide_items`, `guides_topics`, `guides_specialties`,
  `guides_authors`) plus `guide_progress` and the Directus system users/roles needed
  for guide readers.

## 4. URL & slug rules

- Slugs: lowercase, hyphenated, no dates, ≤ 60 chars, immutable after publish.
- Post slugs migrate unchanged from `/logs/*` to `/blog/*`.
- Author slugs: `firstname-lastname` (e.g. `atef-alvi`).
- Topic slugs: single word or hyphenated (`data-engineering`).
- Canonical host `https://data-dreamer.net`, no trailing slashes (Astro default),
  enforce via canonical tags (see `10-SEO-OG-METADATA.md`).

## 5. Page-level hierarchy of attention (per page, one primary action)

| Page | Primary action | Secondary |
|---|---|---|
| Home | Read the latest post | Explore work / guides teaser |
| Blog landing | Open a post | Filter by topic |
| Article | Read to end | Visit author page; read related |
| Project index | Open a case study | Filter by tag |
| Case study | Read; contact | Next project |
| Dream Team | Open an author | Filter by specialty |
| Author page | Read their posts | Their guides; their links |
| About | Contact | Read blog |
| Connect | Send email | Open social profile |
| Guides catalogue (v4.1) | Open a Field Guide preview | Filter by topic/difficulty |
| Field Guide preview (v4.1) | Sign in to start | Review syllabus; evaluate fit |
| Field Guide reader (v4.1) | Start / resume the path | Jump to a section; open an item |
| Account (v4.1) | Resume a guide | Manage session |

## 6. Site map diagram

See `assets/diagrams/site-map.md` (Mermaid) — keep in sync with §1 when routes change.
