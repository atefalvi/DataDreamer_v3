/**
 * Projects → Directus migration. Creates a `projects` collection (mirroring `posts`),
 * uploads the repo cover SVGs as Directus files, and seeds the three case studies from
 * the existing `src/content/projects/*.md` bodies. Idempotent: skips the collection if it
 * exists and skips projects whose slug is already present.
 *
 *   DIRECTUS_URL=… DIRECTUS_ADMIN_TOKEN=…  node scripts/v4-projects-to-directus.mjs
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.DIRECTUS_URL;
const TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || process.env.DIRECTUS_TOKEN;
if (!BASE || !TOKEN) throw new Error('DIRECTUS_URL and DIRECTUS_ADMIN_TOKEN are required.');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'frontend');
const auth = { Authorization: `Bearer ${TOKEN}` };
const jsonHeaders = { ...auth, 'Content-Type': 'application/json' };

async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${options.method ?? 'GET'} ${path} → ${res.status} ${JSON.stringify(json.errors ?? json)}`);
  return json.data;
}

const ATEF = '5958b616-1067-4fd8-bc2b-f8fbd2e073d9'; // authors.id for atef-alvi

/** Body comes from the repo markdown (everything after the frontmatter). */
const PROJECTS = [
  {
    file: 'tableau-waterfall-chart.md',
    cover: 'tableau-waterfall-chart/cover.svg',
    data: {
      status: 'published', sort: 1, slug: 'tableau-waterfall-chart',
      title: 'Waterfall charts, the Gantt method',
      summary: 'A clean, label-friendly waterfall built from a Gantt mark — no table-calc gymnastics, no stacked-bar hacks.',
      year: 2025, role: 'Design & build', author: ATEF,
      cover_alt: 'Waterfall chart showing quarterly revenue bridges in the Data Dreamer palette',
      tags: ['Tableau', 'SQL'], featured: true,
      links: [{ label: 'Tableau Public', url: 'https://public.tableau.com/' }],
    },
  },
  {
    file: 'airflow-retry-framework.md',
    cover: 'airflow-retry-framework/cover.svg',
    data: {
      status: 'published', sort: 2, slug: 'airflow-retry-framework',
      title: 'A retry framework that survives production',
      summary: 'Exponential backoff is not a strategy. A small, declarative retry layer for Airflow DAGs that distinguishes transient from terminal failures.',
      year: 2025, role: 'Design & build', author: ATEF,
      cover_alt: 'A directed task graph with one failing branch highlighted in the accent color',
      tags: ['Airflow', 'Python', 'Postgres'], featured: true,
      links: [{ label: 'Write-up', url: 'https://data-dreamer.net/blog' }],
    },
  },
  {
    file: 'signal-dashboard.md',
    cover: 'signal-dashboard/cover.svg',
    data: {
      status: 'published', sort: 3, slug: 'signal-dashboard',
      title: 'Signal, made legible',
      summary: 'An operations dashboard that resists the urge to show everything — one primary signal, honest context, and drill-downs only when asked.',
      year: 2024, role: 'Design & build', author: ATEF,
      cover_alt: 'A single trend line with two highlighted anomaly points over a faint grid',
      tags: ['Tableau', 'dbt', 'SQL'], featured: false, links: [],
    },
  },
];

const stripFrontmatter = (md) => md.replace(/^---\n[\s\S]*?\n---\n*/, '').trim();

async function ensureCollection() {
  const existing = await fetch(`${BASE}/collections/projects`, { headers: auth });
  if (existing.ok) {
    console.log('= collection projects (exists)');
    return;
  }

  await api('/collections', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      collection: 'projects',
      meta: { icon: 'folder_special', note: 'Case studies / selected work', sort_field: 'sort', archive_field: 'status', archive_value: 'archived', unarchive_value: 'draft' },
      schema: {},
      fields: [
        { field: 'id', type: 'uuid', meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] }, schema: { is_primary_key: true, length: 36 } },
        { field: 'status', type: 'string', meta: { interface: 'select-dropdown', display: 'labels', width: 'half', options: { choices: [{ text: 'Published', value: 'published' }, { text: 'Draft', value: 'draft' }, { text: 'Archived', value: 'archived' }] } }, schema: { default_value: 'draft' } },
        { field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true, width: 'half' }, schema: {} },
        { field: 'title', type: 'string', meta: { interface: 'input', required: true }, schema: {} },
        { field: 'slug', type: 'string', meta: { interface: 'input', required: true, note: 'lowercase-hyphenated, immutable after publish' }, schema: { is_unique: true } },
        { field: 'summary', type: 'text', meta: { interface: 'input-multiline', required: true }, schema: {} },
        { field: 'body', type: 'text', meta: { interface: 'input-rich-text-md', note: 'Markdown; ::: callouts supported' }, schema: {} },
        { field: 'year', type: 'integer', meta: { interface: 'input', width: 'half' }, schema: {} },
        { field: 'role', type: 'string', meta: { interface: 'input', width: 'half' }, schema: {} },
        { field: 'author', type: 'uuid', meta: { interface: 'select-dropdown-m2o', options: { template: '{{display_name}}' } }, schema: {} },
        { field: 'cover_image', type: 'uuid', meta: { interface: 'file-image' }, schema: {} },
        { field: 'cover_alt', type: 'string', meta: { interface: 'input', note: 'Alt text for the cover image' }, schema: {} },
        { field: 'tags', type: 'json', meta: { interface: 'tags', special: ['cast-json'], note: 'Stack / tech tags' }, schema: {} },
        { field: 'links', type: 'json', meta: { interface: 'list', special: ['cast-json'], options: { fields: [{ field: 'label', name: 'Label', type: 'string', meta: { interface: 'input', width: 'half' } }, { field: 'url', name: 'URL', type: 'string', meta: { interface: 'input', width: 'half' } }] } }, schema: {} },
        { field: 'featured', type: 'boolean', meta: { interface: 'boolean', width: 'half' }, schema: { default_value: false } },
      ],
    }),
  });
  console.log('+ collection projects');

  // M2O relations.
  await api('/relations', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ collection: 'projects', field: 'author', related_collection: 'authors' }) });
  await api('/relations', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ collection: 'projects', field: 'cover_image', related_collection: 'directus_files' }) });
  console.log('+ relations (author → authors, cover_image → directus_files)');
}

async function uploadCover(coverPath) {
  const buf = await readFile(join(ROOT, 'src/assets/projects', coverPath));
  const form = new FormData();
  form.append('file', new Blob([buf], { type: 'image/svg+xml' }), coverPath.split('/').pop());
  const res = await fetch(`${BASE}/files`, { method: 'POST', headers: auth, body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(`upload ${coverPath} → ${res.status} ${JSON.stringify(json.errors)}`);
  return json.data.id;
}

async function main() {
  await ensureCollection();

  const existing = await api('/items/projects?fields=slug&limit=-1').catch(() => []);
  const haveSlugs = new Set((existing || []).map((p) => p.slug));

  for (const project of PROJECTS) {
    if (haveSlugs.has(project.data.slug)) {
      console.log(`= project ${project.data.slug} (exists)`);
      continue;
    }
    const body = stripFrontmatter(await readFile(join(ROOT, 'src/content/projects', project.file), 'utf8'));
    const coverId = await uploadCover(project.cover);
    await api('/items/projects', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ ...project.data, body, cover_image: coverId }) });
    console.log(`+ project ${project.data.slug}`);
  }

  const all = await api('/items/projects?fields=slug,status,title&limit=-1');
  console.log(`\n${all.length} projects in Directus:`);
  for (const p of all) console.log(`  ${p.slug.padEnd(28)} ${p.status}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
