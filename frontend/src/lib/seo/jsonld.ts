import { absoluteUrl, SITE_NAME, SITE_URL } from './meta';

type JsonValue = string | number | boolean | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue | undefined };

export interface BreadcrumbInput {
  label: string;
  href?: string;
}

export interface PersonInput {
  name: string;
  jobTitle?: string;
  url?: string;
  image?: string;
  sameAs?: string[];
}

function compact<T extends JsonObject>(value: T): T {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => {
        if (item === undefined) return false;
        if (Array.isArray(item) && item.length === 0) return false;
        return true;
      })
      .map(([key, item]) => [key, typeof item === 'object' && !Array.isArray(item) ? compact(item as JsonObject) : item]),
  ) as T;
}

export function wordCountFromHtml(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
}

export function breadcrumbListJsonLd(items: BreadcrumbInput[]): JsonObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) =>
      compact({
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
        item: item.href ? absoluteUrl(item.href) : undefined,
      }),
    ),
  };
}

export function personJsonLd(person: PersonInput): JsonObject {
  return compact({
    '@type': 'Person',
    name: person.name,
    jobTitle: person.jobTitle,
    url: person.url ? absoluteUrl(person.url) : undefined,
    image: person.image ? absoluteUrl(person.image) : undefined,
    sameAs: person.sameAs,
  });
}

export function websiteJsonLd(): JsonObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
  };
}

export function organizationJsonLd(sameAs: string[] = []): JsonObject {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/favicon.svg'),
    sameAs,
  });
}

export function blogJsonLd(input: { description: string; name?: string; url?: string }): JsonObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: input.name ?? `${SITE_NAME} Posts`,
    url: absoluteUrl(input.url ?? '/blog'),
    description: input.description,
  };
}

export function collectionPageJsonLd(input: {
  name: string;
  url: string;
  description?: string;
  isPartOf?: JsonObject;
}): JsonObject {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    url: absoluteUrl(input.url),
    description: input.description,
    isPartOf: input.isPartOf,
  });
}

export function blogPostingJsonLd(input: {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  author: PersonInput;
  image?: string;
  keywords?: string[];
  wordCount?: number;
}): JsonObject {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.headline,
    description: input.description,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    author: personJsonLd(input.author),
    image: input.image ? [absoluteUrl(input.image)] : undefined,
    keywords: input.keywords,
    wordCount: input.wordCount,
    mainEntityOfPage: absoluteUrl(input.url),
  });
}

export function creativeWorkJsonLd(input: {
  name: string;
  description: string;
  url: string;
  datePublished?: string;
  keywords?: string[];
  image?: string;
  author?: PersonInput;
}): JsonObject {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.url),
    datePublished: input.datePublished,
    keywords: input.keywords?.join(', '),
    image: input.image ? absoluteUrl(input.image) : undefined,
    author: input.author ? personJsonLd(input.author) : undefined,
  });
}

export function itemListJsonLd(input: {
  name: string;
  items: JsonObject[];
}): JsonObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: input.name,
    itemListElement: input.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item,
    })),
  };
}

export function profilePageJsonLd(person: PersonInput): JsonObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: personJsonLd(person),
  };
}

export function contactPageJsonLd(input: { name?: string; url?: string }): JsonObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: input.name ?? `Contact — ${SITE_NAME}`,
    url: absoluteUrl(input.url ?? '/connect'),
  };
}
