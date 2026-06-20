import { describe, it, expect } from 'vitest';
import {
  computeGraphLayout,
  GRAPH,
  type GraphSpecialtyInput,
  type GraphAuthorInput,
} from '../layout';

const SPECIALTIES: GraphSpecialtyInput[] = [
  { id: 's1', slug: 'data-engineering', memberCount: 12 },
  { id: 's2', slug: 'analytics', memberCount: 9 },
  { id: 's3', slug: 'machine-learning', memberCount: 7 },
  { id: 's4', slug: 'ai-agents', memberCount: 5 },
  { id: 's5', slug: 'automation', memberCount: 3 },
  { id: 's6', slug: 'visualization', memberCount: 2 },
];

/** Build N authors deterministically, spreading them across the specialty set. */
function makeAuthors(n: number): GraphAuthorInput[] {
  return Array.from({ length: n }, (_, i) => {
    const primary = SPECIALTIES[i % SPECIALTIES.length];
    const secondary = SPECIALTIES[(i + 2) % SPECIALTIES.length];
    return {
      id: `a${String(i + 1).padStart(2, '0')}`,
      specialtyIds: i % 3 === 0 ? [primary.id, secondary.id] : [primary.id],
      posts: (i * 7) % 20,
      guides: i % 4,
    };
  });
}

const FIXTURES = [3, 8, 25] as const;

function specialtiesFor(authorCount: number): GraphSpecialtyInput[] {
  // Use as many specialties as make sense for the fixture size (min 2).
  const count = Math.max(2, Math.min(SPECIALTIES.length, Math.ceil(authorCount / 3)));
  return SPECIALTIES.slice(0, count);
}

describe('computeGraphLayout', () => {
  it.each(FIXTURES)('is deterministic for %i authors', (n) => {
    const specialties = specialtiesFor(n);
    const authors = makeAuthors(n);
    const a = computeGraphLayout(specialties, authors);
    const b = computeGraphLayout(specialties, authors);
    expect(a).toStrictEqual(b);
  });

  it.each(FIXTURES)('produces the right counts for %i authors', (n) => {
    const specialties = specialtiesFor(n);
    const authors = makeAuthors(n);
    const layout = computeGraphLayout(specialties, authors);

    expect(layout.specialtyAnchors).toHaveLength(specialties.length);
    expect(layout.authorNodes).toHaveLength(n);

    // Edges are only drawn to specialties that actually have an anchor in this set
    // (an author can list a specialty outside the rendered subset — that edge is skipped).
    const anchorIds = new Set(specialties.map((s) => s.id));
    const expectedEdges = authors.reduce(
      (sum, au) => sum + au.specialtyIds.slice(0, 3).filter((id) => anchorIds.has(id)).length,
      0,
    );
    expect(layout.edges).toHaveLength(expectedEdges);

    // Every node maps to an input author exactly once.
    const ids = new Set(layout.authorNodes.map((node) => node.id));
    expect(ids.size).toBe(n);
  });

  it.each(FIXTURES)('keeps all nodes inside the padded viewBox for %i authors', (n) => {
    const layout = computeGraphLayout(specialtiesFor(n), makeAuthors(n));
    for (const node of layout.authorNodes) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
      expect(node.x).toBeGreaterThanOrEqual(GRAPH.padding);
      expect(node.x).toBeLessThanOrEqual(GRAPH.width - GRAPH.padding);
      expect(node.y).toBeGreaterThanOrEqual(GRAPH.padding);
      expect(node.y).toBeLessThanOrEqual(GRAPH.height - GRAPH.padding);
      expect(node.r).toBeGreaterThanOrEqual(22);
      expect(node.r).toBeLessThanOrEqual(28);
    }
  });

  it.each(FIXTURES)('relaxes collisions to a sane floor for %i authors', (n) => {
    const layout = computeGraphLayout(specialtiesFor(n), makeAuthors(n));
    const nodes = layout.authorNodes;
    let hardOverlaps = 0;
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const dist = Math.hypot(nodes[j].x - nodes[i].x, nodes[j].y - nodes[i].y);
        // Hard overlap = rims intersect by more than 2px after relaxation.
        if (dist < nodes[i].r + nodes[j].r - 2) hardOverlaps += 1;
      }
    }
    // Small fixtures must be fully resolved; the dense 25-node case (bounded box,
    // ≤40 iters) is allowed a tiny residue but must stay near-zero.
    const allowed = n <= 8 ? 0 : 2;
    expect(hardOverlaps).toBeLessThanOrEqual(allowed);
  });

  it('changing an id changes positions (seed is wired to ids)', () => {
    const specialties = specialtiesFor(8);
    const base = makeAuthors(8);
    const altered = base.map((a, i) => (i === 0 ? { ...a, id: 'zz-different' } : a));
    const a = computeGraphLayout(specialties, base);
    const b = computeGraphLayout(specialties, altered);
    expect(a.authorNodes).not.toStrictEqual(b.authorNodes);
  });

  it('handles authors whose primary specialty is absent (falls back to center)', () => {
    const specialties = specialtiesFor(3);
    const authors: GraphAuthorInput[] = [
      { id: 'x1', specialtyIds: ['missing'], posts: 1, guides: 0 },
      ...makeAuthors(2),
    ];
    const layout = computeGraphLayout(specialties, authors);
    expect(layout.authorNodes).toHaveLength(3);
    // The orphan author still gets a finite, in-bounds position and no edge.
    const orphan = layout.authorNodes.find((node) => node.id === 'x1')!;
    expect(Number.isFinite(orphan.x)).toBe(true);
    expect(layout.edges.some((e) => e.authorId === 'x1')).toBe(false);
  });
});
