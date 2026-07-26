/**
 * Deterministic layout for the Dream Team "data commons".
 *
 * People form a loose outer constellation while shared data capabilities occupy the
 * inner field. The result is intentionally stable and server-renderable: JavaScript
 * enhances selection, but never owns layout or starts a force simulation.
 */

export const GRAPH = {
  width: 1200,
  height: 720,
  cx: 600,
  cy: 352,
  rx: 485,
  ry: 292,
  padding: 54,
} as const;

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const SKILL_RELAX_ITERATIONS = 56;

export interface GraphSpecialtyInput {
  id: string;
  slug: string;
  label?: string;
  memberCount: number;
}

export interface GraphAuthorInput {
  id: string;
  specialtyIds: string[];
  posts: number;
  guides: number;
}

export interface SpecialtyAnchor {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  labelX: number;
  labelY: number;
  labelAnchor: 'start' | 'middle' | 'end';
}

export interface AuthorNode {
  id: string;
  x: number;
  y: number;
  r: number;
}

export interface GraphEdge {
  authorId: string;
  specialtyId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  c1x: number;
  c1y: number;
  c2x: number;
  c2y: number;
  /** Retained for compatibility with earlier consumers and fixtures. */
  cx: number;
  cy: number;
}

export interface GraphLayout {
  width: number;
  height: number;
  specialtyAnchors: SpecialtyAnchor[];
  authorNodes: AuthorNode[];
  edges: GraphEdge[];
}

function hashSeed(value: string): number {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: string): () => number {
  let state = hashSeed(seed);
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function nodeRadius(author: GraphAuthorInput): number {
  const contributionWeight = Math.log(author.posts + author.guides + 1);
  return clamp(24 + contributionWeight * 1.3, 24, 28);
}

function skillWidth(specialty: GraphSpecialtyInput): number {
  const label = specialty.label ?? specialty.slug.replaceAll('-', ' ');
  return clamp(62 + label.length * 6.3, 118, 198);
}

/**
 * Place the shared capability capsules on a phyllotaxis field, then gently remove
 * rectangle overlaps. The tiny seed-based variations keep it organic without allowing
 * nodes to drift between renders.
 */
function placeSpecialties(specialties: GraphSpecialtyInput[]): SpecialtyAnchor[] {
  const { cx, cy } = GRAPH;
  const anchors = specialties.map((specialty, index) => {
    const random = seededRandom(specialty.slug);
    const theta = index * GOLDEN_ANGLE - Math.PI / 2 + (random() - 0.5) * 0.2;
    const radius = index === 0 ? 0 : 82 + Math.sqrt(index) * 62 + (random() - 0.5) * 20;
    const w = skillWidth(specialty);
    const h = 44;
    return {
      id: specialty.id,
      x: cx + Math.cos(theta) * radius,
      y: cy + Math.sin(theta) * radius * 0.62,
      w,
      h,
      labelX: 0,
      labelY: 0,
      labelAnchor: 'middle' as const,
    };
  });

  for (let iteration = 0; iteration < SKILL_RELAX_ITERATIONS; iteration += 1) {
    for (let i = 0; i < anchors.length; i += 1) {
      const a = anchors[i];
      for (let j = i + 1; j < anchors.length; j += 1) {
        const b = anchors[j];
        const dx = b.x - a.x || 0.01;
        const dy = b.y - a.y || 0.01;
        const overlapX = (a.w + b.w) / 2 + 18 - Math.abs(dx);
        const overlapY = (a.h + b.h) / 2 + 18 - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;

        if (overlapX < overlapY) {
          const push = overlapX / 2;
          const direction = Math.sign(dx);
          a.x -= direction * push;
          b.x += direction * push;
        } else {
          const push = overlapY / 2;
          const direction = Math.sign(dy);
          a.y -= direction * push;
          b.y += direction * push;
        }
      }
    }

    for (const anchor of anchors) {
      anchor.x += (cx - anchor.x) * 0.012;
      anchor.y += (cy - anchor.y) * 0.012;
      anchor.x = clamp(anchor.x, cx - 310 + anchor.w / 2, cx + 310 - anchor.w / 2);
      anchor.y = clamp(anchor.y, cy - 185 + anchor.h / 2, cy + 185 - anchor.h / 2);
    }
  }

  return anchors;
}

/**
 * Compute one stable, readable view for roughly 2–20 people. Shared capabilities are
 * expected to be passed first (highest member count first). Unknown specialties are
 * ignored when edges are created.
 */
export function computeGraphLayout(
  specialties: GraphSpecialtyInput[],
  authors: GraphAuthorInput[],
): GraphLayout {
  const { width, height, cx, cy, rx, ry, padding } = GRAPH;
  const specialtyAnchors = placeSpecialties(specialties);
  const anchorById = new Map(specialtyAnchors.map((anchor) => [anchor.id, anchor]));
  const specialtyRank = new Map(specialties.map((specialty, index) => [specialty.id, index]));

  // Keep people who share a primary capability near one another on the perimeter. The
  // stable id tie-breaker makes the result deterministic.
  const orderedAuthors = [...authors].sort((a, b) => {
    const aRank = Math.min(...a.specialtyIds.map((id) => specialtyRank.get(id) ?? 999));
    const bRank = Math.min(...b.specialtyIds.map((id) => specialtyRank.get(id) ?? 999));
    return aRank - bRank || a.id.localeCompare(b.id);
  });

  const count = Math.max(1, orderedAuthors.length);
  const authorNodes = orderedAuthors.map((author, index) => {
    const random = seededRandom(author.id);
    const theta = -Math.PI / 2 + (index * Math.PI * 2) / count + (random() - 0.5) * 0.055;
    const radialJitter = (random() - 0.5) * 24;
    return {
      id: author.id,
      x: clamp(cx + Math.cos(theta) * (rx + radialJitter), padding, width - padding),
      y: clamp(cy + Math.sin(theta) * (ry + radialJitter * 0.55), padding, height - padding),
      r: nodeRadius(author),
    };
  });

  const authorById = new Map(authorNodes.map((author) => [author.id, author]));
  const edges: GraphEdge[] = [];

  for (const author of orderedAuthors) {
    const source = authorById.get(author.id);
    if (!source) continue;

    for (const specialtyId of author.specialtyIds) {
      const target = anchorById.get(specialtyId);
      if (!target) continue;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.hypot(dx, dy) || 1;
      const perpendicularX = -dy / distance;
      const perpendicularY = dx / distance;
      const direction = (hashSeed(`${author.id}:${specialtyId}`) & 1) === 0 ? -1 : 1;
      const bend = Math.min(34, distance * 0.07) * direction;
      const c1x = source.x + dx * 0.36 + perpendicularX * bend;
      const c1y = source.y + dy * 0.36 + perpendicularY * bend;
      const c2x = source.x + dx * 0.78 + perpendicularX * bend * 0.35;
      const c2y = source.y + dy * 0.78 + perpendicularY * bend * 0.35;

      edges.push({
        authorId: author.id,
        specialtyId,
        x1: source.x,
        y1: source.y,
        x2: target.x,
        y2: target.y,
        c1x,
        c1y,
        c2x,
        c2y,
        cx: (source.x + target.x) / 2 + perpendicularX * bend,
        cy: (source.y + target.y) / 2 + perpendicularY * bend,
      });
    }
  }

  return { width, height, specialtyAnchors, authorNodes, edges };
}
