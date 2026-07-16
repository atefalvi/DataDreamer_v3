import { writeFile } from 'node:fs/promises';
import { createDirectus, rest, authentication } from '../frontend/node_modules/@directus/sdk/dist/index.js';
import YAML from '../frontend/node_modules/yaml/dist/index.js';
import {
  createCollection,
  createField,
  createItem,
  createPermission,
  createRelation,
  deleteCollection,
  deleteField,
  deletePermission,
  deleteItem,
  deleteRelation,
  readCollections,
  readFields,
  readItems,
  readPermissions,
  readPolicies,
  schemaSnapshot,
  updateCollection,
  updatePermission,
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

const statusChoices = [
  { text: 'Draft', value: 'draft' },
  { text: 'Published', value: 'published' },
  { text: 'Archived', value: 'archived' },
];

const specialties = [
  ['Data Engineering', 'data-engineering', 'viz-1', 1, 'Pipelines, orchestration, storage, and the systems that move data.'],
  ['Analytics', 'analytics', 'viz-2', 2, 'Metrics, modeling, and decision support.'],
  ['Machine Learning', 'machine-learning', 'viz-3', 3, 'Training, evaluation, and deployment of learned systems.'],
  ['AI & Agents', 'ai-agents', 'viz-4', 4, 'LLM systems, agentic workflows, and applied AI.'],
  ['Automation', 'automation', 'viz-5', 5, 'Workflow automation and developer tooling.'],
  ['Visualization', 'visualization', 'viz-6', 6, 'Charts, dashboards, and visual communication.'],
].map(([name, slug, color_key, sort, description]) => ({ status: 'published', name, slug, color_key, sort, description }));

const topics = [
  ['Machine learning', 'machine-learning', 'Training runs, fine-tuning, evals.'],
  ['Devlog', 'devlog', 'Build notes and progress updates.'],
  ['Infrastructure', 'infrastructure', 'Docker, deployment, CI/CD, homelab.'],
  ['Data', 'data', 'Datasets, scraping, cleaning.'],
  ['Research', 'research', 'Papers and reading notes.'],
  ['Tools', 'tools', 'Evaluations and benchmarks.'],
].map(([name, slug, description]) => ({ status: 'published', name, slug, description }));

const primaryAuthor = {
  status: 'published',
  slug: 'atef-alvi',
  display_name: 'Atef Alvi',
  role_title: 'Data & Analytics Engineer',
  bio: 'Atef builds analytics platforms, practical AI systems, and production-grade data workflows for Data Dreamer.',
  statement: 'The data is the model.',
  links: [
    { label: 'GitHub', url: 'https://github.com/atefalvi' },
  ],
  tools: ['Python', 'Postgres', 'Airflow', 'dbt', 'Astro'],
  featured_work: [],
  sort: 1,
};

const collectionSpecs = [
  { collection: 'posts', icon: 'article', note: 'v4 blog posts and long-form writing.', display_template: '{{title}}' },
  { collection: 'authors', icon: 'groups', note: 'v4 Dream Team author profiles. Avatar uploads should be square and at least 512px.', display_template: '{{display_name}}' },
  { collection: 'specialties', icon: 'hub', note: 'v4 author specialty taxonomy.', display_template: '{{name}}' },
  { collection: 'topics', icon: 'sell', note: 'v4 shared taxonomy for posts and courses.', display_template: '{{name}}' },
  { collection: 'authors_specialties', icon: 'join_inner', note: 'Junction: authors to specialties. Sort controls primary specialty.', display_template: '{{authors_id.display_name}} → {{specialties_id.name}}' },
  { collection: 'posts_topics', icon: 'join_inner', note: 'Junction: posts to topics.', display_template: '{{posts_id.title}} → {{topics_id.name}}' },
];

const fields = {
  posts: [
    statusField(2),
    stringField('title', 3, { required: true, maxLength: 120 }),
    stringField('slug', 4, { required: true, unique: true, maxLength: 60, note: 'Unique URL slug: lowercase words separated by hyphens.' }),
    textField('excerpt', 5, { interfaceName: 'input-multiline', note: 'Short summary. Keep at or below 200 characters.' }),
    textField('content', 6, { interfaceName: 'input-rich-text-html' }),
    timestampField('published_at', 7),
    integerField('post_number', 8),
    stringField('series_label', 9, { maxLength: 120 }),
  ],
  authors: [
    statusField(2),
    stringField('slug', 3, { required: true, unique: true, maxLength: 255, note: 'Unique URL slug, e.g. firstname-lastname.' }),
    stringField('display_name', 4, { required: true, maxLength: 80 }),
    stringField('role_title', 5, { required: true, maxLength: 80 }),
    textField('bio', 6, { required: true, interfaceName: 'input-rich-text-md' }),
    stringField('statement', 7, { maxLength: 200 }),
    fileField('avatar', 8, 'Square portrait; use at least 512px.'),
    jsonField('links', 9, 'Array of {label, url}; validated in the repository layer.'),
    jsonField('tools', 10, 'Array of tool names; validated in the repository layer.', 'tags'),
    jsonField('featured_work', 11, 'Max two {title, url, description?} entries; validated in the repository layer.'),
    integerField('sort', 12),
  ],
  specialties: [
    statusField(2),
    stringField('name', 3, { required: true, unique: true, maxLength: 40 }),
    stringField('slug', 4, { required: true, unique: true, maxLength: 255 }),
    stringField('description', 5, { maxLength: 200 }),
    stringField('color_key', 6, {
      required: true,
      maxLength: 16,
      interfaceName: 'select-dropdown',
      options: {
        choices: ['viz-1', 'viz-2', 'viz-3', 'viz-4', 'viz-5', 'viz-6'].map((value) => ({ text: value, value })),
      },
    }),
    integerField('sort', 7),
  ],
  topics: [
    statusField(2),
    stringField('name', 3, { required: true, unique: true, maxLength: 40 }),
    stringField('slug', 4, { required: true, unique: true, maxLength: 255 }),
    stringField('description', 5, { maxLength: 200 }),
  ],
  authors_specialties: [
    uuidField('authors_id', 2, true),
    uuidField('specialties_id', 3, true),
    integerField('sort', 4),
  ],
  posts_topics: [
    uuidField('posts_id', 2, true),
    uuidField('topics_id', 3, true),
  ],
};

const relations = [
  {
    collection: 'authors',
    field: 'avatar',
    related_collection: 'directus_files',
    meta: {
      many_collection: 'authors',
      many_field: 'avatar',
      one_collection: 'directus_files',
      one_deselect_action: 'nullify',
    },
    schema: { on_delete: 'SET NULL' },
  },
  {
    collection: 'authors_specialties',
    field: 'authors_id',
    related_collection: 'authors',
    meta: {
      many_collection: 'authors_specialties',
      many_field: 'authors_id',
      one_collection: 'authors',
      one_field: 'specialties',
      one_deselect_action: 'delete',
      junction_field: 'specialties_id',
      sort_field: 'sort',
    },
    schema: { on_delete: 'CASCADE' },
  },
  {
    collection: 'authors_specialties',
    field: 'specialties_id',
    related_collection: 'specialties',
    meta: {
      many_collection: 'authors_specialties',
      many_field: 'specialties_id',
      one_collection: 'specialties',
      one_deselect_action: 'delete',
      junction_field: 'authors_id',
    },
    schema: { on_delete: 'CASCADE' },
  },
  {
    collection: 'posts_topics',
    field: 'posts_id',
    related_collection: 'posts',
    meta: {
      many_collection: 'posts_topics',
      many_field: 'posts_id',
      one_collection: 'posts',
      one_field: 'topics',
      one_deselect_action: 'delete',
      junction_field: 'topics_id',
    },
    schema: { on_delete: 'CASCADE' },
  },
  {
    collection: 'posts_topics',
    field: 'topics_id',
    related_collection: 'topics',
    meta: {
      many_collection: 'posts_topics',
      many_field: 'topics_id',
      one_collection: 'topics',
      one_deselect_action: 'delete',
      junction_field: 'posts_id',
    },
    schema: { on_delete: 'CASCADE' },
  },
];

function primaryKeyField(type = 'uuid') {
  if (type === 'integer') {
    return {
      field: 'id',
      type: 'integer',
      meta: {
        hidden: true,
        interface: 'numeric',
        readonly: true,
      },
      schema: {
        has_auto_increment: true,
        is_primary_key: true,
        is_nullable: false,
      },
    };
  }

  return {
    field: 'id',
    type: 'uuid',
    meta: {
      hidden: true,
      interface: 'input',
      readonly: true,
      special: ['uuid'],
    },
    schema: {
      is_primary_key: true,
      is_nullable: false,
    },
  };
}

function statusField(sort) {
  return stringField('status', sort, {
    required: true,
    maxLength: 255,
    defaultValue: 'draft',
    interfaceName: 'select-dropdown',
    options: { choices: statusChoices },
  });
}

function stringField(field, sort, options = {}) {
  return {
    field,
    type: 'string',
    meta: {
      interface: options.interfaceName ?? 'input',
      note: options.note ?? null,
      options: options.options ?? null,
      required: options.required ?? false,
      sort,
      width: 'full',
    },
    schema: {
      default_value: options.defaultValue ?? null,
      is_nullable: !(options.required ?? false),
      is_unique: options.unique ?? false,
      max_length: options.maxLength ?? 255,
    },
  };
}

function textField(field, sort, options = {}) {
  return {
    field,
    type: 'text',
    meta: {
      interface: options.interfaceName ?? 'input-multiline',
      note: options.note ?? null,
      required: options.required ?? false,
      sort,
      width: 'full',
    },
    schema: {
      is_nullable: !(options.required ?? false),
    },
  };
}

function integerField(field, sort) {
  return {
    field,
    type: 'integer',
    meta: {
      interface: 'input',
      sort,
      width: 'half',
    },
    schema: {
      is_nullable: true,
    },
  };
}

function timestampField(field, sort) {
  return {
    field,
    type: 'timestamp',
    meta: {
      interface: 'datetime',
      sort,
      width: 'half',
    },
    schema: {
      is_nullable: true,
    },
  };
}

function uuidField(field, sort, required = false) {
  return {
    field,
    type: 'uuid',
    meta: {
      interface: 'select-dropdown-m2o',
      required,
      sort,
      width: 'full',
    },
    schema: {
      is_nullable: !required,
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

function jsonField(field, sort, note, interfaceName = 'list') {
  return {
    field,
    type: 'json',
    meta: {
      interface: interfaceName,
      note,
      sort,
      special: ['cast-json'],
      width: 'full',
    },
    schema: {
      is_nullable: true,
    },
  };
}

async function getCollectionNames() {
  return new Set((await directus.request(readCollections())).map((collection) => collection.collection));
}

async function getFieldNames() {
  const allFields = await directus.request(readFields({ limit: -1 }));
  return new Set(allFields.map((field) => `${field.collection}.${field.field}`));
}

async function getFieldMap() {
  const allFields = await directus.request(readFields({ limit: -1 }));
  return new Map(allFields.map((field) => [`${field.collection}.${field.field}`, field]));
}

async function getRelationNames() {
  const allRelations = await directus.request(createReadRelationsRequest());
  return new Set(allRelations.map((relation) => `${relation.collection}.${relation.field}`));
}

function createReadRelationsRequest() {
  return () => ({ method: 'GET', path: '/relations', params: { limit: -1 } });
}

async function ensureCollection(spec, existingCollections) {
  const meta = {
    collection: spec.collection,
    icon: spec.icon,
    note: spec.note,
    display_template: spec.display_template,
    hidden: false,
    singleton: false,
    accountability: 'all',
    sort_field: null,
  };

  if (existingCollections.has(spec.collection)) {
    await directus.request(updateCollection(spec.collection, { meta }));
    return `updated collection ${spec.collection}`;
  }

  await directus.request(createCollection({
    collection: spec.collection,
    meta,
    schema: {
      name: spec.collection,
    },
    fields: [primaryKeyField(spec.primaryKey)],
  }));

  existingCollections.add(spec.collection);
  return `created collection ${spec.collection}`;
}

async function ensureField(collection, field, existingFields) {
  const key = `${collection}.${field.field}`;
  if (existingFields.has(key)) return `exists field ${key}`;

  await directus.request(createField(collection, field));
  existingFields.add(key);
  return `created field ${key}`;
}

async function ensureAliasField(collection, field, existingFields) {
  const key = `${collection}.${field}`;
  if (existingFields.has(key)) return `exists field ${key}`;

  await directus.request(createField(collection, {
    field,
    type: 'alias',
    meta: {
      interface: 'list-m2m',
      special: ['m2m'],
      width: 'full',
    },
    schema: null,
  }));

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

async function removeLegacyLogsIfPresent(existingCollections, existingFields, existingRelations) {
  const actions = [];

  if (existingRelations.has('posts_topics.logs_id')) {
    await directus.request(deleteRelation('posts_topics', 'logs_id'));
    existingRelations.delete('posts_topics.logs_id');
    actions.push('deleted legacy relation posts_topics.logs_id');
  }

  if (existingFields.has('posts_topics.logs_id')) {
    await directus.request(deleteField('posts_topics', 'logs_id'));
    existingFields.delete('posts_topics.logs_id');
    actions.push('deleted legacy field posts_topics.logs_id');
  }

  if (existingCollections.has('logs')) {
    const permissions = await directus.request(readPermissions({
      filter: { collection: { _eq: 'logs' } },
      fields: ['id'],
      limit: -1,
    }));
    for (const permission of permissions) {
      await directus.request(deletePermission(permission.id));
    }
    if (permissions.length > 0) {
      actions.push(`deleted ${permissions.length} legacy logs permissions`);
    }

    await directus.request(deleteCollection('logs'));
    existingCollections.delete('logs');
    actions.push('deleted legacy collection logs');
  }

  return actions.length > 0 ? actions : ['no legacy logs cleanup needed'];
}

async function removeUncleanPostsShapeIfPresent(existingCollections, existingFields, existingRelations, fieldMap) {
  const actions = [];

  if (existingRelations.has('posts_topics.posts_id') && fieldMap.get('posts_topics.posts_id')?.type !== 'uuid') {
    await directus.request(deleteRelation('posts_topics', 'posts_id'));
    existingRelations.delete('posts_topics.posts_id');
    actions.push('deleted non-uuid relation posts_topics.posts_id');
  }

  if (existingFields.has('posts_topics.posts_id') && fieldMap.get('posts_topics.posts_id')?.type !== 'uuid') {
    await directus.request(deleteField('posts_topics', 'posts_id'));
    existingFields.delete('posts_topics.posts_id');
    fieldMap.delete('posts_topics.posts_id');
    actions.push('deleted non-uuid field posts_topics.posts_id');
  }

  if (!existingCollections.has('posts')) {
    return actions.length > 0 ? actions : ['no unclean posts shape cleanup needed'];
  }

  const legacyPostFields = ['posts.tag', 'posts.category', 'posts.log_number'].filter((key) => existingFields.has(key));
  const idType = fieldMap.get('posts.id')?.type;
  if (idType === 'uuid' && legacyPostFields.length === 0) {
    return actions.length > 0 ? actions : ['no unclean posts shape cleanup needed'];
  }

  const rows = await directus.request(readItems('posts', { fields: ['id'], limit: 1 }));
  if (rows.length > 0) {
    throw new Error('posts already has rows; refusing to delete and recreate the collection for clean greenfield schema.');
  }

  if (existingRelations.has('posts_topics.posts_id')) {
    await directus.request(deleteRelation('posts_topics', 'posts_id'));
    existingRelations.delete('posts_topics.posts_id');
    actions.push('deleted relation posts_topics.posts_id before posts reset');
  }

  if (existingFields.has('posts_topics.posts_id')) {
    await directus.request(deleteField('posts_topics', 'posts_id'));
    existingFields.delete('posts_topics.posts_id');
    fieldMap.delete('posts_topics.posts_id');
    actions.push('deleted field posts_topics.posts_id before posts reset');
  }

  await directus.request(deleteCollection('posts'));
  existingCollections.delete('posts');
  for (const key of [...existingFields].filter((field) => field.startsWith('posts.'))) {
    existingFields.delete(key);
    fieldMap.delete(key);
  }
  actions.push(`deleted unclean posts collection (${idType ?? 'missing'} id; legacy fields: ${legacyPostFields.join(', ') || 'none'})`);

  return actions;
}

async function ensureItem(collection, uniqueField, item) {
  const existing = await directus.request(readItems(collection, {
    filter: { [uniqueField]: { _eq: item[uniqueField] } },
    fields: ['id', uniqueField],
    limit: 1,
  }));

  if (existing.length > 0) return `exists item ${collection}.${item[uniqueField]}`;

  await directus.request(createItem(collection, item));
  return `created item ${collection}.${item[uniqueField]}`;
}

async function deleteItemBySlug(collection, slug) {
  const existing = await directus.request(readItems(collection, {
    filter: { slug: { _eq: slug } },
    fields: ['id', 'slug'],
    limit: 1,
  }));

  if (existing.length === 0) return `missing item ${collection}.${slug}`;

  await directus.request(deleteItem(collection, existing[0].id));
  return `deleted item ${collection}.${slug}`;
}

async function ensurePermission(publicPolicyId, collection, filter) {
  const existing = await directus.request(readPermissions({
    filter: {
      policy: { _eq: publicPolicyId },
      collection: { _eq: collection },
      action: { _eq: 'read' },
    },
    fields: ['id', 'collection', 'action'],
    limit: 1,
  }));

  const payload = {
    policy: publicPolicyId,
    collection,
    action: 'read',
    permissions: filter,
    validation: null,
    presets: null,
    fields: ['*'],
  };

  if (existing.length > 0) {
    await directus.request(updatePermission(existing[0].id, payload));
    return `updated public read permission ${collection}`;
  }

  await directus.request(createPermission(payload));
  return `created public read permission ${collection}`;
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
const blocked = [];

async function runStep(label, fn, { required = true } = {}) {
  try {
    actions.push(await fn());
  } catch (error) {
    const message = error.errors?.[0]?.message ?? error.message;
    const entry = `${label}: ${message}`;
    if (required) throw new Error(entry);
    blocked.push(entry);
    actions.push(`blocked ${label}`);
  }
}

await writeSnapshot('backend/v4-cms-001-before.snapshot.yaml');
actions.push('wrote backend/v4-cms-001-before.snapshot.yaml');

const collections = await getCollectionNames();
const fieldMap = await getFieldMap();
const existingFields = new Set(fieldMap.keys());
const existingRelations = await getRelationNames();
actions.push(...await removeLegacyLogsIfPresent(collections, existingFields, existingRelations));
actions.push(...await removeUncleanPostsShapeIfPresent(collections, existingFields, existingRelations, fieldMap));

for (const spec of collectionSpecs) {
  actions.push(await ensureCollection(spec, collections));
}

for (const [collection, collectionFields] of Object.entries(fields)) {
  for (const field of collectionFields) {
    actions.push(await ensureField(collection, field, existingFields));
  }
}
actions.push(await ensureAliasField('authors', 'specialties', existingFields));
actions.push(await ensureAliasField('posts', 'topics', existingFields));

for (const relation of relations) {
  await runStep(
    `create relation ${relation.collection}.${relation.field}`,
    () => ensureRelation(relation, existingRelations),
  );
}

for (const specialty of specialties) {
  actions.push(await ensureItem('specialties', 'slug', specialty));
}

for (const topic of topics) {
  actions.push(await ensureItem('topics', 'slug', topic));
}

actions.push(await ensureItem('authors', 'slug', primaryAuthor));
actions.push(await deleteItemBySlug('authors', 'agent-staging'));

const publicPolicy = (await directus.request(readPolicies({ fields: ['id', 'name'] })))
  .find((policy) => policy.name === '$t:public_label' || policy.name === 'Public');

if (!publicPolicy) {
  throw new Error('Could not find the Public policy.');
}

for (const collection of ['posts', 'authors', 'specialties', 'topics']) {
  actions.push(await ensurePermission(publicPolicy.id, collection, { status: { _eq: 'published' } }));
}

for (const collection of ['authors_specialties', 'posts_topics', 'directus_files']) {
  actions.push(await ensurePermission(publicPolicy.id, collection, {}));
}

await writeSnapshot('backend/snapshot.yaml');
actions.push('wrote backend/snapshot.yaml');

console.log(JSON.stringify({ ok: blocked.length === 0, actions, blocked }, null, 2));
if (blocked.length > 0) {
  process.exit(2);
}
process.exit(0);
