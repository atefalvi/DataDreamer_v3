import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

// Mock the SDK client so no network happens; repositories build queries and call
// `directus.request`, which we stub per test.
vi.mock('../../directus/client', () => ({
  directus: { request: vi.fn() },
  PUBLIC_DIRECTUS_URL: 'https://cms.test',
  DIRECTUS_URL: 'https://cms.test',
}));

import { directus } from '../../directus/client';
import * as postsRepo from '../posts';
import * as authorsRepo from '../authors';
import * as topicsRepo from '../topics';
import { POST_DETAIL_FIELDS, POST_LIST_FIELDS } from '../posts';
import { RepositoryError } from '../errors';
import type { AuthorRow, PostRow } from '../../directus/schema';

const request = directus.request as unknown as Mock;

beforeEach(() => {
  request.mockReset();
});

function postRow(overrides: Partial<PostRow> = {}): PostRow {
  return {
    id: 'p1',
    status: 'published',
    title: 'Retry patterns',
    slug: 'retry-patterns',
    excerpt: 'Four retry patterns.',
    published_at: '2026-05-12T09:00:00Z',
    featured: true,
    post_number: 14,
    series_label: 'Pipelines',
    author: {
      id: 'a1',
      status: 'published',
      slug: 'atef-alvi',
      display_name: 'Atef Alvi',
      role_title: 'Engineer',
      avatar: { id: 'av1', width: 512, height: 512, description: 'Portrait of Atef' },
    },
    cover_image: { id: 'cv1', width: 1600, height: 1000, description: 'Cover' },
    topics: [{ id: 't1', topics_id: { id: 'tt1', status: 'published', name: 'Data', slug: 'data' } }],
    ...overrides,
  };
}

describe('field discipline (08 §8.1)', () => {
  it('omits content from list fields and includes it in detail fields', () => {
    expect(POST_LIST_FIELDS).not.toContain('content');
    expect(POST_DETAIL_FIELDS).toContain('content');
  });
});

describe('postsRepo.list', () => {
  it('maps rows to view-models and detects another page via over-fetch', async () => {
    // pageSize 2 → over-fetch requests 3; return 3 to signal hasMore.
    request.mockResolvedValueOnce([postRow({ id: 'p1' }), postRow({ id: 'p2' }), postRow({ id: 'p3' })]);
    const result = await postsRepo.list({ pageSize: 2 });

    expect(result.items).toHaveLength(2);
    expect(result.hasMore).toBe(true);
    expect(result.items[0]).toMatchObject({
      slug: 'retry-patterns',
      title: 'Retry patterns',
      featured: true,
      postNumber: 14,
      author: { slug: 'atef-alvi', name: 'Atef Alvi' },
      topics: [{ name: 'Data', slug: 'data' }],
    });
    expect(result.items[0].publishedAt).toBeInstanceOf(Date);
    expect(result.items[0].coverImage?.src).toBe('https://cms.test/assets/cv1');
    expect(result.items[0].coverImage?.alt).toBe('Cover');
    // list items never carry the rendered body / reading time
    expect(result.items[0].readingMinutes).toBeUndefined();
  });

  it('returns an empty page when there are no posts', async () => {
    request.mockResolvedValueOnce([]);
    const result = await postsRepo.list();
    expect(result.items).toEqual([]);
    expect(result.hasMore).toBe(false);
  });

  it('throws a typed RepositoryError when the SDK fails', async () => {
    request.mockRejectedValue(new Error('network down'));
    await expect(postsRepo.list()).rejects.toMatchObject({
      name: 'RepositoryError',
      kind: 'fetch_failed',
    });
    await expect(postsRepo.list()).rejects.toBeInstanceOf(RepositoryError);
  });
});

describe('postsRepo.bySlug', () => {
  it('renders markdown body, headings and reading time', async () => {
    request.mockResolvedValueOnce([
      postRow({
        content: '# Title\n\nA paragraph.\n\n## Section\n\n:::tip Pro tip\nUse **gradient** checkpointing.\n:::',
      }),
    ]);
    const post = await postsRepo.bySlug('retry-patterns');
    expect(post).not.toBeNull();
    expect(post!.bodyHtml).toContain('callout callout--tip');
    // markdown inside the callout is rendered (the v4 pipeline fix)
    expect(post!.bodyHtml).toContain('<strong>gradient</strong>');
    expect(post!.headings.map((h) => h.text)).toContain('Section');
    expect(post!.readingMinutes).toBeGreaterThanOrEqual(1);
  });

  it('returns null when no published post matches', async () => {
    request.mockResolvedValueOnce([]);
    expect(await postsRepo.bySlug('missing')).toBeNull();
  });
});

describe('postsRepo.related', () => {
  it('falls back to latest (excluding the source) when no topic matches', async () => {
    const source = await (async () => {
      request.mockResolvedValueOnce([postRow({ content: 'body', topics: [] })]);
      return postsRepo.bySlug('retry-patterns');
    })();
    request.mockReset();
    request.mockResolvedValueOnce([postRow({ id: 'p2', slug: 'other' }), postRow({ id: 'p1', slug: 'retry-patterns' })]);
    const related = await postsRepo.related(source!, 3);
    expect(related.map((p) => p.slug)).toEqual(['other']);
  });
});

function authorRow(overrides: Partial<AuthorRow> = {}): AuthorRow {
  return {
    id: 'a1',
    status: 'published',
    slug: 'atef-alvi',
    display_name: 'Atef Alvi',
    role_title: 'Data & Analytics Engineer',
    bio: 'Builds **analytics** platforms.',
    statement: 'The data is the model.',
    avatar: { id: 'av1', width: 512, height: 512, description: 'Portrait' },
    links: [{ label: 'GitHub', url: 'https://github.com/atefalvi' }],
    tools: ['Python', 'Airflow'],
    featured_work: [{ title: 'Waterfall', url: 'https://data-dreamer.net/x' }],
    sort: 1,
    specialties: [
      { id: 's2', sort: 1, specialties_id: { id: 'sp2', status: 'published', name: 'Analytics', slug: 'analytics', color_key: 'viz-2' } },
      { id: 's1', sort: 0, specialties_id: { id: 'sp1', status: 'published', name: 'Data Engineering', slug: 'data-engineering', color_key: 'viz-1' } },
    ],
    ...overrides,
  };
}

describe('authorsRepo.allWithCounts', () => {
  it('joins authors with their published-post counts', async () => {
    request
      .mockResolvedValueOnce([authorRow()]) // readItems('authors')
      .mockResolvedValueOnce([{ author: 'a1', count: { id: 7 } }]); // aggregate
    const authors = await authorsRepo.allWithCounts();
    expect(authors).toHaveLength(1);
    expect(authors[0].postCount).toBe(7);
    // specialties ordered by junction sort → primary (Data Engineering) first
    expect(authors[0].specialties.map((s) => s.slug)).toEqual(['data-engineering', 'analytics']);
    expect(authors[0].courseCount).toBe(0);
  });
});

describe('authorsRepo.bySlug', () => {
  it('renders the bio and validates JSON fields', async () => {
    request
      .mockResolvedValueOnce([authorRow()]) // author
      .mockResolvedValueOnce([{ author: 'a1', count: { id: 3 } }]); // counts
    const author = await authorsRepo.bySlug('atef-alvi');
    expect(author!.bioHtml).toContain('<strong>analytics</strong>');
    expect(author!.links).toEqual([{ label: 'GitHub', url: 'https://github.com/atefalvi' }]);
    expect(author!.tools).toEqual(['Python', 'Airflow']);
    expect(author!.postCount).toBe(3);
  });

  it('drops malformed JSON link data instead of throwing', async () => {
    request
      .mockResolvedValueOnce([authorRow({ links: 'not-an-array', featured_work: [{ title: 'x' }] })])
      .mockResolvedValueOnce([]);
    const author = await authorsRepo.bySlug('atef-alvi');
    expect(author!.links).toEqual([]); // .catch([]) on bad data
    expect(author!.featuredWork).toEqual([]); // missing url → dropped
  });

  it('returns null for an unknown author', async () => {
    request.mockResolvedValueOnce([]);
    expect(await authorsRepo.bySlug('nobody')).toBeNull();
  });
});

describe('topicsRepo.withPostCounts', () => {
  it('tallies and orders topics by post count', async () => {
    request.mockResolvedValueOnce([
      { topics: [{ id: 'x', topics_id: { name: 'Data', slug: 'data' } }] },
      { topics: [{ id: 'y', topics_id: { name: 'Data', slug: 'data' } }, { id: 'z', topics_id: { name: 'ML', slug: 'ml' } }] },
    ]);
    const counts = await topicsRepo.withPostCounts();
    expect(counts).toEqual([
      { topic: { name: 'Data', slug: 'data' }, count: 2 },
      { topic: { name: 'ML', slug: 'ml' }, count: 1 },
    ]);
  });

  it('propagates fetch failures as RepositoryError', async () => {
    request.mockRejectedValueOnce(new Error('boom'));
    await expect(topicsRepo.withPostCounts()).rejects.toBeInstanceOf(RepositoryError);
  });
});
