import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeEach, describe, expect, it } from 'vitest';
import SeoHead from '../SeoHead.astro';
import {
  blogPostingJsonLd,
  breadcrumbListJsonLd,
  collectionPageJsonLd,
  contactPageJsonLd,
  creativeWorkJsonLd,
  itemListJsonLd,
  organizationJsonLd,
  personJsonLd,
  profilePageJsonLd,
  websiteJsonLd,
} from '../../../lib/seo/jsonld';

let container: AstroContainer;

beforeEach(async () => {
  container = await AstroContainer.create();
});

function render(props: Record<string, unknown>, url = 'https://data-dreamer.net/blog?page=2') {
  return container.renderToString(SeoHead, { props, request: new Request(url) });
}

describe('SeoHead', () => {
  it('emits the expected head metadata (snapshot)', async () => {
    const html = await render({
      title: 'Writing',
      description: 'Practical writing on data systems.',
      ogType: 'website',
    });
    expect(html).toMatchSnapshot();
  });

  it('formats the title and strips the canonical query string', async () => {
    const html = await render({ title: 'Writing', description: 'd', ogType: 'website' });
    expect(html).toContain('<title>Writing — DataDreamer</title>');
    expect(html).toContain('href="https://data-dreamer.net/blog"');
    expect(html).not.toContain('page=2');
  });

  it('defaults to the fallback OG image and index,follow robots', async () => {
    const html = await render({ title: 'T', description: 'd' });
    expect(html).toContain('property="og:image" content="https://data-dreamer.net/og/og-default.png"');
    expect(html).toContain('content="index, follow"');
  });

  it('emits noindex when requested', async () => {
    const html = await render({ title: 'Secret', description: 'd', noindex: true });
    expect(html).toContain('content="noindex, nofollow"');
  });

  it('emits article tags and JSON-LD for articles', async () => {
    const html = await render({
      title: 'A post',
      description: 'd',
      ogType: 'article',
      article: { publishedTime: '2026-05-12T09:00:00Z', author: 'Atef Alvi', tags: ['data'] },
      jsonLd: [{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: 'A post' }],
    });
    expect(html).toContain('property="article:published_time" content="2026-05-12T09:00:00Z"');
    expect(html).toContain('property="article:author" content="Atef Alvi"');
    expect(html).toContain('property="article:tag" content="data"');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('"BlogPosting"');
  });

  it('emits matrix JSON-LD fixtures for page types (snapshot)', async () => {
    const fixtures = [
      await render({
        title: 'DataDreamer — Dreaming in systems, building in data',
        description: 'Home',
        jsonLd: [websiteJsonLd(), organizationJsonLd(['https://github.com/atefalvi'])],
      }, 'https://data-dreamer.net/'),
      await render({
        title: 'A post',
        description: 'Article',
        ogType: 'article',
        article: { publishedTime: '2026-05-12T09:00:00.000Z', author: 'Atef Alvi', tags: ['Data'] },
        jsonLd: [
          blogPostingJsonLd({
            headline: 'A post',
            description: 'Article',
            url: '/blog/a-post',
            datePublished: '2026-05-12T09:00:00.000Z',
            author: { name: 'Atef Alvi', url: '/dream-team/atef-alvi' },
            wordCount: 120,
          }),
          breadcrumbListJsonLd([{ label: 'Blog', href: '/blog' }, { label: 'A post' }]),
        ],
      }, 'https://data-dreamer.net/blog/a-post'),
      await render({
        title: 'Projects',
        description: 'Projects',
        jsonLd: [collectionPageJsonLd({ name: 'Projects — DataDreamer', url: '/projects' })],
      }, 'https://data-dreamer.net/projects'),
      await render({
        title: 'Case',
        description: 'Case',
        ogType: 'article',
        jsonLd: [creativeWorkJsonLd({ name: 'Case', description: 'Case', url: '/projects/case' })],
      }, 'https://data-dreamer.net/projects/case'),
      await render({
        title: 'Dream Team',
        description: 'Team',
        jsonLd: [itemListJsonLd({ name: 'Team', items: [personJsonLd({ name: 'Atef Alvi' })] })],
      }, 'https://data-dreamer.net/dream-team'),
      await render({
        title: 'Atef Alvi — Data Engineer',
        description: 'Author',
        ogType: 'profile',
        jsonLd: [profilePageJsonLd({ name: 'Atef Alvi', url: '/dream-team/atef-alvi' })],
      }, 'https://data-dreamer.net/dream-team/atef-alvi'),
      await render({
        title: 'Contact',
        description: 'Contact',
        jsonLd: [contactPageJsonLd({})],
      }, 'https://data-dreamer.net/connect'),
    ];

    expect(fixtures.join('\n\n---PAGE---\n\n')).toMatchSnapshot();
  });
});
