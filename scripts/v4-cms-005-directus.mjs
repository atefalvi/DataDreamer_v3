/**
 * V4-CMS-005 — Projects → content collection migration (08 §10.4, 03 §3).
 *
 * Exports the Directus `projects` collection to repo-owned markdown + downloaded cover
 * images, then ARCHIVES the Directus rows (status=archived — never deletes published
 * content). The repo content collection (src/content/projects, schema in
 * src/content.config.ts) becomes the source of truth; PROJ-001/002 read it with zero
 * Directus calls.
 *
 * Run where Directus is reachable:
 *   DIRECTUS_URL=… DIRECTUS_TOKEN=…  node scripts/v4-cms-005-directus.mjs
 *   DRY_RUN=1 to export files without archiving Directus rows.
 *
 * Prints the parity table (old URL → new file) for the V4-CMS-005 handoff entry.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createDirectus,
  rest,
  staticToken,
  authentication,
  readItems,
  updateItem,
} from '../frontend/node_modules/@directus/sdk/dist/index.js';

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
const DIRECTUS_ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const DIRECTUS_ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;
const DRY_RUN = process.env.DRY_RUN === '1';

if (!DIRECTUS_URL || (!DIRECTUS_TOKEN && (!DIRECTUS_ADMIN_EMAIL || !DIRECTUS_ADMIN_PASSWORD))) {
  throw new Error('DIRECTUS_URL and either DIRECTUS_TOKEN or DIRECTUS_ADMIN_EMAIL/DIRECTUS_ADMIN_PASSWORD are required.');
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = join(ROOT, 'frontend/src/content/projects');
const ASSET_DIR = join(ROOT, 'frontend/src/assets/projects');

const directus = DIRECTUS_TOKEN
  ? createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest())
  : createDirectus(DIRECTUS_URL).with(authentication()).with(rest());

const yamlString = (value) => JSON.stringify(value ?? '');
const slugify = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);

function frontmatter(project, slug, coverPath, coverExt) {
  const stack = Array.isArray(project.tags) ? project.tags : [];
  const lines = [
    '---',
    `title: ${yamlString(project.title ?? 'Untitled')}`,
    `summary: ${yamlString(project.summary ?? project.description ?? '')}`,
    `year: ${project.published_at ? new Date(project.published_at).getFullYear() : new Date().getFullYear()}`,
    `role: ${yamlString(project.role ?? 'Design & build')}`,
    `stack: ${JSON.stringify(stack)}`,
    `cover: ${yamlString(`../../assets/projects/${slug}/cover.${coverExt}`)}`,
    `coverAlt: ${yamlString(project.cover_alt ?? project.title ?? '')}`,
    `featured: ${Boolean(project.featured ?? false)}`,
    `order: ${project.sort ?? 0}`,
  ];
  if (Array.isArray(project.links) && project.links.length) {
    lines.push(`links:`);
    for (const link of project.links) {
      lines.push(`  - { label: ${yamlString(link.label)}, url: ${yamlString(link.url)} }`);
    }
  }
  lines.push('---', '');
  return lines.join('\n');
}

async function downloadAsset(fileId, destDir) {
  // Directus serves originals at /assets/{id}; honor the same auth as the SDK.
  const url = `${DIRECTUS_URL}/assets/${fileId}`;
  const res = await fetch(url, DIRECTUS_TOKEN ? { headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` } } : {});
  if (!res.ok) throw new Error(`asset ${fileId} → HTTP ${res.status}`);
  const type = res.headers.get('content-type') ?? '';
  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : type.includes('svg') ? 'svg' : 'jpg';
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(destDir, { recursive: true });
  await writeFile(join(destDir, `cover.${ext}`), buf);
  return ext;
}

async function main() {
  if (!DIRECTUS_TOKEN) {
    await directus.login(DIRECTUS_ADMIN_EMAIL, DIRECTUS_ADMIN_PASSWORD);
  }

  const projects = await directus.request(
    readItems('projects', {
      filter: { status: { _neq: 'archived' } },
      fields: ['*'],
      limit: -1,
    }),
  );

  const parity = [];
  await mkdir(CONTENT_DIR, { recursive: true });

  for (const project of projects) {
    const slug = slugify(project.slug ?? project.title);
    if (!slug) continue;

    let coverExt = 'png';
    if (project.cover_image) {
      try {
        coverExt = await downloadAsset(project.cover_image, join(ASSET_DIR, slug));
      } catch (error) {
        console.warn(`! cover for ${slug}: ${error.message}`);
      }
    }

    const body = (project.description ?? project.body ?? '').trim();
    const md = `${frontmatter(project, slug, undefined, coverExt)}${body}\n`;
    if (!DRY_RUN) await writeFile(join(CONTENT_DIR, `${slug}.md`), md);

    if (!DRY_RUN && project.id != null) {
      await directus.request(updateItem('projects', project.id, { status: 'archived' }));
    }

    parity.push({ from: `/projects/${project.slug ?? slug}`, to: `src/content/projects/${slug}.md` });
  }

  console.log('\nV4-CMS-005 parity table (old URL → new file)');
  for (const row of parity) console.log(`${row.from.padEnd(48)} → ${row.to}`);
  console.log(`\n${parity.length} projects ${DRY_RUN ? 'exported (dry run; Directus untouched)' : 'migrated + archived in Directus'}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
