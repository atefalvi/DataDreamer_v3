# 01 — Product Vision: DataDreamer v4

## 1. What DataDreamer becomes

DataDreamer v4 is a **platform**, no longer a personal portfolio with a blog attached.
It is the public home of a small expert collective ("the Dream Team") producing:

1. **Technical writing** — the blog: data engineering, analytics, ML, automation, AI.
2. **Field Guides** — curated learning paths. A practitioner collects the best
   resources while learning a topic, orders them, and adds the context that makes
   them worth following. Not a course factory (see §1a).
3. **Project case studies** — proof of engineering capability.
4. **People** — author profiles that connect writing, Field Guides, and expertise.

The site must read as if a premium digital studio designed and built it: editorial in
voice, precise in execution, fast, accessible, and quietly confident. The brutalist v3
language (Anton, alarm-red, ALL-CAPS, raw borders, terminal cosplay) is fully retired.

## 1a. Field Guides: the curation model (supersedes the "Courses" concept)

Earlier planning modelled this surface as a traditional LMS — **Course → Module →
Lesson**, with enrollment, grading, badges, and certificates. We are **not** building
that. DataDreamer is not trying to be Udemy, Coursera, or Teachable, and a full LMS is
explicitly out of scope.

The real product is **curation**. When a strong practitioner learns a topic, they wade
through dozens of videos, docs, repos, and articles and figure out which ones actually
matter, in what order, and what to focus on or skip. That judgement — the *sequence*,
the *why*, the *personal notes* — is the value. A Field Guide packages it:

> **A Field Guide is a hand-curated path through a topic: an ordered, annotated
> collection of existing resources (videos, docs, repos, PDFs, notes) that a curator
> assembled while learning it, so the next person can follow the same route faster.**

The content model is three levels:

- **Learning Path** (a Field Guide) — the top-level curated journey on one topic.
- **Sections** — ordered groups inside a path ("Foundations", "Going deeper", …).
- **Items** — the individual curated resources inside a section. An item can be a
  YouTube video, an external URL, a PDF, an uploaded file, a NotebookLM note, a GitHub
  repo, a code sample, a cheat sheet, a personal note, an exercise/project, or a docs
  page. Each item carries the curator's annotations: *why I included this*, *what to
  focus on*, *my notes*, plus estimated time and difficulty.

Where the value lives, concretely: the **order**, why each item matters, what to focus
on vs. skip, the curator's personal notes, additional materials they created
(cheat sheets, NotebookLM mind-maps), and project/code context.

**Naming decision — call it "Field Guides."** Considered: *Courses*, *Learning Paths*,
*Field Guides*.
- *Courses* implies recorded lectures, lessons, grading, and completion certificates —
  exactly the LMS expectation we are rejecting. Retired.
- *Learning Paths* is accurate but generic and corporate-LMS-flavoured. We keep it as
  the **internal/conceptual term for the data model** (a guide *is* a learning path),
  but not as the public label.
- *Field Guides* extends the established brand voice ("Field notes from the future of
  data"), signals curation rather than instruction, and sets the right expectation: a
  knowledgeable guide to a territory, not a classroom. **Public name = Field Guides**
  (nav: "Guides"). Physical collection name = `guides` (parallels the `posts`
  decision, `08` §2.1).

**Access and progress, kept deliberately light.** Public visitors can see the guide
name, summary, curator, topics, difficulty, estimated duration, and syllabus preview.
Starting a guide, reading item bodies/curator notes, marking items complete, and
resuming progress require a free DataDreamer account. Progress remains intentionally
small: not started / in progress / completed, per-item completion, percent complete,
items done / remaining, estimated time remaining, and resume-where-you-left-off. That
is the *entire* learner feature. No certificates, no grading, no quizzes, no cohorts,
no enterprise reporting.

## 2. Positioning statement

> For engineers, analysts, and teams who want practical depth on data and AI systems,
> DataDreamer is an independent publication and learning platform run by practitioners —
> not a content farm, not a template portfolio, not a marketing site.

## 3. Audience and what each needs

| Audience | Arrives via | Primary need | v4 answer |
|---|---|---|---|
| Practitioner reader | Search / shared link to an article | Read comfortably, trust the author, find more | Editorial article page, author block, related posts, topics |
| Learner | `/guides`, referral | Judge a guide fast, then sign in to start and resume reliably | Public guide previews + logged-in guide reader; Directus-backed progress |
| Potential client / employer | Homepage, About, Projects | Credibility in 60 seconds | Hero, selected work, About, Connect |
| Collaborator / future author | Dream Team | See who's involved, how expertise maps | Node-graph team page + author pages |
| Returning reader | Direct | What's new | Home "latest" sections, blog landing |

## 4. Brand voice (replaces v3 terminal voice)

- **Sentence case everywhere.** No automatic uppercasing of titles. No `// LABELS`,
  no `INITIATE CONTACT SEQUENCE_`. Kickers/eyebrows use small caps-styled mono text —
  the one deliberate echo of the technical heritage.
- Confident, specific, plain: "Practical writing on data systems" not
  "CONVERTING SIGNAL TO INTELLIGENCE".
- Numbers and metadata set in mono (dates, reading time, lesson counts) — data as texture.

## 5. Success criteria for the redesign

1. A first-time visitor can say what DataDreamer is within one viewport of the homepage.
2. Lighthouse (mobile, throttled): Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95 on
   home, blog landing, article, Field Guide page.
3. CLS < 0.1, LCP < 2.5s on 4G for all public pages.
4. Every existing published post renders correctly with zero content edits
   (callout compatibility contract — audit §5.5).
5. WCAG 2.2 AA practices per `11-RESPONSIVE-ACCESSIBILITY.md`.
6. All Directus reads go through `lib/repositories/`; zero SDK calls in page files.
7. Mobile designed first-class: every blueprint specifies small-mobile → wide-desktop.

## 6. Non-goals for v4

- No payments, comments, quizzes, cohorts, grading, badges, or certificates. Field
  Guides are curation, not instruction with assessment (§1a).
- **No full LMS.** No enrollment records, no "student" role, no instructor dashboards,
  no completion certificates. v4.1 ships login-gated guide reading with a single
  progress collection, not a course platform.
- No site-wide search in v4.0 (justification: content volume is small; blog topic
  filtering + guide filtering cover discovery. Revisit when posts > 50. A `/search`
  blueprint exists as future work in `05-PAGE-BLUEPRINTS.md` §19.)
- No newsletter capture in v4.0 (no list infrastructure exists; adding a CTA that
  collects nothing erodes trust. Placeholder slot defined in Footer blueprint.)
- No CMS-driven page builder. Directus scope is strictly editorial content
  (`08-DIRECTUS-CONTENT-MODEL.md` §1).
- No native app, no i18n.

## 7. Release strategy (recommendation)

Ship in two releases on the same design foundation:

- **v4.0 — Core redesign**: shell, home, about, projects, blog, Dream Team, connect,
  SEO/OG, 404/500, privacy. No auth. Directus changes limited to `authors`/`topics`.
- **v4.1 — Field Guides**: `guides` / `guide_sections` / `guide_items` schema,
  catalogue + public preview pages, login/signup, gated guide reader, and Directus-
  backed learner progress.

Rationale: login gives visitors a clear reason to create an account while still
leaving enough public guide metadata for discovery and SEO. The constraint is to add
the smallest account surface that supports learning: Directus users, a `guide_reader`
role, Google/email sign-in, and one `guide_progress` collection. The roadmap
(`12-IMPLEMENTATION-ROADMAP.md`) sequences this after v4.0 so the auth surface does
not destabilize the core redesign release.

## 8. Information architecture at a glance

Full detail in `03-INFORMATION-ARCHITECTURE.md`.

```
/             Home (hero, latest writing, featured work, guides teaser*, team teaser)
/about        The platform + the person behind it
/projects     Case studies (repo-managed content)
/projects/[slug]
/blog         Blog landing (replaces /logs; 301 redirects preserved)
/blog/[slug]
/guides       v4.1   /guides/[slug]   (Field Guide catalogue + path page)
/dream-team   Node-graph team page
/dream-team/[slug]   Author page
/connect      Contact
/privacy      /404   500 error page
```

## 9. Glossary (used consistently across all workspace docs)

| Term | Meaning |
|---|---|
| **Post** | A blog article. Physically stored in the Directus `posts` collection; always called "post" in code and UI. |
| **Author / Dream Team member** | A row in the new `authors` collection. Not a Directus login user. |
| **Specialty** | A discipline tag for authors (e.g. Data Engineering); drives graph grouping. |
| **Topic** | A content tag shared by posts and Field Guides. |
| **Field Guide** | The public name for a curated learning path. Physically stored in the Directus `guides` collection. Public preview, login-gated reader. |
| **Learning Path** | Internal/conceptual term for a Field Guide's data model (`guides` → `guide_sections` → `guide_items`). Not used as a public label. |
| **Section** | An ordered group of items inside a guide (`guide_sections`). |
| **Item** | A single curated resource inside a section (`guide_items`): video, link, PDF, repo, note, etc. |
| **Guide reader** | A Directus user with the low-permission `guide_reader` role. Required to start guides, read item bodies, and save progress. |
| **Shell** | Global navigation + footer + base layout. |
| **Callout** | A `:::type` block inside post markdown. |
