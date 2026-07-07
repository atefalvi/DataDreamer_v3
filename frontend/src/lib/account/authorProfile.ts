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

/** Distinct tools across all authors — the canonical pick-list (avoids "MS Excel" vs "Excel"). */
export async function toolSuggestions(): Promise<string[]> {
  const rows = await json<{ tools?: unknown }[]>('/items/authors?fields=tools&limit=200');
  const seen = new Map<string, string>(); // lower → canonical casing (first wins)
  for (const row of rows ?? []) {
    for (const tool of toolsSchema.parse(row.tools ?? [])) {
      const key = tool.toLowerCase();
      if (!seen.has(key)) seen.set(key, tool);
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

/** Canonicalize submitted tools against the shared list (case-insensitive reuse). */
export function canonicalizeTools(tools: string[], suggestions: string[]): string[] {
  const canon = new Map(suggestions.map((tool) => [tool.toLowerCase(), tool]));
  const out: string[] = [];
  for (const tool of tools) {
    const match = canon.get(tool.toLowerCase()) ?? tool;
    if (!out.some((existing) => existing.toLowerCase() === match.toLowerCase())) out.push(match);
  }
  return out;
}

function slugifyName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * Create-or-match proposed specialties. Case-insensitive name match reuses the
 * existing row (keeps the taxonomy deduped as the network grows); genuinely new
 * names are created with a rotating viz color. Returns the resolved ids.
 */
export async function resolveNewSpecialties(names: string[]): Promise<string[]> {
  if (!names.length) return [];
  const existing = await json<{ id: string | number; name: string }[]>(
    '/items/specialties?fields=id,name&limit=500',
  );
  const byName = new Map((existing ?? []).map((row) => [row.name.toLowerCase(), String(row.id)]));
  const ids: string[] = [];
  let count = (existing ?? []).length;
  for (const name of names) {
    const match = byName.get(name.toLowerCase());
    if (match) {
      ids.push(match);
      continue;
    }
    const res = await directusServiceFetch('/items/specialties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug: slugifyName(name), color_key: `viz-${(count % 6) + 1}` }),
    });
    if (res.ok) {
      const created = ((await res.json()) as { data: { id: string | number } }).data;
      ids.push(String(created.id));
      byName.set(name.toLowerCase(), String(created.id));
      count += 1;
    }
  }
  return ids;
}
