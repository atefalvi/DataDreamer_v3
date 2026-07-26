# CMS Editorial Workflow

This is the operating model for publishing Data Dreamer content in Directus. The
schema source of truth is `backend/snapshot.yaml`; this document explains how editors
should use it.

## Content model

The three public editorial types are:

- `posts`: focused articles and observations, published under `/blog/<slug>`.
- `projects`: proof-of-work case studies, published under `/projects/<slug>`.
- `guides`: curated learning paths made from ordered `guide_sections` and
  `guide_items`, published under `/guides/<slug>`.

All three relate to `authors` and the shared `topics` taxonomy. Projects may also use
free-form `tags` for technologies and implementation details. Use a topic for a durable
subject people may browse across content types; use a tag for a specific tool or stack
label. Do not create duplicate topics for spelling or capitalization variants.

The junction collections (`posts_topics`, `projects_topics`, and `guides_topics`) are
implementation details. Editors should manage topics from the relational field on the
parent item.

Junction foreign keys use `ON DELETE CASCADE`: deleting a Post, Project, Guide, Topic,
Author, or Specialty removes only its relationship rows. It does not delete the items
on the other side of a many-to-many relationship. Primary author relations remain
non-cascading so deleting a profile cannot silently delete authored content.

Dream Team Specialties describe transferable capabilities rather than industries or
job titles. Use `docs/SPECIALTIES_TAXONOMY.md` for the canonical catalogue, selection
rules, and synchronization command.

## Status workflow

Use the same lifecycle everywhere:

1. `draft` — incomplete and private.
2. `in_review` — ready for editorial or technical review.
3. `published` — publicly accessible and eligible for discovery.
4. `archived` — retained in the CMS but removed from public queries.

For posts, contributors may create and edit their own drafts and submit them for
review. They cannot publish. An administrator performs the final review and
publication for every content type. When an item first goes live, set `published_at`;
preserve that original date during later edits. `date_created` and `date_updated` are
system-managed audit fields.

## SEO fields

Posts, projects, and guides share three editorial SEO controls:

- `seo_title`: optional search/social title. Leave empty to use the content title.
- `seo_description`: optional search/social description. Leave empty to use the
  excerpt or summary.
- `noindex`: removes the detail page from XML sitemaps and emits a `noindex` directive.
  It does not make content private.

Slugs are permanent public identifiers. Choose a short, descriptive, lowercase
`kebab-case` slug and avoid changing it after publication. A slug change requires a
redirect plan outside Directus.

## Publication checklist

- The title, slug, summary/excerpt, author, and at least one relevant topic are set.
- The content is substantive; no fixture, placeholder, or test copy is present.
- Links, images, code samples, and responsive layouts have been checked.
- The SEO preview reads naturally; overrides are used only when the default is weak.
- `noindex` is off unless exclusion is intentional.
- Accessibility basics are present: meaningful headings, descriptive image alt text,
  and link text that makes sense out of context.
- The item has passed review, `published_at` is correct, and status is `published`.

## Scaling and maintenance

Keep taxonomy small and intentional. Before adding a topic, search for an existing one
that represents the same concept. Review unused and near-duplicate topics periodically.
The shared topic hubs at `/topics/<slug>` create cross-content discovery automatically.

The production schema includes indexes for status, publication date, author, and guide
progress lookup paths. Reassess query plans when content reaches hundreds of records or
analytics show a slow route; do not add speculative indexes for every field.

After an approved Directus structure change, refresh `backend/snapshot.yaml`, review
the diff, and commit it with the application change. Directus roles and permissions are
managed in the production instance and must be verified separately because they are not
fully represented by the schema snapshot.

See `docs/AGENT_BLOG_GUIDE.md`, `docs/AGENT_PROJECTS_GUIDE.md`,
`docs/AGENT_GUIDES_GUIDE.md`, `docs/RICH_CONTENT_BLOCKS.md`, and
`docs/ACCOUNT_MODEL.md` for type-specific instructions and access rules.
