# V4.0 Release Checklist

Date opened: 2026-06-14

Status: blocked before production cutover.

## Release Candidate

| Item | Result |
|---|---|
| Source branch | `feature/v4-redesign` |
| Latest completed task before release | `V4-PERF-003` |
| Staging URL | `https://staging.data-dreamer.net` |
| Staging Directus URL used for smoke | `http://192.168.10.211:8056` |
| Production URL | `https://data-dreamer.net` |
| Production Directus URL | `https://api.data-dreamer.net` |

## Pre-Release Gates

| Gate | Status | Evidence / notes |
|---|---|---|
| Phase D task board complete | Pass | QA and PERF tasks are `done` in `13-TASKS.md`. |
| Local validation | Pass | `git diff --check`; `npx astro check`; `npm test`; `npm run build`. |
| Staging smoke script | Pass | `node scripts/release-smoke.mjs https://staging.data-dreamer.net` passed 15/15. |
| CSP staging soak | Pending | `V4-PERF-003` enforcement just landed; monitor staging for live violations before production. |
| Final 48h staging soak | Pending | Required by 12 Phase E; not elapsed in this task window. |
| Content freeze note to editors | Pending | Owner/editor operational step. |
| Production cutover approval | Pending | Required before merging `feature/v4-redesign` to `main`. |
| Cloudflare purge access | Pending | No API token or manual purge confirmation available in repo/context. |

## Staging Smoke Results

Command:

```bash
PUBLIC_DIRECTUS_URL=http://192.168.10.211:8056 \
  node scripts/release-smoke.mjs https://staging.data-dreamer.net
```

Result:

| Check | Result |
|---|---|
| `/` | Pass |
| `/blog` | Pass |
| `/projects` | Pass |
| `/dream-team` | Pass |
| `/connect` | Pass |
| `/privacy` | Pass |
| unknown route returns 404 | Pass |
| `/logs` redirects to `/blog` | Pass |
| `/logs/:slug` redirects to `/blog/:slug` | Pass |
| `/rss.xml` returns feed XML | Pass |
| `/sitemap-index.xml` returns sitemap index | Pass |
| `/robots.txt` returns a Sitemap directive | Pass |
| `/og/og-home.png` fetches as Slackbot | Pass |
| frontend security headers include enforcing CSP | Pass |
| Directus health endpoint is reachable | Pass |

## Production Cutover Procedure

Do not run these steps until the pending pre-release gates above are satisfied.

1. Send the content freeze note to editors.
2. Confirm the 48h staging soak completed with no blocking console, CSP, content, or
   deployment errors.
3. Create a PR from `feature/v4-redesign` to `main`.
4. Wait for GitHub Actions to pass.
5. Merge the PR to `main`.
6. Confirm Coolify production frontend deploys the merged `main` commit.
7. Run the production smoke script:

   ```bash
   PUBLIC_DIRECTUS_URL=https://api.data-dreamer.net \
     node scripts/release-smoke.mjs https://data-dreamer.net
   ```

8. Purge Cloudflare cache for:
   - `https://data-dreamer.net/*`
   - `https://www.data-dreamer.net/*`
   - `https://data-dreamer.net/og/*`
9. Re-run the production smoke script after purge.
10. Run a production Lighthouse mobile spot check on `/`, `/blog`, `/projects`,
    `/dream-team`, and `/connect`.
11. Record the production results in this file.
12. Mark `V4-REL-001` as `done` only after the production results are recorded.

## Rollback Rehearsal

Rollback plan for the production cutover:

1. Revert the merge commit that brought `feature/v4-redesign` into `main`.
2. Push the revert through a PR to `main`.
3. Confirm Coolify redeploys the previous production frontend.
4. Run the production smoke script against `https://data-dreamer.net`.
5. Purge Cloudflare cache for the same URL set.

Important constraint: do not run `V4-CMS-006` collection/field drops before the release
soak is complete. The current v4.0 schema changes are backward-compatible with the v3
frontend, but the post-release cleanup drops are not.

## Current Blockers

- The required final 48h staging soak has not elapsed after the latest CSP-enforcing
  merge.
- Production cutover approval has not been explicitly given for merging to `main`.
- Cloudflare purge access/confirmation is not available in the workspace.
- Production Lighthouse evidence cannot be collected until production is cut over.
