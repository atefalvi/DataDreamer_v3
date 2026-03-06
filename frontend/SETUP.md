# Data Dreamer v3 — Directus CMS Setup Guide

This document outlines the required schema, permissions, and environment configurations for the headless Directus instance that powers the Data Dreamer v3 frontend.

## 1. Environment Variables

The Astro frontend requires the following environment variable to be set, either in a `.env` file locally or in your deployment platform's dashboard:

\`\`\`env
PUBLIC_DIRECTUS_URL="http://localhost:8055"
\`\`\`

If omitted, it defaults to `http://localhost:8055`.

## 2. API Permissions (Roles & Policies)

The frontend is designed to consume data anonymously.
1. In the Directus Admin App, go to **Settings** -> **Access Policies**.
2. Select the **Public** policy.
3. Grant **View (Read)** access to the following Collections:
   - `projects`
   - `logs`
   - `site_settings`
   - `home_settings`
   - `directus_files` (Required for resolving image paths via `/assets/`)

## 3. Data Schema & Collections

### A. `projects` (Standard Collection)

| Field Name | Type | Note |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key (Default) |
| `title` | String | E.g., "MIGRATING TO ZFS" |
| `slug` | String | URL-friendly, e.g., "migrating-to-zfs" |
| `summary` | Text | Short description for cards |
| `description` | Markdown | Detailed project case study |
| `cover_image` | Image | File reference |
| `tags` | JSON Array | E.g., `["infra", "storage"]` |
| `published_at` | Datetime | Used for sorting/filtering |
| `featured` | Boolean | Promotes project to the homepage |

### B. `logs` (Standard Collection)

| Field Name | Type | Note |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key (Default) |
| `title` | String | E.g., "WHY PANDAS IS SLOW" |
| `slug` | String | URL-friendly, e.g., "why-pandas-is-slow" |
| `excerpt` | Text | Short preview text for index pages |
| `content` | Markdown | Full post body (supports Mdx-like `:::` blocks) |
| `published_at` | Datetime | Used for display date and sorting |
| `tag` | String | Primary category tag (e.g., "PYTHON") |
| `log_number` | Integer | E.g., `31` displays as `031` |
| `series_label` | String | E.g., "FINE-TUNING SERIES // PART 1" |

### C. `site_settings` (Singleton)

| Field Name | Type | Note |
| :--- | :--- | :--- |
| `status_text` | String | Header status |
| `email` | String | "hello@datadreamer.dev" |
| `github` | String | GitHub Profile URL |
| `linkedin` | String | LinkedIn Profile URL |
| `footer_cta_heading`| String | "INITIATE PROTOCOL" |

### D. `home_settings` (Singleton)

| Field Name | Type | Note |
| :--- | :--- | :--- |
| `hero_tagline_1` | String | Homepage hero terminal text |
| `hero_tagline_2` | String | Homepage hero terminal text |
| `hero_tagline_3` | String | Homepage hero terminal text |

## 4. Markdown Authoring Guide

When writing `content` in the `logs` collection, the Astro frontend has been customized to parse specific block syntax into brutalist UI components:

**Callouts:**
\`\`\`markdown
:::tip System Tip
Ensure your dataset is formatted in JSONL.
:::

:::warning Hardware Alert
Training requires at least 24GB VRAM.
:::
\`\`\`

**Expandable Details:**
\`\`\`markdown
:::details RAW INFERENCE LOG
**Q:** Why did the cron job fail?
**A:** Because it was Tuesday.
:::
\`\`\`

**Pull Quotes:**
\`\`\`markdown
:::quote
THE GOAL ISN'T JUST TO STORE DATA, BUT TO ENCODE INTUITION.
:::
\`\`\`
