/**
 * Pointer-local border illumination for interactive editorial cards. One delegated
 * listener updates only the card currently under the pointer; touch layouts keep the
 * normal static border. Keyboard focus uses the CSS fallback position.
 */
export function initBorderLight(): void {
  if (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || !window.matchMedia('(hover: hover) and (pointer: fine)').matches
  ) return;

  let active: HTMLElement | null = null;
  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;

  const clearActive = () => {
    active?.removeAttribute('data-border-light-active');
    active = null;
  };

  const paint = () => {
    frame = 0;
    if (!active) return;
    const rect = active.getBoundingClientRect();
    active.style.setProperty('--border-light-x', `${pointerX - rect.left}px`);
    active.style.setProperty('--border-light-y', `${pointerY - rect.top}px`);
  };

  document.addEventListener('pointermove', (event) => {
    const next = (event.target as Element | null)?.closest<HTMLElement>('[data-border-light]') ?? null;
    if (next !== active) {
      clearActive();
      active = next;
      active?.setAttribute('data-border-light-active', '');
    }
    if (!active) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!frame) frame = window.requestAnimationFrame(paint);
  }, { passive: true });

  document.documentElement.addEventListener('mouseleave', clearActive);
  window.addEventListener('blur', clearActive);
}
