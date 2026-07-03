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
  "rich-content-blocks.md",
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
    // One safe nested level (v4.2): callouts now render inside a top-level block.
    expect(result.html).toContain('aria-label="Warning: Inner Callout"');
  });

  it("renders the v4.2 rich content block set", async () => {
    const result = await renderMarkdown(await fixture("rich-content-blocks.md"));
    const html = result.html;

    // checklist — all six states from markers, unmarked line stays neutral
    for (const state of ["done", "pending", "risk", "question", "highlight", "neutral"]) {
      expect(html).toContain(`checklist-block__item--${state}`);
    }
    expect(html).toContain("Keep this unmarked item neutral.");

    // embed — privacy-friendly YouTube iframe + graceful fallback link
    expect(html).toContain("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(html).toMatch(/<iframe[^>]+loading="lazy"[^>]+allowfullscreen/);
    expect(html).toContain('class="embed-block__fallback" href="https://example.com/talk"');

    // metric / metrics — tones, word→symbol translation, explicit symbols pass through
    expect(html).toContain("metric-card--green");
    expect(html).toContain("metric-card--red");
    expect(html).toContain("metric-card--yellow");
    expect(html).toContain('class="metric-grid" data-count="3"');
    expect(html).toContain(">↓<");
    expect(html).toContain(">↑<");
    expect(html).toContain(">—<");

    // formula — server-rendered KaTeX with caption; inline + block math also render
    expect(html).toContain('class="formula-block__math"');
    expect(html).toContain("katex");
    expect(html).toContain('class="formula-block__caption"');

    // detail alias + one nested level (text panel + callout inside details)
    expect(html.split('<details class="expand">').length - 1).toBe(2);
    expect(html).toContain('class="text-block__title"');
    expect(html).toContain("callout--warning");

    // divider — patterns, label, tone
    expect(html).toContain("divider-block--dash");
    expect(html).toContain("divider-block--x");
    expect(html).toContain("divider-block--star");
    expect(html).toContain("divider-block--accent");
    expect(html).toContain('class="divider-block__label"');

    // image grid — contract preserved + title + caption passthrough
    expect(html).toContain('class="image-grid" data-count="2"');
    expect(html).toContain('class="ig-item" type="button" data-src=');
    expect(html).toContain('data-caption="Main dashboard view"');
    expect(html).toContain('class="image-grid__title"');

    // nested blockquote hierarchy survives
    expect(html).toMatch(/<blockquote>[\s\S]*?<blockquote>/);
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
