/**
 * Shared taxonomy for posts, projects, and guides. Counts are tallied from lean
 * relation-only queries so topic navigation stays useful across content types.
 */
import { readItems } from '@directus/sdk';
import { directus, directusForService } from '../directus/client';
import type { SdkFields as Fields } from '../directus/client';
import { guard } from './errors';
import { mapTopic, mapTopicRef } from './_mappers';
import type { GuideRow, PostRow, ProjectRow, TopicRow } from '../directus/schema';
import type { Topic, TopicRef } from '../../types/content';

const PUBLISHED = { status: { _eq: 'published' } } as const;


export interface TopicWithCount {
  topic: TopicRef;
  count: number;
}

export interface TopicSitemapItem {
  slug: string;
  updatedAt?: Date;
}

/** Published topics that resolve to a non-empty public topic page. */
export async function sitemap(): Promise<TopicSitemapItem[]> {
  const service = directusForService();
  const [topics, posts, projects, guides] = await Promise.all([
    guard('topics.sitemap.topics', () =>
      directus.request<TopicRow[]>(
        readItems('topics', {
          filter: PUBLISHED,
          sort: ['slug'],
          limit: 1000,
          fields: ['slug', 'date_updated'] as Fields,
        }),
      ),
    ),
    guard('topics.sitemap.posts', () =>
      directus.request<PostRow[]>(
        readItems('posts', {
          filter: PUBLISHED,
          limit: -1,
          fields: [
            'published_at',
            'date_updated',
            'topics.topics_id.slug',
          ] as Fields,
        }),
      ),
    ),
    guard('topics.sitemap.projects', () =>
      directus.request<ProjectRow[]>(
        readItems('projects', {
          filter: { ...PUBLISHED, noindex: { _neq: true } },
          limit: -1,
          fields: ['published_at', 'date_updated', 'topics.topics_id.slug'] as Fields,
        }),
      ),
    ),
    guard('topics.sitemap.guides', () =>
      service.request<GuideRow[]>(
        readItems('guides', {
          filter: { ...PUBLISHED, noindex: { _neq: true } },
          limit: -1,
          fields: ['published_at', 'date_created', 'date_updated', 'topics.topics_id.slug'] as Fields,
        }),
      ),
    ),
  ]);

  const latestByTopic = new Map<string, Date>();
  for (const content of [...posts, ...projects, ...guides]) {
    const changed = new Date(content.date_updated ?? content.published_at ?? ('date_created' in content ? content.date_created : null) ?? 0);
    if (Number.isNaN(changed.getTime())) continue;
    for (const link of content.topics ?? []) {
      const topic = link.topics_id;
      if (!topic || typeof topic === 'string') continue;
      const current = latestByTopic.get(topic.slug);
      if (!current || changed > current) latestByTopic.set(topic.slug, changed);
    }
  }

  return topics
    .filter((topic) => latestByTopic.has(topic.slug))
    .map((topic) => ({
      slug: topic.slug,
      updatedAt: latestDate(topic.date_updated, latestByTopic.get(topic.slug)),
    }));
}

function latestDate(topicUpdated: string | null | undefined, contentUpdated: Date | undefined): Date | undefined {
  const topicDate = topicUpdated ? new Date(topicUpdated) : undefined;
  if (!topicDate || Number.isNaN(topicDate.getTime())) return contentUpdated;
  if (!contentUpdated) return topicDate;
  return topicDate > contentUpdated ? topicDate : contentUpdated;
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

/** Topics ordered by total published content across posts, projects, and guides. */
export async function withContentCounts(): Promise<TopicWithCount[]> {
  const service = directusForService();
  const [posts, projects, guides] = await Promise.all([
    guard('topics.contentCounts.posts', () => directus.request<PostRow[]>(
      readItems('posts', { filter: PUBLISHED, limit: -1, fields: ['topics.topics_id.name', 'topics.topics_id.slug'] as Fields }),
    )),
    guard('topics.contentCounts.projects', () => directus.request<ProjectRow[]>(
      readItems('projects', { filter: PUBLISHED, limit: -1, fields: ['topics.topics_id.name', 'topics.topics_id.slug'] as Fields }),
    )),
    guard('topics.contentCounts.guides', () => service.request<GuideRow[]>(
      readItems('guides', { filter: PUBLISHED, limit: -1, fields: ['topics.topics_id.name', 'topics.topics_id.slug'] as Fields }),
    )),
  ]);

  const tally = new Map<string, TopicWithCount>();
  for (const content of [...posts, ...projects, ...guides]) {
    for (const link of content.topics ?? []) {
      const topic = link.topics_id;
      if (!topic || typeof topic === 'string') continue;
      const current = tally.get(topic.slug);
      if (current) current.count += 1;
      else tally.set(topic.slug, { topic: { name: topic.name, slug: topic.slug }, count: 1 });
    }
  }
  return [...tally.values()].sort((a, b) => b.count - a.count || a.topic.name.localeCompare(b.topic.name));
}

/** Top `n` topics by total content count — used by the footer. */
export async function top(n = 5): Promise<TopicRef[]> {
  const counts = await withContentCounts();
  return counts.slice(0, n).map((c) => c.topic);
}
