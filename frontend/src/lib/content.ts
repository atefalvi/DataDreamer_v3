import { fetchLog, fetchLogs, fetchProjects, getAssetUrl, type Log, type Project } from './directus';

// ─── HELPER TYPES ──────────────────────────────────

export interface ContentLog {
    id: string;
    slug: string;
    title: string;
    date: string; // formatted '2023.10.24'
    tag: string;
    excerpt: string;
    content: string;
    logNumber?: number;
    seriesLabel?: string;
    rawDate?: string;
    authorName?: string;
    authorAvatar?: string;
}

export interface ContentProject {
    id: string;
    slug: string;
    title: string;
    description: string;
    image: string | null;
    index: string;
    year: string;
    tags: string[];
    href: string;
    authorName?: string;
    authorAvatar?: string;
}

// ─── FORMATTERS ────────────────────────────────────

function formatDate(dateString?: string): string {
    if (!dateString) return "—";
    return new Date(dateString).toISOString().slice(0, 10).replace(/-/g, ".");
}

function formatProject(p: Project, index: number): ContentProject {
    return {
        id: p.id,
        slug: p.slug,
        title: (p.title ?? "UNTITLED").toUpperCase(),
        description: p.summary ?? p.description ?? "",
        image: p.cover_image ? getAssetUrl(p.cover_image) : null,
        index: `EXP.${String(index + 1).padStart(2, "0")}`,
        year: p.published_at ? new Date(p.published_at).getFullYear().toString() : "2023",
        tags: p.tags ?? [],
        href: p.slug ? `/projects/${p.slug}` : "#",
        authorName: p.author ? `${p.author.first_name || ''} ${p.author.last_name || ''}`.trim().toUpperCase() : "ATEF ALVI",
        authorAvatar: p.author?.avatar ? getAssetUrl(p.author.avatar) : undefined,
    };
}

function formatLog(l: Log): ContentLog {
    return {
        id: l.id,
        slug: l.slug ?? "",
        title: (l.title ?? "UNTITLED").toUpperCase(),
        date: formatDate(l.published_at),
        tag: (l.tag ?? l.category ?? "").toUpperCase(),
        excerpt: l.excerpt ?? "",
        content: l.content ?? "",
        logNumber: l.log_number,
        seriesLabel: l.series_label ? l.series_label.toUpperCase() : undefined,
        rawDate: l.published_at,
        authorName: l.author ? `${l.author.first_name || ''} ${l.author.last_name || ''}`.trim().toUpperCase() : "ATEF ALVI",
        authorAvatar: l.author?.avatar ? getAssetUrl(l.author.avatar) : undefined,
    };
}

// ─── CONTENT FETCHERS ──────────────────────────────

export async function getLogs(): Promise<ContentLog[]> {
    const rawLogs = await fetchLogs();
    return rawLogs.map(formatLog);
}

export async function getLogBySlug(slug: string): Promise<ContentLog | null> {
    const rawLog = await fetchLog(slug);
    if (!rawLog) return null;
    return formatLog(rawLog);
}

export async function getProjects(): Promise<ContentProject[]> {
    const rawProjects = await fetchProjects();
    return rawProjects.map((p, i) => formatProject(p, i));
}
