import { createDirectus, rest, readItems, readSingleton, authentication } from '@directus/sdk';

// ─── TYPES ─────────────────────────────────────────

export interface DirectusUser {
    id: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
}

export interface Project {
    id: string;
    title: string;
    slug: string;
    summary?: string;
    description?: string;
    cover_image?: string;
    tags?: string[];
    published_at?: string;
    status?: string;
    featured?: boolean;
    author?: DirectusUser;
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
    status?: string;
    log_number?: number;
    series_label?: string;
    author?: DirectusUser;
}

export interface SiteSettings {
    status_text?: string;
    email?: string;
    github?: string;
    linkedin?: string;
    twitter?: string;
    footer_cta_heading?: string;
}

export interface HomeSettings {
    hero_tagline_1?: string;
    hero_tagline_2?: string;
    hero_tagline_3?: string;
}

export interface AboutSettings {
    hero_tagline?: string;
    hero_title?: string;
    hero_description?: string;
    profile_image?: string;
    resume?: string;
    stats?: any[];
    experience?: any[];
    skills?: any[];
    companies?: { directus_file_id: string }[];
}

interface CustomSchema {
    projects: Project[];
    logs: Log[];
    site_settings: SiteSettings;
    home_settings: HomeSettings;
    about: AboutSettings;
}

const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL ?? process.env.PUBLIC_DIRECTUS_URL ?? 'http://localhost:8055';
const DIRECTUS_EMAIL = import.meta.env.DIRECTUS_EMAIL ?? process.env.DIRECTUS_EMAIL;
const DIRECTUS_PASSWORD = import.meta.env.DIRECTUS_PASSWORD ?? process.env.DIRECTUS_PASSWORD;

const directus = createDirectus<CustomSchema>(DIRECTUS_URL)
    .with(rest())
    .with(authentication());

/**
 * Initialize the Directus client with authentication if credentials are provided.
 */
export async function ensureAuthenticated() {
    try {
        console.log('[directus] Attempting to authenticate...', {
            url: DIRECTUS_URL,
            hasEmail: !!DIRECTUS_EMAIL,
            hasPass: !!DIRECTUS_PASSWORD
        });

        if (!DIRECTUS_EMAIL || !DIRECTUS_PASSWORD) {
            console.warn('[directus] Credentials missing - skipping authentication. Data may be inaccessible if not public.');
            return;
        }

        const token = await directus.getToken();
        if (token) {
            console.log('[directus] Token found, already authenticated');
            return;
        }

        await directus.login(DIRECTUS_EMAIL, DIRECTUS_PASSWORD);
        console.log('[directus] Authenticated successfully');
    } catch (error: any) {
        logError('Authentication failed', error);
        throw error;
    }
}

function logError(context: string, error: any) {
    const message = `[${new Date().toISOString()}] ${context}: ${error.message}`;
    console.error(message);
}

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
        await ensureAuthenticated();
        const items = await directus.request(
            readItems('projects', {
                filter: { status: { _eq: 'published' } },
                sort: ['-published_at'],
                fields: ['*', 'author.*'] as any,
            })
        );
        return (items as any[]) ?? [];
    } catch (error: any) {
        logError('fetchProjects failed', error);
        return [];
    }
}

/**
 * Fetch featured projects (or newest if none featured).
 */
export async function fetchFeaturedProjects(limit = 3): Promise<Project[]> {
    try {
        await ensureAuthenticated();
        let items = await directus.request(
            readItems('projects', {
                filter: { 
                    _and: [
                        { featured: { _eq: true } },
                        { status: { _eq: 'published' } }
                    ]
                },
                sort: ['-published_at'],
                limit,
                fields: ['*', 'author.*'] as any,
            })
        );
        // Fallback to newest if no featured
        if (!items || items.length === 0) {
            items = await directus.request(
                readItems('projects', {
                    filter: { status: { _eq: 'published' } },
                    sort: ['-published_at'],
                    limit,
                    fields: ['*', 'author.*'] as any,
                })
            );
        }
        return (items as any[]) ?? [];
    } catch (error: any) {
        logError('fetchFeaturedProjects failed', error);
        return [];
    }
}

// ─── LOGS ──────────────────────────────────────────

/**
 * Fetch all logs from Directus.
 */
export async function fetchLogs(): Promise<Log[]> {
    try {
        await ensureAuthenticated();
        const items = await directus.request(
            readItems('logs', {
                filter: { status: { _eq: 'published' } },
                sort: ['-published_at'],
                fields: ['*', 'author.*'] as any,
            })
        );
        return (items as any[]) ?? [];
    } catch (error: any) {
        logError('fetchLogs failed', error);
        return [];
    }
}

/**
 * Fetch recent logs with a limit.
 */
export async function fetchRecentLogs(limit = 3): Promise<Log[]> {
    try {
        await ensureAuthenticated();
        const items = await directus.request(
            readItems('logs', {
                filter: { status: { _eq: 'published' } },
                sort: ['-published_at'],
                limit,
                fields: ['*', 'author.*'] as any,
            })
        );
        return (items as any[]) ?? [];
    } catch (error: any) {
        logError('fetchRecentLogs failed', error);
        return [];
    }
}

/**
 * Fetch a single log by slug from Directus.
 */
export async function fetchLog(slug: string): Promise<Log | null> {
    try {
        await ensureAuthenticated();
        const items = await directus.request(
            readItems('logs', {
                filter: { slug: { _eq: slug } },
                limit: 1,
                fields: ['*', 'author.*'] as any,
            })
        );
        return (items?.[0] as unknown as Log) ?? null;
    } catch (error: any) {
        logError(`fetchLog(${slug}) failed`, error);
        return null;
    }
}

// ─── SINGLETONS ────────────────────────────────────

/**
 * Fetch site_settings singleton.
 */
export async function fetchSiteSettings(): Promise<SiteSettings | null> {
    try {
        await ensureAuthenticated();
        const data = await directus.request(readSingleton('site_settings'));
        return data ?? null;
    } catch (error: any) {
        logError('fetchSiteSettings failed', error);
        return null;
    }
}

/**
 * Fetch home_settings singleton.
 */
export async function fetchHomeSettings(): Promise<HomeSettings | null> {
    try {
        await ensureAuthenticated();
        const data = await directus.request(readSingleton('home_settings'));
        return data ?? null;
    } catch (error: any) {
        logError('fetchHomeSettings failed', error);
        return null;
    }
}

/**
 * Fetch about singleton.
 */
export async function fetchAbout(): Promise<AboutSettings | null> {
    try {
        await ensureAuthenticated();
        const data = await directus.request(readSingleton('about', {
            fields: ['*', 'companies.directus_file_id' as any]
        }));
        return data ?? null;
    } catch (error: any) {
        logError('fetchAbout failed', error);
        return null;
    }
}
