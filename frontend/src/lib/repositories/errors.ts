/**
 * Typed repository error. Pages decide how to react (08 §8, 09 §9):
 *  - `not_found`   → rewrite to /404 (the URL stays)
 *  - everything else (fetch/parse failures) → ErrorState section, or /500 for a
 *    page's primary fetch.
 * Decorative fetches (e.g. footer topics) may catch and ignore.
 */
export type RepositoryErrorKind = 'not_found' | 'fetch_failed' | 'invalid_data';

export class RepositoryError extends Error {
  readonly kind: RepositoryErrorKind;
  readonly context: string;

  constructor(kind: RepositoryErrorKind, context: string, options?: { cause?: unknown }) {
    super(`[${kind}] ${context}`, options);
    this.name = 'RepositoryError';
    this.kind = kind;
    this.context = context;
  }
}

/** Wrap an unknown thrown value from the SDK into a fetch_failed RepositoryError. */
export function asFetchFailure(context: string, cause: unknown): RepositoryError {
  if (cause instanceof RepositoryError) return cause;
  return new RepositoryError('fetch_failed', context, { cause });
}

/** Run a query, normalizing any SDK throw into a typed RepositoryError. */
export async function guard<T>(context: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (cause) {
    throw asFetchFailure(context, cause);
  }
}
