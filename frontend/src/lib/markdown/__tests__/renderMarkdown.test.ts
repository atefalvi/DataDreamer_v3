import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";

import { describe, expect, it } from "vitest";

import { renderMarkdown } from "../renderMarkdown";

const fixtureDir = join(import.meta.dirname, "../__fixtures__");
const fixtures = [
  "agent-blog-guide-syntax.md",
  "real-post-001-retry-patterns.md",
  "real-post-002-fine-tuning.md",
  "real-post-003-wysiwyg-cleanup.md",
];

async function fixture(name: string): Promise<string> {
  return readFile(join(fixtureDir, name), "utf8");
}

describe("renderMarkdown v4 pipeline", () => {
  it.each(fixtures)("matches the golden HTML for %s", async (fixtureName) => {
    const result = await renderMarkdown(await fixture(fixtureName));

    expect(result.readingMinutes).toBeGreaterThanOrEqual(1);
    expect(result.html).toMatchSnapshot(basename(fixtureName));
  });

  it("renders the full authoring syntax contract", async () => {
    const result = await renderMarkdown(await fixture("agent-blog-guide-syntax.md"));

    expect(result.headings).toEqual([
      { id: "heading-with-anchors", text: "Heading With Anchors", depth: 2 },
      { id: "nested-heading-preserves-case", text: "Nested Heading Preserves Case", depth: 3 },
      { id: "media-and-tables", text: "Media And Tables", depth: 2 },
    ]);
    expect(result.html).toContain('class="callout callout--tip"');
    expect(result.html).toContain('role="note"');
    expect(result.html).toContain("Use <strong>gradient checkpointing</strong>");
    expect(result.html).toContain("<li>Keep <code>instruction</code> and <code>response</code> keys.</li>");
    expect(result.html).toContain("<summary>Nested Evidence</summary>");
    expect(result.html).toContain('class="callout callout--caution"');
    expect(result.html).toContain('class="callout callout--technical"');
    expect(result.html).toContain('<details class="expand">');
    expect(result.html).toContain('<figure class="pull-quote">');
    expect(result.html).toContain('class="image-grid" data-count="3"');
    expect(result.html).toContain('class="table-scroll" role="region" aria-label="Scrollable table" tabindex="0"');
    expect(result.html).toContain('class="code-block__copy" type="button" aria-label="Copy code"');
    expect(result.html).toContain("<figcaption>Loss curve after epoch three</figcaption>");
    expect(result.html).toContain(":::mystery Unsupported Block");
    expect(result.html).toContain(":::warning Inner Callout");
  });

  it("normalizes Directus WYSIWYG block wrappers before parsing", async () => {
    const result = await renderMarkdown(await fixture("real-post-003-wysiwyg-cleanup.md"));

    expect(result.headings).toContainEqual({
      id: "tables-from-the-editor",
      text: "Tables from the editor",
      depth: 2,
    });
    expect(result.html).toContain('class="table-scroll"');
    expect(result.html).toContain('class="code-block__language">json</span>');
    expect(result.html).toContain('class="callout callout--info"');
  });
});
