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
import { DIRECTUS_URL, PUBLIC_DIRECTUS_URL, directusServiceFetch } from '../directus/client';
import { SITE_URL } from '../seo/meta';

const ACCESS = 'dd_at';
const REFRESH = 'dd_rt';
const EXP = 'dd_at_exp';
// Directus sets this on .data-dreamer.net after OAuth (Google), shared with our app.
const SESSION = 'directus_session_token';
const OAUTH_NEXT = 'dd_oauth_next';
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
  provider?: string;
  avatarId?: string;
  avatarUrl?: string;
  googlePictureUrl?: string;
  /**
   * Approved-contributor link (v4.3): set when an `authors` profile is linked to this
   * account (`authors.user = id`). Gates the /account Author Profile + Posts tabs —
   * the profile's existence, not the role name, is the frontend contract.
   */
  hasAuthorProfile: boolean;
  authorId?: string;
  authorSlug?: string;
  authorDisplayName?: string;
  /** Admin-approved Dream Team visibility (badge only — never editable here). */
  authorDreamTeam?: boolean;
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

type DirectusUserProfile = {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  provider?: string;
  avatar?: string | { id?: string };
  google_picture_url?: string;
};

type MeResponse = { data: Pick<DirectusUserProfile, 'id'> };
type ProfileResponse = { data: DirectusUserProfile };

export type LinkedAuthor = { id: string; slug: string; display_name?: string; status?: string; dream_team?: boolean };
type LinkedAuthorResponse = { data: LinkedAuthor[] };

function safeHttpsUrl(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function toSessionProfile(
  verifiedId: string,
  profile?: DirectusUserProfile,
  author?: LinkedAuthor,
): Omit<SessionUser, 'accessToken'> {
  const avatarId = typeof profile?.avatar === 'string' ? profile.avatar : profile?.avatar?.id;
  return {
    id: verifiedId,
    email: profile?.email ?? '',
    firstName: profile?.first_name ?? undefined,
    lastName: profile?.last_name ?? undefined,
    provider: profile?.provider ?? undefined,
    avatarId,
    avatarUrl: avatarId ? '/api/auth/avatar' : undefined,
    googlePictureUrl: safeHttpsUrl(profile?.google_picture_url),
    hasAuthorProfile: Boolean(author),
    authorId: author?.id,
    authorSlug: author?.slug,
    authorDisplayName: author?.display_name,
    authorDreamTeam: author?.dream_team === true,
  };
}

async function fetchServerProfile(id: string): Promise<DirectusUserProfile | undefined> {
  const fields = 'id,email,first_name,last_name,provider,avatar,google_picture_url';
  const response = await directusServiceFetch(`/users/${encodeURIComponent(id)}?fields=${fields}`);
  if (!response.ok) return undefined;
  const body = (await response.json()) as ProfileResponse;
  return body.data;
}

/** The author profile linked to this verified account, if any (approved contributor). */
export async function fetchLinkedAuthor(userId: string): Promise<LinkedAuthor | undefined> {
  const query = `/items/authors?filter[user][_eq]=${encodeURIComponent(userId)}&fields=id,slug,display_name,status,dream_team&limit=1`;
  const response = await directusServiceFetch(query);
  if (!response.ok) return undefined;
  const body = (await response.json()) as LinkedAuthorResponse;
  return body.data?.[0];
}

export async function fetchMe(accessToken: string): Promise<Omit<SessionUser, 'accessToken'>> {
  // The learner token proves identity but intentionally has no broad user-directory
  // access. The server credential enriches only that already-verified user id.
  const body = await api<MeResponse>('/users/me?fields=id', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const [profile, author] = await Promise.all([
    fetchServerProfile(body.data.id).catch(() => undefined),
    fetchLinkedAuthor(body.data.id).catch(() => undefined),
  ]);
  if (!profile) {
    console.warn('[auth] profile enrichment unavailable; check Guide Server user-read policy');
  }
  return toSessionProfile(body.data.id, profile, author);
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

/**
 * Browser → Directus Google OAuth. Directus always returns to one fixed callback so its
 * redirect allow-list can remain exact. The intended guide path lives in a short-lived,
 * HttpOnly app cookie and is restored by the callback.
 */
export function googleStartUrl(): string {
  const redirect = `${SITE_URL}/api/auth/google/callback`;
  return `${PUBLIC_DIRECTUS_URL}/auth/login/google?redirect=${encodeURIComponent(redirect)}`;
}

/** Persist the post-login destination without making it part of Directus' allow-list. */
export function rememberOAuthNext(cookies: AstroCookies, next: string | null | undefined): void {
  cookies.set(OAUTH_NEXT, safeNext(next), {
    path: '/api/auth/google',
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 60 * 10,
  });
}

/** Consume the one-time OAuth destination. */
export function takeOAuthNext(cookies: AstroCookies): string {
  const next = safeNext(cookies.get(OAUTH_NEXT)?.value);
  cookies.delete(OAUTH_NEXT, { path: '/api/auth/google' });
  return next;
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
