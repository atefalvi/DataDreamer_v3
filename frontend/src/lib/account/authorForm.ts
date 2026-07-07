/**
 * Author-profile form parsing (v4.3, audit §11.5). Pure so it's unit-testable.
 *
 * Converts the /account Author Profile HTML form into an explicit, allow-listed
 * Directus patch. Forbidden fields (user, status, dream_team, slug, sort, id, …)
 * can never pass through: the patch is BUILT from named fields, not filtered from
 * the request body. JSON fields are validated with the same zod schemas the
 * repositories use, and anything invalid degrades to a readable error, not a write.
 */
import { z } from 'zod';

// Stricter than the repo read-schemas: contributor-supplied URLs must be https
// (z.url() alone would accept javascript:/data: schemes).
const httpsUrl = z.url().startsWith('https://', 'URLs must start with https://');
const strictLinkSchema = z.object({ label: z.string().min(1), url: httpsUrl });
const strictFeaturedSchema = z.object({
  title: z.string().min(1),
  url: httpsUrl,
  description: z.string().optional(),
});

/** The only author columns a contributor may write from the website. */
export const SAFE_AUTHOR_FIELDS = [
  'display_name',
  'role_title',
  'bio',
  'statement',
  'links',
  'tools',
  'featured_work',
] as const;

export interface ParsedAuthorForm {
  patch: Record<string, unknown>;
  /** Selected specialty ids (junction rows are replaced separately). */
  specialtyIds: string[];
  errors: string[];
}

const displayNameSchema = z.string().trim().min(2, 'Display name is too short').max(80);
const shortText = (max: number) => z.string().trim().max(max);

/** "Label | https://url" per line → AuthorLink[]. Blank lines ignored. */
function parseLinkLines(raw: string, errors: string[]): { label: string; url: string }[] {
  const out: { label: string; url: string }[] = [];
  for (const line of raw.split('\n').map((l) => l.trim()).filter(Boolean)) {
    const [label, url] = line.split('|').map((part) => part.trim());
    const parsed = strictLinkSchema.safeParse({ label, url });
    if (!parsed.success) errors.push(`Link "${line.slice(0, 40)}" needs the form: Label | https://url`);
    else out.push(parsed.data);
  }
  return out;
}

/** "Title | https://url | optional description" per line → FeaturedWorkItem[] (max 2). */
function parseFeaturedLines(raw: string, errors: string[]): { title: string; url: string; description?: string }[] {
  const out: { title: string; url: string; description?: string }[] = [];
  for (const line of raw.split('\n').map((l) => l.trim()).filter(Boolean)) {
    const [title, url, ...rest] = line.split('|').map((part) => part.trim());
    const description = rest.join(' | ').trim() || undefined;
    const parsed = strictFeaturedSchema.safeParse({ title, url, description });
    if (!parsed.success) errors.push(`Featured work "${line.slice(0, 40)}" needs: Title | https://url | description`);
    else out.push(parsed.data);
  }
  if (out.length > 2) {
    errors.push('Featured work is limited to 2 items');
    return out.slice(0, 2);
  }
  return out;
}

export function parseAuthorForm(form: FormData): ParsedAuthorForm {
  const errors: string[] = [];
  const text = (name: string) => String(form.get(name) ?? '');

  const displayName = displayNameSchema.safeParse(text('display_name'));
  if (!displayName.success) errors.push(displayName.error.issues[0]?.message ?? 'Invalid display name');

  const roleTitle = shortText(80).safeParse(text('role_title'));
  const bio = shortText(6000).safeParse(text('bio'));
  const statement = shortText(600).safeParse(text('statement'));
  if (!roleTitle.success) errors.push('Role title is too long (80 max)');
  if (!bio.success) errors.push('Bio is too long (6000 max)');
  if (!statement.success) errors.push('Statement is too long (600 max)');

  const links = parseLinkLines(text('links'), errors);
  const featuredWork = parseFeaturedLines(text('featured_work'), errors);
  const tools = text('tools')
    .split(',')
    .map((tool) => tool.trim())
    .filter(Boolean)
    .slice(0, 20);

  const specialtyIds = form
    .getAll('specialties')
    .map((value) => String(value).trim())
    .filter((value) => /^[\w-]{1,64}$/.test(value));

  // The patch contains ONLY safe fields, constructed key by key.
  const patch: Record<string, unknown> = {
    display_name: displayName.success ? displayName.data : undefined,
    role_title: roleTitle.success ? roleTitle.data : undefined,
    bio: bio.success ? bio.data : undefined,
    statement: statement.success ? statement.data : undefined,
    links,
    tools,
    featured_work: featuredWork,
  };
  for (const key of Object.keys(patch)) {
    if (patch[key] === undefined) delete patch[key];
  }

  return { patch, specialtyIds, errors };
}
