import { describe, expect, it, vi } from 'vitest';
import { cachedPerRequest } from '../cache';

describe('cachedPerRequest', () => {
  it('memoizes by key within the same scope', async () => {
    const scope = {};
    const load = vi.fn().mockResolvedValue('value');
    const [a, b] = await Promise.all([
      cachedPerRequest(scope, 'k', load),
      cachedPerRequest(scope, 'k', load),
    ]);
    expect(a).toBe('value');
    expect(b).toBe('value');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('does not share cache across scopes', async () => {
    const load = vi.fn().mockResolvedValue(1);
    await cachedPerRequest({}, 'k', load);
    await cachedPerRequest({}, 'k', load);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('drops a rejected entry so it can be retried', async () => {
    const scope = {};
    const load = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce('ok');
    await expect(cachedPerRequest(scope, 'k', load)).rejects.toThrow('fail');
    await expect(cachedPerRequest(scope, 'k', load)).resolves.toBe('ok');
    expect(load).toHaveBeenCalledTimes(2);
  });
});

describe('countsByAuthorId per-request memoization', () => {
  it('runs the aggregate once per scope', async () => {
    vi.resetModules();
    vi.doMock('../../directus/client', () => ({ directus: { request: vi.fn().mockResolvedValue([]) } }));
    const { countsByAuthorId } = await import('../posts');
    const { directus } = await import('../../directus/client');
    const scope = {};
    await Promise.all([countsByAuthorId(scope), countsByAuthorId(scope)]);
    await countsByAuthorId(scope);
    expect((directus.request as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
    await countsByAuthorId({}); // new scope → new request
    expect((directus.request as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(2);
    vi.doUnmock('../../directus/client');
  });
});
