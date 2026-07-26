import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { markdownBlockTypes } from '../types';

const repositoryRoot = join(import.meta.dirname, '../../../../..');

describe('rich-content authoring documentation', () => {
  it('documents every custom block supported by the renderer', async () => {
    const contract = await readFile(join(repositoryRoot, 'docs/RICH_CONTENT_BLOCKS.md'), 'utf8');

    for (const blockType of markdownBlockTypes) {
      expect(contract, `missing documentation for :::${blockType}`).toContain(`\`${blockType}\``);
    }
  });

  it('routes every agent content guide to the shared contract', async () => {
    for (const file of ['AGENT_BLOG_GUIDE.md', 'AGENT_PROJECTS_GUIDE.md', 'AGENT_GUIDES_GUIDE.md']) {
      const guide = await readFile(join(repositoryRoot, `docs/${file}`), 'utf8');
      expect(guide, `${file} must reference the rich-content contract`).toContain('docs/RICH_CONTENT_BLOCKS.md');
      expect(guide, `${file} must reference the cover-image contract`).toContain(
        'docs/AGENT_COVER_IMAGE_GUIDE.md',
      );
    }
  });

  it('keeps the cover-image contract text-free and tied to the site palette', async () => {
    const guide = await readFile(join(repositoryRoot, 'docs/AGENT_COVER_IMAGE_GUIDE.md'), 'utf8');

    expect(guide).toContain('2400 × 1500 px');
    expect(guide).toContain('`#0A0C10`');
    expect(guide).toContain('`#FF5C38`');
    expect(guide).toContain('No text of any kind');
    expect(guide).toContain('central 70%');
  });
});
