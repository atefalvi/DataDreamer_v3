import type { CalloutType, MarkdownBlockType, MdNode } from "./types";
import { calloutTypes, markdownBlockTypes } from "./types";

const supportedBlocks = new Set<string>([
  ...markdownBlockTypes,
  "detail", // alias, normalized to "details" in parseBlockOpen
]);

/**
 * Blocks whose body is plain text (markers, `key: value` fields, URLs, LaTeX) rather
 * than markdown content. Their body is sliced from the raw source so markdown parsing
 * can't mangle it (e.g. `*`/`-` checklist markers becoming lists, `_` in LaTeX becoming
 * emphasis, `---` metric separators becoming thematic breaks).
 */
const rawBodyBlocks = new Set<MarkdownBlockType>([
  "checklist",
  "embed",
  "metric",
  "metrics",
  "formula",
  "divider",
  "diagram",
]);

interface BlockOpen {
  type: MarkdownBlockType;
  title?: string;
}

export function wysiwygNormalize(raw: string): string {
  const cleaned = raw
    .replace(/&nbsp;/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(
      /<p>\s*(```[\w-]*)\s*<\/p>([\s\S]*?)<p>\s*(```)\s*<\/p>/g,
      (_match: string, open: string, content: string, close: string) => {
        const innerContent = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\n");
        return `\n\n${open}\n${innerContent}${close}\n\n`;
      },
    )
    .replace(/(?:<p>\s*\|[^<]*\|\s*<\/p>\n?)+/g, (match) => {
      const rows = [...match.matchAll(/<p>\s*(.*?)\s*<\/p>/g)].map((row) => row[1]);
      return `\n\n${rows.join("\n")}\n\n`;
    })
    .replace(/<p>\s*(:::[^<]*)\s*<\/p>/g, "\n\n$1\n\n")
    .replace(/<\/p\s*>/gi, "\n\n")
    // Match paragraph tags only. The previous `<p...>` expression also consumed
    // `<param>` and `<pre>` tags inside vendor snippets before custom blocks saw them.
    .replace(/<p\b[^>]*>/gi, "");

  // Isolate ::: fences on their own blank-line-separated lines — but never inside a
  // code fence, so articles can show ::: authoring syntax in examples verbatim.
  let inCodeFence = false;
  return cleaned
    .split("\n")
    .map((line) => {
      if (line.trim().startsWith("```")) inCodeFence = !inCodeFence;
      if (inCodeFence || !line.trim().startsWith(":::")) return line;
      return `\n${line.trim()}\n`;
    })
    .join("\n");
}

function nodeText(node: MdNode): string {
  if (typeof node.value === "string") return node.value;
  if (node.type === "break") return "\n";
  return node.children?.map(nodeText).join("") ?? "";
}

function paragraphText(node: MdNode): string | null {
  if (node.type !== "paragraph") return null;
  return nodeText(node).trim();
}

function removeInlineQuoteAttribution(node: MdNode): boolean {
  if (!node.children?.length) return false;
  for (let index = node.children.length - 1; index >= 0; index -= 1) {
    const child = node.children[index];
    if (typeof child.value === "string") {
      const stripped = child.value.replace(/\n\s*(?:author:\s*|[—–]\s*).+\s*$/i, "").trimEnd();
      if (stripped !== child.value) {
        child.value = stripped;
        return true;
      }
      if (/^(?:author:\s*|[—–]\s*).+$/i.test(child.value.trim())) {
        node.children.splice(index, 1);
        if (node.children[index - 1]?.type === "break") node.children.splice(index - 1, 1);
        return true;
      }
    }
    if (removeInlineQuoteAttribution(child)) return true;
  }
  return false;
}

function quoteAttribution(children: MdNode[]): { author?: string; children: MdNode[] } {
  const finalParagraph = children.at(-1);
  const finalText = finalParagraph ? paragraphText(finalParagraph) : null;
  const match = finalText?.match(/(?:^|\n)\s*(?:author:\s*|[—–]\s*)([^\n]+)\s*$/i);
  const author = match?.[1]?.trim().slice(0, 120);
  if (!author || !finalParagraph) return { children };

  if (match?.index === 0) return { author, children: children.slice(0, -1) };
  removeInlineQuoteAttribution(finalParagraph);
  return { author, children };
}

function sentenceCase(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function parseBlockOpen(value: string): BlockOpen | null {
  const match = value.match(/^:::(\w+)(?:(?:\s+(.+))|\{title=(?:"([^"]+)"|'([^']+)'|([^}]+))\})?$/);
  if (!match) return null;

  const rawType = match[1];
  if (!supportedBlocks.has(rawType)) return null;

  const title = match[3] ?? match[4] ?? match[5] ?? match[2];
  const type = (rawType === "detail" ? "details" : rawType) as MarkdownBlockType;
  return {
    type,
    title: title?.trim() || (calloutTypes.includes(type as CalloutType) ? sentenceCase(type) : undefined),
  };
}

function rawBody(blockChildren: MdNode[], source: string): string {
  const start = blockChildren[0]?.position?.start?.offset;
  const end = blockChildren[blockChildren.length - 1]?.position?.end?.offset;
  if (typeof start !== "number" || typeof end !== "number") return "";
  return source.slice(start, end);
}

function followingLinkUrl(node: MdNode | undefined): string | undefined {
  if (node?.type !== "paragraph" || node.children?.length !== 1) return undefined;
  const [link] = node.children;
  return link.type === "link" && link.url?.startsWith("https://") ? link.url : undefined;
}

function transformBlockChildren(children: MdNode[], source: string, depth = 0): MdNode[] {
  const nextChildren: MdNode[] = [];
  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    const marker = paragraphText(child);
    const blockOpen = marker ? parseBlockOpen(marker) : null;

    // One safe nested level: blocks (including callouts and :::text) parse inside a
    // depth-0 block; anything deeper stays plain content (no recursion below depth 1).
    if (!blockOpen) {
      nextChildren.push(child);
      continue;
    }

    const blockChildren: MdNode[] = [];
    let closed = false;
    let nestedDepth = 0;
    index += 1;

    for (; index < children.length; index += 1) {
      const candidate = children[index];
      const candidateMarker = paragraphText(candidate);
      if (candidateMarker === ":::" && nestedDepth === 0) {
        closed = true;
        break;
      }
      if (candidateMarker === ":::") {
        nestedDepth -= 1;
        blockChildren.push(candidate);
        continue;
      }
      if (depth < 1 && candidateMarker && parseBlockOpen(candidateMarker)) {
        nestedDepth += 1;
      }
      blockChildren.push(candidate);
    }

    if (!closed) {
      nextChildren.push(child, ...blockChildren);
      break;
    }

    if (rawBodyBlocks.has(blockOpen.type)) {
      nextChildren.push({
        type: "customBlock",
        blockType: blockOpen.type,
        blockTitle: blockOpen.title,
        blockBody: rawBody(blockChildren, source),
        blockFallbackUrl: blockOpen.type === "embed" ? followingLinkUrl(children[index + 1]) : undefined,
        children: [],
      });
      continue;
    }

    const transformedChildren = depth < 1 ? transformBlockChildren(blockChildren, source, depth + 1) : blockChildren;
    const quote = blockOpen.type === "quote"
      ? quoteAttribution(transformedChildren)
      : { children: transformedChildren };

    nextChildren.push({
      type: "customBlock",
      blockType: blockOpen.type,
      blockTitle: blockOpen.title,
      blockAuthor: quote.author,
      children: quote.children,
    });
  }

  return nextChildren;
}

export function remarkCustomBlocks() {
  return (tree: MdNode, file: { toString(): string; data: Record<string, unknown> }) => {
    if (!tree.children) return;
    tree.children = transformBlockChildren(tree.children, String(file));
    // Structured fact for consumers (the article page mounts the lightbox on it),
    // instead of string-sniffing the rendered HTML.
    file.data.hasImageGrid = hasBlock(tree.children, "imagegrid");
  };
}

function hasBlock(children: MdNode[], type: MarkdownBlockType): boolean {
  return children.some(
    (child) =>
      (child.type === "customBlock" && child.blockType === type) ||
      (child.children ? hasBlock(child.children, type) : false),
  );
}
