import { createHash } from "node:crypto";

import type { HastNode } from "../types";
import { layoutErd, parseErd, renderErd } from "./erd";
import { layoutFlow, parseFlow, renderFlow } from "./flow";
import { DiagramSyntaxError, type DiagramMetadata } from "./types";

export const DIAGRAM_RENDERER_VERSION = "diagram-v5";
const CACHE_LIMIT = 100;
const renderCache = new Map<string, HastNode>();

function text(value: string): HastNode {
  return { type: "text", value };
}

function element(tagName: string, properties: Record<string, unknown>, children: HastNode[] = []): HastNode {
  return { type: "element", tagName, properties, children };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function parseDiagramSource(source: string, fallbackTitle?: string): { metadata: DiagramMetadata; body: string } {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const metadata: Partial<DiagramMetadata> = {};
  let bodyStart = 0;
  let foundMetadata = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) {
      if (foundMetadata) bodyStart = index + 1;
      continue;
    }
    const match = line.match(/^(type|title|columns):\s*(.+)$/i);
    if (!match) {
      bodyStart = index;
      break;
    }
    foundMetadata = true;
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (key === "type") {
      const normalized = value.toLowerCase();
      if (normalized !== "flow" && normalized !== "erd") {
        throw new DiagramSyntaxError(`Unsupported diagram type: ${value}`);
      }
      metadata.type = normalized;
    } else if (key === "title") {
      metadata.title = value.slice(0, 120);
    } else {
      const columns = Number.parseInt(value, 10);
      if (!Number.isFinite(columns)) throw new DiagramSyntaxError("Diagram columns must be a number.");
      metadata.columns = columns;
    }
    bodyStart = index + 1;
  }

  if (!metadata.type) throw new DiagramSyntaxError("Diagram metadata requires `type: flow` or `type: erd`.");
  metadata.title ||= fallbackTitle?.trim() || undefined;
  const body = lines.slice(bodyStart).join("\n").trim();
  if (!body) throw new DiagramSyntaxError("Diagram body is empty.");
  return { metadata: metadata as DiagramMetadata, body };
}

function cacheKeyFor(source: string, fallbackTitle?: string): string {
  const sourceHash = createHash("sha256")
    .update(`${fallbackTitle ?? ""}\n${source}`)
    .digest("hex")
    .slice(0, 20);
  return `${sourceHash}:${DIAGRAM_RENDERER_VERSION}`;
}

function errorElement(title: string | undefined, cacheKey: string): HastNode {
  return element(
    "figure",
    {
      className: ["diagram-block", "diagram-block--invalid"],
      role: "note",
      dataDiagramCacheKey: cacheKey,
    },
    [
      ...(title
        ? [element("figcaption", { className: ["diagram-block__title"] }, [text(title)])]
        : []),
      element("p", { className: ["diagram-block__error"] }, [
        text("Diagram unavailable. Check the diagram type, references, and source syntax."),
      ]),
    ],
  );
}

/**
 * Unified Markdown handler boundary. Source is parsed and laid out on the server;
 * the browser receives a finished inline SVG inside a contained scroll region.
 */
export function diagramElement(source: string, fallbackTitle?: string): HastNode {
  const cacheKey = cacheKeyFor(source, fallbackTitle);
  const cached = renderCache.get(cacheKey);
  if (cached) return clone(cached);

  let output: HastNode;
  try {
    const { metadata, body } = parseDiagramSource(source, fallbackTitle);
    const title = metadata.title || (metadata.type === "flow" ? "Flow diagram" : "Entity relationship diagram");
    const markerPrefix = `diagram-${cacheKey.slice(0, 12).replace(/[^a-z0-9-]/gi, "")}`;
    const rendered = metadata.type === "flow"
      ? (() => {
          const graph = parseFlow(body);
          const layout = layoutFlow(graph);
          return {
            svg: renderFlow(layout, title, markerPrefix),
            description: `Flow diagram with ${layout.nodes.length} nodes and ${layout.edges.length} connectors.`,
          };
        })()
      : (() => {
          const model = parseErd(body, metadata.columns);
          const layout = layoutErd(model);
          return {
            svg: renderErd(layout, title, markerPrefix),
            description: `Entity relationship diagram with ${layout.entities.length} entities and ${layout.relations.length} relationships. Each relationship shows M at the referencing entity and 1 at the referenced entity.`,
          };
        })();

    output = element(
      "figure",
      {
        className: ["diagram-block", `diagram-block--${metadata.type}`],
        dataDiagramType: metadata.type,
        dataDiagramCacheKey: cacheKey,
      },
      [
        element("figcaption", { className: ["diagram-block__head"] }, [
          element("span", { className: ["diagram-block__kind"] }, [
            text(metadata.type === "flow" ? "Flow diagram" : "Entity relationship diagram"),
          ]),
          element("span", { className: ["diagram-block__title"] }, [text(title)]),
        ]),
        element(
          "div",
          {
            className: ["diagram-block__viewport"],
            role: "region",
            ariaLabel: `${title}. Scroll horizontally to inspect the complete diagram.`,
            tabindex: "0",
          },
          [rendered.svg],
        ),
        element("p", { className: ["visually-hidden"] }, [text(rendered.description)]),
      ],
    );
  } catch (error) {
    const title = fallbackTitle || (error instanceof DiagramSyntaxError ? undefined : "Diagram");
    output = errorElement(title, cacheKey);
  }

  if (renderCache.size >= CACHE_LIMIT) renderCache.delete(renderCache.keys().next().value!);
  renderCache.set(cacheKey, clone(output));
  return output;
}

export { layoutErd, parseErd, renderErd } from "./erd";
export { layoutFlow, parseFlow, renderFlow } from "./flow";
export type * from "./types";
