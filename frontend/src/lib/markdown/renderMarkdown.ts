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
    .use(rehypeKatex) // server-side KaTeX; no client math runtime
    .use(rehypeSlug)
    .use(rehypeCollectHeadings)
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      properties: {
        className: ["heading-anchor"],
        ariaLabel: "Link to section",
      },
      content: { type: "text", value: "#" },
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
  };
}

export type { Heading, RenderedMarkdown } from "./types";
