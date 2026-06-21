/**
 * Learner auth — a thin, same-origin bridge to Directus (v4.1, 09 §10).
 *
 * We use Directus JSON auth mode: the Astro server exchanges credentials for an
 * access/refresh token pair and stores them in httpOnly cookies on the app's own origin
 * (no cross-subdomain cookie config needed). Middleware resolves the session per request,
 * refreshing transparently, and hands pages a `GuideReaderUser` with the access token so
 * Directus enforces the `guide_reader` policy on reads/writes.
 */
import type { AstroCookies } from 'astro';
import { DIRECTUS_URL, PUBLIC_DIRECTUS_URL } from '../directus/client';
import { SITE_URL } from '../seo/meta';

const ACCESS = 'dd_at';
const REFRESH = 'dd_rt';
const EXP = 'dd_at_exp';
// Directus sets this on .data-dreamer.net after OAuth (Google), shared with our app.
const SESSION = 'directus_session_token';
// Parent domain the Directus session cookie is scoped to, so we can clear it on logout
// (e.g. ".data-dreamer.net"). Unset in local dev → host-only.
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const REFRESH_SKEW_MS = 30_000;

const isProd = (process.env.NODE_ENV ?? import.meta.env.MODE) === 'production';

export function authCookieDomain(
  configuredDomain: string | undefined,
  siteUrl: string,
  production: boolean,
): string | undefined {
  if (configuredDomain?.trim()) return configuredDomain.trim();
  if (!production) return undefined;

  try {
    const hostname = new URL(siteUrl).hostname.toLowerCase();
    if (hostname === 'data-dreamer.net' || hostname.endsWith('.data-dreamer.net')) {
      return '.data-dreamer.net';
    }
  } catch {
    // A malformed SITE_URL must not broaden cookie scope.
  }

  return undefined;
}

const COOKIE_DOMAIN = authCookieDomain(
  process.env.AUTH_COOKIE_DOMAIN ?? (import.meta.env as Record<string, string | undefined>).AUTH_COOKIE_DOMAIN,
  SITE_URL,
  isProd,
);

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  /** Access-token lifetime in ms (Directus `expires`). */
  expires: number;
}

export interface SessionUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  accessToken: string;
}

export class AuthError extends Error {
  readonly status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

async function api<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    // Directus returns 400/401 with an errors[] array; don't leak specifics.
    throw new AuthError(`directus ${path} → ${res.status}`, res.status === 401 ? 401 : 400);
  }
  return (await res.json()) as T;
}

type LoginResponse = { data: { access_token: string; refresh_token: string; expires: number } };

function toTokens(data: LoginResponse['data']): SessionTokens {
  return { accessToken: data.access_token, refreshToken: data.refresh_token, expires: data.expires };
}

export async function login(email: string, password: string): Promise<SessionTokens> {
  const body = await api<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, mode: 'json' }),
  });
  return toTokens(body.data);
}

export async function refresh(refreshToken: string): Promise<SessionTokens> {
  const body = await api<LoginResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken, mode: 'json' }),
  });
  return toTokens(body.data);
}

export async function logout(refreshToken: string): Promise<void> {
  try {
    await api('/auth/logout', { method: 'POST', body: JSON.stringify({ refresh_token: refreshToken, mode: 'json' }) });
  } catch {
    // Best-effort; we clear cookies regardless.
  }
}

/** Public self-registration. Requires Directus registration enabled w/ default role = guide_reader. */
export async function register(email: string, password: string, firstName?: string): Promise<void> {
  await api('/users/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, first_name: firstName }),
  });
}

type MeResponse = { data: { id: string; email?: string; first_name?: string; last_name?: string } };

export async function fetchMe(accessToken: string): Promise<Omit<SessionUser, 'accessToken'>> {
  const body = await api<MeResponse>('/users/me?fields=id,email,first_name,last_name', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return {
    id: body.data.id,
    email: body.data.email ?? '',
    firstName: body.data.first_name ?? undefined,
    lastName: body.data.last_name ?? undefined,
  };
}

export function setSession(cookies: AstroCookies, tokens: SessionTokens): void {
  const base = { path: '/', httpOnly: true, secure: isProd, sameSite: 'lax' as const };
  cookies.set(ACCESS, tokens.accessToken, { ...base, maxAge: REFRESH_MAX_AGE });
  cookies.set(REFRESH, tokens.refreshToken, { ...base, maxAge: REFRESH_MAX_AGE });
  cookies.set(EXP, String(Date.now() + tokens.expires), { ...base, maxAge: REFRESH_MAX_AGE });
}

export function clearSession(cookies: AstroCookies): void {
  for (const name of [ACCESS, REFRESH, EXP]) cookies.delete(name, { path: '/' });
  // The Directus OAuth session cookie is domain-scoped — clear it with the domain so
  // Google sign-out actually ends the session (host-only delete wouldn't match it).
  cookies.delete(SESSION, { path: '/' });
  if (COOKIE_DOMAIN) cookies.delete(SESSION, { path: '/', domain: COOKIE_DOMAIN });
}

export function hasSessionCookie(cookies: AstroCookies): boolean {
  return Boolean(cookies.get(ACCESS)?.value || cookies.get(REFRESH)?.value || cookies.get(SESSION)?.value);
}

/** Browser → Directus Google OAuth; Directus returns to `next` with a session cookie. */
export function googleStartUrl(next: string | null | undefined): string {
  const redirect = `${SITE_URL}${safeNext(next)}`;
  return `${PUBLIC_DIRECTUS_URL}/auth/login/google?redirect=${encodeURIComponent(redirect)}`;
}

/**
 * Resolve the current learner from cookies — refreshing transparently when the access
 * token is missing/expired. Returns null (and clears cookies) on any failure.
 */
export async function resolveUser(cookies: AstroCookies): Promise<SessionUser | null> {
  let accessToken = cookies.get(ACCESS)?.value;
  const refreshToken = cookies.get(REFRESH)?.value;
  const exp = Number(cookies.get(EXP)?.value ?? 0);

  // Google/OAuth: no JSON-token cookies, but Directus left a session cookie. Use it
  // directly as the bearer token. ponytail: no server-side refresh of the Directus
  // session — the user re-auths when it expires (Directus session TTL).
  if (!accessToken && !refreshToken) {
    const session = cookies.get(SESSION)?.value;
    if (!session) return null;
    try {
      return { ...(await fetchMe(session)), accessToken: session };
    } catch {
      return null;
    }
  }

  const expired = !accessToken || Date.now() > exp - REFRESH_SKEW_MS;
  if (expired) {
    if (!refreshToken) {
      clearSession(cookies);
      return null;
    }
    try {
      const tokens = await refresh(refreshToken);
      setSession(cookies, tokens);
      accessToken = tokens.accessToken;
    } catch {
      clearSession(cookies);
      return null;
    }
  }

  try {
    const user = await fetchMe(accessToken!);
    return { ...user, accessToken: accessToken! };
  } catch {
    clearSession(cookies);
    return null;
  }
}

/** Only allow same-origin relative redirects (defends against open-redirect via `next`). */
export function safeNext(next: string | null | undefined, fallback = '/guides'): string {
  if (!next) return fallback;
  // Must be a path on this origin: single leading slash, no protocol-relative `//`,
  // no backslashes (browsers normalize `\`→`/`, so `/\evil.com` becomes `//evil.com`),
  // and no control chars (header-injection / CRLF).
  if (!next.startsWith('/') || next.startsWith('//') || /[\\\x00-\x1f]/.test(next)) return fallback;
  return next;
}
