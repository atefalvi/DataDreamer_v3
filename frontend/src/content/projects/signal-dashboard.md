---
title: "Signal, made legible"
summary: "An operations dashboard that resists the urge to show everything — one primary signal, honest context, and drill-downs only when asked."
year: 2024
role: "Design & build"
author:
  name: "Atef Alvi"
  role: "Data Engineering"
  href: "/dream-team/atef-alvi"
stack: ["Tableau", "dbt", "SQL"]
cover: "../../assets/projects/signal-dashboard/cover.svg"
coverAlt: "A single trend line with two highlighted anomaly points over a faint grid"
featured: false
order: 3
---

The brief was the usual one: "we need a dashboard for everything." The delivered product
deliberately shows almost nothing at rest — one headline metric, its trend, and the two
or three numbers that explain it.

## Editing is the work

Every tile had to justify itself against a single question: *does this change a
decision?* Most didn't, and got cut or pushed behind a drill-down.

:::tip The discipline
A dashboard is a point of view, not a data dump. If a chart can't change what someone
does next, it's decoration.
:::

## The model underneath

The semantic layer in dbt does the heavy lifting so the dashboard stays thin: metrics
are defined once, tested, and reused — no duplicated logic hiding in Tableau calcs.

1. One metrics model, version-controlled and tested.
2. Anomaly flags computed upstream, not in the viz.
3. Drill-downs are links, not always-on panels.

The dashboard people actually keep open is the one that respects their attention.
