#!/usr/bin/env node
/**
 * Orby sprite audit + runtime asset preparation (brief §15.2–15.4).
 *
 * Source of truth: docs/agent-workspace/assets/strips (NEVER mutated).
 * Runtime output:  apps/orby-chat/public/orby/strips + manifest.json
 * Audit output:    docs/audits/orby-sprite-audit.json (machine) + .md (human)
 *
 * For every strip: dimensions, alpha, frame division, per-frame duplicate detection,
 * per-frame alpha bounds (baseline/scale drift), opaque-background detection. Strips
 * that fail validation are EXCLUDED from the runtime copy and flagged — the script
 * exits non-zero so CI catches malformed additions. No trimming, no rescaling, no
 * per-frame cropping: frames ship exactly as drawn (pixel-art rule §15.5).
 *
 * Run: node scripts/prepare-orby-assets.mjs
 */
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import path from 'node:path';

// sharp lives in the frontend workspace; reuse it rather than adding a root dep.
const require = createRequire(new URL('../frontend/package.json', import.meta.url));
const sharp = require('sharp');

const SOURCE_DIR = 'docs/agent-workspace/assets/strips';
const RUNTIME_DIR = 'apps/orby-chat/public/orby/strips';
const MANIFEST_PATH = 'apps/orby-chat/public/orby/manifest.json';
const AUDIT_JSON = 'docs/audits/orby-sprite-audit.json';
const AUDIT_MD = 'docs/audits/orby-sprite-audit.md';

const FRAME = 256; // established by the reviewed samples; every file is still verified.

/**
 * Playback defaults per state. `loop` states are ambient; one-shots hold their final
 * frame briefly then the engine returns to idle. Tuned via the QA preview page —
 * these are starting values, not guesses baked into components (they live in the
 * manifest precisely so they can be adjusted without code changes).
 */
const PLAYBACK = {
  loop: new Set([
    'idle1', 'idle2', 'idle3', 'listening', 'loading', 'searching', 'syncing',
    'typing', 'talking', 'thinking', 'sleeping', 'playing', 'connected', 'tired',
  ]),
  // Everything else: play once, hold last frame, engine returns to idle.
  fps: {
    default: 8,
    sleeping: 4,
    idle1: 6, idle2: 6, idle3: 6,
    thinking: 7, listening: 6,
  },
  /** Semantic category → chat lifecycle hint (documented mapping, brief §15.7). */
  category: {
    idle1: 'idle', idle2: 'idle', idle3: 'idle',
    listening: 'waiting', typing: 'streaming', talking: 'streaming',
    thinking: 'classifying', searching: 'retrieval', loading: 'processing',
    syncing: 'processing', yes: 'acknowledge', no: 'refusal',
    success: 'success', celebration: 'success', proud: 'success',
    worried: 'degraded', confused: 'low-confidence', 'cannot-find': 'no-answer',
    warning: 'security', error: 'error', failure: 'error', blocked: 'refusal',
    offline: 'offline', timeout: 'timeout', sleeping: 'inactive',
    surprised: 'reaction', shocked: 'reaction', mindblown: 'reaction',
    excited: 'welcome', curious: 'welcome', idea: 'suggestion',
    love: 'reaction', starstuck: 'reaction', skeptical: 'reaction',
    sad: 'negative', afraid: 'negative', frustrated: 'negative',
    determined: 'working', connected: 'online', playing: 'ambient', tired: 'ambient',
  },
};

function sha1(buffer) {
  return createHash('sha1').update(buffer).digest('hex');
}

async function auditStrip(fileName) {
  const sourcePath = path.join(SOURCE_DIR, fileName);
  const image = sharp(sourcePath);
  const meta = await image.metadata();
  const issues = [];
  const notes = [];

  const { width, height, channels, hasAlpha, format } = meta;
  if (format !== 'png') issues.push(`not a PNG (${format})`);
  if (!hasAlpha || channels !== 4) issues.push(`not RGBA (channels=${channels}, alpha=${hasAlpha})`);

  // Frame division: expect a horizontal strip of square FRAME×FRAME cells.
  let frames = 0;
  if (height === FRAME && width % FRAME === 0) {
    frames = width / FRAME;
  } else if (width % height === 0) {
    frames = width / height;
    notes.push(`non-${FRAME}px frames (${height}×${height})`);
  } else {
    issues.push(`does not divide into square frames (${width}×${height})`);
  }

  let frameReports = [];
  let opaqueBackground = false;
  if (frames > 0 && issues.length === 0) {
    const raw = await image.ensureAlpha().raw().toBuffer();
    const frameW = width / frames;
    let minAlphaEverywhere = 255;
    const hashes = [];

    for (let f = 0; f < frames; f++) {
      let minX = frameW, minY = height, maxX = -1, maxY = -1;
      const frameHash = createHash('sha1');
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < frameW; x++) {
          const idx = (y * width + (f * frameW + x)) * 4;
          const a = raw[idx + 3];
          frameHash.update(raw.subarray(idx, idx + 4));
          if (a < minAlphaEverywhere) minAlphaEverywhere = a;
          if (a > 8) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      hashes.push(frameHash.digest('hex'));
      frameReports.push({
        index: f,
        alphaBounds: maxX >= 0 ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } : null,
      });
    }

    if (minAlphaEverywhere === 255) {
      opaqueBackground = true;
      issues.push('fully opaque — expected transparent background');
    }

    // duplicates (informational: first==last is an intentional rest-pose return)
    const dupPairs = [];
    for (let i = 0; i < hashes.length; i++) {
      for (let j = i + 1; j < hashes.length; j++) {
        if (hashes[i] === hashes[j]) dupPairs.push(`${i}=${j}`);
      }
    }
    if (dupPairs.length) notes.push(`duplicate frames: ${dupPairs.join(', ')}`);

    // baseline drift check: bottom edge of alpha bounds (the ground shadow) should
    // stay near-constant; the orb itself is allowed to move (§15.1).
    const bottoms = frameReports.map((r) => (r.alphaBounds ? r.alphaBounds.y + r.alphaBounds.h : 0));
    const spread = Math.max(...bottoms) - Math.min(...bottoms);
    if (spread > 24) notes.push(`baseline spread ${spread}px (check shadow anchoring)`);
  }

  const state = path.basename(fileName, '.png');
  return {
    file: fileName,
    state,
    width,
    height,
    frames,
    frameWidth: frames ? width / frames : null,
    frameHeight: height,
    rgba: hasAlpha && channels === 4,
    opaqueBackground,
    sha1: sha1(readFileSync(sourcePath)),
    issues,
    notes,
    frameBounds: frameReports.map((r) => r.alphaBounds),
  };
}

const files = readdirSync(SOURCE_DIR).filter((f) => f.toLowerCase().endsWith('.png')).sort();
const nonPng = readdirSync(SOURCE_DIR).filter((f) => !f.toLowerCase().endsWith('.png') && !f.startsWith('.'));
const results = [];
for (const file of files) {
  results.push(await auditStrip(file));
}

const valid = results.filter((r) => r.issues.length === 0);
const invalid = results.filter((r) => r.issues.length > 0);

/* runtime copy + manifest (valid strips only; sources untouched) */
mkdirSync(RUNTIME_DIR, { recursive: true });
const states = {};
for (const r of valid) {
  copyFileSync(path.join(SOURCE_DIR, r.file), path.join(RUNTIME_DIR, r.file));
  const loop = PLAYBACK.loop.has(r.state);
  states[r.state] = {
    src: `/orby/strips/${r.file}`,
    source: `${SOURCE_DIR}/${r.file}`,
    frameWidth: r.frameWidth,
    frameHeight: r.frameHeight,
    frames: r.frames,
    fps: PLAYBACK.fps[r.state] ?? PLAYBACK.fps.default,
    loop,
    ...(loop ? {} : { holdLastFrameMs: 400 }),
    category: PLAYBACK.category[r.state] ?? 'reaction',
    reducedMotionFrame: 0,
    fallback: r.state.startsWith('idle') ? undefined : 'idle1',
  };
}
const manifest = {
  version: 1,
  generatedAt: new Date().toISOString(),
  sourceDirectory: SOURCE_DIR,
  defaultState: 'idle1',
  states,
};
mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

/* audit reports */
mkdirSync(path.dirname(AUDIT_JSON), { recursive: true });
writeFileSync(AUDIT_JSON, JSON.stringify({ generatedAt: manifest.generatedAt, sourceDirectory: SOURCE_DIR, nonPngFiles: nonPng, results }, null, 2));

const md = [
  '# Orby Sprite Audit',
  '',
  `Generated ${manifest.generatedAt} by \`scripts/prepare-orby-assets.mjs\` (read-only on sources).`,
  '',
  `Source: \`${SOURCE_DIR}\` — ${files.length} PNG strip(s)${nonPng.length ? `, ${nonPng.length} non-PNG file(s): ${nonPng.join(', ')}` : ''}.`,
  `Valid: **${valid.length}** · Invalid: **${invalid.length}**`,
  '',
  '| Strip | Size | Frames | Frame | RGBA | Notes |',
  '|---|---|---|---|---|---|',
  ...results.map((r) =>
    `| ${r.file} | ${r.width}×${r.height} | ${r.frames} | ${r.frameWidth}×${r.frameHeight} | ${r.rgba ? '✓' : '✗'} | ${[...r.issues.map((i) => `**${i}**`), ...r.notes].join('; ') || '—'} |`,
  ),
  '',
  invalid.length
    ? `## Invalid strips (excluded from runtime)\n\n${invalid.map((r) => `- **${r.file}**: ${r.issues.join('; ')}`).join('\n')}`
    : 'All strips passed validation and were copied to the runtime folder.',
  '',
  `Runtime: \`${RUNTIME_DIR}\` · Manifest: \`${MANIFEST_PATH}\``,
].join('\n');
writeFileSync(AUDIT_MD, md);

console.log(`audited ${files.length} strips → ${valid.length} valid, ${invalid.length} invalid`);
console.log(`runtime: ${RUNTIME_DIR} · manifest: ${MANIFEST_PATH}`);
console.log(`audit: ${AUDIT_JSON} + ${AUDIT_MD}`);
if (invalid.length) {
  console.error('INVALID STRIPS:', invalid.map((r) => r.file).join(', '));
  process.exit(1);
}
