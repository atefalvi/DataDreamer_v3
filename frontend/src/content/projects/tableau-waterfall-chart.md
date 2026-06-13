---
title: "Waterfall charts, the Gantt method"
summary: "A clean, label-friendly waterfall built from a Gantt mark — no table-calc gymnastics, no stacked-bar hacks."
year: 2025
role: "Design & build"
stack: ["Tableau", "SQL"]
cover: "../../assets/projects/tableau-waterfall-chart/cover.svg"
coverAlt: "Waterfall chart showing quarterly revenue bridges in the DataDreamer palette"
featured: true
order: 1
links:
  - { label: "Tableau Public", url: "https://public.tableau.com/" }
---

Waterfall charts are deceptively annoying in Tableau. The usual recipe — a running-sum
table calculation on a stacked bar with an invisible base — works, but it fights you on
labels, tooltips, and color. This build throws that out and uses a **Gantt mark**
instead, which gives you a true floating bar with a real start and size.

## The core idea

A Gantt bar is defined by a position (where it starts) and a size (how long it runs).
That is exactly a waterfall segment: each bar starts at the previous running total and
extends by its own delta.

:::tip Why Gantt beats stacked bars
The Gantt mark carries one measure for position and one for size, so labels and tooltips
bind to the *real* delta — not to a phantom "base" dimension you have to hide.
:::

```sql
-- running total feeding the bar's start position
sum(delta) over (
  order by step
  rows between unbounded preceding and 1 preceding
) as bar_start
```

## What made it production-ready

1. A single parameter flips between absolute and bridge views.
2. Color encodes sign (gain / loss) with the brand accent reserved for net totals.
3. Mobile gets a transposed layout so labels never collide.

:::warning One gotcha
Gantt size must be a continuous measure on the Size shelf — if Tableau aggregates it as
a dimension, every bar collapses to a hairline. Check the pill.
:::

The result reads in a glance and survives being dropped into a leadership deck — which is
the only test that actually matters.
