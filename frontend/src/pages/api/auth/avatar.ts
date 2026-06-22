/** Authenticated, same-origin proxy for the current learner's private Directus avatar. */
import type { APIRoute } from 'astro';
import { directusServiceFetch } from '../../../lib/directus/client';

export const GET: APIRoute = async ({ locals }) => {
  const avatarId = locals.user?.avatarId;
  if (!avatarId) {
    return new Response(null, { status: 404, headers: { 'Cache-Control': 'private, no-store' } });
  }

  const asset = await directusServiceFetch(
    `/assets/${encodeURIComponent(avatarId)}?width=192&height=192&fit=cover&quality=84`,
  );
  if (!asset.ok || !asset.body) {
    return new Response(null, { status: asset.status === 404 ? 404 : 502, headers: { 'Cache-Control': 'private, no-store' } });
  }

  return new Response(asset.body, {
    status: 200,
    headers: {
      'Content-Type': asset.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
