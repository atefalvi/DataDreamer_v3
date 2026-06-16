/**
 * /api/guides/progress (v4.1) — server-backed Field Guide progress (09 §10).
 * POST upserts the current learner's `guide_progress` row and returns the freshly
 * derived progress. Auth comes from the session (locals.user); writes go through the
 * learner's token so Directus enforces own-row-only access. JSON only; requires the
 * `X-Requested-With` header (CSRF defence alongside SameSite=Lax cookies).
 */
import type { APIRoute } from 'astro';
import { guidesRepo } from '../../../lib/repositories';
import { deriveProgress, flattenItems } from '../../../lib/guides/progress';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
  });

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: 'unauthorized' }, 401);
  if (request.headers.get('X-Requested-With') !== 'fetch') return json({ error: 'forbidden' }, 403);

  let payload: { guide?: string; completedItemIds?: unknown; lastItemId?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  const slug = typeof payload.guide === 'string' ? payload.guide : '';
  const submitted = Array.isArray(payload.completedItemIds)
    ? payload.completedItemIds.filter((id): id is string => typeof id === 'string')
    : [];
  const lastItemId = typeof payload.lastItemId === 'string' ? payload.lastItemId : undefined;
  if (!slug) return json({ error: 'bad_request' }, 400);

  const guide = await guidesRepo.readerBySlug(slug, user.accessToken);
  if (!guide) return json({ error: 'not_found' }, 404);

  // Prune against the live item set so percent/status stay honest.
  const items = flattenItems(guide).map((i) => ({ id: i.id, estimatedMinutes: i.estimatedMinutes }));
  const validIds = new Set(items.map((i) => i.id));
  const completedItemIds = submitted.filter((id) => validIds.has(id));
  const last = lastItemId && validIds.has(lastItemId) ? lastItemId : undefined;
  const derived = deriveProgress(items, { completedItemIds, lastItemId: last });

  const now = new Date().toISOString();
  try {
    await guidesRepo.saveProgress(user.accessToken, user.id, guide.id, {
      completed_items: completedItemIds,
      last_item: last ?? null,
      status: derived.status,
      percent: derived.percent,
      completed_at: derived.status === 'completed' ? now : null,
    });
  } catch (error) {
    console.error('[guides/progress] save failed:', error instanceof Error ? error.message : error);
    return json({ error: 'save_failed' }, 502);
  }

  return json({ ok: true, progress: derived });
};
