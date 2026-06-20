/**
 * POST /api/auth/login — exchange credentials for a session (form-encoded, so the login
 * page works without JS). Redirects to a safe internal `next` on success.
 */
import type { APIRoute } from 'astro';
import { login, setSession, safeNext } from '../../../lib/auth/session';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  const next = safeNext(String(form.get('next') ?? '') || null);

  if (!email || !password) {
    return redirect(`/login?error=missing&next=${encodeURIComponent(next)}`, 303);
  }

  try {
    setSession(cookies, await login(email, password));
    return redirect(next, 303);
  } catch {
    return redirect(`/login?error=invalid&next=${encodeURIComponent(next)}`, 303);
  }
};
