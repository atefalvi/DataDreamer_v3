import { describe, expect, it } from 'vitest';
import { isTrustedRequestOrigin } from '../request';

const SITE = 'https://data-dreamer.net';

describe('isTrustedRequestOrigin', () => {
  it('accepts the public HTTPS origin behind an HTTP proxy', () => {
    const request = new Request('http://frontend:4321/api/auth/logout', {
      method: 'POST',
      headers: { origin: SITE },
    });
    expect(isTrustedRequestOrigin(request, SITE)).toBe(true);
  });

  it('accepts the forwarded public origin', () => {
    const request = new Request('http://frontend:4321/api/auth/logout', {
      method: 'POST',
      headers: {
        origin: 'https://staging.data-dreamer.net',
        'x-forwarded-host': 'staging.data-dreamer.net',
        'x-forwarded-proto': 'https',
      },
    });
    expect(isTrustedRequestOrigin(request, SITE)).toBe(true);
  });

  it('rejects missing and cross-site origins', () => {
    expect(isTrustedRequestOrigin(new Request('http://localhost:4321/api/auth/logout', { method: 'POST' }), SITE)).toBe(false);
    expect(isTrustedRequestOrigin(new Request('https://data-dreamer.net/api/auth/logout', {
      method: 'POST',
      headers: { origin: 'https://evil.example' },
    }), SITE)).toBe(false);
  });
});
