/**
 * Directus asset URL + srcset builders (09 §7). CMS images are always delivered
 * through these so widths/format stay consistent and CLS stays at zero (dimensions
 * come from the file metadata the repositories request).
 */
import { PUBLIC_DIRECTUS_URL } from './directus/client';
import type { ImageRef } from '../types/content';
import type { DirectusFile } from './directus/schema';

export interface AssetParams {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'inside';
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  quality?: number;
}

export function directusAssetUrl(id: string, params: AssetParams = {}): string {
  const url = new URL(`${PUBLIC_DIRECTUS_URL}/assets/${id}`);
  if (params.width) url.searchParams.set('width', String(params.width));
  if (params.height) url.searchParams.set('height', String(params.height));
  if (params.fit) url.searchParams.set('fit', params.fit);
  if (params.format) url.searchParams.set('format', params.format);
  if (params.quality) url.searchParams.set('quality', String(params.quality));
  return url.toString();
}

/** Build a webp `srcset` string for a CMS image at the given widths. */
export function directusSrcset(id: string, widths: number[]): string {
  return widths
    .map((w) => `${directusAssetUrl(id, { width: w, format: 'webp', quality: 80 })} ${w}w`)
    .join(', ');
}

/**
 * Map an (optionally expanded) Directus file relation to an ImageRef.
 * `alt` falls back to the file's `description` then the provided fallback.
 */
export function toImageRef(
  file: DirectusFile | string | null | undefined,
  fallbackAlt = '',
): ImageRef | undefined {
  if (!file) return undefined;
  if (typeof file === 'string') {
    return { id: file, src: directusAssetUrl(file), alt: fallbackAlt };
  }
  return {
    id: file.id,
    src: directusAssetUrl(file.id),
    width: file.width ?? undefined,
    height: file.height ?? undefined,
    alt: (file.description ?? '').trim() || fallbackAlt,
  };
}
