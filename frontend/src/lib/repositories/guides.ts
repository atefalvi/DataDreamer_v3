/**
 * Field Guides repository (v4.1). Query contracts: 08 §8.5–§8.8.
 *
 * Access model (report "public preview, gated reader"):
 *  - `list`, `latest`, `previewBySlug` use the shared Public read client and request
 *    only preview-safe fields (no item bodies/urls/assets/notes).
 *  - middleware verifies the learner session; gated reads/progress then use the
 *    server-only Guide Server token and explicit published/user filters.
 */
import { readItems, createItem, updateItem } from '@directus/sdk';
import { directusForService } from '../directus/client';
import type { SdkFields as Fields } from '../directus/client';
import { toImageRef } from '../images';
import { guard } from './errors';
import { mapGuide, mapGuideListItem } from './_mappers';
import type { GuideProgressRow, GuideRow } from '../directus/schema';
import type {
  AccountGuideProgress,
  Guide,
  GuideListItem,
  GuideListPage,
  GuideProgressStatus,
  StoredGuideProgress,
} from '../../types/content';
import { COLLECTION_PAGE_SIZE } from '../collections/pagination';

export const DEFAULT_PAGE_SIZE = COLLECTION_PAGE_SIZE;

// SDK dotted-field arrays aren't generically typeable; cast at the call site only
// (the documented `any` exception — 09 §4.2, mirrors posts.ts).

const PUBLISHED = { status: { _eq: 'published' } } as const;

/** Card fields — no section/item bodies. `sections.items.id` only, to count cheaply. */
const GUIDE_CARD_FIELDS = [
  'id',
  'slug',
  'title',
  'summary',
  'difficulty',
  'featured',
  'estimated_duration_minutes',
  'sort',
  'date_created',
  'date_updated',
  'published_at',
  'seo_title',
  'seo_description',
  'noindex',
  'cover_image.id',
  'cover_image.width',
  'cover_image.height',
  'cover_image.description',
  'author.slug',
  'author.status',
  'author.dream_team',
  'author.display_name',
  'author.avatar.id',
  'author.avatar.width',
  'author.avatar.height',
  'author.avatar.description',
  'topics.topics_id.name',
  'topics.topics_id.slug',
  'sections.id',
  'sections.items.id',
] as const;

/** Hero/intro fields shared by preview + reader. */
const GUIDE_HEAD_FIELDS = [
  ...GUIDE_CARD_FIELDS,
  'why_this_path',
  'expected_outcome',
  'recommended_audience',
  'specialties.sort',
  'specialties.specialties_id.name',
  'specialties.specialties_id.slug',
  'specialties.specialties_id.color_key',
  'authors.sort',
  'authors.authors_id.slug',
  'authors.authors_id.status',
  'authors.authors_id.dream_team',
  'authors.authors_id.display_name',
  'authors.authors_id.avatar.id',
  'authors.authors_id.avatar.width',
  'authors.authors_id.avatar.height',
  'authors.authors_id.avatar.description',
  'sections.title',
  'sections.sort',
  'sections.items.type',
  'sections.items.title',
  'sections.items.sort',
] as const;

/** Public preview: head fields + per-item description + estimate (no bodies/urls/notes). */
const GUIDE_PREVIEW_FIELDS = [
  ...GUIDE_HEAD_FIELDS,
  'sections.items.description',
  'sections.items.estimated_time_minutes',
  'sections.items.difficulty',
] as const;

/** Authenticated reader: everything, including gated content + curator annotations. */
const GUIDE_READER_FIELDS = [
  ...GUIDE_PREVIEW_FIELDS,
  'sections.description',
  'sections.items.url',
  'sections.items.body',
  'sections.items.why_included',
  'sections.items.focus_on',
  'sections.items.notes',
  'sections.items.asset.id',
  'sections.items.asset.width',
  'sections.items.asset.height',
  'sections.items.asset.description',
] as const;

function countParts(row: GuideRow): { itemCount: number; sectionCount: number } {
  const sections = row.sections ?? [];
  const itemCount = sections.reduce((sum, section) => sum + (section.items?.length ?? 0), 0);
  return { itemCount, sectionCount: sections.length };
}

export interface GuideListQuery {
  topic?: string;
  level?: string;
  page?: number;
  pageSize?: number;
}

export async function list(query: GuideListQuery = {}): Promise<GuideListPage> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

  const filter: Record<string, unknown> = { ...PUBLISHED };
  if (query.topic) filter.topics = { topics_id: { slug: { _eq: query.topic } } };
  if (query.level) filter.difficulty = { _eq: query.level };

  const client = directusForService();
  const rows = await guard('guides.list', () =>
    client.request<GuideRow[]>(
      readItems('guides', {
        filter,
        sort: ['-featured', 'sort'],
        limit: pageSize + 1,
        offset: (page - 1) * pageSize,
        fields: GUIDE_CARD_FIELDS as Fields,
      }),
    ),
  );

  const hasMore = rows.length > pageSize;
  const items = rows.slice(0, pageSize).map((row) => mapGuideListItem(row, countParts(row)));
  return { items, page, pageSize, hasMore };
}

export async function latest(limit = 3): Promise<GuideListItem[]> {
  const client = directusForService();
  const rows = await guard('guides.latest', () =>
    client.request<GuideRow[]>(
      readItems('guides', {
        filter: PUBLISHED,
        sort: ['-featured', 'sort'],
        limit,
        fields: GUIDE_CARD_FIELDS as Fields,
      }),
    ),
  );
  return rows.map((row) => mapGuideListItem(row, countParts(row)));
}

export interface GuideSitemapItem {
  slug: string;
  updatedAt?: Date;
}

/** Lightweight published-guide records for sitemap generation. */
export async function sitemap(limit = 1000): Promise<GuideSitemapItem[]> {
  const client = directusForService();
  const rows = await guard('guides.sitemap', () =>
    client.request<GuideRow[]>(
      readItems('guides', {
        filter: { ...PUBLISHED, noindex: { _neq: true } },
        sort: ['slug'],
        limit,
        fields: ['slug', 'date_updated', 'date_created'] as Fields,
      }),
    ),
  );
  return rows.map((row) => ({
    slug: row.slug,
    updatedAt: row.date_updated || row.date_created
      ? new Date(row.date_updated ?? row.date_created!)
      : undefined,
  }));
}

/** Public preview of a guide (gated content withheld). Null when no published match. */
export async function previewBySlug(slug: string): Promise<Guide | null> {
  const client = directusForService();
  const rows = await guard('guides.previewBySlug', () =>
    client.request<GuideRow[]>(
      readItems('guides', {
        filter: { ...PUBLISHED, slug: { _eq: slug } },
        limit: 1,
        fields: GUIDE_PREVIEW_FIELDS as Fields,
      }),
    ),
  );
  if (!rows.length) return null;
  return mapGuide(rows[0], false);
}

/**
 * Authenticated reader view — full content. A learner token proves this call followed
 * an authenticated request; Directus data access stays on the server-only client.
 */
export async function readerBySlug(slug: string, accessToken?: string): Promise<Guide | null> {
  if (!accessToken) return previewBySlug(slug);
  const client = directusForService();
  const rows = await guard('guides.readerBySlug', () =>
    client.request<GuideRow[]>(
      readItems('guides', {
        filter: { ...PUBLISHED, slug: { _eq: slug } },
        limit: 1,
        fields: GUIDE_READER_FIELDS as Fields,
      }),
    ),
  );
  if (!rows.length) return null;
  return mapGuide(rows[0], true);
}

/** The current learner's stored progress for a guide, or null. */
export async function progressFor(
  guideId: string,
  userId: string,
): Promise<StoredGuideProgress | null> {
  const client = directusForService();
  const rows = await guard('guides.progressFor', () =>
    client.request<GuideProgressRow[]>(
      readItems('guide_progress', {
        filter: { guide: { _eq: guideId }, user: { _eq: userId } },
        limit: 1,
        fields: ['completed_items', 'last_item', 'started_at', 'completed_at'] as Fields,
      }),
    ),
  );
  if (!rows.length) return null;
  return toStoredProgress(rows[0]);
}

/** The signed-in learner's guides for the account page, most recently touched first. */
export async function myGuides(userId: string): Promise<AccountGuideProgress[]> {
  const client = directusForService();
  const rows = await guard('guides.myGuides', () =>
    client.request<GuideProgressRow[]>(
      readItems('guide_progress', {
        filter: { user: { _eq: userId }, guide: { status: { _eq: 'published' } } },
        sort: ['-started_at'] as Fields,
        limit: 100,
        fields: [
          'percent',
          'status',
          'guide.slug',
          'guide.title',
          'guide.cover_image.id',
          'guide.cover_image.width',
          'guide.cover_image.height',
          'guide.cover_image.description',
        ] as Fields,
      }),
    ),
  );

  return rows
    .map((row): AccountGuideProgress | null => {
      const guide = row.guide && typeof row.guide === 'object' ? (row.guide as GuideRow) : null;
      if (!guide?.slug) return null;
      return {
        slug: guide.slug,
        title: guide.title,
        coverImage: toImageRef(guide.cover_image, guide.title),
        percent: row.percent ?? 0,
        status: (row.status as GuideProgressStatus) ?? 'in-progress',
      };
    })
    .filter((g): g is AccountGuideProgress => Boolean(g));
}

/** Fields written to a `guide_progress` row (08 §4.5). */
export interface ProgressFields {
  completed_items: string[];
  last_item: string | null;
  status: string;
  percent: number;
  completed_at: string | null;
}

/** Upsert the learner's progress row, scoped by the verified session user. */
export async function saveProgress(
  userId: string,
  guideId: string,
  fields: ProgressFields,
): Promise<void> {
  const client = directusForService();
  await guard('guides.saveProgress', async () => {
    const existing = await client.request<GuideProgressRow[]>(
      readItems('guide_progress', { filter: { guide: { _eq: guideId }, user: { _eq: userId } }, limit: 1, fields: ['id'] as Fields }),
    );
    if (existing.length) {
      await client.request(updateItem('guide_progress', existing[0].id, fields as never));
    } else {
      await client.request(
        createItem('guide_progress', {
          user: userId,
          guide: guideId,
          started_at: new Date().toISOString(),
          ...fields,
        } as never),
      );
    }
  });
}

export function toStoredProgress(row: GuideProgressRow): StoredGuideProgress {
  const lastItem =
    row.last_item && typeof row.last_item === 'object'
      ? (row.last_item as { id: string }).id
      : (row.last_item as string | null) ?? undefined;
  return {
    completedItemIds: Array.isArray(row.completed_items) ? row.completed_items : [],
    lastItemId: lastItem ?? undefined,
    startedAt: row.started_at ? new Date(row.started_at) : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  };
}
