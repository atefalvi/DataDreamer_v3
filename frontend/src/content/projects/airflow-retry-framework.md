---
title: "A retry framework that survives production"
summary: "Exponential backoff is not a strategy. A small, declarative retry layer for Airflow DAGs that distinguishes transient from terminal failures."
year: 2025
role: "Design & build"
author:
  name: "Atef Alvi"
  role: "Data Engineering"
  href: "/dream-team/atef-alvi"
stack: ["Airflow", "Python", "Postgres"]
cover: "../../assets/projects/airflow-retry-framework/cover.svg"
coverAlt: "A directed task graph with one failing branch highlighted in the accent color"
featured: true
order: 2
links:
  - { label: "Write-up", url: "https://data-dreamer.net/blog" }
---

Most Airflow retry configuration is a single number copied between tasks. That number is
a guess, and it treats a flaky network call the same as a schema mismatch that will fail
forever. This project replaced the guess with a small classification layer.

## Classify, then retry

Every task declares the failure classes it considers *transient*. The retry policy reads
that declaration and only backs off for those; everything else fails fast and pages a
human.

:::tip The one rule
Retry transient failures, surface terminal ones immediately. A retry on a deterministic
failure just wastes a worker and delays the alert.
:::

```python
@retryable(transient=(TimeoutError, ConnectionError), max_attempts=4)
def pull_partition(ds):
    ...
```

## Results

- 2am pages dropped by ~60% — flaky calls now self-heal.
- Genuine failures alert ~9 minutes sooner (no wasted retry cycles).
- Retry behavior is visible in the DAG, not buried in operator kwargs.

:::details Backoff schedule
Attempt 1 immediate, then 30s, 2m, 8m — capped, with full jitter to avoid thundering
herds against a recovering upstream.
:::

The win wasn't the backoff math; it was making "is this worth retrying?" an explicit,
reviewable decision.
