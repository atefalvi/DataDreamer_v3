/**
 * Shared code-block copy enhancer — used by blog articles AND project case studies so
 * copy behaves identically everywhere. Delegated document click; idempotent (binds once
 * per page). Toggles `data-copied` on the button (CSS swaps the copy→check icon) and
 * announces via the `[data-code-copy-status]` live region if present.
 */
const resetTimers = new WeakMap<HTMLElement, number>();

/** Copy text, preferring the async Clipboard API, falling back to execCommand so it
 *  still works in non-secure contexts (e.g. http://localhost or older browsers). */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to execCommand */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    // execCommand is deprecated but remains the only synchronous copy path for
    // non-secure contexts (http://localhost) and older browsers; cast to skip the hint.
    const ok = (document as unknown as { execCommand(c: string): boolean }).execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function initCodeCopy(): void {
  const root = document.documentElement;
  if (root.dataset.codeCopyBound) return;
  root.dataset.codeCopyBound = 'true';

  document.addEventListener('click', async (event) => {
    const target = event.target as Element | null;
    const button = target?.closest<HTMLButtonElement>('.code-block__copy');
    if (!button) return;

    const code = button.closest('.code-block')?.querySelector('pre')?.textContent ?? '';
    const label = button.querySelector<HTMLElement>('[data-copy-label]');
    const live = document.querySelector<HTMLElement>('[data-code-copy-status]');

    const ok = await copyText(code);
    if (ok) {
      button.setAttribute('data-copied', '');
      button.setAttribute('aria-label', 'Copied');
      if (label) label.textContent = 'Copied';
      if (live) live.textContent = 'Code copied to clipboard';

      window.clearTimeout(resetTimers.get(button));
      resetTimers.set(
        button,
        window.setTimeout(() => {
          button.removeAttribute('data-copied');
          button.setAttribute('aria-label', 'Copy code');
          if (label) label.textContent = 'Copy';
          if (live) live.textContent = '';
        }, 1800),
      );
    } else if (live) {
      live.textContent = 'Could not copy code — select and copy manually.';
    }
  });
}
