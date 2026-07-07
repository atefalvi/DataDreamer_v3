import { createRequire } from 'node:module';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const requireFromFrontend = createRequire(new URL('../frontend/package.json', import.meta.url));
const sharp = requireFromFrontend('sharp');

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT_DIR = join(ROOT, 'frontend/public/og/projects');
const DIRECTUS_URL = (process.env.DIRECTUS_URL ?? process.env.PUBLIC_DIRECTUS_URL ?? 'https://api.data-dreamer.net').replace(/\/$/, '');
const WIDTH = 1200;
const HEIGHT = 630;
const MAX_BYTES = 300 * 1024;

async function writeIfChanged(path, buffer) {
  try {
    const current = await readFile(path);
    if (Buffer.compare(current, buffer) === 0) return false;
  } catch {
    // First run.
  }
  await writeFile(path, buffer);
  return true;
}

async function getJson(path) {
  const res = await fetch(`${DIRECTUS_URL}${path}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GET ${path} -> ${res.status} ${body.slice(0, 180)}`);
  }
  return res.json();
}

async function fetchImage(assetId) {
  const res = await fetch(`${DIRECTUS_URL}/assets/${assetId}`);
  if (!res.ok) {
    throw new Error(`GET /assets/${assetId} -> ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

await mkdir(OUT_DIR, { recursive: true });

const { data: projects = [] } = await getJson(
  '/items/projects?fields=slug,cover_image&filter[status][_eq]=published&limit=-1&sort=slug',
);

for (const project of projects) {
  const slug = project?.slug;
  const cover = project?.cover_image;
  if (!slug || !cover) {
    throw new Error(`Published project is missing slug or cover_image.`);
  }

  const outputPath = join(OUT_DIR, `${slug}.png`);
  const png = await sharp(await fetchImage(cover))
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  const changed = await writeIfChanged(outputPath, png);
  const metadata = await sharp(png).metadata();
  const size = (await stat(outputPath)).size;
  if (metadata.width !== WIDTH || metadata.height !== HEIGHT) {
    throw new Error(`${slug}: expected ${WIDTH}x${HEIGHT}, got ${metadata.width}x${metadata.height}.`);
  }
  if (size > MAX_BYTES) {
    throw new Error(`${slug}: ${size} bytes exceeds ${MAX_BYTES}.`);
  }

  console.log(`${changed ? 'wrote' : 'ok   '} ${outputPath.replace(`${ROOT}/`, '')} ${Math.round(size / 1024)}KB`);
}
