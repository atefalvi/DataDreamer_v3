# Agent Cover Image Guide

Source of truth for generating one text-free cover for a DataDreamer Post, Project, or
Field Guide. Collection fields live in `docs/AGENT_CONTENT_TYPES_GUIDE.md`.

## Inputs

Use the supplied:

- content type: Post, Project, or Field Guide;
- title;
- summary;
- optional factual motif, object, process, or constraint that must be represented.

Ask only for a missing input. The title and summary control the concept; they must not
appear inside the image.

## Output

- Produce one finished cover by default. Generate alternatives only when the user asks.
- Preferred size: **2400 × 1500 px**, landscape **16:10**. Minimum: 1600 × 1000 px.
- Accepted upload formats: PNG, high-quality JPEG, or WebP.
- Keep the essential motif within the central 70% of the width and central 60% of the
  height. It must survive 16:10 cards, a wide 21:9 detail crop, and taller mobile crops.
- Deliver a flat image: no built-in frame, border, rounded corners, shadow, or UI chrome.
- It must remain deliberate against both dark and light site themes and readable at
  thumbnail size.

Universal exclusion: **no text of any kind**—no words, letters, numbers, labels, logos,
watermarks, signatures, pseudo-text, or fake UI copy.

## DataDreamer visual DNA

Create a quiet technical editorial illustration, not advertising art. Use disciplined
geometry, restrained depth, crisp or finely textured matte surfaces, generous negative
space, and one clear focal idea. A viewer should be able to connect the image to the
actual title and summary; never recycle a generic “data” or “AI” motif.

Choose one primary metaphor and one visual route through it. Useful forms include
measured paths, gates, steps, joins, layers, boundaries, timelines, matrices, contours,
and sparse relational fields. Every mark and connection must serve the concept.

### Palette

| Role | Token color | Use |
|---|---|---|
| Ink | `#0A0C10` | Dominant field and negative space |
| Raised ink | `#0F1318`, `#161B22` | Restrained depth and planes |
| Structure | `#2E3744` | Fine grids, rules, and secondary links |
| Paper | `#EDEFF3` | Sparse high-contrast highlights |
| Signal orange | `#FF5C38` | Primary accent and directional emphasis |
| Data blue | `#5CA7FF` | Optional secondary category |
| Data green | `#3ECF8E` | Optional success/completed state |
| Data violet | `#C792EA` | Rare categorical contrast |
| Data yellow | `#F5B83D` | Rare threshold/warning state |

Aim for 75–85% ink or quiet negative space. Signal orange usually occupies no more
than 10–15%. Use at most one secondary data color unless the subject truly requires
multiple categories. Avoid uncontrolled rainbow palettes. The deep-ink editorial plate
is intentional in light mode; do not generate a washed-out “light-theme version.”

## Choose the concept by content type

| Type | Express | Useful vocabulary |
|---|---|---|
| Post | The central idea, tension, change, or argument | contrast, threshold, divergence, feedback, before/after state |
| Project | The system, process, architecture, constraint, or result | workflow, dependency, boundary, measured build, resilient route |
| Field Guide | Progression, learning path, sequence, map, or connected knowledge | ordered checkpoints, branching route, layers of mastery, curated constellation |

Derive the metaphor from the specific content. For a waterfall-chart Project, use
offset measures and a controlled cumulative path—not a dashboard screenshot. For a
governance Guide, use traceable ownership boundaries and an ordered route—not random
network particles.

## Composition rules

- One primary metaphor and focal point; no competing centerpieces.
- Strong silhouette and hierarchy at small card size.
- Asymmetry is welcome when balanced by purposeful negative space.
- Keep crop-critical nodes and transitions in the central safe area.
- Use restrained depth or a small soft falloff only to clarify hierarchy.
- Prefer visual behavior over literal industry props.
- The image family should feel like plates from one editorial systems atlas, while each
  cover remains specific to its content.

## Hard exclusions

Do not create glowing AI brains, robots, holograms, random network particles, fake
dashboards, fake code, screens of decorative code, floating glass cards, glossy icon
packs, stock-business scenes, staged teams or handshakes, generic globes, cloud/database
montages, neon cyber maps, heavy lens flares, meaningless particles, dense charts,
decorative clutter, or multiple unrelated visual metaphors.

## Copy-ready prompt

```text
Create one finished, text-free editorial cover for DataDreamer.

Content type: [POST / PROJECT / FIELD GUIDE]
Title, for concept only—do not render it: [TITLE]
Summary, for concept only—do not render it: [SUMMARY]
Required factual motif, if any: [OPTIONAL]

Translate the actual title and summary into one primary visual metaphor. For a Post,
express the central idea, tension, change, or argument. For a Project, express the
system, process, architecture, constraint, or result. For a Field Guide, express an
ordered learning path, progression, map, or connected body of knowledge.

Use DataDreamer’s quiet technical editorial language: disciplined geometry, meaningful
paths or measured structures, restrained matte depth, crisp fine lines, generous
negative space, and one clear focal idea. Use a dominant #0A0C10 ink field, subtle
#0F1318 and #161B22 depth, fine #2E3744 structure, sparse #EDEFF3 highlights, and a
restrained #FF5C38 signal accent. Use at most one optional secondary data color.

Output one landscape 16:10 image at 2400×1500 px. Keep the essential motif inside the
central 70% width and central 60% height so it survives 16:10 cards, a 21:9 detail crop,
and mobile crops. It must read at thumbnail size and work unchanged against dark and
light website surfaces. Do not add a frame, border, rounded corners, or shadow.

No text of any kind, letters, numbers, labels, logos, watermarks, pseudo-text, UI copy,
fake dashboard, fake code, generic AI imagery, glowing brain, robot, hologram, random
network particles, floating glass cards, stock-business scene, rainbow palette, or
decorative clutter. Return one finished cover. Create alternatives only if requested.
```

## Example prompts

Post:

```text
Create one DataDreamer cover for the Post “Data contracts fail at the handoff.” The
summary explains that validation alone cannot replace ownership and escalation. Show
one precise signal crossing a clearly measured boundary, with the handoff initially
misaligned and then resolved by one restrained orange route. Use the full DataDreamer
palette, crop, no-text, no-fake-UI, and single-focal-idea rules from this guide.
```

Project:

```text
Create one DataDreamer cover for the Project “Building a reliable Tableau waterfall
chart with Gantt bars.” Express a cumulative system through offset measured bars tied
to one stable baseline and a few checkpoints. Emphasize one transition in orange;
communicate calculation stability without copying Tableau or showing a dashboard. Use
the full DataDreamer palette, crop, no-text, and single-focal-idea rules from this guide.
```

Field Guide:

```text
Create one DataDreamer cover for the Field Guide “A practical operating model for
governed analytics.” Show an ordered path moving through ownership, definition,
control, and adoption as four purposeful boundaries or checkpoints. Connections must
be sparse and traceable, not a random network. Use the full DataDreamer palette, crop,
no-text, and single-focal-idea rules from this guide.
```

## QA and upload

- [ ] The concept is specific to the title and summary, with one obvious focal idea.
- [ ] No text, pseudo-text, logo, watermark, fake UI, or excluded trope appears.
- [ ] The key motif remains clear at thumbnail size.
- [ ] Central content survives 16:10, 21:9, and mobile crops.
- [ ] Palette and contrast feel intentional beside both dark and light site themes.
- [ ] The image has no built-in card treatment.
- [ ] Filename is descriptive, for example `tableau-waterfall-gantt-cover.webp`.
- [ ] Directus file description/alt text describes visible content, not the article
  title—for example: “Offset bars connected along a dark measured grid, with one orange
  transition marking the cumulative path.”

If a check fails, revise the image. Do not compensate with text, a logo, more effects,
or more objects.
