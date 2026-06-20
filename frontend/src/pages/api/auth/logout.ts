/**
 * POST /api/auth/logout — revoke the Directus session and clear cookies.
 */
import type { APIRoute } from 'astro';
import { logout, clearSession } from '../../../lib/auth/session';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const refreshToken = cookies.get('dd_rt')?.value;
  if (refreshToken) await logout(refreshToken);
  clearSession(cookies);
  return redirect('/', 303);
};
