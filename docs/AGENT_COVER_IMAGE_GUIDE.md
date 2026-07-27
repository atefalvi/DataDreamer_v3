# Agent Cover Image Guide — DataDreamer

Use this guide whenever an agent creates a cover for a Post, Project, Field Guide, or
other editorial feature. The author will provide a content type, title, and summary.
Treat those inputs as meaning and composition cues only: **never render the title,
summary, or any other text inside the image**.

The goal is a recognizable family of covers: precise, quiet, technical, and editorial.
Each image should express the content's central idea without turning into a literal
dashboard screenshot or generic “AI technology” artwork.

## Required inputs

Ask for these only when they were not already supplied:

- Content type: Post, Project, or Field Guide.
- Title.
- Summary or short description.
- Optional: one factual object, system, or process that must be represented.

Do not require the author to choose colors, style, camera, lighting, typography, or
layout. Those decisions are defined here.

## Output specification

- Create **three separate 2400 × 1500 px landscape candidates** (16:10). Minimum
  acceptable size for each candidate: 1600 × 1000 px.
- Compose for responsive cropping. Keep the essential motif inside the central 70% of
  the width and central 60% of the height. The Project detail page crops to 21:9; cards
  use 16:10; article covers can crop toward 4:3 on mobile.
- Use a clean raster image in PNG, high-quality JPEG, or WebP. Do not add a frame or
  rounded corners; the site supplies those.
- Deliver each candidate as its own resolved image. Never combine the candidates into a
  contact sheet, split screen, triptych, or collage.
- All three candidates must still read clearly at card size and in both dark and light
  site themes. They are compositional alternatives, not theme-specific assets.

## The three-candidate system

Generate exactly one candidate in each of these roles. Interpret the supplied content
through the role; do not paste the same motif into three layouts.

### Candidate A — Signal Path

Express sequence, movement, dependency, or change through one legible route. Use a
small number of meaningful nodes, a controlled path, and one focal transition. This is
especially useful for workflows, lineage, timelines, and narrative Posts.

### Candidate B — Measured Structure

Express comparison, architecture, constraint, or construction through stepped measures,
aligned planes, boundaries, bars, or modules. Keep the hierarchy structural rather than
decorative. This is especially useful for Projects, systems, finance, and engineering.

### Candidate C — Shared Field

Express relationships, categories, uncertainty, or common ground through a sparse field
of related marks, contours, or connected clusters. Every connection must support the
concept. This is especially useful for people, governance, networks, guides, and AI.

Across all three, preserve the same visual DNA: deep ink ground, restrained line weight,
matte surfaces, one dominant signal color, quiet negative space, and a motif large enough
to survive thumbnail display. When these images appear together, they should feel like
three plates from the same editorial atlas.

## DataDreamer visual language

### Palette

Base the image on the site's real interface colors:

| Role | Color | Use |
|---|---|---|
| Ink | `#0A0C10` | Dominant background and negative space. |
| Raised ink | `#0F1318`, `#161B22` | Subtle depth, planes, or bands. |
| Structure | `#2E3744` | Fine rules, grids, secondary connections. |
| Paper | `#EDEFF3` | Sparse highlights and focal contrast. |
| Signal orange | `#FF5C38` | Primary accent and directional emphasis. |
| Data blue | `#5CA7FF` | Optional secondary series or counterpoint. |
| Data green | `#3ECF8E` | Optional positive state or completed path. |
| Data violet | `#C792EA` | Rare categorical contrast. |
| Data yellow | `#F5B83D` | Rare warning or threshold. |

The image should be roughly 75–85% ink/negative space. Use the deep ink palette inside
the image regardless of the current website theme; in light mode it should read as a
deliberate dark editorial plate, not as a transparent UI surface. Signal orange should usually
occupy no more than 10–15%. Use at most one additional data color unless the subject
genuinely requires categories. Avoid rainbow palettes and ornamental color variation.

### Form and composition

- Choose **one primary visual metaphor** derived from the title and summary.
- Build it from disciplined geometry: nodes, paths, stepped bars, fields, contours,
  matrices, timelines, layers, joins, or measured spatial relationships.
- Use asymmetry with deliberate balance. Leave enough quiet space for the image to feel
  editorial rather than like a dense product illustration.
- Prefer crisp edges, fine lines, matte surfaces, controlled grain, and restrained
  depth. A small amount of soft falloff or glow may clarify hierarchy; it must not be
  the concept itself.
- Create a clear focal path. The eye should find one signal, follow one relationship,
  and understand the structure at a glance.
- Keep the result abstract but meaningful. Someone who reads the title and summary
  should recognize why this particular image belongs to this particular piece.

### Tone

Premium here means confident restraint: technically literate, useful, and composed.
The image should feel closer to an editorial data-journalism illustration or a precise
systems diagram than advertising art, science fiction, or a software landing page.

## Translating subjects into imagery

Use the content meaning, not industry clichés. These are starting points, not fixed
templates:

| Subject | Useful visual vocabulary |
|---|---|
| Analytics / visualization | Ordered marks, scales, comparisons, small multiples, a single emphasized insight. |
| Data engineering | Streams, joins, layered transformations, checkpoints, lineage, resilient routes. |
| Governance / quality | Provenance paths, validation gates, controlled boundaries, traceable states. |
| Finance | Balanced flows, ledgers, reconciled paths, thresholds, measured deltas. Avoid currency symbols. |
| People / HR | Distinct nodes connected through shared capabilities, equitable spacing, group-to-system relationships. Avoid stock-photo silhouettes. |
| Project management | Dependencies, milestones, critical paths, constraints, sequencing, handoffs. |
| Software engineering | Interfaces, modules, state transitions, tests, boundaries. Avoid screens of decorative code. |
| Network engineering | Topology, redundancy, packets or routes, hubs, failover paths. Avoid neon cyber maps. |
| AI / machine learning | Inputs, evaluation, uncertainty, feedback, model boundaries, comparison. Never use a glowing brain or humanoid robot. |

When the subject is a specific chart or system, echo its structural behavior without
copying the finished interface. For a waterfall-chart Project, for example, use a
sequence of offset horizontal or vertical measures connected by a precise baseline,
with one restrained orange transition—not a screenshot of Tableau.

## Hard exclusions

Do not include:

- Any words, letters, numbers, labels, captions, logos, watermarks, signatures, UI
  chrome, or fake interface text.
- Glowing brains, robot heads, human hands touching holograms, circuit-board faces,
  generic globes, cloud icons, database-cylinder montages, or “data flying through
  space.”
- Floating glass cards, excessive glassmorphism, chrome blobs, shiny 3D icon packs,
  plastic clay objects, cinematic lens flares, or gratuitous neon.
- Dense dashboards, illegible charts, fake code, random particles, or networks whose
  connections have no compositional purpose.
- Stock-photo office scenes, staged handshakes, anonymous business teams, or literal
  industry props unless they are essential to the story.
- Multiple competing focal points, decorative clutter, heavy gradients, or textures
  that reduce legibility at small sizes.

## Prompt template

Copy this prompt and replace the bracketed inputs. The title and summary are semantic
inputs only and must not appear in the image.

```text
Create three separate text-free editorial cover candidates for DataDreamer.

Content type: [POST / PROJECT / FIELD GUIDE]
Title, for concept only—do not render it: [TITLE]
Summary, for concept only—do not render it: [SUMMARY]
Required factual motif, if any: [OPTIONAL]

Create exactly these three full-image candidates:
A — Signal Path: express sequence, movement, dependency, or change through one route.
B — Measured Structure: express comparison, architecture, or constraint through aligned
measures, planes, boundaries, bars, or modules.
C — Shared Field: express relationships, categories, or common ground through sparse
related marks, contours, or connected clusters.

Interpret the supplied concept differently in each candidate while preserving one visual
family. Use a dominant
#0A0C10 ink field, subtle #0F1318 and #161B22 depth, fine #2E3744 structure, sparse
#EDEFF3 highlights, and restrained #FF5C38 signal accents. Use no more than one optional
secondary data color. Favor disciplined geometry, meaningful nodes or paths, measured
spacing, crisp edges, controlled depth, and generous negative space. Make the image
feel like premium editorial data journalism: intelligent, calm, technical, and specific
to the supplied subject.

Each candidate: landscape 16:10, 2400×1500. Keep all essential visual information within
the central 70% width and central 60% height so 21:9 and mobile crops remain coherent.
Each must read at thumbnail size and work unchanged against both dark and light website
surfaces. Return three separate files, never a contact sheet or collage.

No text of any kind, no letters, no numbers, no logos, no watermarks, no UI screenshot,
no fake code, no generic AI imagery, no glowing brain, no robot, no hologram, no stock
business scene, no floating glass cards, no decorative 3D icon set, no rainbow palette,
no visual clutter.
```

## Example prompt

```text
Create three separate text-free editorial cover candidates for DataDreamer.

Content type: Project
Title, for concept only—do not render it: Building a reliable Tableau waterfall chart
with Gantt bars
Summary, for concept only—do not render it: A case study about building a stable
single-axis waterfall chart from minimal source data while preserving checkpoints,
filter behavior, and explainable calculation structure.

Candidate A — Signal Path: show the cumulative route as one precise connector moving
through a few stable checkpoints, with one orange transition.

Candidate B — Measured Structure: show offset measures aligned to a controlled baseline,
with one structural movement emphasized in orange.

Candidate C — Shared Field: show sparse checkpoint states distributed across one measured
field, connected only where the cumulative relationship requires it.

All three should communicate cumulative balance, controlled sequencing, and reliability
without copying a Tableau interface.

Use the same deep-ink DataDreamer palette, line discipline, composition, crop, and
exclusion rules across all candidates. Each is landscape 16:10, 2400×1500, delivered as
a separate file. No text, labels, numbers, logos, UI, or watermarks.
```

## Selection and QA checklist

Before selecting and uploading one of the three candidates, verify all of the following:

- [ ] There is no visible or pseudo-text anywhere, including meaningless AI glyphs.
- [ ] The concept is specific to the supplied title and summary.
- [ ] One primary motif is obvious at thumbnail size.
- [ ] Orange is an accent, not a full-image wash.
- [ ] No more than one optional secondary data color is used.
- [ ] The central safe area survives a wide 21:9 crop and a taller mobile crop.
- [ ] The image has no built-in frame, card, rounded corners, or drop shadow.
- [ ] The result does not rely on a banned generic-tech or stock-business trope.
- [ ] All three candidates belong to the same family without being near-duplicates.
- [ ] The selected image remains intentional against both the dark and light site themes.
- [ ] The Directus file name is descriptive, for example
  `tableau-waterfall-gantt-cover.webp`.
- [ ] The Directus description/alt text describes the visible image, not the article
  title—for example: “Offset bars connected along a dark measured grid, with one orange
  transition marking the cumulative path.”

If any check fails, revise the image before upload. Do not compensate for a weak cover
with text, a logo, more effects, or additional objects.
