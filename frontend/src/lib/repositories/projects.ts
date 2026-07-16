/**
 * Projects repository. Physical Directus collection `projects` (case studies / selected
 * work). List queries omit `body`; the detail query adds it. Mirrors `posts`.
 */
import { readItems } from '@directus/sdk';
import { directus } from '../directus/client';
import type { SdkFields as Fields } from '../directus/client';
import { guard } from './errors';
import { mapProject, mapProjectListItem } from './_mappers';
import type { ProjectRow } from '../directus/schema';
import type { Project, ProjectListItem } from '../../types/content';

export const PROJECT_LIST_FIELDS = [
  'id',
  'slug',
  'title',
  'summary',
  'year',
  'role',
  'featured',
  'sort',
  'date_updated',
  'published_at',
  'seo_title',
  'seo_description',
  'noindex',
  'tags',
  'topics.topics_id.name',
  'topics.topics_id.slug',
  'links',
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
] as const;

export const PROJECT_DETAIL_FIELDS = [...PROJECT_LIST_FIELDS, 'body'] as const;

const PUBLISHED = { status: { _eq: 'published' } } as const;

// SDK dotted-field arrays aren't generically typeable; cast at the call site only.

export interface ProjectListQuery {
  topic?: string;
  limit?: number;
}

/** Published projects in display order, optionally restricted to a shared topic. */
export async function list(query: ProjectListQuery = {}): Promise<ProjectListItem[]> {
  const filter = query.topic
    ? { ...PUBLISHED, topics: { topics_id: { slug: { _eq: query.topic } } } }
    : PUBLISHED;
  const rows = await guard('projects.list', () =>
    directus.request<ProjectRow[]>(
      readItems('projects', {
        filter,
        sort: ['sort', '-year'],
        limit: query.limit ?? -1,
        fields: PROJECT_LIST_FIELDS as Fields,
      }),
    ),
  );
  return rows.map(mapProjectListItem);
}

/** Full project by slug, or null if none / unpublished. */
export async function bySlug(slug: string): Promise<Project | null> {
  const rows = await guard('projects.bySlug', () =>
    directus.request<ProjectRow[]>(
      readItems('projects', {
        filter: { ...PUBLISHED, slug: { _eq: slug } },
        limit: 1,
        fields: PROJECT_DETAIL_FIELDS as Fields,
      }),
    ),
  );
  if (!rows.length) return null;
  return mapProject(rows[0]);
}

export interface ProjectSitemapItem {
  slug: string;
  updatedAt?: Date;
}

/** Lightweight published-project records for sitemap generation. */
export async function sitemap(): Promise<ProjectSitemapItem[]> {
  const rows = await guard('projects.sitemap', () =>
    directus.request<ProjectRow[]>(
      readItems('projects', {
        filter: { ...PUBLISHED, noindex: { _neq: true } },
        sort: ['slug'],
        limit: 1000,
        fields: ['slug', 'date_updated'] as Fields,
      }),
    ),
  );
  return rows.map((row) => ({
    slug: row.slug,
    updatedAt: row.date_updated ? new Date(row.date_updated) : undefined,
  }));
}

/** Lightweight published-project lookup (list fields, no body) — OG cards. */
export async function cardBySlug(slug: string): Promise<ProjectListItem | null> {
  const rows = await guard('projects.cardBySlug', () =>
    directus.request<ProjectRow[]>(
      readItems('projects', {
        filter: { status: { _eq: 'published' }, slug: { _eq: slug } },
        limit: 1,
        fields: PROJECT_LIST_FIELDS as Fields,
      }),
    ),
  );
  return rows.length ? mapProjectListItem(rows[0]) : null;
}
