import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const repositoryRoot = join(import.meta.dirname, '../../../../..');

function relationBlock(snapshot: string, collection: string, field: string): string {
  const marker = `  - collection: ${collection}\n    field: ${field}\n`;
  const start = snapshot.indexOf(marker, snapshot.indexOf('relations:'));
  if (start < 0) throw new Error(`Missing relation ${collection}.${field}`);
  const end = snapshot.indexOf('\n  - collection:', start + marker.length);
  return snapshot.slice(start, end < 0 ? undefined : end);
}

function fieldBlock(snapshot: string, collection: string, field: string): string {
  const marker = `  - collection: ${collection}\n    field: ${field}\n`;
  const fieldsStart = snapshot.indexOf('fields:');
  const relationsStart = snapshot.indexOf('relations:');
  const start = snapshot.indexOf(marker, fieldsStart);
  if (start < 0 || start >= relationsStart) throw new Error(`Missing field ${collection}.${field}`);
  const end = snapshot.indexOf('\n  - collection:', start + marker.length);
  return snapshot.slice(start, end < 0 || end > relationsStart ? relationsStart : end);
}

describe('CMS relationship and Specialty contract', () => {
  it('stores SEO overrides as text so editorial guidance cannot cause a database length error', async () => {
    const snapshot = await readFile(join(repositoryRoot, 'backend/snapshot.yaml'), 'utf8');

    for (const collection of ['posts', 'projects', 'guides']) {
      for (const field of ['seo_title', 'seo_description']) {
        const block = fieldBlock(snapshot, collection, field);
        expect(block, `${collection}.${field} must use non-truncating storage`).toContain('type: text');
        expect(block, `${collection}.${field} must map to PostgreSQL text`).toContain('data_type: text');
        expect(block, `${collection}.${field} must not have a varchar limit`).toContain('max_length: null');
      }
    }
  });

  it('cascades all many-to-many junction foreign keys and deletes deselected links', async () => {
    const snapshot = await readFile(join(repositoryRoot, 'backend/snapshot.yaml'), 'utf8');
    const relations = [
      ['authors_specialties', 'authors_id'],
      ['authors_specialties', 'specialties_id'],
      ['posts_topics', 'posts_id'],
      ['posts_topics', 'topics_id'],
      ['projects_topics', 'projects_id'],
      ['projects_topics', 'topics_id'],
      ['guides_authors', 'guides_id'],
      ['guides_authors', 'authors_id'],
      ['guides_specialties', 'guides_id'],
      ['guides_specialties', 'specialties_id'],
      ['guides_topics', 'guides_id'],
      ['guides_topics', 'topics_id'],
    ];

    for (const [collection, field] of relations) {
      const block = relationBlock(snapshot, collection, field);
      expect(block, `${collection}.${field} must cascade junction cleanup`).toContain('on_delete: CASCADE');
      expect(block, `${collection}.${field} must delete deselected junction rows`).toContain(
        'one_deselect_action: delete',
      );
    }
  });

  it('ships a broad, unique, published-safe Specialty catalogue', async () => {
    const specialties = JSON.parse(
      await readFile(join(repositoryRoot, 'backend/data/specialties.json'), 'utf8'),
    ) as Array<{ name: string; slug: string; color_key: string; sort: number; description: string }>;

    expect(specialties.length).toBeGreaterThanOrEqual(20);
    expect(new Set(specialties.map(({ slug }) => slug)).size).toBe(specialties.length);
    expect(new Set(specialties.map(({ name }) => name.toLowerCase())).size).toBe(specialties.length);
    expect(specialties.map(({ sort }) => sort)).toEqual(specialties.map((_, index) => index + 1));
    expect(specialties.some(({ slug }) => slug === 'data-governance')).toBe(true);
    expect(specialties.every(({ color_key }) => /^viz-[1-6]$/.test(color_key))).toBe(true);
    expect(specialties.every(({ name }) => name.length <= 40)).toBe(true);
    expect(specialties.every(({ description }) => description.length <= 200)).toBe(true);
  });
});
