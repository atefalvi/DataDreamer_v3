import katex from "katex";
import type { VFile } from "vfile";

import { getCalloutIcon } from "./icons";
import { transformMarkdownImageUrl } from "./images";
import type { CalloutType, HastNode, Heading, MarkdownBlockType, MdNode } from "./types";
import { calloutTypes, walk } from "./types";

interface HandlerState {
  all(node: MdNode): HastNode[];
}

interface ImageEntry {
  src: string;
  thumb: string;
  alt: string;
  caption?: string;
}

function textNode(value: string): HastNode {
  return { type: "text", value };
}

function element(tagName: string, properties: Record<string, unknown>, children: HastNode[] = []): HastNode {
  return { type: "element", tagName, properties, children };
}

function raw(value: string): HastNode {
  return { type: "raw", value };
}

function toSentenceCase(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function imageEntries(node: MdNode): ImageEntry[] {
  const entries: ImageEntry[] = [];
  walk(node, (candidate) => {
    if (candidate.type === "image" && candidate.url) {
      entries.push({
        src: transformMarkdownImageUrl(candidate.url), // full size — lightbox target
        thumb: transformMarkdownImageUrl(candidate.url, 640), // grid cell render
        alt: candidate.alt ?? "",
        caption: candidate.title?.trim() || undefined,
      });
    }
    return undefined;
  });
  return entries;
}

function calloutElement(state: HandlerState, node: MdNode, type: CalloutType): HastNode {
  const title = node.blockTitle || toSentenceCase(type);
  const label = `${toSentenceCase(type)}: ${title}`;

  return element(
    "aside",
    {
      className: ["callout", `callout--${type}`],
      role: "note",
      ariaLabel: label,
    },
    [
      element("div", { className: ["callout__header"] }, [
        raw(getCalloutIcon(type)),
        element("span", { className: ["callout__title"] }, [textNode(title)]),
      ]),
      element("div", { className: ["callout__body"] }, state.all(node)),
    ],
  );
}

/* ── Plain-text block bodies (checklist / embed / metric / formula / divider) ──
   These blocks carry `blockBody` (raw markdown slice) instead of mdast children. */

const FIELD_LINE = /^(label|value|caption|symbol|tone|pattern|url|source|height|ratio):\s*(.*)$/;

function parseBody(rawText: string): { fields: Record<string, string>; lines: string[] } {
  const fields: Record<string, string> = {};
  const lines: string[] = [];
  for (const rawLine of rawText.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(FIELD_LINE);
    if (match) fields[match[1]] = match[2].trim();
    else lines.push(line);
  }
  return { fields, lines };
}

function titleDiv(className: string, title?: string): HastNode[] {
  return title ? [element("div", { className: [className] }, [textNode(title)])] : [];
}

const checklistMarkers: Array<[RegExp, string, string]> = [
  [/^\[[xX]\]\s+/, "done", "✓"],
  [/^\[\s?\]\s+/, "pending", ""],
  [/^!\s+/, "risk", "!"],
  [/^\?\s+/, "question", "?"],
  [/^\*\s+/, "highlight", "★"],
  [/^-\s+/, "neutral", "•"],
];

function checklistElement(node: MdNode): HastNode {
  const items = (node.blockBody ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      for (const [pattern, state, glyph] of checklistMarkers) {
        if (pattern.test(line)) return { state, glyph, text: line.replace(pattern, "") };
      }
      return { state: "neutral", glyph: "•", text: line };
    });

  return element("div", { className: ["checklist-block"] }, [
    ...titleDiv("checklist-block__title", node.blockTitle),
    element(
      "ul",
      { className: ["checklist-block__list"] },
      items.map((item) =>
        element(
          "li",
          { className: ["checklist-block__item", `checklist-block__item--${item.state}`] },
          [
            element("span", { className: ["checklist-block__marker"], ariaHidden: "true" }, [
              textNode(item.glyph),
            ]),
            element("span", { className: ["checklist-block__text"] }, [textNode(item.text)]),
          ],
        ),
      ),
    ),
  ]);
}

interface EmbedConfig {
  src: string;
  source?: string;
  height?: number;
  ratio: string;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'");
}

function tagAttribute(rawText: string, tagNames: string[], attribute: string): string | undefined {
  const tags = rawText.match(new RegExp(`<(?:${tagNames.join("|")})\\b[^>]*>`, "gi")) ?? [];
  for (const tag of tags) {
    const attributes = new Map(
      [...tag.matchAll(/([\w-]+)\s*=\s*["']([^"']*)["']/g)].map((match) => [
        match[1].toLowerCase(),
        match[2],
      ]),
    );
    const value = attributes.get(attribute.toLowerCase());
    if (value) return value;
  }
  return undefined;
}

function objectParam(rawText: string, name: string): string | undefined {
  const params = rawText.match(/<param\b[^>]*>/gi) ?? [];
  for (const param of params) {
    const attributes = new Map(
      [...param.matchAll(/([\w-]+)\s*=\s*["']([^"']*)["']/g)].map((match) => [
        match[1].toLowerCase(),
        match[2],
      ]),
    );
    if (attributes.get("name")?.toLowerCase() === name.toLowerCase()) {
      return attributes.get("value");
    }
  }
  return undefined;
}

function safeEmbedUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** Convert legacy object metadata into a normal iframe URL without executing the
 * provider script. The strict host/name/version signature keeps arbitrary object
 * parameters from becoming navigable URLs. */
function legacyObjectEmbedUrl(rawText: string): string | undefined {
  const encodedHost = objectParam(rawText, "host_url");
  const name = objectParam(rawText, "name");
  const version = objectParam(rawText, "embed_code_version");
  if (!encodedHost || !name || !version) return undefined;

  let decodedHost: string;
  try {
    decodedHost = decodeURIComponent(encodedHost);
  } catch {
    return undefined;
  }
  const safeHost = safeEmbedUrl(decodedHost);
  if (!safeHost) return undefined;

  const viewSegments = name
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment));
  if (viewSegments.length < 2) return undefined;

  const siteSegments = (objectParam(rawText, "site_root") ?? "")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment));

  const url = new URL(safeHost);
  const basePath = url.pathname.replace(/\/$/, "");
  url.pathname = [basePath, ...siteSegments, "views", ...viewSegments].filter(Boolean).join("/");

  const query = [":showVizHome=no"];
  const tabs = objectParam(rawText, "tabs")?.toLowerCase();
  const toolbar = objectParam(rawText, "toolbar")?.toLowerCase();
  if (tabs === "yes" || tabs === "no") query.push(`:tabs=${tabs}`);
  if (toolbar === "yes" || toolbar === "no" || toolbar === "top") query.push(`:toolbar=${toolbar}`);
  url.search = query.join("&");
  return safeEmbedUrl(url.toString());
}

function positiveDimension(value: string | undefined): number | undefined {
  const parsed = Number.parseInt(value?.replace(/px$/i, "") ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 240 && parsed <= 1600 ? parsed : undefined;
}

function safeRatio(value: string | undefined): string | undefined {
  const match = value?.match(/^\s*(\d+(?:\.\d+)?)\s*(?:\/|:)\s*(\d+(?:\.\d+)?)\s*$/);
  if (!match) return undefined;
  const width = Number(match[1]);
  const height = Number(match[2]);
  return width > 0 && height > 0 ? `${width} / ${height}` : undefined;
}

export function extractEmbedUrl(rawText: string): string | undefined {
  const decoded = decodeHtmlEntities(rawText);
  const { fields, lines } = parseBody(decoded);
  const bareUrl = lines.find((line) => /^https:\/\/\S+$/i.test(line));
  return safeEmbedUrl(
    fields.url ??
      bareUrl ??
      tagAttribute(decoded, ["iframe", "embed"], "src") ??
      tagAttribute(decoded, ["object"], "data") ??
      legacyObjectEmbedUrl(decoded) ??
      // Legacy provider snippets commonly place a standard, usable fallback
      // URL inside <noscript><a href="…">. Treat that as the final generic
      // source without executing the discarded vendor script.
      tagAttribute(decoded, ["a"], "href"),
  );
}

function scriptedEmbedHeight(rawText: string): number | undefined {
  for (const match of rawText.matchAll(/\.style\.height\s*=\s*["'](\d+(?:px)?)["']/gi)) {
    const height = positiveDimension(match[1]);
    if (height) return height;
  }
  return undefined;
}

export function extractEmbedConfig(rawText: string): EmbedConfig | undefined {
  const decoded = decodeHtmlEntities(rawText);
  const { fields } = parseBody(decoded);
  const src = extractEmbedUrl(decoded);
  if (!src) return undefined;

  const iframeWidth = positiveDimension(tagAttribute(decoded, ["iframe", "embed"], "width"));
  const iframeHeight = positiveDimension(tagAttribute(decoded, ["iframe", "embed"], "height"));
  const legacyHeight = scriptedEmbedHeight(decoded);
  const inferredRatio = iframeWidth && iframeHeight ? `${iframeWidth} / ${iframeHeight}` : undefined;

  return {
    src,
    source: safeEmbedUrl(fields.source),
    height: positiveDimension(fields.height) ?? (inferredRatio ? undefined : iframeHeight ?? legacyHeight),
    ratio: safeRatio(fields.ratio) ?? inferredRatio ?? "16 / 9",
  };
}

function embedElement(node: MdNode): HastNode {
  const parsedConfig = extractEmbedConfig(node.blockBody ?? "");
  const fallbackUrl = safeEmbedUrl(node.blockFallbackUrl);
  const config = parsedConfig ?? (fallbackUrl ? { src: fallbackUrl, source: fallbackUrl, ratio: "16 / 9" } : undefined);
  const decoded = decodeHtmlEntities(node.blockBody ?? "");
  const { fields } = parseBody(decoded);
  const sourceUrl = safeEmbedUrl(fields.source);

  const children: HastNode[] = titleDiv("embed-block__title", node.blockTitle);
  if (config) {
    const style = `--embed-ratio: ${config.ratio};${config.height ? ` --embed-height: ${config.height}px;` : ""}`;
    children.push(
      element(
        "div",
        {
          className: ["embed-block__frame"],
          style,
          ...(config.height ? { dataEmbedHeight: String(config.height) } : {}),
        },
        [
          element(
            "iframe",
            {
              src: config.src,
              title: node.blockTitle || "Embedded content",
              loading: "lazy",
              allowFullScreen: true,
              allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share",
              sandbox:
                "allow-downloads allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts",
              referrerPolicy: "strict-origin-when-cross-origin",
            },
            [],
          ),
        ],
      ),
    );
    if (config.source && config.source !== config.src) {
      children.push(
        element(
          "a",
          {
            className: ["embed-block__source"],
            href: config.source,
            target: "_blank",
            rel: "noopener noreferrer",
          },
          [textNode("Open original"), element("span", { ariaHidden: "true" }, [textNode("↗")])],
        ),
      );
    }
  } else if (sourceUrl) {
    children.push(
      element(
        "a",
        { className: ["embed-block__fallback"], href: sourceUrl, target: "_blank", rel: "noopener noreferrer" },
        [textNode("Open embedded content")],
      ),
    );
  } else {
    children.push(element("p", { className: ["embed-block__fallback"] }, [textNode("Embed unavailable.")]));
  }
  return element("div", { className: ["embed-block"] }, children);
}

const INTERNAL_LINK_HOSTS = new Set(["data-dreamer.net", "www.data-dreamer.net"]);

/** Keep internal navigation in the current tab while making outbound references an
 * explicit new-tab handoff. Existing target/rel values are respected and hardened. */
export function rehypeExternalLinks() {
  return (tree: HastNode): void => {
    walk(tree, (node) => {
      if (node.type !== "element" || node.tagName !== "a") return undefined;
      const href = typeof node.properties?.href === "string" ? node.properties.href : undefined;
      if (!href) return undefined;

      try {
        const url = new URL(href);
        if ((url.protocol === "http:" || url.protocol === "https:") && !INTERNAL_LINK_HOSTS.has(url.hostname)) {
          node.properties = {
            ...node.properties,
            target: "_blank",
            rel: "noopener noreferrer",
          };
        }
      } catch {
        // Relative and fragment links stay in the current tab.
      }
      return undefined;
    });
  };
}

const symbolWords: Record<string, string> = {
  up: "↑", increase: "↑", increased: "↑", positive: "↑", higher: "↑",
  down: "↓", decrease: "↓", decreased: "↓", negative: "↓", lower: "↓",
  neutral: "—", stable: "—", same: "—", unchanged: "—",
  right: "→", next: "→", forward: "→",
  check: "✓", done: "✓", success: "✓",
  warning: "!", caution: "!", risk: "!",
  question: "?", unknown: "?",
  star: "★", highlight: "★",
};

const metricTones = new Set(["green", "red", "yellow", "blue", "neutral"]);

function metricCard(fields: Record<string, string>): HastNode {
  const tone = metricTones.has(fields.tone ?? "") ? fields.tone! : "neutral";
  const symbol = fields.symbol ? symbolWords[fields.symbol.toLowerCase()] ?? fields.symbol : undefined;

  return element("div", { className: ["metric-card", `metric-card--${tone}`] }, [
    element("div", { className: ["metric-card__value-row"] }, [
      ...(symbol
        ? [element("span", { className: ["metric-card__symbol"], ariaHidden: "true" }, [textNode(symbol)])]
        : []),
      element("span", { className: ["metric-card__value"] }, [textNode(fields.value ?? "—")]),
    ]),
    ...(fields.label ? [element("div", { className: ["metric-card__label"] }, [textNode(fields.label)])] : []),
    ...(fields.caption ? [element("div", { className: ["metric-card__caption"] }, [textNode(fields.caption)])] : []),
  ]);
}

function metricElement(node: MdNode, multiple: boolean): HastNode {
  const body = node.blockBody ?? "";
  const chunks = multiple ? body.split(/\n\s*-{3,}\s*\n/) : [body];
  const cards = chunks
    .map((chunk) => parseBody(chunk).fields)
    .filter((fields) => Object.keys(fields).length > 0)
    .map(metricCard);

  return element("div", { className: ["metric-grid"], dataCount: String(cards.length) }, [
    ...titleDiv("metric-grid__title", node.blockTitle),
    element("div", { className: ["metric-grid__cards"] }, cards),
  ]);
}

function formulaElement(node: MdNode): HastNode {
  const { fields, lines } = parseBody(node.blockBody ?? "");
  const formula = fields.value || lines.join("\n");
  const rendered = katex.renderToString(formula, { throwOnError: false, displayMode: true });

  return element("div", { className: ["formula-block"] }, [
    ...titleDiv("formula-block__title", node.blockTitle),
    element("div", { className: ["formula-block__math"] }, [raw(rendered)]),
    ...(fields.caption
      ? [element("div", { className: ["formula-block__caption"] }, [textNode(fields.caption)])]
      : []),
  ]);
}

const dividerPatterns: Record<string, string> = { "---": "dash", "***": "star", "-x-": "x" };
const dividerTones = new Set(["accent", "neutral", "muted"]);

function dividerElement(node: MdNode): HastNode {
  const { fields, lines } = parseBody(node.blockBody ?? "");
  const patternKey = fields.pattern ?? lines.find((line) => dividerPatterns[line]) ?? "---";
  const pattern = dividerPatterns[patternKey] ?? "dash";
  const tone = dividerTones.has(fields.tone ?? "") ? fields.tone! : "neutral";
  const label = fields.label || node.blockTitle;

  // Center content: the label when given, otherwise a small mark for star/x patterns.
  const centerGlyph = pattern === "star" ? "✳" : pattern === "x" ? "×" : undefined;
  const center = label
    ? [element("span", { className: ["divider-block__label"] }, [textNode(label)])]
    : centerGlyph
      ? [element("span", { className: ["divider-block__mark"], ariaHidden: "true" }, [textNode(centerGlyph)])]
      : [];

  return element(
    "div",
    {
      className: ["divider-block", `divider-block--${tone}`, `divider-block--${pattern}`],
      role: "separator",
      ...(label ? { ariaLabel: label } : {}),
    },
    center,
  );
}

export const markdownBlockHandlers = {
  customBlock(state: HandlerState, node: MdNode): HastNode {
    const type = node.blockType as MarkdownBlockType | undefined;

    if (type && calloutTypes.includes(type as CalloutType)) {
      return calloutElement(state, node, type as CalloutType);
    }

    if (type === "details") {
      return element("details", { className: ["expand"] }, [
        element("summary", {}, [textNode(node.blockTitle || "Details")]),
        element("div", { className: ["expand-content"] }, state.all(node)),
      ]);
    }

    if (type === "quote") {
      return element("figure", { className: ["pull-quote"] }, [
        element("blockquote", {}, state.all(node)),
      ]);
    }

    if (type === "text") {
      return element("div", { className: ["text-block"] }, [
        ...titleDiv("text-block__title", node.blockTitle),
        element("div", { className: ["text-block__body"] }, state.all(node)),
      ]);
    }

    if (type === "checklist") return checklistElement(node);
    if (type === "embed") return embedElement(node);
    if (type === "metric") return metricElement(node, false);
    if (type === "metrics") return metricElement(node, true);
    if (type === "formula") return formulaElement(node);
    if (type === "divider") return dividerElement(node);

    if (type === "imagegrid") {
      const images = imageEntries(node);
      // Contract: class="image-grid" + .ig-item + data-src + data-index are load-bearing
      // (lightbox discovery and the page's bodyHtml sniff) — do not rename.
      const grid = element(
        "div",
        { className: ["image-grid"], dataCount: String(images.length) },
        images.map((image, index) =>
          element(
            "button",
            {
              className: ["ig-item"],
              type: "button",
              dataSrc: image.src,
              dataIndex: String(index),
              ...(image.caption ? { dataCaption: image.caption } : {}),
              ariaLabel: image.alt ? `Open image: ${image.alt}` : `Open image ${index + 1}`,
            },
            [
              element("img", {
                src: image.thumb,
                alt: image.alt,
                loading: "lazy",
                decoding: "async",
              }),
            ],
          ),
        ),
      );
      if (!node.blockTitle) return grid;
      return element("figure", { className: ["image-grid-block"] }, [
        element("figcaption", { className: ["image-grid__title"] }, [textNode(node.blockTitle)]),
        grid,
      ]);
    }

    return element("div", {}, state.all(node));
  },
};

function textContent(node: HastNode): string {
  if (typeof node.value === "string") return node.value;
  return node.children?.map(textContent).join("") ?? "";
}

function classNames(node: HastNode): string[] {
  const value = node.properties?.className;
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return value.split(/\s+/);
  return [];
}

function firstElementChild(node: HastNode): HastNode | undefined {
  return node.children?.find((child) => child.type === "element");
}

function isStandaloneImageParagraph(node: HastNode): boolean {
  if (node.type !== "element" || node.tagName !== "p" || !node.children) return false;
  const meaningful = node.children.filter((child) => child.type !== "text" || Boolean(child.value?.trim()));
  return meaningful.length === 1 && meaningful[0].type === "element" && meaningful[0].tagName === "img";
}

function enhanceImage(node: HastNode): void {
  if (node.type !== "element" || node.tagName !== "img") return;
  node.properties = {
    ...node.properties,
    src: typeof node.properties?.src === "string" ? transformMarkdownImageUrl(node.properties.src) : node.properties?.src,
    loading: node.properties?.loading ?? "lazy",
    decoding: node.properties?.decoding ?? "async",
    ...(node.properties?.alt === "" ? { role: "presentation" } : {}),
  };
}

export function rehypeImageFigures() {
  return (tree: HastNode) => {
    walk(tree, (node, parent) => {
      if (node.type === "element" && node.tagName === "img") enhanceImage(node);
      if (!parent || !parent.children || !isStandaloneImageParagraph(node)) return;

      const image = firstElementChild(node);
      if (!image) return;
      enhanceImage(image);
      const title = image.properties?.title;
      if (title) {
        delete image.properties?.title;
      }

      const figure = element("figure", {}, [
        image,
        ...(typeof title === "string" && title.trim()
          ? [element("figcaption", {}, [textNode(title.trim())])]
          : []),
      ]);

      const index = parent.children.indexOf(node);
      if (index >= 0) parent.children.splice(index, 1, figure);
      return false;
    });
  };
}

function languageFromPre(node: HastNode): string {
  const dataLanguage = node.properties?.dataLanguage;
  if (typeof dataLanguage === "string" && dataLanguage) return dataLanguage;
  const code = firstElementChild(node);
  const classes = code ? classNames(code) : classNames(node);
  const languageClass = classes.find((name) => name.startsWith("language-"));
  return languageClass?.replace("language-", "") || "text";
}

export function rehypeMarkCodeLanguages() {
  return (tree: HastNode) => {
    walk(tree, (node) => {
      if (node.type !== "element" || node.tagName !== "pre") return undefined;
      const language = languageFromPre(node);
      node.properties = {
        ...node.properties,
        dataLanguage: language,
      };
      return undefined;
    });
  };
}

export function rehypeCodeBlocks() {
  return (tree: HastNode) => {
    walk(tree, (node, parent) => {
      if (!parent?.children || node.type !== "element" || node.tagName !== "pre") return;
      if (parent.type === "element" && parent.tagName === "div" && classNames(parent).includes("code-block")) return;

      node.properties = {
        ...node.properties,
        tabindex: "0",
      };

      const language = languageFromPre(node);
      const wrapper = element("div", { className: ["code-block"] }, [
        element("div", { className: ["code-block__header"] }, [
          element("span", { className: ["code-block__language"] }, [textNode(language)]),
          element(
            "button",
            {
              className: ["code-block__copy"],
              type: "button",
              ariaLabel: "Copy code",
              dataCodeCopy: "",
            },
            [
              // Copy + check icons (CSS swaps on [data-copied]); label is SR-only.
              element(
                "svg",
                {
                  className: ["code-block__icon", "code-block__icon--copy"],
                  viewBox: "0 0 24 24",
                  width: "15",
                  height: "15",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  ariaHidden: "true",
                },
                [
                  element("rect", { width: "13", height: "13", x: "9", y: "9", rx: "2" }, []),
                  element("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" }, []),
                ],
              ),
              element(
                "svg",
                {
                  className: ["code-block__icon", "code-block__icon--done"],
                  viewBox: "0 0 24 24",
                  width: "15",
                  height: "15",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  ariaHidden: "true",
                },
                [element("path", { d: "M20 6 9 17l-5-5" }, [])],
              ),
              element("span", { className: ["visually-hidden"], dataCopyLabel: "" }, [textNode("Copy")]),
            ],
          ),
        ]),
        node,
      ]);

      const index = parent.children.indexOf(node);
      if (index >= 0) parent.children.splice(index, 1, wrapper);
      return false;
    });
  };
}

export function rehypeTableScrollRegions() {
  return (tree: HastNode) => {
    walk(tree, (node, parent) => {
      if (!parent?.children || node.type !== "element" || node.tagName !== "table") return;
      if (parent.type === "element" && classNames(parent).includes("table-scroll")) return;

      const wrapper = element(
        "div",
        {
          className: ["table-scroll"],
          role: "region",
          ariaLabel: "Scrollable table",
          tabindex: "0",
        },
        [node],
      );

      const index = parent.children.indexOf(node);
      if (index >= 0) parent.children.splice(index, 1, wrapper);
      return false;
    });
  };
}

export function rehypeCollectHeadings() {
  return (tree: HastNode, file: VFile) => {
    const headings: Heading[] = [];
    walk(tree, (node) => {
      if (node.type !== "element" || (node.tagName !== "h2" && node.tagName !== "h3")) return;
      const id = node.properties?.id;
      if (typeof id !== "string") return;
      headings.push({
        id,
        text: textContent(node).trim(),
        depth: node.tagName === "h2" ? 2 : 3,
      });
      return undefined;
    });
    file.data.headings = headings;
  };
}
