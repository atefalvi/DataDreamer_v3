/**
 * Topics repository. Topics are a shared taxonomy for posts (v4.0) and guides
 * (v4.1) — 08 §3.4. Post counts are tallied in JS from a lean posts query, which is
 * cheaper and simpler than aggregating across the M2M junction at this content scale.
 */
import { readItems } from '@directus/sdk';
import { directus } from '../directus/client';
import type { SdkFields as Fields } from '../directus/client';
import { guard } from './errors';
import { mapTopic, mapTopicRef } from './_mappers';
import type { PostRow, TopicRow } from '../directus/schema';
import type { Topic, TopicRef } from '../../types/content';

const PUBLISHED = { status: { _eq: 'published' } } as const;


export interface TopicWithCount {
  topic: TopicRef;
  count: number;
}

export async function all(): Promise<TopicRef[]> {
  const rows = await guard('topics.all', () =>
    directus.request<TopicRow[]>(
      readItems('topics', { filter: PUBLISHED, sort: ['name'], fields: ['name', 'slug'] as Fields }),
    ),
  );
  return rows.map(mapTopicRef);
}

export async function bySlug(slug: string): Promise<Topic | null> {
  const rows = await guard('topics.bySlug', () =>
    directus.request<TopicRow[]>(
      readItems('topics', {
        filter: { ...PUBLISHED, slug: { _eq: slug } },
        limit: 1,
        fields: ['name', 'slug', 'description'] as Fields,
      }),
    ),
  );
  return rows.length ? mapTopic(rows[0]) : null;
}

/** Topics that have ≥1 published post, ordered by post count desc then name. */
export async function withPostCounts(): Promise<TopicWithCount[]> {
  const rows = await guard('topics.withPostCounts', () =>
    directus.request<PostRow[]>(
      readItems('posts', {
        filter: PUBLISHED,
        limit: -1,
        fields: ['topics.topics_id.name', 'topics.topics_id.slug'] as Fields,
      }),
    ),
  );

  const tally = new Map<string, TopicWithCount>();
  for (const post of rows) {
    for (const link of post.topics ?? []) {
      const t = link.topics_id;
      if (!t || typeof t === 'string') continue;
      const entry = tally.get(t.slug);
      if (entry) entry.count += 1;
      else tally.set(t.slug, { topic: { name: t.name, slug: t.slug }, count: 1 });
    }
  }

  return [...tally.values()].sort(
    (a, b) => b.count - a.count || a.topic.name.localeCompare(b.topic.name),
  );
}

/** Top `n` topics by post count — used by the footer (03 §2). */
export async function top(n = 5): Promise<TopicRef[]> {
  const counts = await withPostCounts();
  return counts.slice(0, n).map((c) => c.topic);
}
