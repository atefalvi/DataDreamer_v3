import { describe, expect, it } from 'vitest';
import {
  contentSitemapXml,
  postsSitemapXml,
  shouldIncludeStaticSitemapPage,
  sitemapUrl,
  sitemapXml,
} from '../sitemap';
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
        author: { slug: 'atef-alvi', name: 'Atef Alvi', dreamTeam: true },
        featured: false,
        noindex: false,
      },
    ];
    const xml = postsSitemapXml(posts);
    expect(xml).toContain(`<loc>${SITE_URL}/blog/retry-patterns</loc>`);
    expect(xml).toContain('<lastmod>2026-05-12T09:00:00.000Z</lastmod>');
  });

  it('prefers the Directus updated timestamp for post lastmod', () => {
    const xml = postsSitemapXml([{
      slug: 'updated-post',
      title: 'Updated post',
      excerpt: 'Updated.',
      publishedAt: new Date('2026-05-12T09:00:00Z'),
      updatedAt: new Date('2026-07-15T14:30:00Z'),
      topics: [],
      author: { slug: 'atef-alvi', name: 'Atef Alvi', dreamTeam: true },
      featured: false,
      noindex: false,
    }]);
    expect(xml).toContain('<lastmod>2026-07-15T14:30:00.000Z</lastmod>');
  });

  it('renders and deduplicates all dynamic public content types', () => {
    const xml = contentSitemapXml([
      { path: '/projects/proof-of-work', lastmod: new Date('2026-07-01T00:00:00Z') },
      { path: '/guides/learn-airflow' },
      { path: '/dream-team/atef-alvi' },
      { path: '/topics/data-engineering' },
      { path: '/guides/learn-airflow' },
    ]);
    expect(xml).toContain(`${SITE_URL}/projects/proof-of-work`);
    expect(xml).toContain(`${SITE_URL}/guides/learn-airflow`);
    expect(xml).toContain(`${SITE_URL}/dream-team/atef-alvi`);
    expect(xml).toContain(`${SITE_URL}/topics/data-engineering`);
    expect(xml.match(/guides\/learn-airflow/g)).toHaveLength(1);
  });

  it.each([
    '/account',
    '/account/',
    '/login',
    '/signup',
    '/404',
    '/500',
    '/rss.xml',
    '/api/auth/login',
    '/dev/styleguide',
    '/logs/legacy',
    '/og/blog/example.png',
    '/sitemap-content.xml',
    '/blog/[slug]',
  ])('excludes %s from the generated static sitemap', (path) => {
    expect(shouldIncludeStaticSitemapPage(`${SITE_URL}${path}`)).toBe(false);
  });

  it.each(['/', '/blog', '/projects', '/guides', '/dream-team', '/connect', '/privacy'])(
    'keeps public route %s in the generated static sitemap',
    (path) => expect(shouldIncludeStaticSitemapPage(`${SITE_URL}${path}`)).toBe(true),
  );
});
