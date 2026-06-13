/**
 * About page content (05 §9, 03 §3 boundary). Repo-owned, single-owner, rarely changes
 * — authored here, zero Directus. The owner edits copy/stats/timeline/stack in place.
 *
 * Portrait: drop a square photo at `src/assets/about/portrait.*` and wire it as an
 * `astro:assets` Image when available; until then the page renders an on-brand portrait
 * plate (explicit dimensions, no CLS). Resume: drop a PDF in `public/` and set
 * `resumeUrl` to its path to reveal the résumé button.
 */

export interface AboutStat {
  value: string;
  label: string;
}

export interface AboutTimelineEntry {
  year: string;
  role: string;
  org: string;
  note: string;
}

export interface AboutStackGroup {
  group: string;
  items: string[];
}

export const ABOUT = {
  kicker: 'About',
  title: 'The practice behind DataDreamer',
  lede: 'I build data platforms and applied-AI systems — and write the field notes along the way.',
  bio: [
    'I’m Atef Alvi, a data & analytics engineer. DataDreamer is where I publish what I learn building production data systems: the patterns that survive contact with real pipelines, the analytics judgment that turns numbers into decisions, and the applied-AI work that actually ships.',
    'My day-to-day spans data platforms, orchestration, and homelab-scale ML — Python, Airflow, dbt, Tableau, and Postgres. The throughline is the same belief that runs through every post here: the data is the model. Garbage in, garbage out, always.',
  ],
  portraitAlt: 'Atef Alvi, data & analytics engineer',
  /** Set to a path under public/ (e.g. "/atef-alvi-resume.pdf") to show the résumé button. */
  resumeUrl: undefined as string | undefined,
  stats: [
    { value: '8+', label: 'Years in data & analytics' },
    { value: '40+', label: 'Field notes published' },
    { value: '5', label: 'Core platforms shipped' },
    { value: '∞', label: 'Pipelines debugged at 2am' },
  ] satisfies AboutStat[],
  timeline: [
    {
      year: '2024',
      role: 'Founder & principal',
      org: 'DataDreamer',
      note: 'Independent publication and learning platform for data, analytics, and AI — writing, courses, and case studies.',
    },
    {
      year: '2021',
      role: 'Data & analytics engineer',
      org: 'Industry',
      note: 'Built analytics platforms end to end: ingestion, orchestration, modeling, and the dashboards leadership actually used.',
    },
    {
      year: '2018',
      role: 'Analytics & visualization',
      org: 'Industry',
      note: 'Turned messy operational data into decision support — Tableau, SQL, and the unglamorous work of trustworthy metrics.',
    },
  ] satisfies AboutTimelineEntry[],
  stack: [
    { group: 'Languages', items: ['Python', 'SQL', 'TypeScript'] },
    { group: 'Data & orchestration', items: ['Airflow', 'dbt', 'Postgres', 'DuckDB'] },
    { group: 'Analytics & viz', items: ['Tableau', 'Power BI', 'Plotly'] },
    { group: 'AI & ML', items: ['PyTorch', 'LLM systems', 'Vector search'] },
    { group: 'Platform', items: ['Docker', 'CI/CD', 'Coolify', 'Linux homelab'] },
  ] satisfies AboutStackGroup[],
  cta: {
    heading: 'Work with me',
    body: 'Advisory, builds, or a second pair of eyes on a data problem — I read every message.',
    primary: { label: 'Start a conversation', href: '/connect' },
  },
} as const;
