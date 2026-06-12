import type { CalloutType, MarkdownBlockType, MdNode } from "./types";
import { calloutTypes } from "./types";

const supportedBlocks = new Set<string>([...calloutTypes, "details", "quote", "imagegrid"]);

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

  return cleaned
    .split("\n")
    .map((line) => (line.trim().startsWith(":::") ? `\n${line.trim()}\n` : line))
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
  const type = rawType as MarkdownBlockType;
  return {
    type,
    title: title?.trim() || (calloutTypes.includes(type as CalloutType) ? sentenceCase(type) : undefined),
  };
}

function transformBlockChildren(children: MdNode[], depth = 0): MdNode[] {
  const nextChildren: MdNode[] = [];
  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    const marker = paragraphText(child);
    const blockOpen = marker ? parseBlockOpen(marker) : null;

    if (!blockOpen || (depth > 0 && calloutTypes.includes(blockOpen.type as CalloutType))) {
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

    nextChildren.push({
      type: "customBlock",
      blockType: blockOpen.type,
      blockTitle: blockOpen.title,
      children: depth < 1 ? transformBlockChildren(blockChildren, depth + 1) : blockChildren,
    });
  }

  return nextChildren;
}

export function remarkCustomBlocks() {
  return (tree: MdNode) => {
    if (!tree.children) return;
    tree.children = transformBlockChildren(tree.children);
  };
}
