/**
 * V4-DT-001 — Dream Team graph layout (07 §5.2). A pure, deterministic function that
 * computes SVG positions for the team "constellation". No DOM, no randomness beyond a
 * stable id-seeded PRNG, so the same input always yields the same output across builds
 * and requests (SSR-safe, snapshot-testable). UI lives in DT-002; this is layout only.
 */

/** Viewbox + ellipse constants (07 §5.2). */
export const GRAPH = {
  width: 1200,
  height: 760,
  cx: 600,
  cy: 380,
  rx: 420,
  ry: 250,
  padding: 60,
} as const;

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈ 2.39996 rad
const MAX_EDGES_PER_AUTHOR = 3;
const RELAX_ITERATIONS = 40;
const COLLISION_GAP = 10; // min clear space between node rims before relax pushes

export interface GraphSpecialtyInput {
  id: string;
  /** Stable seed for anchor jitter. */
  slug: string;
  /** Used only for caller-side sort; layout assumes input is already sorted desc. */
  memberCount: number;
}

export interface GraphAuthorInput {
  id: string;
  /** Ordered; first entry is the primary specialty (drives cluster placement). */
  specialtyIds: string[];
  /** Published posts — feeds the weight (node radius). */
  posts: number;
  /** Guides taught — feeds the weight (node radius). */
  guides: number;
}

export interface SpecialtyAnchor {
  id: string;
  x: number;
  y: number;
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
  /** Quadratic control point (midpoint pushed 8% perpendicular). */
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

/** FNV-1a string hash → 32-bit seed for mulberry32. */
function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic PRNG seeded by a stable id/slug — identical every run. */
function seededRandom(seed: string): () => number {
  let a = hashSeed(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** weight = 1 + log(posts + guides + 1); radius = clamp(20 + weight*6, 22, 28). */
function nodeRadius(author: GraphAuthorInput): number {
  const weight = 1 + Math.log(author.posts + author.guides + 1);
  return clamp(20 + weight * 6, 22, 28);
}

/**
 * Compute the constellation layout. `specialties` must be pre-sorted by member count
 * (desc); `authors` order only affects tie-breaking and is normalised internally for
 * determinism.
 */
export function computeGraphLayout(
  specialties: GraphSpecialtyInput[],
  authors: GraphAuthorInput[],
): GraphLayout {
  const { width, height, cx, cy, rx, ry, padding } = GRAPH;
  const S = specialties.length;

  // 1. Specialty anchors on an ellipse, jittered ±6° by seeded PRNG(slug).
  const anchorById = new Map<string, SpecialtyAnchor>();
  const specialtyAnchors: SpecialtyAnchor[] = specialties.map((specialty, i) => {
    const jitter = (seededRandom(specialty.slug)() - 0.5) * 2 * ((6 * Math.PI) / 180);
    const theta = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(1, S) + jitter;
    const x = cx + Math.cos(theta) * rx;
    const y = cy + Math.sin(theta) * ry;

    // 6. Label anchor: pushed outward along the radial direction.
    const labelX = cx + Math.cos(theta) * (rx + 44);
    const labelY = cy + Math.sin(theta) * (ry + 30);
    const labelAnchor: SpecialtyAnchor['labelAnchor'] =
      labelX < cx - 40 ? 'end' : labelX > cx + 40 ? 'start' : 'middle';

    const anchor: SpecialtyAnchor = { id: specialty.id, x, y, labelX, labelY, labelAnchor };
    anchorById.set(specialty.id, anchor);
    return anchor;
  });

  // Fallback anchor (author with an unknown/empty primary specialty) = center.
  const centerAnchor: SpecialtyAnchor = {
    id: '',
    x: cx,
    y: cy,
    labelX: cx,
    labelY: cy,
    labelAnchor: 'middle',
  };

  // 2. Author nodes: primary-specialty anchor + golden-angle polar offset.
  //    Cluster index is the author's order *within* its primary specialty (sorted ids).
  const clusterCounters = new Map<string, number>();
  const orderedAuthors = [...authors].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const authorNodes: AuthorNode[] = orderedAuthors.map((author) => {
    const primaryId = author.specialtyIds[0] ?? '';
    const anchor = anchorById.get(primaryId) ?? centerAnchor;
    const clusterIndex = clusterCounters.get(primaryId) ?? 0;
    clusterCounters.set(primaryId, clusterIndex + 1);

    const radius = 70 + seededRandom(author.id)() * 80; // 70–150
    const angle = clusterIndex * GOLDEN_ANGLE;
    const x = clamp(anchor.x + Math.cos(angle) * radius, padding, width - padding);
    const y = clamp(anchor.y + Math.sin(angle) * radius, padding, height - padding);

    return { id: author.id, x, y, r: nodeRadius(author) };
  });

  // 4. Collision relaxation — deterministic order (sorted ids), ≤40 iterations.
  for (let iter = 0; iter < RELAX_ITERATIONS; iter += 1) {
    let moved = false;
    for (let i = 0; i < authorNodes.length; i += 1) {
      for (let j = i + 1; j < authorNodes.length; j += 1) {
        const a = authorNodes[i];
        const b = authorNodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.0001;
        const minDist = a.r + b.r + COLLISION_GAP;
        if (dist < minDist) {
          const overlap = (minDist - dist) / 2;
          const ux = dx / dist;
          const uy = dy / dist;
          a.x = clamp(a.x - ux * overlap, padding, width - padding);
          a.y = clamp(a.y - uy * overlap, padding, height - padding);
          b.x = clamp(b.x + ux * overlap, padding, width - padding);
          b.y = clamp(b.y + uy * overlap, padding, height - padding);
          moved = true;
        }
      }
    }
    if (!moved) break;
  }

  const nodeById = new Map(authorNodes.map((n) => [n.id, n]));

  // 5. Edges: author → up to 3 of their specialty anchors, as quadratic curves.
  const edges: GraphEdge[] = [];
  for (const author of orderedAuthors) {
    const node = nodeById.get(author.id);
    if (!node) continue;
    for (const specialtyId of author.specialtyIds.slice(0, MAX_EDGES_PER_AUTHOR)) {
      const anchor = anchorById.get(specialtyId);
      if (!anchor) continue;
      const mx = (node.x + anchor.x) / 2;
      const my = (node.y + anchor.y) / 2;
      const dx = anchor.x - node.x;
      const dy = anchor.y - node.y;
      const len = Math.hypot(dx, dy) || 1;
      // Perpendicular offset = 8% of edge length.
      const cx2 = mx + (-dy / len) * len * 0.08;
      const cy2 = my + (dx / len) * len * 0.08;
      edges.push({
        authorId: author.id,
        specialtyId,
        x1: node.x,
        y1: node.y,
        x2: anchor.x,
        y2: anchor.y,
        cx: cx2,
        cy: cy2,
      });
    }
  }

  return { width, height, specialtyAnchors, authorNodes, edges };
}
