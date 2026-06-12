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
  alt: string;
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
        src: transformMarkdownImageUrl(candidate.url),
        alt: candidate.alt ?? "",
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

    if (type === "imagegrid") {
      const images = imageEntries(node);
      return element(
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
              ariaLabel: image.alt ? `Open image: ${image.alt}` : `Open image ${index + 1}`,
            },
            [
              element("img", {
                src: image.src,
                alt: image.alt,
                loading: "lazy",
                decoding: "async",
              }),
            ],
          ),
        ),
      );
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
            },
            [textNode("Copy")],
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
