import rehypeShiki from "@shikijs/rehype";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype, { type Options as RemarkRehypeOptions } from "remark-rehype";
import { unified } from "unified";

import {
  markdownBlockHandlers,
  rehypeCodeBlocks,
  rehypeCollectHeadings,
  rehypeExternalLinks,
  rehypeImageFigures,
  rehypeMarkCodeLanguages,
  rehypeTableScrollRegions,
} from "./rehype";
import { remarkCustomBlocks, wysiwygNormalize } from "./blocks";
import type { Heading, RenderedMarkdown } from "./types";

const remarkRehypeOptions: RemarkRehypeOptions = {
  allowDangerousHtml: true,
  handlers: markdownBlockHandlers as unknown as RemarkRehypeOptions["handlers"],
};

function readingMinutes(markdown: string): number {
  const words = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .match(/\b[\w'-]+\b/g);
  return Math.max(1, Math.ceil((words?.length ?? 0) / 220));
}

export async function renderMarkdown(content: string): Promise<RenderedMarkdown> {
  const normalized = wysiwygNormalize(content);
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath) // inline $…$ and block $$…$$ math
    .use(remarkCustomBlocks)
    .use(remarkRehype, remarkRehypeOptions)
    .use(rehypeRaw)
    .use(rehypeExternalLinks)
    .use(rehypeKatex) // server-side KaTeX; no client math runtime
    .use(rehypeSlug)
    .use(rehypeCollectHeadings)
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      properties: {
        className: ["heading-anchor"],
        ariaLabel: "Copy link to this section",
      },
      content: {
        type: "element",
        tagName: "svg",
        properties: {
          viewBox: "0 0 24 24",
          ariaHidden: "true",
          focusable: "false",
        },
        children: [
          {
            type: "element",
            tagName: "path",
            properties: { d: "M10 13a5 5 0 0 0 7.54.54l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15" },
            children: [],
          },
          {
            type: "element",
            tagName: "path",
            properties: { d: "M14 11a5 5 0 0 0-7.54-.54l-2 2a5 5 0 0 0 7.07 7.07l1.14-1.14" },
            children: [],
          },
        ],
      },
    })
    .use(rehypeMarkCodeLanguages)
    .use(rehypeCodeBlocks)
    .use(rehypeShiki, {
      themes: {
        light: "github-light-default",
        dark: "github-dark-default",
      },
      defaultColor: false,
    })
    .use(rehypeTableScrollRegions)
    .use(rehypeImageFigures)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(normalized);

  return {
    html: String(file),
    headings: (file.data.headings as Heading[] | undefined) ?? [],
    readingMinutes: readingMinutes(normalized),
    hasImageGrid: Boolean(file.data.hasImageGrid),
  };
}

export type { Heading, RenderedMarkdown } from "./types";
