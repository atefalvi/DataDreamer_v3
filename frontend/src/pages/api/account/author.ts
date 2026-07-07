/**
 * /api/account/author (v4.3) — the contributor's own public profile editor.
 *
 * Multipart HTML form POST from /account?tab=author (no client JS required).
 * Security model (audit §11.5):
 *  - session verified by middleware (`locals.user`), CSRF by the same-origin check;
 *  - the target row is ALWAYS the profile linked to the verified account
 *    (`authors.user = me`, re-fetched fresh here) — no id is accepted from the client,
 *    so editing another author is structurally impossible;
 *  - the patch is built from an explicit allow-list (`parseAuthorForm`) — forbidden
 *    fields (user/status/dream_team/sort/…) cannot pass through;
 *  - slug is contributor-editable but validated (format + uniqueness) — changing it
 *    moves their public profile URL, which is theirs to own;
 *  - avatar uploads are size/type-checked and stored via Directus files;
 *  - tools are canonicalized against the shared pick-list ("Excel" ≡ "excel");
 *  - proposed specialties are matched case-insensitively before any new row is
 *    created, keeping the taxonomy deduped;
 *  - writes go through the server-only service token, whose Directus policy is also
 *    field-restricted to the same safe list — two independent layers.
 */
import type { APIRoute } from 'astro';
import { fetchLinkedAuthor } from '../../../lib/auth/session';
import { parseAuthorForm } from '../../../lib/account/authorForm';
import {
  canonicalizeTools,
  resolveNewSpecialties,
  toolSuggestions,
} from '../../../lib/account/authorProfile';
import { directusServiceFetch } from '../../../lib/directus/client';

const back = (params: string) =>
  new Response(null, {
    status: 303,
    headers: { Location: `/account?tab=author${params}`, 'Cache-Control': 'private, no-store' },
  });

const AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

async function uploadAvatar(file: File, title: string): Promise<string | undefined> {
  const body = new FormData();
  body.append('title', `${title} avatar`);
  body.append('file', file, file.name || 'avatar');
  const res = await directusServiceFetch('/files', { method: 'POST', body });
  if (!res.ok) return undefined;
  const uploaded = ((await res.json()) as { data: { id: string } }).data;
  return uploaded.id;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(null, { status: 401 });

  // Fresh link check — never trust stale session enrichment for a write.
  const author = await fetchLinkedAuthor(user.id).catch(() => undefined);
  if (!author) return new Response('No linked author profile.', { status: 403 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response(null, { status: 400 });
  }

  const { patch, specialtyIds, newSpecialtyNames, errors } = parseAuthorForm(form);
  if (errors.length) {
    return back(`&error=${encodeURIComponent(errors[0])}`);
  }

  // Slug: only when actually changed, and only if nobody else holds it.
  if (typeof patch.slug === 'string' && patch.slug !== author.slug) {
    const clash = await directusServiceFetch(
      `/items/authors?filter[slug][_eq]=${encodeURIComponent(patch.slug)}&filter[id][_neq]=${encodeURIComponent(author.id)}&fields=id&limit=1`,
    );
    if (clash.ok && (((await clash.json()) as { data: unknown[] }).data.length > 0)) {
      return back(`&error=${encodeURIComponent(`The URL "${patch.slug}" is already taken — pick another`)}`);
    }
  } else {
    delete patch.slug;
  }

  // Avatar upload (optional): type + size checked, then stored as a Directus file.
  const avatarFile = form.get('avatar_file');
  if (avatarFile instanceof File && avatarFile.size > 0) {
    if (!AVATAR_TYPES.has(avatarFile.type)) {
      return back('&error=Avatar%20must%20be%20a%20JPEG%2C%20PNG%2C%20or%20WebP%20image');
    }
    if (avatarFile.size > AVATAR_MAX_BYTES) {
      return back('&error=Avatar%20must%20be%20under%205%20MB');
    }
    const fileId = await uploadAvatar(avatarFile, String(patch.display_name ?? author.slug));
    if (!fileId) return back('&error=Avatar%20upload%20failed');
    patch.avatar = fileId;
  }

  // Tools: reuse canonical casing from the shared pick-list.
  if (Array.isArray(patch.tools)) {
    patch.tools = canonicalizeTools(patch.tools as string[], await toolSuggestions().catch(() => []));
  }

  // Proposed specialties: match-or-create, then merge with the checked ids.
  const createdIds = await resolveNewSpecialties(newSpecialtyNames).catch(() => []);
  const allSpecialtyIds = [...new Set([...specialtyIds, ...createdIds])];

  // Validate every id against the taxonomy before touching junction rows.
  let validSpecialtyIds: string[] = [];
  if (allSpecialtyIds.length) {
    const res = await directusServiceFetch(
      `/items/specialties?filter[id][_in]=${allSpecialtyIds.map(encodeURIComponent).join(',')}&fields=id&limit=100`,
    );
    if (res.ok) {
      const body = (await res.json()) as { data: { id: string | number }[] };
      const known = new Set(body.data.map((row) => String(row.id)));
      validSpecialtyIds = allSpecialtyIds.filter((id) => known.has(id));
    }
  }

  const update = await directusServiceFetch(`/items/authors/${encodeURIComponent(author.id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!update.ok) {
    console.error('[account/author] profile update failed:', update.status);
    return back('&error=Could%20not%20save%20profile');
  }

  // Replace the specialty junction rows (sort = selection order).
  const existing = await directusServiceFetch(
    `/items/authors_specialties?filter[authors_id][_eq]=${encodeURIComponent(author.id)}&fields=id&limit=200`,
  );
  if (existing.ok) {
    const rows = ((await existing.json()) as { data: { id: number }[] }).data;
    if (rows.length) {
      await directusServiceFetch('/items/authors_specialties', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows.map((row) => row.id)),
      });
    }
  }
  for (const [index, specialtyId] of validSpecialtyIds.entries()) {
    await directusServiceFetch('/items/authors_specialties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authors_id: author.id, specialties_id: specialtyId, sort: index + 1 }),
    });
  }

  return back('&saved=1');
};
