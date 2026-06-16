/**
 * Repo-owned site content & config (03 §3 boundary): nav, footer, social links,
 * homepage copy, and feature flags. Code-owned UI text lives here, not in Directus.
 */

export const FLAGS = {
  /** Flip true when the Guides release (v4.1) ships. Gates nav item + home teaser. */
  GUIDES_ENABLED: false,
  /** Newsletter capture has no backend yet (01 §6) — keep the footer slot hidden. */
  SHOW_NEWSLETTER: false,
} as const;

export interface NavItem {
  label: string;
  href: string;
}

const BASE_NAV: NavItem[] = [
  { label: 'Projects', href: '/projects' },
  { label: 'Blog', href: '/blog' },
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
  name: 'DataDreamer',
  mission: 'An independent publication and learning platform for data, analytics, and AI.',
  email: 'hello@data-dreamer.net',
} as const;

/** Homepage hero copy (05 §1.1). Single source of truth — owner edits here. */
export const HOME_HERO = {
  kicker: 'Data intelligence studio',
  /** Rendered as two display lines. */
  headlineLines: ['Dreaming in systems.', 'Building in data.'],
  subhead:
    'A premium field journal for data systems, applied AI, analytics craft, and the engineering patterns that turn signal into leverage.',
  primaryCta: { label: 'Read the field notes', href: '/blog' },
  /** Until guides ship the secondary CTA points at the work (05 §1.1). */
  secondaryCta: FLAGS.GUIDES_ENABLED
    ? { label: 'Explore guides', href: '/guides' }
    : { label: 'See the work', href: '/projects' },
} as const;

/** SEO defaults for the homepage (05 §1, 10 §3). */
export const HOME_SEO = {
  title: 'DataDreamer — Dreaming in systems, building in data',
  description:
    'A premium field journal for data systems, applied AI, analytics craft, and engineering patterns from working practitioners.',
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
  kicker: 'Contact',
  title: "Let's talk",
  intro:
    'Project inquiries, advisory, or comparing notes on data systems — email is the fastest way to reach me. No forms, no funnels.',
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
    { label: 'Engagements', value: 'Data platforms, analytics, and applied-AI builds — advisory or hands-on.' },
    { label: 'Timezone', value: 'Eastern Time (UTC−5), flexible for overlap.' },
  ],
} as const;
