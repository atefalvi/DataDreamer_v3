# 00 — Documentation index

DataDreamer is live in production (`main` → Coolify auto-deploy). This directory holds
the **reference documentation** the codebase cites by number (e.g. `05 §15`, `09 §4.2`
in code comments). The v4 build is complete — planning/process artifacts (task boards,
handoffs, roadmaps) have been removed; git history preserves them.

## Design & architecture references (cited by code)

| Doc | What it is |
|---|---|
| [01-PRODUCT-VISION](01-PRODUCT-VISION.md) | What DataDreamer is and who it serves |
| [02-EXISTING-SITE-AUDIT](02-EXISTING-SITE-AUDIT.md) | The v3 audit that shaped v4 (historical baseline) |
| [03-INFORMATION-ARCHITECTURE](03-INFORMATION-ARCHITECTURE.md) | Routes, URL contract, navigation |
| [04-DESIGN-SYSTEM](04-DESIGN-SYSTEM.md) | Tokens, type, color — the Observatory system |
| [05-PAGE-BLUEPRINTS](05-PAGE-BLUEPRINTS.md) | Section-by-section page specs |
| [06-COMPONENT-ARCHITECTURE](06-COMPONENT-ARCHITECTURE.md) | Component boundaries + view-model contract |
| [07-ANIMATION-INTERACTION-SPEC](07-ANIMATION-INTERACTION-SPEC.md) | Motion rules, reveal, reduced-motion |
| [08-DIRECTUS-CONTENT-MODEL](08-DIRECTUS-CONTENT-MODEL.md) | Collections, fields, query contracts |
| [09-TECHNICAL-ARCHITECTURE](09-TECHNICAL-ARCHITECTURE.md) | Repos/mappers layering, caching, errors |
| [10-SEO-OG-METADATA](10-SEO-OG-METADATA.md) | Meta, JSON-LD, OG rules |
| [11-RESPONSIVE-ACCESSIBILITY](11-RESPONSIVE-ACCESSIBILITY.md) | Breakpoints + a11y bar |
| [12-IMPLEMENTATION-ROADMAP](12-IMPLEMENTATION-ROADMAP.md) | How v4 was sequenced (historical) |

## Operational docs (current)

| Doc | What it is |
|---|---|
| [16-ACCOUNT-MODEL](16-ACCOUNT-MODEL.md) | **The account/author model + admin runbook** (approve contributors, Dream Team, security posture) |
| [17-CODEBASE-REVIEW](17-CODEBASE-REVIEW.md) | Architecture review + executed fix log |
| [qa/guides.md](qa/guides.md) | Field Guides QA runbook + credential/role runbook |
| [../AGENT_BLOG_GUIDE.md](../AGENT_BLOG_GUIDE.md) | Markdown authoring contract for posts (callouts, blocks) |
| [../AGENT_GUIDES_GUIDE.md](../AGENT_GUIDES_GUIDE.md) | How to curate a Field Guide in Directus |
| [../../scripts/README.md](../../scripts/README.md) | Operational scripts + applied migrations |

**Orby** (the site chat assistant) lives in its own repository:
[github.com/atefalvi/orby](https://github.com/atefalvi/orby). This repo carries only the
env-guarded widget `<script>` tag in `BaseLayout.astro` and the CSP allowance.
