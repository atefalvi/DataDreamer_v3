# Example Records (seed/test fixtures)

One realistic record per collection. Used to seed dev Directus and as repository-test
fixtures. Field meanings: `08-DIRECTUS-CONTENT-MODEL.md`.

## posts

```json
{
  "id": "7f6f2c9e-1111-4a2b-9c3d-aaaa00000001",
  "status": "published",
  "slug": "airflow-retry-patterns",
  "title": "Retry patterns in Airflow that actually survive production",
  "excerpt": "Exponential backoff is not a strategy. Four retry patterns we run in production DAGs, and when each one breaks.",
  "published_at": "2026-05-12T09:00:00Z",
  "featured": true,
  "post_number": 14,
  "series_label": "Pipelines in production",
  "author": "a0e1…0001",
  "cover_image": "f1b2…cover",
  "content": "# Retry patterns…\n\nOpening paragraph…\n\n## The naive default\n\n:::warning Hardware alert\nRetries on **memory-bound** tasks usually re-fail. See [the docs](https://example.com).\n:::\n\n```python\nretries=3\n```\n\n:::details Full DAG config\n…\n:::"
}
```

## authors

```json
{
  "id": "a0e1f7d2-2222-4b3c-8d4e-aaaa00000001",
  "status": "published",
  "slug": "atef-alvi",
  "display_name": "Atef Alvi",
  "role_title": "Data & Analytics Engineer",
  "bio": "Atef builds analytics platforms and homelab-scale ML systems. Previously…",
  "statement": "The data is the model — garbage in, garbage out, always.",
  "avatar": "f9a8…avatar",
  "links": [
    {"label": "GitHub", "url": "https://github.com/atefalvi"},
    {"label": "LinkedIn", "url": "https://linkedin.com/in/atefalvi"}
  ],
  "tools": ["Python", "Airflow", "dbt", "Tableau", "Postgres"],
  "featured_work": [
    {"title": "Tableau waterfall, Gantt method", "url": "https://data-dreamer.net/projects/tableau-waterfall-chart-gantt-method"}
  ],
  "sort": 1
}
```

## specialties (seed set)

```json
[
  {"name": "Data Engineering", "slug": "data-engineering", "color_key": "viz-1", "sort": 1,
   "description": "Pipelines, orchestration, storage, and the systems that move data."},
  {"name": "Analytics", "slug": "analytics", "color_key": "viz-2", "sort": 2,
   "description": "Metrics, modeling, and decision support."},
  {"name": "Machine Learning", "slug": "machine-learning", "color_key": "viz-3", "sort": 3,
   "description": "Training, evaluation, and deployment of learned systems."},
  {"name": "AI & Agents", "slug": "ai-agents", "color_key": "viz-4", "sort": 4,
   "description": "LLM systems, agentic workflows, and applied AI."},
  {"name": "Automation", "slug": "automation", "color_key": "viz-5", "sort": 5,
   "description": "Workflow automation and developer tooling."},
  {"name": "Visualization", "slug": "visualization", "color_key": "viz-6", "sort": 6,
   "description": "Charts, dashboards, and visual communication."}
]
```

## topics (initial mapping from v3 tags — finalized in V4-CMS-003)

```json
[
  {"name": "Machine learning", "slug": "machine-learning", "description": "Training runs, fine-tuning, evals."},
  {"name": "Devlog", "slug": "devlog", "description": "Build notes and progress updates."},
  {"name": "Infrastructure", "slug": "infrastructure", "description": "Docker, deployment, CI/CD, homelab."},
  {"name": "Data", "slug": "data", "description": "Datasets, scraping, cleaning."},
  {"name": "Research", "slug": "research", "description": "Papers and reading notes."},
  {"name": "Tools", "slug": "tools", "description": "Evaluations and benchmarks."}
]
```

## guides — Field Guides (v4.1)

A curated learning path. `why_this_path` / `expected_outcome` are markdown.

```json
{
  "id": "g1d2…0001", "status": "published", "slug": "learn-airflow-the-real-way",
  "title": "Learn Airflow the real way",
  "summary": "The exact path I followed to go from zero to running production DAGs — no fluff, ordered.",
  "cover_image": "f3c4…",
  "difficulty": "beginner",
  "estimated_duration_minutes": 360,
  "featured": true,
  "why_this_path": "Most Airflow tutorials drown you in setup. This path skips that and gets you to a working DAG fast, then fills in scheduling and debugging once you have something to break.",
  "expected_outcome": "You'll be able to write, schedule, and debug your own DAGs and wire them to external systems.",
  "recommended_audience": "Engineers comfortable with Python who have never run a scheduler.",
  "author": "a-atef",
  "sort": 1
}
```

## guide_sections (v4.1)

```json
{ "id": "s1…0001", "guide": "g1d2…0001", "title": "Get something running",
  "description": "Don't read docs yet — get a DAG executing on your machine first.",
  "sort": 1 }
{ "id": "s1…0002", "guide": "g1d2…0001", "title": "Scheduling & debugging",
  "description": null, "sort": 2 }
```

## guide_items (v4.1)

One item per resource kind, showing the curator annotations that carry the value.

```json
{ "id": "i1…0001", "section": "s1…0001", "type": "youtube",
  "title": "Airflow in 100 seconds", "url": "https://youtu.be/dQw4w9WgXcQ",
  "description": "A fast mental model before you install anything.",
  "why_included": "Sets the vocabulary (DAG, task, operator) so the next steps land.",
  "focus_on": "Just the DAG → task → operator relationship. Ignore the Kubernetes bits.",
  "notes": null, "estimated_time_minutes": 5, "difficulty": "beginner", "sort": 1 }

{ "id": "i1…0002", "section": "s1…0001", "type": "github_repo",
  "title": "Starter docker-compose for local Airflow",
  "url": "https://github.com/example/airflow-quickstart",
  "description": "Clone, `docker compose up`, open localhost:8080.",
  "why_included": "Saves you the painful manual setup the official guide walks through.",
  "focus_on": "Just get the UI loading. Don't tweak config yet.",
  "notes": "On Apple Silicon set `platform: linux/amd64` or the scheduler crashes.",
  "estimated_time_minutes": 20, "sort": 2 }

{ "id": "i1…0003", "section": "s1…0002", "type": "docs_page",
  "title": "Scheduling & timetables (official docs)",
  "url": "https://airflow.apache.org/docs/.../scheduler.html",
  "description": "The authoritative reference for cron vs timetables and catchup.",
  "why_included": "Once you've seen a DAG run, this is the one docs page worth reading end to end.",
  "focus_on": "`schedule`, `catchup`, and `start_date` interactions — that's where everyone gets burned.",
  "notes": null, "estimated_time_minutes": 25, "difficulty": "intermediate", "sort": 1 }

{ "id": "i1…0004", "section": "s1…0002", "type": "pdf",
  "title": "Airflow cheat sheet (mine)", "asset": "f7e8…pdf",
  "description": "One-page reference for the operators I use weekly.",
  "why_included": "Print it; it replaces three doc tabs.",
  "estimated_time_minutes": 0, "sort": 2 }

{ "id": "i1…0005", "section": "s1…0002", "type": "personal_note",
  "title": "How I debug a stuck task",
  "body": "When a task is stuck in `queued`:\n\n1. Check the scheduler logs…\n\n:::tip\nMost 'stuck' tasks are actually a pool/concurrency limit.\n:::",
  "description": "My checklist when a DAG won't move.",
  "why_included": "This is the thing nobody writes down and everyone re-learns the hard way.",
  "estimated_time_minutes": 10, "sort": 3 }
```

## guide_progress (v4.1)

There is no enrollments/completions suite. Progress is one Directus row per
`directus_users` learner and guide (`09` §10).

```json
{
  "id": "gp1…0001",
  "user": "directus-user-id",
  "guide": "g1d2…0001",
  "completed_items": ["i1…0001", "i1…0002"],
  "last_item": "i1…0003",
  "status": "in_progress",
  "percent": 40,
  "started_at": "2026-07-02T19:05:00Z",
  "completed_at": null
}
```

## src/content/projects/*.md (repo content collection — frontmatter example)

```markdown
---
title: "Tableau waterfall chart, Gantt method"
summary: "A clean waterfall built from a Gantt mark — no table calc gymnastics."
year: 2025
role: "Design & build"
stack: ["Tableau", "SQL"]
cover: "../../assets/projects/tableau-waterfall/cover.png"
coverAlt: "Waterfall chart showing quarterly revenue bridges"
featured: true
order: 1
links:
  - { label: "Tableau Public", url: "https://public.tableau.com/…" }
---
Case-study body in markdown. `:::` blocks supported.
```
