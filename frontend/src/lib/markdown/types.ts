/**
 * Minimal structural types for the unified ASTs we touch.
 *
 * Deliberately local: the full @types/mdast and @types/hast packages are only
 * transitive dependencies of the remark/rehype plugins, and importing
 * transitive packages directly is fragile. The pipeline only needs this
 * structural subset.
 */

export interface MdNode {
  type: string;
  value?: string;
  url?: string;
  alt?: string | null;
  title?: string | null;
  depth?: number;
  lang?: string | null;
  blockType?: MarkdownBlockType;
  blockTitle?: string;
  /** Optional plain-text attribution extracted from the final line of a quote block. */
  blockAuthor?: string;
  /** Raw markdown body for plain-text blocks (checklist/metric/formula/…). */
  blockBody?: string;
  /** A single HTTPS link immediately following an embed block. The link remains
   * normal article content and also provides a provider-independent iframe fallback. */
  blockFallbackUrl?: string;
  position?: {
    start?: { offset?: number };
    end?: { offset?: number };
  };
  children?: MdNode[];
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
}

export interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

export interface Heading {
  id: string;
  text: string;
  depth: 2 | 3;
}

export interface RenderedMarkdown {
  html: string;
  headings: Heading[];
  readingMinutes: number;
  /** True when the document contains an :::imagegrid block (page mounts the lightbox). */
  hasImageGrid: boolean;
}

export const calloutTypes = [
  "note",
  "info",
  "tip",
  "warning",
  "caution",
  "important",
  "example",
  "technical",
] as const;

export type CalloutType = (typeof calloutTypes)[number];
export const richBlockTypes = [
  "details",
  "quote",
  "imagegrid",
  "checklist",
  "embed",
  "metric",
  "metrics",
  "formula",
  "divider",
  "text",
  "diagram",
] as const;

export const markdownBlockTypes = [...calloutTypes, ...richBlockTypes] as const;
export type MarkdownBlockType = (typeof markdownBlockTypes)[number];

/** Depth-first pre-order walk. Return false from the visitor to skip children. */
export function walk<T extends { children?: T[] }>(
  node: T,
  visitor: (node: T, parent: T | null) => boolean | undefined,
  parent: T | null = null,
): void {
  const descend = visitor(node, parent);
  if (descend === false || !node.children) return;
  // Copy: visitors may splice siblings while we iterate.
  for (const child of [...node.children]) {
    // Skip nodes a visitor already detached from this parent.
    if (!node.children.includes(child)) continue;
    walk(child, visitor, node);
  }
}
