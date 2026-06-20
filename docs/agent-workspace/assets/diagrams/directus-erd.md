# Directus ERD — v4

Source of truth for fields: `08-DIRECTUS-CONTENT-MODEL.md`. v4.0 entities solid;
v4.1 (Field Guides) included below the divider comment. Field Guide previews are
public; full guide reading and progress use Directus users with the low-permission
`guide_reader` role (`09` §10).

```mermaid
erDiagram
    %% ───── v4.0 ─────
    POSTS ||--o{ POSTS_TOPICS : tagged
    TOPICS ||--o{ POSTS_TOPICS : maps
    AUTHORS ||--o{ POSTS : writes
    AUTHORS ||--o{ AUTHORS_SPECIALTIES : has
    SPECIALTIES ||--o{ AUTHORS_SPECIALTIES : groups
    DIRECTUS_FILES ||--o{ POSTS : cover_image
    DIRECTUS_FILES ||--o{ AUTHORS : avatar

    POSTS {
      uuid id PK
      string slug UK
      string title
      string status
      datetime published_at
      string excerpt
      text content
      boolean featured
      int post_number
      string series_label
      uuid author FK "M2O authors"
      uuid cover_image FK
    }
    AUTHORS {
      uuid id PK
      string slug UK
      string status
      string display_name
      string role_title
      text bio
      string statement
      json links
      json tools
      json featured_work
      uuid avatar FK
      int sort
    }
    SPECIALTIES {
      uuid id PK
      string name UK
      string slug UK
      string color_key "viz-1..viz-6"
      string description
      int sort
    }
    TOPICS {
      uuid id PK
      string name UK
      string slug UK
      string description
    }
    AUTHORS_SPECIALTIES {
      uuid id PK
      uuid authors_id FK
      uuid specialties_id FK
      int sort "first = primary (graph cluster)"
    }
    POSTS_TOPICS {
      uuid id PK
      uuid posts_id FK
      uuid topics_id FK
    }

    %% ───── v4.1 Field Guides ─────
    GUIDES ||--o{ GUIDE_SECTIONS : contains
    GUIDE_SECTIONS ||--o{ GUIDE_ITEMS : contains
    GUIDES ||--o{ GUIDES_TOPICS : tagged
    TOPICS ||--o{ GUIDES_TOPICS : maps
    GUIDES ||--o{ GUIDES_SPECIALTIES : grouped
    SPECIALTIES ||--o{ GUIDES_SPECIALTIES : groups
    GUIDES ||--o{ GUIDES_AUTHORS : curated_by
    AUTHORS ||--o{ GUIDES_AUTHORS : curates
    AUTHORS ||--o{ GUIDES : primary_curator
    DIRECTUS_FILES ||--o{ GUIDES : cover_image
    DIRECTUS_FILES ||--o{ GUIDE_ITEMS : asset
    DIRECTUS_USERS ||--o{ GUIDE_PROGRESS : owns
    GUIDES ||--o{ GUIDE_PROGRESS : tracks
    GUIDE_ITEMS ||--o{ GUIDE_PROGRESS : last_item

    GUIDES {
      uuid id PK
      string slug UK
      string title
      string status
      string summary
      uuid cover_image FK
      string difficulty "beginner|intermediate|advanced"
      int estimated_duration_minutes
      boolean featured
      text why_this_path
      text expected_outcome
      string recommended_audience
      uuid author FK "M2O authors (primary curator)"
      int sort
    }
    GUIDE_SECTIONS {
      uuid id PK
      uuid guide FK
      string title
      text description
      int sort
    }
    GUIDE_ITEMS {
      uuid id PK
      uuid section FK
      string type "youtube|external_url|pdf|uploaded_file|notebooklm|github_repo|code_sample|cheat_sheet|personal_note|exercise|docs_page"
      string title
      string url "link-like types"
      uuid asset FK "pdf/uploaded_file"
      text body "note/cheat_sheet/code/exercise markdown"
      string description
      text why_included
      text focus_on
      text notes
      int estimated_time_minutes
      string difficulty
      int sort
    }
    GUIDES_TOPICS {
      uuid id PK
      uuid guides_id FK
      uuid topics_id FK
    }
    GUIDES_SPECIALTIES {
      uuid id PK
      uuid guides_id FK
      uuid specialties_id FK
      int sort
    }
    GUIDES_AUTHORS {
      uuid id PK
      uuid guides_id FK
      uuid authors_id FK
      int sort
    }
    DIRECTUS_USERS {
      uuid id PK
      string email
      uuid role FK "guide_reader for learners"
    }
    GUIDE_PROGRESS {
      uuid id PK
      uuid user FK
      uuid guide FK
      json completed_items "guide item ids"
      uuid last_item FK
      string status "not_started|in_progress|completed"
      int percent
      datetime started_at
      datetime completed_at
    }
```
