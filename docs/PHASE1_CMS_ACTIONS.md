# Phase 1 production CMS actions

Verified against the public production site on July 16, 2026. The Directus credentials
available in this workspace returned `401`, so these records were not changed
automatically. Preserve the records and set `status = archived` (or `draft` if they
will be rewritten for launch); do not delete them.

## Published Writing fixtures

- `rich-content-blocks-demo` — **Rich Content Blocks Demo**
- `data-structure-before-dashboard-design` — **Data Structure Before Dashboard Design**
- `people-analytics-is-not-just-hr-reporting` — **People Analytics Is Not Just HR Reporting**
- `why-data-dreamer-exists` — **Why Data Dreamer Exists**

## Published Project fixtures

- `tableau-waterfall-chart` — **Waterfall charts, the Gantt method**
- `airflow-retry-framework` — **A retry framework that survives production**
- `signal-dashboard` — **Signal, made legible**

## Published Guide fixtures

- `learn-airflow-the-real-way` — **Learn Airflow the real way**

## Records requiring an owner decision

The following public records may be legitimate launch identity/taxonomy data rather
than demo content, so Phase 1 does not archive them automatically:

- Dream Team: `syed-atef-alvi` — **Syed Atef Alvi**
- Dream Team: `maria-khan` — **Maria Khan**
- Topics: `analytics`, `data-engineering`, `people-analytics`, `research`

If Maria Khan is a test identity, set `dream_team = false` and archive the author
profile. If a topic exists only for fixtures and is not part of the intended launch
taxonomy, archive it after the related fixture content is archived. Empty topics are
not emitted in the sitemap or footer, but a still-published topic remains reachable by
its known direct URL.

## Verification after the CMS update

Each fixture URL above must return `404`, and `/`, `/blog`, `/projects`, and `/guides`
must render their intentional empty states without fixture cards. Then request:

- `/sitemap-posts.xml` — no fixture Writing URLs;
- `/sitemap-content.xml` — no fixture Project or Guide URLs;
- `/sitemap-index.xml` — references both dynamic sitemaps and the static sitemap.

Public HTML is cached for up to five minutes at the intended edge policy. Purge the
affected URLs or allow the TTL to expire before performing the final check.
