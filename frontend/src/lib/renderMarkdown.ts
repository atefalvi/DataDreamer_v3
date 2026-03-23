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
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeShiki from '@shikijs/rehype';
import rehypeRaw from 'rehype-raw';

export interface Heading {
    id: string;
    text: string;
    depth: number;
}

/**
 * Pre-process custom ::: blocks into raw HTML before the unified pipeline.
 */
function preprocessCustomBlocks(markdown: string): string {
    // Strip common HTML tags if the user is using the WYSIWYG editor
    // but typing markdown markers directly.
    const cleanContent = markdown
        .replace(/&nbsp;/g, ' ')                 // Unescape spaces
        .replace(/<br\s*\/?>/gi, '\n')           // Convert <br> to newlines
        .replace(/<p>\s*(\|[\s\S]*?\|)\s*<\/p>/g, '\n\n$1\n\n') // Strip <p> around tables and ensure isolation
        .replace(/<p>\s*(:::[^<]*)\s*<\/p>/g, '\n\n$1\n\n');    // Strip <p> around ::: blocks

    const lines = cleanContent.split('\n');
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
                const cleanedQuote = blockContent
                    .map(l => l.replace(/<\/?p>/g, '').trim())
                    .filter(Boolean)
                    .join('<br />');
                output.push(`<div class="pull-quote">\n${cleanedQuote}\n</div>`);
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

        // Opening ::: blocks - Support both :::info Title and :::info{title="Title"}
        const calloutMatch = trimmed.match(/^:::(tip|warning|info|note)(?:\s+(.*)|{.*})?$/);
        if (calloutMatch) {
            inBlock = true;
            blockType = calloutMatch[1];
            // If it's a bracket format :::info{title="xxx"}, we don't have a simple regex group for label here
            // but we can try to extract it if needed. For now, let's support the simple space format.
            blockLabel = calloutMatch[2] || blockType.toUpperCase();
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
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeSlug)
        .use(rehypeAutolinkHeadings, { behavior: 'wrap' })
        .use(rehypeShiki, { theme: 'github-dark' })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .process(processed);

    const html = String(result);
    const headings = extractHeadings(html);

    return { html, headings };
}
