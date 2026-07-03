import type { CalloutType, MarkdownBlockType, MdNode } from "./types";
import { calloutTypes } from "./types";

const supportedBlocks = new Set<string>([
  ...calloutTypes,
  "details",
  "detail", // alias, normalized to "details" in parseBlockOpen
  "quote",
  "imagegrid",
  "checklist",
  "embed",
  "metric",
  "metrics",
  "formula",
  "divider",
  "text",
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
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<p[^>]*>/gi, "");

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
  return node.children?.map(nodeText).join("") ?? "";
}

function paragraphText(node: MdNode): string | null {
  if (node.type !== "paragraph") return null;
  return nodeText(node).trim();
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
        children: [],
      });
      continue;
    }

    nextChildren.push({
      type: "customBlock",
      blockType: blockOpen.type,
      blockTitle: blockOpen.title,
      children: depth < 1 ? transformBlockChildren(blockChildren, source, depth + 1) : blockChildren,
    });
  }

  return nextChildren;
}

export function remarkCustomBlocks() {
  return (tree: MdNode, file: { toString(): string }) => {
    if (!tree.children) return;
    tree.children = transformBlockChildren(tree.children, String(file));
  };
}
