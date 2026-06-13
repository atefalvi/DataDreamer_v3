/**
 * SEO metadata contract (10 §2). Pages pass a `Seo` object to `SeoHead`; nothing
 * assembles head tags ad hoc. Per-page JSON-LD builders live in `seo/jsonld.ts`
 * (V4-SEO-001); this module owns the title/canonical/description plumbing.
 */

function env(name: string): string | undefined {
  return process.env[name] ?? (import.meta.env as Record<string, string | undefined>)[name];
}

export const SITE_URL = (env('SITE_URL') ?? 'https://data-dreamer.net').replace(/\/$/, '');
export const SITE_NAME = 'DataDreamer';

export type OgType = 'website' | 'article' | 'profile';

export interface OgImage {
  url: string;
  alt?: string;
  type?: string;
  width?: number;
  height?: number;
}

export interface ArticleMeta {
  publishedTime: string;
  modifiedTime?: string;
  author: string;
  tags?: string[];
}

export interface AlternateFeed {
  href: string;
  title: string;
  type: string;
}

export interface PaginationLinks {
  next?: string;
  prev?: string;
}

export interface Seo {
  /** Page-specific title part; the brand suffix is applied centrally. */
  title: string;
  description: string;
  /** Defaults to SITE_URL + current pathname (query stripped, no trailing slash). */
  canonical?: string;
  ogType?: OgType;
  ogImage?: OgImage;
  article?: ArticleMeta;
  noindex?: boolean;
  alternateFeeds?: AlternateFeed[];
  pagination?: PaginationLinks;
  /** Each object is emitted as its own <script type="application/ld+json">. */
  jsonLd?: object[];
}

/** `{title} — DataDreamer`, unless the title already carries the brand (home). */
export function formatTitle(title: string): string {
  return title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;
}

/** Absolute canonical URL with query removed and trailing slash trimmed (root kept). */
export function resolveCanonical(seo: Seo, requestUrl: URL): string {
  if (seo.canonical) return seo.canonical;
  const path = requestUrl.pathname === '/' ? '' : requestUrl.pathname.replace(/\/$/, '');
  return `${SITE_URL}${path}`;
}

/** Make a possibly-relative URL absolute against SITE_URL. */
export function absoluteUrl(url: string): string {
  return url.startsWith('http') ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}
