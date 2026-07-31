# Diagram blocks

## Data quality gate

:::diagram
type: flow
title: Data quality gate

Incoming data -> Valid?: yellow
  yes -> Load: blue -> Available: green
  no -> Remediate: orange -> @Load
:::

## Tiered API retry

:::diagram
type: flow
title: Tiered API retry

Send request -> Succeeded?: yellow
  yes -> Store result: blue -> Complete: green
  no -> Retry fast: orange -> @Send request

Retry fast -> Recovered?: yellow
  yes -> Store result
  no -> Retry slow: purple -> @Retry fast

Retry slow -> Recovered?
  yes -> Store result
  no -> Dead-letter queue: orange
:::

## Resilient database write

:::diagram
type: flow
title: Resilient database write

Build payload -> Primary write?: yellow
  yes -> Commit: blue -> Acknowledge: green
  no -> Retry write: orange -> @Primary write

Retry write -> Replica write?: yellow
  fallback -> Replica write?
    yes -> Commit
    no -> Queue write: purple -> @Replica write
:::

## Publishing model

:::diagram
type: erd
title: Directus and Astro publishing model
columns: 3

ContentItem: blue
  PK content_id
  FK author_id -> Author.author_id
  UK slug
  content_type
  status
  updated_at

ContentRevision: purple
  PK revision_id
  FK content_id -> ContentItem.content_id
  body_markdown
  revision_no
  created_at

DiagramBlock: orange
  PK diagram_id
  FK revision_id -> ContentRevision.revision_id
  diagram_type
  title
  source_text
  render_version
  source_hash

Author: green
  PK author_id
  UK slug
  display_name
  profile_status
  created_at

RenderArtifact: yellow
  PK artifact_id
  FK diagram_id -> DiagramBlock.diagram_id
  svg_markup
  width
  height

BuildEvent
  PK build_event_id
  FK content_id -> ContentItem.content_id
  build_sha
  result
  created_at
:::

## Subscription billing model

:::diagram
type: erd
title: Subscription billing model
columns: 3

Account: green
  PK account_id
  UK account_key
  name
  status
  created_at

Subscription: blue
  PK subscription_id
  FK account_id -> Account.account_id
  FK plan_id -> Plan.plan_id
  started_at
  renewal_at
  status
  quantity

Plan: purple
  PK plan_id
  UK plan_code
  name
  billing_period
  base_price

Invoice: yellow
  PK invoice_id
  FK account_id -> Account.account_id
  issued_at
  due_at
  status

InvoiceLine: orange
  PK invoice_line_id
  FK invoice_id -> Invoice.invoice_id
  FK subscription_id -> Subscription.subscription_id
  description
  quantity
  amount

Payment
  PK payment_id
  FK invoice_id -> Invoice.invoice_id
  processed_at
  amount
  status
:::
