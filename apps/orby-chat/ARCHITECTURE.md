# Orby Chat — Architecture Decision Record (Phase 1)

Date: 2026-07-10 · Status: **Phase 1 complete — awaiting owner decisions before Phase 2**
Scope: audit of the DataDreamer repo, Directus schema, deployment environment, and the
complete sprite folder; architecture decisions; open questions. **No production system
was mutated in this phase.** The only artifacts produced are this document, the sprite
audit (`docs/audits/orby-sprite-audit.{json,md}`), the asset pipeline
(`scripts/prepare-orby-assets.mjs`), and validated runtime sprite copies + manifest
under `apps/orby-chat/public/orby/`.

---

## 1. Architecture overview

```
Cloudflare
  └─ Coolify reverse proxy
       ├─ data-dreamer.net          → existing Astro SSR (unchanged; loads one widget <script>)
       ├─ chat.data-dreamer.net     → orby-api (FastAPI) — serves widget.js, chat API, SSE stream
       │                              └─ orby-worker (ingestion, uploads, retention jobs)
       ├─ orby-postgres (pgvector)  → private network only, own credentials
       ├─ Ollama                    → private network only (endpoint TBD — owner)
       ├─ api.data-dreamer.net      → Directus (read-only Orby role; config + published content)
       └─ Discord webhooks          → outbound only, secrets in orby-api env
```

- **One deployable unit for v1** (`orby-api` container + `orby-worker` + `orby-postgres`
  via one compose file). The widget bundle is static JS served by orby-api itself —
  no second frontend deployment to operate.
- **The main site's entire integration** is a single conditional include in
  `frontend/src/layouts/BaseLayout.astro` (the one layout every page uses), guarded by
  `PUBLIC_ORBY_WIDGET_URL` — unset env = no script tag = no Orby. Removable in one line;
  a dead chat origin costs the page one failed async script and nothing else.

## 2. Decisions (with §24 answers)

**D1 — Stack: Python FastAPI** for orby-api/worker, per the brief's preference. Nothing
in this repo argues otherwise: the Astro app is content-focused, and the RAG/upload
ecosystem (pypdf, Pillow, clamd bindings, pgvector client) is strongest in Python.
The widget is framework-free TypeScript compiled to one IIFE bundle (~15 kB target) —
no React/Vue inside someone else's page.

**D2 — Widget isolation: Shadow DOM, not iframe** (§24 Q2). The widget renders into a
closed shadow root inside a single custom element; styles are constructable-stylesheet
scoped; no globals except one `data-*`-configured `<script>` tag. Rationale: the panel
needs safe-area handling, viewport-relative sizing, and reduced-motion coordination
with the host page — all clumsier through an iframe — and we control both sides, so
the iframe's only real advantage (hard security boundary against a hostile host page)
doesn't apply. The API origin is still a separate domain, so cookies/secrets never
belong to the host origin anyway. Revisit iframe only if a third-party site ever embeds
Orby.

**D3 — Astro integration point** (§24 Q1): `BaseLayout.astro`, after `</main>`, as
`{import.meta.env.PUBLIC_ORBY_WIDGET_URL && <script src={…} data-site="datadreamer" defer />}`.
Fails closed: widget.js itself checks `/health/ready` + Directus-config `enabled` before
rendering anything, and removes itself on failure.

**D4 — Database:** dedicated Postgres 16 + pgvector container, own volume, own
credentials, never port-published. The existing DataDreamer Postgres is NOT reused —
credential and blast-radius isolation is worth one more container on the homelab.
Schema per brief §9 (tables reviewed and accepted as-is; UUID PKs; ivfflat/HNSW index on
embeddings once the embedding dimension is known — depends on the chosen Ollama model,
§24 Q8, e.g. `nomic-embed-text` = 768, `mxbai-embed-large` = 1024).

**D5 — Directus's role: config + published content only.** New singleton
`orby_agent_config` (name follows existing snake_case convention) with the field groups
from brief §4, plus a `status` (draft/published) so a half-finished edit can't go live —
the config loader only reads `status=published`, caches for 60 s, and falls back to the
last known-valid config on validation failure. A new **Orby role + policy** gets
read-only permissions on: `orby_agent_config`, and published rows of `posts`,
`projects`, `guides`, `guide_sections`, `guide_items`, `authors` (public fields only —
never `user`), `topics`, `specialties`, junctions. No create/update/delete anywhere, no
`directus_users`, no files write. This mirrors the existing Guide Server pattern and
will be created by an idempotent script like `scripts/v4-account-model.mjs` (Phase 2).

**D6 — Approved ingestion corpus** (§24 Q5–Q7): `posts` (status=published →
`/blog/<slug>`), `projects` (→ `/projects/<slug>`), `guides` + sections + **public
preview fields only** (→ `/guides/<slug>`; gated item bodies/annotations are login-only
content and stay OUT of the corpus — Orby must not leak paid/gated guide content to
anonymous visitors), `authors` public profile fields (→ `/dream-team/<slug>` when
`dream_team=true`), `topics`/`specialties` names for routing metadata. Published =
`status = 'published'` everywhere (consistent across collections, verified in schema).
Markdown is normalized through plain text extraction (not the site's HTML pipeline —
embeddings don't need Shiki/KaTeX).

**D7 — Retrieval routing** per brief §5: rule-based classifier first (person-name
match against the ingested author list, content-type keywords, upload context), model
classification only as tie-breaker; global-scope default; metadata-filtered search
falls back to global on < `minimum_retrieval_score`; `allow_general_model_knowledge`
defaults false; no-evidence answers use the configured message + optional handoff.

**D8 — Sprite engine:** CSS `background-position` + `steps()` (all 40 strips are
uniform 5-frame × 256 px horizontals — verified), driven by a small state machine
reading `public/orby/manifest.json`. `image-rendering: pixelated`, integer positioning,
document-hidden pause, priority classes (error/warning states cannot be preempted by
ambient states), reduced-motion = static frame 0 from the manifest. Idle rotates
between `idle1/2/3`. No canvas needed.

**D9 — Uploads:** worker container only; PDF/PNG/JPEG/WebP/TXT; magic-byte check,
10 MB default cap, ClamAV sidecar **if available** (§24 Q16 — needs owner confirmation;
if not, v1 restricts types + parses in a resource-limited worker and we document the
residual risk), storage on a private volume outside any web root, per-visitor scoped
retrieval namespace, retention-based deletion.

**D10 — Notifications:** deterministic rules engine (event types per brief §11) with
cooldowns + dedup keys; Discord webhooks (env secrets) with per-route channels;
redacted summaries only, never transcripts/files. Cal.com = a CTA link from config,
no calendar API integration in v1.

## 3. Sprite audit result (§24 Q3–Q4)

**Folder is `docs/agent-workspace/assets/strips` (plural)** — the brief says `strip`;
the plural folder is the one that exists and is treated as authoritative.

All **40 strips valid and uniform**: 1280×256 RGBA, 5 × 256×256 frames, transparent,
shadow baseline consistent (one informational note: `syncing.png` baseline spread 28 px
— looks intentional, flagged for the QA preview page). Zero malformed, zero opaque
backgrounds, zero non-PNG files. Full detail: `docs/audits/orby-sprite-audit.{json,md}`.

Runtime copies + generated manifest live at `apps/orby-chat/public/orby/` — produced by
`node scripts/prepare-orby-assets.mjs` (repeatable; validates; never mutates sources;
exits non-zero on any malformed strip so CI catches bad additions).

State coverage is excellent — the folder includes idle1-3, listening, thinking,
searching, typing, talking, loading, syncing, yes/no, success/celebration, confused,
worried, warning, error, failure, blocked, offline, timeout, sleeping and 12 more.
Semantic/lifecycle mapping is encoded in the manifest (`category` field); missing
states from the brief's wish list (`cannot-find`, `reading`, `uploading`, `waking`)
map to `confused`/`searching`/`loading`/`excited` respectively — recorded here per
§15.6, no artwork invented.

## 4. Threat model (condensed)

| Actor | Vector | Control |
|---|---|---|
| Malicious visitor | prompt injection (text/uploads) | classifier + delimiter policy + injection patterns + safety_events log; retrieved/uploaded text is data-only |
| | scope escape ("act as general AI") | retrieval-evidence requirement, allow_general_model_knowledge=false, refusal messages |
| | upload malware / decompression bombs | type+magic+size gates, isolated worker with CPU/mem/page caps, AV scan, no execution/rendering |
| | abuse / cost attack | per-IP+visitor+session rate limits, message/token/upload budgets, Cloudflare in front |
| | cross-visitor memory theft | ownership filters on every visitor-scoped query + separate embedding namespaces + tests |
| Compromised widget page | host CSS/JS interference | Shadow DOM, no globals, API on separate origin, CORS allowlist |
| Compromised Orby service | Directus damage | read-only Orby token (no mutations anywhere); own DB credentials; no DataDreamer DB access |
| | secret leakage | secrets only in orby env; Directus config carries no secrets; health endpoints reveal nothing; log redaction |
| Operator error | bad config edit | draft/published config + validation + last-known-good fallback |
|  | disable needed fast | 4 kill switches: Directus `enabled`, API maintenance mode, Coolify stop, env-guarded script tag |

## 5. Open questions — owner input needed before Phase 2

These cannot be inferred from the repo (verified: zero references exist):

1. **Ollama** (§24 Q8/Q9/Q20): Is there an Ollama instance on the homelab network
   (e.g. alongside 192.168.10.211)? Which chat + embedding models are pulled / should
   I target (embedding model fixes the vector dimension — changing later means a full
   re-embed)? Acceptable p95 latency and fallback (smaller model vs. "Orby is busy")?
2. **Domain** (Q10): `chat.data-dreamer.net` for API + widget — confirm, and I'll
   include the Coolify + Cloudflare steps in the deployment guide.
3. **Cal.com URL** (Q11): the exact booking link for the handoff CTA.
4. **Discord** (Q12): create webhook(s) — minimum one channel; recommended four
   (`orby-opportunities`, `orby-security`, `orby-errors`, `orby-content-gaps`). Paste
   webhook URLs into the orby env only, never Directus.
5. **Retention** (Q13): proposal — messages 90 days, uploads 14 days, summaries
   1 year. Confirm or adjust.
6. **Anonymous chat** (Q14): proposal — yes, rate-limited, email only offered for
   memory/handoff. Confirm.
7. **Email verification before recalling history** (Q15): proposal — yes, magic-link
   via… there is currently **no SMTP configured** for the frontend; Directus SMTP
   status unknown. If no mailer exists, v1 recalls history only via the anonymous
   browser token and defers email-based recall. Confirm.
8. **ClamAV** (Q16): can the homelab run a clamav container (~1–2 GB RAM)? If not,
   v1 ships without AV and restricts uploads harder.
9. **Backups** (Q18): what's the current backup target for homelab volumes (the
   Directus DB presumably has one)? Orby's Postgres + uploads volume should join it.
10. **Privacy wording** (Q19): I can draft the consent/privacy notice for your review,
    or you supply approved wording.

## 6. Phase plan (unchanged from brief §21)

Phase 1 ✅ (this document + sprite pipeline). Phase 2 starts once questions 1–2 are
answered (service scaffold works without them, but there is no point building the chat
loop before the model endpoint is known). Each phase lands as a reviewed change; no
direct production deploys without the migration/rollback notes attached.

## 7. Known risks / limitations recorded now

- Homelab Ollama = single point of inference; maintenance mode + honest "offline"
  sprite state are first-class, not afterthoughts.
- Guide gated content is excluded from the corpus by design; Orby will describe guides
  from preview fields only.
- The 3-sample format assumption in the brief held for all 40 strips — but the
  prepare script re-validates on every run, so new art can't silently break the rule.
- Sprite playback speeds in the manifest are starting values; tune on the QA page.
