import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";

import { describe, expect, it } from "vitest";
import { renderMarkdown } from "../renderMarkdown";
import { extractEmbedConfig, extractEmbedUrl } from "../rehype";

const fixtureDir = join(import.meta.dirname, "../__fixtures__");
const fixtures = [
  "agent-blog-guide-syntax.md",
  "real-post-001-retry-patterns.md",
  "real-post-002-fine-tuning.md",
  "real-post-003-wysiwyg-cleanup.md",
  "rich-content-blocks.md",
  "diagram-blocks.md",
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

    // embed — any HTTPS iframe/URL, shared sizing contract, and source fallback
    expect(html).toContain("https://media.example.com/embed/product-walkthrough");
    expect(html).toMatch(/<iframe[^>]+loading="lazy"[^>]+allowfullscreen/);
    expect(html).toContain('class="embed-block__fallback" href="https://example.com/talk"');
    expect(html).toContain('class="embed-block__frame"');
    expect(html).toContain('data-embed-height="720"');
    expect(html).toContain("--embed-ratio: 16 / 9; --embed-height: 720px;");
    expect(html).toContain('class="embed-block__source"');
    expect(html).toContain("allow-popups-to-escape-sandbox");
    expect(html).not.toContain("<script");

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
    // grid cells load the 640px transform; the lightbox data-src keeps full size
    expect(html).toMatch(/<img src="[^"]*width=640[^"]*"/);
    expect(html).toMatch(/data-src="[^"]*width=1440[^"]*"/);
    expect(html).toContain('data-caption="Main dashboard view"');
    expect(html).toContain('class="image-grid__title"');

    // quote — editorial marks are decorative; an explicit author becomes semantic attribution
    expect(html).toContain('class="pull-quote__mark pull-quote__mark--open" aria-hidden="true">“</span>');
    expect(html).toContain('<figcaption class="pull-quote__attribution"><span class="pull-quote__attribution-mark" aria-hidden="true">~</span><cite>Example author</cite></figcaption>');
    expect(html).not.toContain('<p>author: Example author</p>');

    // nested blockquote hierarchy survives
    expect(html).toMatch(/<blockquote>[\s\S]*?<blockquote>/);
  });

  it("renders quote attribution and replaces an existing outer quote pair", async () => {
    const result = await renderMarkdown(`:::quote
“Clarity earns attention.”

— Example source
:::`);

    expect(result.html).toContain('<div class="pull-quote__body"><p>Clarity earns attention.</p></div>');
    expect(result.html).toContain('<figcaption class="pull-quote__attribution"><span class="pull-quote__attribution-mark" aria-hidden="true">~</span><cite>Example source</cite></figcaption>');
    expect(result.html).not.toContain('<p>— Example source</p>');
  });

  it("accepts an author field without requiring a blank separator line", async () => {
    const result = await renderMarkdown(`:::quote
Clarity earns attention.
author: Compact source
:::`);

    expect(result.html).toContain('<div class="pull-quote__body"><p>Clarity earns attention.</p></div>');
    expect(result.html).toContain('<figcaption class="pull-quote__attribution"><span class="pull-quote__attribution-mark" aria-hidden="true">~</span><cite>Compact source</cite></figcaption>');
    expect(result.html).not.toContain("author: Compact source");
  });

  it("renders every supported divider authoring form", async () => {
    const cases = [
      {
        markdown: ":::divider\n:::",
        classes: "divider-block divider-block--neutral divider-block--dash",
        absent: "divider-block__label",
      },
      {
        markdown: ":::divider Next phase\n:::",
        classes: "divider-block divider-block--neutral divider-block--dash",
        contains: 'aria-label="Next phase"><span class="divider-block__label">Next phase</span>',
      },
      {
        markdown: ":::divider\n---\n:::",
        classes: "divider-block divider-block--neutral divider-block--dash",
      },
      {
        markdown: ":::divider\n***\n:::",
        classes: "divider-block divider-block--neutral divider-block--star",
        contains: '<span class="divider-block__mark" aria-hidden="true">✳</span>',
      },
      {
        markdown: ":::divider\n-x-\n:::",
        classes: "divider-block divider-block--neutral divider-block--x",
        contains: '<span class="divider-block__mark" aria-hidden="true">×</span>',
      },
      {
        markdown: ":::divider\nlabel: Phase two\npattern: -x-\ntone: accent\n:::",
        classes: "divider-block divider-block--accent divider-block--x",
        contains: 'aria-label="Phase two"><span class="divider-block__label">Phase two</span>',
      },
    ];

    for (const testCase of cases) {
      const { html } = await renderMarkdown(testCase.markdown);
      expect(html).toContain(`class="${testCase.classes}"`);
      if (testCase.contains) expect(html).toContain(testCase.contains);
      if (testCase.absent) expect(html).not.toContain(testCase.absent);
    }
  });

  it("renders flow and ERD diagrams as server-side inline SVG", async () => {
    const result = await renderMarkdown(await fixture("diagram-blocks.md"));
    const html = result.html;

    expect(html.match(/class="diagram-block diagram-block--flow"/g)).toHaveLength(4);
    expect(html.match(/class="diagram-block diagram-block--erd"/g)).toHaveLength(2);
    expect(html).toContain('class="diagram-svg diagram-svg--flow"');
    expect(html).toContain('class="diagram-svg diagram-svg--erd"');
    expect(html).toContain('role="region"');
    expect(html).toContain('data-target-anchor="middle-left"');
    expect(html).toContain('data-diagram-cache-key=');
    expect(html).not.toContain("Diagram unavailable");
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

  it("gives every heading one unique deep link", async () => {
    const result = await renderMarkdown("# Project content\n\n## The problem\n\n## The outcome");

    expect(result.html).toContain('aria-label="Copy link to this section" href="#project-content"><svg');
    expect(result.html).toContain('href="#the-problem"><svg');
    expect(result.html).toContain('href="#the-outcome"><svg');
    expect(result.html).not.toContain("# #");
    expect(result.html.match(/class="heading-anchor"/g)).toHaveLength(3);
  });

  it("opens external article links in a new tab while retaining internal navigation", async () => {
    const result = await renderMarkdown(
      "[External](https://charts.example.com/report) [About](/about) [Home](https://data-dreamer.net/)",
    );

    expect(result.html).toContain(
      '<a href="https://charts.example.com/report" target="_blank" rel="noopener noreferrer">External</a>',
    );
    expect(result.html).toContain('<a href="/about">About</a>');
    expect(result.html).toContain('<a href="https://data-dreamer.net/">Home</a>');
  });

  it("extracts any HTTPS iframe URL without provider-specific handling", () => {
    const snippet = `<iframe width="800" height="450" src="https://charts.example.com/embed/report-42"></iframe>`;

    expect(extractEmbedUrl(snippet)).toBe("https://charts.example.com/embed/report-42");
    expect(extractEmbedConfig(snippet)).toMatchObject({
      src: "https://charts.example.com/embed/report-42",
      ratio: "800 / 450",
    });
  });

  it("converts public YouTube URLs into privacy-enhanced player URLs", async () => {
    const markdown = `
:::embed Airflow in three minutes
https://www.youtube.com/watch?v=AHMm1wfGuHE
:::
`;
    const result = await renderMarkdown(markdown);

    expect(extractEmbedUrl("https://youtu.be/AHMm1wfGuHE?t=1m30s")).toBe(
      "https://www.youtube-nocookie.com/embed/AHMm1wfGuHE?start=90&rel=0",
    );
    expect(extractEmbedUrl("https://www.youtube.com/shorts/AHMm1wfGuHE")).toBe(
      "https://www.youtube-nocookie.com/embed/AHMm1wfGuHE?rel=0",
    );
    expect(extractEmbedConfig(markdown)).toEqual({
      src: "https://www.youtube-nocookie.com/embed/AHMm1wfGuHE?rel=0",
      source: "https://www.youtube.com/watch?v=AHMm1wfGuHE",
      height: undefined,
      ratio: "16 / 9",
    });
    expect(result.html).toContain(
      'src="https://www.youtube-nocookie.com/embed/AHMm1wfGuHE?rel=0"',
    );
    expect(result.html).toContain(
      'href="https://www.youtube.com/watch?v=AHMm1wfGuHE" target="_blank" rel="noopener noreferrer">Open original',
    );
  });

  it("rejects YouTube pages that do not identify an embeddable video", () => {
    expect(extractEmbedUrl("https://www.youtube.com/watch")).toBeUndefined();
    expect(extractEmbedUrl("https://www.youtube.com/@DataDreamer")).toBeUndefined();
  });

  it("uses a standard HTTPS fallback link from a legacy provider snippet", () => {
    const snippet = `
      <div class="provider-placeholder">
        <noscript><a href="https://charts.example.com/views/report/main?embed=yes">Open chart</a></noscript>
        <object><param name="provider_config" value="opaque" /></object>
      </div>
      <script src="https://charts.example.com/vendor.js"></script>
    `;

    expect(extractEmbedUrl(snippet)).toBe("https://charts.example.com/views/report/main?embed=yes");
  });

  it("renders an iframe-ready Tableau Public view URL without a provider SDK", async () => {
    const markdown = `
:::embed Interactive Tableau waterfall chart
url: https://public.tableau.com/views/WaterfallChartDemo_17751010605170/Main?:showVizHome=no&:toolbar=yes
height: 720
source: https://public.tableau.com/app/profile/syed.atef.alvi/viz/WaterfallChartDemo_17751010605170/Main
:::
`;
    const config = extractEmbedConfig(markdown);
    const result = await renderMarkdown(markdown);

    expect(config).toEqual({
      src: "https://public.tableau.com/views/WaterfallChartDemo_17751010605170/Main?:showVizHome=no&:toolbar=yes",
      source: "https://public.tableau.com/app/profile/syed.atef.alvi/viz/WaterfallChartDemo_17751010605170/Main",
      height: 720,
      ratio: "16 / 9",
    });
    expect(result.html).toContain(
      'src="https://public.tableau.com/views/WaterfallChartDemo_17751010605170/Main?:showVizHome=no&#x26;:toolbar=yes"',
    );
    expect(result.html).toContain('data-embed-height="720"');
    expect(result.html).toContain('target="_blank" rel="noopener noreferrer">Open original');
    expect(result.html).not.toContain("tableau.embedding");
    expect(result.html).not.toContain("viz_v1.js");
  });

  it("converts Tableau's legacy object snippet without executing its script", async () => {
    const snippet = `
<div class='tableauPlaceholder' id='viz1785174202851' style='position: relative'>
  <noscript><a href='#'><img alt='Main' src='https:&#47;&#47;public.tableau.com&#47;static&#47;images&#47;Wa&#47;WaterfallChartDemo_17751010605170&#47;Main&#47;1_rss.png' /></a></noscript>
  <object class='tableauViz' style='display:none;'>
    <param name='host_url' value='https%3A%2F%2Fpublic.tableau.com%2F' />
    <param name='embed_code_version' value='3' />
    <param name='site_root' value='' />
    <param name='name' value='WaterfallChartDemo_17751010605170&#47;Main' />
    <param name='tabs' value='no' />
    <param name='toolbar' value='yes' />
  </object>
</div>
<script>
  if (window.innerWidth > 800) { vizElement.style.width='1300px'; vizElement.style.height='777px'; }
  else { vizElement.style.width='100%'; vizElement.style.height='1977px'; }
  scriptElement.src='https://public.tableau.com/javascripts/api/viz_v1.js';
</script>`;
    const markdown = `:::embed Interactive Tableau waterfall chart\n${snippet}\n:::`;
    const result = await renderMarkdown(markdown);

    expect(extractEmbedConfig(snippet)).toEqual({
      src: "https://public.tableau.com/views/WaterfallChartDemo_17751010605170/Main?:showVizHome=no&:tabs=no&:toolbar=yes",
      source: undefined,
      height: 777,
      ratio: "16 / 9",
    });
    expect(result.html).toContain(
      'src="https://public.tableau.com/views/WaterfallChartDemo_17751010605170/Main?:showVizHome=no&#x26;:tabs=no&#x26;:toolbar=yes"',
    );
    expect(result.html).toContain('data-embed-height="777"');
    expect(result.html).not.toContain("viz_v1.js");
    expect(result.html).not.toContain("tableauPlaceholder");
  });

  it("uses the single source link immediately after a script-based legacy embed", async () => {
    const markdown = `
:::embed Interactive report
<div><noscript><a href="#">Open</a></noscript><object><param name="opaque" value="config" /></object></div>
<script src="https://charts.example.com/vendor.js"></script>
:::

[Open the full report](https://charts.example.com/views/report/main?embed=yes)
`;
    const result = await renderMarkdown(markdown);

    expect(result.html).toContain('src="https://charts.example.com/views/report/main?embed=yes"');
    expect(result.html).toContain('href="https://charts.example.com/views/report/main?embed=yes"');
    expect(result.html).not.toContain("vendor.js");
  });

  it("rejects unsafe or non-embeddable pasted markup", () => {
    expect(extractEmbedUrl("url: http://example.com/embed")).toBeUndefined();
    expect(extractEmbedUrl("<script src='https://example.com/widget.js'></script>")).toBeUndefined();
    expect(extractEmbedUrl("<object><param name='host_url' value='https://example.com/' /></object>")).toBeUndefined();
  });
});
