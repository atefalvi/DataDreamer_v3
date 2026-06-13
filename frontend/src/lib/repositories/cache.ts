/**
 * Per-request memoization (09 §4.3).
 *
 * Keyed on a per-request object (pass `Astro.locals`) so repeated reads inside one
 * SSR render — e.g. footer topics rendered on every page — hit the network once.
 * Cross-request caching is delegated to HTTP/edge caching (09 §8); we deliberately
 * keep no process-wide TTL cache so multi-instance deploys stay consistent.
 */
const store = new WeakMap<object, Map<string, Promise<unknown>>>();

export function cachedPerRequest<T>(
  scope: object,
  key: string,
  load: () => Promise<T>,
): Promise<T> {
  let bucket = store.get(scope);
  if (!bucket) {
    bucket = new Map();
    store.set(scope, bucket);
  }
  const existing = bucket.get(key);
  if (existing) return existing as Promise<T>;

  const pending = load();
  bucket.set(key, pending);
  // If the load rejects, drop it so a later attempt can retry within the request.
  void pending.catch(() => bucket!.delete(key));
  return pending;
}
