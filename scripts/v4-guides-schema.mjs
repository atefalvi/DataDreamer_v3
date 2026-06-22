/**
 * V4-GUIDE-001 / V4-AUTH-001 — Field Guides schema, policies, and seed (08 §4, 09 §10).
 *
 * Creates the login-gated Field Guides data model in Directus:
 *   guides → guide_sections → guide_items   (the curated path)
 *   guides_topics / guides_specialties / guides_authors   (taxonomy + curators)
 *   guide_progress   (one row per user+guide, server-backed progress)
 * plus a low-permission `guide_reader` role/policy and one realistic seed guide.
 * Public guide access stays closed on Directus editions that cannot express field-
 * limited rules; the Astro server uses a server-only DIRECTUS_SERVICE_TOKEN and requests only
 * preview-safe fields for anonymous pages.
 *
 * Idempotent: skips anything that already exists.
 *
 *   DIRECTUS_URL=… DIRECTUS_ADMIN_TOKEN=…  node scripts/v4-guides-schema.mjs
 *
 * NOTE: registration, SMTP (password reset/verification), CORS/cookies for the
 * production subdomains, and optional Google OpenID are Directus *instance* settings —
 * see docs/agent-workspace/reports/field-guides-auth-plan.html. This script wires the
 * schema + permissions; those env/config steps are done in the Directus admin.
 */
const BASE = process.env.DIRECTUS_URL;
const TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || process.env.DIRECTUS_TOKEN;
if (!BASE || !TOKEN) throw new Error('DIRECTUS_URL and DIRECTUS_ADMIN_TOKEN are required.');

const auth = { Authorization: `Bearer ${TOKEN}` };
const jsonHeaders = { ...auth, 'Content-Type': 'application/json' };

async function api(path, options = {}) {
  // Always authenticate — GET lookups (policies/roles/items) carry no headers otherwise.
  const res = await fetch(`${BASE}${path}`, { ...options, headers: { ...auth, ...(options.headers ?? {}) } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${options.method ?? 'GET'} ${path} → ${res.status} ${JSON.stringify(json.errors ?? json)}`);
  return json.data;
}

const exists = async (path) => (await fetch(`${BASE}${path}`, { headers: auth })).ok;

// ── field helpers ──────────────────────────────────────────────────────────────
const pk = () => ({ field: 'id', type: 'uuid', meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] }, schema: { is_primary_key: true, length: 36 } });
const statusField = () => ({ field: 'status', type: 'string', meta: { interface: 'select-dropdown', display: 'labels', width: 'half', options: { choices: [{ text: 'Published', value: 'published' }, { text: 'Draft', value: 'draft' }, { text: 'Archived', value: 'archived' }] } }, schema: { default_value: 'draft' } });
const sortField = () => ({ field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true, width: 'half' }, schema: {} });
const str = (field, opts = {}) => ({ field, type: 'string', meta: { interface: 'input', ...opts.meta }, schema: { ...(opts.unique ? { is_unique: true } : {}), ...opts.schema } });
const text = (field, opts = {}) => ({ field, type: 'text', meta: { interface: opts.md ? 'input-rich-text-md' : 'input-multiline', ...opts.meta }, schema: {} });
const int = (field, opts = {}) => ({ field, type: 'integer', meta: { interface: 'input', width: 'half', ...opts.meta }, schema: {} });
const bool = (field) => ({ field, type: 'boolean', meta: { interface: 'boolean', width: 'half' }, schema: { default_value: false } });
const json = (field) => ({ field, type: 'json', meta: { interface: 'tags', special: ['cast-json'] }, schema: {} });
const fileField = (field) => ({ field, type: 'uuid', meta: { interface: 'file-image', width: 'half' }, schema: {} });
const m2oField = (field, template) => ({ field, type: 'uuid', meta: { interface: 'select-dropdown-m2o', options: { template }, width: 'half' }, schema: {} });
const difficulty = () => ({ field: 'difficulty', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: ['beginner', 'intermediate', 'advanced'].map((v) => ({ text: v, value: v })) } }, schema: { default_value: 'beginner' } });
const timestamp = (field) => ({ field, type: 'timestamp', meta: { interface: 'datetime', width: 'half', readonly: true }, schema: {} });

async function ensureCollection(name, meta, fields) {
  if (await exists(`/collections/${name}`)) {
    console.log(`= collection ${name}`);
    return;
  }
  await api('/collections', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ collection: name, meta, schema: {}, fields }) });
  console.log(`+ collection ${name}`);
}

const ALREADY = /already has an associated relationship|already exists|has to be unique|duplicate/i;

async function ensureRelation(collection, field, relatedCollection, meta = {}, schema = {}) {
  try {
    await api('/relations', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ collection, field, related_collection: relatedCollection, meta, schema }) });
    console.log(`+ relation ${collection}.${field} → ${relatedCollection}`);
  } catch (error) {
    if (ALREADY.test(error.message)) console.log(`= relation ${collection}.${field}`);
    else throw error;
  }
}

/** Alias field on the "one"/"parent" side of an o2m or m2m relation. */
async function ensureAlias(collection, field, special) {
  if (await exists(`/fields/${collection}/${field}`)) {
    console.log(`= alias ${collection}.${field}`);
    return;
  }
  try {
    await api(`/fields/${collection}`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ field, type: 'alias', meta: { special: [special], interface: special === 'o2m' ? 'list-o2m' : 'list-m2m' } }) });
    console.log(`+ alias ${collection}.${field} (${special})`);
  } catch (error) {
    if (ALREADY.test(error.message)) console.log(`= alias ${collection}.${field}`);
    else throw error;
  }
}

// ── 1. collections ───────────────────────────────────────────────────────────
async function buildCollections() {
  await ensureCollection('guides',
    { icon: 'explore', note: 'Field Guides — curated learning paths', sort_field: 'sort', archive_field: 'status', archive_value: 'archived', unarchive_value: 'draft' },
    [
      pk(), statusField(), sortField(),
      str('slug', { unique: true, meta: { required: true, note: 'lowercase-hyphenated, immutable after publish' } }),
      str('title', { meta: { required: true } }),
      text('summary', { meta: { required: true, note: 'Card + meta description (≤200)' } }),
      fileField('cover_image'),
      difficulty(),
      int('estimated_duration_minutes', { meta: { note: 'Curator-entered total (minutes)' } }),
      bool('featured'),
      text('why_this_path', { md: true, meta: { required: true, note: 'Why this guide exists' } }),
      text('expected_outcome', { md: true, meta: { note: "What you'll be able to do after" } }),
      str('recommended_audience', { meta: { note: 'Who this is for' } }),
      m2oField('author', '{{display_name}}'),
    ]);

  await ensureCollection('guide_sections',
    { icon: 'segment', note: 'Ordered groups inside a guide', sort_field: 'sort', hidden: true },
    [pk(), m2oField('guide', '{{title}}'), str('title', { meta: { required: true } }), text('description', { md: true }), sortField()]);

  await ensureCollection('guide_items',
    { icon: 'list', note: 'Curated resources inside a section', sort_field: 'sort', hidden: true },
    [
      pk(), m2oField('section', '{{title}}'),
      { field: 'type', type: 'string', meta: { interface: 'select-dropdown', required: true, options: { choices: ['youtube', 'external_url', 'pdf', 'uploaded_file', 'notebooklm', 'github_repo', 'code_sample', 'cheat_sheet', 'personal_note', 'exercise', 'docs_page'].map((v) => ({ text: v, value: v })) } }, schema: {} },
      str('title', { meta: { required: true } }),
      str('url', { meta: { note: 'For link-like types' } }),
      fileField('asset'),
      text('body', { md: true, meta: { note: 'Markdown for note/cheat-sheet/code/exercise' } }),
      text('description'),
      text('why_included', { md: true, meta: { note: 'Curator: why this item is on the path' } }),
      text('focus_on', { md: true, meta: { note: 'Curator: what to focus on / skip' } }),
      text('notes', { md: true, meta: { note: 'Curator: personal notes / gotchas' } }),
      int('estimated_time_minutes'),
      difficulty(),
      sortField(),
    ]);

  for (const [name, parent] of [['guides_topics', 'topics'], ['guides_specialties', 'specialties'], ['guides_authors', 'authors']]) {
    const fields = [pk(), m2oField('guides_id', '{{title}}'), m2oField(`${parent}_id`, '{{name}}')];
    if (name !== 'guides_topics') fields.push(sortField());
    await ensureCollection(name, { hidden: true, note: `Junction: guides ↔ ${parent}` }, fields);
  }

  await ensureCollection('guide_progress',
    { icon: 'check_circle', note: 'One row per learner+guide (server-backed progress)', hidden: true },
    [
      pk(),
      m2oField('user', '{{email}}'),
      m2oField('guide', '{{title}}'),
      json('completed_items'),
      m2oField('last_item', '{{title}}'),
      str('status', { meta: { interface: 'select-dropdown', width: 'half', options: { choices: ['not-started', 'in-progress', 'completed'].map((v) => ({ text: v, value: v })) } } }),
      int('percent'),
      timestamp('started_at'),
      timestamp('completed_at'),
    ]);
}

// ── 2. relations ───────────────────────────────────────────────────────────────
async function buildRelations() {
  await ensureRelation('guides', 'cover_image', 'directus_files');
  await ensureRelation('guides', 'author', 'authors');

  await ensureAlias('guides', 'sections', 'o2m');
  await ensureRelation('guide_sections', 'guide', 'guides', { one_field: 'sections', sort_field: 'sort' }, { on_delete: 'CASCADE' });

  await ensureAlias('guide_sections', 'items', 'o2m');
  await ensureRelation('guide_items', 'section', 'guide_sections', { one_field: 'items', sort_field: 'sort' }, { on_delete: 'CASCADE' });
  await ensureRelation('guide_items', 'asset', 'directus_files');

  // M2M: guides ↔ {topics, specialties, authors}
  for (const [junction, parent, alias] of [
    ['guides_topics', 'topics', 'topics'],
    ['guides_specialties', 'specialties', 'specialties'],
    ['guides_authors', 'authors', 'authors'],
  ]) {
    await ensureAlias('guides', alias, 'm2m');
    await ensureRelation(junction, 'guides_id', 'guides', { one_field: alias, junction_field: `${parent}_id`, sort_field: junction === 'guides_topics' ? null : 'sort' }, { on_delete: 'CASCADE' });
    await ensureRelation(junction, `${parent}_id`, parent, { junction_field: 'guides_id' }, { on_delete: 'CASCADE' });
  }

  await ensureRelation('guide_progress', 'user', 'directus_users');
  await ensureRelation('guide_progress', 'guide', 'guides', {}, { on_delete: 'CASCADE' });
  await ensureRelation('guide_progress', 'last_item', 'guide_items');
}

// ── 3. policies & permissions ────────────────────────────────────────────────
//
// IMPORTANT: this Directus edition restricts custom permission *rules* — both row
// filters (e.g. status=published, user=$CURRENT_USER) and field-level subsets raise
// `custom_permission_rules_enabled is a restricted resource`. Only all-or-nothing
// (`fields: ['*']`, no filter) is permitted. Never compensate by granting unrestricted
// Public read: that exposes gated item bodies through the Directus API. Public guide
// collections stay closed and Astro guide reads use a server-only DIRECTUS_SERVICE_TOKEN.
// The public-preview-vs-gated-reader distinction is enforced at the APP layer:
//   - the repository queries published guides only and requests preview fields for
//     anonymous visitors (lib/repositories/guides.ts);
//   - the page renders gated content only when locals.user is set;
//   - the progress endpoint always writes the session user's own id.
// On a Directus instance that supports custom rules, field-limited Public preview and
// user=$CURRENT_USER progress rules may replace the server-token fallback.

async function findPolicyId(name) {
  const policies = await api('/policies?fields=id,name&limit=200');
  return policies.find((p) => p.name === name || p.name === '$t:public_label')?.id;
}

async function ensurePermission(policy, collection, action, fields = ['*']) {
  const query = `/permissions?filter[policy][_eq]=${policy}&filter[collection][_eq]=${collection}&filter[action][_eq]=${action}&fields=id&limit=1`;
  const existing = await api(query).catch(() => []);
  const payload = { policy, collection, action, fields };
  if (existing.length) {
    await api(`/permissions/${existing[0].id}`, { method: 'PATCH', headers: jsonHeaders, body: JSON.stringify(payload) });
    console.log(`= permission ${collection}.${action} (${policy === publicPolicyId ? 'public' : 'reader'})`);
  } else {
    await api('/permissions', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(payload) });
    console.log(`+ permission ${collection}.${action}`);
  }
}

async function removePermission(policy, collection, action) {
  const query = `/permissions?filter[policy][_eq]=${policy}&filter[collection][_eq]=${collection}&filter[action][_eq]=${action}&fields=id&limit=100`;
  const existing = await api(query).catch(() => []);
  for (const permission of existing) {
    await api(`/permissions/${permission.id}`, { method: 'DELETE', headers: auth });
    console.log(`- permission ${collection}.${action}`);
  }
}

let publicPolicyId;
let readerPolicyId;
let serverPolicyId;

async function ensureGuideReaderRole() {
  const roles = await api('/roles?fields=id,name&limit=200');
  let role = roles.find((r) => r.name === 'Guide Reader');
  if (!role) {
    role = await api('/roles', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ name: 'Guide Reader', icon: 'school', description: 'Low-permission learner identity; Astro gates guide content and scopes progress.', admin_access: false, app_access: false }) });
    console.log('+ role Guide Reader');
  } else {
    console.log('= role Guide Reader');
  }

  const policies = await api('/policies?fields=id,name&limit=200');
  let policy = policies.find((p) => p.name === 'Guide Reader');
  if (!policy) {
    policy = await api('/policies', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ name: 'Guide Reader', icon: 'school', description: 'Guide reader access policy', admin_access: false, app_access: false }) });
    console.log('+ policy Guide Reader');
  } else {
    console.log('= policy Guide Reader');
  }
  readerPolicyId = policy.id;

  // Attach policy to the role (Directus 11 access junction).
  const access = await api(`/access?filter[role][_eq]=${role.id}&filter[policy][_eq]=${policy.id}&fields=id&limit=1`).catch(() => []);
  if (!access.length) {
    await api('/access', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ role: role.id, policy: policy.id }) }).catch((e) => console.log(`! access link: ${e.message}`));
  }
  return role.id;
}

async function ensureGuideServerRole() {
  const roles = await api('/roles?fields=id,name&limit=200');
  let role = roles.find((r) => r.name === 'Guide Server');
  if (!role) {
    role = await api('/roles', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ name: 'Guide Server', icon: 'dns', description: 'Non-admin Astro server access for guide previews, reader content, and scoped progress.', admin_access: false, app_access: false }) });
    console.log('+ role Guide Server');
  } else {
    console.log('= role Guide Server');
  }

  const policies = await api('/policies?fields=id,name&limit=200');
  let policy = policies.find((p) => p.name === 'Guide Server');
  if (!policy) {
    policy = await api('/policies', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ name: 'Guide Server', icon: 'dns', description: 'Server-only guide data access policy', admin_access: false, app_access: false }) });
    console.log('+ policy Guide Server');
  } else {
    console.log('= policy Guide Server');
  }
  serverPolicyId = policy.id;

  const access = await api(`/access?filter[role][_eq]=${role.id}&filter[policy][_eq]=${policy.id}&fields=id&limit=1`).catch(() => []);
  if (!access.length) {
    await api('/access', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ role: role.id, policy: policy.id }) }).catch((e) => console.log(`! access link: ${e.message}`));
  }
  return role.id;
}

const GUIDE_READ_COLLECTIONS = ['guides', 'guide_sections', 'guide_items', 'guides_topics', 'guides_specialties', 'guides_authors'];

async function buildPermissions() {
  publicPolicyId = await findPolicyId('Public');
  if (!publicPolicyId) throw new Error('Could not find the Public policy.');

  // Public remains closed. This is intentionally destructive for any old unrestricted
  // guide permissions created by earlier versions of this script.
  for (const collection of GUIDE_READ_COLLECTIONS) {
    await removePermission(publicPolicyId, collection, 'read');
  }

  // Browser learner sessions prove identity only. Remove older broad data permissions
  // so a learner cannot bypass the Astro gate by calling Directus directly.
  await ensureGuideReaderRole();
  for (const collection of GUIDE_READ_COLLECTIONS) {
    await removePermission(readerPolicyId, collection, 'read');
  }
  for (const action of ['read', 'create', 'update', 'delete']) {
    await removePermission(readerPolicyId, 'guide_progress', action);
  }

  // The non-admin server token is never sent to browsers. Astro filters published
  // guides/preview fields and scopes every progress query by the verified user id.
  await ensureGuideServerRole();
  for (const collection of [...GUIDE_READ_COLLECTIONS, 'authors', 'topics', 'specialties', 'directus_files']) {
    await ensurePermission(serverPolicyId, collection, 'read');
  }
  for (const action of ['read', 'create', 'update']) {
    await ensurePermission(serverPolicyId, 'guide_progress', action);
  }
}

// ── 4. seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  const have = await api('/items/guides?filter[slug][_eq]=learn-airflow-the-real-way&fields=id&limit=1').catch(() => []);
  if (have.length) {
    console.log('= seed guide (exists)');
    return;
  }
  const authors = await api('/items/authors?filter[slug][_eq]=atef-alvi&fields=id&limit=1').catch(() => []);
  const author = authors[0]?.id;

  const guide = await api('/items/guides', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({
    status: 'published', slug: 'learn-airflow-the-real-way', title: 'Learn Airflow the real way',
    summary: 'The exact path I followed to go from zero to running production DAGs — ordered, no fluff.',
    difficulty: 'beginner', estimated_duration_minutes: 360, featured: true, sort: 1, author,
    why_this_path: 'Most Airflow tutorials drown you in setup. This path skips that and gets you to a working DAG fast, then fills in scheduling and debugging once you have something to break.',
    expected_outcome: "You'll write, schedule, and debug your own DAGs and wire them to external systems.",
    recommended_audience: 'Engineers comfortable with Python who have never run a scheduler.',
  }) });

  const s1 = await api('/items/guide_sections', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ guide: guide.id, title: 'Get something running', description: "Don't read docs yet — get a DAG executing on your machine first.", sort: 1 }) });
  const s2 = await api('/items/guide_sections', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ guide: guide.id, title: 'Scheduling & debugging', sort: 2 }) });

  const items = [
    { section: s1.id, sort: 1, type: 'youtube', title: 'Airflow in 100 seconds', url: 'https://youtu.be/dQw4w9WgXcQ', description: 'A fast mental model before you install anything.', why_included: 'Sets the vocabulary (DAG, task, operator) so the next steps land.', focus_on: 'Just the DAG → task → operator relationship. Ignore the Kubernetes bits.', estimated_time_minutes: 5, difficulty: 'beginner' },
    { section: s1.id, sort: 2, type: 'github_repo', title: 'Starter docker-compose for local Airflow', url: 'https://github.com/example/airflow-quickstart', description: 'Clone, `docker compose up`, open localhost:8080.', why_included: 'Saves you the painful manual setup the official guide walks through.', focus_on: 'Just get the UI loading. Don\'t tweak config yet.', notes: 'On Apple Silicon set `platform: linux/amd64` or the scheduler crashes.', estimated_time_minutes: 20 },
    { section: s2.id, sort: 1, type: 'docs_page', title: 'Scheduling & timetables (official docs)', url: 'https://airflow.apache.org/docs/', description: 'The authoritative reference for cron vs timetables and catchup.', why_included: "Once you've seen a DAG run, this is the one docs page worth reading end to end.", focus_on: '`schedule`, `catchup`, and `start_date` interactions — that\'s where everyone gets burned.', estimated_time_minutes: 25, difficulty: 'intermediate' },
    { section: s2.id, sort: 2, type: 'personal_note', title: 'How I debug a stuck task', body: 'When a task is stuck in `queued`:\n\n1. Check the scheduler logs.\n2. Check pool/concurrency limits.\n\n:::tip\nMost "stuck" tasks are actually a pool/concurrency limit.\n:::', description: "My checklist when a DAG won't move.", why_included: 'The thing nobody writes down and everyone re-learns the hard way.', estimated_time_minutes: 10 },
  ];
  for (const item of items) await api('/items/guide_items', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(item) });
  console.log(`+ seed guide (2 sections, ${items.length} items)`);
}

// ── run ─────────────────────────────────────────────────────────────────────────
await buildCollections();
await buildRelations();
await buildPermissions();
await seed();
console.log('\nDone. Public and Guide Reader collection access are closed. Create a non-admin service user with the Guide Server role and static token, set it as frontend DIRECTUS_SERVICE_TOKEN, then configure registration (default role = Guide Reader), SMTP, CORS/cookies, and optional Google OpenID (see reports/field-guides-auth-plan.html).');
