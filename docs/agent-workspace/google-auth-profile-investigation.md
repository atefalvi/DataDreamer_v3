# Google Auth Profile Investigation

Date: 2026-06-22 · Investigator: Claude (session with live production verification)
Scope: why the account menu shows the generic "DD / DataDreamer member" instead of the
signed-in Google user's real name/avatar.

---

## Summary of Findings

**The application code is correct. The bug is one missing Directus permission in
production.**

- The frontend enriches the verified learner's profile server-side via the Guide Server
  service token: `GET /users/<verified-id>?fields=id,email,first_name,last_name,provider,avatar,date_created`.
- In production that read returns **403** because the **Guide Server policy has no
  `directus_users` read permission**. The repo's schema script already grants it
  (`scripts/v4-guides-schema.mjs`, `ensurePermission(serverPolicyId, 'directus_users', 'read', …)`),
  but the updated script **has not been rerun against production**.
- Enrichment fails silently (`.catch(() => undefined)`), so `toSessionProfile()` returns
  an id with empty email/name, and `userIdentity()` renders its final fallback:
  initials `DD`, name `DataDreamer member`, secondary `Signed in securely`.

Live evidence (2026-06-22, production `api.data-dreamer.net`, service token):

| Check | Result |
|---|---|
| `GET /items/guides?fields=id&limit=1` | **200** (catalogue works) |
| `GET /users?fields=id&limit=1` | **403** ← root cause |
| `node scripts/v4-guides-service-check.mjs` | fails at `/users` with "Check the Guide Server role/policy." |

**Fix = rerun one idempotent script against production. Zero code changes required.**

A second, separate expectation gap: Directus does **not** import the Google `picture`
claim as an avatar file. After the permission fix you get the real **name, email, and
initials** — a photo appears only if an avatar image is uploaded on the Directus user
record (the existing `/api/auth/avatar` proxy then serves it privately). Recommendation:
accept the monogram-with-real-initials as the default; do not build a picture-sync.

---

## Current Auth Flow

Exact sequence (verified live against production 2026-06-22):

```
User clicks "Continue with Google"                    (GoogleButton.astro)
→ GET https://data-dreamer.net/api/auth/google?next=/guides
    · stores safeNext(next) in HttpOnly cookie `dd_oauth_next`
      (path=/api/auth/google, Secure in prod, SameSite=Lax, 10 min)   (session.rememberOAuthNext)
    · 302 → https://api.data-dreamer.net/auth/login/google
             ?redirect=https://data-dreamer.net/api/auth/google/callback   (fixed, no query)
→ Directus validates redirect against AUTH_GOOGLE_REDIRECT_ALLOW_LIST
    (compose maps it from GOOGLE_REDIRECT_URL — exact match)          ✅ verified 302
→ Google consent (client 567160061361-…)                              ✅ verified 302
→ Google → https://api.data-dreamer.net/auth/login/google/callback
    · Directus creates/looks up the user (new email → Guide Reader via
      AUTH_GOOGLE_DEFAULT_ROLE_ID; existing password account → INVALID_PROVIDER)
    · sets `directus_session_token` cookie on .data-dreamer.net (HttpOnly)
    · 302 → https://data-dreamer.net/api/auth/google/callback
→ App callback (api/auth/google/callback.ts)
    · consumes `dd_oauth_next`; on ?reason=… → /login with friendly notice
    · 302 → next (e.g. /guides/learn-airflow-the-real-way)
→ Every request: middleware sees a session cookie → resolveUser(cookies)
    · OAuth path: `directus_session_token` used as Bearer
    · fetchMe(): GET /users/me?fields=id  (learner token proves identity — id only)
    · fetchServerProfile(id): service token reads the profile row      ← 403 in prod
    · toSessionProfile(id, profile) → locals.user
→ SiteNav / MobileMenu / account render userIdentity(locals.user)
```

Email/password login uses the same `resolveUser` but with app-issued JSON-token cookies
(`dd_at` / `dd_rt` / `dd_at_exp`, HttpOnly) and has the identical enrichment step, so the
same 403 affects it equally.

## Current Session/User Object

`SessionUser` (`lib/auth/session.ts`) — built by `toSessionProfile(verifiedId, profile?)`:

```ts
{ id, email, firstName?, lastName?, provider?, avatarId?, avatarUrl?, createdAt?, accessToken }
```

- `avatarUrl` is never a Directus/Google URL — it is the **same-origin private proxy**
  `/api/auth/avatar` (which streams the file via the service token, `private` cache).
- `accessToken` stays server-side in `Astro.locals`; it is never serialized to the client.
- `GuideReaderUser` in `env.d.ts` mirrors this for `Astro.locals.user`.

`UserIdentity` (`lib/auth/identity.ts`) — the only shape components render:

```ts
{ displayName, firstName?, initials, secondary, avatarUrl? }
```

## Where the Fallback Name and Avatar Come From

All three strings come from `frontend/src/lib/auth/identity.ts` → `userIdentity()`:

- `displayName = fullName || emailLocalPart || 'DataDreamer member'` — with empty
  email/names, the final literal renders.
- `initials = … || 'DD'` — no identity source → `'DD'`.
- `secondary = user.email || 'Signed in securely'` — empty email → the literal.

They are the *designed last-resort fallback*; they render today only because enrichment
returns nothing (403). Nothing is hardcoded in SiteNav/MobileMenu/account — all three
consume `userIdentity()`, so one fix propagates everywhere.

## Root Cause Hypothesis (verified)

**Category: Directus user-profile retrieval — a production permission/config gap, not a
code defect.** Of the four hypotheses in the brief: not frontend rendering (fallback
chain is correct and unit-tested), not session mapping (`toSessionProfile` mapped a full
profile correctly in tests), not OIDC field mapping (Directus stores first/last/email
from Google claims at user creation). The service credential simply cannot read
`directus_users` in production.

Contributing factor: `fetchServerProfile` failure is swallowed with no log, which made
this invisible in production logs. (Optional one-line improvement below.)

## Simplest Correct Fix

**Step 1 (the fix, ops-only):** rerun the idempotent schema script against production —
it adds the missing `directus_users` (+ `directus_files`) read permissions to the Guide
Server policy and skips everything that already exists:

```bash
DIRECTUS_URL=https://api.data-dreamer.net \
DIRECTUS_ADMIN_TOKEN="<fresh prod admin token>" \
node scripts/v4-guides-schema.mjs
```

**Step 2 (verify, non-mutating):**

```bash
DIRECTUS_URL=https://api.data-dreamer.net \
DIRECTUS_SERVICE_TOKEN="<frontend's service token>" \
node scripts/v4-guides-service-check.mjs        # must pass the /users step
```

**Step 3:** reload the site (no frontend redeploy needed — enrichment runs per request).
The menu shows the real name, email, and initials immediately.

**Optional micro-improvement (one line of code, prevents the next silent failure):** in
`fetchMe`, log a single non-sensitive warning when enrichment fails, e.g.
`console.warn('[auth] profile enrichment unavailable for user; check Guide Server policy')`
— no token, no email, no id value beyond presence. This is the only code change worth
making.

## Security Review

Verified sound (no changes needed):

- **Service token is server-only** (`DIRECTUS_SERVICE_TOKEN`, no `PUBLIC_` prefix; used in
  `directusServiceFetch` on the server; never serialized to HTML/client).
- **Service user ≠ website user**: the learner's own token proves identity via
  `/users/me?fields=id` *first*; the service token then reads only that verified id.
  The service user is never rendered.
- **Cookies**: app tokens `dd_at/dd_rt/dd_at_exp` and `dd_oauth_next` are HttpOnly,
  SameSite=Lax, Secure in prod; the OAuth next-cookie is path-scoped and 10-minute.
- **Avatar** never exposes Directus asset URLs/ids to the client — `/api/auth/avatar`
  proxies with `private` caching and `nosniff`.
- **Session payload to templates** is the normalized object only; no raw OAuth payloads,
  no provider tokens; no token logging anywhere in `lib/auth`.
- **Logout** clears host cookies + the domain-scoped `directus_session_token` at
  `.data-dreamer.net`; verified 303 + hostile-origin 403 (CSRF check in middleware).
- **Open-redirect** guarded by `safeNext` (unit-tested incl. `//`, `\`, control chars).
- Personalized HTML is `Cache-Control: private, no-store`.

Issues found in the **provided production env** (fix during rollout):

1. `SESSION_COOKIE_SECURE=false` — the Directus OAuth session cookie is sent without the
   Secure flag. Production is HTTPS-only; set **`SESSION_COOKIE_SECURE=true`** and
   restart Directus. (Likely a debugging leftover.)
2. `DIRECTUS_SECRET=c6C6UBVRaQozWZqW` — 16 chars; Directus itself warns `<32 bytes is
   insecure`. Generate `openssl rand -hex 32` and set it. **Note: rotating it invalidates
   all sessions** — do it in the same maintenance window as the permission fix.
3. **Secrets were shared in plaintext during ops** (admin password, Google client secret,
   service token, DB password). Rotate at the next opportunity: Google client secret in
   Google Cloud console; service token via the documented rotation runbook in
   `qa/guides.md`; admin password in Directus.
4. `AUTH_GOOGLE_REDIRECT_ALLOW_LIST=<origins list>` set directly in the env is **ignored**
   — the compose maps that container var from `GOOGLE_REDIRECT_URL` (the fixed callback),
   which is the value actually in effect (verified live). Delete the redundant env var to
   avoid future confusion. `APP_ORIGIN` is likewise no longer consumed by the compose —
   removable.
5. Frontend env omits `SITE_URL` and `AUTH_COOKIE_DOMAIN` — both currently fall back
   correctly in code (`https://data-dreamer.net`, inferred `.data-dreamer.net`), so this
   is informational; setting them explicitly is slightly more robust.

## What Not To Over-Engineer

- **No Google-picture sync pipeline.** Directus keeps the OAuth tokens; the app never
  sees the `picture` claim. Building a sync would mean intercepting OIDC or storing
  provider data we don't need. The monogram with *real initials* is the premium default;
  a photo works today by uploading an avatar on the Directus user (proxy already built).
- **No new user table / profile store.** Directus users are the single source of truth.
- **No session-architecture rewrite.** The two-token model (learner proves identity,
  service enriches) is sound and keeps learner tokens least-privilege.
- **No client-side session endpoint.** Identity is server-rendered from `locals.user`;
  don't add a `/api/session` JSON endpoint nobody consumes.
- **No duplicated profile state** (e.g. caching names in cookies) — enrichment is one
  indexed read per request and personalized pages are `no-store` anyway.

## Correct Target Design

Unchanged from what is implemented — this investigation confirms the design; production
config just hasn't caught up:

1. Learner cookie (Directus session **or** app JSON tokens) proves *who* — id only.
2. Guide Server token reads *that id's* profile row — name/email/avatar id.
3. `toSessionProfile` normalizes to the safe `SessionUser`.
4. `userIdentity` derives display name → initials → secondary with the fallback ladder.
5. Components render only `UserIdentity`; avatar images go through `/api/auth/avatar`.

## Recommended Data Shape

Already implemented as:

```ts
// locals.user (server-only; accessToken never reaches the client)
type SessionUser = {
  id: string; email: string;
  firstName?: string; lastName?: string;
  provider?: string;               // 'google' | 'default' | …
  avatarId?: string;               // Directus file id (server-side)
  avatarUrl?: string;              // always the private proxy '/api/auth/avatar'
  createdAt?: string; accessToken: string;
};

// what components consume
type UserIdentity = { displayName: string; firstName?: string; initials: string; secondary: string; avatarUrl?: string };
```

## Detailed Pseudocode

Corrected end-to-end (matches the code; the only delta vs. production is the permission):

```
resolveUser(cookies):
  token = cookies.dd_at ?? refresh(dd_rt) ?? cookies.directus_session_token
  if no token: return null
  id = GET {DIRECTUS}/users/me?fields=id  (Bearer: learner token)        # identity proof
  profile = GET {DIRECTUS}/users/{id}?fields=id,email,first_name,
            last_name,provider,avatar,date_created (Bearer: SERVICE token)
  if profile read fails:
      warn once "[auth] profile enrichment unavailable"                  # ← add (optional)
      profile = undefined                                                # session stays valid
  return toSessionProfile(id, profile)

toSessionProfile(id, p):                       # normalization (implemented + unit-tested)
  return { id, email: p?.email ?? '', firstName: p?.first_name, lastName: p?.last_name,
           provider: p?.provider, avatarId: fileId(p?.avatar),
           avatarUrl: fileId(p?.avatar) ? '/api/auth/avatar' : undefined,
           createdAt: p?.date_created }

userIdentity(user):                            # display ladder (implemented)
  name  = join(firstName?, lastName?) where firstName not in GENERIC_NAMES
  base  = name || emailLocalPart(user.email)
  return { displayName: base || 'DataDreamer member',
           initials: initialsOf(base) || 'DD',
           secondary: user.email || 'Signed in securely',
           avatarUrl: user.avatarUrl }

initialsOf(value):                             # implemented in identity.ts
  parts = value.split(/[.\s_-]+/).filter(Boolean).slice(0, 2)
  return parts.map(p => p[0].toUpperCase()).join('')

Navbar/menu render (implemented):
  if !locals.user            → "Sign in" pill
  elif identity.avatarUrl    → <img src="/api/auth/avatar"> (private proxy)
  else                       → monogram badge with identity.initials
```

## Execution Plan for Follow-Up Agents

### Phase 1 — Apply the production fix (ops; ~5 minutes)
- [ ] Mint a fresh prod admin token (Directus admin → your admin user → static token; or
      `POST /auth/login` with admin email/password → short-lived token, fine for one run).
- [ ] `DIRECTUS_URL=https://api.data-dreamer.net DIRECTUS_ADMIN_TOKEN=… node scripts/v4-guides-schema.mjs`
      (idempotent; expect mostly `=` lines plus `+ permission directus_users.read` /
      `+ permission directus_files.read` on the Guide Server policy).
- [ ] `DIRECTUS_URL=… DIRECTUS_SERVICE_TOKEN=… node scripts/v4-guides-service-check.mjs`
      → must pass all steps including the learner-profile read.
- [ ] Reload the site signed-in → real name/email/initials render (no redeploy needed).

### Phase 2 — Env hardening (same maintenance window)
- [ ] Backend: `SESSION_COOKIE_SECURE=true`.
- [ ] Backend: `DIRECTUS_SECRET=$(openssl rand -hex 32)` (invalidates sessions — expected).
- [ ] Backend: remove redundant `AUTH_GOOGLE_REDIRECT_ALLOW_LIST` and `APP_ORIGIN` env vars
      (compose derives the allow-list from `GOOGLE_REDIRECT_URL`).
- [ ] Restart/redeploy Directus; re-run `v4-guides-smoke.mjs` afterwards.
- [ ] Schedule rotation of the secrets shared in plaintext (Google client secret,
      service token, admin password) per the `qa/guides.md` runbook.

### Phase 3 — Optional one-line code change
- [ ] `lib/auth/session.ts` `fetchMe`: replace the silent `.catch(() => undefined)` with a
      catch that logs one non-sensitive warning. Add no other code.

### Phase 4 — Validate (browser)
- [ ] Fresh Google login with a Gmail **not** already in Directus → lands on the guide,
      menu shows real name + email + correct initials.
- [ ] Refresh → identity persists (server-rendered).
- [ ] Upload an avatar on that Directus user → reload → photo renders via `/api/auth/avatar`.
- [ ] Email/password login → same correct identity.
- [ ] Sign out → anonymous state; sign back in.
- [ ] Mobile menu shows the same identity.
- [ ] Admin email via Google still yields the friendly INVALID_PROVIDER message on /login
      (expected Directus behavior — cannot link Google onto a password account).

## Files Likely Requiring Changes

**None required for the fix.** Optional only:
- `frontend/src/lib/auth/session.ts` — one warn line in `fetchMe` (Phase 3).
- Ops docs already correct: `docs/agent-workspace/qa/guides.md` runbook describes this
  exact permission and check.

## Environment Variables to Verify

| Var | Current | Action |
|---|---|---|
| Guide Server policy → `directus_users` read | missing (403) | **rerun schema script** (the fix) |
| `SESSION_COOKIE_SECURE` (backend) | `false` | set `true` |
| `DIRECTUS_SECRET` (backend) | 16 chars | `openssl rand -hex 32` (invalidates sessions) |
| `AUTH_GOOGLE_REDIRECT_ALLOW_LIST` (backend env) | origins list w/ path | delete — compose derives from `GOOGLE_REDIRECT_URL` (in effect, verified) |
| `APP_ORIGIN` (backend) | set | unused by compose now — delete |
| `GOOGLE_REDIRECT_URL` | `https://data-dreamer.net/api/auth/google/callback` | correct — keep |
| `AUTH_GOOGLE_DEFAULT_ROLE_ID` | Guide Reader id | correct — keep |
| Frontend `SITE_URL`, `AUTH_COOKIE_DOMAIN` | unset (safe defaults apply) | optionally set explicitly |
| `AUTH_GOOGLE_SYNC_USER_INFO` | unset | optional: `true` keeps name/email refreshed each login (names currently captured at first login only) |

## Testing Plan

1. `v4-guides-service-check.mjs` passes (incl. profile read) — gate for everything else.
2. Browser: fresh-Gmail Google login → name "First Last", email under it, initials match.
3. Browser: avatar upload on the user → photo replaces monogram; image URL is
   `/api/auth/avatar` (never a Directus asset URL) and returns 404 when signed out.
4. Email/password account → same identity behavior.
5. Sign out / sign in / hard refresh — state correct each time.
6. Dev tools: no request/response contains `DIRECTUS_SERVICE_TOKEN`, Directus tokens, or
   raw OAuth payloads; personalized pages send `Cache-Control: private, no-store`.
7. Regression: `/guides` catalogue + gated reader + progress toggling still work
   (`v4-guides-smoke.mjs` against prod).

## Production Readiness Checklist

- [ ] Guide Server policy reads `directus_users` + `directus_files` (script rerun) ✔ gate
- [ ] `v4-guides-service-check.mjs` fully green
- [ ] `SESSION_COOKIE_SECURE=true`
- [ ] `DIRECTUS_SECRET` ≥ 32 bytes
- [ ] Service token remains server-side only (no `PUBLIC_`, absent from client bundles)
- [ ] Session/identity exposed to templates is the normalized object only
- [ ] No tokens/raw OAuth data in logs (fetchMe warn line is non-sensitive)
- [ ] Logout verified (303, cookies cleared incl. `.data-dreamer.net` session cookie)
- [ ] Google sign-in tested with a real non-admin Gmail
- [ ] Navbar + mobile menu correct after refresh
- [ ] Gated Guides access + public pages regression-checked (`v4-guides-smoke.mjs`)
- [ ] Redundant env vars removed; secret rotation scheduled
- [ ] No new tables, endpoints, or user systems introduced

## Risks and Edge Cases

- **Admin email via Google** always fails with INVALID_PROVIDER (Directus won't link
  providers). Handled with a friendly `/login` notice; document, don't "fix".
- **Names go stale** if a user renames their Google account (captured at first login
  only) unless `AUTH_GOOGLE_SYNC_USER_INFO=true` is set. Cosmetic; optional.
- **OAuth session expiry**: the Directus session cookie has a TTL and the app deliberately
  doesn't refresh it (documented ponytail shortcut) — user re-authenticates; acceptable.
- **`DIRECTUS_SECRET` rotation** signs everyone out — do it knowingly.
- **Enrichment is one extra Directus read per authenticated request.** Fine at current
  scale (indexed PK read, LAN); if it ever shows up in traces, cache per-request only.
- **Secrets disclosed in plaintext during this rollout** — rotation is the mitigation;
  until rotated, treat the current Google client secret/service token as semi-exposed.

## Final Recommendation

Do **not** touch the auth code. Run the idempotent `v4-guides-schema.mjs` against
production with an admin token (adds the missing `directus_users`/`directus_files` read
to the Guide Server policy), verify with `v4-guides-service-check.mjs`, and reload — the
real Google name, email, and initials render immediately across navbar, mobile menu, and
account. In the same window set `SESSION_COOKIE_SECURE=true` and a ≥32-byte
`DIRECTUS_SECRET`. Optionally add the single enrichment-failure warn line so this class
of failure is never silent again. Accept the monogram as the no-photo default; photos
work today via a Directus avatar upload served through the existing private proxy.
