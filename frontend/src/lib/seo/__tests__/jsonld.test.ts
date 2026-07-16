import { describe, expect, it } from 'vitest';
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
  wordCountFromHtml,
} from '../jsonld';
import { SITE_URL } from '../meta';

describe('jsonLd builders', () => {
  it('builds branded site entities with absolute URLs', () => {
    expect(websiteJsonLd()).toMatchObject({
      '@type': 'WebSite',
      name: 'Data Dreamer',
      url: SITE_URL,
    });
    expect(organizationJsonLd(['https://github.com/atefalvi'])).toMatchObject({
      '@type': 'Organization',
      logo: `${SITE_URL}/favicon.svg`,
      sameAs: ['https://github.com/atefalvi'],
    });
  });

  it('normalizes people, profiles and lists', () => {
    const person = personJsonLd({
      name: 'Atef Alvi',
      jobTitle: 'Data Engineer',
      url: '/dream-team/atef-alvi',
      sameAs: [],
    });
    expect(person).toEqual({
      '@type': 'Person',
      name: 'Atef Alvi',
      jobTitle: 'Data Engineer',
      url: `${SITE_URL}/dream-team/atef-alvi`,
    });
    expect(profilePageJsonLd({ name: 'Atef Alvi' })).toMatchObject({
      '@type': 'ProfilePage',
      mainEntity: { '@type': 'Person', name: 'Atef Alvi' },
    });
    expect(itemListJsonLd({ name: 'Team', items: [person] })).toMatchObject({
      '@type': 'ItemList',
      itemListElement: [{ '@type': 'ListItem', position: 1, item: person }],
    });
  });

  it('builds page entities and breadcrumbs', () => {
    expect(collectionPageJsonLd({ name: 'Projects', url: '/projects' })).toMatchObject({
      '@type': 'CollectionPage',
      url: `${SITE_URL}/projects`,
    });
    expect(creativeWorkJsonLd({
      name: 'Case',
      description: 'A case study',
      url: '/projects/case',
      keywords: ['Data', 'AI'],
      author: { name: 'Atef Alvi', url: '/dream-team/atef-alvi' },
    })).toMatchObject({
      '@type': 'CreativeWork',
      keywords: 'Data, AI',
      author: { '@type': 'Person', url: `${SITE_URL}/dream-team/atef-alvi` },
    });
    expect(contactPageJsonLd({})).toMatchObject({ '@type': 'ContactPage' });
    expect(breadcrumbListJsonLd([{ label: 'Posts', href: '/blog' }, { label: 'Post' }])).toMatchObject({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Posts', item: `${SITE_URL}/blog` },
        { '@type': 'ListItem', position: 2, name: 'Post' },
      ],
    });
  });

  it('builds article schema with author URL, image, keywords and word count', () => {
    const article = blogPostingJsonLd({
      headline: 'Retry patterns',
      description: 'Four retries.',
      url: '/blog/retry-patterns',
      datePublished: '2026-05-12T09:00:00.000Z',
      dateModified: '2026-05-14T10:30:00.000Z',
      author: { name: 'Atef Alvi', url: '/dream-team/atef-alvi' },
      image: '/og/og-blog.png',
      keywords: ['Data'],
      wordCount: 42,
    });
    expect(article).toMatchObject({
      '@type': 'BlogPosting',
      author: { '@type': 'Person', url: `${SITE_URL}/dream-team/atef-alvi` },
      image: [`${SITE_URL}/og/og-blog.png`],
      mainEntityOfPage: `${SITE_URL}/blog/retry-patterns`,
      dateModified: '2026-05-14T10:30:00.000Z',
      wordCount: 42,
    });
  });

  it('counts words from rendered prose html', () => {
    expect(wordCountFromHtml('<p>Hello <strong>data</strong> world.</p>')).toBe(3);
    expect(wordCountFromHtml('   ')).toBe(0);
  });
});
