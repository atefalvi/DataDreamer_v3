/**
 * v4.2 Account model — one account, opt-in public roles.
 *
 * Model:
 *   directus_users (Guide Reader)        = every login (guides + progress). Private.
 *   authors                              = admin-curated public profile (Dream Team page
 *                                          and/or blog byline), linked to the account via
 *                                          the new `authors.user` M2O.
 *   authors.dream_team (boolean)         = admin approval to appear on /dream-team.
 *   Contributor role (+policy)           = admin approval to write + publish their own
 *                                          posts in the Directus app (own posts only).
 *
 * Also hardens the Public policy (row rules are licensed on prod): drafts are no longer
 * readable anonymously, and the new `authors.user` link is never exposed publicly.
 *
 * Idempotent. Run: DIRECTUS_URL=… DIRECTUS_ADMIN_TOKEN=… node scripts/v4-account-model.mjs
 */

const BASE = process.env.DIRECTUS_URL ?? 'https://api.data-dreamer.net';
const TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;
if (!TOKEN) {
  console.error('DIRECTUS_ADMIN_TOKEN is required (admin static or /auth/login token).');
  process.exit(1);
}

const jsonHeaders = { 'Content-Type': 'application/json' };

async function api(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${init.method ?? 'GET'} ${path} → ${res.status} ${body.slice(0, 180)}`);
  }
  if (res.status === 204) return null;
  return (await res.json()).data;
}

async function exists(path) {
  try {
    await api(path);
    return true;
  } catch {
    return false;
  }
}

/* ── 1. authors.dream_team + authors.user ─────────────────────────────── */

async function ensureAuthorFields() {
  if (await exists('/fields/authors/dream_team')) {
    console.log('= field authors.dream_team');
  } else {
    await api('/fields/authors', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        field: 'dream_team',
        type: 'boolean',
        schema: { default_value: false },
        meta: {
          interface: 'boolean',
          width: 'half',
          note: 'Approved to appear on the public Dream Team page.',
        },
      }),
    });
    console.log('+ field authors.dream_team');
  }

  if (await exists('/fields/authors/user')) {
    console.log('= field authors.user');
  } else {
    await api('/fields/authors', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        field: 'user',
        type: 'uuid',
        schema: {},
        meta: {
          interface: 'select-dropdown-m2o',
          special: ['m2o'],
          width: 'half',
          note: 'The login account behind this profile (never exposed publicly).',
          display: 'user',
        },
      }),
    });
    console.log('+ field authors.user');
  }

  const relations = await api('/relations/authors').catch(() => []);
  if (!relations.some((r) => r.field === 'user')) {
    await api('/relations', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        collection: 'authors',
        field: 'user',
        related_collection: 'directus_users',
        schema: { on_delete: 'SET NULL' },
        meta: {},
      }),
    }).catch((e) => {
      if (!/already/i.test(e.message)) throw e;
    });
    console.log('+ relation authors.user → directus_users');
  } else {
    console.log('= relation authors.user');
  }
}

/* ── 2. Backfill: everyone currently on the site stays on the team ─────── */

async function backfillDreamTeam() {
  const rows = await api('/items/authors?fields=id,dream_team&limit=200');
  const pending = rows.filter((row) => row.dream_team !== true).map((row) => row.id);
  if (!pending.length) {
    console.log('= dream_team backfill (nothing to do)');
    return;
  }
  await api('/items/authors', {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify({ keys: pending, data: { dream_team: true } }),
  });
  console.log(`+ dream_team=true backfilled for ${pending.length} existing author(s)`);
}

/* ── 2b. Link existing profiles to their login accounts ─────────────────
   authors.user must point at the directus_users account so one person's guide
   login, Dream Team profile, and blog byline are the same identity (and so a
   Contributor can edit only their own profile). New profiles get this set by the
   admin at approval time; this reconciles the profiles that predate the field.
   Idempotent: only links when user is null and exactly one account matches. */

const KNOWN_AUTHOR_ACCOUNTS = [
  // author slug → predicate identifying the directus_users account (email is the
  // stable key; resolved to an id at runtime so no UUIDs are hardcoded).
  { slug: 'syed-atef-alvi', match: (u) => u.email === 'atefalvi@gmail.com' },
  { slug: 'maria-khan', match: (u) => u.provider === 'google' && (u.first_name ?? '').toLowerCase() === 'maria' },
];

async function linkKnownAuthors() {
  const users = await api('/users?fields=id,email,first_name,provider&limit=200');
  const authors = await api('/items/authors?fields=id,slug,user&limit=200');
  for (const rule of KNOWN_AUTHOR_ACCOUNTS) {
    const author = authors.find((a) => a.slug === rule.slug);
    if (!author) continue;
    if (author.user) {
      console.log(`= author ${rule.slug} already linked`);
      continue;
    }
    const matches = users.filter(rule.match);
    if (matches.length !== 1) {
      console.log(`! author ${rule.slug}: ${matches.length} matching accounts — link manually in the UI`);
      continue;
    }
    await api(`/items/authors/${author.id}`, {
      method: 'PATCH',
      headers: jsonHeaders,
      body: JSON.stringify({ user: matches[0].id }),
    });
    console.log(`+ linked author ${rule.slug} → its login account`);
  }
}

function slugify(value) {
  return (
    String(value)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'author'
  );
}

async function uniqueAuthorSlug(base, existingSlugs, suffix) {
  const candidate = slugify(base);
  if (!existingSlugs.has(candidate)) {
    existingSlugs.add(candidate);
    return candidate;
  }
  const withSuffix = `${candidate}-${String(suffix).slice(0, 8)}`;
  existingSlugs.add(withSuffix);
  return withSuffix;
}

/* ── 2c. Backfill pending profiles for existing signed-up users ─────────
   The author-profile hook creates draft profiles for new signups. This reconciles
   accounts created before that hook behavior existed, so admins can approve them
   from Content → Authors instead of manually creating/linking an author row. */

async function backfillPendingAuthorProfiles() {
  const [users, authors] = await Promise.all([
    api('/users?fields=id,email,first_name,last_name,role.admin_access&limit=-1'),
    api('/items/authors?fields=id,slug,user&limit=-1'),
  ]);

  const linkedUsers = new Set(authors.map((author) => author.user).filter(Boolean));
  const existingSlugs = new Set(authors.map((author) => author.slug).filter(Boolean));
  const pending = users.filter((user) => !user.role?.admin_access && !linkedUsers.has(user.id));

  if (!pending.length) {
    console.log('= pending author profile backfill (nothing to do)');
    return;
  }

  for (const user of pending) {
    const displayName =
      [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
      (user.email ?? 'author').split('@')[0];
    const slug = await uniqueAuthorSlug(displayName, existingSlugs, user.id);
    await api('/items/authors', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        user: user.id,
        display_name: displayName,
        slug,
        role_title: 'Contributor',
        status: 'draft',
        dream_team: false,
      }),
    });
  }

  console.log(`+ created ${pending.length} pending linked author profile(s)`);
}

/* ── 3. Permission helper (rules + validation + presets aware) ─────────── */

async function ensurePermission(policy, collection, action, options = {}) {
  const payload = {
    policy,
    collection,
    action,
    fields: options.fields ?? ['*'],
    permissions: options.permissions ?? null,
    validation: options.validation ?? null,
    presets: options.presets ?? null,
  };
  const existing = await api(
    `/permissions?filter[policy][_eq]=${policy}&filter[collection][_eq]=${collection}&filter[action][_eq]=${action}&fields=id&limit=1`,
  ).catch(() => []);
  if (existing.length) {
    await api(`/permissions/${existing[0].id}`, { method: 'PATCH', headers: jsonHeaders, body: JSON.stringify(payload) });
    console.log(`= permission ${collection}.${action}`);
  } else {
    await api('/permissions', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(payload) });
    console.log(`+ permission ${collection}.${action}`);
  }
}

/* ── 4. Public hardening: published-only reads, authors.user hidden ────── */

// Everything public today except the new `user` link.
const AUTHOR_PUBLIC_FIELDS = [
  'id', 'status', 'slug', 'display_name', 'role_title', 'bio', 'statement',
  'avatar', 'links', 'tools', 'featured_work', 'sort', 'specialties', 'dream_team',
];

async function hardenPublicPolicy() {
  const policies = await api('/policies?fields=id,name&limit=200');
  const publicPolicy = policies.find((p) => p.name === '$t:public_label');
  if (!publicPolicy) {
    console.log('! public policy not found — skipping hardening');
    return;
  }
  const PUBLISHED = { status: { _eq: 'published' } };
  await ensurePermission(publicPolicy.id, 'authors', 'read', { fields: AUTHOR_PUBLIC_FIELDS, permissions: PUBLISHED });
  await ensurePermission(publicPolicy.id, 'posts', 'read', { permissions: PUBLISHED });
  await ensurePermission(publicPolicy.id, 'projects', 'read', { permissions: PUBLISHED });
  // Junctions / taxonomies have no status and stay as-is.
}

/* ── 5. Contributor role: approved blog authors, drafts only, own only ─── */

const OWN = { _eq: '$CURRENT_USER' };

async function ensureContributor() {
  const roles = await api('/roles?fields=id,name&limit=200');
  let role = roles.find((r) => r.name === 'Contributor');
  if (!role) {
    role = await api('/roles', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        name: 'Contributor',
        icon: 'edit_note',
        description: 'Admin-approved blog author: writes and publishes their own posts in the Directus app.',
      }),
    });
    console.log('+ role Contributor');
  } else {
    console.log('= role Contributor');
  }

  const policies = await api('/policies?fields=id,name&limit=200');
  let policy = policies.find((p) => p.name === 'Contributor');
  if (!policy) {
    policy = await api('/policies', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        name: 'Contributor',
        icon: 'edit_note',
        description: 'Own posts (create/edit/publish) + own author profile. No admin, no other users\' content.',
        admin_access: false,
        app_access: true,
      }),
    });
    console.log('+ policy Contributor');
  } else {
    console.log('= policy Contributor');
  }

  const access = await api(`/access?filter[role][_eq]=${role.id}&filter[policy][_eq]=${policy.id}&fields=id&limit=1`).catch(() => []);
  if (!access.length) {
    await api('/access', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ role: role.id, policy: policy.id }) });
    console.log('+ access Contributor role ↔ policy');
  }

  const id = policy.id;
  // Posts: full authorship over OWN posts — create (starts as draft), edit, and
  // publish. Never other people's posts; delete only while still a draft.
  await ensurePermission(id, 'posts', 'create', {
    presets: { status: 'draft' },
  });
  await ensurePermission(id, 'posts', 'read', {
    permissions: { _or: [{ status: { _eq: 'published' } }, { user_created: OWN }] },
  });
  await ensurePermission(id, 'posts', 'update', {
    permissions: { user_created: OWN },
  });
  await ensurePermission(id, 'posts', 'delete', {
    permissions: { user_created: OWN, status: { _eq: 'draft' } },
  });

  // Taxonomy + junctions needed while drafting.
  await ensurePermission(id, 'topics', 'read', {});
  await ensurePermission(id, 'posts_topics', 'create', {});
  await ensurePermission(id, 'posts_topics', 'read', {});
  await ensurePermission(id, 'posts_topics', 'delete', {
    permissions: { posts_id: { user_created: OWN } },
  });

  // Their public profile: read all bylines (to pick their own), edit only the profile
  // linked to their account — and never the approval/link fields themselves.
  await ensurePermission(id, 'authors', 'read', { fields: AUTHOR_PUBLIC_FIELDS });
  await ensurePermission(id, 'authors', 'update', {
    permissions: { user: OWN },
    fields: ['role_title', 'bio', 'statement', 'avatar', 'links', 'tools', 'featured_work'],
  });
  await ensurePermission(id, 'authors_specialties', 'read', {});
  await ensurePermission(id, 'specialties', 'read', {});

  // Uploads for drafts.
  await ensurePermission(id, 'directus_files', 'create', {});
  await ensurePermission(id, 'directus_files', 'read', {});
  await ensurePermission(id, 'directus_folders', 'read', {});
}

/* ── 6. Cleanup: duplicate unused "Guide Reader" role from the guides script ── */

async function removeDuplicateReaderRole() {
  const roles = await api('/roles?fields=id,name,users&limit=200');
  const dup = roles.find((r) => r.name === 'Guide Reader' && (r.users?.length ?? 0) === 0);
  const active = roles.find((r) => r.name === 'guide_reader');
  if (!dup || !active) {
    console.log('= no duplicate Guide Reader role to remove');
    return;
  }
  await api(`/roles/${dup.id}`, { method: 'DELETE' });
  console.log(`- removed empty duplicate role "Guide Reader" (${dup.id}); learners use "guide_reader"`);

  // Its identity policy carries no needed permissions once the role is gone.
  const policies = await api('/policies?fields=id,name,roles&limit=200');
  const orphan = policies.find((p) => p.name === 'Guide Reader' && (p.roles?.length ?? 0) === 0);
  if (orphan) {
    await api(`/policies/${orphan.id}`, { method: 'DELETE' });
    console.log(`- removed orphaned "Guide Reader" policy (${orphan.id})`);
  }
}

/* ── 7. Guide Server defense-in-depth: published-only content reads ─────
   The frontend only ever serves published guides (app-layer filters), but the
   service token could read drafts. Row rules are licensed on prod, so add the
   same constraint at the DB: guides by status, sections/items via traversal.
   guide_progress stays unrestricted — the server reads/writes rows for any
   verified learner (ownership is enforced by the verified-session bridge). */

async function hardenGuideServer() {
  const policies = await api('/policies?fields=id,name&limit=200');
  const server = policies.find((p) => p.name === 'Guide Server');
  if (!server) {
    console.log('! Guide Server policy not found — skipping guide hardening');
    return;
  }
  const PUBLISHED = { status: { _eq: 'published' } };
  await ensurePermission(server.id, 'guides', 'read', { permissions: PUBLISHED });
  await ensurePermission(server.id, 'guide_sections', 'read', {
    permissions: { guide: PUBLISHED },
  });
  await ensurePermission(server.id, 'guide_items', 'read', {
    permissions: { section: { guide: PUBLISHED } },
  });
}

/* ── run ───────────────────────────────────────────────────────────────── */

await ensureAuthorFields();
await backfillDreamTeam();
await linkKnownAuthors();
await backfillPendingAuthorProfiles();
await hardenPublicPolicy();
await ensureContributor();
await removeDuplicateReaderRole();
await hardenGuideServer();
console.log('\nAccount model ready: learners (guide_reader) · Dream Team (authors.dream_team) · blog authors (Contributor role) · profiles linked via authors.user.');
