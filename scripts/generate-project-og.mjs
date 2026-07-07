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

const escapeXml = (value) =>
  String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function wrapText(value, maxChars, maxLines) {
  const words = String(value ?? '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines) break;
  }

  if (current && lines.length < maxLines) lines.push(current);
  if (words.join(' ').length > lines.join(' ').length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.,;:!?]$/, '')}...`;
  }
  return lines;
}

function tspans(lines, x, dy) {
  return lines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : dy}">${escapeXml(line)}</tspan>`).join('');
}

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

function textOverlaySvg(title, summary) {
  const titleLines = wrapText(title, 28, 2);
  const summaryLines = wrapText(summary, 64, 2);
  const summaryY = 388 + (titleLines.length - 1) * 78;
  const ruleY = summaryY + 88;
  const urlY = ruleY + 74;

  return `
    <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="scrim" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#070b12" stop-opacity="0.96"/>
          <stop offset="62%" stop-color="#070b12" stop-opacity="0.72"/>
          <stop offset="100%" stop-color="#070b12" stop-opacity="0.18"/>
        </linearGradient>
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#scrim)"/>
      <text x="64" y="94"
        fill="#f4f6f8"
        font-family="Inter, Arial, Helvetica, sans-serif"
        font-size="20"
        font-weight="720"
        letter-spacing="1.9">DATA DREAMER / PROJECT</text>
      <text x="64" y="324"
        fill="#f4f6f8"
        font-family="Inter, Arial, Helvetica, sans-serif"
        font-size="68"
        font-weight="720"
        letter-spacing="0">${tspans(titleLines, 64, 78)}</text>
      <text x="66" y="${summaryY}"
        fill="#b7c0cb"
        font-family="Inter, Arial, Helvetica, sans-serif"
        font-size="26"
        font-weight="520"
        letter-spacing="0">${tspans(summaryLines, 66, 36)}</text>
      <line x1="66" y1="${ruleY}" x2="410" y2="${ruleY}" stroke="#ff5c38" stroke-width="3"/>
      <text x="66" y="${urlY}"
        fill="#8a96a5"
        font-family="JetBrains Mono, ui-monospace, monospace"
        font-size="17"
        letter-spacing="2.4">data-dreamer.net</text>
    </svg>`;
}

await mkdir(OUT_DIR, { recursive: true });

const { data: projects = [] } = await getJson(
  '/items/projects?fields=slug,title,summary,cover_image&filter[status][_eq]=published&limit=-1&sort=slug',
);

for (const project of projects) {
  const slug = project?.slug;
  const title = project?.title;
  const summary = project?.summary;
  const cover = project?.cover_image;
  if (!slug || !title || !summary || !cover) {
    throw new Error(`Published project is missing slug, title, summary, or cover_image.`);
  }

  const outputPath = join(OUT_DIR, `${slug}.png`);
  const png = await sharp(await fetchImage(cover))
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
    .composite([{ input: Buffer.from(textOverlaySvg(title, summary)), left: 0, top: 0 }])
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
