import { absoluteUrl } from './meta';
import type { PostListItem } from '../../types/content';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function sitemapUrl(path: string, lastmod?: Date): string {
  const lastmodTag = lastmod ? `\n    <lastmod>${lastmod.toISOString()}</lastmod>` : '';
  return `  <url>\n    <loc>${escapeXml(absoluteUrl(path))}</loc>${lastmodTag}\n  </url>`;
}

export function sitemapXml(urls: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
}

export function postsSitemapXml(posts: PostListItem[]): string {
  return sitemapXml(
    posts.map((post) => sitemapUrl(`/blog/${post.slug}`, post.updatedAt ?? post.publishedAt)),
  );
}

export interface ContentSitemapEntry {
  path: string;
  lastmod?: Date;
}

export function contentSitemapXml(entries: ContentSitemapEntry[]): string {
  const unique = new Map<string, ContentSitemapEntry>();
  for (const entry of entries) unique.set(entry.path, entry);
  return sitemapXml(
    [...unique.values()]
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((entry) => sitemapUrl(entry.path, entry.lastmod)),
  );
}

const EXCLUDED_STATIC_ROUTES = new Set([
  '/404',
  '/500',
  '/account',
  '/login',
  '/signup',
  '/rss.xml',
]);

/** Keep the generated static sitemap aligned with route privacy and indexability. */
export function shouldIncludeStaticSitemapPage(page: string): boolean {
  const rawPath = new URL(page).pathname;
  const pathname = rawPath === '/' ? rawPath : rawPath.replace(/\/$/, '');
  if (EXCLUDED_STATIC_ROUTES.has(pathname)) return false;
  if (pathname.startsWith('/api/')) return false;
  if (pathname.startsWith('/dev/')) return false;
  if (pathname.startsWith('/logs')) return false;
  if (pathname.startsWith('/og/')) return false;
  if (pathname.startsWith('/sitemap-')) return false;
  if (pathname.includes('[') || pathname.includes(']')) return false;
  return true;
}
