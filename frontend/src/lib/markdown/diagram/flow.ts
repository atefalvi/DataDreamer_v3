import type { HastNode } from "../types";
import {
  DiagramSyntaxError,
  parseColoredLabel,
  type FlowEdge,
  type FlowGraph,
  type FlowLayout,
  type FlowNode,
  type LayoutFlowEdge,
  type LayoutFlowNode,
} from "./types";

const NODE_HEIGHT = 52;
const MIN_NODE_WIDTH = 112;
const MAX_NODE_WIDTH = 232;
const MIN_COLUMN_GAP = 56;
const LANE_PITCH = 116;
const PAD_X = 18;
const PAD_Y = 24;
const LOOP_GAP = 32;
const LOOP_CHANNEL_GAP = 18;
const MAX_NODES = 80;
const MAX_EDGES = 160;
const POSITIVE_BRANCHES = new Set(["yes", "true", "ok", "pass", "success", "continue", "fallback"]);

interface LineContext {
  terminal: FlowNode;
  previous?: FlowNode;
}

function keyFor(label: string): string {
  return label.replace(/\s+/g, " ").trim().toLocaleLowerCase("en-US");
}

function nodeWidth(label: string): number {
  return Math.max(MIN_NODE_WIDTH, Math.min(MAX_NODE_WIDTH, 36 + [...label].length * 7.4));
}

function edgeLabelGap(label: string | undefined): number {
  if (!label) return MIN_COLUMN_GAP;
  return Math.max(MIN_COLUMN_GAP, 18 + [...label.toUpperCase()].length * 7);
}

function cleanBranchLabel(value: string): string {
  return value.replace(/:$/, "").trim();
}

/** Parse the constrained, indentation-aware DataDreamer flow DSL. */
export function parseFlow(source: string): FlowGraph {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const byLabel = new Map<string, FlowNode>();
  const contexts = new Map<number, LineContext>();
  const branchCount = new Map<string, number>();
  let maxLane = 0;

  const addNode = (
    raw: string,
    rank: number,
    lane: number,
    requireExisting = false,
  ): FlowNode => {
    const parsed = parseColoredLabel(raw);
    if (!parsed.label) throw new DiagramSyntaxError("Flow nodes must have a label.");
    if (parsed.label.length > 80) throw new DiagramSyntaxError(`Flow node “${parsed.label}” is too long.`);

    const key = keyFor(parsed.label);
    const existing = byLabel.get(key) ?? (
      parsed.reference && !parsed.label.endsWith("?")
        ? byLabel.get(keyFor(`${parsed.label}?`))
        : undefined
    );
    if (parsed.reference || requireExisting) {
      if (!existing) throw new DiagramSyntaxError(`Unknown flow reference: @${parsed.label}`);
      return existing;
    }
    if (existing) {
      if (existing.color === "default" && parsed.color !== "default") existing.color = parsed.color;
      return existing;
    }
    if (nodes.length >= MAX_NODES) throw new DiagramSyntaxError(`Flow diagrams support at most ${MAX_NODES} nodes.`);

    const node: FlowNode = {
      id: `flow-node-${nodes.length + 1}`,
      label: parsed.label,
      color: parsed.color,
      rank,
      lane,
      decision: parsed.label.endsWith("?"),
      order: nodes.length,
    };
    nodes.push(node);
    byLabel.set(key, node);
    maxLane = Math.max(maxLane, lane);
    return node;
  };

  const addEdge = (sourceNode: FlowNode, targetNode: FlowNode, label?: string, reference = false): FlowEdge => {
    const existing = edges.find((edge) => edge.source === sourceNode.id && edge.target === targetNode.id);
    if (existing) {
      if (!existing.label && label) existing.label = label;
      existing.reference ||= reference;
      return existing;
    }
    if (edges.length >= MAX_EDGES) throw new DiagramSyntaxError(`Flow diagrams support at most ${MAX_EDGES} connectors.`);
    const edge: FlowEdge = {
      id: `flow-edge-${edges.length + 1}`,
      source: sourceNode.id,
      target: targetNode.id,
      label,
      reference,
      order: edges.length,
    };
    edges.push(edge);
    return edge;
  };

  for (const rawLine of source.replace(/\t/g, "  ").split("\n")) {
    if (!rawLine.trim()) continue;
    const leading = rawLine.match(/^\s*/)?.[0].length ?? 0;
    const indent = Math.floor(leading / 2);
    const parts = rawLine.trim().split(/\s*->\s*/).map((part) => part.trim()).filter(Boolean);
    if (parts.length < 2) throw new DiagramSyntaxError(`Flow line needs at least one “->”: ${rawLine.trim()}`);

    if (indent === 0) {
      const firstParsed = parseColoredLabel(parts[0]);
      const knownFirst = byLabel.get(keyFor(firstParsed.label));
      const lane = knownFirst?.lane ?? (nodes.length ? maxLane + 1 : 0);
      let current = addNode(parts[0], knownFirst?.rank ?? 0, lane, firstParsed.reference);
      let previous: FlowNode | undefined;

      for (const token of parts.slice(1)) {
        const parsed = parseColoredLabel(token);
        const target = addNode(token, current.rank + 1, current.lane, parsed.reference);
        addEdge(current, target, undefined, parsed.reference);
        previous = current;
        current = target;
      }
      contexts.clear();
      contexts.set(0, { terminal: current, previous });
      continue;
    }

    const parentIndent = [...contexts.keys()].filter((value) => value < indent).sort((a, b) => b - a)[0];
    const parent = parentIndent === undefined ? undefined : contexts.get(parentIndent);
    if (!parent) throw new DiagramSyntaxError(`Indented flow branch has no parent: ${rawLine.trim()}`);

    const label = cleanBranchLabel(parts[0]);
    const firstTarget = parseColoredLabel(parts[1]);
    const firstExisting = byLabel.get(keyFor(firstTarget.label));

    // A branch may name the parent's terminal again solely to label the incoming edge,
    // as in `fallback -> Replica write?` before deeper yes/no branches.
    if (firstExisting?.id === parent.terminal.id && parent.previous) {
      addEdge(parent.previous, parent.terminal, label, firstTarget.reference);
      contexts.set(indent, { terminal: parent.terminal, previous: parent.previous });
      continue;
    }

    const priorBranches = branchCount.get(parent.terminal.id) ?? 0;
    const sameLane = priorBranches === 0 && POSITIVE_BRANCHES.has(label.toLowerCase());
    const branchLane = sameLane ? parent.terminal.lane : maxLane + 1;
    branchCount.set(parent.terminal.id, priorBranches + 1);

    let current = parent.terminal;
    let previous: FlowNode | undefined = parent.previous;
    for (const [index, token] of parts.slice(1).entries()) {
      const parsed = parseColoredLabel(token);
      const target = addNode(token, current.rank + 1, branchLane, parsed.reference);
      addEdge(current, target, index === 0 ? label : undefined, parsed.reference);
      previous = current;
      current = target;
    }
    for (const depth of [...contexts.keys()]) {
      if (depth >= indent) contexts.delete(depth);
    }
    contexts.set(indent, { terminal: current, previous });
  }

  if (!nodes.length) throw new DiagramSyntaxError("Flow diagram has no nodes.");
  return { nodes, edges };
}

function fmt(value: number): string {
  return Number(value.toFixed(1)).toString();
}

/** Deterministic layered layout: fixed ranks/lanes, measured columns, orthogonal edges. */
export function layoutFlow(graph: FlowGraph): FlowLayout {
  const rankWidths = new Map<number, number>();
  for (const node of graph.nodes) {
    rankWidths.set(node.rank, Math.max(rankWidths.get(node.rank) ?? 0, nodeWidth(node.label)));
  }
  const graphNodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const rankGaps = new Map<number, number>();
  for (const edge of graph.edges) {
    const source = graphNodesById.get(edge.source);
    const target = graphNodesById.get(edge.target);
    if (!source || !target || target.rank !== source.rank + 1) continue;
    rankGaps.set(
      source.rank,
      Math.max(rankGaps.get(source.rank) ?? MIN_COLUMN_GAP, edgeLabelGap(edge.label)),
    );
  }
  const ranks = [...rankWidths.keys()].sort((a, b) => a - b);
  const rankX = new Map<number, number>();
  let cursorX = PAD_X;
  for (const rank of ranks) {
    rankX.set(rank, cursorX);
    cursorX += (rankWidths.get(rank) ?? MIN_NODE_WIDTH) + (rankGaps.get(rank) ?? MIN_COLUMN_GAP);
  }

  const nodes: LayoutFlowNode[] = graph.nodes.map((node) => {
    const width = nodeWidth(node.label);
    const columnWidth = rankWidths.get(node.rank) ?? width;
    const x = (rankX.get(node.rank) ?? PAD_X) + (columnWidth - width) / 2;
    const y = PAD_Y + node.lane * LANE_PITCH;
    return {
      ...node,
      x,
      y,
      width,
      height: NODE_HEIGHT,
      centerX: x + width / 2,
      centerY: y + NODE_HEIGHT / 2,
    };
  });
  const byId = new Map(nodes.map((node) => [node.id, node]));
  let loopChannel = 0;
  let maxRouteY = Math.max(...nodes.map((node) => node.y + node.height));

  const edges: LayoutFlowEdge[] = graph.edges.map((edge) => {
    const source = byId.get(edge.source)!;
    const target = byId.get(edge.target)!;
    const aligned = Math.abs(source.centerX - target.centerX) < 1;
    const targetBelow = target.lane > source.lane;
    const forward = target.rank > source.rank;
    const sameLaneForward = target.lane === source.lane && target.x > source.x;

    if (sameLaneForward) {
      const startX = source.x + source.width;
      const endX = target.x;
      return {
        ...edge,
        path: `M${fmt(startX)} ${fmt(source.centerY)}H${fmt(endX)}`,
        routeKind: "same-lane",
        targetAnchor: "left-center",
        labelPoint: edge.label ? { x: (startX + endX) / 2, y: source.centerY - 14 } : undefined,
      };
    }

    if (aligned) {
      const downward = target.centerY > source.centerY;
      const startY = downward ? source.y + source.height : source.y;
      const endY = downward ? target.y : target.y + target.height;
      return {
        ...edge,
        path: `M${fmt(source.centerX)} ${fmt(startY)}V${fmt(endY)}`,
        routeKind: "direct-vertical",
        targetAnchor: downward ? "top-center" : "bottom-center",
        labelPoint: edge.label ? { x: source.centerX + 22, y: (startY + endY) / 2 } : undefined,
      };
    }

    if (targetBelow && forward) {
      const startY = source.y + source.height;
      const endX = target.x;
      return {
        ...edge,
        path: `M${fmt(source.centerX)} ${fmt(startY)}V${fmt(target.centerY)}H${fmt(endX)}`,
        routeKind: "branch-down",
        targetAnchor: "middle-left",
        labelPoint: edge.label
          ? { x: source.centerX + 24, y: (startY + target.centerY) / 2 }
          : undefined,
      };
    }

    const channel = loopChannel++;
    const channelY = Math.max(source.y + source.height, target.y + target.height) + LOOP_GAP + channel * LOOP_CHANNEL_GAP;
    maxRouteY = Math.max(maxRouteY, channelY);
    return {
      ...edge,
      path: `M${fmt(source.centerX)} ${fmt(source.y + source.height)}V${fmt(channelY)}H${fmt(target.centerX)}V${fmt(target.y + target.height)}`,
      routeKind: "local-loop",
      targetAnchor: "bottom-center",
      labelPoint: edge.label ? { x: (source.centerX + target.centerX) / 2, y: channelY - 9 } : undefined,
      loopChannel: channel,
    };
  });

  const maxNodeX = Math.max(...nodes.map((node) => node.x + node.width));
  return {
    width: Math.ceil(
      Math.max(
        maxNodeX + PAD_X,
        cursorX - (rankGaps.get(ranks.at(-1) ?? 0) ?? MIN_COLUMN_GAP) + PAD_X,
      ),
    ),
    height: Math.ceil(maxRouteY + PAD_Y + (loopChannel ? 12 : 0)),
    nodes,
    edges,
  };
}

function text(value: string): HastNode {
  return { type: "text", value };
}

function element(tagName: string, properties: Record<string, unknown>, children: HastNode[] = []): HastNode {
  return { type: "element", tagName, properties, children };
}

/** Render a completed flow layout as inline, server-generated SVG HAST. */
export function renderFlow(layout: FlowLayout, title: string, markerPrefix: string): HastNode {
  const markerId = `${markerPrefix}-arrow`;
  const accentMarkerId = `${markerPrefix}-arrow-accent`;
  const marker = (id: string, className: string[]) =>
    element(
      "marker",
      { id, markerWidth: "8", markerHeight: "8", refX: "7", refY: "4", orient: "auto" },
      [element("path", { className, d: "M0 0L8 4L0 8Z" })],
    );
  return element(
    "svg",
    {
      className: ["diagram-svg", "diagram-svg--flow"],
      viewBox: `0 0 ${layout.width} ${layout.height}`,
      width: String(layout.width),
      height: String(layout.height),
      role: "img",
      ariaLabel: title,
      style: `--diagram-width: ${layout.width}px;`,
    },
    [
      element("title", {}, [text(title)]),
      element("defs", {}, [
        marker(markerId, ["diagram-arrow"]),
        marker(accentMarkerId, ["diagram-arrow", "diagram-arrow--accent"]),
      ]),
      element(
        "g",
        { className: ["diagram-edges"] },
        layout.edges.map((edge) =>
          element("g", { className: ["diagram-edge-group"] }, [
            element("path", {
              className: [
                "diagram-edge",
                `diagram-edge--${edge.routeKind}`,
                ...(edge.reference ? ["diagram-edge--reference"] : []),
              ],
              d: edge.path,
              markerEnd: `url(#${edge.reference ? accentMarkerId : markerId})`,
              dataTargetAnchor: edge.targetAnchor,
              ...(edge.loopChannel === undefined ? {} : { dataLoopChannel: String(edge.loopChannel) }),
            }),
            ...(edge.label && edge.labelPoint
              ? [
                  element(
                    "text",
                    {
                      className: ["diagram-edge__label"],
                      x: fmt(edge.labelPoint.x),
                      y: fmt(edge.labelPoint.y),
                      textAnchor: "middle",
                    },
                    [text(edge.label.toUpperCase())],
                  ),
                ]
              : []),
          ]),
        ),
      ),
      element(
        "g",
        { className: ["diagram-nodes"] },
        layout.nodes.map((node) =>
          element(
            "g",
            {
              className: ["diagram-node", `diagram-node--${node.color}`, ...(node.decision ? ["diagram-node--decision"] : [])],
              dataNodeId: node.id,
            },
            [
              element("rect", {
                x: fmt(node.x),
                y: fmt(node.y),
                width: fmt(node.width),
                height: fmt(node.height),
                rx: node.decision ? String(NODE_HEIGHT / 2) : "8",
              }),
              element(
                "text",
                { x: fmt(node.centerX), y: fmt(node.centerY), textAnchor: "middle", dominantBaseline: "middle" },
                [text(node.label)],
              ),
            ],
          ),
        ),
      ),
    ],
  );
}
