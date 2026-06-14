# DataDreamer v4 Release Next Steps

This document is the operational guide for getting from the current v4 staging branch
to a clean production release without losing track of branches or release gates.

Current date: 2026-06-14

---

## Current Situation

| Item | Status |
|---|---|
| v4 integration branch | `feature/v4-redesign` |
| staging frontend | `https://staging.data-dreamer.net` |
| production frontend | `https://data-dreamer.net` |
| production branch | `main` |
| release task | `V4-REL-001` is not complete until production cutover evidence exists |
| v4.1 courses/auth work | Do not start until v4.0 is released |
| retired v3 Directus drops | Do not run until after the v4.0 release soak |

The important distinction:

- `feature/v4-redesign` is the release candidate.
- `main` is production.
- Merging `feature/v4-redesign` into `main` is the production cutover.

---

## Branches: What To Keep, Close, Or Delete

### Keep

| Branch | Why |
|---|---|
| `feature/v4-redesign` | The v4 release candidate and staging source. |
| `main` | Production source. |
| `staging` | Existing environment branch if still used by legacy workflows. |

### Keep Until Release Decision

| Branch | Why |
|---|---|
| `v4/v4-rel-001` | Draft release-prep branch from PR #35. Keep it until the release checklist/script are either merged another way or the branch is superseded. |
| `codex/v4-docs-cleanup` | Documentation cleanup branch created for README/SETUP/release-guide updates. Merge it if the docs look right, then delete it. |

### Safe Cleanup Rule

Do not delete a branch just because it looks old. Delete it only after confirming its PR
is merged or intentionally abandoned.

Useful commands:

```bash
git fetch --prune

# See local branches.
git branch

# See remote branches.
git branch -r

# See merged PRs targeting the v4 branch.
gh pr list --state merged --base feature/v4-redesign \
  --json number,title,headRefName,mergedAt \
  --template '{{range .}}{{.number}} {{.headRefName}} {{.title}} {{.mergedAt}}{{"\n"}}{{end}}'
```

After confirming a branch's PR is merged:

```bash
# Delete remote branch.
git push origin --delete <branch-name>

# Delete local branch if it exists locally.
git branch -d <branch-name>
```

Branches that appear to be old task branches and should be checked for deletion:

```text
origin/v4/v4-clean-001
origin/v4/v4-doc-002
origin/v4/v4-perf-001
origin/v4/v4-perf-002
origin/v4/v4-perf-003
origin/v4/v4-qa-001
origin/v4/v4-qa-002
origin/v4/v4-qa-003
origin/v4/v4-seo-001
```

Branches with less obvious purpose should be reviewed before deletion:

```text
origin/code-review/polish-pass-1
origin/feature/connect-css-fixes
origin/v4/v4-dreamteam-redesign
origin/v4/v4-polish-fixes
origin/v4/v4-projects-dreamteam
```

---

## Before Production Release

Complete these steps before merging anything to `main`.

### 1. Merge Documentation Cleanup

Review and merge the docs cleanup PR/branch that updates:

- `README.md`
- `SETUP.md`
- `docs/RELEASE_NEXT_STEPS.md`
- `scripts/release-smoke.mjs`

This removes the confusing v3 setup references and gives the release a single guide.

### 2. Confirm Staging Is On The Latest v4 Branch

In Coolify:

1. Open the staging frontend resource.
2. Confirm Git branch is `feature/v4-redesign`.
3. Confirm domain is `staging.data-dreamer.net`.
4. Confirm environment variables:

   ```env
   DEPLOY_ENV=staging
   SITE_URL=https://staging.data-dreamer.net
   DIRECTUS_URL=http://192.168.10.211:8056
   PUBLIC_DIRECTUS_URL=http://192.168.10.211:8056
   ```

5. Deploy the latest commit.

### 3. Run Staging Smoke

From the repo root:

```bash
PUBLIC_DIRECTUS_URL=http://192.168.10.211:8056 \
  node scripts/release-smoke.mjs https://staging.data-dreamer.net
```

Expected result:

```text
Checks: 15/15 passed
```

The script checks:

- public route status;
- unknown-route 404;
- `/logs` and `/logs/:slug` redirects;
- RSS;
- sitemap index;
- robots;
- OG image fetch using Slackbot user agent;
- enforcing security headers;
- Directus health reachability.

### 4. Do The Staging Soak

Let staging sit on the final release candidate for the agreed release window.

Minimum checks during the soak:

- homepage loads in dark and light theme;
- `/blog`, `/projects`, `/dream-team`, `/connect`, `/privacy` load;
- no browser console errors;
- no CSP violations;
- mobile nav opens/closes and restores focus;
- theme toggle persists;
- blog redirects from `/logs` work;
- staging remains `noindex`;
- Directus content reads continue to work.

If you make any code change during soak, restart the soak clock for that release
candidate.

---

## Production Cutover

Run these only after staging is accepted.

### 1. Freeze Content

Tell editors not to change Directus content during cutover except for emergency fixes.

Suggested note:

```text
DataDreamer v4 release is starting. Please pause Directus content edits until release
smoke is complete. I will confirm when editing can resume.
```

### 2. Open PR From v4 To Production

```bash
gh pr create \
  --base main \
  --head feature/v4-redesign \
  --title "release: DataDreamer v4.0" \
  --body "Release DataDreamer v4.0 from feature/v4-redesign to production."
```

Wait for GitHub Actions to pass.

### 3. Merge The Production PR

Use a normal GitHub merge or squash merge, depending on repo convention. After merge,
Coolify production should deploy `main`.

### 4. Watch Coolify Production Deploy

In Coolify production frontend:

1. Open the deployment tab.
2. Confirm it deploys the merge commit from `main`.
3. Wait for the deployment to finish successfully.
4. Do not purge Cloudflare until the production container is healthy.

### 5. Run Production Smoke

From the repo root:

```bash
PUBLIC_DIRECTUS_URL=https://api.data-dreamer.net \
  node scripts/release-smoke.mjs https://data-dreamer.net
```

Expected:

```text
Checks: 15/15 passed
```

### 6. Purge Cloudflare

Purge these URL patterns or do a full-zone purge if that is simpler for the launch:

```text
https://data-dreamer.net/*
https://www.data-dreamer.net/*
https://data-dreamer.net/og/*
```

Then run the production smoke script again.

### 7. Production Browser Spot Check

Manually check:

- desktop homepage;
- mobile homepage;
- `/blog`;
- one article if posts exist;
- `/projects`;
- one project case study;
- `/dream-team`;
- one author page if authors exist;
- `/connect`;
- `/privacy`;
- `/rss.xml`;
- `/sitemap-index.xml`;
- `/robots.txt`.

Look for:

- no horizontal overflow;
- no console errors;
- no CSP violations;
- nav and mobile menu work;
- theme toggle persists;
- OG image URL loads;
- page titles and descriptions are correct.

### 8. Lighthouse Spot Check

Run mobile Lighthouse on:

```text
/
/blog
/projects
/dream-team
/connect
```

Record:

- Performance score;
- Accessibility score;
- Best Practices score;
- SEO score;
- LCP;
- CLS;
- TBT.

---

## Rollback Plan

If production smoke fails and cannot be fixed immediately:

1. Revert the merge commit that brought `feature/v4-redesign` into `main`.
2. Open a PR from the revert branch to `main`.
3. Merge it after CI passes.
4. Confirm Coolify redeploys the previous production frontend.
5. Purge Cloudflare.
6. Run production smoke again.

Do not run `V4-CMS-006` drops until you are confident rollback is no longer needed.

---

## After Production Is Stable

Only after v4.0 production is stable:

1. Mark `V4-REL-001` done in `docs/agent-workspace/13-TASKS.md`.
2. Append the final release entry to `docs/agent-workspace/15-HANDOFF.md`.
3. Run `V4-CMS-006` to drop retired Directus fields/collections after backup and soak.
4. Run `V4-DOC-001` if any docs still need cleanup after release.
5. Start v4.1 courses/auth tasks.

---

## Do Not Do Yet

- Do not merge `feature/v4-redesign` to `main` until staging is accepted.
- Do not delete production Directus collections before v4.0 is stable.
- Do not start v4.1 course/auth deployment work before v4.0 is released.
- Do not delete unclear branches without checking their PR status.
