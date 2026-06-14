import { createRequire } from 'node:module';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const requireFromFrontend = createRequire(new URL('../frontend/package.json', import.meta.url));
const sharp = requireFromFrontend('sharp');

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CONTENT_DIR = join(ROOT, 'frontend/src/content/projects');
const OUT_DIR = join(ROOT, 'frontend/public/og/projects');
const WIDTH = 1200;
const HEIGHT = 630;
const MAX_BYTES = 300 * 1024;

function frontmatterValue(markdown, key) {
  const match = markdown.match(new RegExp(`^${key}:\\s*\"?([^\"\\n]+)\"?`, 'm'));
  return match?.[1]?.trim();
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

await mkdir(OUT_DIR, { recursive: true });

const entries = (await readdir(CONTENT_DIR)).filter((file) => file.endsWith('.md')).sort();
for (const file of entries) {
  const slug = basename(file, '.md');
  const markdownPath = join(CONTENT_DIR, file);
  const markdown = await readFile(markdownPath, 'utf8');
  const cover = frontmatterValue(markdown, 'cover');
  if (!cover) {
    throw new Error(`${file} is missing a cover frontmatter value.`);
  }

  const coverPath = normalize(join(dirname(markdownPath), cover));
  const outputPath = join(OUT_DIR, `${slug}.png`);
  const png = await sharp(coverPath)
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
