import { SITE_URL } from '../seo/meta';

function parseOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/** CSRF origin check for cookie-authenticated API writes behind a TLS proxy. */
export function isTrustedRequestOrigin(request: Request, siteUrl = SITE_URL): boolean {
  const submitted = parseOrigin(request.headers.get('origin'));
  if (!submitted) return false;

  const allowed = new Set<string>();
  const publicOrigin = parseOrigin(siteUrl);
  const requestOrigin = parseOrigin(request.url);
  if (publicOrigin) allowed.add(publicOrigin);
  if (requestOrigin) allowed.add(requestOrigin);

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  if (forwardedHost && forwardedProto) {
    const forwardedOrigin = parseOrigin(`${forwardedProto}://${forwardedHost}`);
    if (forwardedOrigin) allowed.add(forwardedOrigin);
  }

  return allowed.has(submitted);
}
