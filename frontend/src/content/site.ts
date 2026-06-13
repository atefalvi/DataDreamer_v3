/**
 * Repo-owned site content & config (03 §3 boundary): nav, footer, social links,
 * homepage copy, and feature flags. Code-owned UI text lives here, not in Directus.
 */

export const FLAGS = {
  /** Flip true when the Courses release (v4.1) ships. Gates nav item + home teaser. */
  COURSES_ENABLED: false,
  /** Newsletter capture has no backend yet (01 §6) — keep the footer slot hidden. */
  SHOW_NEWSLETTER: false,
} as const;

export interface NavItem {
  label: string;
  href: string;
}

const BASE_NAV: NavItem[] = [
  { label: 'Work', href: '/projects' },
  { label: 'Blog', href: '/blog' },
  { label: 'Dream Team', href: '/dream-team' },
  { label: 'About', href: '/about' },
];

/** Primary nav, with Courses inserted after Blog only when enabled (03 §2). */
export const NAV_ITEMS: NavItem[] = FLAGS.COURSES_ENABLED
  ? [BASE_NAV[0], BASE_NAV[1], { label: 'Courses', href: '/courses' }, ...BASE_NAV.slice(2)]
  : BASE_NAV;

export interface SocialLink {
  label: string;
  href: string;
  /** Lucide icon name. */
  icon: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'GitHub', href: 'https://github.com/atefalvi', icon: 'github' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/atefalvi', icon: 'linkedin' },
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
  /** Until courses ship the secondary CTA points at the work (05 §1.1). */
  secondaryCta: FLAGS.COURSES_ENABLED
    ? { label: 'Explore courses', href: '/courses' }
    : { label: 'See the work', href: '/projects' },
} as const;

/** SEO defaults for the homepage (05 §1, 10 §3). */
export const HOME_SEO = {
  title: 'DataDreamer — Dreaming in systems, building in data',
  description:
    'A premium field journal for data systems, applied AI, analytics craft, and engineering patterns from working practitioners.',
} as const;
