import { createDirectus, rest, readItems, readSingleton } from '@directus/sdk';

// ─── TYPES ─────────────────────────────────────────

export interface Project {
    id: string;
    title: string;
    slug: string;
    summary?: string;
    description?: string;
    cover_image?: string;
    tags?: string[];
    published_at?: string;
    featured?: boolean;
}

export interface Log {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    content?: string;
    published_at?: string;
    tag?: string;
    category?: string;
    log_number?: number;
    series_label?: string;
}

export interface SiteSettings {
    status_text?: string;
    email?: string;
    github?: string;
    linkedin?: string;
    footer_cta_heading?: string;
}

export interface HomeSettings {
    hero_tagline_1?: string;
    hero_tagline_2?: string;
    hero_tagline_3?: string;
}

interface CustomSchema {
    projects: Project[];
    logs: Log[];
    site_settings: SiteSettings;
    home_settings: HomeSettings;
}

// ─── CLIENT ────────────────────────────────────────

const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL ?? 'http://localhost:8055';
const directus = createDirectus<CustomSchema>(DIRECTUS_URL).with(rest());

export default directus;

/**
 * Build a full asset URL from a Directus file ID.
 */
export function getAssetUrl(fileId: string): string {
    return `${DIRECTUS_URL}/assets/${fileId}`;
}

// ─── PROJECTS ──────────────────────────────────────

/**
 * Fetch all projects from Directus.
 */
export async function fetchProjects(): Promise<Project[]> {
    try {
        const items = await directus.request(
            readItems('projects', {
                sort: ['-published_at'],
                fields: ['*'],
            })
        );
        return items ?? [];
    } catch {
        console.warn('[directus] Could not fetch projects — using fallback data');
        return [];
    }
}

/**
 * Fetch featured projects (or newest if none featured).
 */
export async function fetchFeaturedProjects(limit = 3): Promise<Project[]> {
    try {
        let items = await directus.request(
            readItems('projects', {
                filter: { featured: { _eq: true } },
                sort: ['-published_at'],
                limit,
                fields: ['*'],
            })
        );
        // Fallback to newest if no featured
        if (!items || items.length === 0) {
            items = await directus.request(
                readItems('projects', {
                    sort: ['-published_at'],
                    limit,
                    fields: ['*'],
                })
            );
        }
        return items ?? [];
    } catch {
        console.warn('[directus] Could not fetch featured projects — using fallback data');
        return [];
    }
}

// ─── LOGS ──────────────────────────────────────────

/**
 * Fetch all logs from Directus.
 */
export async function fetchLogs(): Promise<Log[]> {
    try {
        const items = await directus.request(
            readItems('logs', {
                sort: ['-published_at'],
                fields: ['*'],
            })
        );
        return items ?? [];
    } catch {
        console.warn('[directus] Could not fetch logs — using fallback data');
        return [];
    }
}

/**
 * Fetch recent logs with a limit.
 */
export async function fetchRecentLogs(limit = 3): Promise<Log[]> {
    try {
        const items = await directus.request(
            readItems('logs', {
                sort: ['-published_at'],
                limit,
                fields: ['*'],
            })
        );
        return items ?? [];
    } catch {
        console.warn('[directus] Could not fetch recent logs — using fallback data');
        return [];
    }
}

/**
 * Fetch a single log by slug from Directus.
 */
export async function fetchLog(slug: string): Promise<Log | null> {
    try {
        const items = await directus.request(
            readItems('logs', {
                filter: { slug: { _eq: slug } },
                limit: 1,
                fields: ['*'],
            })
        );
        return items?.[0] ?? null;
    } catch {
        console.warn(`[directus] Could not fetch log "${slug}" — using fallback data`);
        return null;
    }
}

// ─── SINGLETONS ────────────────────────────────────

/**
 * Fetch site_settings singleton.
 */
export async function fetchSiteSettings(): Promise<SiteSettings | null> {
    try {
        const data = await directus.request(readSingleton('site_settings'));
        return data ?? null;
    } catch {
        console.warn('[directus] Could not fetch site_settings');
        return null;
    }
}

/**
 * Fetch home_settings singleton.
 */
export async function fetchHomeSettings(): Promise<HomeSettings | null> {
    try {
        const data = await directus.request(readSingleton('home_settings'));
        return data ?? null;
    } catch {
        console.warn('[directus] Could not fetch home_settings');
        return null;
    }
}
