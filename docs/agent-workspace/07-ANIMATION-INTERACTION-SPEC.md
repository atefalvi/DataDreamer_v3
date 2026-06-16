# 07 — Animation & Interaction Spec

Implementation-level behavior + pseudocode for every interactive system. Durations and
easings reference tokens from `04-DESIGN-SYSTEM.md` §12. All pseudocode marks
inputs/outputs/side-effects/cleanup/a11y/responsive/error paths.

## 1. Global motion utility — `lib/motion/reveal.ts`

Single IntersectionObserver for all `data-reveal` elements.

```
Inputs:   DOM elements with [data-reveal] (optional data-reveal-group for stagger)
Outputs:  adds class .is-revealed (CSS does the transition)
Side FX:  one IO instance per page; unobserves each element after reveal (once-only)
A11y:     if prefers-reduced-motion → add .is-revealed to all immediately, no IO
Cleanup:  none needed (page navigations are full loads in v4.0)

init():
  if matchMedia('(prefers-reduced-motion: reduce)').matches:
      for el in $$('[data-reveal]'): el.classList.add('is-revealed'); return
  io = new IntersectionObserver(entries =>
        for e in entries where e.isIntersecting:
            delay = indexWithinGroup(e.target) * 60ms   # cap index at 4
            setTimeout(() => e.target.classList.add('is-revealed'), delay)
            io.unobserve(e.target)
      , { threshold: 0.2, rootMargin: '0px 0px -8% 0px' })
  for el in $$('[data-reveal]'): io.observe(el)

CSS: [data-reveal]{opacity:0; transform:translateY(12px);
     transition: opacity var(--dur-3) linear, transform var(--dur-3) var(--ease-out)}
     .is-revealed{opacity:1; transform:none}
Failure mode: if script fails entirely, a no-JS CSS guard
     (html:not(.js) [data-reveal]{opacity:1; transform:none}) keeps content visible;
     BaseLayout sets document.documentElement.classList.add('js') inline.
```

## 2. Homepage hero — "Signal Field"

### 2.1 Visual concept
A full-bleed, very dark canvas behind the headline that renders the brand motifs
(04 §1.4) literally: a sparse field of ~140 small neutral **square pixels** (1.5–2px
rects, not circles — the logo's nested-square/pixel DNA) drifting along a precomputed
flow field (curl noise), like slow data currents. A handful (~6) of **ember nodes** —
*circular*, echoing the logo's red dot — pulse softly; when two ember nodes drift
within range, a hairline **connection** draws in and fades — the signal finding
itself. Pixel · data · connection, animated. Monochrome + one accent; no text
effects; the headline is real DOM text on top. Purpose: communicates "living data"
instantly, frames the headline, carries the logo's identity into motion, demonstrates
craft without noise.

### 2.2 Content hierarchy & layering
z0 canvas (aria-hidden) → z1 subtle radial vignette (CSS) → z2 content: kicker, H1
(2 lines), sub, CTA row (05 §1). Left-aligned, container-wide, bottom-third anchored
on DT; vertically centered on mobile static variant.

### 2.3 Load-in sequence (desktop, motion allowed)
```
t=0      SSR HTML paints: nav, kicker, H1, sub, CTAs all visible immediately
         (NO opacity-0 SSR content — LCP/SEO first; animation is additive)
t≈0      hero script lazy-inits after `requestIdleCallback` (fallback 200ms timeout)
step 1   canvas fades in (opacity 0→1, 700ms linear) — points already drifting
step 2   headline lines get .hero-line spans (wrapped at build, not by JS) that were
         at opacity .0001 ONLY IF JS confirmed motion path before first paint via
         inline pre-paint check; otherwise skip line reveal entirely.
         Reveal: each line translateY(110%)→0 inside overflow:hidden masks,
         dur-4, ease-out, stagger 90ms; sub + CTAs follow with data-reveal stagger
step 3   after 1.2s, ember nodes begin connection cycles (one pair max at a time)
idle     drift velocity settles to 40% after 6s (calm idle state)
```
Decision: the inline pre-paint check (tiny script in head setting
`html.hero-motion-ok` when JS enabled + motion allowed + viewport ≥768px) is what
allows masked line reveal without flash-of-hidden-content for no-JS/reduced-motion.

### 2.4 Core loop pseudocode
```
Inputs:  <canvas data-hero-field>, theme tokens (read via getComputedStyle once,
         re-read on theme toggle event), viewport size
State:   points[140]{x,y,seed}, embers[6]{x,y,phase}, links[≤1]{a,b,t},
         rafId, running:boolean, dpr = min(devicePixelRatio, 2)
Flow:    angle(x,y) = noise2D(x*0.0011, y*0.0011 + epoch*0.00005) * 2π   # precomputed
         curl table at 64×36 grid, bilinear-sampled — no per-frame noise calls

init():
  if reducedMotion or viewport < 768 → renderStaticFrame(); return  # §2.8
  sizeCanvas(dpr); seed points deterministically (mulberry32(42))
  io = IntersectionObserver(e => e.isIntersecting ? start() : stop())  # pause off-screen
  io.observe(canvas)
  document.addEventListener('visibilitychange', ...)                  # pause hidden tab
  window.addEventListener('resize', debounce(rebuild, 150))
  themeToggle event → re-read color tokens

frame(dt):
  ctx.clearRect
  for p in points:
      a = sampleFlow(p.x, p.y); p.x += cos(a)*v*dt; p.y += sin(a)*v*dt
      wrap edges; draw 2px SQUARE (fillRect, axis-aligned — pixel motif 04 §1.4),
      rgba(text-3, 0.35)
  for e in embers:
      same drift at 0.6v; pulse r = 2.5 + sin(t+phase)*0.8; draw accent CIRCLE at
      0.8 alpha (the logo-dot motif — embers are the only circles in the field)
  linkCycle(): every 4–7s pick nearest ember pair < 320px,
      animate line draw 0→1 over 900ms, hold 600ms, fade 900ms (one at a time)
  rafId = requestAnimationFrame(frame)

start(): if !running: running=true; rafId=raf(frame)
stop():  running=false; cancelAnimationFrame(rafId)            # cleanup
Perf guards: frame budget check — if 3 consecutive frames > 24ms, halve point count
      once (graceful degradation), then disable links. Canvas at min(dpr,2).
Outputs: pixels only. No layout reads in the loop (sizes cached).
Errors:  any throw in init → catch, remove canvas element, static CSS vignette remains.
```

### 2.5 Scroll & interaction behavior
No parallax; canvas is fixed within the hero section only (absolute, clipped). Pointer
adds a gentle flow bias within 200px of cursor (lerped, capped) — desktop only, no
listeners on touch. Click does nothing (no ripples — v3 retired).

### 2.6 Component boundaries & data
`home/HeroSignalField.astro` = section + content slots + canvas + its module script.
Copy from `site.ts`. No Directus dependency. CSS in component; tokens only.

### 2.7 Tablet (768–1279)
Full system at reduced density (90 points, 4 embers). Pointer bias off.

### 2.8 Mobile (<768) & fallbacks — `renderStaticFrame()`
No canvas mounted. Instead: a server-rendered inline SVG "still" of the field
(24 square pixels + 2 circular ember nodes + 1 connection line — same motif grammar
as §2.1, deterministic positions, <2KB) + CSS vignette. Identical composition language, zero JS cost. Reduced-motion on any
viewport gets this same static SVG (with the canvas never initialized). CTAs/text
identical everywhere.

### 2.9 Acceptance
LCP = H1 text; hero JS ≤ 8KB gzipped, zero dependencies (hand-rolled noise table —
no animation library; justification: one bespoke canvas, library adds weight not
capability); 0 CLS; CPU <2% when off-screen (verified via DevTools); static variant
pixel-reviewed on 360px and 414px widths; theme toggle recolors field without reload.

## 3. Navigation & global shell

### 3.1 Desktop behavior
Sticky top, height 64px. On `/` over the hero: background transparent, no border.
After `scrollY > 24`: `.is-scrolled` → glass bg + hairline border-bottom (04 §6),
180ms ease. Non-home pages: always `.is-scrolled` (set server-side — no flash).
Scroll listener is rAF-throttled, passive. Active link: route-prefix match,
`aria-current="page"`, 2px accent underline offset 6px.

### 3.2 Mobile menu (<768) — open/close
Hamburger button (44×44, `aria-expanded`, `aria-controls="mobile-menu"`,
`aria-label="Menu"`). Panel: fixed inset-0 below nav, `--bg-0` at 98% + blur, links
stacked (`--fs-2xl`, Inter 600, 56px touch rows, 40ms stagger reveal), then Connect
button, theme toggle + socials at bottom. Open: panel fades+slides 8px (dur-3);
icon morphs to X (CSS transform on two bars).

### 3.3 Focus management pseudocode (the canonical implementation)
```
Inputs:  #menuButton, #mobile-menu (panel), all focusable descendants
State:   isOpen, lastFocused, scrollY0
open():
  lastFocused = document.activeElement; scrollY0 = window.scrollY
  panel.hidden = false; requestAnimationFrame(() => panel.classList.add('is-open'))
  menuButton.setAttribute('aria-expanded','true')
  document.body.style.overflow = 'hidden'            # scroll lock
  document.body.style.touchAction = 'none'           # iOS rubber-band guard
  firstLink.focus()
  document.addEventListener('keydown', onKeydown)
close(returnFocus = true):
  panel.classList.remove('is-open')
  after transitionend (or 400ms safety timeout): panel.hidden = true
  menuButton.setAttribute('aria-expanded','false')
  restore body overflow/touchAction
  removeEventListener keydown
  if returnFocus: lastFocused.focus()
onKeydown(e):
  if e.key == 'Escape': close()
  if e.key == 'Tab':    # focus trap — wrap within panel + menuButton
      focusables = visible focusable elements in [menuButton, ...panel]
      if shift+Tab on first → focus last, preventDefault
      if Tab on last → focus first, preventDefault
link click → close(returnFocus=false)   # navigation takes focus naturally
resize ≥768px while open → close(false), unlock scroll      # cleanup edge case
A11y: panel has role=dialog? NO — it is a nav overlay; keep <nav aria-label="Site">,
      trap is behavioral. VoiceOver/TalkBack pass required in QA.
Reduced motion: panel opacity-only, no slide, no stagger.
```

## 4. Theme toggle
Button swaps `data-theme` on `<html>`, persists localStorage, swaps icon + aria-label,
dispatches `themechange` CustomEvent (hero + any canvas listens). Pre-paint init script
retained from v3 (audit §6) with identical try/catch localStorage guard.

## 5. Dream Team graph

### 5.1 Technology decision
**Hand-rolled SVG, server-computed layout.** Evaluated:
- Canvas: better >500 nodes; loses DOM semantics, free hover, SSR, links. Not needed
  at ≤30 nodes.
- d3/force libraries: physics nondeterminism, 30–70KB, client-only layout = layout
  shift + no-JS dead page. Rejected.
- CSS-only: cannot draw edges sanely. Rejected.
SVG gives: real `<a>` nodes (works with zero JS), deterministic SSR layout, CSS
hover/focus, tiny enhancer script. Revisit only if team > 60.

### 5.2 Layout algorithm (runs in Astro frontmatter, pure function — unit-testable)
```
Inputs:  specialties[S] (sorted by member count desc), authors[A] (each: primary
         specialty = first of their list, weight = 1 + log(posts+guides+1))
Output:  positions { specialtyAnchors: {id,x,y,labelAnchor}, authorNodes:
         {id,x,y,r}, edges: {x1,y1,x2,y2,authorId,specialtyId} } in a 1200×760 viewBox
Steps:
 1. anchors: place S specialty anchors on an ellipse (rx=420, ry=250, center 600,380)
    at angle θ_i = -π/2 + i * 2π/S, jittered ±6° by seeded PRNG(specialty.slug)
 2. nodes: for each author, base position = anchor of primary specialty +
    polar offset (radius 70–150 by seeded PRNG(author.id), angle = golden-angle
    sequence index within that specialty cluster)
 3. node radius r = clamp(20 + weight*6, 22, 28)  # avatar circle r
 4. collision relax: ≤40 iterations: for each overlapping pair (dist < rA+rB+10)
    push apart along the pair vector by overlap/2; clamp positions to
    viewBox padding 60. Deterministic order = sorted ids → stable result.
 5. edges: author→each of their specialties' anchors (max 3 per author),
    drawn as quadratic curves (control point = midpoint pushed 8% perpendicular)
 6. label anchors: outside the ellipse along the anchor's radial direction
Determinism: all randomness from mulberry32 seeded by stable ids — positions
identical across builds/requests. Unit test: snapshot positions for fixture data.
```

### 5.3 SVG structure (SSR output)
```
<svg viewBox="0 0 1200 760" role="group" aria-label="Team constellation …">
  <g class="tg-edges"> <path … data-author data-specialty/> … </g>
  <g class="tg-anchors"> <circle r=5 class="tg-anchor viz-N"/><text …mono label/> </g>
  <g class="tg-nodes">
    <a href="/dream-team/{slug}" class="tg-node" data-author="{id}"
       data-specialties="a,b" aria-label="{name}, {role}">
      <circle class="tg-node-ring"/> <clipPath…><image href=avatar 2x/>
      <text class="tg-node-name">{first name}</text>   # visible under node ≥TL
    </a> …
  </g>
</svg>
```

### 5.4 Enhancer script pseudocode
```
Inputs: rendered SVG, legend chips [data-specialty]
State:  activeSpecialty | null, focusIndex (roving tabindex), tooltipEl (single)
hover/focusin on .tg-node:
  show tooltip (name, role, "{n} posts · {m} guides") positioned by
  getBoundingClientRect, flipped if near edge; aria-hidden=true (info duplicate)
  svg.classList.add('has-focus'); node.classList.add('is-active')
  edges not touching node → .is-dimmed (CSS opacity .35, dur-2)
hover/focusout: clear (tooltip hides after 80ms grace)
legend chip click/Enter:
  toggle activeSpecialty; chips aria-pressed; nodes without specialty → .is-dimmed
  + tabindex=-1 (skipped in roving order); Escape anywhere in stage → clear filter
keyboard: nodes are real links (Tab order = DOM order = specialty,name).
  Roving enhancement: ArrowRight/Left move between nodes, Home/End jump; Enter
  follows link natively. (Plain Tab also works — arrows are additive.)
touch (TL tablets): first tap = focus (tooltip), second tap = navigate
  (implemented: if node not focused → preventDefault + focus)
Reduced motion: no entrance stagger (default opacity), dims become instant.
Idle motion: optional ±2px slow float on nodes via CSS animation — disabled under
  reduced motion and on battery-saver (navigator.getBattery checks skipped — just
  honor reduced-motion; keep it subtle).
Cleanup: none (full page loads). Errors: enhancer failure leaves a fully working
  static linked SVG (by construction).
```

### 5.5 Entrance
On reveal: anchors fade first (dur-3), nodes pop in (scale .8→1, stagger 30ms, max
600ms total), edges draw via stroke-dashoffset (dur-4). Skipped under reduced motion.

## 6. TOC scrollspy (article)
IO on heading elements (`rootMargin: '-80px 0px -70% 0px'`): topmost intersecting
heading id → `.is-active` on matching TOC link (`aria-current="location"`). Click =
native anchor + `scroll-margin-top: 96px` on headings (no JS scrolling). Replaces
v3's every-scroll loop.

## 7. Lightbox (imagegrid)
`<dialog>` element: `showModal()` gives native focus trap + Escape. Adds: arrow-key
nav, swipe (50px threshold), counter with `aria-live="polite"`, close on backdrop
click, `body` scroll-lock via `overscroll-behavior` + the dialog itself. Preloads
adjacent images. Alt set before src (keep v3 fix). Buttons ≥44px. Reduced motion:
no zoom transition, fade only.

## 8. Field Guide progress (v4.1) — authenticated server sync
```
toggleItem(guideSlug, itemId):
  if not authenticated:
    location.href = `/login?next=/guides/${guideSlug}`
    return
  toggle aria-pressed optimistically; tint card --success edge (or clear)
  POST /api/guides/progress with completedItemIds + lastItemId
  on success -> dispatch 'dd:guide-progress'                 # bar + cards re-derive
  on failure -> revert toggle, show inline "Progress could not sync" status

onProgressEvent (GuideProgress bar + every GuideCard subscribe):
  { status, percent, completedCount, remainingCount, estMinutesRemaining, resumeItemId }
    = progress.deriveProgress(guide, serverProgress)
  update percent bar width (transition var(--dur-2)), counts, time-remaining,
  Start↔Resume button label + target (#item-{resumeItemId})

# No completion dialog, no badges. Reaching 100% just sets the status pill to
# "Completed" and writes completed_at in guide_progress.
```

## 9. Code copy button (article)
One delegated click listener on the prose container; buttons injected at build by the
pipeline (each `<pre>` wrapper). `navigator.clipboard.writeText(pre.textContent)`;
fallback: select range + execCommand for old WebKit. Announce via shared visually-
hidden `aria-live=polite` region: "Code copied". Icon swaps check for 1.5s.

## 10. Reading progress (article)
rAF-throttled scroll: `progress = clamp((scrollY - artTop + viewH*0.1) / (artHeight -
viewH*0.6))`; `transform: scaleX(progress)` on a `transform-origin:left` bar (no width
animation). Hidden <768px and when article < 1.5 viewports (measured once on load +
resize-debounced).
