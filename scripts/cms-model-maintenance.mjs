/**
 * Reconcile the production Directus relationship rules, SEO storage, and Specialty taxonomy.
 *
 * Dry-run is the default:
 *   node --env-file=.env.cms scripts/cms-model-maintenance.mjs
 *
 * Apply the reviewed changes:
 *   node --env-file=.env.cms scripts/cms-model-maintenance.mjs --apply
 *
 * Authentication accepts DIRECTUS_ADMIN_TOKEN or DIRECTUS_ADMIN_EMAIL +
 * DIRECTUS_ADMIN_PASSWORD. The older non-admin-prefixed names remain accepted for
 * local compatibility, but the account must be allowed to update schema relations.
 */
import { readFile } from 'node:fs/promises';

const apply = process.argv.includes('--apply');
const baseUrl = (process.env.DIRECTUS_URL ?? process.env.PUBLIC_DIRECTUS_URL ?? '').replace(/\/$/, '');
const staticToken = process.env.DIRECTUS_ADMIN_TOKEN ?? process.env.DIRECTUS_TOKEN;
const email = process.env.DIRECTUS_ADMIN_EMAIL ?? process.env.DIRECTUS_EMAIL;
const password = process.env.DIRECTUS_ADMIN_PASSWORD ?? process.env.DIRECTUS_PASSWORD;

if (!baseUrl) throw new Error('DIRECTUS_URL or PUBLIC_DIRECTUS_URL is required.');
if (!staticToken && (!email || !password)) {
  throw new Error(
    'DIRECTUS_ADMIN_TOKEN or DIRECTUS_ADMIN_EMAIL + DIRECTUS_ADMIN_PASSWORD is required.',
  );
}

const specialties = JSON.parse(
  await readFile(new URL('../backend/data/specialties.json', import.meta.url), 'utf8'),
);

const relationRules = [
  ['authors_specialties', 'authors_id', 'CASCADE', 'delete'],
  ['authors_specialties', 'specialties_id', 'CASCADE', 'delete'],
  ['posts_topics', 'posts_id', 'CASCADE', 'delete'],
  ['posts_topics', 'topics_id', 'CASCADE', 'delete'],
  ['projects_topics', 'projects_id', 'CASCADE', 'delete'],
  ['projects_topics', 'topics_id', 'CASCADE', 'delete'],
  ['guides_authors', 'guides_id', 'CASCADE', 'delete'],
  ['guides_authors', 'authors_id', 'CASCADE', 'delete'],
  ['guides_specialties', 'guides_id', 'CASCADE', 'delete'],
  ['guides_specialties', 'specialties_id', 'CASCADE', 'delete'],
  ['guides_topics', 'guides_id', 'CASCADE', 'delete'],
  ['guides_topics', 'topics_id', 'CASCADE', 'delete'],
];

const seoStorageFields = ['seo_title', 'seo_description'];
const seoStorageCollections = ['posts', 'projects', 'guides'];

async function login() {
  if (staticToken) return staticToken;
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, mode: 'json' }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.data?.access_token) {
    throw new Error(`Directus login failed (${response.status}).`);
  }
  return payload.data.access_token;
}

const token = await login();

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const payload = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.errors?.[0]?.message ?? `HTTP ${response.status}`;
    throw new Error(`${options.method ?? 'GET'} ${path}: ${message}`);
  }
  return payload.data;
}

function changedFields(current, expected) {
  return Object.fromEntries(
    Object.entries(expected).filter(([key, value]) => current?.[key] !== value),
  );
}

async function reconcileRelations() {
  const changes = [];
  for (const [collection, field, onDelete, deselectAction] of relationRules) {
    const relation = await request(`/relations/${collection}/${field}`);
    const schema = changedFields(relation.schema, { on_delete: onDelete });
    const meta = changedFields(relation.meta, { one_deselect_action: deselectAction });
    if (!Object.keys(schema).length && !Object.keys(meta).length) continue;

    changes.push({ collection, field, schema, meta });
    if (apply) {
      await request(`/relations/${collection}/${field}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...(Object.keys(schema).length ? { schema } : {}),
          ...(Object.keys(meta).length ? { meta } : {}),
        }),
      });
    }
  }
  return changes;
}

async function reconcileSeoStorage() {
  const changes = [];
  for (const collection of seoStorageCollections) {
    for (const field of seoStorageFields) {
      const current = await request(`/fields/${collection}/${field}`);
      const type = current.type === 'text' ? {} : { type: 'text' };
      const schema = changedFields(current.schema, { data_type: 'text', max_length: null });
      if (!Object.keys(type).length && !Object.keys(schema).length) continue;

      changes.push({ collection, field, type, schema });
      if (apply) {
        await request(`/fields/${collection}/${field}`, {
          method: 'PATCH',
          body: JSON.stringify({
            ...type,
            ...(Object.keys(schema).length ? { schema } : {}),
          }),
        });
      }
    }
  }
  return changes;
}

async function reconcileSpecialties() {
  const current = await request('/items/specialties?fields=id,status,name,slug,description,color_key,sort&limit=-1');
  const bySlug = new Map(current.map((item) => [item.slug, item]));
  const byName = new Map(current.map((item) => [item.name.toLowerCase(), item]));
  const changes = [];

  for (const specialty of specialties) {
    const existing = bySlug.get(specialty.slug);
    const desired = { status: 'published', ...specialty };
    if (!existing) {
      const nameCollision = byName.get(specialty.name.toLowerCase());
      if (nameCollision) {
        throw new Error(
          `Specialty name collision: "${specialty.name}" already uses slug "${nameCollision.slug}".`,
        );
      }
      changes.push({ action: 'create', slug: specialty.slug, fields: desired });
      if (apply) await request('/items/specialties', { method: 'POST', body: JSON.stringify(desired) });
      continue;
    }

    const fields = changedFields(existing, desired);
    if (!Object.keys(fields).length) continue;
    changes.push({ action: 'update', slug: specialty.slug, fields });
    if (apply) {
      await request(`/items/specialties/${existing.id}`, {
        method: 'PATCH',
        body: JSON.stringify(fields),
      });
    }
  }
  return changes;
}

const relationChanges = await reconcileRelations();
const seoStorageChanges = await reconcileSeoStorage();
const specialtyChanges = await reconcileSpecialties();

console.log(`${apply ? 'Applied' : 'Planned'} relationship changes: ${relationChanges.length}`);
for (const change of relationChanges) {
  console.log(`  ${change.collection}.${change.field}`, { ...change.schema, ...change.meta });
}
console.log(`${apply ? 'Applied' : 'Planned'} SEO storage changes: ${seoStorageChanges.length}`);
for (const change of seoStorageChanges) {
  console.log(`  ${change.collection}.${change.field}`, { ...change.type, ...change.schema });
}
console.log(`${apply ? 'Applied' : 'Planned'} Specialty changes: ${specialtyChanges.length}`);
for (const change of specialtyChanges) {
  console.log(`  ${change.action} ${change.slug}`);
}

if (!apply) console.log('Dry run only. Re-run with --apply after reviewing this plan.');
