/**
 * Authors (Dream Team) repository. Query contracts: 08 §8.3–8.4.
 */
import { readItems } from '@directus/sdk';
import { directus } from '../directus/client';
import { guard } from './errors';
import { mapAuthor, mapAuthorSummary } from './_mappers';
import { countsByAuthorId } from './posts';
import type { AuthorRow } from '../directus/schema';
import type { Author, AuthorRef, AuthorSummary } from '../../types/content';

const SPECIALTY_SUBFIELDS = [
  'specialties.sort',
  'specialties.specialties_id.name',
  'specialties.specialties_id.slug',
  'specialties.specialties_id.color_key',
] as const;

const AVATAR_SUBFIELDS = [
  'avatar.id',
  'avatar.width',
  'avatar.height',
  'avatar.description',
] as const;

const AUTHOR_SUMMARY_FIELDS = [
  'id',
  'slug',
  'display_name',
  'role_title',
  'sort',
  ...AVATAR_SUBFIELDS,
  ...SPECIALTY_SUBFIELDS,
] as const;

const AUTHOR_DETAIL_FIELDS = [
  ...AUTHOR_SUMMARY_FIELDS,
  'bio',
  'statement',
  'links',
  'tools',
  'featured_work',
] as const;

const PUBLISHED = { status: { _eq: 'published' } } as const;
// v4.2 account model: only admin-approved profiles appear on the public Dream Team.
// Blog-author-only profiles (Contributors) stay off the team pages.
const TEAM = { ...PUBLISHED, dream_team: { _eq: true } } as const;

type Fields = any; // eslint-disable-line -- SDK dotted-field cast (09 §4.2)

/** All published authors with their published-post counts (graph + list). */
export async function allWithCounts(): Promise<AuthorSummary[]> {
  const [rows, counts] = await Promise.all([
    guard('authors.allWithCounts', () =>
      directus.request<AuthorRow[]>(
        readItems('authors', {
          filter: TEAM,
          sort: ['sort', 'display_name'],
          fields: AUTHOR_SUMMARY_FIELDS as Fields,
        }),
      ),
    ),
    countsByAuthorId(),
  ]);
  return rows.map((row) => mapAuthorSummary(row, counts.get(row.id) ?? 0));
}

/** Compact avatar refs for the homepage team strip (05 §1). */
export async function forTeamStrip(limit = 8): Promise<AuthorRef[]> {
  const summaries = await allWithCounts();
  return summaries.slice(0, limit).map(({ slug, name, avatar }) => ({ slug, name, avatar }));
}

/** Full author by slug, or null if none / unpublished. */
export async function bySlug(slug: string): Promise<Author | null> {
  const rows = await guard('authors.bySlug', () =>
    directus.request<AuthorRow[]>(
      readItems('authors', {
        filter: { ...TEAM, slug: { _eq: slug } },
        limit: 1,
        fields: AUTHOR_DETAIL_FIELDS as Fields,
      }),
    ),
  );
  if (!rows.length) return null;
  const counts = await countsByAuthorId();
  return mapAuthor(rows[0], counts.get(rows[0].id) ?? 0);
}

/** Up to `limit` other authors sharing a specialty with the given author. */
export async function related(author: Author, limit = 3): Promise<AuthorSummary[]> {
  const specialtySlugs = author.specialties.map((s) => s.slug);
  if (!specialtySlugs.length) return [];
  const [rows, counts] = await Promise.all([
    guard('authors.related', () =>
      directus.request<AuthorRow[]>(
        readItems('authors', {
          filter: {
            ...TEAM,
            slug: { _neq: author.slug },
            specialties: { specialties_id: { slug: { _in: specialtySlugs } } },
          },
          sort: ['sort', 'display_name'],
          limit,
          fields: AUTHOR_SUMMARY_FIELDS as Fields,
        }),
      ),
    ),
    countsByAuthorId(),
  ]);
  return rows.map((row) => mapAuthorSummary(row, counts.get(row.id) ?? 0));
}
