import { defineMiddleware } from 'astro:middleware';
import { RepositoryError } from './lib/repositories/errors';

const IS_STAGING =
  process.env.DEPLOY_ENV === 'staging' || import.meta.env.DEPLOY_ENV === 'staging';

/** Apply security + cache headers to every response (09 §8). */
function applyHeaders(request: Request, response: Response): void {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // CSP is rolled out report-only → enforcing in V4-PERF-003.

  if (IS_STAGING) response.headers.set('X-Robots-Tag', 'noindex');

  // Edge caching only for successful HTML GETs (09 §8). Errors/non-HTML never cached
  // here; hashed static assets keep the adapter's immutable default.
  const isHtml = (response.headers.get('content-type') ?? '').includes('text/html');
  if (isHtml) {
    if (request.method !== 'GET' || response.status >= 400) {
      response.headers.set('Cache-Control', 'no-store');
    } else {
      response.headers.set(
        'Cache-Control',
        'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
      );
    }
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  let response: Response;
  try {
    response = await next();
  } catch (error) {
    // Structured log → Coolify (09 §9). Never leak details to the client.
    const id = Math.random().toString(36).slice(2, 8);
    const detail = error instanceof Error ? (error.stack ?? error.message) : String(error);
    console.error(`[error ${id}] ${context.request.method} ${context.url.pathname}\n${detail}`);

    const target =
      error instanceof RepositoryError && error.kind === 'not_found' ? '/404' : '/500';
    response = await context.rewrite(target);
  }

  applyHeaders(context.request, response);
  return response;
});
