import { describe, it, expect } from 'vitest';
import { safeNext } from '../session';

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
