import { describe, expect, it } from "vitest";

import { layoutErd, layoutFlow, parseErd, parseFlow } from "../diagram";

describe("flow diagram parser and layout", () => {
  it("reuses @ExistingNode references without duplicating nodes", () => {
    const graph = parseFlow(`
Incoming data -> Valid?: yellow
  yes -> Load: blue -> Available: green
  no -> Remediate: orange -> @Load
`);

    expect(graph.nodes.filter((node) => node.label === "Load")).toHaveLength(1);
    expect(graph.edges.some((edge) => edge.reference && edge.target === graph.nodes.find((node) => node.label === "Load")?.id)).toBe(true);
  });

  it("allows a decision reference to omit only its terminal question mark", () => {
    const graph = parseFlow(`
Start -> Primary write?: yellow
  no -> Retry: orange -> @Primary write
`);

    expect(graph.nodes.filter((node) => node.label === "Primary write?")).toHaveLength(1);
    expect(graph.edges.some((edge) => edge.reference && edge.target === graph.nodes.find((node) => node.label === "Primary write?")?.id)).toBe(true);
  });

  it("falls back to the default node style for unknown colors", () => {
    const graph = parseFlow("Start -> Queue: teal");
    expect(graph.nodes.find((node) => node.label === "Queue")?.color).toBe("default");
  });

  it("routes lower branches into the destination middle-left anchor", () => {
    const layout = layoutFlow(parseFlow(`
Start -> Valid?: yellow
  yes -> Complete: green
  no -> Remediate: orange
`));
    const branch = layout.edges.find((edge) => edge.label === "no");

    expect(branch?.routeKind).toBe("branch-down");
    expect(branch?.targetAnchor).toBe("middle-left");
  });

  it("uses local, separate retry channels for multiple back edges", () => {
    const layout = layoutFlow(parseFlow(`
Send -> Valid?: yellow
  yes -> Store -> Done
  no -> Retry fast -> @Send

Retry fast -> Recovered?: yellow
  yes -> Store
  no -> Retry slow -> @Retry fast
`));
    const loops = layout.edges.filter((edge) => edge.routeKind === "local-loop");

    expect(loops.length).toBeGreaterThanOrEqual(2);
    expect(new Set(loops.map((edge) => edge.loopChannel)).size).toBe(loops.length);
    expect(loops.every((edge) => !edge.path.includes(`H${layout.width}`))).toBe(true);
  });

  it("keeps every node and connector inside the computed SVG bounds", () => {
    const layout = layoutFlow(parseFlow(`
Start -> Valid?: yellow
  yes -> Complete: green
  no -> Retry: orange -> @Start

Retry -> Recovered?: yellow
  no -> Dead-letter queue: orange
`));

    expect(layout.nodes.every((node) => node.x >= 0 && node.y >= 0)).toBe(true);
    expect(layout.nodes.every((node) => node.x + node.width <= layout.width)).toBe(true);
    expect(layout.nodes.every((node) => node.y + node.height <= layout.height)).toBe(true);
    expect(layout.nodes.find((node) => node.label === "Dead-letter queue")).toBeDefined();
  });
});

describe("ERD parser and layout", () => {
  const source = `
Customer: chartreuse
  PK customer_id
  name

Order: orange
  PK order_id
  FK customer_id -> Customer.customer_id
  UK order_number
`;

  it("uses declaration order, key metadata, and safe color fallback", () => {
    const model = parseErd(source, 2);

    expect(model.entities.map((entity) => entity.name)).toEqual(["Customer", "Order"]);
    expect(model.entities[0].color).toBe("default");
    expect(model.entities[1].fields.map((field) => field.key)).toEqual(["PK", "FK", "UK"]);
  });

  it("attaches relationships to the exact source and target field rows", () => {
    const layout = layoutErd(parseErd(source, 2));
    const sourceEntity = layout.entities.find((entity) => entity.name === "Order")!;
    const targetEntity = layout.entities.find((entity) => entity.name === "Customer")!;
    const sourceField = sourceEntity.fields.find((field) => field.name === "customer_id")!;
    const targetField = targetEntity.fields.find((field) => field.name === "customer_id")!;
    const relation = layout.relations[0];

    expect(relation.sourceAnchor.y).toBe(sourceField.y);
    expect(relation.targetAnchor.y).toBe(targetField.y);
    expect(layout.entities.every((entity) => entity.x + entity.width <= layout.width)).toBe(true);
  });
});
