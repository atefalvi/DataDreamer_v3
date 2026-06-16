/**
 * POST /api/auth/signup — self-register a guide reader, then sign in. Requires Directus
 * registration enabled with default role = guide_reader (V4-AUTH-001 setup). If the
 * instance requires email verification, login won't succeed yet → send them to /login
 * with a "check your email" notice.
 */
import type { APIRoute } from 'astro';
import { register, login, setSession, safeNext } from '../../../lib/auth/session';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  const firstName = String(form.get('first_name') ?? '').trim() || undefined;
  const next = safeNext(String(form.get('next') ?? '') || null);
  const back = (reason: string) => redirect(`/signup?error=${reason}&next=${encodeURIComponent(next)}`, 303);

  if (!email || password.length < 8) return back('invalid');

  try {
    await register(email, password, firstName);
  } catch {
    return back('exists');
  }

  try {
    setSession(cookies, await login(email, password));
    return redirect(next, 303);
  } catch {
    // Account created but not yet usable (e.g. verification required).
    return redirect(`/login?registered=1&next=${encodeURIComponent(next)}`, 303);
  }
};
