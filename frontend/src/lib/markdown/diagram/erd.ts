import type { HastNode } from "../types";
import {
  DiagramSyntaxError,
  parseColoredLabel,
  type ErdEntity,
  type ErdField,
  type ErdLayout,
  type ErdModel,
  type LayoutErdEntity,
  type LayoutErdRelation,
  type Point,
  type Rect,
} from "./types";

const HEADER_HEIGHT = 44;
const FIELD_HEIGHT = 29;
const MIN_ENTITY_WIDTH = 190;
const MAX_ENTITY_WIDTH = 300;
const MIN_ENTITY_HEIGHT = 80;
const COLUMN_GAP = 64;
const ROW_GAP = 64;
const PAD_X = 28;
const PAD_Y = 24;
const OUTER_CHANNEL_GAP = 18;
const TRACK_SPACING = 10;
const MAX_ENTITIES = 24;
const MAX_FIELDS = 30;

function entityKey(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase("en-US");
}

function fieldKey(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

function entityWidth(entity: ErdEntity): number {
  const titleChars = [...entity.name.toUpperCase()].length + 2;
  const fieldChars = entity.fields.reduce((max, field) => {
    const prefix = field.key ? 5 : 5;
    return Math.max(max, prefix + [...field.name].length);
  }, 0);
  return Math.max(MIN_ENTITY_WIDTH, Math.min(MAX_ENTITY_WIDTH, 30 + Math.max(titleChars, fieldChars) * 7.4));
}

/** Parse author-ordered entities, fields, keys, and FK targets from the ERD DSL. */
export function parseErd(source: string, columns = 3): ErdModel {
  const entities: ErdEntity[] = [];
  let current: ErdEntity | undefined;

  for (const rawLine of source.replace(/\t/g, "  ").split("\n")) {
    if (!rawLine.trim()) continue;
    const indent = rawLine.match(/^\s*/)?.[0].length ?? 0;
    const value = rawLine.trim();

    if (indent === 0) {
      if (entities.length >= MAX_ENTITIES) throw new DiagramSyntaxError(`ERDs support at most ${MAX_ENTITIES} entities.`);
      const parsed = parseColoredLabel(value);
      if (!parsed.label) throw new DiagramSyntaxError("ERD entities must have a name.");
      if (parsed.reference) throw new DiagramSyntaxError("ERD entity declarations cannot use @ references.");
      if (entities.some((entity) => entityKey(entity.name) === entityKey(parsed.label))) {
        throw new DiagramSyntaxError(`Duplicate ERD entity: ${parsed.label}`);
      }
      current = {
        id: `erd-entity-${entities.length + 1}`,
        name: parsed.label,
        color: parsed.color,
        fields: [],
        order: entities.length,
      };
      entities.push(current);
      continue;
    }

    if (!current) throw new DiagramSyntaxError(`ERD field has no entity: ${value}`);
    if (current.fields.length >= MAX_FIELDS) {
      throw new DiagramSyntaxError(`Entity “${current.name}” supports at most ${MAX_FIELDS} fields.`);
    }

    const keyMatch = value.match(/^(PK|FK|UK)\s+(.+)$/i);
    const key = keyMatch?.[1].toUpperCase() as ErdField["key"];
    const fieldValue = (keyMatch?.[2] ?? value).trim();
    const relationParts = fieldValue.split(/\s*->\s*/);
    const name = relationParts[0]?.trim();
    if (!name) throw new DiagramSyntaxError(`ERD field in “${current.name}” is missing a name.`);
    if (current.fields.some((field) => fieldKey(field.name) === fieldKey(name))) {
      throw new DiagramSyntaxError(`Duplicate field “${name}” in “${current.name}”.`);
    }

    let reference: ErdField["reference"];
    if (relationParts[1]) {
      const target = relationParts[1].trim().match(/^(.+)\.([^.]*)$/);
      if (!target?.[1]?.trim() || !target[2]?.trim()) {
        throw new DiagramSyntaxError(`Invalid ERD reference: ${relationParts[1]}`);
      }
      reference = { entity: target[1].trim(), field: target[2].trim() };
    }
    if (reference && key !== "FK") {
      throw new DiagramSyntaxError(`Only FK fields can declare a relationship: ${value}`);
    }

    current.fields.push({ name, key, reference, order: current.fields.length });
  }

  if (!entities.length) throw new DiagramSyntaxError("ERD has no entities.");
  const safeColumns = Math.max(1, Math.min(4, Math.round(columns || 3)));

  const byEntity = new Map(entities.map((entity) => [entityKey(entity.name), entity]));
  for (const entity of entities) {
    for (const field of entity.fields) {
      if (!field.reference) continue;
      const targetEntity = byEntity.get(entityKey(field.reference.entity));
      if (!targetEntity) throw new DiagramSyntaxError(`Unknown ERD entity reference: ${field.reference.entity}`);
      if (!targetEntity.fields.some((targetField) => fieldKey(targetField.name) === fieldKey(field.reference!.field))) {
        throw new DiagramSyntaxError(
          `Unknown ERD field reference: ${field.reference.entity}.${field.reference.field}`,
        );
      }
    }
  }

  return { columns: Math.min(safeColumns, entities.length), entities };
}

function segmentHitsRect(a: Point, b: Point, rect: Rect): boolean {
  const inset = 7;
  const left = rect.x - inset;
  const right = rect.x + rect.width + inset;
  const top = rect.y - inset;
  const bottom = rect.y + rect.height + inset;
  if (a.y === b.y) {
    return a.y > top && a.y < bottom && Math.max(a.x, b.x) > left && Math.min(a.x, b.x) < right;
  }
  return a.x > left && a.x < right && Math.max(a.y, b.y) > top && Math.min(a.y, b.y) < bottom;
}

function routeClear(points: Point[], entities: LayoutErdEntity[], excluded: Set<string>): boolean {
  for (let index = 0; index < points.length - 1; index += 1) {
    for (const entity of entities) {
      if (excluded.has(entity.id)) continue;
      if (segmentHitsRect(points[index], points[index + 1], entity)) return false;
    }
  }
  return true;
}

function routeLength(points: Point[]): number {
  return points.slice(1).reduce(
    (sum, point, index) => sum + Math.abs(point.x - points[index].x) + Math.abs(point.y - points[index].y),
    0,
  );
}

function simplifyRoute(points: Point[]): Point[] {
  const deduplicated = points.filter(
    (point, index) => index === 0 || point.x !== points[index - 1].x || point.y !== points[index - 1].y,
  );
  const simplified: Point[] = [];
  for (const point of deduplicated) {
    const previous = simplified.at(-1);
    const beforePrevious = simplified.at(-2);
    if (
      previous
      && beforePrevious
      && ((beforePrevious.x === previous.x && previous.x === point.x)
        || (beforePrevious.y === previous.y && previous.y === point.y))
    ) {
      simplified[simplified.length - 1] = point;
    } else {
      simplified.push(point);
    }
  }
  return simplified;
}

function intervalOverlap(a1: number, a2: number, b1: number, b2: number): number {
  return Math.max(0, Math.min(Math.max(a1, a2), Math.max(b1, b2)) - Math.max(Math.min(a1, a2), Math.min(b1, b2)));
}

function isEndpoint(point: Point, a: Point, b: Point): boolean {
  return (point.x === a.x && point.y === a.y) || (point.x === b.x && point.y === b.y);
}

function routeConflictScore(points: Point[], routed: Point[][]): number {
  let score = 0;
  for (let index = 0; index < points.length - 1; index += 1) {
    const a = points[index];
    const b = points[index + 1];
    for (const prior of routed) {
      for (let priorIndex = 0; priorIndex < prior.length - 1; priorIndex += 1) {
        const c = prior[priorIndex];
        const d = prior[priorIndex + 1];
        const vertical = a.x === b.x;
        const priorVertical = c.x === d.x;

        if (vertical === priorVertical) {
          const collinear = vertical ? a.x === c.x : a.y === c.y;
          if (!collinear) continue;
          const overlap = vertical
            ? intervalOverlap(a.y, b.y, c.y, d.y)
            : intervalOverlap(a.x, b.x, c.x, d.x);
          if (overlap > 0) score += 10_000 + overlap * 100;
          continue;
        }

        const verticalStart = vertical ? a : c;
        const verticalEnd = vertical ? b : d;
        const horizontalStart = vertical ? c : a;
        const horizontalEnd = vertical ? d : b;
        const crossing = { x: verticalStart.x, y: horizontalStart.y };
        const crosses = crossing.y >= Math.min(verticalStart.y, verticalEnd.y)
          && crossing.y <= Math.max(verticalStart.y, verticalEnd.y)
          && crossing.x >= Math.min(horizontalStart.x, horizontalEnd.x)
          && crossing.x <= Math.max(horizontalStart.x, horizontalEnd.x);
        if (!crosses) continue;
        const sharedEndpoint = isEndpoint(crossing, a, b) && isEndpoint(crossing, c, d);
        if (!sharedEndpoint) score += 1_000;
      }
    }
  }
  return score;
}

function corridorTracks(center: number): number[] {
  return [center, center - TRACK_SPACING, center + TRACK_SPACING];
}

function pathFrom(points: Point[]): string {
  return points
    .map((point, index) => `${index === 0 ? "M" : point.x === points[index - 1].x ? "V" : "H"}${
      index === 0 ? `${point.x} ${point.y}` : point.x === points[index - 1].x ? point.y : point.x
    }`)
    .join("");
}

function endpointLabelPoint(endpoint: Point, neighbour: Point): Point {
  const direction = Math.sign(neighbour.x - endpoint.x) || 1;
  return { x: endpoint.x + direction * 13, y: endpoint.y - 7 };
}

function roundedTopRectPath(x: number, y: number, width: number, height: number, radius = 8): string {
  return [
    `M${x + radius} ${y}`,
    `H${x + width - radius}`,
    `Q${x + width} ${y} ${x + width} ${y + radius}`,
    `V${y + height}`,
    `H${x}`,
    `V${y + radius}`,
    `Q${x} ${y} ${x + radius} ${y}`,
    "Z",
  ].join("");
}

/** Row-major, content-measured ERD layout with field-row-aware orthogonal routing. */
export function layoutErd(model: ErdModel): ErdLayout {
  const widths = model.entities.map(entityWidth);
  const rows = Math.ceil(model.entities.length / model.columns);
  const columnWidths = Array.from({ length: model.columns }, (_, column) =>
    Math.max(...widths.filter((_, index) => index % model.columns === column)),
  );
  const naturalHeights = model.entities.map((entity) =>
    Math.max(MIN_ENTITY_HEIGHT, HEADER_HEIGHT + entity.fields.length * FIELD_HEIGHT + 10),
  );
  const rowHeights = Array.from({ length: rows }, (_, row) =>
    Math.max(...naturalHeights.slice(row * model.columns, (row + 1) * model.columns)),
  );
  const columnX: number[] = [];
  let cursorX = PAD_X;
  for (const width of columnWidths) {
    columnX.push(cursorX);
    cursorX += width + COLUMN_GAP;
  }
  const rowY: number[] = [];
  let cursorY = PAD_Y;
  for (const height of rowHeights) {
    rowY.push(cursorY);
    cursorY += height + ROW_GAP;
  }

  const entities: LayoutErdEntity[] = model.entities.map((entity, index) => {
    const row = Math.floor(index / model.columns);
    const column = index % model.columns;
    const width = widths[index];
    const x = columnX[column] + (columnWidths[column] - width) / 2;
    const y = rowY[row];
    return {
      ...entity,
      x,
      y,
      width,
      // Keep row tracks aligned, but let each entity end after its own final field.
      // Forcing every entity to the row maximum created large blank card interiors.
      height: naturalHeights[index],
      row,
      column,
      fields: entity.fields.map((field, fieldIndex) => ({
        ...field,
        y: y + HEADER_HEIGHT + FIELD_HEIGHT * fieldIndex + FIELD_HEIGHT / 2,
      })),
    };
  });

  const byName = new Map(entities.map((entity) => [entityKey(entity.name), entity]));
  const rightEdge = Math.max(...entities.map((entity) => entity.x + entity.width));
  const leftChannel = 10;
  const rightChannel = rightEdge + OUTER_CHANNEL_GAP;
  const gapTracks = columnX.slice(1).map((x, index) => {
    const previousRight = columnX[index] + columnWidths[index];
    return corridorTracks((previousRight + x) / 2);
  });
  const gridBottom = Math.max(...entities.map((entity) => entity.y + entity.height));
  const topChannel = Math.max(6, PAD_Y - OUTER_CHANNEL_GAP);
  const bottomChannel = gridBottom + OUTER_CHANNEL_GAP;
  const rowGapTracks = rowY.slice(1).flatMap((y, index) => {
    const previousBottom = rowY[index] + rowHeights[index];
    return corridorTracks((previousBottom + y) / 2);
  });
  const horizontalTracks = [topChannel, ...rowGapTracks, bottomChannel];
  const relations: LayoutErdRelation[] = [];
  const routedPoints: Point[][] = [];

  const sideTracks = (entity: LayoutErdEntity) => [
    {
      anchorX: entity.x,
      tracks: entity.column === 0 ? [leftChannel] : gapTracks[entity.column - 1],
    },
    {
      anchorX: entity.x + entity.width,
      tracks: entity.column === model.columns - 1 ? [rightChannel] : gapTracks[entity.column],
    },
  ];

  for (const sourceEntity of entities) {
    for (const sourceField of sourceEntity.fields) {
      if (!sourceField.reference) continue;
      const targetEntity = byName.get(entityKey(sourceField.reference.entity))!;
      const targetField = targetEntity.fields.find(
        (field) => fieldKey(field.name) === fieldKey(sourceField.reference!.field),
      )!;
      const excluded = new Set([sourceEntity.id, targetEntity.id]);
      const candidates: Array<{ points: Point[]; channel: LayoutErdRelation["channel"] }> = [];
      const signatures = new Set<string>();
      const addCandidate = (points: Point[], channel: LayoutErdRelation["channel"]) => {
        const simplified = simplifyRoute(points);
        const signature = simplified.map((point) => `${point.x},${point.y}`).join("|");
        if (simplified.length < 2 || signatures.has(signature)) return;
        signatures.add(signature);
        candidates.push({ points: simplified, channel });
      };

      const targetIsRight = targetEntity.x + targetEntity.width / 2 >= sourceEntity.x + sourceEntity.width / 2;
      const directStart = {
        x: targetIsRight ? sourceEntity.x + sourceEntity.width : sourceEntity.x,
        y: sourceField.y,
      };
      const directEnd = {
        x: targetIsRight ? targetEntity.x : targetEntity.x + targetEntity.width,
        y: targetField.y,
      };
      if (directStart.y === directEnd.y) {
        addCandidate([directStart, directEnd], "direct");
      } else if (sourceEntity.column !== targetEntity.column) {
        const middleX = (directStart.x + directEnd.x) / 2;
        addCandidate(
          [directStart, { x: middleX, y: directStart.y }, { x: middleX, y: directEnd.y }, directEnd],
          "row-gutter",
        );
      }

      for (const channelX of [...gapTracks.flat(), leftChannel, rightChannel]) {
        const start = {
          x: channelX < sourceEntity.x ? sourceEntity.x : sourceEntity.x + sourceEntity.width,
          y: sourceField.y,
        };
        const end = {
          x: channelX < targetEntity.x ? targetEntity.x : targetEntity.x + targetEntity.width,
          y: targetField.y,
        };
        addCandidate(
          [start, { x: channelX, y: start.y }, { x: channelX, y: end.y }, end],
          channelX === leftChannel || channelX === rightChannel ? "outer" : "row-gutter",
        );
      }

      for (const sourceSide of sideTracks(sourceEntity)) {
        for (const targetSide of sideTracks(targetEntity)) {
          for (const sourceTrack of sourceSide.tracks) {
            for (const targetTrack of targetSide.tracks) {
              for (const horizontalY of horizontalTracks) {
                const channel = horizontalY === topChannel || horizontalY === bottomChannel
                  ? "outer"
                  : "row-gutter";
                addCandidate(
                  [
                    { x: sourceSide.anchorX, y: sourceField.y },
                    { x: sourceTrack, y: sourceField.y },
                    { x: sourceTrack, y: horizontalY },
                    { x: targetTrack, y: horizontalY },
                    { x: targetTrack, y: targetField.y },
                    { x: targetSide.anchorX, y: targetField.y },
                  ],
                  channel,
                );
              }
            }
          }
        }
      }

      const viable = candidates
        .filter((candidate) => routeClear(candidate.points, entities, excluded))
        .sort((a, b) => {
          const aScore = routeConflictScore(a.points, routedPoints) + routeLength(a.points) + a.points.length * 12;
          const bScore = routeConflictScore(b.points, routedPoints) + routeLength(b.points) + b.points.length * 12;
          return aScore - bScore;
        });
      const chosen = viable[0];
      if (!chosen) {
        throw new DiagramSyntaxError(
          `Unable to route ERD relationship: ${sourceEntity.name}.${sourceField.name} -> ${targetEntity.name}.${targetField.name}`,
        );
      }
      routedPoints.push(chosen.points);
      relations.push({
        id: `erd-relation-${relations.length + 1}`,
        sourceColor: sourceEntity.color,
        sourceEntity: sourceEntity.name,
        sourceField: sourceField.name,
        targetEntity: targetEntity.name,
        targetField: targetField.name,
        sourceAnchor: chosen.points[0],
        targetAnchor: chosen.points[chosen.points.length - 1],
        sourceCardinality: "M",
        targetCardinality: "1",
        sourceLabelPoint: endpointLabelPoint(chosen.points[0], chosen.points[1]),
        targetLabelPoint: endpointLabelPoint(
          chosen.points[chosen.points.length - 1],
          chosen.points[chosen.points.length - 2],
        ),
        points: chosen.points,
        path: pathFrom(chosen.points),
        channel: chosen.channel,
      });
    }
  }

  return {
    width: Math.ceil(rightChannel + PAD_X),
    height: Math.ceil(
      Math.max(
        gridBottom,
        ...routedPoints.flat().map((point) => point.y),
      ) + PAD_Y,
    ),
    entities,
    relations,
  };
}

function text(value: string): HastNode {
  return { type: "text", value };
}

function element(tagName: string, properties: Record<string, unknown>, children: HastNode[] = []): HastNode {
  return { type: "element", tagName, properties, children };
}

/** Render a completed ERD layout as inline, server-generated SVG HAST. */
export function renderErd(layout: ErdLayout, title: string, _markerPrefix: string): HastNode {
  return element(
    "svg",
    {
      className: ["diagram-svg", "diagram-svg--erd"],
      viewBox: `0 0 ${layout.width} ${layout.height}`,
      width: String(layout.width),
      height: String(layout.height),
      role: "img",
      ariaLabel: title,
      style: `--diagram-width: ${layout.width}px;`,
    },
    [
      element("title", {}, [text(title)]),
      element(
        "g",
        { className: ["diagram-relations"] },
        layout.relations.map((relation) =>
          element(
            "g",
            {
              className: ["diagram-relation-group", `diagram-relation-group--${relation.sourceColor}`],
              dataRelation: `${relation.sourceEntity}.${relation.sourceField} -> ${relation.targetEntity}.${relation.targetField}`,
            },
            [
              element("title", {}, [
                text(
                  `${relation.sourceEntity}.${relation.sourceField} (many) references ${relation.targetEntity}.${relation.targetField} (one)`,
                ),
              ]),
              element("path", {
                className: ["diagram-relation", `diagram-relation--${relation.channel}`],
                d: relation.path,
                dataSourceField: `${relation.sourceEntity}.${relation.sourceField}`,
                dataTargetField: `${relation.targetEntity}.${relation.targetField}`,
              }),
              element(
                "text",
                {
                  className: ["diagram-relation__cardinality", "diagram-relation__cardinality--many"],
                  x: String(relation.sourceLabelPoint.x),
                  y: String(relation.sourceLabelPoint.y),
                  textAnchor: "middle",
                },
                [text(relation.sourceCardinality)],
              ),
              element(
                "text",
                {
                  className: ["diagram-relation__cardinality", "diagram-relation__cardinality--one"],
                  x: String(relation.targetLabelPoint.x),
                  y: String(relation.targetLabelPoint.y),
                  textAnchor: "middle",
                },
                [text(relation.targetCardinality)],
              ),
            ],
          ),
        ),
      ),
      element(
        "g",
        { className: ["diagram-entities"] },
        layout.entities.map((entity) =>
          element("g", { className: ["diagram-entity"], dataEntity: entity.name }, [
            element("rect", {
              className: ["diagram-entity__box"],
              x: String(entity.x),
              y: String(entity.y),
              width: String(entity.width),
              height: String(entity.height),
              rx: "8",
            }),
            element("path", {
              className: ["diagram-entity__head", `diagram-entity__head--${entity.color}`],
              d: roundedTopRectPath(entity.x, entity.y, entity.width, HEADER_HEIGHT),
            }),
            element("line", {
              className: ["diagram-entity__rule"],
              x1: String(entity.x),
              y1: String(entity.y + HEADER_HEIGHT),
              x2: String(entity.x + entity.width),
              y2: String(entity.y + HEADER_HEIGHT),
            }),
            element(
              "text",
              {
                className: ["diagram-entity__title"],
                x: String(entity.x + 18),
                y: String(entity.y + HEADER_HEIGHT / 2),
                dominantBaseline: "middle",
              },
              [text(entity.name.toUpperCase())],
            ),
            ...entity.fields.flatMap((field) => [
              ...(field.key
                ? [
                    element(
                      "text",
                      {
                        className: ["diagram-entity__key", `diagram-entity__key--${field.key.toLowerCase()}`],
                        x: String(entity.x + 18),
                        y: String(field.y),
                        dominantBaseline: "middle",
                      },
                      [text(field.key)],
                    ),
                  ]
                : []),
              element(
                "text",
                {
                  className: ["diagram-entity__field"],
                  x: String(entity.x + 54),
                  y: String(field.y),
                  dominantBaseline: "middle",
                },
                [text(field.name)],
              ),
            ]),
          ]),
        ),
      ),
    ],
  );
}
