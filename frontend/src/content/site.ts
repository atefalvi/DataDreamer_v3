/**
 * Repo-owned site content & config (03 §3 boundary): nav, footer, social links,
 * homepage copy, and feature flags. Code-owned UI text lives here, not in Directus.
 */

/** Read a public boolean env flag (available server + client via Astro's import.meta.env). */
function envFlag(name: string, fallback = false): boolean {
  const env = import.meta.env as Record<string, string | undefined>;
  const value = env[name] ?? process.env[name];
  if (value === undefined) return fallback;
  return value === 'true';
}

export const FLAGS = {
  /**
   * Guides shipped in v4.1, so this defaults on. Set
   * `PUBLIC_GUIDES_ENABLED=false` for an explicit operational rollback.
   * The `/guides` pages remain reachable so existing links do not become 404s.
   */
  GUIDES_ENABLED: envFlag('PUBLIC_GUIDES_ENABLED', true),
  /** Newsletter capture has no backend yet (01 §6) — keep the footer slot hidden. */
  SHOW_NEWSLETTER: false,
} as const;

export interface NavItem {
  label: string;
  href: string;
}

const BASE_NAV: NavItem[] = [
  { label: 'Projects', href: '/projects' },
  { label: 'Posts', href: '/blog' },
  { label: 'Dream Team', href: '/dream-team' },
];

/** Primary nav, with Guides inserted after Blog only when enabled (03 §2). */
export const NAV_ITEMS: NavItem[] = FLAGS.GUIDES_ENABLED
  ? [BASE_NAV[0], BASE_NAV[1], { label: 'Guides', href: '/guides' }, ...BASE_NAV.slice(2)]
  : BASE_NAV;

export interface SocialLink {
  label: string;
  href: string;
  /** Lucide icon name. */
  icon: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'GitHub', href: 'https://github.com/atefalvi', icon: 'github' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/atefsyed/', icon: 'linkedin' },
  { label: 'Email', href: 'mailto:hello@data-dreamer.net', icon: 'mail' },
];

export const SITE = {
  name: 'Data Dreamer',
  mission: 'A professional learning lab for practical data work, AI exploration, and cross-industry data thinking.',
  email: 'hello@data-dreamer.net',
} as const;

/** Homepage hero copy (05 §1.1). Single source of truth — owner edits here. */
export const HOME_HERO = {
  kicker: 'Professional learning lab',
  /** Rendered as two display lines. */
  headlineLines: ['From messy problems', 'to working systems.'],
  subhead:
    'Data Dreamer is a professional learning lab for practical data work — exploring how data, AI, business context, and human experience shape better systems, clearer decisions, and real-world learning.',
  primaryCta: { label: 'Read the Posts', href: '/blog' },
  /** Until guides ship the secondary CTA points at the work (05 §1.1). */
  secondaryCta: FLAGS.GUIDES_ENABLED
    ? { label: 'Explore Guides', href: '/guides' }
    : { label: 'Explore Projects', href: '/projects' },
} as const;

/** SEO defaults for the homepage (05 §1, 10 §3). */
export const HOME_SEO = {
  title: 'Data Dreamer — From messy problems to working systems',
  description:
    'A professional learning lab for practical data work, exploring how data, AI, business context, and human experience become better systems and clearer decisions.',
} as const;

export interface ContactChannel {
  label: string;
  /** Display handle, e.g. "github.com/atefalvi". */
  handle: string;
  href: string;
  /** Lucide / custom icon name. */
  icon: string;
  external?: boolean;
}

/** Contact page content (05 §10). Repo-owned — no form/backend in v4.0; mailto is honest. */
export const CONNECT = {
  kicker: 'Connect',
  title: "Let's connect",
  intro:
    'Conversations about practical data work, AI, analytics, systems, projects, and collaboration are welcome. Email is the fastest way to reach me.',
  /** Primary channel, rendered as the big copy-able email card. */
  email: SITE.email,
  channels: [
    { label: 'GitHub', handle: 'github.com/atefalvi', href: 'https://github.com/atefalvi', icon: 'github', external: true },
    {
      label: 'LinkedIn',
      handle: 'linkedin.com/in/atefalvi',
      href: 'https://www.linkedin.com/in/atefsyed/',
      icon: 'linkedin',
      external: true,
    },
  ] satisfies ContactChannel[],
  availability: 'Open to select consulting, advisory, and collaboration.',
  /** Three short facts shown beneath the channels. */
  facts: [
    { label: 'Response time', value: 'Usually within 24 hours on weekdays.' },
    { label: 'Areas', value: 'Practical data work, analytics, AI, systems, and collaborative projects.' },
    { label: 'Timezone', value: 'Eastern Time, flexible for overlap.' },
  ],
} as const;
