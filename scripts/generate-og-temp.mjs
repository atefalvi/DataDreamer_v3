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

const images = [
  ['og-default.png', 1],
  ['og-home.png', 2],
  ['og-blog.png', 3],
  ['og-projects.png', 4],
  ['og-team.png', 5],
  ['og-about.png', 6],
  ['og-guides.png', 7],
];

function mulberry32(seed) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function rect({ x, y, width, height, fill = 'none', stroke = 'none', strokeWidth = 1, rx = 0, opacity = 1 }) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" rx="${rx}" opacity="${opacity}"/>`;
}

function circle({ cx, cy, r, fill = 'none', opacity = 1, filter = '' }) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity}" ${filter ? `filter="${filter}"` : ''}/>`;
}

function line({ x1, y1, x2, y2, stroke = '#ffffff', strokeWidth = 1, opacity = 1 }) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" stroke-linecap="round"/>`;
}

function gridOverlay() {
  const major = 128;
  const minor = 32;
  let svg = '';

  for (let x = 0; x <= WIDTH; x += minor) {
    svg += line({
      x1: x,
      y1: 0,
      x2: x,
      y2: HEIGHT,
      stroke: '#122135',
      strokeWidth: x % major === 0 ? 1 : 0.6,
      opacity: x % major === 0 ? 0.28 : 0.12,
    });
  }

  for (let y = 0; y <= HEIGHT; y += minor) {
    svg += line({
      x1: 0,
      y1: y,
      x2: WIDTH,
      y2: y,
      stroke: '#122135',
      strokeWidth: y % major === 0 ? 1 : 0.6,
      opacity: y % major === 0 ? 0.28 : 0.12,
    });
  }

  return svg;
}

function dustOverlay(random) {
  let svg = '';
  for (let i = 0; i < 85; i += 1) {
    const x = random() * WIDTH;
    const y = random() * HEIGHT;
    const size = random() > 0.78 ? 3 : 2;
    svg += rect({ x, y, width: size, height: size, fill: '#8aa0be', opacity: 0.08 + random() * 0.16 });
  }
  return svg;
}

function networkOverlay(random) {
  const nodes = [];
  const count = 24;
  const leftSafe = Math.round(WIDTH * 0.26);
  const rightPad = 65;
  const topPad = 62;
  const bottomPad = 70;

  for (let i = 0; i < count; i += 1) {
    const x = leftSafe + random() * (WIDTH - leftSafe - rightPad);
    const y = topPad + random() * (HEIGHT - topPad - bottomPad);
    const pulse = random() > 0.55;
    nodes.push({ x, y, pulse, size: pulse ? 12 + random() * 14 : 5 + random() * 8 });
  }

  let svg = '';
  for (let i = 0; i < nodes.length; i += 1) {
    const a = nodes[i];
    const nearest = nodes
      .map((b, j) => ({ j, distance: Math.hypot(a.x - b.x, a.y - b.y) }))
      .filter(({ j }) => j !== i)
      .sort((p, q) => p.distance - q.distance)
      .slice(0, 2 + Math.floor(random() * 2));

    for (const { j, distance } of nearest) {
      if (j < i || distance >= 240) continue;
      const b = nodes[j];
      svg += line({
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        stroke: '#ff5c38',
        strokeWidth: 1.15,
        opacity: 0.16 + Math.max(0, 0.2 - distance / 1400),
      });
    }
  }

  for (const node of nodes) {
    if (node.pulse) {
      svg += circle({ cx: node.x, cy: node.y, r: node.size * 1.9, fill: '#ff5c38', opacity: 0.08, filter: 'url(#blur8)' });
      svg += circle({ cx: node.x, cy: node.y, r: node.size, fill: '#ff5c38', opacity: 0.14 });
    }
    svg += rect({
      x: node.x - 2,
      y: node.y - 2,
      width: 4,
      height: 4,
      fill: node.pulse ? '#ffd1c6' : '#8aa0be',
      opacity: node.pulse ? 0.7 : 0.22,
      rx: 0.5,
    });
  }

  return svg;
}

function brandPlateSvg() {
  return `
    <svg width="280" height="74" viewBox="0 0 280 74" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="plate" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="rgba(8,13,21,0.82)"/>
          <stop offset="100%" stop-color="rgba(11,16,26,0.42)"/>
        </linearGradient>
      </defs>
      <rect x="0.75" y="0.75" width="278.5" height="72.5" rx="18" fill="url(#plate)"/>
      <text x="98" y="31" fill="#eef2f6" font-family="Inter, Arial, Helvetica, sans-serif" font-size="18" font-weight="700" letter-spacing="1.8">DATA</text>
      <text x="98" y="54" fill="#eef2f6" font-family="Inter, Arial, Helvetica, sans-serif" font-size="18" font-weight="700" letter-spacing="1.8">DREAMER</text>
    </svg>`;
}

function logoMarkSvg() {
  return `
    <svg width="56" height="56" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path fill="#eef2f6" d="M717 205h102v102h103v410H819v102H717v103H467c-137 0-248 0-248-1 1 0 7-2 12-3 41-10 73-48 76-90l1-9h409V717h102V307H717V205H205v512h-9c-36 3-68 26-84 59-4 9-8 22-8 26 0 2 0 3-1 4-1 0-1-117-1-352V103l308-1h307ZM614 614v103H307V307h307v103h103v204Zm0 0V410H410v204Z" />
      <path fill="#fd2e00" d="m307 811 1 8-1 9c-3 42-35 80-76 90l-12 3h18c-27 0-43 0-44-1-21-2-45-13-60-28-17-17-28-39-30-64-1-7-1-118-1-368v-7 353c1 0 1-2 1-4 0-4 4-17 9-26 15-33 48-56 84-59h9l9 1c29 2 59 19 75 43 10 15 17 33 18 50Z" />
    </svg>`;
}

function backgroundSvg(seed) {
  const random = mulberry32(seed);
  return `
    <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#070b12"/>
          <stop offset="52%" stop-color="#09111d"/>
          <stop offset="100%" stop-color="#0a1220"/>
        </linearGradient>
        <radialGradient id="glowRight" cx="82%" cy="14%" r="60%">
          <stop offset="0%" stop-color="#ff5c38" stop-opacity="0.30"/>
          <stop offset="42%" stop-color="#ff5c38" stop-opacity="0.11"/>
          <stop offset="100%" stop-color="#ff5c38" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="blueVignette" cx="22%" cy="48%" r="80%">
          <stop offset="0%" stop-color="#0c1f38" stop-opacity="0.16"/>
          <stop offset="70%" stop-color="#0c1f38" stop-opacity="0.02"/>
          <stop offset="100%" stop-color="#0c1f38" stop-opacity="0"/>
        </radialGradient>
        <filter id="blur8"><feGaussianBlur stdDeviation="8"/></filter>
      </defs>
      ${rect({ x: 0, y: 0, width: WIDTH, height: HEIGHT, fill: 'url(#bg)' })}
      ${rect({ x: 0, y: 0, width: WIDTH, height: HEIGHT, fill: 'url(#blueVignette)' })}
      ${rect({ x: 0, y: 0, width: WIDTH, height: HEIGHT, fill: 'url(#glowRight)' })}
      ${gridOverlay()}
      ${dustOverlay(random)}
      ${networkOverlay(random)}
      ${rect({ x: 0, y: 0, width: WIDTH, height: HEIGHT, fill: 'none', stroke: '#172230', strokeWidth: 2, opacity: 0.55 })}
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

async function renderImage(fileName, seed) {
  const outputPath = join(OUT_DIR, fileName);
  const png = await sharp(Buffer.from(backgroundSvg(seed)))
    .composite([
      { input: Buffer.from(brandPlateSvg()), left: 28, top: 28 },
      { input: Buffer.from(logoMarkSvg()), left: 46, top: 37 },
    ])
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
