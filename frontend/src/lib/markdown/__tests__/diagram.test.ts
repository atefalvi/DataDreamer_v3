import { describe, expect, it } from "vitest";

import { layoutErd, layoutFlow, parseErd, parseFlow, renderErd, renderFlow } from "../diagram";
import type { LayoutErdEntity, Point } from "../diagram";

function segmentCrossesEntity(a: Point, b: Point, entity: LayoutErdEntity): boolean {
  const inset = 7;
  const left = entity.x - inset;
  const right = entity.x + entity.width + inset;
  const top = entity.y - inset;
  const bottom = entity.y + entity.height + inset;
  return a.y === b.y
    ? a.y > top && a.y < bottom && Math.max(a.x, b.x) > left && Math.min(a.x, b.x) < right
    : a.x > left && a.x < right && Math.max(a.y, b.y) > top && Math.min(a.y, b.y) < bottom;
}

function collinearOverlap(a: Point, b: Point, c: Point, d: Point): number {
  const vertical = a.x === b.x;
  if (vertical !== (c.x === d.x)) return 0;
  if ((vertical && a.x !== c.x) || (!vertical && a.y !== c.y)) return 0;
  const [a1, a2, b1, b2] = vertical ? [a.y, b.y, c.y, d.y] : [a.x, b.x, c.x, d.x];
  return Math.max(0, Math.min(Math.max(a1, a2), Math.max(b1, b2)) - Math.max(Math.min(a1, a2), Math.min(b1, b2)));
}

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

  it("aligns branch labels with their destination rows and wraps long node text", () => {
    const layout = layoutFlow(parseFlow(`
Presentation -> Functionality -> Integrity
  presentation -> Test what the user sees: green
  functionality -> Understand behaviour and dependencies: yellow
  integrity -> Trace the data evidence and failure path: orange
`));
    const branches = layout.edges.filter((edge) => edge.label);

    expect(branches.map((edge) => edge.labelPoint?.y)).toEqual(
      branches.map((edge) => layout.nodes.find((node) => node.id === edge.target)!.centerY - 12),
    );
    expect(branches.map((edge) => edge.labelPoint?.y)).toEqual(
      [...branches.map((edge) => edge.labelPoint!.y)].sort((a, b) => a - b),
    );
    expect(layout.nodes.find((node) => node.label === "Understand behaviour and dependencies")?.lines)
      .toEqual(["Understand behaviour and", "dependencies"]);
    expect(layout.nodes.find((node) => node.label === "Trace the data evidence and failure path")?.lines.length)
      .toBeGreaterThan(1);
  });

  it("renders flow connector hover targets and multiline tspans", () => {
    const layout = layoutFlow(parseFlow("Start -> Trace the data evidence and failure path: orange"));
    const rendered = JSON.stringify(renderFlow(layout, "Integrity flow", "test-flow"));

    expect(rendered).toContain("diagram-edge__hit-area");
    expect(rendered).toContain("diagram-edge-group--orange");
    expect(rendered).toContain('"tagName":"tspan"');
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

  it("uses a matching accent arrowhead for accent retry paths", () => {
    const layout = layoutFlow(parseFlow(`
Start -> Valid?: yellow
  no -> Retry: orange -> @Start
`));
    const rendered = JSON.stringify(renderFlow(layout, "Retry flow", "test-flow"));

    expect(rendered).toContain("diagram-arrow--accent");
    expect(rendered).toContain("diagram-edge--reference");
    expect(rendered).toContain("url(#test-flow-arrow-accent)");
  });

  it("reserves enough horizontal space for branch labels", () => {
    const layout = layoutFlow(parseFlow(`
Start -> Primary?: yellow
  fallback -> Replica: blue
`));
    const edge = layout.edges.find((candidate) => candidate.label === "fallback")!;
    const source = layout.nodes.find((node) => node.id === edge.source)!;
    const target = layout.nodes.find((node) => node.id === edge.target)!;

    expect(target.x - (source.x + source.width)).toBeGreaterThanOrEqual(70);
  });

  it("keeps a comfortable minimum gap between adjacent flow nodes", () => {
    const layout = layoutFlow(parseFlow("Start -> Complete"));
    const [source, target] = layout.nodes;

    expect(target.x - (source.x + source.width)).toBeGreaterThanOrEqual(56);
  });

  it("keeps non-reference return routes neutral", () => {
    const layout = layoutFlow(parseFlow(`
Start -> Valid?: yellow
  yes -> Store: blue
  no -> Retry: orange
Retry -> Recovered?: yellow
  yes -> Store
`));
    const rendered = JSON.stringify(renderFlow(layout, "Converging flow", "test-flow"));
    const neutralLoop = layout.edges.find((edge) => edge.routeKind === "local-loop" && !edge.reference);

    expect(neutralLoop).toBeDefined();
    expect(rendered).toContain("url(#test-flow-arrow)");
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

  it("sizes each entity to its own fields instead of the tallest card in its row", () => {
    const layout = layoutErd(parseErd(source, 2));
    const customer = layout.entities.find((entity) => entity.name === "Customer")!;
    const order = layout.entities.find((entity) => entity.name === "Order")!;

    expect(customer.height).toBeLessThan(order.height);
    expect(customer.y).toBe(order.y);
  });

  it("renders explicit many-to-one labels and square lower header corners", () => {
    const layout = layoutErd(parseErd(source, 2));
    const relation = layout.relations[0];
    const rendered = JSON.stringify(renderErd(layout, "Commerce model", "test-erd"));

    expect(relation.sourceCardinality).toBe("M");
    expect(relation.targetCardinality).toBe("1");
    expect(relation.sourceColor).toBe("orange");
    expect(rendered).toContain("diagram-relation__cardinality--many");
    expect(rendered).toContain("diagram-relation__cardinality--one");
    expect(rendered).toContain("diagram-relation-group--orange");
    expect(rendered).toContain("Order.customer_id (many) references Customer.customer_id (one)");
    expect(rendered).toContain('"value":"M"');
    expect(rendered).toContain('"value":"1"');
    expect(rendered).toContain('"tagName":"path","properties":{"className":["diagram-entity__head"');
    expect(rendered).not.toContain("markerEnd");
  });

  it("gives dense three-column ERDs room for distinct relationship tracks", () => {
    const layout = layoutErd(parseErd(`
Account: green
  PK account_id

Subscription: blue
  PK subscription_id
  FK account_id -> Account.account_id

Plan: purple
  PK plan_id

Invoice: yellow
  PK invoice_id
  FK account_id -> Account.account_id

InvoiceLine: orange
  PK invoice_line_id
  FK invoice_id -> Invoice.invoice_id
  FK subscription_id -> Subscription.subscription_id
`, 3));
    const account = layout.entities.find((entity) => entity.name === "Account")!;
    const subscription = layout.entities.find((entity) => entity.name === "Subscription")!;

    expect(subscription.x - (account.x + account.width)).toBeGreaterThanOrEqual(50);
    expect(new Set(layout.relations.map((relation) => relation.path)).size).toBe(layout.relations.length);
    expect(layout.relations.every((relation) => {
      const thirdPartyEntities = layout.entities.filter(
        (entity) => entity.name !== relation.sourceEntity && entity.name !== relation.targetEntity,
      );
      return relation.points.slice(1).every((point, index) =>
        thirdPartyEntities.every((entity) => !segmentCrossesEntity(relation.points[index], point, entity)),
      );
    })).toBe(true);

    for (const [index, relation] of layout.relations.entries()) {
      for (const other of layout.relations.slice(index + 1)) {
        for (let segment = 0; segment < relation.points.length - 1; segment += 1) {
          for (let otherSegment = 0; otherSegment < other.points.length - 1; otherSegment += 1) {
            expect(
              collinearOverlap(
                relation.points[segment],
                relation.points[segment + 1],
                other.points[otherSegment],
                other.points[otherSegment + 1],
              ),
            ).toBe(0);
          }
        }
      }
    }
  });
});
