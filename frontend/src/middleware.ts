import { defineMiddleware } from 'astro:middleware';
import { RepositoryError } from './lib/repositories/errors';
import { resolveUser, hasSessionCookie } from './lib/auth/session';
import { isTrustedRequestOrigin } from './lib/auth/request';

const IS_STAGING =
  process.env.DEPLOY_ENV === 'staging' || import.meta.env.DEPLOY_ENV === 'staging';

const DIRECTUS_ORIGIN = originOf(
  process.env.PUBLIC_DIRECTUS_URL ||
    process.env.DIRECTUS_URL ||
    import.meta.env.PUBLIC_DIRECTUS_URL ||
    import.meta.env.DIRECTUS_URL,
);

function originOf(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('base64');
}

function csp(nonce?: string): string {
  const scriptNonce = nonce ? `'nonce-${nonce}'` : undefined;
  const styleNonce = nonce ? `'nonce-${nonce}'` : undefined;
  const imageSources = ["'self'", 'data:', DIRECTUS_ORIGIN, 'https://lh3.googleusercontent.com'].filter(Boolean).join(' ');
  const connectSources = ["'self'", DIRECTUS_ORIGIN].filter(Boolean).join(' ');

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    `img-src ${imageSources}`,
    "font-src 'self'",
    `connect-src ${connectSources}`,
    `script-src 'self' ${scriptNonce ?? ''}`.trim(),
    `script-src-elem 'self' ${scriptNonce ?? ''}`.trim(),
    `style-src 'self' ${styleNonce ?? ''}`.trim(),
    `style-src-elem 'self' ${styleNonce ?? ''}`.trim(),
    "style-src-attr 'unsafe-inline'",
    'frame-src https://www.youtube-nocookie.com https://youtube-nocookie.com',
    "form-action 'self'",
  ].join('; ');
}

async function withCspNonce(response: Response): Promise<{ response: Response; nonce?: string }> {
  const isHtml = (response.headers.get('content-type') ?? '').includes('text/html');
  if (!isHtml) return { response };

  const nonce = createNonce();
  const html = await response.text();
  const htmlWithNonces = html
    .replace(/<script(?![^>]*\snonce=)([^>]*)>/g, `<script nonce="${nonce}"$1>`)
    .replace(/<style(?![^>]*\snonce=)([^>]*)>/g, `<style nonce="${nonce}"$1>`);
  const headers = new Headers(response.headers);
  headers.delete('content-length');

  return {
    nonce,
    response: new Response(htmlWithNonces, {
      status: response.status,
      statusText: response.statusText,
      headers,
    }),
  };
}

/** Apply security + cache headers to every response (09 §8). */
function applyHeaders(request: Request, response: Response, nonce?: string): void {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Content-Security-Policy', csp(nonce));

  if (IS_STAGING) response.headers.set('X-Robots-Tag', 'noindex');

  // Edge caching only for successful HTML GETs (09 §8). Errors/non-HTML never cached
  // here; hashed static assets keep the adapter's immutable default. A page/endpoint
  // that already set Cache-Control (authenticated guide reader, /account, API) wins —
  // never downgrade `private, no-store` to a shared cache.
  const isHtml = (response.headers.get('content-type') ?? '').includes('text/html');
  if (isHtml && !response.headers.has('Cache-Control')) {
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
  // Astro's built-in origin check cannot account for HTTPS termination at Coolify.
  // Enforce the same protection here against the configured public SITE_URL.
  const unsafeMethod = !['GET', 'HEAD', 'OPTIONS'].includes(context.request.method);
  if (unsafeMethod && context.url.pathname.startsWith('/api/') && !isTrustedRequestOrigin(context.request)) {
    return new Response('Cross-site request forbidden', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  // Attach the learner session when a session cookie is present (v4.1, 09 §10).
  // Anonymous requests carry no cookie → zero auth overhead.
  const hasSession = hasSessionCookie(context.cookies);
  if (hasSession) {
    context.locals.user = (await resolveUser(context.cookies)) ?? undefined;
  }

  // /account renders its own onboarding view when signed out (no private data), so it is
  // no longer redirected here — the page decides what to show.

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

  const secured = await withCspNonce(response);
  // Navigation is personalized whenever auth cookies are present. Never let a CDN
  // share that HTML between anonymous and authenticated visitors.
  if (hasSession) secured.response.headers.set('Cache-Control', 'private, no-store');
  applyHeaders(context.request, secured.response, secured.nonce);
  return secured.response;
});
