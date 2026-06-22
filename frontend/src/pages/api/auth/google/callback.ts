import type { APIRoute } from 'astro';
import { takeOAuthNext } from '../../../../lib/auth/session';

export const GET: APIRoute = ({ cookies, locals, redirect, url }) => {
  const next = takeOAuthNext(cookies);
  const reason = url.searchParams.get('reason');

  if (reason) {
    const response = redirect(`/login?next=${encodeURIComponent(next)}&reason=${encodeURIComponent(reason)}`, 302);
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }

  if (!locals.user) {
    const response = redirect(`/login?next=${encodeURIComponent(next)}&error=oauth_session`, 302);
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }

  const response = redirect(next, 302);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
};
