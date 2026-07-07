/**
 * /api/account/author (v4.3) — the contributor's own public profile editor.
 *
 * Plain HTML form POST from /account?tab=author (no client JS required).
 * Security model (audit §11.5):
 *  - session verified by middleware (`locals.user`), CSRF by the same-origin check;
 *  - the target row is ALWAYS the profile linked to the verified account
 *    (`authors.user = me`, re-fetched fresh here) — no id is accepted from the client,
 *    so editing another author is structurally impossible;
 *  - the patch is built from an explicit allow-list (`parseAuthorForm`) — forbidden
 *    fields (user/status/dream_team/slug/sort/…) cannot pass through;
 *  - specialties are validated against the real `specialties` collection before the
 *    junction rows are replaced;
 *  - writes go through the server-only service token, whose Directus policy is also
 *    field-restricted to the same safe list — the app allow-list and the policy are
 *    two independent layers saying the same thing.
 */
import type { APIRoute } from 'astro';
import { fetchLinkedAuthor } from '../../../lib/auth/session';
import { parseAuthorForm } from '../../../lib/account/authorForm';
import { directusServiceFetch } from '../../../lib/directus/client';

const back = (params: string) =>
  new Response(null, {
    status: 303,
    headers: { Location: `/account?tab=author${params}`, 'Cache-Control': 'private, no-store' },
  });

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

  const { patch, specialtyIds, errors } = parseAuthorForm(form);
  if (errors.length) {
    return back(`&error=${encodeURIComponent(errors[0])}`);
  }

  // Validate specialties against the taxonomy before touching junction rows.
  let validSpecialtyIds: string[] = [];
  if (specialtyIds.length) {
    const res = await directusServiceFetch(
      `/items/specialties?filter[id][_in]=${specialtyIds.map(encodeURIComponent).join(',')}&fields=id&limit=50`,
    );
    if (res.ok) {
      const body = (await res.json()) as { data: { id: string | number }[] };
      const known = new Set(body.data.map((row) => String(row.id)));
      validSpecialtyIds = specialtyIds.filter((id) => known.has(id));
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
    `/items/authors_specialties?filter[authors_id][_eq]=${encodeURIComponent(author.id)}&fields=id&limit=100`,
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
