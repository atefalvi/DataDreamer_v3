import { writeFile } from 'node:fs/promises';
import { createDirectus, rest, authentication } from '../frontend/node_modules/@directus/sdk/dist/index.js';
import YAML from '../frontend/node_modules/yaml/dist/index.js';
import {
  createField,
  createRelation,
  readFields,
  readItems,
  schemaSnapshot,
  updateField,
  updateItem,
  updateRelation,
} from '../frontend/node_modules/@directus/sdk/dist/index.js';

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
const DIRECTUS_ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const DIRECTUS_ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;

if (!DIRECTUS_URL || (!DIRECTUS_TOKEN && (!DIRECTUS_ADMIN_EMAIL || !DIRECTUS_ADMIN_PASSWORD))) {
  throw new Error('DIRECTUS_URL and either DIRECTUS_TOKEN or DIRECTUS_ADMIN_EMAIL/DIRECTUS_ADMIN_PASSWORD are required.');
}

const directus = createDirectus(DIRECTUS_URL).with(authentication()).with(rest());

const fields = [
  relationField('author', 10, {
    required: true,
    note: 'Required author profile for v4 post pages and cards.',
  }),
  fileField('cover_image', 11, 'Optional post cover image; used for cards, article hero, and OG transforms.'),
  booleanField('featured', 12, 'Marks one or more posts as eligible for featured blog/home placements.'),
];

const relations = [
  {
    collection: 'posts',
    field: 'author',
    related_collection: 'authors',
    meta: {
      many_collection: 'posts',
      many_field: 'author',
      one_collection: 'authors',
      one_field: 'posts',
      one_deselect_action: 'nullify',
    },
    schema: { on_delete: 'SET NULL' },
  },
  {
    collection: 'posts',
    field: 'cover_image',
    related_collection: 'directus_files',
    meta: {
      many_collection: 'posts',
      many_field: 'cover_image',
      one_collection: 'directus_files',
      one_deselect_action: 'nullify',
    },
    schema: { on_delete: 'SET NULL' },
  },
];

function relationField(field, sort, options = {}) {
  return {
    field,
    type: 'uuid',
    meta: {
      interface: 'select-dropdown-m2o',
      note: options.note ?? null,
      required: options.required ?? false,
      sort,
      width: 'full',
    },
    schema: {
      is_nullable: true,
    },
  };
}

function fileField(field, sort, note) {
  return {
    field,
    type: 'uuid',
    meta: {
      display: 'image',
      interface: 'file-image',
      note,
      sort,
      width: 'full',
    },
    schema: {
      is_nullable: true,
    },
  };
}

function booleanField(field, sort, note) {
  return {
    field,
    type: 'boolean',
    meta: {
      interface: 'boolean',
      note,
      sort,
      width: 'half',
    },
    schema: {
      default_value: false,
      is_nullable: false,
    },
  };
}

async function getFieldNames() {
  const allFields = await directus.request(readFields({ limit: -1 }));
  return new Set(allFields.map((field) => `${field.collection}.${field.field}`));
}

async function getRelationNames() {
  const allRelations = await directus.request(createReadRelationsRequest());
  return new Set(allRelations.map((relation) => `${relation.collection}.${relation.field}`));
}

function createReadRelationsRequest() {
  return () => ({ method: 'GET', path: '/relations', params: { limit: -1 } });
}

async function ensureField(collection, field, existingFields) {
  const key = `${collection}.${field.field}`;
  if (existingFields.has(key)) {
    await directus.request(updateField(collection, field.field, {
      meta: field.meta,
      schema: field.schema,
    }));
    return `updated field ${key}`;
  }

  await directus.request(createField(collection, field));
  existingFields.add(key);
  return `created field ${key}`;
}

async function ensureRelation(relation, existingRelations) {
  const key = `${relation.collection}.${relation.field}`;
  if (existingRelations.has(key)) {
    await directus.request(updateRelation(relation.collection, relation.field, {
      meta: relation.meta,
      schema: relation.schema,
    }));
    return `updated relation ${key}`;
  }

  await directus.request(createRelation(relation));
  existingRelations.add(key);
  return `created relation ${key}`;
}

async function getPrimaryAuthorId() {
  const authors = await directus.request(readItems('authors', {
    filter: { slug: { _eq: 'atef-alvi' } },
    fields: ['id', 'slug'],
    limit: 1,
  }));

  if (authors.length === 0) {
    throw new Error('Could not find seeded author authors.atef-alvi.');
  }

  return authors[0].id;
}

async function mapMissingPostAuthors(authorId) {
  const posts = await directus.request(readItems('posts', {
    fields: ['id', 'slug', 'status', 'author'],
    limit: -1,
  }));

  const missing = posts.filter((post) => !post.author);
  for (const post of missing) {
    await directus.request(updateItem('posts', post.id, { author: authorId }));
  }

  return {
    total: posts.length,
    mapped: missing.length,
  };
}

async function assertPublishedPostsHaveAuthor() {
  const posts = await directus.request(readItems('posts', {
    filter: { status: { _eq: 'published' } },
    fields: ['id', 'slug', 'author'],
    limit: -1,
  }));

  const missing = posts.filter((post) => !post.author);
  if (missing.length > 0) {
    throw new Error(`Published posts missing author: ${missing.map((post) => post.slug ?? post.id).join(', ')}`);
  }

  return posts.length;
}

async function writeSnapshot(path) {
  const snapshot = await directus.request(schemaSnapshot());
  await writeFile(path, YAML.stringify(snapshot), 'utf8');
}

if (DIRECTUS_TOKEN) {
  await directus.setToken(DIRECTUS_TOKEN);
} else {
  await directus.login(DIRECTUS_ADMIN_EMAIL, DIRECTUS_ADMIN_PASSWORD);
}

const actions = [];

await writeSnapshot('backend/v4-cms-002-before.snapshot.yaml');
actions.push('wrote backend/v4-cms-002-before.snapshot.yaml');

const existingFields = await getFieldNames();
const existingRelations = await getRelationNames();

for (const field of fields) {
  actions.push(await ensureField('posts', field, existingFields));
}

for (const relation of relations) {
  actions.push(await ensureRelation(relation, existingRelations));
}

const primaryAuthorId = await getPrimaryAuthorId();
const mapping = await mapMissingPostAuthors(primaryAuthorId);
actions.push(`mapped ${mapping.mapped} of ${mapping.total} posts to authors.atef-alvi`);

const publishedCount = await assertPublishedPostsHaveAuthor();
actions.push(`verified ${publishedCount} published posts have an author`);

await writeSnapshot('backend/snapshot.yaml');
actions.push('wrote backend/snapshot.yaml');

console.log(JSON.stringify({ ok: true, actions }, null, 2));
process.exit(0);
