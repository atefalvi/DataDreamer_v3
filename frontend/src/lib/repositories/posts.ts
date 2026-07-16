/**
 * Posts repository. The physical Directus collection is `posts` (08 §2.1).
 * Query contracts: 08 §8. List queries deliberately omit `content` (audit 02 §9).
 */
import { readItems, aggregate } from '@directus/sdk';
import { directus } from '../directus/client';
import type { SdkFields as Fields } from '../directus/client';
import { guard } from './errors';
import { cachedPerRequest } from './cache';
import { mapPost, mapPostListItem } from './_mappers';
import type { PostRow } from '../directus/schema';
import type { Post, PostListItem, PostListPage } from '../../types/content';

export const DEFAULT_PAGE_SIZE = 12;

/** List-card fields — note: no `content`. Exported for the field-discipline test. */
export const POST_LIST_FIELDS = [
  'id',
  'slug',
  'title',
  'excerpt',
  'published_at',
  'date_updated',
  'featured',
  'series_label',
  'post_number',
  'cover_image.id',
  'cover_image.width',
  'cover_image.height',
  'cover_image.description',
  'author.slug',
  'author.status',
  'author.dream_team',
  'author.display_name',
  'author.avatar.id',
  'author.avatar.width',
  'author.avatar.height',
  'author.avatar.description',
  'topics.topics_id.name',
  'topics.topics_id.slug',
] as const;

/** Article fields — list fields plus the markdown body. */
export const POST_DETAIL_FIELDS = [...POST_LIST_FIELDS, 'content'] as const;

const PUBLISHED = { status: { _eq: 'published' } } as const;

// SDK dotted-field arrays aren't generically typeable; cast at the call site only
// (the single documented `any` exception — 09 §4.2).

export interface PostListQuery {
  topic?: string;
  author?: string;
  page?: number;
  pageSize?: number;
}

export async function list(query: PostListQuery = {}): Promise<PostListPage> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

  const filter: Record<string, unknown> = { ...PUBLISHED };
  if (query.topic) filter.topics = { topics_id: { slug: { _eq: query.topic } } };
  if (query.author) filter.author = { slug: { _eq: query.author } };

  const rows = await guard('posts.list', () =>
    directus.request<PostRow[]>(
      readItems('posts', {
        filter,
        sort: ['-published_at'],
        limit: pageSize + 1, // over-fetch by one to detect another page
        offset: (page - 1) * pageSize,
        fields: POST_LIST_FIELDS as Fields,
      }),
    ),
  );

  const hasMore = rows.length > pageSize;
  const items = rows.slice(0, pageSize).map(mapPostListItem);
  return { items, page, pageSize, hasMore };
}

export async function latest(limit = 3): Promise<PostListItem[]> {
  const rows = await guard('posts.latest', () =>
    directus.request<PostRow[]>(
      readItems('posts', {
        filter: PUBLISHED,
        sort: ['-published_at'],
        limit,
        fields: POST_LIST_FIELDS as Fields,
      }),
    ),
  );
  return rows.map(mapPostListItem);
}

export async function sitemap(limit = 1000): Promise<PostListItem[]> {
  const rows = await guard('posts.sitemap', () =>
    directus.request<PostRow[]>(
      readItems('posts', {
        filter: PUBLISHED,
        sort: ['-published_at'],
        limit,
        fields: POST_LIST_FIELDS as Fields,
      }),
    ),
  );
  return rows.map(mapPostListItem);
}

/** Most recent featured post, falling back to the latest published post. */
export async function featuredOrLatest(): Promise<PostListItem | null> {
  const featured = await guard('posts.featuredOrLatest', () =>
    directus.request<PostRow[]>(
      readItems('posts', {
        filter: { ...PUBLISHED, featured: { _eq: true } },
        sort: ['-published_at'],
        limit: 1,
        fields: POST_LIST_FIELDS as Fields,
      }),
    ),
  );
  if (featured.length) return mapPostListItem(featured[0]);

  const [fallback] = await latest(1);
  return fallback ?? null;
}

export async function byAuthor(authorSlug: string, limit = 10): Promise<PostListItem[]> {
  const rows = await guard('posts.byAuthor', () =>
    directus.request<PostRow[]>(
      readItems('posts', {
        filter: { ...PUBLISHED, author: { slug: { _eq: authorSlug } } },
        sort: ['-published_at'],
        limit,
        fields: POST_LIST_FIELDS as Fields,
      }),
    ),
  );
  return rows.map(mapPostListItem);
}

/** Full article by slug. Returns null when no published post matches. */
export async function bySlug(slug: string): Promise<Post | null> {
  const rows = await guard('posts.bySlug', () =>
    directus.request<PostRow[]>(
      readItems('posts', {
        filter: { ...PUBLISHED, slug: { _eq: slug } },
        limit: 1,
        fields: POST_DETAIL_FIELDS as Fields,
      }),
    ),
  );
  if (!rows.length) return null;
  return mapPost(rows[0]);
}

/** Related by shared topic, falling back to latest. Excludes the source post. */
export async function related(post: Post, limit = 3): Promise<PostListItem[]> {
  const topicSlugs = post.topics.map((t) => t.slug);
  if (topicSlugs.length) {
    const rows = await guard('posts.related', () =>
      directus.request<PostRow[]>(
        readItems('posts', {
          filter: {
            ...PUBLISHED,
            slug: { _neq: post.slug },
            topics: { topics_id: { slug: { _in: topicSlugs } } },
          },
          sort: ['-published_at'],
          limit,
          fields: POST_LIST_FIELDS as Fields,
        }),
      ),
    );
    if (rows.length) return rows.map(mapPostListItem);
  }
  const fallback = await latest(limit + 1);
  return fallback.filter((p) => p.slug !== post.slug).slice(0, limit);
}

export async function neighbors(post: Post): Promise<{ next?: PostListItem; previous?: PostListItem }> {
  const publishedAt = post.publishedAt.toISOString();
  const newerFilter = { ...PUBLISHED, published_at: { _gt: publishedAt } } as never;
  const olderFilter = { ...PUBLISHED, published_at: { _lt: publishedAt } } as never;
  const [newerRows, olderRows] = await Promise.all([
    guard('posts.neighbors.newer', () =>
      directus.request<PostRow[]>(
        readItems('posts', {
          filter: newerFilter,
          sort: ['published_at'],
          limit: 1,
          fields: POST_LIST_FIELDS as Fields,
        }),
      ),
    ),
    guard('posts.neighbors.older', () =>
      directus.request<PostRow[]>(
        readItems('posts', {
          filter: olderFilter,
          sort: ['-published_at'],
          limit: 1,
          fields: POST_LIST_FIELDS as Fields,
        }),
      ),
    ),
  ]);

  return {
    next: newerRows[0] ? mapPostListItem(newerRows[0]) : undefined,
    previous: olderRows[0] ? mapPostListItem(olderRows[0]) : undefined,
  };
}

/**
 * Published post count grouped by author id (for author cards / graph).
 * Pass a per-request `scope` (e.g. `Astro.locals`) to memoize — dream-team profile
 * renders would otherwise run the identical aggregate 2-3x per request.
 */
export async function countsByAuthorId(scope?: object): Promise<Map<string, number>> {
  if (scope) return cachedPerRequest(scope, 'posts.countsByAuthorId', () => countsByAuthorId());
  const command = aggregate('posts' as never, {
    aggregate: { count: ['id'] },
    groupBy: ['author'],
    query: { filter: PUBLISHED },
  } as never);
  const rows = await guard('posts.countsByAuthorId', () =>
    directus.request<{ author: string | null; count: { id: number } }[]>(command as never),
  );
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.author) counts.set(String(row.author), Number(row.count?.id ?? 0));
  }
  return counts;
}

/** Lightweight published-post lookup (list fields, no content) — OG cards. */
export async function cardBySlug(slug: string): Promise<PostListItem | null> {
  const rows = await guard('posts.cardBySlug', () =>
    directus.request<PostRow[]>(
      readItems('posts', {
        filter: { ...PUBLISHED, slug: { _eq: slug } },
        limit: 1,
        fields: POST_LIST_FIELDS as Fields,
      }),
    ),
  );
  return rows.length ? mapPostListItem(rows[0]) : null;
}
