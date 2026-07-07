import { describe, expect, it } from 'vitest';
import { parseAuthorForm, SAFE_AUTHOR_FIELDS } from '../authorForm';

function form(entries: Record<string, string | string[]>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    for (const item of Array.isArray(value) ? value : [value]) data.append(key, item);
  }
  return data;
}

describe('parseAuthorForm (contributor profile editor)', () => {
  it('builds a patch from safe fields only', () => {
    const { patch, specialtyIds, errors } = parseAuthorForm(
      form({
        display_name: 'Maria Khan',
        role_title: 'People Analytics Lead',
        bio: 'HR data, made legible.',
        statement: 'Numbers are people.',
        links: 'LinkedIn | https://linkedin.com/in/maria\nSite | https://maria.example',
        tools: 'Excel, HRIS, People Metrics',
        featured_work: 'Attrition model | https://example.com/work | A predictive study',
        specialties: ['3', '7'],
      }),
    );
    expect(errors).toEqual([]);
    expect(patch).toEqual({
      display_name: 'Maria Khan',
      role_title: 'People Analytics Lead',
      bio: 'HR data, made legible.',
      statement: 'Numbers are people.',
      links: [
        { label: 'LinkedIn', url: 'https://linkedin.com/in/maria' },
        { label: 'Site', url: 'https://maria.example' },
      ],
      tools: ['Excel', 'HRIS', 'People Metrics'],
      featured_work: [
        { title: 'Attrition model', url: 'https://example.com/work', description: 'A predictive study' },
      ],
    });
    expect(specialtyIds).toEqual(['3', '7']);
  });

  it('can never emit forbidden fields, even if the client sends them', () => {
    const { patch } = parseAuthorForm(
      form({
        display_name: 'Sneaky',
        user: 'someone-elses-uuid',
        status: 'published',
        dream_team: 'true',
        sort: '1',
        id: '999',
      }),
    );
    for (const forbidden of ['user', 'status', 'dream_team', 'sort', 'id']) {
      expect(patch).not.toHaveProperty(forbidden);
    }
    for (const key of Object.keys(patch)) {
      expect(SAFE_AUTHOR_FIELDS).toContain(key);
    }
  });

  it('rejects malformed links and featured work with readable errors', () => {
    const { errors } = parseAuthorForm(
      form({ display_name: 'Maria Khan', links: 'not-a-link', featured_work: 'Title | javascript:alert(1)' }),
    );
    expect(errors.length).toBe(2);
  });

  it('rejects too-short display names and drops junk specialty ids', () => {
    const bad = parseAuthorForm(form({ display_name: 'x' }));
    expect(bad.errors.length).toBe(1);
    const junk = parseAuthorForm(
      form({ display_name: 'Maria Khan', specialties: ['3', 'DROP TABLE;', 'ok-slug'] }),
    );
    expect(junk.specialtyIds).toEqual(['3', 'ok-slug']);
  });

  it('validates the slug format and lowercases it', () => {
    expect(parseAuthorForm(form({ display_name: 'Maria Khan', slug: 'Maria-Khan' })).patch.slug).toBe('maria-khan');
    expect(parseAuthorForm(form({ display_name: 'Maria Khan', slug: 'bad slug!' })).errors.length).toBe(1);
    expect(parseAuthorForm(form({ display_name: 'Maria Khan', slug: '' })).patch).not.toHaveProperty('slug');
  });

  it('collects proposed new specialties', () => {
    const { newSpecialtyNames } = parseAuthorForm(
      form({ display_name: 'Maria Khan', new_specialties: 'People  Analytics, x, Workforce Planning' }),
    );
    expect(newSpecialtyNames).toEqual(['People Analytics', 'Workforce Planning']);
  });

  it('caps featured work at two items', () => {
    const { patch, errors } = parseAuthorForm(
      form({
        display_name: 'Maria Khan',
        featured_work: 'A | https://a.example\nB | https://b.example\nC | https://c.example',
      }),
    );
    expect(errors).toContain('Featured work is limited to 2 items');
    expect((patch.featured_work as unknown[]).length).toBe(2);
  });
});
