/**
 * Reveal-on-scroll utility (07 §1). One IntersectionObserver drives every
 * `[data-reveal]` element. Adds `.is-visible` (base.css does the transition), then
 * unobserves — once only. Reduced-motion reveals everything immediately.
 *
 * Pairs with the base.css guard: `html.no-js [data-reveal]` is already visible, so if
 * this script never runs the content still shows. BaseLayout removes `no-js` pre-paint,
 * which hands control to this observer.
 */
export function initReveal(): void {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (!els.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const groupIndex = new Map<string, number>();

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const group = el.dataset.revealGroup;
        let delay = 0;
        if (group) {
          const i = groupIndex.get(group) ?? 0;
          delay = Math.min(i, 4) * 60; // cap the stagger (04 §12)
          groupIndex.set(group, i + 1);
        }
        el.style.setProperty('--reveal-delay', `${delay}ms`);
        el.classList.add('is-visible');
        io.unobserve(el);
      }
    },
    { threshold: 0.2, rootMargin: '0px 0px -8% 0px' },
  );

  els.forEach((el) => io.observe(el));
}
