import { describe, it, expect } from 'vitest';
import { authCookieDomain, safeNext } from '../session';

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
