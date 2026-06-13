/**
 * Row → view-model mappers shared across repositories. No repository imports another
 * repository's internals; shared mapping lives here (09 §4.4).
 */
import { renderMarkdown } from '../markdown';
import { toImageRef } from '../images';
import {
  authorLinksSchema,
  featuredWorkSchema,
  toolsSchema,
} from '../validation/schemas';
import type {
  AuthorRow,
  PostRow,
  PostTopicRow,
  SpecialtyRow,
  TopicRow,
} from '../directus/schema';
import type {
  Author,
  AuthorRef,
  AuthorSummary,
  Post,
  PostListItem,
  SpecialtyRef,
  Topic,
  TopicRef,
} from '../../types/content';

function asObject<T>(relation: T | string | null | undefined): T | undefined {
  return relation && typeof relation === 'object' ? (relation as T) : undefined;
}

export function mapTopic(row: TopicRow): Topic {
  return { name: row.name, slug: row.slug, description: row.description ?? undefined };
}

export function mapTopicRef(row: TopicRow): TopicRef {
  return { name: row.name, slug: row.slug };
}

function mapPostTopics(topics: PostTopicRow[] | undefined): TopicRef[] {
  if (!topics) return [];
  return topics
    .map((t) => asObject<TopicRow>(t.topics_id))
    .filter((t): t is TopicRow => Boolean(t))
    .map(mapTopicRef);
}

export function mapSpecialtyRef(row: SpecialtyRow): SpecialtyRef {
  return { name: row.name, slug: row.slug, colorKey: row.color_key ?? 'viz-1' };
}

function mapAuthorRef(row: AuthorRow | undefined): AuthorRef {
  if (!row) return { slug: 'unknown', name: 'DataDreamer' };
  return {
    slug: row.slug,
    name: row.display_name,
    avatar: toImageRef(row.avatar, row.display_name),
  };
}

/** Author specialties, ordered by junction `sort` (first = primary, 07 §5.2). */
function mapAuthorSpecialties(row: AuthorRow): SpecialtyRef[] {
  const links = [...(row.specialties ?? [])].sort(
    (a, b) => (a.sort ?? 0) - (b.sort ?? 0),
  );
  return links
    .map((link) => asObject<SpecialtyRow>(link.specialties_id))
    .filter((s): s is SpecialtyRow => Boolean(s))
    .map(mapSpecialtyRef);
}

export function mapPostListItem(row: PostRow): PostListItem {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? '',
    publishedAt: new Date(row.published_at ?? Date.now()),
    topics: mapPostTopics(row.topics),
    author: mapAuthorRef(asObject<AuthorRow>(row.author)),
    coverImage: toImageRef(row.cover_image, row.title),
    featured: Boolean(row.featured),
    seriesLabel: row.series_label ?? undefined,
    postNumber: row.post_number ?? undefined,
  };
}

export async function mapPost(row: PostRow): Promise<Post> {
  const { html, headings, readingMinutes } = await renderMarkdown(row.content ?? '');
  return {
    ...mapPostListItem(row),
    bodyHtml: html,
    headings,
    readingMinutes,
  };
}

export function mapAuthorSummary(row: AuthorRow, postCount: number): AuthorSummary {
  return {
    ...mapAuthorRef(row),
    roleTitle: row.role_title,
    specialties: mapAuthorSpecialties(row),
    postCount,
    courseCount: 0,
  };
}

export async function mapAuthor(row: AuthorRow, postCount: number): Promise<Author> {
  const { html } = await renderMarkdown(row.bio ?? '');
  return {
    ...mapAuthorSummary(row, postCount),
    bioHtml: html,
    statement: row.statement ?? undefined,
    links: authorLinksSchema.parse(row.links ?? []),
    tools: toolsSchema.parse(row.tools ?? []),
    featuredWork: featuredWorkSchema.parse(row.featured_work ?? []),
  };
}
