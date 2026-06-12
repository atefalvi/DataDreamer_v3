# Wireframes (ASCII) — key pages at key breakpoints

Companion to `05-PAGE-BLUEPRINTS.md` (which holds the binding specs). Wireframes show
composition and column placement on the 12-col grid; not pixel art.

## Home — desktop (≥1280)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ◇ DataDreamer      Work   Blog   Courses   Dream Team   About    ☾  [Connect]│  nav: glass on scroll
├──────────────────────────────────────────────────────────────────────────────┤
│ ░░░░░ signal-field canvas (aria-hidden) ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                                                              │
│   DATA · ANALYTICS · AI                              (kicker, mono)          │
│   Field notes from the                               (H1 Fraunces, 2 lines,  │
│   future of data.                                     masked line reveal)    │
│   DataDreamer is an independent publication and…     (sub, 56ch)             │
│   [ Read the blog ]   [ See the work ]               (primary + secondary)   │
│                                                                              │
├────────────────────────────  hairline rule ─────────────────────────────────┤
│ FROM THE BLOG                                           All posts →          │
│ ┌────────────────────────────┐  ┌──────────────────────────────────────────┐│
│ │ cover 16/10                │  │ date · topic            (compact row 1)   ││
│ │ Featured title (Fraunces)  │  │ Post title ——————————— reading time      ││
│ │ excerpt …                  │  ├──────────────────────────────────────────┤│
│ │ ◍ author · date · topic    │  │ date · topic            (compact row 2)   ││
│ └────────────────────────────┘  └──────────────────────────────────────────┘│
├──────────────────────────────────────────────────────────────────────────────┤
│ SELECTED WORK                                            All work →          │
│ ┌────────────── cols 1–6 ─────────────┐                                      │
│ │ cover / title / summary / meta      │   ┌────────── cols 7–12 ───────────┐ │
│ └─────────────────────────────────────┘   │ (offset ↓ space-8)             │ │
│                                           └────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│ THE DREAM TEAM                                                                │
│ ◍◍◍◍◍◍◍◍  Writing and courses from N practitioners…       Meet the team →   │
├──────────────────────────────────────────────────────────────────────────────┤
│ footer: brand+mission │ Explore │ Topics │ Elsewhere      © · Privacy        │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Home — small mobile (<480)

```
┌────────────────────────┐
│ ◇  DataDreamer      ≡ │
├────────────────────────┤
│ (static SVG field bg)  │
│ DATA · ANALYTICS · AI  │
│ Field notes from       │
│ the future of data.    │
│ sub copy …             │
│ [ Read the blog      ] │  full-width CTAs, stacked
│ [ See the work       ] │
├────────────────────────┤
│ FROM THE BLOG          │
│ [featured card, 1-col] │
│ [row] [row]            │
│ All posts →            │
├────────────────────────┤
│ SELECTED WORK          │
│ [card] [card] (1-col)  │
├────────────────────────┤
│ TEAM ◍◍◍◍◍ …  →        │
├────────────────────────┤
│ footer (stacked)       │
└────────────────────────┘
```

## Article — desktop (≥1024)

```
├ progress bar (2px, under nav) ───────────────────────────────────────────────┤
│  cols 1–8:                                                                   │
│  Topic · Series           (kicker links)                                     │
│  Post title set in Fraunces, balanced wrap                                   │
│  Lede/excerpt in --fs-lg, text-2                                             │
│  ◍ Author → · 2026.05.12 · 9 min read · #014     (meta row, mono)            │
│  ┌──────────────── cover 16/9, radius-lg (optional) ────────────────┐        │
├──┴───────────────────────────────────────────────────────────────────┴──────┤
│ cols 1–3 (sticky)        │ cols 4–11  prose (70ch)                           │
│ CONTENTS                 │ ## Heading …                                      │
│  01 Heading              │ body text …                                       │
│  02 Heading  ← active    │ ┌─ aside.callout--warning ───────────┐            │
│     02a Sub              │ │ ⚠ Hardware alert                   │            │
│  03 Heading              │ │ markdown-rendered body…            │            │
│                          │ └────────────────────────────────────┘            │
│                          │ ```python  [lang][copy]  …```                     │
│                          │ ────────────────────────────────                  │
│                          │ ◍ Author block card                               │
│                          │ Related posts (2–3 cards)                         │
│                          │ ← Prev post            Next post →                │
└──────────────────────────┴───────────────────────────────────────────────────┘
TP (768–1023): TOC becomes <details> "Contents" above prose; rail removed.
Mobile: progress bar hidden; meta wraps 2 lines; tables/code scroll-x.
```

## Dream Team — desktop (≥1024)

```
│ THE PEOPLE                                                                   │
│ Dream Team (H1)  ·  intro 56ch                                               │
│ ┌──────────────────────── SVG stage, ≤72vh ──────────────────────────────┐   │
│ │            Analytics ✶                    Machine Learning ✶           │   │
│ │         (◍)──╮                         ╭──(◍)╮                         │   │
│ │       (◍)    ╰──────✶ anchors ─────────╯    (◍)                        │   │
│ │   Data Eng ✶──(◍)═══ hover: tooltip card, others dim ═══(◍)            │   │
│ │              (◍)            AI & Agents ✶──(◍)                         │   │
│ └────────────────────────────────────────────────────────────────────────┘   │
│  Legend chips: [● Data Eng] [● Analytics] [● ML] [● AI]   (toggle filters)   │
├──────────────────────────────────────────────────────────────────────────────┤
│ EVERYONE (grouped list — also the a11y/mobile equivalent)                     │
│ Data Engineering                                                              │
│ ┌◍ Name — Role — chips — 12 posts┐ ┌◍ Name …┐                                │
│ Analytics …                                                                   │
└──────────────────────────────────────────────────────────────────────────────┘
<1024px: stage not rendered at all; page = header + grouped list.
```

## Course landing — desktop (v4.1, ≥1024)

```
│ COURSE · BEGINNER                                                            │
│ Airflow Fundamentals (H1)          │  cols 9–12 (sticky CTA card)            │
│ Learn DAGs, scheduling, retries…   │  ┌──────────────────────────┐           │
│ ┌────┬────┬────┬────┐              │  │ state-dependent CTA:     │           │
│ │ 8  │2h40│Begin│🏅  │ stat tiles  │  │ • signed-out: signup CTA │           │
│ └────┴────┴────┴────┘              │  │ • not enrolled: Start →  │           │
│ WHAT YOU'LL LEARN  ✓✓✓✓ (2-col)    │  │ • enrolled: bar+Continue │           │
│ LESSONS                            │  │ • done: badge + Review   │           │
│  01 Intro to Airflow   08:20  ✓    │  └──────────────────────────┘           │
│  02 DAG basics         12:10  ●    │                                         │
│  03 Scheduling         16:45       │                                         │
│ STUDY HUB  [PDF 🔒] [Mind map] [Link]                                        │
Mobile: CTA card becomes sticky bottom bar (safe-area padded); stats 2×2.
```

## Mobile menu (<768, open)

```
┌────────────────────────┐
│ ◇  DataDreamer      ✕ │  (focus trapped; Esc closes)
├────────────────────────┤
│  Work                  │  56px rows, --fs-2xl
│  Blog                  │
│  Courses               │
│  Dream Team            │
│  About                 │
│                        │
│  [ Connect ]           │
│  ☾ theme   ⃝ ⃝ ⃝ social│
└────────────────────────┘
```
