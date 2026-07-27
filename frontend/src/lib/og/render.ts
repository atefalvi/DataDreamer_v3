/**
 * Dynamic OG images — one editorial renderer for posts, projects, and guides.
 *
 * Pipeline: deterministic brand background (generative network/grid/dust, ported from
 * the OG-backgrounds script, recolored to tokens) built as raw SVG + the content layer
 * (title, author avatar + name, topic, wordmark) rendered by satori into glyph
 * PATHS (no runtime fonts needed at raster time) → nested into one SVG → sharp → PNG.
 * The avatar is fetched server-side and embedded as a data URI; nothing here touches
 * tokens or private data — only published content goes in.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import satori from 'satori';
import sharp from 'sharp';
// ?raw bundles the SVG text into the server chunk — a filesystem read relative to the
// source tree would 500 in production, where this module runs from dist/server/chunks.
import logoRaw from '../../assets/brand/logo-mark.svg?raw';

const require = createRequire(import.meta.url);

const WIDTH = 1200;
const HEIGHT = 630;

/* Design tokens (tokens.css, dark observatory) */
const BG0 = '#0A0C10';
const BG1 = '#0F1318';
const ACCENT = '#FF5C38';
const TEXT1 = '#EDEFF3';
const TEXT2 = '#A8B1BD';
const TEXT3 = '#858E99';
const BORDER = '#1F262F';
const NODE = '#8aa0be';

function font(pkgPath: string): Buffer {
  return readFileSync(require.resolve(pkgPath));
}

const fonts = [
  { name: 'Fraunces', data: font('@fontsource/fraunces/files/fraunces-latin-600-normal.woff'), weight: 600 as const, style: 'normal' as const },
  { name: 'Inter', data: font('@fontsource/inter/files/inter-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
  { name: 'Inter', data: font('@fontsource/inter/files/inter-latin-600-normal.woff'), weight: 600 as const, style: 'normal' as const },
  { name: 'Inter', data: font('@fontsource/inter/files/inter-latin-700-normal.woff'), weight: 700 as const, style: 'normal' as const },
  { name: 'JetBrains Mono', data: font('@fontsource/jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff'), weight: 600 as const, style: 'normal' as const },
];

/* Deterministic PRNG so each slug gets its own stable constellation. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFrom(text: string): number {
  let hash = 2166136261;
  for (const ch of text) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function backgroundLayer(seed: number): string {
  const rng = mulberry32(seed);
  const parts: string[] = [];

  // grid
  for (let x = 0; x <= WIDTH; x += 40) {
    parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${HEIGHT}" stroke="#122135" stroke-width="${x % 160 === 0 ? 1 : 0.6}" opacity="${x % 160 === 0 ? 0.28 : 0.12}"/>`);
  }
  for (let y = 0; y <= HEIGHT; y += 40) {
    parts.push(`<line x1="0" y1="${y}" x2="${WIDTH}" y2="${y}" stroke="#122135" stroke-width="${y % 160 === 0 ? 1 : 0.6}" opacity="${y % 160 === 0 ? 0.28 : 0.12}"/>`);
  }

  // dust
  for (let i = 0; i < 70; i++) {
    const s = rng() > 0.78 ? 3 : 2;
    parts.push(`<rect x="${rng() * WIDTH}" y="${rng() * HEIGHT}" width="${s}" height="${s}" fill="${NODE}" opacity="${0.08 + rng() * 0.14}"/>`);
  }

  // network constellation, kept to the right so the title column stays calm
  const nodes: { x: number; y: number; pulse: boolean; size: number }[] = [];
  for (let i = 0; i < 20; i++) {
    const x = WIDTH * 0.5 + rng() * (WIDTH * 0.45);
    const y = 50 + rng() * (HEIGHT - 120);
    const pulse = rng() > 0.6;
    nodes.push({ x, y, pulse, size: pulse ? 10 + rng() * 12 : 4 + rng() * 6 });
  }
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    const near = nodes
      .map((b, j) => ({ j, d: Math.hypot(a.x - b.x, a.y - b.y) }))
      .filter(({ j }) => j > i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 2);
    for (const { j, d } of near) {
      if (d < 220) {
        const b = nodes[j];
        parts.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${ACCENT}" stroke-width="1.1" opacity="${(0.16 + Math.max(0, 0.18 - d / 1400)).toFixed(3)}" stroke-linecap="round"/>`);
      }
    }
  }
  for (const node of nodes) {
    if (node.pulse) {
      parts.push(`<circle cx="${node.x}" cy="${node.y}" r="${node.size * 1.9}" fill="${ACCENT}" opacity="0.08" filter="url(#ogblur)"/>`);
      parts.push(`<circle cx="${node.x}" cy="${node.y}" r="${node.size}" fill="${ACCENT}" opacity="0.14"/>`);
    }
    parts.push(`<rect x="${node.x - 2}" y="${node.y - 2}" width="4" height="4" fill="${node.pulse ? '#ffd1c6' : NODE}" opacity="${node.pulse ? 0.7 : 0.22}" rx="0.5"/>`);
  }

  return parts.join('');
}

/* Logo mark, inlined once (paths only; CSS var replaced with a concrete ink). */
let logoGroup: string | undefined;
function logoLayer(x: number, y: number, size: number): string {
  if (!logoGroup) {
    logoGroup = logoRaw
      .replace(/^[\s\S]*?<svg[^>]*>/, '')
      .replace(/<\/svg>\s*$/, '')
      .replaceAll('var(--logo-ink, currentColor)', TEXT1);
  }
  const scale = size / 1024;
  return `<g transform="translate(${x},${y}) scale(${scale})">${logoGroup}</g>`;
}

export interface OgCardInput {
  /** e.g. "Post", "Project · 2026", "Guide · Beginner" */
  kicker: string;
  title: string;
  authorName?: string;
  /** data: URI (already fetched server-side) or undefined for a monogram. */
  avatarDataUri?: string;
  /** Main tag or topic. */
  tag?: string;
  /** Stable string (slug) so each card gets its own constellation. */
  seed: string;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Content layer via satori — output SVG has text as paths, no font deps at raster. */
async function contentLayer(input: OgCardInput): Promise<string> {
  const title = truncate(input.title, 110);
  const titleSize = title.length > 78 ? 50 : title.length > 48 ? 58 : 68;
  const initials = (input.authorName ?? 'DD')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const avatar = input.avatarDataUri
    ? { type: 'img', props: { src: input.avatarDataUri, width: 72, height: 72, style: { width: 72, height: 72, borderRadius: 36, border: `2px solid ${BORDER}` } } }
    : {
        type: 'div',
        props: {
          style: {
            width: 72, height: 72, borderRadius: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #FF5C38 0%, #B5401F 100%)',
            color: '#FFF6F3', fontFamily: 'Inter', fontSize: 27, fontWeight: 700,
          },
          children: initials,
        },
      };

  const element = {
    type: 'div',
    props: {
      style: {
        width: WIDTH, height: HEIGHT, display: 'flex', flexDirection: 'column',
        padding: '42px 64px 46px', fontFamily: 'Inter',
      },
      children: [
        // Header: stacked wordmark beside the mark, editorial type at the far edge.
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'flex-start', minHeight: 52, marginLeft: 62 },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex', flexDirection: 'column', color: TEXT1,
                    fontFamily: 'JetBrains Mono', fontSize: 17, fontWeight: 600,
                    lineHeight: 0.95, letterSpacing: 1.5, textTransform: 'uppercase',
                  },
                  children: [
                    { type: 'div', props: { children: 'Data' } },
                    { type: 'div', props: { children: 'Dreamer' } },
                  ],
                },
              },
              { type: 'div', props: { style: { flexGrow: 1 }, children: '' } },
              {
                type: 'div',
                props: {
                  style: {
                    color: ACCENT, fontFamily: 'JetBrains Mono', fontSize: 17,
                    fontWeight: 600, letterSpacing: 2.8, textTransform: 'uppercase',
                  },
                  children: input.kicker,
                },
              },
            ],
          },
        },
        // Main editorial statement. The rule mirrors collection and page headers.
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center', maxWidth: 920, paddingTop: 20 },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'block', maxWidth: 900, color: TEXT1, fontFamily: 'Fraunces',
                    fontSize: titleSize, fontWeight: 600, lineHeight: 1.08, letterSpacing: -1,
                    lineClamp: 3,
                  },
                  children: title,
                },
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', width: 560, marginTop: 28 },
                  children: [
                    { type: 'div', props: { style: { width: 72, height: 3, background: ACCENT }, children: '' } },
                    { type: 'div', props: { style: { flexGrow: 1, height: 1, background: BORDER }, children: '' } },
                  ],
                },
              },
            ],
          },
        },
        // Footer: a deliberately enlarged author signature for small share previews.
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center', gap: 20 },
            children: [
              avatar,
              input.authorName
                ? { type: 'div', props: { style: { color: TEXT1, fontSize: 30, fontWeight: 600 }, children: input.authorName } }
                : { type: 'div', props: { style: { display: 'none' }, children: '' } },
              input.tag
                ? {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex', alignItems: 'center', marginLeft: 8, padding: '10px 20px',
                        border: `1px solid ${BORDER}`, borderRadius: 999, color: TEXT2,
                        fontFamily: 'JetBrains Mono', fontSize: 17, fontWeight: 600,
                        letterSpacing: 0.5,
                      },
                      children: truncate(input.tag, 28),
                    },
                  }
                : { type: 'div', props: { style: { display: 'none' }, children: '' } },
              { type: 'div', props: { style: { flexGrow: 1 }, children: '' } },
              {
                type: 'div',
                props: {
                  style: { color: TEXT3, fontFamily: 'JetBrains Mono', fontSize: 17, fontWeight: 600, letterSpacing: 1.2 },
                  children: 'data-dreamer.net',
                },
              },
            ],
          },
        },
      ],
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- satori's element type is react-shaped; we build plain objects
  return satori(element as any, { width: WIDTH, height: HEIGHT, fonts });
}

export async function renderOgCard(input: OgCardInput): Promise<Buffer> {
  const foreground = await contentLayer(input);
  const svg = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ogbg" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#070b12"/><stop offset="52%" stop-color="${BG0}"/><stop offset="100%" stop-color="${BG1}"/>
      </linearGradient>
      <radialGradient id="ogglow" cx="82%" cy="12%" r="60%">
        <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.28"/>
        <stop offset="42%" stop-color="${ACCENT}" stop-opacity="0.10"/>
        <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
      </radialGradient>
      <filter id="ogblur"><feGaussianBlur stdDeviation="8"/></filter>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#ogbg)"/>
    ${backgroundLayer(seedFrom(input.seed))}
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#ogglow)"/>
    ${logoLayer(64, 42, 44)}
    ${foreground.replace(/^<svg[^>]*>/, `<svg x="0" y="0" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">`)}
    <rect x="1" y="1" width="${WIDTH - 2}" height="${HEIGHT - 2}" fill="none" stroke="#172230" stroke-width="2" opacity="0.55"/>
  </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Fetch a Directus avatar as an embeddable data URI (server-side only). */
export async function avatarDataUri(assetBaseUrl: string, fileId: string): Promise<string | undefined> {
  try {
    const res = await fetch(`${assetBaseUrl}/assets/${encodeURIComponent(fileId)}?width=144&height=144&fit=cover&format=png`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return undefined;
    const buffer = Buffer.from(await res.arrayBuffer());
    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch {
    return undefined;
  }
}
