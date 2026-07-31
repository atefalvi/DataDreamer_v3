# Agent Cover Image Guide

Canonical generation brief for DataDreamer Post, Project, and Field Guide covers.
Use the content type, title, and summary to create a specific visual concept, but never
render the title or any other text inside the image.

## Required inputs

- Content type: Post, Project, or Field Guide.
- Exact title, for concept only.
- Exact summary, for concept only.
- Optional factual motif, process, object, or constraint that must be represented.

Ask only when a required input is missing. Do not infer facts that are absent from the
title and summary.

## Required output

- Generate **three finished cover options** so the editor can choose the strongest
  concept. They should be meaningfully different compositions, not colour swaps.
- Use a different approved background colour for each option when possible.
- Size each option at **2400 × 1500 px**, landscape **16:10**. Never go below
  1600 × 1000 px.
- Keep the essential motif inside the central 70% of the width and central 60% of the
  height. The image must survive a 16:10 card, a wide 21:9 detail crop, and taller
  mobile crops.
- Deliver flat images with no built-in frame, rounded corners, border, shadow, or UI
  chrome. The website supplies its own crop and card treatment.
- Check every option at thumbnail size and beside both dark and light site surfaces.

Universal exclusion: **no text of any kind**—no words, letters, numbers, labels,
logos, watermarks, signatures, pseudo-text, or fake interface copy.

## Approved background palette

Every cover must use exactly one of these colours as its dominant background field.
These mid-value editorial colours were selected to remain composed in both light and
dark themes. Do not replace them with black, white, a theme-specific background, or an
unapproved gradient.

```css
:root {
  --cover-paper-stone: #CBC6BC;
  --cover-archive-sage: #55644F;
  --cover-system-slate: #4F5E64;
  --cover-rain-teal: #5E8287;
  --cover-kiln-clay: #BE8A74;
  --cover-violet-graphite: #4A4257;
  --cover-mineral-grey: #4A4A4A;
}

/* HEX LIST
Paper Stone: #CBC6BC
Archive Sage: #55644F
System Slate: #4F5E64
Rain Teal: #5E8287
Kiln Clay: #BE8A74
Violet Graphite: #4A4257
Mineral Grey: #4A4A4A
*/
```

| Background | Character | Good fit |
|---|---|---|
| Paper Stone `#CBC6BC` | Archival, quiet, analytical | Definitions, research, operating models |
| Archive Sage `#55644F` | Governed, grounded, institutional | Governance, stewardship, durable process |
| System Slate `#4F5E64` | Technical, structural, precise | Architecture, engineering, implementation |
| Rain Teal `#5E8287` | Exploratory, connected, measured | Analysis, systems thinking, networks |
| Kiln Clay `#BE8A74` | Human, material, reflective | People, decisions, practice, change |
| Violet Graphite `#4A4257` | Conceptual, layered, investigative | Models, uncertainty, advanced methods |
| Mineral Grey `#4A4A4A` | Neutral, rigorous, documentary | Case studies, tooling, restrained comparisons |

The selected background should occupy roughly 75–90% of the composition. Use the
site’s signal orange `#FF5C38` sparingly for one focal route, transition, or decision.
Supporting marks may use warm paper `#EDEFF3` or deep ink `#0A0C10`, chosen for clear
contrast against the selected background. One restrained secondary category colour
is allowed only when the subject requires a real distinction. Do not use a rainbow
palette.

## Visual language

Create a quiet technical editorial illustration that feels like one plate from a
coherent systems atlas. Use:

- disciplined geometry and accurate spatial relationships;
- one primary metaphor and one clear focal idea;
- meaningful paths, joins, gates, layers, boundaries, measures, or checkpoints;
- generous negative space and strong hierarchy at card size;
- matte, finely textured surfaces and restrained depth only when it clarifies order;
- asymmetry when it improves composition, not random imbalance.

Every mark must help explain the specific title and summary. A generic “data,” “AI,”
or network motif is not enough.

## Translate the content type

| Type | Visualize | Useful structural vocabulary |
|---|---|---|
| Post | The central argument, tension, lesson, or change | contrast, threshold, divergence, feedback, before/after |
| Project | The built system, workflow, constraint, decision, or result | dependency, boundary, measured build, resilient route, transformation |
| Field Guide | The ordered learning journey and curator logic | checkpoints, progression, branching route, layers of mastery, connected knowledge |

Examples of the distinction:

- A waterfall-chart Project should use offset measures, a controlled cumulative path,
  and stable checkpoints—not a screenshot of a dashboard.
- A governance Field Guide should show traceable ownership boundaries and an ordered
  route—not decorative connected dots.
- A Post about a failed handoff should make the boundary and misalignment visible—not
  show generic office collaboration.

## Hard exclusions

Never create glowing AI brains, robots, holograms, random network particles, fake
dashboards, fake code, decorative screens, floating glass cards, glossy icon packs,
stock-business scenes, staged teams or handshakes, generic globes, cloud/database
montages, neon cyber maps, heavy lens flares, meaningless particles, dense unreadable
charts, decorative clutter, or several unrelated metaphors.

## Copy-ready generation prompt

```text
Create three finished, text-free editorial covers for DataDreamer.

Content type: [POST / PROJECT / FIELD GUIDE]
Title, for concept only—do not render it: [TITLE]
Summary, for concept only—do not render it: [SUMMARY]
Required factual motif or constraint, if supplied: [OPTIONAL]

Translate the exact title and summary into one primary visual metaphor per option.
The three options must use meaningfully different compositions, not the same image in
different colours. For a Post, express the argument, tension, lesson, or change. For a
Project, express the system, workflow, implementation constraint, decision, or result.
For a Field Guide, express an ordered learning path, progression, or connected body of
knowledge.

Use DataDreamer’s quiet technical editorial language: disciplined geometry,
purposeful paths or measured structures, matte surfaces, restrained depth, generous
negative space, and one clear focal idea. Each option must use exactly one approved
dominant background and use three different backgrounds across the set when possible:
Paper Stone #CBC6BC, Archive Sage #55644F, System Slate #4F5E64, Rain Teal #5E8287,
Kiln Clay #BE8A74, Violet Graphite #4A4257, or Mineral Grey #4A4A4A. Use signal orange
#FF5C38 only as a restrained focal accent. Use warm paper #EDEFF3 or deep ink #0A0C10
for high-contrast structure as appropriate.

Output each option at 2400×1500 px (16:10). Keep the essential motif inside the
central 70% width and central 60% height so it survives 16:10 cards, a 21:9 detail
crop, and mobile crops. It must read at thumbnail size and work unchanged beside both
dark and light website themes. Do not add a frame, border, rounded corners, shadow, or
UI chrome.

No text of any kind: no words, letters, numbers, labels, logos, watermarks,
pseudo-text, or interface copy. No fake dashboard, fake code, generic AI imagery,
brain, robot, hologram, random network particles, floating glass cards,
stock-business scene, rainbow palette, or decorative clutter.
```

## QA before delivery

- [ ] Three options are supplied and differ in concept/composition, not only colour.
- [ ] Each option uses one exact approved background colour.
- [ ] The concept is specific to the supplied title and summary.
- [ ] No text, pseudo-text, logo, watermark, fake UI, or excluded trope appears.
- [ ] The focal idea remains clear at thumbnail size.
- [ ] Central content survives 16:10, 21:9, and mobile crops.
- [ ] Contrast remains deliberate beside both light and dark site themes.
- [ ] No built-in card treatment is present.
- [ ] Files have descriptive names such as `tableau-waterfall-gantt-cover-01.webp`.
- [ ] The Directus file description/alt text describes visible content rather than
  repeating the title—for example, “Offset bars follow a measured cumulative path on
  a System Slate field, with one orange transition marking the key movement.”

If an option fails a check, revise the image. Do not compensate by adding text, more
effects, or more objects.
