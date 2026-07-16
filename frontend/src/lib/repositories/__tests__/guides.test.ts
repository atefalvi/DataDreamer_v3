import { describe, it, expect, beforeEach, vi } from 'vitest';

// Every guide query goes through the isolated server-only guide client.
const { serviceRequest } = vi.hoisted(() => ({ serviceRequest: vi.fn() }));
vi.mock('../../directus/client', () => ({
  directusForService: () => ({ request: serviceRequest }),
  PUBLIC_DIRECTUS_URL: 'https://cms.test',
  DIRECTUS_URL: 'https://cms.test',
}));

import * as guidesRepo from '../guides';
import type { GuideRow } from '../../directus/schema';

beforeEach(() => {
  serviceRequest.mockReset();
});

function guideRow(): GuideRow {
  return {
    id: 'g1',
    status: 'published',
    slug: 'learn-airflow',
    title: 'Learn Airflow',
    summary: 'A curated path.',
    difficulty: 'beginner',
    estimated_duration_minutes: 120,
    featured: true,
    why_this_path: 'Because **setup** is painful.',
    expected_outcome: 'Ship a DAG.',
    recommended_audience: 'Python devs.',
    author: { id: 'a1', status: 'published', dream_team: true, slug: 'atef-alvi', display_name: 'Atef Alvi', role_title: 'Engineer' },
    authors: [
      { id: 'j1', sort: 1, authors_id: { id: 'a2', status: 'published', dream_team: false, slug: 'maria-khan', display_name: 'Maria Khan', role_title: 'PM' } },
      // duplicate of the primary author — must be deduped
      { id: 'j2', sort: 2, authors_id: { id: 'a1', status: 'published', dream_team: true, slug: 'atef-alvi', display_name: 'Atef Alvi', role_title: 'Engineer' } },
    ],
    topics: [{ id: 't1', topics_id: { id: 'tp1', status: 'published', name: 'Data Engineering', slug: 'data-engineering' } }],
    // intentionally out of order to prove sorting
    sections: [
      {
        id: 's2', title: 'Deeper', sort: 2,
        items: [
          { id: 'i3', type: 'docs_page', title: 'Docs', url: 'https://airflow.apache.org/', why_included: 'The one page worth reading.', sort: 1, estimated_time_minutes: 25 },
        ],
      },
      {
        id: 's1', title: 'Foundations', sort: 1,
        items: [
          { id: 'i2', type: 'personal_note', title: 'My note', body: 'Watch the **pool** limits.', sort: 2, estimated_time_minutes: 10 },
          { id: 'i1', type: 'youtube', title: 'Intro', url: 'https://youtu.be/abc', sort: 1, estimated_time_minutes: 5 },
        ],
      },
    ],
  };
}

describe('guidesRepo.previewBySlug (public preview gating)', () => {
  it('returns the preview shape with all items locked and gated fields withheld', async () => {
    serviceRequest.mockResolvedValueOnce([guideRow()]);
    const guide = await guidesRepo.previewBySlug('learn-airflow');
    expect(guide).not.toBeNull();
    expect(guide!.unlocked).toBe(false);

    const items = guide!.sections.flatMap((s) => s.items);
    expect(items.every((i) => i.locked)).toBe(true);
    for (const item of items) {
      expect(item.url).toBeUndefined();
      expect(item.bodyHtml).toBeUndefined();
      expect(item.whyIncludedHtml).toBeUndefined();
    }
    // Preview-safe fields still present.
    expect(items.find((i) => i.id === 'i3')?.title).toBe('Docs');
  });

  it('orders sections and items by sort', async () => {
    serviceRequest.mockResolvedValueOnce([guideRow()]);
    const guide = await guidesRepo.previewBySlug('learn-airflow');
    expect(guide!.sections.map((s) => s.title)).toEqual(['Foundations', 'Deeper']);
    expect(guide!.sections[0].items.map((i) => i.id)).toEqual(['i1', 'i2']);
  });

  it('dedupes curators (primary author + junction)', async () => {
    serviceRequest.mockResolvedValueOnce([guideRow()]);
    const guide = await guidesRepo.previewBySlug('learn-airflow');
    expect(guide!.curators.map((c) => c.slug)).toEqual(['atef-alvi', 'maria-khan']);
    expect(guide!.curators.map((c) => c.dreamTeam)).toEqual([true, false]);
    expect(guide!.itemCount).toBe(3);
  });

  it('returns null when no published guide matches', async () => {
    serviceRequest.mockResolvedValueOnce([]);
    expect(await guidesRepo.previewBySlug('missing')).toBeNull();
  });
});

describe('guidesRepo.readerBySlug (authenticated reader)', () => {
  it('unlocks gated fields and renders markdown bodies + annotations', async () => {
    serviceRequest.mockResolvedValueOnce([guideRow()]);
    const guide = await guidesRepo.readerBySlug('learn-airflow', 'token-123');
    expect(guide!.unlocked).toBe(true);

    const items = guide!.sections.flatMap((s) => s.items);
    expect(items.every((i) => i.locked)).toBe(false);

    const video = items.find((i) => i.id === 'i1');
    expect(video?.url).toBe('https://youtu.be/abc');

    const note = items.find((i) => i.id === 'i2');
    expect(note?.bodyHtml).toContain('<strong>pool</strong>');

    const docs = items.find((i) => i.id === 'i3');
    expect(docs?.whyIncludedHtml).toContain('The one page worth reading');
  });

  it('falls back to the public preview without a token', async () => {
    serviceRequest.mockResolvedValueOnce([guideRow()]);
    const guide = await guidesRepo.readerBySlug('learn-airflow');
    expect(guide!.unlocked).toBe(false);
    expect(serviceRequest).toHaveBeenCalledOnce();
  });
});

describe('guidesRepo.list', () => {
  it('maps cards and computes item/section counts', async () => {
    serviceRequest.mockResolvedValueOnce([guideRow()]);
    const page = await guidesRepo.list({ pageSize: 9 });
    expect(page.items).toHaveLength(1);
    expect(page.items[0].itemCount).toBe(3);
    expect(page.items[0].sectionCount).toBe(2);
    expect(page.hasMore).toBe(false);
  });

  it('flags hasMore when the over-fetch returns an extra row', async () => {
    serviceRequest.mockResolvedValueOnce([guideRow(), guideRow()]);
    const page = await guidesRepo.list({ pageSize: 1 });
    expect(page.items).toHaveLength(1);
    expect(page.hasMore).toBe(true);
  });
});

describe('guidesRepo.sitemap', () => {
  it('returns published guide slugs with reliable CMS timestamps', async () => {
    serviceRequest.mockResolvedValueOnce([
      { slug: 'learn-airflow', date_created: '2026-07-01T00:00:00Z', date_updated: '2026-07-14T00:00:00Z' },
    ]);
    await expect(guidesRepo.sitemap()).resolves.toEqual([
      { slug: 'learn-airflow', updatedAt: new Date('2026-07-14T00:00:00Z') },
    ]);
  });
});

describe('guidesRepo.toStoredProgress', () => {
  it('normalizes completed items, last_item (object or id), and dates', () => {
    const fromObject = guidesRepo.toStoredProgress({
      id: 'p1', user: 'u1', guide: 'g1',
      completed_items: ['i1', 'i2'],
      last_item: { id: 'i2', type: 'youtube', title: 'x' },
      started_at: '2026-07-01T00:00:00Z', completed_at: null,
    });
    expect(fromObject.completedItemIds).toEqual(['i1', 'i2']);
    expect(fromObject.lastItemId).toBe('i2');
    expect(fromObject.startedAt).toBeInstanceOf(Date);
    expect(fromObject.completedAt).toBeUndefined();

    const fromId = guidesRepo.toStoredProgress({ id: 'p2', user: 'u1', guide: 'g1', last_item: 'i9' });
    expect(fromId.completedItemIds).toEqual([]);
    expect(fromId.lastItemId).toBe('i9');
  });
});

describe('guidesRepo.myGuides', () => {
  it('maps progress rows to account cards, dropping rows without a guide', async () => {
    serviceRequest.mockResolvedValueOnce([
      { id: 'p1', user: 'u1', percent: 40, status: 'in-progress', guide: { id: 'g1', slug: 'learn-airflow', title: 'Learn Airflow' } },
      { id: 'p2', user: 'u1', percent: 100, status: 'completed', guide: { id: 'g2', slug: 'dbt-basics', title: 'dbt basics' } },
      { id: 'p3', user: 'u1', percent: 10, status: 'in-progress', guide: null }, // unpublished/filtered → dropped
    ]);
    const rows = await guidesRepo.myGuides('token-123');
    expect(rows.map((r) => r.slug)).toEqual(['learn-airflow', 'dbt-basics']);
    expect(rows[0]).toMatchObject({ percent: 40, status: 'in-progress', title: 'Learn Airflow' });
  });
});
