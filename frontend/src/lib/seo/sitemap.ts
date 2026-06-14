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
  return sitemapXml(posts.map((post) => sitemapUrl(`/blog/${post.slug}`, post.publishedAt)));
}
