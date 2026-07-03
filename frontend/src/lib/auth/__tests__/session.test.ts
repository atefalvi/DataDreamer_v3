import { afterEach, describe, expect, it, vi } from 'vitest';

const directusServiceFetchMock = vi.hoisted(() => vi.fn());

vi.mock('../../directus/client', () => ({
  DIRECTUS_URL: 'https://api.example.com',
  PUBLIC_DIRECTUS_URL: 'https://api.example.com',
  directusServiceFetch: directusServiceFetchMock,
}));

import { authCookieDomain, fetchMe, googleStartUrl, safeNext, toSessionProfile } from '../session';

afterEach(() => {
  vi.restoreAllMocks();
  directusServiceFetchMock.mockReset();
});

describe('safeNext (open-redirect guard)', () => {
  it('allows same-origin paths', () => {
    expect(safeNext('/guides/learn-airflow')).toBe('/guides/learn-airflow');
    expect(safeNext('/account')).toBe('/account');
  });

  it('falls back for absent / non-path input', () => {
    expect(safeNext(null)).toBe('/guides');
    expect(safeNext('')).toBe('/guides');
    expect(safeNext('https://evil.com', '/x')).toBe('/x');
  });

  it('rejects protocol-relative and backslash bypasses', () => {
    expect(safeNext('//evil.com')).toBe('/guides');
    expect(safeNext('/\\evil.com')).toBe('/guides'); // browsers normalize \ → / → //evil.com
    expect(safeNext('/\t/evil')).toBe('/guides'); // control char
  });
});

describe('authCookieDomain', () => {
  it('uses an explicitly configured domain', () => {
    expect(authCookieDomain('.example.com', 'https://data-dreamer.net', true)).toBe('.example.com');
  });

  it('infers the shared DataDreamer domain in production', () => {
    expect(authCookieDomain(undefined, 'https://data-dreamer.net', true)).toBe('.data-dreamer.net');
    expect(authCookieDomain(undefined, 'https://staging.data-dreamer.net', true)).toBe('.data-dreamer.net');
  });

  it('keeps local and unrelated hosts scoped to the current host', () => {
    expect(authCookieDomain(undefined, 'http://127.0.0.1:4321', false)).toBeUndefined();
    expect(authCookieDomain(undefined, 'https://example.com', true)).toBeUndefined();
  });
});

describe('googleStartUrl', () => {
  it('uses one fixed callback without a dynamic learner destination', () => {
    const start = new URL(googleStartUrl());
    const redirect = new URL(start.searchParams.get('redirect') ?? '');
    expect(start.pathname).toBe('/auth/login/google');
    expect(redirect.pathname).toBe('/api/auth/google/callback');
    expect(redirect.search).toBe('');
  });
});

describe('toSessionProfile', () => {
  it('maps the server-enriched Directus profile to a private app avatar route', () => {
    expect(toSessionProfile('verified-user', {
      id: 'verified-user',
      email: 'maria.thehr@gmail.com',
      first_name: 'Maria',
      last_name: 'Khan',
      provider: 'google',
      avatar: { id: 'avatar-file' },
      google_picture_url: 'https://lh3.googleusercontent.com/a/photo',
      date_created: '2026-06-22T12:00:00Z',
    })).toEqual({
      id: 'verified-user',
      email: 'maria.thehr@gmail.com',
      firstName: 'Maria',
      lastName: 'Khan',
      provider: 'google',
      avatarId: 'avatar-file',
      avatarUrl: '/api/auth/avatar',
      googlePictureUrl: 'https://lh3.googleusercontent.com/a/photo',
      createdAt: '2026-06-22T12:00:00Z',
    });
  });

  it('uses a valid Google picture URL when no Directus avatar exists', () => {
    expect(toSessionProfile('verified-user', {
      id: 'verified-user',
      email: 'maria.thehr@gmail.com',
      provider: 'google',
      google_picture_url: 'https://lh3.googleusercontent.com/a/photo',
    })).toMatchObject({
      avatarId: undefined,
      avatarUrl: undefined,
      googlePictureUrl: 'https://lh3.googleusercontent.com/a/photo',
    });
  });

  it('ignores invalid or non-HTTPS Google picture URLs', () => {
    expect(toSessionProfile('verified-user', {
      id: 'verified-user',
      google_picture_url: 'http://lh3.googleusercontent.com/a/photo',
    }).googlePictureUrl).toBeUndefined();
    expect(toSessionProfile('verified-user', {
      id: 'verified-user',
      google_picture_url: 'not a url',
    }).googlePictureUrl).toBeUndefined();
  });

  it('keeps a verified session usable when profile enrichment is unavailable', () => {
    expect(toSessionProfile('verified-user')).toMatchObject({
      id: 'verified-user',
      email: '',
      avatarUrl: undefined,
    });
  });

  it('logs only a safe warning when profile enrichment fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ data: { id: 'verified-user' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    directusServiceFetchMock.mockResolvedValue(new Response(JSON.stringify({ errors: [{ message: 'Forbidden' }] }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(fetchMe('learner-token')).resolves.toMatchObject({
      id: 'verified-user',
      email: '',
    });
    expect(warn).toHaveBeenCalledWith('[auth] profile enrichment unavailable; check Guide Server user-read policy');
    expect(warn.mock.calls.flat().join(' ')).not.toContain('learner-token');
  });
});
