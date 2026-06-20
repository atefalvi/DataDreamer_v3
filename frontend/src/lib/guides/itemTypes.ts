/**
 * Presentation metadata for each guide item type (05 §15) — icon + short label, and
 * which "open" affordance the item uses. Pure data so it's shared by the reader and
 * (label-only) previews.
 */
import type { GuideItemType } from '../../types/content';

export interface ItemTypeMeta {
  /** Lucide / custom Icon name. */
  icon: string;
  /** Short badge label. */
  label: string;
  /** How the item primarily opens. */
  open: 'embed' | 'link' | 'download' | 'inline';
}

export const ITEM_TYPE_META: Record<GuideItemType, ItemTypeMeta> = {
  youtube: { icon: 'play', label: 'Video', open: 'embed' },
  external_url: { icon: 'external-link', label: 'Link', open: 'link' },
  pdf: { icon: 'file-text', label: 'PDF', open: 'download' },
  uploaded_file: { icon: 'file', label: 'File', open: 'download' },
  notebooklm: { icon: 'notebook-pen', label: 'NotebookLM', open: 'link' },
  github_repo: { icon: 'github', label: 'Repo', open: 'link' },
  code_sample: { icon: 'code', label: 'Code', open: 'inline' },
  cheat_sheet: { icon: 'list-checks', label: 'Cheat sheet', open: 'inline' },
  personal_note: { icon: 'sticky-note', label: 'Note', open: 'inline' },
  exercise: { icon: 'dumbbell', label: 'Exercise', open: 'inline' },
  docs_page: { icon: 'book-open', label: 'Docs', open: 'link' },
};

/** Hostname for display on external links, e.g. "github.com". */
export function hostnameOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

/** Extract a YouTube video id from common URL shapes. */
export function youtubeId(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1) || undefined;
    if (u.searchParams.get('v')) return u.searchParams.get('v') ?? undefined;
    const embedMatch = u.pathname.match(/\/(embed|shorts)\/([\w-]+)/);
    if (embedMatch) return embedMatch[2];
  } catch {
    return undefined;
  }
  return undefined;
}
