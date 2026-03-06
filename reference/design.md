# Project: Data Dreamer (v3) - Technical Specification

## 1. Vision & Aesthetic: Industrial Brutalist

- **Primary Color**: `#FF2E00` (High-saturation Red)
- **Background**: `#FFFFFF` (Pure White)
- **Contrast**: `#111111` (Ink Black)
- **Typography**:
  - Headings: `Anton` (Uppercase only for impact)
  - Body/Technical: `JetBrains Mono` (For that "developer terminal" feel)
- **Design DNA**: Use an 8px grid system. Borders should be 1px or 2px solid black. No rounded corners (0px border-radius).

## 2. Interactive Requirements (Source: /reference)

- **Global Mouse Halo**: From `reference/index.html`. A canvas-based `#FF2E00` trailing cursor. This must be in the `MainLayout.astro` to ensure it never "blinks" when switching pages.
- **Hero Pixel Canvas**: From `reference/index.html`. Only on the homepage. It should interact with the mouse.
- **Grayscale Hover**: All images (`.project-card img`) must be `filter: grayscale(100%)` by default and `filter: grayscale(0%)` on hover with a 0.3s transition.

## 3. Data Architecture (Directus + SDK)

- **Backend Status**: Directus is running at `http://localhost:8055`.
- **SDK Status**: `@directus/sdk` is already installed in the `/frontend` folder.
- **Content Blocks**:
  - Blog content uses the Directus Block Editor.
  - You must create a "Renderer" that maps `code` blocks to Astro's `<Code />` component (Shiki) for syntax highlighting.
  - `quote` blocks should use the styling found in `reference/blog.html`.

## 4. Component Mapping

- **Navigation**: Extract from `reference/index.html`. Keep the "Data Dreamer" logo consistent.
- **Project Cards**: Use the structure from `reference/project_index.html`.
- **Sidebar**: The "Related Logs" sidebar from `reference/blog.html` should be dynamic.
