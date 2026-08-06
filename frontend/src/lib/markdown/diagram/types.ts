export const diagramColors = ["blue", "yellow", "orange", "green", "purple"] as const;
export type DiagramColor = (typeof diagramColors)[number] | "default";

export interface DiagramMetadata {
  type: "flow" | "erd";
  title?: string;
  columns?: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect extends Point {
  width: number;
  height: number;
}

export interface FlowNode {
  id: string;
  label: string;
  color: DiagramColor;
  rank: number;
  lane: number;
  decision: boolean;
  order: number;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  reference: boolean;
  order: number;
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export type FlowRouteKind = "same-lane" | "branch-down" | "direct-vertical" | "local-loop";

export interface LayoutFlowNode extends FlowNode, Rect {
  centerX: number;
  centerY: number;
  lines: string[];
}

export interface LayoutFlowEdge extends FlowEdge {
  path: string;
  routeKind: FlowRouteKind;
  targetAnchor: "middle-left" | "left-center" | "top-center" | "bottom-center";
  labelPoint?: Point;
  loopChannel?: number;
}

export interface FlowLayout {
  width: number;
  height: number;
  nodes: LayoutFlowNode[];
  edges: LayoutFlowEdge[];
}

export type ErdKey = "PK" | "FK" | "UK" | undefined;

export interface ErdReference {
  entity: string;
  field: string;
}

export interface ErdField {
  name: string;
  key: ErdKey;
  reference?: ErdReference;
  order: number;
}

export interface ErdEntity {
  id: string;
  name: string;
  color: DiagramColor;
  fields: ErdField[];
  order: number;
}

export interface ErdModel {
  columns: number;
  entities: ErdEntity[];
}

export interface LayoutErdField extends ErdField {
  y: number;
}

export interface LayoutErdEntity extends ErdEntity, Rect {
  fields: LayoutErdField[];
  row: number;
  column: number;
}

export interface LayoutErdRelation {
  id: string;
  sourceColor: DiagramColor;
  sourceEntity: string;
  sourceField: string;
  targetEntity: string;
  targetField: string;
  sourceAnchor: Point;
  targetAnchor: Point;
  sourceCardinality: "M";
  targetCardinality: "1";
  sourceLabelPoint: Point;
  targetLabelPoint: Point;
  points: Point[];
  path: string;
  channel: "direct" | "row-gutter" | "outer";
}

export interface ErdLayout {
  width: number;
  height: number;
  entities: LayoutErdEntity[];
  relations: LayoutErdRelation[];
}

export class DiagramSyntaxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiagramSyntaxError";
  }
}

export function normalizeDiagramColor(value: string | undefined): DiagramColor {
  const normalized = value?.trim().toLowerCase();
  return diagramColors.includes(normalized as (typeof diagramColors)[number])
    ? (normalized as DiagramColor)
    : "default";
}

export function parseColoredLabel(raw: string): {
  label: string;
  color: DiagramColor;
  reference: boolean;
} {
  let value = raw.trim();
  const reference = value.startsWith("@");
  if (reference) value = value.slice(1).trim();

  const suffix = value.match(/^(.*?):\s*([a-z][a-z0-9_-]*)$/i);
  if (!suffix) return { label: value, color: "default", reference };

  return {
    label: suffix[1].trim(),
    color: normalizeDiagramColor(suffix[2]),
    reference,
  };
}
