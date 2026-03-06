/**
 * renderMarkdown — Processes Markdown content with custom block conventions
 * and returns { html, headings } for blog rendering.
 *
 * Custom conventions:
 *   :::tip Title     → Callout (tip)
 *   :::warning Title → Callout (warning)
 *   :::info Title    → Callout (info)
 *   :::note Title    → Callout (note)
 *   :::details Summary text → Expandable <details>
 *   :::quote         → Pull-quote
 *   :::              → Close block
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeShiki from '@shikijs/rehype';

export interface Heading {
    id: string;
    text: string;
    depth: number;
}

/**
 * Pre-process custom ::: blocks into raw HTML before the unified pipeline.
 */
function preprocessCustomBlocks(markdown: string): string {
    const lines = markdown.split('\n');
    const output: string[] = [];
    let inBlock = false;
    let blockType = '';
    let blockLabel = '';
    let blockContent: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();

        // Closing :::
        if (inBlock && trimmed === ':::') {
            if (blockType === 'quote') {
                output.push(`<div class="pull-quote">${blockContent.join(' ')}</div>`);
            } else if (blockType === 'details') {
                output.push(`<details class="expand-block"><summary>${blockLabel}</summary><div class="expand-content">${blockContent.join('\n')}</div></details>`);
            } else {
                // callout
                output.push(`<div class="callout ${blockType}"><div class="callout-label">${blockLabel}</div><p>${blockContent.join(' ')}</p></div>`);
            }
            inBlock = false;
            blockType = '';
            blockLabel = '';
            blockContent = [];
            continue;
        }

        if (inBlock) {
            blockContent.push(trimmed);
            continue;
        }

        // Opening ::: blocks
        const calloutMatch = trimmed.match(/^:::(tip|warning|info|note)\s+(.*)$/);
        if (calloutMatch) {
            inBlock = true;
            blockType = calloutMatch[1];
            blockLabel = calloutMatch[2];
            blockContent = [];
            continue;
        }

        const detailsMatch = trimmed.match(/^:::details\s+(.*)$/);
        if (detailsMatch) {
            inBlock = true;
            blockType = 'details';
            blockLabel = detailsMatch[1];
            blockContent = [];
            continue;
        }

        if (trimmed === ':::quote') {
            inBlock = true;
            blockType = 'quote';
            blockLabel = '';
            blockContent = [];
            continue;
        }

        output.push(line);
    }

    return output.join('\n');
}

/**
 * Extract headings from rendered HTML to build a TOC.
 */
function extractHeadings(html: string): Heading[] {
    const headings: Heading[] = [];
    const regex = /<h([2-3])\s+id="([^"]+)"[^>]*>(.*?)<\/h[2-3]>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
        const text = match[3]
            .replace(/<[^>]+>/g, '')
            .replace(/^[\d]+\s*\/\/\s*/, '');
        headings.push({
            depth: parseInt(match[1]),
            id: match[2],
            text: text.trim().toUpperCase(),
        });
    }
    return headings;
}

/**
 * Render Markdown to HTML with headings extracted.
 */
export async function renderMarkdown(content: string): Promise<{ html: string; headings: Heading[] }> {
    // Pre-process custom blocks
    const processed = preprocessCustomBlocks(content);

    const result = await unified()
        .use(remarkParse)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeSlug)
        .use(rehypeAutolinkHeadings, { behavior: 'wrap' })
        .use(rehypeShiki, { theme: 'github-dark' })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .process(processed);

    const html = String(result);
    const headings = extractHeadings(html);

    return { html, headings };
}
