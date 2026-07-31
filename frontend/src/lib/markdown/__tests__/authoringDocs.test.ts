import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { renderMarkdown } from '../renderMarkdown';
import { markdownBlockTypes } from '../types';

const repositoryRoot = join(import.meta.dirname, '../../../../..');
const customGuidePath = join(repositoryRoot, 'docs/AGENT_CUSTOM_CALLOUTS_GUIDE.md');
const contentGuidePath = join(repositoryRoot, 'docs/AGENT_CONTENT_TYPES_GUIDE.md');

function markdownExamples(document: string): string[] {
  return [...document.matchAll(/^(`{3,})markdown\n([\s\S]*?)^\1$/gm)].map((match) => match[2]);
}

describe('canonical agent authoring documentation', () => {
  it('documents every custom block supported by the renderer', async () => {
    const contract = await readFile(customGuidePath, 'utf8');

    for (const blockType of markdownBlockTypes) {
      expect(contract, `missing documentation for :::${blockType}`).toContain(`\`${blockType}\``);
    }
    expect(contract).toContain('type: flow');
    expect(contract).toContain('type: erd');
    expect(contract).toContain('@Existing node label');
    expect(contract).toContain('PK remains orange, FK blue');
    for (const example of [
      ':::divider\n:::',
      ':::divider Next phase\n:::',
      ':::divider\n---\n:::',
      ':::divider\n***\n:::',
      ':::divider\n-x-\n:::',
      'label: Phase two\npattern: -x-\ntone: accent',
    ]) {
      expect(contract).toContain(example);
    }
  });

  it('renders every canonical Markdown example through the production pipeline', async () => {
    for (const path of [customGuidePath, contentGuidePath]) {
      const document = await readFile(path, 'utf8');
      const examples = markdownExamples(document);
      expect(examples.length, `${path} has no testable Markdown examples`).toBeGreaterThan(0);

      for (const [index, example] of examples.entries()) {
        const rendered = await renderMarkdown(example);
        expect(rendered.html, `${path} example ${index + 1} failed`).not.toContain('Diagram unavailable');
        expect(rendered.html, `${path} example ${index + 1} was empty`).not.toBe('');
      }
    }
  });

  it('keeps one canonical guide per authoring ownership boundary', async () => {
    const files = await readdir(join(repositoryRoot, 'docs'));
    expect(files).toEqual(expect.arrayContaining([
      'AGENT_CONTENT_TYPES_GUIDE.md',
      'AGENT_CUSTOM_CALLOUTS_GUIDE.md',
      'AGENT_COVER_IMAGE_GUIDE.md',
    ]));
    for (const obsolete of [
      'AGENT_BLOG_GUIDE.md',
      'AGENT_PROJECTS_GUIDE.md',
      'AGENT_GUIDES_GUIDE.md',
      'RICH_CONTENT_BLOCKS.md',
      'CODEBASE_CONSOLIDATION_PLAN.md',
    ]) {
      expect(files).not.toContain(obsolete);
    }
  });

  it('uses exact guide hierarchy and project field boundaries', async () => {
    const guide = await readFile(contentGuidePath, 'utf8');

    expect(guide).toContain('`guides` → `guide_sections` → `guide_items`');
    expect(guide).toContain('`why_included`');
    expect(guide).toContain('`focus_on`');
    expect(guide).toContain('There is no separate technology relation');
    expect(guide).toContain('`links`');
    expect(guide).toContain('/blog/<slug>');
    expect(guide).toContain('/projects/<slug>');
    expect(guide).toContain('/guides/<slug>');
    expect(guide.match(/`seo_title`/g)?.length).toBeGreaterThanOrEqual(3);
    expect(guide.match(/`seo_description`/g)?.length).toBeGreaterThanOrEqual(3);
    expect(guide.match(/`noindex`/g)?.length).toBeGreaterThanOrEqual(3);
    expect(guide).toContain('`posts` → `/blog/<slug>`');
    expect(guide).toContain('generated card uses that cover as its visual background');
  });

  it('documents every authorable and system field in all five content collections', async () => {
    const guide = await readFile(contentGuidePath, 'utf8');
    const fieldsByCollection = {
      posts: [
        'id', 'status', 'title', 'slug', 'excerpt', 'content', 'published_at',
        'post_number', 'series_label', 'topics', 'author', 'cover_image', 'featured',
        'date_updated', 'seo_title', 'seo_description', 'noindex', 'date_created',
      ],
      projects: [
        'id', 'status', 'sort', 'title', 'slug', 'summary', 'body', 'year', 'role',
        'author', 'cover_image', 'cover_alt', 'tags', 'links', 'featured', 'date_updated',
        'seo_title', 'seo_description', 'noindex', 'date_created', 'published_at', 'topics',
      ],
      guides: [
        'id', 'status', 'sort', 'slug', 'title', 'summary', 'cover_image', 'difficulty',
        'estimated_duration_minutes', 'featured', 'why_this_path', 'expected_outcome',
        'recommended_audience', 'author', 'sections', 'topics', 'specialties', 'authors',
        'date_updated', 'date_created', 'seo_title', 'seo_description', 'noindex',
        'published_at',
      ],
      guide_sections: ['id', 'guide', 'title', 'description', 'sort', 'items'],
      guide_items: [
        'id', 'section', 'type', 'title', 'url', 'asset', 'body', 'description',
        'why_included', 'focus_on', 'notes', 'estimated_time_minutes', 'difficulty', 'sort',
      ],
    };

    for (const [collection, fields] of Object.entries(fieldsByCollection)) {
      for (const field of fields) {
        expect(guide, `${collection}.${field} is undocumented`).toContain(`\`${field}\``);
      }
    }
    for (const type of [
      'youtube', 'external_url', 'pdf', 'uploaded_file', 'notebooklm', 'github_repo',
      'code_sample', 'cheat_sheet', 'personal_note', 'exercise', 'docs_page',
    ]) {
      expect(guide, `guide_items.type=${type} is undocumented`).toContain(`\`${type}\``);
    }
  });

  it('keeps the cover contract text-free, crop-safe, palette-bound, and three-option', async () => {
    const guide = await readFile(join(repositoryRoot, 'docs/AGENT_COVER_IMAGE_GUIDE.md'), 'utf8');

    expect(guide).toContain('2400 × 1500 px');
    expect(guide).toContain('--cover-paper-stone: #CBC6BC');
    expect(guide).toContain('--cover-archive-sage: #55644F');
    expect(guide).toContain('--cover-system-slate: #4F5E64');
    expect(guide).toContain('--cover-rain-teal: #5E8287');
    expect(guide).toContain('--cover-kiln-clay: #BE8A74');
    expect(guide).toContain('--cover-violet-graphite: #4A4257');
    expect(guide).toContain('--cover-mineral-grey: #4A4A4A');
    expect(guide).toContain('`#FF5C38`');
    expect(guide).toContain('no text of any kind');
    expect(guide).toContain('central 70%');
    expect(guide).toContain('both dark and light');
    expect(guide).toContain('Generate **three finished cover options**');
    expect(guide).toContain('meaningfully different compositions, not colour swaps');
  });

  it('contains wide diagrams without allowing page-level mobile overflow', async () => {
    const css = await readFile(join(repositoryRoot, 'frontend/src/styles/prose.css'), 'utf8');
    const viewportRule = css.match(/\.diagram-block__viewport\s*\{([\s\S]*?)\}/)?.[1] ?? '';

    expect(viewportRule).toContain('max-width: 100%');
    expect(viewportRule).toContain('overflow-x: auto');
    expect(viewportRule).toContain('overscroll-behavior-inline: contain');
  });
});
