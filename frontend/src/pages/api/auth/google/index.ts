import type { APIRoute } from 'astro';
import { googleStartUrl, rememberOAuthNext } from '../../../../lib/auth/session';

export const GET: APIRoute = ({ cookies, redirect, url }) => {
  rememberOAuthNext(cookies, url.searchParams.get('next'));
  const response = redirect(googleStartUrl(), 302);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
};
