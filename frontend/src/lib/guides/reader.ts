/**
 * Guide reader client enhancer (05 §15, 07 §8). Wires the per-item completion toggles
 * to the progress panel and the server. Completion is server-backed (`guide_progress`);
 * the toggle updates the UI optimistically using the pure `deriveProgress`, POSTs to
 * `/api/guides/progress`, then reconciles (reverting on failure). Items + estimates are
 * embedded as JSON so the optimistic math is instant and identical to the server's.
 */
import { deriveProgress, formatMinutes, type ProgressItem } from './progress';
import type { DerivedGuideProgress, GuideProgressStatus } from '../../types/content';

interface ReaderData {
  slug: string;
  items: ProgressItem[];
}

const STATUS_LABEL: Record<GuideProgressStatus, string> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  completed: 'Completed',
};

export function initGuideReader(): void {
  const panel = document.querySelector<HTMLElement>('[data-progress-panel]');
  const dataEl = document.querySelector<HTMLScriptElement>('#guide-progress-data');
  if (!panel || !dataEl?.textContent) return;

  let data: ReaderData;
  try {
    data = JSON.parse(dataEl.textContent) as ReaderData;
  } catch {
    return;
  }

  const firstItemId = data.items[0]?.id;
  const fill = panel.querySelector<HTMLElement>('[data-progress-fill]');
  const percentEl = panel.querySelector<HTMLElement>('[data-progress-percent]');
  const countsEl = panel.querySelector<HTMLElement>('[data-progress-counts]');
  const remainingEl = panel.querySelector<HTMLElement>('[data-progress-remaining]');
  const statusEl = panel.querySelector<HTMLElement>('[data-progress-status]');
  const resume = panel.querySelector<HTMLAnchorElement>('[data-resume]');
  const resumeLabel = panel.querySelector<HTMLElement>('[data-resume-label]');

  const completedIds = (): string[] =>
    [...document.querySelectorAll<HTMLElement>('[data-item-toggle][aria-pressed="true"]')]
      .map((btn) => btn.closest<HTMLElement>('[data-item]')?.dataset.itemId)
      .filter((id): id is string => Boolean(id));

  const paint = (lastItemId?: string): DerivedGuideProgress => {
    const progress = deriveProgress(data.items, { completedItemIds: completedIds(), lastItemId });
    if (fill) fill.style.width = `${progress.percent}%`;
    if (percentEl) percentEl.textContent = String(progress.percent);
    if (countsEl) countsEl.textContent = `${progress.completedCount}/${progress.totalCount}`;
    if (remainingEl) remainingEl.textContent = `~${formatMinutes(progress.estMinutesRemaining)}`;
    if (statusEl) {
      statusEl.textContent = STATUS_LABEL[progress.status];
      statusEl.dataset.status = progress.status;
    }
    if (resume && resumeLabel) {
      const target = progress.resumeItemId ?? firstItemId;
      if (target) resume.setAttribute('href', `#item-${target}`);
      resumeLabel.textContent =
        progress.status === 'completed'
          ? 'Review from the top'
          : progress.status === 'in-progress'
            ? 'Resume the path'
            : 'Start the path';
    }
    return progress;
  };

  const setToggle = (btn: HTMLElement, done: boolean): void => {
    btn.setAttribute('aria-pressed', done ? 'true' : 'false');
    const item = btn.closest<HTMLElement>('[data-item]');
    if (item) item.dataset.completed = done ? 'true' : 'false';
    const label = btn.querySelector('.g-item__toggle-label');
    if (label) label.textContent = done ? 'Done' : 'Mark done';
  };

  let inFlight = false;

  document.addEventListener('click', async (event) => {
    const btn = (event.target as HTMLElement).closest<HTMLElement>('[data-item-toggle]');
    if (!btn || inFlight) return;
    const item = btn.closest<HTMLElement>('[data-item]');
    const itemId = item?.dataset.itemId;
    if (!itemId) return;

    const next = btn.getAttribute('aria-pressed') !== 'true';
    setToggle(btn, next); // optimistic
    paint(itemId);

    inFlight = true;
    btn.setAttribute('aria-busy', 'true');
    try {
      const res = await fetch('/api/guides/progress', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({ guide: data.slug, completedItemIds: completedIds(), lastItemId: itemId }),
      });
      if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (!res.ok) throw new Error(`progress save failed: ${res.status}`);
    } catch {
      setToggle(btn, !next); // revert
      paint();
      panel.dataset.error = 'true';
    } finally {
      btn.removeAttribute('aria-busy');
      inFlight = false;
    }
  });
}
