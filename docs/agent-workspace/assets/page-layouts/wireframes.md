# Wireframes (ASCII) — key pages at key breakpoints

Companion to `05-PAGE-BLUEPRINTS.md` (which holds the binding specs). Wireframes show
composition and column placement on the 12-col grid; not pixel art.

## Home — desktop (≥1280)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ◇ DataDreamer      Work   Blog   Guides   Dream Team   About    ☾  [Connect]│  nav: glass on scroll
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
│ ◍◍◍◍◍◍◍◍  Writing and guides from N practitioners…        Meet the team →   │
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

## Field Guide — desktop (v4.1, ≥1024) — public preview + gated reader

```
│ FIELD GUIDE · DATA ENGINEERING                                               │
│ Learn Airflow the real way (H1)                                              │
│ The exact path I followed to go from zero to production DAGs (summary lede)  │
│ curator ·avatar  ·  Beginner  ·  8 items  ·  ~6h  ·  updated Jun 2026       │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ logged out: Sign in to start this guide        [ Google ] [ Email ]       │ │
│ │ logged in:  ▓▓▓▓▓░░░░░ 37% · 3/8 done · ~3h left   [ Resume → ]           │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ WHY THIS PATH … / WHAT YOU'LL GET …            (2-col prose)                 │
│                                                                              │
│ ── Section 01 · Get something running ─────────────────────────────────────  │
│ logged-out preview: item titles/types only; notes, URLs, embeds hidden       │
│ ☑  ▶ Airflow in 100 seconds            video · ~5m                          │
│        Why it's here · Focus on · My notes   (annotations, <details> on mob) │
│ ☑  ⌥ Starter docker-compose            repo · ~20m   ↗ github.com           │
│ ── Section 02 · Scheduling & debugging ────────────────────────────────────  │
│ ☐  ⎘ Scheduling & timetables           docs · ~25m   ↗ airflow.apache.org   │
│ ☐  ▤ Airflow cheat sheet (mine)        pdf  · download                      │
│ ☐  ✎ How I debug a stuck task          note · ~10m   (markdown inline)      │
│                                                                              │
│ CURATORS  (avatar cards)        MORE GUIDES  (2–3 related)                   │
Logged-in items render inline (open externally or expand). No lesson route, no
student dashboard, no badges/certificates/payments.
Mobile: progress bar → compact sticky strip; annotations collapse to <details>.
```

## Mobile menu (<768, open)

```
┌────────────────────────┐
│ ◇  DataDreamer      ✕ │  (focus trapped; Esc closes)
├────────────────────────┤
│  Work                  │  56px rows, --fs-2xl
│  Blog                  │
│  Guides                │
│  Dream Team            │
│  About                 │
│                        │
│  [ Connect ]           │
│  ☾ theme   ⃝ ⃝ ⃝ social│
└────────────────────────┘
```
