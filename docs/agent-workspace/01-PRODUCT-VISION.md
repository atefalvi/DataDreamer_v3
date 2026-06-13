# 01 — Product Vision: DataDreamer v4

## 1. What DataDreamer becomes

DataDreamer v4 is a **platform**, no longer a personal portfolio with a blog attached.
It is the public home of a small expert collective ("the Dream Team") producing:

1. **Technical writing** — the blog: data engineering, analytics, ML, automation, AI.
2. **Courses** — structured, privacy-first learning paths with progress tracking.
3. **Project case studies** — proof of engineering capability.
4. **People** — author profiles that connect writing, courses, and expertise.

The site must read as if a premium digital studio designed and built it: editorial in
voice, precise in execution, fast, accessible, and quietly confident. The brutalist v3
language (Anton, alarm-red, ALL-CAPS, raw borders, terminal cosplay) is fully retired.

## 2. Positioning statement

> For engineers, analysts, and teams who want practical depth on data and AI systems,
> DataDreamer is an independent publication and learning platform run by practitioners —
> not a content farm, not a template portfolio, not a marketing site.

## 3. Audience and what each needs

| Audience | Arrives via | Primary need | v4 answer |
|---|---|---|---|
| Practitioner reader | Search / shared link to an article | Read comfortably, trust the author, find more | Editorial article page, author block, related posts, topics |
| Learner | `/courses`, referral | Evaluate a course fast, low-friction signup, resume easily | Course catalogue + landing pages per COURSES_PRD, student dashboard |
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
   home, blog landing, article, course landing.
3. CLS < 0.1, LCP < 2.5s on 4G for all public pages.
4. Every existing published post renders correctly with zero content edits
   (callout compatibility contract — audit §5.5).
5. WCAG 2.2 AA practices per `11-RESPONSIVE-ACCESSIBILITY.md`.
6. All Directus reads go through `lib/repositories/`; zero SDK calls in page files.
7. Mobile designed first-class: every blueprint specifies small-mobile → wide-desktop.

## 6. Non-goals for v4

- No payments, comments, quizzes, cohorts, certificates with legal claims (per PRD).
- No site-wide search in v4.0 (justification: content volume is small; blog topic
  filtering + course filtering cover discovery. Revisit when posts > 50. A `/search`
  blueprint exists as future work in `05-PAGE-BLUEPRINTS.md` §17.)
- No newsletter capture in v4.0 (no list infrastructure exists; adding a CTA that
  collects nothing erodes trust. Placeholder slot defined in Footer blueprint.)
- No CMS-driven page builder. Directus scope is strictly editorial content
  (`08-DIRECTUS-CONTENT-MODEL.md` §1).
- No native app, no i18n.

## 7. Release strategy (recommendation)

Ship in two releases on the same design foundation:

- **v4.0 — Core redesign**: shell, home, about, projects, blog, Dream Team, connect,
  SEO/OG, 404/500, privacy. No auth. Directus changes limited to `authors`/`topics`.
- **v4.1 — Courses + learners**: courses schema, auth, catalogue/course/lesson pages,
  student dashboard.

Rationale: Courses carry the only security-sensitive surface (auth, session cookies,
server writes). Decoupling lets the visual redesign ship without blocking on auth
hardening, and lets courses launch into an already-stable shell. The roadmap
(`12-IMPLEMENTATION-ROADMAP.md`) sequences this as Phases A/B (core) then C (courses).

## 8. Information architecture at a glance

Full detail in `03-INFORMATION-ARCHITECTURE.md`.

```
/             Home (hero, latest writing, featured work, courses teaser*, team teaser)
/about        The platform + the person behind it
/projects     Case studies (repo-managed content)
/projects/[slug]
/blog         Blog landing (replaces /logs; 301 redirects preserved)
/blog/[slug]
/courses      v4.1   /courses/[slug]   /courses/[slug]/[lesson]
/dream-team   Node-graph team page
/dream-team/[slug]   Author page
/connect      Contact
/login /signup /forgot-password /reset-password /student   v4.1
/privacy      /404   500 error page
```

## 9. Glossary (used consistently across all workspace docs)

| Term | Meaning |
|---|---|
| **Post** | A blog article. Physically stored in the Directus `posts` collection; always called "post" in code and UI. |
| **Author / Dream Team member** | A row in the new `authors` collection. Not a Directus login user. |
| **Specialty** | A discipline tag for authors (e.g. Data Engineering); drives graph grouping. |
| **Topic** | A content tag shared by posts and courses. |
| **Learner / student** | An authenticated Directus user with role `student` (v4.1). |
| **Shell** | Global navigation + footer + base layout. |
| **Callout** | A `:::type` block inside post markdown. |
