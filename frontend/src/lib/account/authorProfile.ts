/**
 * Server-side data for the /account contributor tabs (v4.3). All reads go through the
 * service token AFTER the session is verified, scoped to the signed-in user's linked
 * profile — the same trust pattern as guide progress.
 */
import { directusServiceFetch } from '../directus/client';
import { authorLinksSchema, featuredWorkSchema, toolsSchema } from '../validation/schemas';

export interface EditableAuthorProfile {
  id: string;
  slug: string;
  displayName: string;
  roleTitle: string;
  bio: string;
  statement: string;
  avatarId?: string;
  linksText: string;
  toolsText: string;
  featuredWorkText: string;
  specialtyIds: string[];
  status: string;
  dreamTeam: boolean;
}

export interface SpecialtyOption {
  id: string;
  name: string;
}

export interface OwnPost {
  id: string;
  slug: string;
  title: string;
  status: string;
  publishedAt?: string;
}

async function json<T>(path: string): Promise<T | undefined> {
  const res = await directusServiceFetch(path);
  if (!res.ok) return undefined;
  return ((await res.json()) as { data: T }).data;
}

/** The linked profile, serialized into form-friendly shapes (textarea lines etc.). */
export async function authorForEdit(authorId: string): Promise<EditableAuthorProfile | undefined> {
  const row = await json<{
    id: string; slug: string; display_name: string; role_title?: string; bio?: string;
    statement?: string; avatar?: string | { id?: string }; links?: unknown; tools?: unknown;
    featured_work?: unknown; status: string; dream_team?: boolean;
    specialties?: { specialties_id: string | number | { id: string | number } }[];
  }>(`/items/authors/${encodeURIComponent(authorId)}?fields=id,slug,display_name,role_title,bio,statement,avatar,links,tools,featured_work,status,dream_team,specialties.specialties_id`);
  if (!row) return undefined;

  const links = authorLinksSchema.parse(row.links ?? []);
  const featured = featuredWorkSchema.parse(row.featured_work ?? []);
  const tools = toolsSchema.parse(row.tools ?? []);

  return {
    id: row.id,
    slug: row.slug,
    displayName: row.display_name ?? '',
    roleTitle: row.role_title ?? '',
    bio: row.bio ?? '',
    statement: row.statement ?? '',
    avatarId: typeof row.avatar === 'string' ? row.avatar : row.avatar?.id,
    linksText: links.map((l) => `${l.label} | ${l.url}`).join('\n'),
    toolsText: tools.join(', '),
    featuredWorkText: featured
      .map((w) => [w.title, w.url, w.description].filter(Boolean).join(' | '))
      .join('\n'),
    specialtyIds: (row.specialties ?? [])
      .map((s) => (typeof s.specialties_id === 'object' ? s.specialties_id?.id : s.specialties_id))
      .filter((id): id is string | number => id !== undefined && id !== null)
      .map(String),
    status: row.status,
    dreamTeam: Boolean(row.dream_team),
  };
}

export async function allSpecialties(): Promise<SpecialtyOption[]> {
  const rows = await json<{ id: string | number; name: string }[]>(
    '/items/specialties?fields=id,name&sort=name&limit=100',
  );
  return (rows ?? []).map((row) => ({ id: String(row.id), name: row.name }));
}

/** The contributor's own posts (drafts included): post.author.user = userId. */
export async function ownPosts(userId: string): Promise<OwnPost[]> {
  const query =
    `/items/posts?filter[author][user][_eq]=${encodeURIComponent(userId)}` +
    '&fields=id,slug,title,status,published_at&sort=-published_at&limit=100';
  const rows = await json<{ id: string; slug: string; title: string; status: string; published_at?: string }[]>(query);
  return (rows ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    publishedAt: row.published_at ?? undefined,
  }));
}
