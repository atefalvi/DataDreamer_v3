import { copyText } from './codeCopy';

const resetTimers = new WeakMap<HTMLAnchorElement, number>();

const LINK_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M10 13a5 5 0 0 0 7.54.54l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-2 2a5 5 0 0 0 7.07 7.07l1.14-1.14" />
  </svg>`;

const CHECK_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="m5 12 4 4L19 6" />
  </svg>`;

function statusRegion(): HTMLElement {
  let status = document.querySelector<HTMLElement>('[data-heading-link-status]');
  if (status) return status;

  status = document.createElement('span');
  status.className = 'visually-hidden';
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('data-heading-link-status', '');
  document.body.appendChild(status);
  return status;
}

/** Enhances progressive heading links into copy controls. Without JavaScript the
 *  anchor remains a normal section link; with JavaScript it copies the absolute URL. */
export function initHeadingLinks(): void {
  const root = document.documentElement;
  if (root.dataset.headingLinksBound) return;
  root.dataset.headingLinksBound = 'true';

  document.addEventListener('click', async (event) => {
    const target = event.target as Element | null;
    const link = target?.closest<HTMLAnchorElement>('.heading-anchor');
    if (!link) return;

    event.preventDefault();
    const sectionUrl = new URL(link.getAttribute('href') ?? '', window.location.href).toString();
    const copied = await copyText(sectionUrl);

    if (!copied) {
      window.location.hash = link.hash;
      return;
    }

    window.clearTimeout(resetTimers.get(link));
    link.dataset.copied = '';
    link.setAttribute('aria-label', 'Link copied');
    link.innerHTML = CHECK_ICON;
    statusRegion().textContent = 'Section link copied to clipboard';

    resetTimers.set(
      link,
      window.setTimeout(() => {
        delete link.dataset.copied;
        link.setAttribute('aria-label', 'Copy link to this section');
        link.innerHTML = LINK_ICON;
        statusRegion().textContent = '';
      }, 1800),
    );
  });
}
