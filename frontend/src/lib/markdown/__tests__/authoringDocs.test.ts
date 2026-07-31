import { readFile } from 'node:fs/promises';
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

  it('routes superseded guides to the three canonical ownership boundaries', async () => {
    for (const file of ['AGENT_BLOG_GUIDE.md', 'AGENT_PROJECTS_GUIDE.md', 'AGENT_GUIDES_GUIDE.md']) {
      const guide = await readFile(join(repositoryRoot, `docs/${file}`), 'utf8');
      expect(guide).toContain('docs/AGENT_CONTENT_TYPES_GUIDE.md');
      expect(guide).toContain('docs/AGENT_CUSTOM_CALLOUTS_GUIDE.md');
      expect(guide).toContain('docs/AGENT_COVER_IMAGE_GUIDE.md');
      expect(guide).toContain('Superseded');
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
  });

  it('keeps the cover contract text-free, crop-safe, and single-output by default', async () => {
    const guide = await readFile(join(repositoryRoot, 'docs/AGENT_COVER_IMAGE_GUIDE.md'), 'utf8');

    expect(guide).toContain('2400 × 1500 px');
    expect(guide).toContain('`#0A0C10`');
    expect(guide).toContain('`#FF5C38`');
    expect(guide).toContain('no text of any kind');
    expect(guide).toContain('central 70%');
    expect(guide).toContain('both dark and light');
    expect(guide).toContain('Produce one finished cover by default');
    expect(guide).toContain('alternatives only when the user asks');
    expect(guide).not.toContain('Create three separate');
  });

  it('contains wide diagrams without allowing page-level mobile overflow', async () => {
    const css = await readFile(join(repositoryRoot, 'frontend/src/styles/prose.css'), 'utf8');
    const viewportRule = css.match(/\.diagram-block__viewport\s*\{([\s\S]*?)\}/)?.[1] ?? '';

    expect(viewportRule).toContain('max-width: 100%');
    expect(viewportRule).toContain('overflow-x: auto');
    expect(viewportRule).toContain('overscroll-behavior-inline: contain');
  });
});
