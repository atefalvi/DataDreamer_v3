# Example Records (seed/test fixtures)

One realistic record per collection. Used to seed dev Directus and as repository-test
fixtures. Field meanings: `08-DIRECTUS-CONTENT-MODEL.md`.

## logs (post)

```json
{
  "id": "7f6f2c9e-1111-4a2b-9c3d-aaaa00000001",
  "status": "published",
  "slug": "airflow-retry-patterns",
  "title": "Retry patterns in Airflow that actually survive production",
  "excerpt": "Exponential backoff is not a strategy. Four retry patterns we run in production DAGs, and when each one breaks.",
  "published_at": "2026-05-12T09:00:00Z",
  "featured": true,
  "log_number": 14,
  "series_label": "Pipelines in production",
  "author_profile": "a0e1…0001",
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

## courses (v4.1)

```json
{
  "id": "c1d2…0001", "status": "published", "slug": "airflow-fundamentals",
  "title": "Airflow fundamentals",
  "short_description": "DAGs, scheduling, retries, and practical workflow patterns.",
  "description": "Markdown overview…",
  "learning_outcomes": ["Build DAGs from scratch", "Schedule and retry jobs",
    "Debug task failures", "Connect Airflow to external systems"],
  "level": "beginner", "badge_enabled": true, "cover_image": "f3c4…",
  "utility_score_cached": null, "vote_count_cached": 0,
  "total_lessons_cached": 8, "total_duration_seconds_cached": 9600, "sort": 1
}
```

## lessons (v4.1)

```json
{
  "id": "l1a2…0003", "course_id": "c1d2…0001", "status": "published",
  "slug": "scheduling", "title": "Scheduling", "lesson_number": 3,
  "short_summary": "Cron, timetables, and catchup behavior.",
  "body": "Markdown notes with :::tip blocks…",
  "youtube_id": "dQw4w9WgXcQ", "duration_seconds": 1005,
  "is_required": true, "is_preview": false
}
```

## resources (v4.1)

```json
{
  "id": "r1…0001", "course_id": "c1d2…0001", "lesson_id": null,
  "title": "Airflow cheat sheet", "resource_type": "pdf",
  "file": "f7e8…pdf", "external_url": null, "sort": 1, "status": "published"
}
```

## enrollments / lesson_completions / badges / user_badges / course_votes (v4.1)

```json
{"enrollment": {"user_id": "u-…", "course_id": "c1d2…0001", "status": "enrolled",
  "progress_percent_cached": 37.5, "last_lesson_id": "l1a2…0003",
  "started_at": "2026-07-01T18:20:00Z", "completed_at": null}}
{"lesson_completion": {"user_id": "u-…", "lesson_id": "l1a2…0003",
  "completed_at": "2026-07-02T19:05:00Z", "completion_source": "manual"}}
{"badge": {"course_id": "c1d2…0001", "title": "Airflow fundamentals",
  "image": "f-badge…", "status": "active"}}
{"user_badge": {"user_id": "u-…", "badge_id": "b-…", "awarded_at": "2026-07-10T20:00:00Z"}}
{"course_vote": {"user_id": "u-…", "course_id": "c1d2…0001", "vote": 5}}
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
