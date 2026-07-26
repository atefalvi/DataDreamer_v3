# Dream Team Specialties Taxonomy

Specialties are reusable capability areas that connect people in the Dream Team
network. They are not job titles, industries, employers, software products, or content
Topics. The canonical machine-readable list lives in
`backend/data/specialties.json` and is synchronized with Directus by
`scripts/cms-model-maintenance.mjs`.

## Selection rules

- Assign two to four Specialties that describe how the person works with data,
  systems, evidence, or decisions.
- Put the strongest Specialty first. The `authors_specialties.sort` value determines
  the primary Specialty used by profile and graph presentation.
- Prefer an existing broad capability over a narrow synonym. A network engineer uses
  `Infrastructure & Networks`; a financial analyst uses
  `Finance & Commercial Analysis`; an HR partner can use `People & Workforce` and
  `Analytics & Insight`.
- Do not encode seniority (`Senior Engineer`), employer (`Banking`), tool (`Power BI`),
  or temporary assignment (`Q3 migration`) as a Specialty.
- Add a new Specialty only when the capability is durable, transferable across
  organizations, clearly distinct from every option below, and likely to connect more
  than one person over time.

Unused Specialties do not appear in the network. The Dream Team page derives its nodes
from specialties assigned to visible authors and prioritizes capabilities shared by
more than one person, so maintaining a broad catalogue does not clutter the graph.

## Canonical catalogue

| Specialty | Covers |
|---|---|
| Data Engineering | Pipelines, integration, transformation, storage, quality, and production data systems. |
| Analytics & Insight | Analysis, measurement, interpretation, and evidence-based decisions. |
| Applied AI & Machine Learning | Practical AI, ML, evaluation, intelligent workflows, and responsible model use. |
| Operations & Service Delivery | Capacity, service performance, operational planning, and delivery systems. |
| People & Workforce | Hiring, workforce planning, organizational health, retention, learning, and employee experience. |
| Software Engineering | Applications, APIs, testing, maintainability, delivery practices, and production software. |
| Infrastructure & Networks | Cloud, compute, connectivity, network operations, observability, and platforms. |
| Project & Program Management | Planning, dependencies, resources, risk, stakeholder alignment, and portfolios. |
| Finance & Commercial Analysis | Planning, forecasting, investment, pricing, performance, and commercial decisions. |
| Data Governance | Ownership, definitions, lineage, stewardship, access, quality standards, and responsible use. |
| Risk, Compliance & Controls | Risk assessment, policy, auditability, regulation, controls, and assurance. |
| Business Intelligence | Reporting, semantic models, dashboards, self-service analysis, and trusted metrics. |
| Data Visualization & Communication | Charts, information design, narrative, explanation, and clear communication. |
| Automation & Process Design | Workflow automation, process improvement, orchestration, and repeatability. |
| Product Management | Discovery, prioritization, roadmaps, user needs, and outcome-led decisions. |
| Research & Experimentation | Research design, hypotheses, testing, causal thinking, synthesis, and learning. |
| Architecture & Systems Design | Boundaries, integrations, technical trade-offs, scalability, and long-term design. |
| Security & Resilience | Security, privacy, continuity, incident readiness, recovery, and resilient operations. |
| Quality & Reliability Engineering | Testing, validation, observability, failure analysis, and dependable systems. |
| Strategy & Decision Support | Strategic planning, scenarios, prioritization, performance framing, and facilitation. |

## Specialties, Topics, and tags

| Taxonomy | Describes | Example |
|---|---|---|
| Specialty | A person's durable capability; also available for Guide affinity. | `Data Governance` |
| Topic | A subject that connects published Posts, Projects, and Guides. | `Infrastructure` |
| Project tag | A specific technology or implementation label. | `Postgres` |

Do not create the same label in several taxonomies unless it genuinely serves each
different purpose.

## Synchronization

Preview changes against the target Directus instance:

```bash
node --env-file=.env.cms scripts/cms-model-maintenance.mjs
```

Apply the reviewed relationship and Specialty changes:

```bash
node --env-file=.env.cms scripts/cms-model-maintenance.mjs --apply
```

The ignored `.env.cms` file should contain `DIRECTUS_URL` and either an admin static
token (`DIRECTUS_ADMIN_TOKEN`) or admin email/password variables. Do not place these
credentials in the deployed frontend environment.

The script upserts by stable `slug`, updates the five original rows in place so author
links remain intact, creates missing canonical rows, and never deletes extra Specialty
records automatically. Archive or merge noncanonical rows manually only after checking
their author and Guide links.
