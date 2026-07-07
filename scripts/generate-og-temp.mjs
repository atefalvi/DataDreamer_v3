import { createRequire } from 'node:module';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const requireFromFrontend = createRequire(new URL('../frontend/package.json', import.meta.url));
const sharp = requireFromFrontend('sharp');

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT_DIR = join(ROOT, 'frontend/public/og');
const WIDTH = 1200;
const HEIGHT = 630;
const MAX_BYTES = 300 * 1024;

const colors = {
  bg0: 'rgb(10, 12, 16)',
  border1: 'rgb(31, 38, 47)',
  text1: 'rgb(237, 239, 243)',
  text2: 'rgb(168, 177, 189)',
  text3: 'rgb(110, 119, 131)',
  accent: 'rgb(255, 92, 56)',
};

const images = [
  ['og-default.png', 'DataDreamer', 'Field notes from the future of data'],
  ['og-home.png', 'Home', 'Signal, systems, and applied intelligence'],
  ['og-blog.png', 'Blog', 'Editorial notes on data, AI, and engineering'],
  ['og-projects.png', 'Projects', 'Selected work from the DataDreamer lab'],
  ['og-team.png', 'Dream Team', 'People, specialties, and shared signals'],
  ['og-about.png', 'About', 'The practice behind DataDreamer'],
  ['og-guides.png', 'Field Guides', 'Curated paths through topics worth learning'],
];

const escapeXml = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function logoMark(x, y, size) {
  const scale = size / 64;
  const tx = (n) => x + n * scale;
  const ty = (n) => y + n * scale;

  return `
    <path d="M ${tx(22)} ${ty(8)} H ${tx(40)} A ${16 * scale} ${16 * scale} 0 0 1 ${tx(56)} ${ty(24)} V ${ty(40)} A ${16 * scale} ${16 * scale} 0 0 1 ${tx(40)} ${ty(56)} H ${tx(24)}"
      fill="none" stroke="${colors.text1}" stroke-width="${7 * scale}" stroke-linecap="round"/>
    <path d="M ${tx(26)} ${ty(22)} H ${tx(38)} A ${10 * scale} ${10 * scale} 0 0 1 ${tx(48)} ${ty(32)} A ${10 * scale} ${10 * scale} 0 0 1 ${tx(38)} ${ty(42)} H ${tx(30)}"
      fill="none" stroke="${colors.text1}" stroke-width="${5 * scale}" stroke-linecap="round" opacity="0.55"/>
    <circle cx="${tx(13)}" cy="${ty(53)}" r="${6.5 * scale}" fill="${colors.accent}"/>
  `;
}

function svgTemplate(title, subtitle) {
  const safeTitle = escapeXml(title);
  const safeSubtitle = escapeXml(subtitle);

  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${colors.bg0}"/>
    <rect x="64" y="64" width="1072" height="502" rx="0" fill="none" stroke="${colors.border1}" stroke-width="1"/>
    <path d="M 64 472 H 1136" stroke="${colors.border1}" stroke-width="1"/>
    <path d="M 64 478 H 392" stroke="${colors.accent}" stroke-width="3"/>

    <g transform="translate(64 64)">
      ${logoMark(0, 0, 44)}
      <text x="66" y="33"
        fill="${colors.text1}"
        font-family="Fraunces, Georgia, serif"
        font-size="30"
        font-weight="560"
        letter-spacing="0">DataDreamer</text>
    </g>

    <text x="64" y="178"
      fill="${colors.text3}"
      font-family="JetBrains Mono, ui-monospace, monospace"
      font-size="18"
      font-weight="600"
      letter-spacing="2.2">SOCIAL PREVIEW</text>

    <text x="64" y="328"
      fill="${colors.text1}"
      font-family="Inter, system-ui, sans-serif"
      font-size="72"
      font-weight="600"
      letter-spacing="0">${safeTitle}</text>

    <text x="64" y="390"
      fill="${colors.text2}"
      font-family="Inter, system-ui, sans-serif"
      font-size="30"
      font-weight="500">${safeSubtitle}</text>

    <text x="64" y="526"
      fill="${colors.text3}"
      font-family="JetBrains Mono, ui-monospace, monospace"
      font-size="18"
      letter-spacing="1.6">data-dreamer.net</text>
  </svg>`;
}

async function writeIfChanged(path, buffer) {
  try {
    const current = await readFile(path);
    if (Buffer.compare(current, buffer) === 0) return false;
  } catch {
    // Missing file is expected on the first run.
  }

  await writeFile(path, buffer);
  return true;
}

async function renderImage(fileName, title, subtitle) {
  const outputPath = join(OUT_DIR, fileName);
  const png = await sharp(Buffer.from(svgTemplate(title, subtitle)))
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  await writeIfChanged(outputPath, png);

  const metadata = await sharp(png).metadata();
  const { size } = await stat(outputPath);
  if (metadata.width !== WIDTH || metadata.height !== HEIGHT || size > MAX_BYTES) {
    throw new Error(`${fileName} failed validation: ${metadata.width}x${metadata.height}, ${size} bytes`);
  }

  return { fileName, size, width: metadata.width, height: metadata.height };
}

await mkdir(OUT_DIR, { recursive: true });

const results = [];
for (const image of images) {
  results.push(await renderImage(...image));
}

for (const result of results) {
  const kb = Math.round(result.size / 1024);
  console.log(`${result.fileName}: ${result.width}x${result.height}, ${kb}KB`);
}
