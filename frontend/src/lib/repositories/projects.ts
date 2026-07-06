/**
 * Projects repository. Physical Directus collection `projects` (case studies / selected
 * work). List queries omit `body`; the detail query adds it. Mirrors `posts`.
 */
import { readItems } from '@directus/sdk';
import { directus } from '../directus/client';
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
  'tags',
  'links',
  'cover_image.id',
  'cover_image.width',
  'cover_image.height',
  'cover_image.description',
  'author.slug',
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
type Fields = any; // eslint-disable-line

/** All published projects in display order (sort asc, then newest year). */
export async function list(): Promise<ProjectListItem[]> {
  const rows = await guard('projects.list', () =>
    directus.request<ProjectRow[]>(
      readItems('projects', {
        filter: PUBLISHED,
        sort: ['sort', '-year'],
        limit: -1,
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

/** Slugs + metadata for the sitemap. */
export async function sitemap(): Promise<ProjectListItem[]> {
  return list();
}
