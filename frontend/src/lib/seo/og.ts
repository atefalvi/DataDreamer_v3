/**
 * OG image resolution (10 §5.4). SHELL-001 ships the explicit-or-default cascade; the
 * section defaults table and per-article Directus images are wired in V4-SEO-001.
 * The temporary fallback set (V4-FND-002) guarantees previews never break.
 */
import { absoluteUrl, type OgImage, type Seo, SITE_NAME } from './meta';

const DEFAULT_OG: OgImage = {
  url: '/og/og-default.png',
  alt: SITE_NAME,
  type: 'image/png',
  width: 1200,
  height: 630,
};

export function resolveOgImage(seo: Seo): Required<OgImage> {
  const image = seo.ogImage ?? DEFAULT_OG;
  return {
    url: absoluteUrl(image.url),
    alt: image.alt ?? seo.title,
    type: image.type ?? 'image/png',
    width: image.width ?? 1200,
    height: image.height ?? 630,
  };
}
