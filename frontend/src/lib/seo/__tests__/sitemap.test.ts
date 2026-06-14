import { describe, expect, it } from 'vitest';
import { postsSitemapXml, sitemapUrl, sitemapXml } from '../sitemap';
import { SITE_URL } from '../meta';
import type { PostListItem } from '../../../types/content';

describe('sitemap helpers', () => {
  it('renders an escaped sitemap URL with ISO lastmod', () => {
    expect(sitemapUrl('/blog/a&b', new Date('2026-05-12T09:00:00Z'))).toBe(
      `  <url>\n    <loc>${SITE_URL}/blog/a&amp;b</loc>\n    <lastmod>2026-05-12T09:00:00.000Z</lastmod>\n  </url>`,
    );
  });

  it('wraps URL entries in a sitemap document', () => {
    expect(sitemapXml([sitemapUrl('/blog/post')])).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    );
  });

  it('renders post URLs using publishedAt as lastmod', () => {
    const posts: PostListItem[] = [
      {
        slug: 'retry-patterns',
        title: 'Retry patterns',
        excerpt: 'Four retry patterns.',
        publishedAt: new Date('2026-05-12T09:00:00Z'),
        topics: [],
        author: { slug: 'atef-alvi', name: 'Atef Alvi' },
        featured: false,
      },
    ];
    const xml = postsSitemapXml(posts);
    expect(xml).toContain(`<loc>${SITE_URL}/blog/retry-patterns</loc>`);
    expect(xml).toContain('<lastmod>2026-05-12T09:00:00.000Z</lastmod>');
  });
});
